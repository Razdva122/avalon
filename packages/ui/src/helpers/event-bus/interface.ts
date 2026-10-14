export type IBusEvents = {
  infoMessage: (message: string) => void;
  openAuthModal: (resume?: () => void | Promise<void>) => void;
  showRatingPanel: () => void;
  openCredentialsModal: (type: 'email' | 'login' | 'password') => void;
};
