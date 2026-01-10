import { TOKEN_EXPIRY, TOKEN_TYPES } from './auth';

export const constants = {
  tokenTypes: TOKEN_TYPES,
  tokenExpiries: TOKEN_EXPIRY,
} as const;
