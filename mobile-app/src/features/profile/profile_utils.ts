export function resolveProfileUserName(
  profileData?: any,
  sessionUser?: any
): string {
  const profileName = profileData?.full_name?.trim();
  if (profileName) return profileName;

  const metaFirst = sessionUser?.user_metadata?.first_name?.trim();
  const metaLast = sessionUser?.user_metadata?.last_name?.trim();
  if (metaFirst && metaLast) return `${metaFirst} ${metaLast}`;
  if (metaFirst) return metaFirst;

  const metaFull = sessionUser?.user_metadata?.full_name?.trim();
  if (metaFull) return metaFull;

  const email = sessionUser?.email?.trim();
  if (email) return email.split('@')[0];

  return '';
}

export function resolveGreeting(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) {
    return 'Вітаємо! 👋';
  }
  const firstName = fullName.trim().split(/\s+/)[0];
  return `Вітаємо, ${firstName}! 👋`;
}

export function formatProfilePhone(phone?: string | null): string {
  if (!phone || !phone.trim()) {
    return 'Номер не вказано';
  }
  return phone.trim();
}

export function resolvePaymentSubtitle(userMethods?: any[]): string {
  if (Array.isArray(userMethods) && userMethods.length > 0) {
    const labels = userMethods.map((m: any) =>
      m.type === 'apple_pay' ? 'Apple Pay' : `*${m.last4 || 'картка'}`
    );
    return labels.join(', ');
  }
  return 'Apple Pay';
}

export function formatBonusPoints(points?: number | null): string {
  const value = Number(points || 0);
  return value.toLocaleString('uk-UA');
}
