export type THookNames =
  | 'afterInit'
  | 'beforeSelectTeam'
  | 'afterSelectTeam'
  | 'beforeSentTeam'
  | 'afterSentTeam'
  | 'beforeVoteForTeam'
  | 'afterVoteForTeam'
  | 'beforeStartMission'
  | 'afterStartMission'
  | 'beforeEndMission'
  | 'afterEndMission'
  | 'beforeEndGame';

export type THooksDictionary = {
  [key in THookNames]: (() => boolean)[];
};
