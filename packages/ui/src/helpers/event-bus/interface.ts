import type { AuthAction } from '@/helpers/acquisition';

export type IBusEvents = {
  infoMessage: (message: string) => void;
  openAuthModal: (resume?: () => void | Promise<void>, action?: AuthAction) => void;
  showRatingPanel: () => void;
  openCredentialsModal: (type: 'email' | 'login' | 'password') => void;
};
