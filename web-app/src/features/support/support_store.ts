import { supabase } from '@/lib/supabase';
import type {
  SupportTicket,
  SupportMessage,
  CreateTicketInput,
  SupportCategory,
} from './support_types';

const STORAGE_PREFIX = 'styling_tooth_support_tickets_';

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getAdminInitialReply(category: SupportCategory, subject: string): string {
  switch (category) {
    case 'booking':
      return `Вітаю! Мене звати Сергій, старший адміністратор. Отримав ваше звернення щодо запису: "${subject}". Вже відкриваю ваш графік.`;
    case 'services':
      return `Вітаю! Мене звати Сергій, старший адміністратор. Підкажу всі деталі щодо послуг салону та процедур для вашого улюбленця.`;
    case 'payment':
      return `Вітаю! Мене звати Сергій. Перевіряю інформацію щодо оплати або бонусного балансу за темою: "${subject}".`;
    case 'transfer':
      return `Вітаю! Мене звати Сергій. Наш координатор Pet-трансферу вже переглядає деталі маршруту.`;
    default:
      return `Вітаю! Мене звати Сергій, старший адміністратор салону. Ознайомився з вашим зверненням: "${subject}". Чим можу допомогти прямо зараз?`;
  }
}

function getAdminFollowUpReply(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('перенести') || lower.includes('перенес')) {
    return 'Я перевірив доступний розклад майстрів. На який день або час вам буде зручніше перенести візит?';
  }
  if (lower.includes('спа') || lower.includes('маск')) {
    return 'Спа-маска з натуральними екстрактами відмінно зволожує шкіру та надає блиску шерсті. Бажаєте додати її до процедури?';
  }
  if (lower.includes('косметик') || lower.includes('шампун')) {
    return 'Ми використовуємо виключно сертифіковану гіпоалергенну косметику преміум-класу (Davis, Hydra, Iv San Bernard).';
  }
  if (lower.includes('скасуван') || lower.includes('відмін')) {
    return 'Скасування або перенесення візиту здійснюється безкоштовно за 2 години до призначеного часу.';
  }
  return 'Дякую за уточнення! Я зафіксував інформацію та вже допомагаю вирішити це питання.';
}

export async function getTickets(userId?: string): Promise<SupportTicket[]> {
  let activeUserId = userId;

  if (!activeUserId) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      activeUserId = sessionData?.session?.user?.id;
    } catch {
      activeUserId = undefined;
    }
  }

  const cacheKey = `${STORAGE_PREFIX}${activeUserId || 'guest'}`;
  let cached: SupportTicket[] = [];

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(cacheKey);
      if (raw) {
        cached = JSON.parse(raw);
      }
    } catch {}
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    const serverTickets = userData?.user?.user_metadata?.support_tickets;
    if (Array.isArray(serverTickets)) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(cacheKey, JSON.stringify(serverTickets));
      }
      return serverTickets;
    }
  } catch {}

  return cached;
}

export async function getTicketById(
  ticketId: string,
  userId?: string
): Promise<SupportTicket | null> {
  const tickets = await getTickets(userId);
  return tickets.find((t) => t.id === ticketId) || null;
}

