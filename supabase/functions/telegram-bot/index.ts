import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendTelegramMessage(
  token: string,
  chatId: string | number,
  text: string,
  options: Record<string, unknown> = {}
) {
  if (!token) {
    return { ok: true, simulated: true };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    }),
  });

  return await response.json();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();

    if (payload.action === 'send_notification') {
      const { userId, title, message } = payload;
      if (!userId || !message) {
        return new Response(JSON.stringify({ error: 'Missing userId or message' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_chat_id, full_name')
        .eq('id', userId)
        .maybeSingle();

      const text = `<b>${title || 'Стильний Зубець'}</b>\n\n${message}`;

      let tgResult = null;
      let status = 'failed';
      if (profile?.telegram_chat_id) {
        tgResult = await sendTelegramMessage(botToken, profile.telegram_chat_id, text);
        status = tgResult.ok ? 'sent' : 'failed';
      }

      await supabase.from('user_notifications').insert({
        user_id: userId,
        channel: 'telegram',
        title: title || 'Сповіщення',
        message,
        status,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      });

      return new Response(
        JSON.stringify({
          success: status === 'sent',
          simulated: !botToken,
          hasChatId: Boolean(profile?.telegram_chat_id),
          tgResult,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (payload.action === 'send_code') {
      const { userId, code, target } = payload;
      if (!code || !target) {
        return new Response(JSON.stringify({ error: 'Missing code or target' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let chatId = target;
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('telegram_chat_id')
          .eq('id', userId)
          .maybeSingle();
        if (profile?.telegram_chat_id) {
          chatId = profile.telegram_chat_id;
        }
      }

      const text = `🔐 Ваш код підтвердження «Стильний Зубець»: <b>${code}</b>\n\nДійсний протягом 15 хвилин. Нікому не передавайте його.`;
      const tgResult = await sendTelegramMessage(botToken, chatId, text);

      return new Response(JSON.stringify({ success: true, tgResult }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payload.message) {
      const msg = payload.message;
      const chatId = msg.chat?.id;
      const text = (msg.text || '').trim();
      const username = msg.from?.username || null;

      if (!chatId) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (msg.contact?.phone_number) {
        const phone = msg.contact.phone_number;
        const { data: linkRes } = await supabase.rpc('confirm_phone_via_telegram', {
          p_phone: phone,
          p_chat_id: String(chatId),
          p_username: username,
        });

        if (linkRes?.linked) {
          await sendTelegramMessage(
            botToken,
            chatId,
            '✅ <b>Номер телефону успішно підтверджено!</b>\n\nВаш акаунт «Стильний Зубець» звʼязано. Тепер ви отримуватимете всі нагадування про візити та важливі оновлення тут.'
          );
        } else {
          await sendTelegramMessage(
            botToken,
            chatId,
            `📱 Номер <b>${phone}</b> збережено!\n\nЯкщо ви ще не зареєстровані, створіть акаунт на сайті з цим номером для синхронізації.`
          );
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const startToken = parts.length > 1 ? parts[1].trim() : null;

        if (startToken) {
          const { data: linkRes, error: linkErr } = await supabase.rpc('link_telegram_chat', {
            p_token: startToken,
            p_chat_id: String(chatId),
            p_username: username,
          });

          if (!linkErr && linkRes?.success) {
            await sendTelegramMessage(
              botToken,
              chatId,
              '🎉 <b>Вітаємо! Telegram успішно підключено</b> до вашого акаунту «Стильний Зубець».\n\nТепер ви будете оперативно отримувати:\n• Нагадування про візити за 24 і 2 години\n• Повідомлення про готовність вашого улюбленця\n• Відповіді служби турботи та підтримки'
            );
            return new Response(JSON.stringify({ ok: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        await sendTelegramMessage(
          botToken,
          chatId,
          '👋 <b>Вітаємо у грумінг-салоні «Стильний Зубець»!</b> 🐶🐱\n\nЯ допоможу вам не пропустити запис на стрижку чи СПА, надішлю фото до/після та оперативно сповіщу про статус візиту.\n\nНатисніть кнопку нижче, щоб швидко підтвердити свій номер телефону:',
          {
            reply_markup: {
              keyboard: [
                [
                  {
                    text: '📱 Підтвердити номер телефону',
                    request_contact: true,
                  },
                ],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (text === '/status' || text === '/visits') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('telegram_chat_id', String(chatId))
          .maybeSingle();

        if (!profile) {
          await sendTelegramMessage(
            botToken,
            chatId,
            'Акаунт не знайдено. Будь ласка, поділіться контактом або привʼяжіть Telegram у кабінеті.'
          );
        } else {
          const { data: appointments } = await supabase
            .from('appointments')
            .select('starts_at, status, price, pets(name), services(name)')
            .eq('client_id', profile.id)
            .gte('starts_at', new Date().toISOString())
            .order('starts_at', { ascending: true })
            .limit(3);

          if (!appointments || appointments.length === 0) {
            await sendTelegramMessage(
              botToken,
              chatId,
              `✨ <b>${profile.full_name}</b>, у вас немає запланованих візитів на найближчий час.\n\nЗаписатися завжди можна на нашому сайті.`
            );
          } else {
            const list = appointments
              .map((apt: any) => {
                const date = new Date(apt.starts_at).toLocaleString('uk-UA', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return `📅 <b>${date}</b>\n🐾 Улюбленець: ${apt.pets?.name || '—'}\n✂️ Послуга: ${apt.services?.name || '—'}\n💰 Вартість: ${apt.price} ₴`;
              })
              .join('\n\n');

            await sendTelegramMessage(
              botToken,
              chatId,
              `📋 <b>Ваші найближчі візити:</b>\n\n${list}`
            );
          }
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (text === '/help') {
        await sendTelegramMessage(
          botToken,
          chatId,
          'ℹ️ <b>Команди бота «Стильний Зубець»:</b>\n\n/status — переглянути активні записи на грумінг\n/start — підключення акаунту та головне меню\n/help — довідка з використання'
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
