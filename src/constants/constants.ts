import { TOKEN_TYPES } from './auth';

export const constants = {
  stringType: 'string' as const,
  tokenTypes: TOKEN_TYPES,
} as const;
