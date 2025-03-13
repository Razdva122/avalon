import { prop, modelOptions } from '@typegoose/typegoose';

export * from './avatars';

@modelOptions({
  schemaOptions: {
    collation: {
      locale: 'en',
      strength: 2,
    },
  },
})
export class UserForUI {
  @prop({ required: true, unique: true })
  public id!: string;

  @prop({ required: true })
  public name!: string;

  @prop({
    required: true,
    default: () => 'servant',
  })
  public avatar!: string;

  @prop({
    required: true,
    unique: true,
    set: (v: string) => v.toLowerCase().trim(),
  })
  public email!: string;

  @prop({
    required: true,
    unique: true,
    set: (v: string) => v.toLowerCase().trim(),
  })
  public login!: string;
}

@modelOptions({
  schemaOptions: {
    collation: {
      locale: 'en',
      strength: 2,
    },
  },
})
export class UserProfile extends UserForUI {
  @prop({
    required: true,
    default: () => new Date().toISOString(),
  })
  public registrationDate!: string;

  @prop({ required: true })
  public password!: string;
}

export class UserFeatures {
  @prop({ required: true, unique: true })
  public userID!: string;

  @prop()
  public isContributor?: boolean;

  @prop()
  public isHelper?: boolean;
}
