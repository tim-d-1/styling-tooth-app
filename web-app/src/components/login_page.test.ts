import LoginPage from './LoginPage';
import { validateLoginForm, isEmailIdentifier } from './login_utils';

export function runLoginPageSuite(): boolean {
  if (!LoginPage) {
    throw new Error('LoginPage export missing');
  }

  const shortUsername = validateLoginForm('ab', 'test@example.com', 'password123');
  if (shortUsername.isValid || shortUsername.error !== 'Ім’я користувача повинно містити не менше 3 символів') {
    throw new Error(`Expected short username error, got ${JSON.stringify(shortUsername)}`);
  }

  const emptyIdentifier = validateLoginForm('user123', '', 'password123');
  if (emptyIdentifier.isValid || emptyIdentifier.error !== 'Введіть Email або номер телефону') {
    throw new Error(`Expected empty identifier validation error, got ${JSON.stringify(emptyIdentifier)}`);
  }

  const emptyPassword = validateLoginForm('user123', 'test@example.com', '   ');
  if (emptyPassword.isValid || emptyPassword.error !== 'Введіть пароль') {
    throw new Error(`Expected empty password validation error, got ${JSON.stringify(emptyPassword)}`);
  }

  const shortPassword = validateLoginForm('user123', 'test@example.com', '12345');
  if (shortPassword.isValid || shortPassword.error !== 'Пароль повинен містити не менше 6 символів') {
    throw new Error(`Expected short password validation error, got ${JSON.stringify(shortPassword)}`);
  }

  const validForm = validateLoginForm('Marichka_bkk', 'bulakhmaria@gmail.com', 'password123');
  if (!validForm.isValid || validForm.error !== null) {
    throw new Error(`Expected valid form result, got ${JSON.stringify(validForm)}`);
  }

  const validFormWithoutUsername = validateLoginForm('', 'bulakhmaria@gmail.com', 'password123');
  if (!validFormWithoutUsername.isValid || validFormWithoutUsername.error !== null) {
    throw new Error(`Expected valid form without username result, got ${JSON.stringify(validFormWithoutUsername)}`);
  }

  const emailTest1 = isEmailIdentifier('bulakhmaria@gmail.com');
  if (!emailTest1) {
    throw new Error('Expected valid email to return true');
  }

  const emailTest2 = isEmailIdentifier('+380501234567');
  if (emailTest2) {
    throw new Error('Expected phone number to return false for email check');
  }

  const emailTest3 = isEmailIdentifier('Marichka_bkk');
  if (emailTest3) {
    throw new Error('Expected username to return false for email check');
  }

  return true;
}

runLoginPageSuite();
