import { plantDeleteSchema } from '../../../schemas/plant';
import { plantAssignParamsSchema, plantAssignSchema, userGetSchema } from '../../../schemas/user';

describe('schema: uid normalization (lowercase)', () => {
  const upper = '2E1A1BCE-9D34-43B0-A927-6FD239F28796';
  const lower = '2e1a1bce-9d34-43b0-a927-6fd239f28796';

  it('should normalize userGetSchema uid to lowercase', () => {
    expect(userGetSchema.parse({ uid: upper })).toEqual({ uid: lower });
  });

  it('should normalize plantDeleteSchema uid to lowercase', () => {
    expect(plantDeleteSchema.parse({ uid: upper })).toEqual({ uid: lower });
  });

  it('should normalize plantAssignParamsSchema userUid to lowercase', () => {
    expect(plantAssignParamsSchema.parse({ userUid: upper })).toEqual({ userUid: lower });
  });

  it('should normalize plantAssignSchema plantUid to lowercase', () => {
    expect(plantAssignSchema.parse({ plantUid: upper })).toMatchObject({ plantUid: lower });
  });
});
