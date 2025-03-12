import { prop, modelOptions } from '@typegoose/typegoose';

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
    type: Date,
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
    type: Date,
    default: () => new Date().toISOString(),
  })
  public registrationDate!: string;

  @prop({ required: true })
  public password!: string;
}
