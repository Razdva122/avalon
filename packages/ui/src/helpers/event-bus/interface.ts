export type IBusEvents = {
  infoMessage: (message: string) => void;
  openAuthModal: () => void;
  showRatingPanel: () => void;
  openCredentialsModal: (type: 'email' | 'login' | 'password') => void;
};
