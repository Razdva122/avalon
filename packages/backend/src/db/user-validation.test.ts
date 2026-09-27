import { UserLayer } from './user';
import { userProfileModel } from './models';
import bcrypt from 'bcrypt';
const users = new UserLayer();
afterEach(() => jest.restoreAllMocks());
test('rejects malformed registration before spending bcrypt work or touching MongoDB', async () => {
  const hash = jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hash');
  const save = jest
    .spyOn(userProfileModel.prototype as unknown as { save(): Promise<void> }, 'save')
    .mockResolvedValue(undefined);
  for (const patch of [
    { name: 'x'.repeat(101) },
    { email: { $ne: null } },
    { password: 'short' },
    { password: 'я'.repeat(40) },
  ]) {
    await expect(
      users.registerUser({
        id: 'player',
        name: 'Player',
        email: 'a@example.com',
        login: 'player',
        password: 'password123',
        ...patch,
      } as unknown as Parameters<UserLayer['registerUser']>[0]),
    ).rejects.toThrow('invalidRequest');
  }
  expect(hash).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
});
test('rejects operator IDs and oversized names before profile queries', async () => {
  const find = jest.spyOn(userProfileModel, 'findOne').mockResolvedValue(null);
  const update = jest.spyOn(userProfileModel, 'findOneAndUpdate').mockResolvedValue(null);
  await expect(users.getUserByID({ $ne: null } as unknown as string)).rejects.toThrow('invalidRequest');
  await expect(users.updateUserName('player', 'x'.repeat(101))).rejects.toThrow('invalidRequest');
  expect(find).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});
test('nonexistent account uses the same public error as a wrong password', async () => {
  jest.spyOn(userProfileModel, 'findOne').mockResolvedValue(null);
  jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
  await expect(users.login('missing', 'some-password')).resolves.toEqual({ error: 'wrongPassword' });
});
