export const TOKEN_TYPES = {
  access: 'access',
  refresh: 'refresh',
} as const;

export const TOKEN_EXPIRY = {
  access: '15m',
  refresh: '30d',
} as const;
