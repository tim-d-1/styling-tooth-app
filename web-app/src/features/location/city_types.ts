export interface CityItem {
  id: string;
  name: string;
}

export const DEFAULT_CITIES: CityItem[] = [
  { id: 'bila-tserkva', name: 'Біла Церква' },
  { id: 'dnipro-1', name: 'Дніпро' },
  { id: 'dnipro-2', name: 'Дніпро' },
  { id: 'kyiv', name: 'Київ' },
  { id: 'zaporizhzhia', name: 'Запоріжжя' },
  { id: 'lviv', name: 'Львів' },
  { id: 'odesa', name: 'Одеса' },
  { id: 'poltava', name: 'Полтава' },
  { id: 'kharkiv', name: 'Харків' },
  { id: 'khmelnytskyi', name: 'Хмельницький' },
];

export const DEFAULT_CITY = 'Київ';
export const CITY_STORAGE_KEY = 'styling_tooth_selected_city';
