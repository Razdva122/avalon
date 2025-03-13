export interface ISocketError {
  error: string;
}

export interface IRoomUnavailableError extends ISocketError {
  error: 'errorNotFound';
}

export interface ILoginError extends ISocketError {
  error: 'emailNotExist' | 'loginNotExist' | 'wrongPassword';
}

export interface IRegisterError extends ISocketError {
  error: 'emailAlreadyExist' | 'loginAlreadyExist';
}

export interface IUpdateEmailError extends ISocketError {
  error: 'emailAlreadyExist' | 'wrongPassword';
}

export interface IUpdateLoginError extends ISocketError {
  error: 'loginAlreadyExist' | 'wrongPassword';
}

export interface IUpdateAvatarError extends ISocketError {
  error: 'avatarNotExist' | 'avatarNotAvailable';
}

export interface IUpdatePasswordError extends ISocketError {
  error: 'wrongPassword';
}
