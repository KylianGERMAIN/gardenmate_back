import { constants } from '../constants/constants';

function normalizeUid(value: string): string {
  return value.toLowerCase();
}

function isString(value: unknown): value is string {
  return typeof value === constants.stringType;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export const utils = {
  normalizeUid,
  isString,
  isRecord,
};
