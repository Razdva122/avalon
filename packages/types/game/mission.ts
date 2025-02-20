import { prop } from '@typegoose/typegoose';

/**
 * Possible result of Mission
 */
export type TMissionResult = 'success' | 'fail';

export class MissionSettings {
  /**
   * Amount of players going to mission
   */
  @prop({ required: true })
  public players!: number;

  /**
   * Amount of fails required to fail mission
   */
  @prop({ required: true })
  public failsRequired!: number;
}

export class MissionWithResult extends MissionSettings {
  /**
   * Indicates whether the mission is hidden
   */
  @prop()
  public hidden?: boolean;

  /**
   * Result of mission
   */
  @prop()
  public result?: TMissionResult;

  /**
   * Amount of fails on mission
   */
  @prop()
  public fails?: number;
}
