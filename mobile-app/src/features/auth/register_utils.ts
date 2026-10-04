import {
  isEmailIdentifier,
  isPhoneIdentifier,
  normalizePhoneNumber,
  phoneToAuthEmail,
} from './login_utils';

export {
  isEmailIdentifier,
  isPhoneIdentifier,
  normalizePhoneNumber,
  phoneToAuthEmail,
};

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  identifier: string;
  password: string;
  city: string;
  avatarUri?: string | null;
}

export function validateRegisterForm(data: RegisterFormData): {
  isValid: boolean;
  error: string | null;
} {
  if (!data.firstName.trim()) {
    return { isValid: false, error: 'Введіть ім’я' };
  }
  if (!data.lastName.trim()) {
    return { isValid: false, error: 'Введіть прізвище' };
  }
  const trimmedId = data.identifier.trim();
  if (!trimmedId) {
    return { isValid: false, error: 'Введіть Email або номер телефону' };
  }
  if (!data.password.trim()) {
    return { isValid: false, error: 'Введіть пароль' };
  }
  if (data.password.length < 6) {
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
  if (!data.city.trim()) {
    return { isValid: false, error: 'Вкажіть місто' };
  }
  return { isValid: true, error: null };
}
