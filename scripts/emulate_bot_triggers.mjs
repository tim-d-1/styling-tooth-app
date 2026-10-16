import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), 'web-app/.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...val] = trimmed.split('=');
    env[key.trim()] = val.join('=').trim();
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration in web-app/.env.local');
  process.exit(1);
}

const modulePath = path.resolve(
  process.cwd(),
  'web-app/node_modules/@supabase/supabase-js/dist/index.mjs'
);
const { createClient } = await import(pathToFileURL(modulePath).href);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const args = process.argv.slice(2);
function getArg(flag, defaultValue = null) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }
  return defaultValue;
}

const targetUserId = getArg('--userId', 'b7b2777f-0414-4e4d-adda-1c6d2bf548f3');
const requestedTrigger = getArg('--trigger', 'all');

async function main() {
  console.log(`\n======================================================`);
  console.log(`🤖 Емулятор тригерів бот-сповіщень «Стильний Зубець»`);
  console.log(`======================================================`);
  console.log(`Користувач ID: ${targetUserId}`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, telegram_chat_id, telegram_username')
    .eq('id', targetUserId)
    .maybeSingle();

  if (profile) {
    console.log(`Ім'я: ${profile.full_name || 'Не вказано'}`);
    console.log(`Telegram Chat ID: ${profile.telegram_chat_id || 'НЕ ПІДКЛЮЧЕНО'}`);
    console.log(`Telegram Username: @${profile.telegram_username || 'Невідомо'}`);
  } else {
    console.log(`Профіль доступний на стороні Edge Function через service role.`);
  }

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      starts_at,
      status,
      price,
      pets(name, breed),
      services(name),
      masters(display_name)
    `)
    .eq('client_id', targetUserId)
    .order('starts_at', { ascending: false });

  const latestAppt = appointments?.[0];
  const petName = latestAppt?.pets?.name || 'Міся';
  const petBreed = latestAppt?.pets?.breed || 'Шотландська висловуха';
  const serviceName = latestAppt?.services?.name || 'Експрес-грумінг';
  const masterName = latestAppt?.masters?.display_name || 'Михайло Шевченко';
  const price = latestAppt?.price || '850';

  const { data: schedules } = await supabase
    .from('pet_care_schedules')
    .select('*')
    .order('sort_order', { ascending: true })
    .limit(1);

  const careItem = schedules?.[0];
  const careTitle = careItem?.title || 'Вакцинація проти сказу (Nobivac Rabies)';
  const careDate = careItem?.valid_until_formatted || 'до 10 жовтня 2026';

  const triggers = [
    {
      id: 'booking_confirmed',
      name: '1. Підтвердження запису',
      title: '🐾 «Стильний Зубець» • Запис підтверджено',
      message: `Ваш візит успішно заплановано!\n\n🐾 Улюбленець: <b>${petName}</b> (${petBreed})\n✂️ Послуга: <b>${serviceName}</b>\n📅 Дата та час: <b>Середа, 7 жовтня, 12:00</b>\n👤 Майстер: <b>${masterName}</b>\n💰 Вартість: <b>${price} ₴</b>\n📍 Адреса: <b>вул. Велика Васильківська, 42</b>\n\nЧекаємо на вас! Керувати записом можна у кабінеті на сайті.`,
    },
    {
      id: 'reminder_24h',
      name: '2. Нагадування за 24 години до візиту',
      title: '⏰ «Стильний Зубець» • Нагадування про візит',
      message: `Завтра о <b>12:00</b> чекаємо на <b>${petName}</b> на процедуру «${serviceName}».\n\n👤 Майстер: <b>${masterName}</b>\n📍 Адреса: <b>вул. Велика Васильківська, 42</b>\n\nБудь ласка, приходьте за 5–10 хвилин до початку. Якщо потрібно перенести або скасувати — скористайтеся кабінетом.`,
    },
    {
      id: 'reminder_2h',
      name: '3. Термінове нагадування за 2 години',
      title: '🚗 «Стильний Зубець» • Візит через 2 години',
      message: `Нагадуємо: сьогодні о <b>12:00</b> запис на «${serviceName}» для <b>${petName}</b>.\n\nМайстер ${masterName.split(' ')[0]} вже підготував робоче місце та інструменти. Чекаємо на вас! 🛁✂️`,
    },
    {
      id: 'pet_ready',
      name: '4. Улюбленець готовий (завершення процедури)',
      title: '✨ «Стильний Зубець» • Улюбленець готовий!',
      message: `Процедуру «${serviceName}» для <b>${petName}</b> успішно завершено! 🐱🎀\n\nВаша красуня відпочиває та чекає на зустріч з вами у салоні.\n📸 Фото результату до та після вже завантажені у ваш профіль.`,
    },
    {
      id: 'care_schedule_due',
      name: '5. Графік обробок (планова вакцинація)',
      title: '💊 «Стильний Зубець» • Графік обробок',
      message: `Нагадування про планову вакцинацію для <b>${petName}</b>:\n\n💉 Процедура: <b>${careTitle}</b>\n📅 Рекомендований термін: <b>${careDate}</b>\n\nВчасна вакцинація захищає імунітет та здоров'я вашого улюбленця!`,
    },
    {
      id: 'support_reply',
      name: '6. Відповідь служби підтримки',
      title: '💬 «Стильний Зубець» • Відповідь служби турботи',
      message: `Адміністратор Анастасія відповіла у зверненні #1042:\n\n<i>«Доброго дня! Ми зафіксували всі побажання щодо Місі та підготували гіпоалергенну лінійку з екстрактом вівса. Чекаємо на вас!»</i>\n\nВідповісти можна у чаті кабінету.`,
    },
  ];

  const triggersToRun =
    requestedTrigger === 'all'
      ? triggers
      : triggers.filter((t) => t.id === requestedTrigger);

  if (triggersToRun.length === 0) {
    console.error(`Невідомий тригер: "${requestedTrigger}". Доступні тригери: all, ${triggers.map(t => t.id).join(', ')}`);
    process.exit(1);
  }

  console.log(`\nЗапуск емуляції (${triggersToRun.length} тригерів)...\n`);

  for (const trg of triggersToRun) {
    console.log(`--------------------------------------------------`);
    console.log(`▶️ Запуск тригера: ${trg.name}`);

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/telegram-bot`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_notification',
          userId: targetUserId,
          title: trg.title,
          message: trg.message,
        }),
      });

      const resJson = await response.json();

      if (resJson.success) {
        const msgId = resJson.tgResult?.result?.message_id || 'simulated';
        console.log(`✅ Успішно надіслано в Telegram! Message ID: ${msgId}`);
      } else {
        console.warn(`⚠️ Результат обробки: success=${resJson.success}`, resJson);
      }
    } catch (err) {
      console.error(`❌ Помилка надсилання:`, err.message);
    }

    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`\n======================================================`);
  console.log(`🏁 Емуляцію завершено!`);
  console.log(`Перевірте Telegram чат @styling_tooth_bot або таблицю public.user_notifications.`);
  console.log(`======================================================\n`);
}

main().catch(console.error);
