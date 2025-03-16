import bcrypt from 'bcrypt';
import { ArgumentOfCallback, PublicUserProfile, UserFeatures, UserForUI, UserProfile } from '@avalon/types';
import { userFeaturesModel, userProfileModel } from '@/db/models';
import { generateJWT } from '@/user';

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

    return {
      ...userForUi,
      token: generateJWT(userForUi),
    };
  }

  async validateUserPassword(user: UserProfile, password: string): Promise<boolean> {
    const isPassValid = await bcrypt.compare(password, user.password);
    return isPassValid;
  }
}
