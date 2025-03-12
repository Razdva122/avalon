export type IBusEvents = {
  infoMessage: (message: string) => void;
  openAuthModal: () => void;
  openCredentialsModal: (type: 'email' | 'login' | 'password') => void;
};
