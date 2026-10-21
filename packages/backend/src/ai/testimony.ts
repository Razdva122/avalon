import type { BotRequest } from './client';

export function humanSeatNumbers(request: BotRequest): number[] {
  return (request.humanPlayerIDs ?? (request.humanPlayerID ? [request.humanPlayerID] : []))
    .map((id) => request.state.players.find((p) => p.id === id)?.index)
    .filter((n): n is number => n !== undefined);
}

/** Select verbatim testimony; importance comes from the model, never keyword matching. */
export function humanTestimony(request: BotRequest, humanSeats: number[], omitChat: boolean) {
  const recent = new Set(omitChat ? [] : request.chat.slice(-14));
  const prefixes = request.chat.map((message) => message.id?.slice(0, 8));
  const humans = request.chat
    .map((message, index) => ({
      message,
      position: index,
      // Stable across the room's rolling chat window; expand a colliding prefix instead of guessing.
      id: request.readAllChat
        ? index + 1
        : message.id
          ? prefixes.indexOf(prefixes[index]) === prefixes.lastIndexOf(prefixes[index])
            ? message.id.slice(0, 8)
            : message.id
          : index + 1,
    }))
    .filter(({ message }) => humanSeats.includes(Number(message.name)));
  const candidates = new Map(humans.filter(({ message }) => !recent.has(message)).map((item) => [item.id, item]));
  // Match the old first-eight/last-sixteen budget, including JSON and metadata, on this exact request.
  const legacy = humans
    .filter((_, i) => i < 8 || i >= humans.length - 16)
    .filter(({ message }) => !recent.has(message))
    .map(({ message }) => ({ by: Number(message.name), text: message.text.slice(0, 2000), status: 'claim' }));
  const budget = Buffer.byteLength(JSON.stringify(legacy));
  const selected = new Map<string | number, { id: string | number; by: number; text: string }>();
  const add = (ids: (string | number)[]) => {
    const rows = ids.flatMap((id) => {
      const item = candidates.get(id);
      return item && !selected.has(id)
        ? [{ id, by: Number(item.message.name), text: item.message.text.slice(0, 2000) }]
        : [];
    });
    if (Buffer.byteLength(JSON.stringify([...selected.values(), ...rows])) > budget) return false;
    for (const row of rows) selected.set(row.id, row);
    return true;
  };
  const groups: (string | number)[][] = [];
  for (const group of request.humanMemory || []) {
    // Room chat can shift after 1000 messages. Resolve saved identities again, never reuse an old offset.
    const items = group.map((message) =>
      humans.find((item) => (message.id ? item.message.id === message.id : item.message === message)),
    );
    if (items.some((item) => !item)) continue;
    const ids = [...new Set(items.map((item) => item!.id))];
    // Overlapping notes form one component: another note cannot detach an original from its correction.
    for (let index = groups.length - 1; index >= 0; index--) {
      if (groups[index].some((id) => ids.includes(id))) ids.push(...groups.splice(index, 1)[0]);
    }
    groups.push([...new Set(ids)]);
  }
  let remembered = 0;
  const excluded = new Set<string | number>();
  for (const ids of groups.reverse()) {
    const extra = ids.filter((id) => candidates.has(id) && !selected.has(id)).length;
    // Keep a correction or position change together, or leave the entire group out.
    if (remembered + extra <= 8 && add(ids)) remembered += extra;
    else for (const id of ids) excluded.add(id);
  }
  for (const { id } of humans.slice(-16).reverse()) if (!excluded.has(id)) add([id]);
  return [...selected.values()].sort((a, b) => candidates.get(a.id)!.position - candidates.get(b.id)!.position);
}

/** Numbers are local to this exact input; persisted anchors always use original message identities. */
export function numericTestimonySource(request: BotRequest, refs: unknown, author: number): string {
  if (!Array.isArray(refs) || !refs.length || refs.length > 8) throw new Error('Invalid testimony references');
  const humans = humanSeatNumbers(request);
  const omitChat = ['end', 'assassinate'].includes(request.state.stage);
  const rows = request.state.stage === 'onMission' ? [] : humanTestimony(request, humans, omitChat);
  const historical: number[] = [],
    recent: number[] = [];
  for (const ref of new Set(refs)) {
    if (!Number.isInteger(ref) || ref === 0) throw new Error('Invalid testimony reference');
    const message =
      ref < 0
        ? omitChat
          ? undefined
          : request.chat.slice(-14)[-ref - 1]
        : rows.some((row) => row.id === ref)
          ? request.chat[ref - 1]
          : undefined;
    if (!message || !humans.includes(Number(message.name)) || Number(message.name) !== author)
      throw new Error('Testimony reference is not a visible statement by its author');
    if (ref < 0) recent.push(-ref);
    else historical.push(ref);
  }
  return [historical.length ? `chat:${historical.join(',')}` : '', recent.length ? `recent:${recent.join(',')}` : '']
    .filter(Boolean)
    .join(';');
}
