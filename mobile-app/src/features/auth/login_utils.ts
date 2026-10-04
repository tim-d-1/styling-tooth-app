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

export function phoneToAuthEmail(normalizedPhone: string): string {
  const digits = normalizedPhone.replace(/\D/g, '');
  return `${digits}@phone.stylingtooth.app`;
}

export function validateLoginForm(
  identifier: string,
  password: string
): { isValid: boolean; error: string | null } {
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

export interface OAuthRedirectParams {
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
}

export function parseOAuthRedirectUrl(url: string): OAuthRedirectParams {
  const result: OAuthRedirectParams = {
    code: null,
    accessToken: null,
    refreshToken: null,
    error: null,
  };

  try {
    const queryIndex = url.indexOf('?');
    const hashIndex = url.indexOf('#');

    if (queryIndex !== -1) {
      const queryString =
        hashIndex !== -1 && hashIndex > queryIndex
          ? url.substring(queryIndex + 1, hashIndex)
          : url.substring(queryIndex + 1);
      const searchParams = new URLSearchParams(queryString);
      result.code = searchParams.get('code');
      result.error =
        searchParams.get('error_description') || searchParams.get('error');
    }

    if (hashIndex !== -1) {
      const hashString = url.substring(hashIndex + 1);
      const hashParams = new URLSearchParams(hashString);
      result.accessToken = hashParams.get('access_token');
      result.refreshToken = hashParams.get('refresh_token');
      if (!result.error) {
        result.error =
          hashParams.get('error_description') || hashParams.get('error');
      }
    }
  } catch {
    return result;
  }

  return result;
}
