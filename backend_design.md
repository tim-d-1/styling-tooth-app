# Стильний Зубець - Backend Design (Core: Booking + Pets)

**Stack:** Supabase - PostgreSQL, Auth, Edge Functions, Storage (S3‑compatible), Realtime.
**Scope of this pass:** users/roles, pets, service catalog, masters + schedules, appointments with statuses, availability & overbooking logic, before/after media. Store, loyalty, CRM realtime, Monobank and FCM are outlined at the end as the next passes.

Everything here is implemented in the seven migration files `0001`–`0007`. This doc explains the *why* and the flows.

---

## 1. Architecture overview

Supabase is the single backend (BaaS). Clients (Flutter mobile, React web, React CRM) talk to it three ways:

- **PostgREST** - auto REST/RPC over the tables and functions. Row Level Security (RLS) is the authorization layer, so the same policies protect mobile, web and CRM identically.
- **Auth (GoTrue)** - email/phone + JWT. Every request carries `auth.uid()`; a trigger mirrors each new auth user into `public.profiles`.
- **Storage** - private `pet-media` bucket for the до/після gallery, guarded by storage policies that mirror the pets ownership rules.

Write-heavy or multi-step actions (booking, later Monobank/FCM) go through **`SECURITY DEFINER` RPC functions** or **Edge Functions** so validation and secrets stay server-side. The client never writes an appointment row blindly - it calls `create_appointment()`.

Three trust tiers drive all authorization:

| Role | Who | Can see / do |
|------|-----|--------------|
| `client` | pet owner | own profile, own pets + media, own appointments; book/cancel |
| `master` | groomer | own assigned appointments; read catalog |
| `receptionist` / `admin` | desk / owner | everything; `admin` also edits catalog, roles, time-off |

---

## 2. Data model (ERD)

```
auth.users ──1:1──> profiles
                      │  (role: client | master | receptionist | admin)
                      ├──1:N──> pets ──1:N──> pet_media ──?──> appointments
                      │                                          ▲
                      └──1:N──> appointments (client_id) ────────┤
                                                                 │
service_categories ──1:N──> services ──1:N───────────────────────┤
                              │                                   │
                              └──N:M── master_services ──N:1── masters ──1:1── profiles
                                                                 │
                              masters ──1:N──> master_schedules  │ (weekly hours)
                              masters ──1:N──> master_time_off    (blocks)
                              masters ──1:N──> appointments (master_id)
```

**Tables (11):** `profiles`, `pets`, `pet_media`, `service_categories`, `services`, `masters`, `master_services`, `master_schedules`, `master_time_off`, `appointments`, plus the `client_stats` view.

### Table notes

