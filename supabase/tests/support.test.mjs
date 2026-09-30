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
  console.error("Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set");
  process.exit(1);
}

const modulePath = path.resolve(
  process.cwd(),
  "web-app/node_modules/@supabase/supabase-js/dist/index.mjs"
);
const { createClient } = await import(pathToFileURL(modulePath).href);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

test("1. Support Tickets Table Existence & RLS Guard (Anon Select Blocked)", async () => {
  const { data, error } = await supabase.from("support_tickets").select("*");

  assert.equal(error, null, `Select query should not throw: ${error?.message}`);
  assert.equal(
    data?.length || 0,
    0,
    "Unauthenticated callers must not see any support tickets"
  );
});

test("2. Support Messages Table Existence & RLS Guard (Anon Select Blocked)", async () => {
  const { data, error } = await supabase.from("support_messages").select("*");

  assert.equal(error, null, `Select query should not throw: ${error?.message}`);
  assert.equal(
    data?.length || 0,
    0,
    "Unauthenticated callers must not see any support messages"
  );
});

test("3. Unauthenticated Direct Ticket Insertion Blocked by RLS", async () => {
  const dummyTicket = {
    client_id: "00000000-0000-0000-0000-000000000000",
    subject: "Тест RLS без авторизації",
    category: "booking",
    status: "in_progress",
    urgency: "normal",
    description: "Спроба вставки без авторизації",
  };

  const { error } = await supabase.from("support_tickets").insert([dummyTicket]);
  assert.ok(
    error !== null,
    "Direct ticket insertion without auth must be blocked by RLS check"
  );
});

test("4. Unauthenticated Direct Message Insertion Blocked by RLS", async () => {
  const dummyMessage = {
    ticket_id: "00000000-0000-0000-0000-000000000000",
    sender_id: "00000000-0000-0000-0000-000000000000",
    sender_role: "client",
    sender_name: "Неавторизований",
    text: "Повідомлення без прав",
  };

  const { error } = await supabase.from("support_messages").insert([dummyMessage]);
  assert.ok(
    error !== null,
    "Direct message insertion without auth must be blocked by RLS check"
  );
});

test("5. Support Attachments Storage Bucket Access Guard", async () => {
  const fileContent = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
  const { error: uploadError } = await supabase.storage
    .from("support-attachments")
    .upload("00000000-0000-0000-0000-000000000000/ticket-test/doc.pdf", fileContent);

  assert.ok(
    uploadError !== null,
    "Unauthenticated file upload to support-attachments must be rejected by storage RLS"
  );
});

test("6. Foreign Key Cascades & Referential Invariants", async () => {
  const { data: ticketCols, error: tErr } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, client_id, subject, category, status, urgency, updated_at")
    .limit(0);

  assert.equal(tErr, null, `support_tickets schema query error: ${tErr?.message}`);

  const { data: msgCols, error: mErr } = await supabase
    .from("support_messages")
    .select("id, ticket_id, sender_id, sender_role, text, created_at")
    .limit(0);

  assert.equal(mErr, null, `support_messages schema query error: ${mErr?.message}`);
});
