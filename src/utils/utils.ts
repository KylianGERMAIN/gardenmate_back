import { constants } from '../constants/constants';

function normalizeUid(value: string): string {
  return value.toLowerCase();
}

function isString(value: unknown): value is string {
  return typeof value === constants.stringTypes;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === constants.objectTypes;
}

export const utils = {
  normalizeUid,
  isString,
  isObject,
};
