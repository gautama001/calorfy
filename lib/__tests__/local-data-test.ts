jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getAllKeys: jest.fn(), multiRemove: jest.fn() },
}));

import { isUserOwnedStorageKey } from '@/lib/localData';

const userId = '11111111-2222-4333-8444-555555555555';

describe('local user data isolation', () => {
  it('recognizes every current user-scoped cache family', () => {
    const keys = [
      `diary:v2:${userId}:2026-07-22`,
      `goals:v2:${userId}`,
      `weight-history:v2:${userId}`,
      `goals:migrated:${userId}`,
      `personal-recipes:v1:${userId}`,
      `weekly-plan:v1:${userId}:2026-07-20`,
      `preferences:v1:${userId}`,
      `auth:password-recovery:${userId}`,
    ];

    keys.forEach((key) => expect(isUserOwnedStorageKey(key, userId)).toBe(true));
  });

  it('removes legacy personal data but preserves device-only appearance settings', () => {
    ['currentWeight', 'weightHistory', 'dailyWater', 'notificationHour', 'nutritionTargetsMode']
      .forEach((key) => expect(isUserOwnedStorageKey(key, userId)).toBe(true));
    ['darkMode', 'appLanguage'].forEach((key) => expect(isUserOwnedStorageKey(key, userId)).toBe(false));
  });

  it('does not classify another account cache as belonging to the active user', () => {
    expect(isUserOwnedStorageKey('goals:v2:aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', userId)).toBe(false);
  });
});
