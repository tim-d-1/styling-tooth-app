export interface BookingNotificationParams {
  petName: string;
  petBreed?: string | null;
  serviceName: string;
  dateTimeFormatted: string;
  masterName: string;
  price: string | number;
  address?: string;
}

export interface ReminderNotificationParams {
  petName: string;
  serviceName: string;
  dateTimeFormatted: string;
  masterName: string;
  address?: string;
}

export interface PetReadyNotificationParams {
  petName: string;
  serviceName: string;
}

export interface CareScheduleNotificationParams {
  petName: string;
  title: string;
  validUntilFormatted: string;
}

export interface SupportReplyNotificationParams {
  senderName: string;
  ticketNumber: number | string;
  text: string;
}

export function formatBookingConfirmedMessage(params: BookingNotificationParams): string {
  const breedPart = params.petBreed ? ` (${params.petBreed})` : '';
  const address = params.address || 'вул. Велика Васильківська, 42';
  return `Ваш візит успішно заплановано!\n\n🐾 Улюбленець: <b>${params.petName}</b>${breedPart}\n✂️ Послуга: <b>${params.serviceName}</b>\n📅 Дата та час: <b>${params.dateTimeFormatted}</b>\n👤 Майстер: <b>${params.masterName}</b>\n💰 Вартість: <b>${params.price} ₴</b>\n📍 Адреса: <b>${address}</b>\n\nЧекаємо на вас! Керувати записом можна у кабінеті на сайті.`;
}

export function formatReminder24hMessage(params: ReminderNotificationParams): string {
  const address = params.address || 'вул. Велика Васильківська, 42';
  return `Завтра о <b>${params.dateTimeFormatted}</b> чекаємо на <b>${params.petName}</b> на процедуру «${params.serviceName}».\n\n👤 Майстер: <b>${params.masterName}</b>\n📍 Адреса: <b>${address}</b>\n\nБудь ласка, приходьте за 5–10 хвилин до початку. Якщо потрібно перенести або скасувати — скористайтеся кабінетом.`;
}

export function formatReminder2hMessage(params: ReminderNotificationParams): string {
  const masterShort = params.masterName.split(' ')[0];
  return `Нагадуємо: сьогодні о <b>${params.dateTimeFormatted}</b> запис на «${params.serviceName}» для <b>${params.petName}</b>.\n\nМайстер ${masterShort} вже підготував робоче місце та інструменти. Чекаємо на вас! 🛁✂️`;
}

export function formatPetReadyMessage(params: PetReadyNotificationParams): string {
  return `Процедуру «${params.serviceName}» для <b>${params.petName}</b> успішно завершено! 🐱🎀\n\nВаша красуня відпочиває та чекає на зустріч з вами у салоні.\n📸 Фото результату до та після вже завантажені у ваш профіль.`;
}

export function formatCareScheduleMessage(params: CareScheduleNotificationParams): string {
  return `Нагадування про планову обробку для <b>${params.petName}</b>:\n\n💉 Процедура: <b>${params.title}</b>\n📅 Рекомендований термін: <b>${params.validUntilFormatted}</b>\n\nВчасна обробка захищає імунітет та здоров'я вашого улюбленця!`;
}

export function formatSupportReplyMessage(params: SupportReplyNotificationParams): string {
  return `Адміністратор ${params.senderName} відповів у зверненні #${params.ticketNumber}:\n\n<i>«${params.text}»</i>\n\nВідповісти можна у чаті кабінету.`;
}
