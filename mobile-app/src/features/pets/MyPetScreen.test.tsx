import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MyPetScreen } from './MyPetScreen';
import * as ImagePicker from 'expo-image-picker';

describe('MyPetScreen', () => {
  const mockPets = [
    { id: 'pet-1', name: 'Рекс', species: 'dog', isActive: true },
    { id: 'pet-2', name: 'Луна', species: 'cat', isActive: false },
  ];

  const mockDetail = {
    id: 'pet-1',
    name: 'Рекс',
    species: 'dog',
    breed: 'Лабрадор',
    ageFormatted: '2 роки',
    weightKg: 28,
    visitsCount: 6,
    isVip: true,
    medicalNotes: '• Алергія на курку\n• Чутливі вуха',
    behaviorNotes: 'Боїться гучного фену',
    avatarUrl: 'https://example.com/rex.jpg',
  };

  const mockSchedule = [
    {
      id: 'sch-1',
      title: 'Вакцинація Nobivac',
      badgeText: 'Актуально',
      drugName: 'Nobivac DHPPI',
      validUntilFormatted: '15 Жовтня 2026',
      iconName: 'calendar',
    },
  ];

  const mockHistory = {
    id: 'hist-1',
    serviceTitle: 'Комплексний грумінг',
    price: 1200,
    dateFormatted: '14 Травня 2026',
    masterName: 'Олена',
    tags: ['Стрижка', 'Купання', 'Ознаки алергії відсутні'],
    beforePhotoUrl: 'https://example.com/before.jpg',
    afterPhotoUrl: 'https://example.com/after.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, title, and notifications button', () => {
    const handleNotification = vi.fn();
    render(<MyPetScreen onNotificationPress={handleNotification} />);

    expect(screen.getByTestId('pets-screen-title')).toHaveTextContent('Мої улюбленці');
    const bellBtn = screen.getByTestId('pets-notifications-button');
    expect(bellBtn).toBeInTheDocument();

    fireEvent.click(bellBtn);
    expect(handleNotification).toHaveBeenCalledTimes(1);
  });

  it('renders pet switcher pills and selects pet on tap', () => {
    render(<MyPetScreen initialPets={mockPets} initialPetDetail={mockDetail} />);

    expect(screen.getByTestId('pets-switcher-list')).toBeInTheDocument();
    expect(screen.getByTestId('pet-switcher-item-pet-1')).toHaveTextContent('Рекс');
    expect(screen.getByTestId('pet-switcher-item-pet-2')).toHaveTextContent('Луна');

    fireEvent.click(screen.getByTestId('pet-switcher-item-pet-2'));
    expect(screen.getByTestId('pet-switcher-item-pet-2')).toBeInTheDocument();
  });

  it('renders pet profile card with dynamic data, badges, and launches avatar picker', async () => {
    const toastSpy = vi.fn();
    render(
      <MyPetScreen
        initialPets={mockPets}
        initialPetDetail={mockDetail}
        onToast={toastSpy}
      />
    );

    expect(screen.getByTestId('pet-profile-card')).toBeInTheDocument();
    expect(screen.getByTestId('pet-profile-name')).toHaveTextContent('Рекс');
    expect(screen.getByTestId('pet-profile-subtitle')).toHaveTextContent('Лабрадор • 2 роки • 28 кг');
    expect(screen.getByTestId('pet-visits-badge')).toHaveTextContent('6 візитів');
    expect(screen.getByTestId('pet-vip-badge')).toHaveTextContent('VIP Клієнт');
    expect(screen.getByTestId('pet-avatar-image')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pet-avatar-edit-button'));

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
      expect(toastSpy).toHaveBeenCalledWith('Фото улюбленця оновлено');
    });
  });

  it('triggers onNavigateBooking and onNavigateAddPet callbacks', () => {
    const handleBook = vi.fn();
    const handleAdd = vi.fn();

    render(
      <MyPetScreen
        initialPets={mockPets}
        initialPetDetail={mockDetail}
        onNavigateBooking={handleBook}
        onNavigateAddPet={handleAdd}
      />
    );

    fireEvent.click(screen.getByTestId('book-visit-button'));
    expect(handleBook).toHaveBeenCalledWith('pet-1');

    fireEvent.click(screen.getByTestId('add-pet-chip-button'));
    expect(handleAdd).toHaveBeenCalledTimes(1);
  });

  it('renders health alerts card with parsed notes', () => {
    render(<MyPetScreen initialPets={mockPets} initialPetDetail={mockDetail} />);

    expect(screen.getByTestId('pet-health-alert-card')).toBeInTheDocument();
    expect(screen.getByText('Алергії та особливості')).toBeInTheDocument();
    expect(screen.getByText('Алергія на курку')).toBeInTheDocument();
    expect(screen.getByText('Чутливі вуха')).toBeInTheDocument();
    expect(screen.getByText('Боїться гучного фену')).toBeInTheDocument();
  });

  it('renders care schedule and procedure history cards', () => {
    render(
      <MyPetScreen
        initialPets={mockPets}
        initialPetDetail={mockDetail}
        initialSchedule={mockSchedule}
        initialHistory={mockHistory}
      />
    );

    expect(screen.getByTestId('pet-care-schedule-card')).toBeInTheDocument();
    expect(screen.getByText('Вакцинація Nobivac')).toBeInTheDocument();
    expect(screen.getByText('Препарат: Nobivac DHPPI')).toBeInTheDocument();

    expect(screen.getByTestId('pet-procedure-history-card')).toBeInTheDocument();
    expect(screen.getByText('Комплексний грумінг')).toBeInTheDocument();
    expect(screen.getByText('1200 грн')).toBeInTheDocument();
    expect(screen.getByText('14 Травня 2026 • Олена')).toBeInTheDocument();
    expect(screen.getByText('До 📸')).toBeInTheDocument();
    expect(screen.getByText('Після ✨')).toBeInTheDocument();
  });

  it('renders empty pets container when user has no pets', () => {
    const handleAdd = vi.fn();
    render(
      <MyPetScreen
        initialPets={[]}
        initialPetDetail={null}
        onNavigateAddPet={handleAdd}
      />
    );

    expect(screen.getByTestId('empty-pets-container')).toBeInTheDocument();
    expect(screen.getByText('У вас ще немає доданих тваринок')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('add-pet-cta-button'));
    expect(handleAdd).toHaveBeenCalledTimes(1);
  });
});
