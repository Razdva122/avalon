export interface ISocketError {
  error: string;
}

export interface IRoomUnavailableError extends ISocketError {
  error: 'errorNotFound';
}

export interface ILoginError extends ISocketError {
  error: 'emailNotExist' | 'wrongPassword';
}

export interface IRegisterError extends ISocketError {
  error: 'emailAlreadyExist';
}

export interface IUpdateEmailError extends ISocketError {
  error: 'emailAlreadyExist' | 'wrongPassword';
}

export interface IUpdatePasswordError extends ISocketError {
  error: 'wrongPassword';
}
