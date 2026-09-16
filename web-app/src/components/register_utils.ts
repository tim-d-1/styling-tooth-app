import { isEmailIdentifier } from './login_utils';

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  username: string;
  identifier: string;
  password: string;
  city: string;
  petPhoto?: File | null;
}

export function validateRegisterForm(data: RegisterFormData): { isValid: boolean; error: string | null } {
  if (!data.firstName.trim()) {
    return { isValid: false, error: 'Введіть ім’я' };
  }
  if (!data.lastName.trim()) {
    return { isValid: false, error: 'Введіть прізвище' };
  }
  if (!data.username.trim()) {
    return { isValid: false, error: 'Введіть ім’я користувача' };
  }
  if (data.username.trim().length < 3) {
    return { isValid: false, error: 'Ім’я користувача повинно містити не менше 3 символів' };
  }
  if (!data.identifier.trim()) {
    return { isValid: false, error: 'Введіть Email або номер телефону' };
  }
  if (!data.password.trim()) {
    return { isValid: false, error: 'Введіть пароль' };
  }
  if (data.password.length < 6) {
    return { isValid: false, error: 'Пароль повинен містити не менше 6 символів' };
  }
  if (!data.city.trim()) {
    return { isValid: false, error: 'Вкажіть місто' };
  }
  return { isValid: true, error: null };
}

export { isEmailIdentifier };
