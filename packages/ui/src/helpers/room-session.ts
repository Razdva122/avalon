import type { ChatMessage, ISocketError, Socket, TRoomState } from '@avalon/types';

/** Keep a room subscribed across reconnects and live-to-archive transitions. */
export function createRoomSession(
  socket: Pick<Socket, 'on' | 'off' | 'emitWithAck'>,
  roomID: () => string,
  receive: (state: TRoomState) => void,
  onError: (error: ISocketError) => void,
  onExpiredMissing: () => void,
  receiveChat: (messages: ChatMessage[]) => void,
) {
  let generation = 0;
  let loading = false;
  let buffered: TRoomState | undefined;
  let disposed = false;
  const load = async (id: string, expired = false) => {
    const current = ++generation;
    loading = true;
    buffered = undefined;
    try {
      const state = await socket.emitWithAck('joinRoom', id);
      if (disposed || current !== generation || id !== roomID()) return;
      if ('error' in state) {
        if (expired && state.error === 'errorNotFound') onExpiredMissing();
        else onError(state);
      } else {
        // A broadcast can arrive between subscription and the join acknowledgement.
        const update = buffered as TRoomState | undefined;
        const chat = update
          ? [
              ...new Map(
                [...state.chat, ...update.chat].map((entry) => [entry.id || JSON.stringify(entry), entry]),
              ).values(),
            ]
              .sort((a, b) => a.timestamp - b.timestamp)
              .slice(-1000)
          : state.chat;
        receive({ ...state, chat });
      }
    } catch {
      if (!disposed && current === generation && id === roomID()) onError({ error: 'requestFailed' });
    } finally {
      if (current === generation) {
        loading = false;
        buffered = undefined;
      }
    }
  };
  const updated = (state: TRoomState, chatOnly = false) => {
    if (state.roomID !== roomID()) return;
    if (loading) buffered = state;
    else if (chatOnly) receiveChat(state.chat);
    else receive(state);
  };
  const reconnect = () => load(roomID());
  const expired = (id: string) => (id === roomID() ? load(id, true) : Promise.resolve());
  socket.on('roomUpdated', updated);
  socket.on('connect', reconnect);
  socket.on('destroyRoom', expired);
  return {
    load,
    dispose() {
      disposed = true;
      generation++;
      socket.off('roomUpdated', updated);
      socket.off('connect', reconnect);
      socket.off('destroyRoom', expired);
    },
  };
}
