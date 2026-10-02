import {
  isEmailIdentifier,
  isPhoneIdentifier,
  normalizePhoneNumber,
  phoneToAuthEmail,
} from './login_utils';

export { phoneToAuthEmail };

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  identifier: string;
  password: string;
  city: string;
  avatarPhoto?: File | null;
  petPhoto?: File | null;
}

export function validateRegisterForm(data: RegisterFormData): { isValid: boolean; error: string | null } {
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
    return { isValid: false, error: 'Пароль повинен містити не менше 6 символів' };
  }
  if (!isEmailIdentifier(trimmedId) && !normalizePhoneNumber(trimmedId)) {
    return { isValid: false, error: 'Введіть коректний Email або номер телефону' };
  }
  if (!data.city.trim()) {
    return { isValid: false, error: 'Вкажіть місто' };
  }
  return { isValid: true, error: null };
}

export function fileToDataUrl(file: File, maxDimension = 256): Promise<string> {
  return new Promise((resolve) => {
    if (typeof FileReader === 'undefined') {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = (event.target?.result as string) || '';
      if (
        typeof Image === 'undefined' ||
        typeof document === 'undefined' ||
        (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent))
      ) {
        resolve(rawResult);
        return;
      }
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(rawResult);
        }
      }, 300);

      const img = new Image();
      img.onload = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
            return;
          }
          resolve(rawResult);
        } catch {
          resolve(rawResult);
        }
      };
      img.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(rawResult);
      };
      img.src = rawResult;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export { isEmailIdentifier, isPhoneIdentifier, normalizePhoneNumber };
