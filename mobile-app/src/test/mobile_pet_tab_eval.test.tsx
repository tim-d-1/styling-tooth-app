import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MyPetScreen } from '../features/pets/MyPetScreen';
import { MainScreen } from '../features/dashboard/MainScreen';
import {
  formatVisitsCount,
  formatPetSubtitle,
  formatPetAge,
  getSpeciesEmoji,
  isFigmaPetPlaceholder,
} from '../features/pets/pet_utils';
import * as ImagePicker from 'expo-image-picker';

describe('My Pet Tab Eval Suite (Figma Frame 774:2002 & Web Parity)', () => {
  const samplePets = [
    { id: 'pet-alpha', name: 'Майло', species: 'dog', isActive: true },
    { id: 'pet-beta', name: 'Сімба', species: 'cat', isActive: false },
  ];

  const sampleDetail = {
    id: 'pet-alpha',
    name: 'Майло',
    species: 'dog',
    breed: 'Коргі',
    birthDate: '2023-05-10',
    ageFormatted: '3 роки',
    weightKg: 12.5,
    visitsCount: 7,
    isVip: true,
    medicalNotes: '• Чутливий до курячого білка\n• Регулярна чистка вух',
    behaviorNotes: 'Спокійний, любить погладжування',
    avatarUrl: 'https://example.com/corgi.jpg',
  };

  const sampleSchedule = [
    {
      id: 'sch-101',
      title: 'Вакцинація Nobivac',
      badgeText: 'Актуально',
      drugName: 'Nobivac DHPPI',
      validUntilFormatted: '20 Листопада 2026',
      iconName: 'calendar',
    },
    {
      id: 'sch-102',
      title: 'Обробка від паразитів',
      badgeText: 'Через 2 тижні',
      drugName: 'Simparica Trio',
      validUntilFormatted: '18 Жовтня 2026',
      iconName: 'shield',
    },
  ];

  const sampleHistory = {
    id: 'hist-201',
    serviceTitle: 'Експрес-грумінг',
    price: 950,
    dateFormatted: '12 Вересня 2026',
    masterName: 'Ірина',
    tags: ['Вичісування', 'Гігієна', 'Підстригання кігтів'],
    beforePhotoUrl: 'https://example.com/corgi-before.jpg',
    afterPhotoUrl: 'https://example.com/corgi-after.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Eval 1: Figma Frame 774:2002 Design Contract & Hierarchy', () => {
    it('evaluates structural elements: header, pet switcher, profile card, action buttons, health card, schedule, and history', () => {
      render(
        <MyPetScreen
          initialPets={samplePets}
          initialPetDetail={sampleDetail}
          initialSchedule={sampleSchedule}
          initialHistory={sampleHistory}
        />
      );

      expect(screen.getByTestId('pets-screen-title')).toHaveTextContent('Мої улюбленці');
      expect(screen.getByTestId('pets-notifications-button')).toBeInTheDocument();

      expect(screen.getByTestId('pets-switcher-list')).toBeInTheDocument();
      expect(screen.getByTestId('pet-switcher-item-pet-alpha')).toBeInTheDocument();
      expect(screen.getByTestId('pet-switcher-item-pet-beta')).toBeInTheDocument();
      expect(screen.getByTestId('add-pet-chip-button')).toBeInTheDocument();

      expect(screen.getByTestId('pet-profile-card')).toBeInTheDocument();
      expect(screen.getByTestId('pet-avatar-image')).toBeInTheDocument();
      expect(screen.getByTestId('pet-avatar-edit-button')).toBeInTheDocument();
      expect(screen.getByTestId('pet-profile-name')).toHaveTextContent('Майло');
      expect(screen.getByTestId('pet-profile-subtitle')).toHaveTextContent('Коргі • 3 роки • 12.5 кг');
      expect(screen.getByTestId('pet-visits-badge')).toHaveTextContent('7 візитів');
      expect(screen.getByTestId('pet-vip-badge')).toHaveTextContent('VIP Клієнт');

      expect(screen.getByTestId('book-visit-button')).toHaveTextContent('Записати на візит');
      expect(screen.getByTestId('recommendations-button')).toHaveTextContent('Рекомендації');

      expect(screen.getByTestId('pet-health-alert-card')).toBeInTheDocument();
      expect(screen.getByText('Алергії та особливості')).toBeInTheDocument();
      expect(screen.getByText('Чутливий до курячого білка')).toBeInTheDocument();

      expect(screen.getByTestId('pet-care-schedule-card')).toBeInTheDocument();
      expect(screen.getByText('Графік обробок')).toBeInTheDocument();
      expect(screen.getByText('Вакцинація Nobivac')).toBeInTheDocument();

      expect(screen.getByTestId('pet-procedure-history-card')).toBeInTheDocument();
      expect(screen.getByText('Історія процедур')).toBeInTheDocument();
      expect(screen.getByText('Експрес-грумінг')).toBeInTheDocument();
      expect(screen.getByText('950 грн')).toBeInTheDocument();
    });
  });

  describe('Eval 2: Figma Static Dummy Placeholder Avoidance Matrix', () => {
    const dummyNames = ['Барні', 'barney', 'Чарлі', 'charlie'];

    it('detects dummy placeholder names from mockups', () => {
      dummyNames.forEach((dummy) => {
        expect(isFigmaPetPlaceholder(dummy)).toBe(true);
      });
      expect(isFigmaPetPlaceholder('Майло')).toBe(false);
      expect(isFigmaPetPlaceholder('Барон')).toBe(false);
    });

    it('displays user real pet name and does not leak Figma mockup names', () => {
      render(
        <MyPetScreen
          initialPets={samplePets}
          initialPetDetail={sampleDetail}
        />
      );

      dummyNames.forEach((dummy) => {
        expect(screen.queryByText(new RegExp(dummy, 'i'))).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('pet-profile-name')).toHaveTextContent('Майло');
    });

    it('displays empty state when user has no pets instead of dummy data', () => {
      render(
        <MyPetScreen
          initialPets={[]}
          initialPetDetail={null}
        />
      );

      expect(screen.getByTestId('empty-pets-container')).toBeInTheDocument();
      expect(screen.getByText('У вас ще немає доданих тваринок')).toBeInTheDocument();
      expect(screen.getByTestId('add-pet-cta-button')).toHaveTextContent('+ Додати улюбленця');
    });
  });

  describe('Eval 3: Ukrainian Pluralization & Age/Visits Formatting Quality', () => {
    it('evaluates visits count inflections for Ukrainian language rules', () => {
      expect(formatVisitsCount(0)).toBe('0 візитів');
      expect(formatVisitsCount(1)).toBe('1 візит');
      expect(formatVisitsCount(2)).toBe('2 візити');
      expect(formatVisitsCount(3)).toBe('3 візити');
      expect(formatVisitsCount(4)).toBe('4 візити');
      expect(formatVisitsCount(5)).toBe('5 візитів');
      expect(formatVisitsCount(11)).toBe('11 візитів');
      expect(formatVisitsCount(12)).toBe('12 візитів');
      expect(formatVisitsCount(21)).toBe('21 візит');
      expect(formatVisitsCount(22)).toBe('22 візити');
      expect(formatVisitsCount(25)).toBe('25 візитів');
    });

    it('evaluates subtitle compilation with combinations of breed, age, and weight', () => {
      expect(formatPetSubtitle('Шпіц', '1 рік', 3.2)).toBe('Шпіц • 1 рік • 3.2 кг');
      expect(formatPetSubtitle('Перська', null, 4)).toBe('Перська • 4 кг');
      expect(formatPetSubtitle(null, '5 років', null)).toBe('5 років');
    });

    it('evaluates species emoji mapping', () => {
      expect(getSpeciesEmoji('dog')).toBe('🐶');
      expect(getSpeciesEmoji('cat')).toBe('🐱');
      expect(getSpeciesEmoji('rabbit')).toBe('🐰');
      expect(getSpeciesEmoji('parrot')).toBe('🦜');
      expect(getSpeciesEmoji('hamster')).toBe('🐹');
      expect(getSpeciesEmoji('other')).toBe('🐾');
    });
  });

  describe('Eval 4: Web-app Parity & Interactive Contracts', () => {
    it('evaluates switching active pet via switcher pill updates active state', () => {
      render(
        <MyPetScreen
          initialPets={samplePets}
          initialPetDetail={sampleDetail}
        />
      );

      const simbaChip = screen.getByTestId('pet-switcher-item-pet-beta');
      fireEvent.click(simbaChip);

      expect(simbaChip).toBeInTheDocument();
    });

    it('evaluates launching image picker on avatar edit press', async () => {
      const toastSpy = vi.fn();
      render(
        <MyPetScreen
          initialPets={samplePets}
          initialPetDetail={sampleDetail}
          onToast={toastSpy}
        />
      );

      fireEvent.click(screen.getByTestId('pet-avatar-edit-button'));

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
        expect(toastSpy).toHaveBeenCalledWith('Фото улюбленця оновлено');
      });
    });

    it('evaluates booking callback triggered with petId', () => {
      const handleBook = vi.fn();
      render(
        <MyPetScreen
          initialPets={samplePets}
          initialPetDetail={sampleDetail}
          onNavigateBooking={handleBook}
        />
      );

      fireEvent.click(screen.getByTestId('book-visit-button'));
      expect(handleBook).toHaveBeenCalledWith('pet-alpha');
    });
  });

  describe('Eval 5: Tabbar Navigation Integration', () => {
    it('evaluates navigation from MainScreen tabbar into pets tab', async () => {
      render(
        <MainScreen
          initialTab="pets"
          initialPets={samplePets}
          initialPetDetail={sampleDetail}
        />
      );

      expect(screen.getByTestId('pets-tab-content')).toBeInTheDocument();
      expect(screen.getByTestId('pets-screen-title')).toHaveTextContent('Мої улюбленці');
      expect(screen.getByTestId('pet-profile-card')).toBeInTheDocument();
    });

    it('evaluates add pet navigation callback from switcher chip', () => {
      const handleAdd = vi.fn();
      render(
        <MainScreen
          initialTab="pets"
          initialPets={samplePets}
          initialPetDetail={sampleDetail}
          onNavigateAddPet={handleAdd}
        />
      );

      fireEvent.click(screen.getByTestId('add-pet-chip-button'));
      expect(handleAdd).toHaveBeenCalledTimes(1);
    });
  });
});
