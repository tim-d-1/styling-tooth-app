export function isEmailIdentifier(identifier: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(identifier.trim());
}

export function isPhoneIdentifier(identifier: string): boolean {
  return normalizePhoneNumber(identifier) !== null;
}

export function normalizePhoneNumber(identifier: string): string | null {
  const cleaned = identifier.trim().replace(/[\s\-()]/g, '');
  if (/^0\d{9}$/.test(cleaned)) {
    return `+38${cleaned}`;
  }
  if (/^380\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  if (/^\+380\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

export function validateLoginForm(
  username: string,
  identifier: string,
  password: string
): { isValid: boolean; error: string | null } {
  if (username.trim().length > 0 && username.trim().length < 3) {
    return {
      isValid: false,
      error: 'Ім’я користувача повинно містити не менше 3 символів',
    };
  }
  const trimmedId = identifier.trim();
  if (!trimmedId) {
    return { isValid: false, error: 'Введіть Email або номер телефону' };
  }
  if (!password.trim()) {
    return { isValid: false, error: 'Введіть пароль' };
  }
  if (password.length < 6) {
    return {
      isValid: false,
      error: 'Пароль повинен містити не менше 6 символів',
    };
  }
  if (!isEmailIdentifier(trimmedId) && !normalizePhoneNumber(trimmedId)) {
    return {
      isValid: false,
      error: 'Введіть коректний Email або номер телефону',
    };
  }
  return { isValid: true, error: null };
}

