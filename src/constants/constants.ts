import { TOKEN_TYPES } from './auth';

export const constants = {
  stringTypes: 'string' as const,
  objectTypes: 'object' as const,
  tokenTypes: TOKEN_TYPES,
} as const;
