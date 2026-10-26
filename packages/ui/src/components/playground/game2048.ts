export type Direction = 'left' | 'right' | 'up' | 'down';
export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
}
export interface Game2048 {
  tiles: Tile[];
  score: number;
  best: number;
  nextID: number;
  continued: boolean;
}
export const STORAGE_KEY = 'avalon.playground.2048.v1';

export function spawnTile(state: Game2048, random = Math.random): Game2048 {
  const empty = Array.from({ length: 16 }, (_, index) => ({ row: Math.floor(index / 4), col: index % 4 })).filter(
    (cell) => !state.tiles.some((tile) => tile.row === cell.row && tile.col === cell.col),
  );
  if (!empty.length) return state;
  const cell = empty[Math.floor(random() * empty.length)];
  return {
    ...state,
    nextID: state.nextID + 1,
    tiles: [...state.tiles, { ...cell, id: state.nextID, value: random() < 0.9 ? 2 : 4 }],
  };
}

export function createGame(best = 0, random = Math.random): Game2048 {
  return spawnTile(spawnTile({ tiles: [], score: 0, best, nextID: 1, continued: false }, random), random);
}

// Keep slide paths separate from the final board so both source tiles visibly meet before merging.
export function moveTiles(state: Game2048, direction: Direction) {
  const horizontal = direction === 'left' || direction === 'right';
  const reverse = direction === 'right' || direction === 'down';
  const tiles: Tile[] = [],
    sliding: Tile[] = [],
    mergedIDs: number[] = [];
  let nextID = state.nextID,
    gain = 0;
  const position = (line: number, slot: number) => {
    const index = reverse ? 3 - slot : slot;
    return horizontal ? { row: line, col: index } : { row: index, col: line };
  };
  for (let line = 0; line < 4; line++) {
    const source = state.tiles
      .filter((tile) => (horizontal ? tile.row : tile.col) === line)
      .sort((a, b) => (reverse ? -1 : 1) * (horizontal ? a.col - b.col : a.row - b.row));
    let slot = 0;
    for (let i = 0; i < source.length; i++, slot++) {
      const tile = source[i],
        target = position(line, slot),
        partner = source[i + 1];
      sliding.push({ ...tile, ...target });
      if (partner?.value === tile.value) {
        sliding.push({ ...partner, ...target });
        const merged = { ...target, id: nextID++, value: tile.value * 2 };
        tiles.push(merged);
        mergedIDs.push(merged.id);
        gain += merged.value;
        i++;
      } else tiles.push({ ...tile, ...target });
    }
  }
  const changed = sliding.some((tile) => {
    const before = state.tiles.find((old) => old.id === tile.id)!;
    return tile.row !== before.row || tile.col !== before.col;
  });
  return {
    changed,
    sliding,
    mergedIDs,
    gain,
    state: changed
      ? { ...state, tiles, nextID, score: state.score + gain, best: Math.max(state.best, state.score + gain) }
      : state,
  };
}

export function canMove(tiles: Tile[]): boolean {
  return (
    tiles.length < 16 ||
    tiles.some((tile) =>
      tiles.some(
        (other) => tile.value === other.value && Math.abs(tile.row - other.row) + Math.abs(tile.col - other.col) === 1,
      ),
    )
  );
}

export function swipeDirection(dx: number, dy: number, threshold: number): Direction | null {
  const x = Math.abs(dx),
    y = Math.abs(dy);
  if (Math.max(x, y) < threshold || Math.max(x, y) < Math.min(x, y) * 1.2) return null;
  return x > y ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}

export function parseSaved(raw: string | null): Game2048 | null {
  try {
    const data = JSON.parse(raw || 'null');
    const integer = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
    if (
      !data ||
      data.version !== 1 ||
      !Array.isArray(data.tiles) ||
      !data.tiles.length ||
      data.tiles.length > 16 ||
      !integer(data.score) ||
      !integer(data.best) ||
      typeof data.continued !== 'boolean'
    )
      return null;
    const tiles: Tile[] = data.tiles;
    if (
      !tiles.every(
        (t) =>
          t &&
          integer(t.id) &&
          t.id > 0 &&
          t.id < Number.MAX_SAFE_INTEGER - 16 &&
          integer(t.row) &&
          t.row < 4 &&
          integer(t.col) &&
          t.col < 4 &&
          integer(t.value) &&
          t.value >= 2 &&
          Number.isInteger(Math.log2(t.value)),
      ) ||
      new Set(tiles.map((t) => t.id)).size !== tiles.length ||
      new Set(tiles.map((t) => t.row * 4 + t.col)).size !== tiles.length
    )
      return null;
    return {
      tiles: tiles.map(({ id, value, row, col }) => ({ id, value, row, col })),
      score: data.score,
      best: Math.max(data.best, data.score),
      nextID: Math.max(...tiles.map((t) => t.id)) + 1,
      continued: data.continued,
    };
  } catch {
    return null;
  }
}

export function loadGame(localStore: Pick<Storage, 'getItem'>): Game2048 | null {
  try {
    return parseSaved(localStore.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}
export function saveGame(localStore: Pick<Storage, 'setItem'>, state: Game2048): boolean {
  try {
    localStore.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...state }));
    return true;
  } catch {
    return false;
  }
}
