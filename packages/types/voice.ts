export type VoiceError = { error: 'unavailable' | 'forbidden' | 'rateLimited' | 'invalidRequest' };
export type VoiceState = { available: boolean; canJoin: boolean };
export type VoiceJoin = { url: string; token: string; sessionID: string };
