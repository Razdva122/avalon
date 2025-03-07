import bcrypt from 'bcrypt';
import { getModelForClass } from '@typegoose/typegoose';
import { UserProfile, UserForUI } from '@avalon/types';
import { generateJWT } from '@/user';

export class UserLayer {
  hashRounds = 12;
  userProfileModel = getModelForClass(UserProfile);

  async registerUser(user: UserProfile): Promise<UserForUI & { token: string }> {
    const passHash = await bcrypt.hash(user.password, this.hashRounds);

    const userModel = new this.userProfileModel({ ...user, password: passHash });

    await userModel.save();

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
    type: 'email' | 'password',
    value: string,
  ): Promise<boolean> {
    const user = await this.getUserByID(id);
    const isPassValid = await this.validateUserPassword(user, password);

    if (isPassValid) {
      await this.userProfileModel.findOneAndUpdate({ id: user.id }, { [type]: value });
      return true;
    }

    return false;
  }

  async login(email: string, password: string): Promise<UserForUI & { token: string }> {
    const user = await this.userProfileModel.findOne({ email });

    if (!user) {
      throw new Error(`User with email: ${email} does not exist`);
    }

    const isPassValid = await this.validateUserPassword(user, password);

    if (!isPassValid) {
      throw new Error(`Wrong password`);
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
