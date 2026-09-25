import { useState, type FC, type FormEvent, type ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase';
import {
  validatePetRegisterForm,
  type PetSpecies,
  type PetSex,
} from './pet_register_utils';

export interface PetRegisterPageProps {
  onBack?: () => void;
  onSuccess?: () => void;
  onSkip?: () => void;
}

export const PetRegisterPage: FC<PetRegisterPageProps> = ({
  onBack,
  onSuccess,
  onSkip,
}) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<PetSex>('male');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [petPhoto, setPetPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<'UA' | 'EN'>('UA');

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'UA' ? 'EN' : 'UA'));
  };

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPetPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const clearPhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPetPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = validatePetRegisterForm({
      name,
      species,
      breed,
      sex,
      birthDate,
      weight,
      notes,
      petPhoto,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.error);
      return;
    }

    try {
      setIsLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        setErrorMessage('Необхідно авторизуватися для реєстрації тваринки');
        return;
      }

      const parsedWeight = weight.trim()
        ? parseFloat(weight.replace(',', '.'))
        : null;

      const { data: insertedPet, error: insertError } = await supabase
        .from('pets')
        .insert({
          owner_id: currentUserId,
          name: name.trim(),
          species,
          breed: breed.trim() || null,
          sex,
          birth_date: birthDate.trim() || null,
          weight_kg: parsedWeight,
          behavior_notes: notes.trim() || null,
        })
        .select()
        .maybeSingle();

      if (insertError) {
        setErrorMessage(insertError.message);
        return;
      }

      if (petPhoto && insertedPet?.id) {
        const fileExt = petPhoto.name.split('.').pop() || 'jpg';
        const storagePath = `${insertedPet.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('pet-media')
          .upload(storagePath, petPhoto);

        if (!uploadError) {
          await supabase.from('pet_media').insert({
            pet_id: insertedPet.id,
            storage_path: storagePath,
            photo_type: 'general',
            created_by: currentUserId,
          });
        }
      }

      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Помилка збереження даних тваринки';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface-cream flex flex-col lg:flex-row relative text-content-dark font-primary">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Повернутися назад"
        className="absolute top-6 left-6 lg:top-[3.6875rem] lg:left-[7.5rem] z-20 w-10 h-10 rounded-full bg-visit-gray lg:bg-white/20 text-content-dark lg:text-white hover:bg-visit-gray/80 lg:hover:bg-white/40 backdrop-blur-xs flex items-center justify-center transition-colors cursor-pointer border-0 p-0 outline-none"
      >
        <i className="fi fi-rr-arrow-left text-xl flex items-center justify-center leading-none" />
      </button>

      <div className="hidden lg:block lg:w-[44.375rem] lg:min-h-screen relative shrink-0 overflow-hidden select-none">
        <img
          src="/assets/images/mainecoon_cat_portrait.png"
          alt="Стильний Зубець"
          className="w-full h-full object-cover object-center"
        />

        <div className="absolute inset-x-0 bottom-0 min-h-[32rem] h-auto bg-gradient-to-b from-transparent to-banner-navy flex items-end p-14" />
      </div>

      <div className="flex-1 min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-0 relative">
        <div className="w-full flex justify-end lg:absolute lg:top-[3.625rem] lg:right-[7.5rem] z-10">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Змінити мову інтерфейсу"
            className="inline-flex items-center gap-2 text-text-muted hover:text-content-dark font-sans text-base leading-none transition-colors cursor-pointer bg-transparent border-0 p-0 outline-none"
          >
            <i className="fi fi-rr-globe text-[0.9375rem] flex items-center justify-center leading-none" />
            <span>{language}</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center py-8 lg:py-12">
          <div className="w-full max-w-[24.125rem] flex flex-col gap-9">
            <h1 className="font-accented font-bold text-2xl text-center text-black">
              Реєстрація улюбленця
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1">
                  <label
                    htmlFor="pet-name"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    Кличка тваринки
                  </label>
                  <input
                    id="pet-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent font-primary font-medium text-[0.9375rem] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted">
                    Вид тварини
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSpecies('dog')}
                      className={[
                        'h-10 rounded-xl font-primary text-xs font-medium transition-all cursor-pointer border-0 outline-none',
                        species === 'dog'
                          ? 'bg-terracotta text-white shadow-xs'
                          : 'bg-visit-gray text-content-dark hover:bg-gray-200',
                      ].join(' ')}
                    >
                      Собака
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecies('cat')}
                      className={[
                        'h-10 rounded-xl font-primary text-xs font-medium transition-all cursor-pointer border-0 outline-none',
                        species === 'cat'
                          ? 'bg-terracotta text-white shadow-xs'
                          : 'bg-visit-gray text-content-dark hover:bg-gray-200',
                      ].join(' ')}
                    >
                      Кіт
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecies('other')}
                      className={[
                        'h-10 rounded-xl font-primary text-xs font-medium transition-all cursor-pointer border-0 outline-none',
                        species === 'other'
                          ? 'bg-terracotta text-white shadow-xs'
                          : 'bg-visit-gray text-content-dark hover:bg-gray-200',
                      ].join(' ')}
                    >
                      Інше
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1">
                  <label
                    htmlFor="pet-breed"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    Порода
                  </label>
                  <input
                    id="pet-breed"
                    name="breed"
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full bg-transparent font-primary font-medium text-[0.9375rem] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted">
                    Стать
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSex('male')}
                      className={[
                        'h-10 rounded-xl font-primary text-xs font-medium transition-all cursor-pointer border-0 outline-none',
                        sex === 'male'
                          ? 'bg-terracotta text-white shadow-xs'
                          : 'bg-visit-gray text-content-dark hover:bg-gray-200',
                      ].join(' ')}
                    >
                      Хлопчик
                    </button>
                    <button
                      type="button"
                      onClick={() => setSex('female')}
                      className={[
                        'h-10 rounded-xl font-primary text-xs font-medium transition-all cursor-pointer border-0 outline-none',
                        sex === 'female'
                          ? 'bg-terracotta text-white shadow-xs'
                          : 'bg-visit-gray text-content-dark hover:bg-gray-200',
                      ].join(' ')}
                    >
                      Дівчинка
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1">
                  <label
                    htmlFor="pet-birth-date"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    Дата народження / Вік
                  </label>
                  <input
                    id="pet-birth-date"
                    name="birthDate"
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-transparent font-primary font-medium text-[0.9375rem] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1">
                  <label
                    htmlFor="pet-weight"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    Вага (кг)
                  </label>
                  <input
                    id="pet-weight"
                    name="weight"
                    type="text"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-transparent font-primary font-medium text-[0.9375rem] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5 border-b border-text-muted focus-within:border-terracotta transition-colors pb-1">
                  <label
                    htmlFor="pet-notes"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    Особливості та застереження
                  </label>
                  <input
                    id="pet-notes"
                    name="notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-transparent font-primary font-medium text-[0.9375rem] leading-[1.5em] tracking-[-0.011em] text-content-dark outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="pet-photo-upload"
                    className="font-primary font-semibold text-[0.6875rem] leading-[1.5em] tracking-[-0.011em] uppercase text-text-muted"
                  >
                    Фото тваринки
                  </label>
                  <div className="relative">
                    <input
                      id="pet-photo-upload"
                      name="petPhoto"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="sr-only"
                    />
                    <label
                      htmlFor="pet-photo-upload"
                      className="w-full h-[6.75rem] rounded-[10px] border border-dashed border-[#B2B2B2] hover:border-terracotta transition-colors bg-white/40 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group"
                    >
                      {photoPreview ? (
                        <div className="flex items-center gap-3 p-2 w-full h-full justify-center">
                          <img
                            src={photoPreview}
                            alt="Фото тваринки"
                            className="w-16 h-16 rounded-lg object-cover border border-text-muted/20 shrink-0"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-content-dark truncate max-w-[10rem]">
                              {petPhoto?.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                clearPhoto();
                              }}
                              className="text-[0.6875rem] text-terracotta hover:underline mt-1 bg-transparent border-0 p-0 text-left cursor-pointer"
                            >
                              Видалити фото
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <i className="fi fi-rr-camera text-2xl text-text-muted group-hover:text-terracotta transition-colors leading-none" />
                          <span className="font-primary text-xs text-text-muted group-hover:text-content-dark transition-colors">
                            Завантажити фото
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-primary animate-fade-in"
                  >
                    {errorMessage}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className="w-full h-12 rounded-xl bg-terracotta hover:opacity-90 active:scale-[0.99] transition-all text-white font-accented font-semibold text-base flex items-center justify-center cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs outline-none"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Зберегти</span>
                  )}
                </button>

                {onSkip && (
                  <button
                    type="button"
                    onClick={onSkip}
                    className="text-xs font-primary text-text-muted hover:text-terracotta transition-colors bg-transparent border-0 cursor-pointer outline-none"
                  >
                    Пропустити
                  </button>
                )}
              </div>
            </form>

            <div className="flex flex-col items-center gap-5 pt-2">
              <div className="w-full border-t border-[#B2B2B2]" />
              <p className="font-primary text-xs text-center text-content-dark leading-relaxed">
                Входячи в акаунт або створюючи новий, ви погоджуєтеся з нашими Правилами й умовами та Політикою конфіденційності
              </p>
              <p className="font-primary text-xs text-center text-content-dark leading-relaxed whitespace-pre-line">
                Усі права захищено.{'\n'}© 2026 Стильний зубець.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetRegisterPage;
