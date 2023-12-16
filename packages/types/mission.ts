/**
 * Possible result of Mission
 */
export type TMissionResult = 'success' | 'fail'

export interface IMissionSettings {
  /**
   * Amount of players going to mission
   */
  players: number

  /**
   * Amount of fails required to fail mission
   */
  failsRequired: number
}