export async function createTicket(
  input: CreateTicketInput,
  userId?: string
): Promise<SupportTicket> {
  let activeUserId = userId;

  if (!activeUserId) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      activeUserId = sessionData?.session?.user?.id;
    } catch {
      activeUserId = undefined;
    }
  }

  const cacheKey = `${STORAGE_PREFIX}${activeUserId || 'guest'}`;
  const existingTickets = await getTickets(activeUserId);

  const nextNumber =
    existingTickets.reduce(
      (max, t) => Math.max(max, Number(t.ticketNumber) || 0),
      4828
    ) + 1;

  const nowTime = Date.now();
  const ticketId = generateId('ticket');
  const userMsgId = generateId('msg');
  const adminMsgId = generateId('msg');

  const userMessage: SupportMessage = {
    id: userMsgId,
    ticketId,
    senderRole: 'user',
    senderName: 'Клієнт',
    text: input.description.trim(),
    attachmentUrl: input.attachmentUrl || undefined,
    createdAt: new Date(nowTime).toISOString(),
  };

  const adminMessage: SupportMessage = {
    id: adminMsgId,
    ticketId,
    senderRole: 'admin',
    senderName: 'Сергій',
    senderAvatarUrl: '/assets/images/expert_advice_logo.png',
    text: getAdminInitialReply(input.category, input.subject),
    createdAt: new Date(nowTime + 10).toISOString(),
  };

  const newTicket: SupportTicket = {
    id: ticketId,
    ticketNumber: nextNumber,
    subject: input.subject.trim(),
    category: input.category,
    status: 'in_progress',
    urgency: input.urgency,
    petId: input.petId || null,
    petName: input.petName || null,
    petBreed: input.petBreed || null,
    petAvatarUrl: input.petAvatarUrl || null,
    appointmentId: input.appointmentId || null,
    appointmentDateFormatted: input.appointmentDateFormatted || null,
    appointmentServices: input.appointmentServices || null,
    appointmentPrice: input.appointmentPrice ?? null,
    description: input.description.trim(),
    attachmentName: input.attachmentName || null,
    createdAt: new Date(nowTime).toISOString(),
    messages: [userMessage, adminMessage],
  };

  const updatedTickets = [newTicket, ...existingTickets];

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(cacheKey, JSON.stringify(updatedTickets));
    } catch {}
  }

  try {
    await supabase.auth.updateUser({
      data: { support_tickets: updatedTickets },
    });
  } catch {}

  return newTicket;
}

export async function sendMessage(
  ticketId: string,
  text: string,
  userId?: string,
  attachment?: { name?: string; url?: string } | string
): Promise<SupportMessage> {
  let activeUserId = userId;

  if (!activeUserId) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      activeUserId = sessionData?.session?.user?.id;
    } catch {
      activeUserId = undefined;
    }
  }

  const cacheKey = `${STORAGE_PREFIX}${activeUserId || 'guest'}`;
  const tickets = await getTickets(activeUserId);
  const ticketIndex = tickets.findIndex((t) => t.id === ticketId);

  if (ticketIndex === -1) {
    throw new Error(`Ticket with id ${ticketId} not found`);
  }

  const targetTicket = { ...tickets[ticketIndex] };
  const lastMsg = targetTicket.messages[targetTicket.messages.length - 1];
  const lastTime = lastMsg ? new Date(lastMsg.createdAt).getTime() : 0;
  const userTime = Math.max(Date.now(), lastTime + 10);
  const userMsgId = generateId('msg');
  const resolvedAttachmentUrl =
    typeof attachment === 'string' ? attachment : attachment?.url;

  const userMessage: SupportMessage = {
    id: userMsgId,
    ticketId,
    senderRole: 'user',
    senderName: 'Клієнт',
    text: text.trim(),
    attachmentUrl: resolvedAttachmentUrl,
    createdAt: new Date(userTime).toISOString(),
  };

  const adminMsgId = generateId('msg');
  const adminMessage: SupportMessage = {
    id: adminMsgId,
    ticketId,
    senderRole: 'admin',
    senderName: 'Сергій',
    senderAvatarUrl: '/assets/images/expert_advice_logo.png',
    text: getAdminFollowUpReply(text),
    createdAt: new Date(userTime + 10).toISOString(),
  };

  targetTicket.messages = [...targetTicket.messages, userMessage, adminMessage];
  const updatedTickets = [...tickets];
  updatedTickets[ticketIndex] = targetTicket;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(cacheKey, JSON.stringify(updatedTickets));
    } catch {}
  }

  try {
    await supabase.auth.updateUser({
      data: { support_tickets: updatedTickets },
    });
  } catch {}

  return userMessage;
}

export function clearTicketsCache(userId?: string): void {
  const cacheKey = `${STORAGE_PREFIX}${userId || 'guest'}`;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(cacheKey);
  }
}
