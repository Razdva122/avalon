export const WIDTH = 320;
export const HEIGHT = 410;
export const JUMP_STEP = 1 / 120;
export const SURGE_DURATION = 0.95;
export const MORDRED_DURATION = 15;
export const MORDRED_TRANSITION = 3;
const JUMP = 490;
const RUNE_JUMP = 1080;
const GRAVITY = 1150;
const STEER_SPEED = 228;
const MAX_RISE = Math.floor(((JUMP * JUMP) / (2 * GRAVITY)) * 0.84);
const DIFFICULTY_START_Y = 720;
const DIFFICULTY_MAX_Y = 15000;
const MORDRED_BASE_HEIGHT = 1000;
const FIRST_WOOD_Y = 2200;
const WOOD_PEAK_Y = 10000;
const MIN_RUNE_SPACING = 750;

type Rune = { x: number; y: number };
export type Ledge = {
  x: number;
  y: number;
  width: number;
  kind: 'stone' | 'lily' | 'cracked' | 'wood';
  swing?: number;
  wornAt?: number;
  shatteredAt?: number;
  rune?: Rune;
};
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function mordredGap(random: () => number) {
  return 400 + Math.floor(random() * 401);
}

export function createRun(random = Math.random) {
  const run = {
    x: WIDTH / 2,
    y: 0,
    vy: JUMP,
    peak: 0,
    madeProgress: false,
    scrollY: 0,
    elapsed: 0,
    surge: 0,
    surgeOrigin: undefined as Rune | undefined,
    untilRune: 11 + Math.floor(random() * 4),
    nextMordredHeight: MORDRED_BASE_HEIGHT + mordredGap(random),
    mordredStartedAt: undefined as number | undefined,
    lastRuneY: 555,
    stoneStreak: 0,
    shortSteers: 0,
    over: false,
    ledges: [
      { x: 116, y: 0, width: 88, kind: 'stone' },
      { x: 185, y: 64, width: 84, kind: 'stone' },
      { x: 124, y: 129, width: 86, kind: 'stone' },
      { x: 52, y: 194, width: 84, kind: 'stone' },
      { x: 120, y: 259, width: 86, kind: 'stone' },
      { x: 179, y: 324, width: 82, kind: 'stone' },
      { x: 125, y: 389, width: 82, kind: 'stone' },
      { x: 61, y: 454, width: 80, kind: 'lily', swing: 18 },
      { x: 129, y: 521, width: 78, kind: 'stone', rune: { x: 112, y: 555 } },
      { x: 183, y: 587, width: 78, kind: 'stone' },
      { x: 123, y: 654, width: 78, kind: 'stone' },
      { x: 53, y: 722, width: 76, kind: 'cracked' },
    ] as Ledge[],
    random,
  };
  fillLedges(run);
  return run;
}

export type JumpRun = ReturnType<typeof createRun>;

export function ledgeX(ledge: Ledge, elapsed: number) {
  return ledge.x + (ledge.swing ?? 0) * Math.sin(elapsed * (2 + Math.min(ledge.y / 1300, 1.5)));
}

function centerOf(ledge: Ledge) {
  return ledge.x + ledge.width / 2;
}

function jumpTravel(rise: number) {
  return (STEER_SPEED * (JUMP + Math.sqrt(JUMP * JUMP - 2 * GRAVITY * rise))) / GRAVITY - 16;
}

function terrainMix(y: number) {
  const rising = clamp((y - DIFFICULTY_START_Y) / (WOOD_PEAK_Y - DIFFICULTY_START_Y), 0, 1);
  const late = clamp((y - WOOD_PEAK_Y) / (DIFFICULTY_MAX_Y - WOOD_PEAK_Y), 0, 1);
  const stone = 0.86 - 0.6 * rising - 0.16 * late;
  const lily = 0.1 + 0.19 * rising + 0.14 * late;
  const wood = 0.23 * clamp((y - FIRST_WOOD_Y) / (WOOD_PEAK_Y - FIRST_WOOD_Y), 0, 1) - 0.16 * late;
  return { stone, lily, wood };
}

function terrainKind(y: number, variety: number, stoneStreak: number): Ledge['kind'] {
  const { stone, lily, wood } = terrainMix(y);
  // Once wood starts receding, allow at most two consecutive stone ledges.
  const roll = y >= WOOD_PEAK_Y && stoneStreak >= 2 ? stone + variety * (1 - stone) : variety;
  if (roll < stone) return 'stone';
  if (roll < stone + lily) return 'lily';
  if (roll < stone + lily + wood) return 'wood';
  return 'cracked';
}

function placeRune(run: JumpRun, ledge: Ledge, side: number) {
  const y = ledge.y + 34;
  if (y - run.lastRuneY < MIN_RUNE_SPACING) return;
  const x = clamp(centerOf(ledge) + side * (ledge.width / 2 + 15), 14, WIDTH - 14);
  ledge.rune = { x, y };
  run.lastRuneY = y;
  run.untilRune = 13 + Math.floor(run.random() * 4);
}

