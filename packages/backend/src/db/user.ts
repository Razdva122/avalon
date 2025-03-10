import bcrypt from 'bcrypt';
import { getModelForClass } from '@typegoose/typegoose';
import { UserProfile, ArgumentOfCallback } from '@avalon/types';
import { generateJWT } from '@/user';

export class UserLayer {
  hashRounds = 12;
  userProfileModel = getModelForClass(UserProfile);

  async registerUser(user: UserProfile): Promise<ArgumentOfCallback<'registerUser'>> {
    const passHash = await bcrypt.hash(user.password, this.hashRounds);

    const userModel = new this.userProfileModel({ ...user, password: passHash });

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
    };

    return {
      ...userForUi,
      token: generateJWT(userForUi),
    };
  }

  async getUserByID(id: string): Promise<UserProfile> {
    const user = await this.userProfileModel.findOne({ id });

    if (!user) {
      throw new Error(`user with ${id} does not exist`);
    }

    return user;
  }

  async updateUserName(id: string, name: string): Promise<void> {
    await this.userProfileModel.findOneAndUpdate({ id }, { $set: { name } });
  }

  async updateUserCredentials(
    id: string,
    password: string,
    type: 'password',
    value: string,
  ): Promise<ArgumentOfCallback<'updateUserPassword'>>;
  async updateUserCredentials(
    id: string,
    password: string,
    type: 'email',
    value: string,
  ): Promise<ArgumentOfCallback<'updateUserEmail'>>;
  async updateUserCredentials(
    id: string,
    password: string,
    type: 'email' | 'password',
    value: string,
  ): Promise<ArgumentOfCallback<'updateUserEmail' | 'updateUserPassword'>> {
    const user = await this.getUserByID(id);
    const isPassValid = await this.validateUserPassword(user, password);

    if (isPassValid) {
      if (type === 'email') {
        try {
          await this.userProfileModel.findOneAndUpdate({ id: user.id }, { email: value }, { runValidators: true });
        } catch (err) {
          if (err instanceof Error && 'code' in err && err.code === 11000) {
            // @ts-expect-error - email not checked if we change password
            return { error: 'emailAlreadyExist' };
          }

          throw err;
        }
      } else {
        const passHash = await bcrypt.hash(value, this.hashRounds);
        await this.userProfileModel.findOneAndUpdate({ id: user.id }, { password: passHash });
      }

      return true;
    }

    return { error: 'wrongPassword' };
  }

  async login(email: string, password: string): Promise<ArgumentOfCallback<'login'>> {
    const user = await this.userProfileModel.findOne({ email });

    if (!user) {
      return { error: 'emailNotExist' };
    }

    const isPassValid = await this.validateUserPassword(user, password);

    if (!isPassValid) {
      return { error: 'wrongPassword' };
    }

    const userForUi = {
      id: user.id,
      name: user.name,
      email: user.email,
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
