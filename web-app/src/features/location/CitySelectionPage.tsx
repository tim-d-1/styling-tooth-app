import { useState, type FC } from 'react';
import DetailCardLayout from '@/components/layout/DetailCardLayout';
import Icon from '@/components/ui/Icon';
import {
  DEFAULT_CITIES,
  DEFAULT_CITY,
  CITY_STORAGE_KEY,
  type CityItem,
} from './city_types';

export interface CitySelectionPageProps {
  cities?: CityItem[];
  initialCity?: string;
  onConfirm?: (city: string) => void;
  onBackClick?: () => void;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onProfileClick?: () => void;
}

export const CitySelectionPage: FC<CitySelectionPageProps> = ({
  cities = DEFAULT_CITIES,
  initialCity,
  onConfirm,
  onBackClick,
  isLoggedIn = false,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
}) => {
  const cityList = cities && cities.length > 0 ? cities : DEFAULT_CITIES;

  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    let targetName = initialCity;
    if (!targetName && typeof window !== 'undefined') {
      targetName = localStorage.getItem(CITY_STORAGE_KEY) || undefined;
    }
    if (!targetName) {
      targetName = DEFAULT_CITY;
    }
    const found = cityList.find(
      (c) => c.name.toLowerCase() === targetName?.toLowerCase()
    );
    return found ? found.id : cityList[0]?.id || '';
  });

  const selectedCity =
    cityList.find((c) => c.id === selectedCityId) || cityList[0];

  const handleConfirm = () => {
    if (!selectedCity) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(CITY_STORAGE_KEY, selectedCity.name);
    }
    onConfirm?.(selectedCity.name);
    onBackClick?.();
  };

  return (
    <DetailCardLayout
      onBackClick={onBackClick}
      isLoggedIn={isLoggedIn}
      onLoginClick={onLoginClick}
      onRegisterClick={onRegisterClick}
      onProfileClick={onProfileClick}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-8 sm:mb-10">
          <Icon name="fi-rr-marker" size={24} color="#EC643A" />
          <h1 className="text-2xl sm:text-[1.625rem] font-bold text-content-dark font-accented leading-snug">
            Оберіть своє місто
          </h1>
        </div>

        <div
          role="radiogroup"
          aria-label="Оберіть своє місто"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-x-6 sm:gap-y-4"
        >
          {cityList.map((city) => {
            const isSelected = city.id === selectedCityId;
            return (
              <button
                key={city.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedCityId(city.id)}
                className={[
                  'h-12 w-full rounded-[10px] text-base font-accented transition-colors flex items-center justify-center cursor-pointer outline-none',
                  isSelected
                    ? 'bg-soft-blue border border-soft-blue text-white font-semibold'
                    : 'bg-white border border-[#242F35] text-content-dark hover:border-terracotta hover:text-terracotta',
                ].join(' ')}
              >
                {city.name}
              </button>
            );
          })}
        </div>

        <div className="mt-8 sm:mt-12">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full h-12 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white text-base font-accented font-semibold transition-colors flex items-center justify-center cursor-pointer border-0 outline-none"
          >
            Підтвердити
          </button>
        </div>
      </div>
    </DetailCardLayout>
  );
};

export default CitySelectionPage;
