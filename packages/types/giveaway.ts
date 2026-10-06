export interface GiveawayWinner {
  userID: string;
  name: string;
  avatar: string;
}
export interface GiveawayDraw {
  drawAt: string;
  solo: GiveawayWinner | null;
  group: (GiveawayWinner & { groupName: string }) | null;
}
export interface GiveawayState {
  nextDrawAt: string;
  timeZone: 'Asia/Yekaterinburg';
  latestDraw: GiveawayDraw | null;
}
