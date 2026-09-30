export interface NotificationPreferences {
  channels: {
    telegram: boolean;
    push: boolean;
    sms: boolean;
    email: boolean;
  };
  types: {
    visits: boolean;
    treatments: boolean;
    promos: boolean;
    newSpa: boolean;
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  channels: {
    telegram: true,
    push: true,
    sms: false,
    email: false,
  },
  types: {
    visits: true,
    treatments: true,
    promos: true,
    newSpa: false,
  },
};