function fillLedges(run: JumpRun) {
  let last = run.ledges[run.ledges.length - 1];
  while (last.y < run.scrollY + HEIGHT + 80) {
    const difficulty = clamp((last.y - DIFFICULTY_START_Y) / (DIFFICULTY_MAX_Y - DIFFICULTY_START_Y), 0, 1);
    const width = Math.round(76 - 30 * difficulty);
    const rise = Math.min(MAX_RISE, 61 + 21 * difficulty + run.random() * 6);
    const y = last.y + rise;
    const variety = run.random();
    const kind = last.y < FIRST_WOOD_Y && y >= FIRST_WOOD_Y ? 'wood' : terrainKind(y, variety, run.stoneStreak);
    run.stoneStreak = kind === 'stone' ? run.stoneStreak + 1 : 0;
    const swing = kind === 'lily' ? 16 + 14 * difficulty : 0;
    // Keep the next center reachable even when both lilies drift apart.
    const travel = jumpTravel(rise) - swing - (last.swing ?? 0);
    const maxOffset = Math.min(90 + 24 * difficulty, travel);
    const offset = (run.random() * 2 - 1) * maxOffset;
    const edge = 12 + width / 2 + swing;
    const lastCenter = centerOf(last);
    let center = clamp(lastCenter + offset, edge, WIDTH - edge);
    if (last.y >= 1560 && run.shortSteers >= 2 && Math.abs(center - lastCenter) < 35) {
      // Break up vertical chains, especially when repeated offsets clamp against a side.
      const inward = lastCenter < WIDTH / 2 ? 1 : -1;
      center = clamp(lastCenter + inward * Math.min(72, maxOffset), edge, WIDTH - edge);
    }
    run.shortSteers = Math.abs(center - lastCenter) < 35 ? run.shortSteers + 1 : 0;
    last = { x: center - width / 2, y, width, kind, swing };
    if (--run.untilRune <= 0) placeRune(run, last, center < WIDTH / 2 ? 1 : -1);
    run.ledges.push(last);
  }
}

export function height(run: JumpRun) {
  return run.madeProgress ? Math.floor(run.peak / 10) : 0;
}

export function mordredTime(run: JumpRun) {
  if (run.mordredStartedAt === undefined) return 0;
  return clamp(run.mordredStartedAt + MORDRED_DURATION - run.elapsed, 0, MORDRED_DURATION);
}

export function mordredFocus(seconds: number) {
  return clamp(Math.min(MORDRED_DURATION - seconds, seconds) / MORDRED_TRANSITION, 0, 1);
}

function supportsSword(ledge: Ledge, x: number, elapsed: number) {
  const left = ledgeX(ledge, elapsed);
  return ledge.shatteredAt === undefined && x + 6 > left && x - 6 < left + ledge.width;
}

export function landingPreview(run: JumpRun) {
  if (run.vy >= 0 || run.over) return;
  // Advance applies gravity before moving. Match the same discrete step at the point of contact.
  const stepVelocity = run.vy - (GRAVITY * JUMP_STEP) / 2;
  for (let index = run.ledges.length - 1; index >= 0; index--) {
    const ledge = run.ledges[index];
    const drop = run.y - ledge.y;
    if (drop < 0) continue;
    const crossing = (stepVelocity + Math.sqrt(stepVelocity * stepVelocity + 2 * GRAVITY * drop)) / GRAVITY;
    const time = Math.max(1, Math.ceil(crossing / JUMP_STEP)) * JUMP_STEP;
    if (time > 0.36) return;
    if (supportsSword(ledge, run.x, run.elapsed + time)) return ledge;
  }
}

export function advance(run: JumpRun, dt: number, direction: number) {
  if (run.over) return;
  const previousY = run.y;
  run.elapsed += dt;
  run.surge = Math.max(0, run.surge - dt);
  run.x = clamp(run.x + direction * STEER_SPEED * dt, 10, WIDTH - 10);
  run.vy -= GRAVITY * dt;
  run.y += run.vy * dt;
  for (const ledge of run.ledges) {
    const rune = ledge.rune;
    if (rune && Math.hypot(run.x - rune.x, run.y + 16 - rune.y) < 19) {
      run.vy = RUNE_JUMP;
      run.madeProgress = true;
      run.surge = SURGE_DURATION;
      run.surgeOrigin = rune;
      delete ledge.rune;
      break;
    }
  }
  if (run.vy < 0) {
    const landing = run.ledges.find(
      (ledge) => run.y <= ledge.y && ledge.y <= previousY && supportsSword(ledge, run.x, run.elapsed),
    );
    if (landing) {
      run.y = landing.y;
      run.vy = JUMP;
      if (landing.y > 0) run.madeProgress = true;
      if (landing.kind === 'cracked' || landing.wornAt !== undefined) landing.shatteredAt = run.elapsed;
      else if (landing.kind === 'wood') landing.wornAt = run.elapsed;
    }
  }
  run.peak = Math.max(run.peak, run.y);
  const score = height(run);
  if (score >= run.nextMordredHeight && !mordredTime(run)) {
    run.mordredStartedAt = run.elapsed;
    run.nextMordredHeight = score + mordredGap(run.random);
  }
  run.scrollY = Math.max(run.scrollY, run.peak - 215);
  fillLedges(run);
  while (run.ledges[0].y < run.scrollY - 90) run.ledges.shift();
  run.over = run.y < run.scrollY - 84;
}
