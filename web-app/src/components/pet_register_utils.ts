export type PetSpecies = 'dog' | 'cat' | 'other';
export type PetSex = 'male' | 'female' | 'unknown';

export interface PetRegisterFormData {
  name: string;
  species: PetSpecies;
  breed?: string;
  sex?: PetSex;
  birthDate?: string;
  weight?: string;
  notes?: string;
  petPhoto?: File | null;
}

export function validatePetRegisterForm(data: PetRegisterFormData): { isValid: boolean; error: string | null } {
  if (!data.name || !data.name.trim()) {
    return { isValid: false, error: 'Введіть кличку тваринки' };
  }
  if (!data.species) {
    return { isValid: false, error: 'Оберіть вид тварини' };
  }
  if (data.weight && data.weight.trim()) {
    const num = parseFloat(data.weight.replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      return { isValid: false, error: 'Вкажіть коректну вагу (наприклад, 4.5)' };
    }
  }
  return { isValid: true, error: null };
}
