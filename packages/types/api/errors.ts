export interface ISocketError {
  error: string;
}

export interface IRoomUnavailableError extends ISocketError {
  error: 'errorNotFound';
}
