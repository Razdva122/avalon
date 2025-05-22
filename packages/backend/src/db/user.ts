import bcrypt from 'bcrypt';
import { ArgumentOfCallback, PublicUserProfile, UserFeatures, UserForUI, UserProfile } from '@avalon/types';
import { userFeaturesModel, userProfileModel, userAchievementModel } from '@/db/models';
import { generateJWT } from '@/user';
import { AchievementType } from '@avalon/types/stats/achievements';
import { achievementsData } from '@/achievements/data';

export class UserLayer {
  hashRounds = 12;

  async registerUser(
    user: Omit<UserProfile, 'avatar' | 'registrationDate'>,
  ): Promise<ArgumentOfCallback<'registerUser'>> {
    const passHash = await bcrypt.hash(user.password, this.hashRounds);

    const userModel = new userProfileModel({ ...user, password: passHash });

    try {
      await userModel.save();
    } catch (err) {
      if (err instanceof Error && 'code' in err && err.code === 11000) {
        return {
          error: 'emailAlreadyExist',
        };
      }

      throw err;
    }

    const userForUi = {
      id: user.id,
      name: user.name,
      email: user.email,
      login: user.login,
      avatar: 'servant',
    };

    return {
      ...userForUi,
      token: generateJWT(userForUi),
      knownAchievements: [],
    };
  }

  async getUserByID(id: string): Promise<UserProfile> {
    const user = await userProfileModel.findOne({ id });

    if (!user) {
      throw new Error(`user with ${id} does not exist`);
    }

    return user;
  }

  async getUserFeatures(id: string): Promise<UserFeatures | null> {
    const features = await userFeaturesModel.findOne({ userID: id });
    return features;
  }

  /**
   * Обновляет дату последней игры для списка игроков
   * @param playerIds Список ID игроков
   * @param gameDate Дата игры
   */
  async updateLastGameDate(playerIds: string[], gameDate: Date): Promise<void> {
    const bulkOps = playerIds.map((playerId) => ({
      updateOne: {
        filter: { userID: playerId },
        update: {
          $max: { lastGameDate: gameDate },
        },
        upsert: true,
      },
    }));

    await userFeaturesModel.bulkWrite(bulkOps);
  }

  async getUserProfile(id: string): Promise<UserForUI> {
    const user = await this.getUserByID(id);

    return {
      id: user.id,
      email: user.email,
      login: user.login,
      avatar: user.avatar,
      name: user.name,
    };
  }

  async getPublicUserProfile(id: string): Promise<PublicUserProfile> {
    const user = await this.getUserByID(id);

    return {
      id: user.id,
      avatar: user.avatar,
      name: user.name,
    };
  }

  async updateUserName(id: string, name: string): Promise<void> {
    await userProfileModel.findOneAndUpdate({ id }, { $set: { name } });
  }

  async updateUserAvatar(userID: string, avatarID: string): Promise<void> {
    await userProfileModel.findOneAndUpdate({ id: userID }, { $set: { avatar: avatarID } });
  }

  async updateUserCredentials(
    id: string,
    password: string,
    type: 'email' | 'password' | 'login',
    value: string,
  ): Promise<ArgumentOfCallback<'updateUserEmail' | 'updateUserPassword'>> {
    const user = await this.getUserByID(id);
    const isPassValid = await this.validateUserPassword(user, password);

    if (isPassValid) {
      if (type === 'email' || type === 'login') {
        try {
          const params = type === 'email' ? { email: value } : { login: value };
          await userProfileModel.findOneAndUpdate({ id: user.id }, params, { runValidators: true });
        } catch (err) {
          if (err instanceof Error && 'code' in err && err.code === 11000) {
            // @ts-expect-error - email/login not checked if we change password
            return type === 'email' ? { error: 'emailAlreadyExist' } : { error: 'loginAlreadyExist' };
          }

          throw err;
        }
      } else {
        const passHash = await bcrypt.hash(value, this.hashRounds);
        await userProfileModel.findOneAndUpdate({ id: user.id }, { password: passHash });
      }

      return true;
    }

    return { error: 'wrongPassword' };
  }

  async login(loginOrEmail: string, password: string): Promise<ArgumentOfCallback<'login'>> {
    const type = loginOrEmail.match(/^[a-zA-Z0-9_.-]+$/) ? 'login' : 'email';
    let user;

    if (type === 'email') {
      user = await userProfileModel.findOne({ email: loginOrEmail });
    } else {
      user = await userProfileModel.findOne({ login: loginOrEmail });
    }

    if (!user) {
      return { error: type === 'email' ? 'emailNotExist' : 'loginNotExist' };
    }

    const isPassValid = await this.validateUserPassword(user, password);

    if (!isPassValid) {
      return { error: 'wrongPassword' };
    }

    const userForUi = {
      id: user.id,
      name: user.name,
      email: user.email,
      login: user.login,
      avatar: user.avatar,
    };

    const knownAchievements = await this.getUserCompletedAchievements(user.id, 'hidden');

    return {
      ...userForUi,
      token: generateJWT(userForUi),
      knownAchievements,
    };
  }

  async getUserCompletedAchievements(userID: string, type?: 'hidden'): Promise<string[]> {
    const userAchievements = await userAchievementModel.find({
      userID: userID,
      completed: true,
    });

    if (type !== 'hidden') {
      return userAchievements.map((el) => el.achievementID);
    }

    return userAchievements.reduce<string[]>((acc, el) => {
      if (achievementsData.find((data) => data.type === AchievementType.HIDDEN && data.id === el.achievementID)) {
        acc.push(el.achievementID);
      }

      return acc;
    }, []);
  }

  async validateUserPassword(user: UserProfile, password: string): Promise<boolean> {
    const isPassValid = await bcrypt.compare(password, user.password);
    return isPassValid;
  }
}
