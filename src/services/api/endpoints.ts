export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/me'
  },
  HERO: {
    LIST: '/hero',
    ACTIVE: '/hero/active',
    CREATE: '/hero',
    UPDATE: (id: string) => `/hero/${id}`,
    DELETE: (id: string) => `/hero/${id}`
  },
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings'
  },
  SETTINGS_AUTH: {
    GOOGLE: '/settings/auth/google',
    FACEBOOK: '/settings/auth/facebook'
  },
  ANNOUNCEMENTS: {
    LIST: '/announcements',
    ACTIVE: '/announcements/active',
    CREATE: '/announcements',
    UPDATE: (id: string) => `/announcements/${id}`,
    DELETE: (id: string) => `/announcements/${id}`,
    REORDER: '/announcements/reorder'
  },
  BACKGROUNDS: {
    LIST: '/backgrounds',
    ACTIVE: '/backgrounds/active',
    CREATE: '/backgrounds',
    UPDATE: (id: string) => `/backgrounds/${id}`,
    DELETE: (id: string) => `/backgrounds/${id}`,
    REORDER: '/backgrounds/reorder'
  }
} as const;