- **profiles** - 1:1 with `auth.users` (`id` is both PK and FK). Holds role and the CRM fields the ТЗ asks for on the client card (`discount_pct`, `admin_note`). Average check / lifetime value are *derived*, not stored (see `client_stats`).
- **pets** - the clinical + aesthetic card: `breed` (drives the web gallery breed filter), `behavior_notes` (деталі поведінки), `medical_notes` (медичні застереження). `owner_id` cascades on profile delete.
- **pet_media** - one row per photo; the file itself lives in Storage, the row keeps `storage_path`, `photo_type` (`before`/`after`/`general`) and an optional `appointment_id` so a before/after pair can be tied to the exact visit.
- **services** - `price` and `duration_min`. Duration is the backbone of slot generation.
- **masters** - a groomer is a `profile` (via `profile_id`) *plus* scheduling/display data. `calendar_color` feeds the CRM Visual Timetable columns.
- **master_services** - N:M of who does what, with optional `price_override` / `duration_override` per master.
- **master_schedules** - recurring weekly hours (`weekday` 0–6 = `EXTRACT(dow)`). **master_time_off** - one-off unavailability (vacation, lunch, sick).
- **appointments** - the visit. `price` is captured at booking (so later catalog price changes don't rewrite history). `status` is the 6-state enum from the ТЗ.

---

## 3. Booking & availability logic

This is the core of the module and the ТЗ's "перевірка доступності в PostgreSQL".

**Slot length = service duration** (or the master's override). Availability of a window `[start, end)` requires four things, all in `is_master_available()`:

1. master exists and is active,
2. the window fits entirely inside a working block for that weekday (`master_schedules`),
3. it does not overlap any `master_time_off`,
4. it does not overlap any non-cancelled appointment for that master.

`get_available_slots(master, service, date)` returns the bookable start times for a day by stepping through each working block and keeping only windows that pass the check - this is what the step-by-step booking widget calls to render free slots.

**Booking is atomic via `create_appointment()`** (`SECURITY DEFINER` RPC): it verifies the pet belongs to the caller (or caller is staff), resolves price + duration, computes `ends_at`, re-checks availability, and inserts.

### Overbooking: defense in depth

The ТЗ asks for SQL-trigger-level overbooking detection. Rather than a trigger that can race, the schema uses a **Postgres `EXCLUDE` constraint** (GiST, via `btree_gist`):

```sql
constraint appointments_no_overlap exclude using gist (
  master_id with =,
  tstzrange(starts_at, ends_at) with &&
) where (status <> 'cancelled');

constraint appointments_pet_no_overlap exclude using gist (
  pet_id with =,
  tstzrange(starts_at, ends_at) with &&
) where (status <> 'cancelled');
```

Two overlapping active visits for the same master or the same pet are **physically impossible to commit**, even under concurrent bookings from mobile + web + CRM at once. `is_master_available()` and `is_pet_available()` give friendly validation messages; the constraints are the database guarantee. Cancelled visits are excluded so freed slots reopen.

---

## 4. Authorization (RLS)

RLS is enabled on all ten tables. Policies use three `SECURITY DEFINER` helpers - `is_admin()`, `is_staff()`, `current_master_id()` - which read `profiles`/`masters` without tripping those tables' own RLS (no recursion).

- **profiles** - read own or (staff reads all); update own; admin does anything. A `guard_role_change()` trigger blocks non-admins from escalating their own `role`.
- **pets / pet_media** - owner or staff for read/write; delete by owner or admin.
- **catalog** (`service_categories`, `services`, `masters`, `master_services`, `master_schedules`) - **public read** (landing page and booking need it), admin-only write. `master_time_off` is staff-read / admin-write (internal).
- **appointments** - read if you're the client, the assigned master, or staff; insert for own/staff; update for own (client can cancel) or staff; delete admin-only.

Because authz lives in the database, the Flutter app, the React site and the CRM all get the same rules for free.

---

## 5. Storage - pet-media bucket

Private bucket, images only, 10 MB cap. Object path convention: **`{pet_id}/{uuid}.{ext}`** - the first folder segment is the pet id, which the storage policies use (`storage.foldername(name)[1]`) to grant access to that pet's owner and to staff, mirroring the `pets` rules exactly. Clients read via short-lived signed URLs.

---

## 6. Migration files

| File | Contents |
|------|----------|
| `0001_extensions_and_enums.sql` | `pgcrypto`, `btree_gist`; enums (role, status, species, sex, photo type, source) |
| `0002_core_tables.sql` | all tables, indexes, the overbooking EXCLUDE constraint for masters |
| `0003_functions.sql` | role helpers, `resolve_service`, `is_master_available`, `get_available_slots`, `create_appointment`, `client_stats` view |
| `0004_triggers.sql` | `updated_at`, role guard, new-user → profile |
| `0005_rls.sql` | enable RLS + all policies |
| `0006_storage.sql` | `pet-media` bucket + storage policies |
| `0007_seed.sql` | optional sample catalog (dev only) |
| `0008_all_masters_slots.sql` | `get_available_slots_all_masters` RPC |
| `0009_appointment_state_machine.sql` | status transition validation trigger |
| `0010_multi_service_booking.sql` | `appointment_services` table and multi-service RPCs |
| `0011_payments_and_monobank.sql` | `payments` table and monobank webhook RPC |
| `0012_secure_client_stats.sql` | secure `client_stats` security definer view/function |
| `0013_pet_double_booking_guard.sql` | pet exclusion constraint `appointments_pet_no_overlap` and `is_pet_available` |

**Apply order matters** (0001 → 0013). With the Supabase CLI, drop these in `supabase/migrations/` and `supabase db push`; or paste each into the SQL editor in order. The `handle_new_user` trigger on `auth.users` needs to run as the migration/`postgres` role (it does in Supabase).

---

## 7. Next passes (out of scope here, but the model leaves room)

- **E-commerce:** `product_categories`, `products`, `carts`/`cart_items`, `orders`/`order_items`. Reuses `profiles`.
- **Payments (Monobank):** `payments` table + Edge Function that creates a Monobank invoice and a **webhook** Edge Function that flips `payment.status` and confirms the appointment/order. `appointments.payment_id` is already reserved for this FK.
- **Loyalty:** `loyalty_accounts`, `loyalty_transactions`, tiers; feeds `discount_pct`. `client_stats` already computes average check / LTV to drive tiering.
- **CRM realtime:** enable Supabase Realtime on `appointments` for the Incoming Queue; a `notifications` table + Edge Function to send **FCM** push on confirm. Statuses and the overbooking guard are already in place for the Visual Timetable + drag-and-drop.

## 8. Open questions before building further

1. Booking granularity - fixed service-duration slots (current) or a fixed grid (e.g. every 30 min)?
2. Can one visit include **multiple services** (and so variable duration)? If yes, appointments needs a line-items child table.
3. Cancellation window / no-show handling - any rules to enforce server-side?
4. Do clients self-register, or does reception create them? (affects whether `client` can insert appointments directly vs RPC-only.)
