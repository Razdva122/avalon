export interface IAvatarInfo {
  id: string;
  available: boolean;
  premium?: boolean;
  info?: string;
}

export const PREMIUM_AVATAR_IDS = ['premium/puppeteer', 'premium/eclipse-queen'] as const;
