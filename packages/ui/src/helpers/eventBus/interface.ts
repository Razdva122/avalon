export interface IBusEvents {
  infoMessage: (message: string) => void;
}

type TEmit<T extends keyof IBusEvents = keyof IBusEvents> = (key: T, ...args: Parameters<IBusEvents[T]>) => boolean;
type TOn<T extends keyof IBusEvents = keyof IBusEvents> = (
  key: T,
  callback: (...args: Parameters<IBusEvents[T]>) => void,
) => void;

export interface IEventBus {
  emit: TEmit;
  on: TOn;
}
