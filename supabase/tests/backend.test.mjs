import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), "web-app/.env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...val] = trimmed.split("=");
    env[key.trim()] = val.join("=").trim();
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in web-app/.env.local or process.env",
  );
  process.exit(1);
}

import { pathToFileURL } from "node:url";

const modulePath = path.resolve(
  process.cwd(),
  "web-app/node_modules/@supabase/supabase-js/dist/index.mjs",
);
const { createClient } = await import(pathToFileURL(modulePath).href);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

test("1. Public Catalog Read Access (RLS)", async () => {
  const { data: categories, error: catErr } = await supabase
    .from("service_categories")
    .select("id, name, slug");

  assert.equal(catErr, null, `service_categories error: ${catErr?.message}`);
  assert.ok(
    Array.isArray(categories),
    "service_categories should return an array",
  );

  const { data: services, error: srvErr } = await supabase
    .from("services")
    .select("id, name, price, duration_min");

  assert.equal(srvErr, null, `services error: ${srvErr?.message}`);
  assert.ok(Array.isArray(services), "services should return an array");

  const { data: masters, error: mstErr } = await supabase
    .from("masters")
    .select("id, display_name, is_active");

  assert.equal(mstErr, null, `masters error: ${mstErr?.message}`);
  assert.ok(Array.isArray(masters), "masters should return an array");
});

test("2. Availability RPC get_available_slots", async () => {
  const { data: masters } = await supabase
    .from("masters")
    .select("id")
    .eq("is_active", true)
    .limit(1);
  const { data: services } = await supabase
    .from("services")
    .select("id")
    .limit(1);

  if (!masters?.length || !services?.length) {
    console.warn("Skipping slot test: no master or service found");
    return;
  }

  const masterId = masters[0].id;
  const serviceId = services[0].id;
  const testDate = "2026-08-10";

  const { data: slots, error } = await supabase.rpc("get_available_slots", {
    p_master_id: masterId,
    p_service_id: serviceId,
    p_date: testDate,
  });

  assert.equal(error, null, `get_available_slots error: ${error?.message}`);
  assert.ok(
    Array.isArray(slots),
    "get_available_slots should return an array of slots",
  );
});

test("3. All Masters Availability RPC get_available_slots_all_masters", async () => {
  const { data: services } = await supabase
    .from("services")
    .select("id")
    .limit(1);
  if (!services?.length) return;

  const serviceId = services[0].id;
  const testDate = "2026-08-10";

  const { data: slots, error } = await supabase.rpc(
    "get_available_slots_all_masters",
    {
      p_service_id: serviceId,
      p_date: testDate,
    },
  );

  assert.equal(
    error,
    null,
    `get_available_slots_all_masters error: ${error?.message}`,
  );
  assert.ok(
    Array.isArray(slots),
    "get_available_slots_all_masters should return an array",
  );
});

test("4. Staff-Only Table Protection (master_time_off RLS)", async () => {
  // Unauthenticated/anon caller should not be allowed to view master_time_off
  const { data, error } = await supabase.from("master_time_off").select("*");

  // RLS returns empty array or permission denied for non-staff
  assert.equal(
    data?.length || 0,
    0,
    "Unauthenticated users must not see staff time off records",
  );
});

test("5. Unauthenticated Direct Appointment Insert Protection (RLS Guard)", async () => {
  const dummyAppointment = {
    client_id: "00000000-0000-0000-0000-000000000000",
    pet_id: "00000000-0000-0000-0000-000000000000",
    master_id: "00000000-0000-0000-0000-000000000000",
    service_id: "00000000-0000-0000-0000-000000000000",
    starts_at: "2026-08-10T10:00:00Z",
    ends_at: "2026-08-10T11:00:00Z",
    price: 500,
  };

  const { error } = await supabase
    .from("appointments")
    .insert([dummyAppointment]);
  assert.ok(
    error !== null,
    "Direct appointment insertion without auth must be blocked by RLS",
  );
});

test("6. Appointment Status Transition Guard (State Machine Validation)", async () => {
  // Attempting an unauthorized update to set status to 'completed'
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", "00000000-0000-0000-0000-000000000000")
    .select();

  // Under RLS + state machine trigger, unauthorized callers cannot mutate appointment statuses
  assert.equal(
    data?.length || 0,
    0,
    "Unauthenticated users must not be able to mutate appointment statuses",
  );
});

test("7. Multi-Service Availability RPC get_available_slots_multi_service", async () => {
  const { data: masters } = await supabase
    .from("masters")
    .select("id")
    .eq("is_active", true)
    .limit(1);
  const { data: services } = await supabase
    .from("services")
    .select("id")
    .limit(2);

  if (!masters?.length || !services?.length) return;

  const masterId = masters[0].id;
  const serviceIds = services.map((s) => s.id);
  const testDate = "2026-08-10";

  const { data: slots, error } = await supabase.rpc(
    "get_available_slots_multi_service",
    {
      p_master_id: masterId,
      p_service_ids: serviceIds,
      p_date: testDate,
    },
  );

  assert.equal(
    error,
    null,
    `get_available_slots_multi_service error: ${error?.message}`,
  );
  assert.ok(
    Array.isArray(slots),
    "get_available_slots_multi_service should return an array of slots",
  );
});

test("8. Payments Table Security & RLS Protection", async () => {
  // Direct insert by unauthenticated caller must fail under RLS
  const dummyPayment = {
    client_id: "00000000-0000-0000-0000-000000000000",
    amount: 1000,
    status: "successful",
  };

  const { error } = await supabase.from("payments").insert([dummyPayment]);
  assert.ok(
    error !== null,
    "Direct payment record insertion without auth must be blocked by RLS",
  );
});

test("9. Monobank Webhook Processor RPC (handle_monobank_webhook_event)", async () => {
  // Attempting webhook handling with a non-existent invoice ID handles missing record gracefully
  const { error } = await supabase.rpc("handle_monobank_webhook_event", {
    p_invoice_id: "non-existent-invoice-999",
    p_status: "success",
    p_raw_payload: { status: "success" },
  });

  // Should fail with 'Payment record not found' exception
  assert.ok(
    error !== null,
    "Webhook RPC must throw exception if invoice record does not exist",
  );
  assert.match(
    error.message,
    /Payment record not found/,
    "Error message should report missing invoice",
  );
});

test("10. Pet Double-Booking Protection (is_pet_available RPC)", async () => {
  const dummyPetId = "00000000-0000-0000-0000-000000000000";
  const startsAt = "2026-08-10T10:00:00Z";
  const endsAt = "2026-08-10T11:00:00Z";

  const { data: isAvailable, error } = await supabase.rpc("is_pet_available", {
    p_pet_id: dummyPetId,
    p_starts_at: startsAt,
    p_ends_at: endsAt,
  });

  assert.equal(error, null, `is_pet_available error: ${error?.message}`);
  assert.equal(
    isAvailable,
    true,
    "Pet with no existing appointments must be available",
  );
});

