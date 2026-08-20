export function validateLoginForm(username: string, identifier: string, password: string): { isValid: boolean; error: string | null } {
  if (username.trim().length > 0 && username.trim().length < 3) {
    return { isValid: false, error: 'Ім’я користувача повинно містити не менше 3 символів' };
  }
  if (!identifier.trim()) {
    return { isValid: false, error: 'Введіть Email або номер телефону' };
  }
  if (!password.trim()) {
    return { isValid: false, error: 'Введіть пароль' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Пароль повинен містити не менше 6 символів' };
  }
  return { isValid: true, error: null };
}

export function isEmailIdentifier(identifier: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(identifier.trim());
}
