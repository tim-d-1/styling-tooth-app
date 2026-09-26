import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

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
  console.error("Error: Supabase environment variables missing");
  process.exit(1);
}

const modulePath = path.resolve(
  process.cwd(),
  "web-app/node_modules/@supabase/supabase-js/dist/index.mjs"
);
const { createClient } = await import(pathToFileURL(modulePath).href);

test("1. Seed Catalog: Service Categories & Services (Public Access)", async () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: categories, error: catErr } = await supabase
    .from("service_categories")
    .select("id, name, slug")
    .order("sort_order", { ascending: true });

  assert.equal(catErr, null, `Category error: ${catErr?.message}`);
  assert.ok(categories.length >= 3, "At least 3 service categories must exist");
  const slugs = categories.map((c) => c.slug);
  assert.ok(slugs.includes("grooming"), "Catalog must include grooming category");
  assert.ok(slugs.includes("spa"), "Catalog must include spa category");
  assert.ok(slugs.includes("hygiene"), "Catalog must include hygiene category");

  const { data: services, error: srvErr } = await supabase
    .from("services")
    .select("id, name, price, duration_min, is_active")
    .eq("is_active", true);

  assert.equal(srvErr, null, `Service error: ${srvErr?.message}`);
  assert.ok(services.length >= 4, "At least 4 active services must exist");
  for (const s of services) {
    assert.ok(Number(s.price) >= 0, `Service price must be non-negative: ${s.name}`);
    assert.ok(s.duration_min > 0, `Service duration must be positive: ${s.name}`);
  }
});

test("2. Seed Masters: Profiles, Schedules & Services Mapping (Public Access)", async () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: masters, error: mstErr } = await supabase
    .from("masters")
    .select("id, display_name, specialization, is_active")
    .eq("is_active", true);

  assert.equal(mstErr, null, `Master error: ${mstErr?.message}`);
  assert.ok(masters.length >= 2, "At least 2 active masters must exist");

  const masterNames = masters.map((m) => m.display_name);
  assert.ok(masterNames.includes("Олена Ковальчук"), "Master Олена Ковальчук must exist");
  assert.ok(masterNames.includes("Михайло Шевченко"), "Master Михайло Шевченко must exist");

  const { data: masterServices, error: msErr } = await supabase
    .from("master_services")
    .select("master_id, service_id");

  assert.equal(msErr, null, `Master services error: ${msErr?.message}`);
  assert.ok(masterServices.length >= 8, "Masters must have mapped services");
});

test("3. Client Auth & RLS Scope: Customer Views Own Pets & Appointments", async () => {
  const clientSupabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authErr } = await clientSupabase.auth.signInWithPassword({
    email: "kateryna.kovalchuk@example.com",
    password: "TestPass2026!",
  });

  assert.equal(authErr, null, `Client auth failed: ${authErr?.message}`);
  assert.ok(authData?.session, "Client must receive valid session");

  const { data: clientPets, error: petErr } = await clientSupabase
    .from("pets")
    .select("id, name, species, breed");

  assert.equal(petErr, null, `Client pets error: ${petErr?.message}`);
  assert.equal(clientPets.length, 1, "Client should only see her own pet");
  assert.equal(clientPets[0].name, "Оскар", "Client pet must be Оскар");

  const { data: clientAppts, error: apptErr } = await clientSupabase
    .from("appointments")
    .select("id, status, pet:pets(name), service:services!appointments_service_id_fkey(name)");

  assert.equal(apptErr, null, `Client appointments error: ${apptErr?.message}`);
  assert.equal(clientAppts.length, 1, "Client should only see her own appointment");
  assert.equal(clientAppts[0].status, "completed", "Client appointment status must be completed");
});

test("4. Admin Auth: Full Database Seed Records & Cross-Table Verification", async () => {
  const adminSupabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authErr } = await adminSupabase.auth.signInWithPassword({
    email: "admin@stylishtoot.com",
    password: "TestPass2026!",
  });

  assert.equal(authErr, null, `Admin auth failed: ${authErr?.message}`);
  assert.ok(authData?.session, "Admin must receive valid session");

  // Pets verification
  const { data: pets, error: petErr } = await adminSupabase
    .from("pets")
    .select("id, name, species, breed, sex, weight_kg, behavior_notes, medical_notes, owner_id")
    .eq("is_active", true);

  assert.equal(petErr, null, `Admin pets error: ${petErr?.message}`);
  assert.ok(pets.length >= 7, `Expected at least 7 pets, found ${pets.length}`);

  const petNames = pets.map((p) => p.name);
  assert.ok(petNames.includes("Барні"), "Pet Барні must exist");
  assert.ok(petNames.includes("Міся"), "Pet Міся must exist");
  assert.ok(petNames.includes("Арчі"), "Pet Арчі must exist");

  const barni = pets.find((p) => p.name === "Барні");
  assert.equal(barni.species, "dog");
  assert.equal(barni.breed, "Голден ретривер");
  assert.ok(barni.behavior_notes, "Барні must have behavior notes");
  assert.ok(barni.medical_notes, "Барні must have medical notes");

  // Appointments verification
  const { data: appointments, error: apptErr } = await adminSupabase
    .from("appointments")
    .select(`
      id,
      starts_at,
      ends_at,
      price,
      status,
      pet:pets(name, species),
      master:masters(display_name),
      service:services!appointments_service_id_fkey(name)
    `)
    .order("starts_at", { ascending: true });

  assert.equal(apptErr, null, `Appointments error: ${apptErr?.message}`);
  assert.ok(appointments.length >= 10, `Expected at least 10 appointments, found ${appointments.length}`);

  const completed = appointments.filter((a) => a.status === "completed");
  const upcoming = appointments.filter(
    (a) => a.status === "confirmed" || a.status === "new"
  );

  assert.ok(completed.length >= 4, "At least 4 completed visits must exist");
  assert.ok(upcoming.length >= 4, "At least 4 upcoming visits must exist");

  for (const appt of appointments) {
    assert.ok(appt.pet, "Appointment must join to a valid pet");
    assert.ok(appt.master, "Appointment must join to a valid master");
    assert.ok(appt.service, "Appointment must join to a valid service");
  }

  // Appointment services verification
  const { data: apptServices, error: asErr } = await adminSupabase
    .from("appointment_services")
    .select("appointment_id, service_id, price, duration_min");

  assert.equal(asErr, null, `Appointment services error: ${asErr?.message}`);
  assert.ok(apptServices.length >= 10, "Appointment service lines must exist");

  // Payments verification
  const { data: payments, error: payErr } = await adminSupabase
    .from("payments")
    .select("id, amount, status, provider, appointment_id");

  assert.equal(payErr, null, `Payments error: ${payErr?.message}`);
  assert.ok(payments.length >= 5, "Payments records must exist");
  const successfulPayments = payments.filter((p) => p.status === "successful");
  assert.ok(successfulPayments.length >= 4, "At least 4 successful payments must exist");

  // Client stats aggregation
  const { data: stats, error: statErr } = await adminSupabase
    .from("client_stats")
    .select("client_id, completed_visits, average_check, lifetime_value");

  assert.equal(statErr, null, `Client stats error: ${statErr?.message}`);
  const clientsWithVisits = stats.filter((s) => s.completed_visits > 0);
  assert.ok(clientsWithVisits.length >= 2, "Multiple clients must have completed visits");
  for (const client of clientsWithVisits) {
    assert.ok(Number(client.average_check) > 0, "Average check must be positive");
    assert.ok(Number(client.lifetime_value) > 0, "Lifetime value must be positive");
  }
});
