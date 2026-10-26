<template>
  <v-dialog
    :model-value="dialogOpen"
    class="playground-overlay"
    max-width="416"
    :scrim="false"
    :transition="reducedMotion.matches ? false : 'slide-x-transition'"
    scroll-strategy="none"
    aria-labelledby="playground-title"
    @update:model-value="dialogOpen = false"
    @after-leave="afterClose"
    @after-enter="focusBoard"
  >
    <section class="playground-panel" @keydown="onKey">
      <header class="playground-header">
        <button
          v-if="backLabel"
          class="playground-icon playground-back"
          type="button"
          :aria-label="backLabel"
          @click="
            returnToPicker = true;
            dialogOpen = false;
          "
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="m14 6-6 6 6 6" />
          </svg>
        </button>
        <span class="playground-eyebrow">AVALON <span aria-hidden="true">/</span> PLAYGROUND</span>
        <button
          class="playground-icon playground-game-close"
          type="button"
          :aria-label="copy.close"
          @click="dialogOpen = false"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </header>
      <div class="playground-content">
        <div class="game-heading">
          <h2 id="playground-title">2048<span aria-hidden="true">.</span></h2>
          <span class="game-mark" aria-hidden="true">✦</span>
        </div>
        <p class="game-subtitle">{{ copy.title }}</p>
        <div class="game-toolbar">
          <div class="game-stat">
            <span>{{ copy.score }}</span
            ><strong>{{ format(state.score) }}</strong
            ><span v-if="scoreGain" :key="gainRevision" class="score-gain" aria-hidden="true">+{{ scoreGain }}</span>
          </div>
          <div class="game-stat game-best">
            <span>{{ copy.best }}</span
            ><strong>{{ format(state.best) }}</strong>
          </div>
          <button type="button" class="game-new" :aria-label="copy.newGame" :title="copy.newGame" @click="requestReset">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <path d="M20 7v5h-5M20 12a8 8 0 1 0-2.3 5.7M20 12l-4-4" />
            </svg>
          </button>
        </div>
        <div
          ref="board"
          class="puzzle-2048-board"
          tabindex="0"
          role="group"
          :aria-label="copy.board"
          aria-describedby="game-board-state"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="cancelPointer"
          @lostpointercapture="cancelPointer"
          @contextmenu.prevent
          @dragstart.prevent
        >
          <span id="game-board-state" class="game-sr-only">{{ boardText }}</span>
          <div class="board-cells" aria-hidden="true"><span v-for="cell in 16" :key="cell" /></div>
          <div class="board-tiles" aria-hidden="true">
            <div v-for="tile in rendered" :key="tile.id" class="game-tile" :style="tileStyle(tile)">
              <div
                class="tile-face"
                :class="[
                  `tile-${Math.min(tile.value, 2048)}`,
                  {
                    'tile-born': bornIDs.includes(tile.id),
                    'tile-merged': mergedIDs.includes(tile.id),
                    'tile-long': tile.value >= 1024,
                  },
                ]"
              >
                <svg
                  class="tile-carving"
                  viewBox="0 0 100 100"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.3"
                  aria-hidden="true"
                >
                  <g v-for="angle in [0, 90, 180, 270]" :key="angle" :transform="`rotate(${angle} 50 50)`">
                    <path d="M5 27V5h22M5 13h8V5m0 15h7v-7h-7v7Zm7-7 5-5M9 24l4-4" />
                  </g>
                </svg>
                <svg
                  v-if="tile.value >= 2048"
                  class="tile-grail"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M5 4h14l-1 6a6 6 0 0 1-12 0L5 4Zm7 12v5m-5 0h10M5 6H2v2a5 5 0 0 0 5 5M19 6h3v2a5 5 0 0 1-5 5"
                  />
                </svg>
                <span>{{ tile.value }}</span>
              </div>
            </div>
          </div>
          <Transition name="game-message">
            <div v-if="message" class="game-end" role="group" :aria-label="message.title">
              <span class="end-mark" aria-hidden="true">{{ won && !confirmReset ? '✦' : '2048' }}</span>
              <h3>{{ message.title }}</h3>
              <p>{{ message.text }}</p>
              <button class="game-primary" type="button" @click="messageAction">{{ message.action }}</button>
              <button
                v-if="confirmReset"
                class="game-secondary"
                type="button"
                @click="
                  confirmReset = false;
                  focusBoard();
                "
              >
                {{ copy.cancel }}
              </button>
            </div>
          </Transition>
        </div>
        <p class="game-hint">{{ copy.hint }}</p>
        <div class="game-controls" :aria-label="copy.keys">
          <button
            v-for="direction in moveControls"
            :key="direction.name"
            type="button"
            :aria-label="copy[direction.name]"
            :disabled="!!message"
            @click="move(direction.name)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              :style="{ transform: `rotate(${direction.angle}deg)` }"
              aria-hidden="true"
            >
              <path d="M12 19V5m-6 6 6-6 6 6" />
            </svg>
          </button>
        </div>
        <span class="game-key-hint">{{ copy.keys }}</span>
      </div>
      <footer class="playground-footer" :class="{ 'save-warning': !stored }">
        <svg v-if="stored" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <path d="m7 12 3 3 7-7" />
          <rect x="4" y="3" width="16" height="18" rx="4" />
        </svg>
        <span>{{ stored ? copy.saved : copy.unsaved }}</span>
      </footer>
      <p class="game-sr-only" aria-live="polite" aria-atomic="true">{{ statusText }}</p>
    </section>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { canMove, createGame, loadGame, moveTiles, saveGame, spawnTile, swipeDirection } from './game2048';
import type { Direction, Game2048, Tile } from './game2048';
import { copy2048 } from './messages2048';
defineProps<{ backLabel?: string }>();
const emit = defineEmits<{ (event: 'close'): void; (event: 'back'): void }>();
let returnToPicker = false;
function afterClose() {
  if (returnToPicker) emit('back');
  else emit('close');
}
const { locale } = useI18n();
const copy = computed(() => copy2048(locale.value));
const board = ref<HTMLElement>();
const dialogOpen = ref(true);
let localStore: Storage | undefined;
try {
  localStore = window.localStorage;
} catch {
  /* Private browsing can deny access to the browser store itself. */
}
const state = ref<Game2048>((localStore && loadGame(localStore)) || createGame());
const stored = ref(true);
const persist = () => {
  stored.value = !!localStore && saveGame(localStore, state.value);
};
persist();
const rendered = ref<Tile[]>(state.value.tiles);
const bornIDs = ref<number[]>([]),
  mergedIDs = ref<number[]>([]);
const confirmReset = ref(false),
  animating = ref(false),
  scoreGain = ref(0),
  gainRevision = ref(0);
let queued: Direction | null = null;
let frame = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const won = computed(() => state.value.tiles.some((tile) => tile.value >= 2048) && !state.value.continued);
const over = computed(() => !canMove(state.value.tiles));
const message = computed(() => {
  if (animating.value) return null;
  if (confirmReset.value) return { title: copy.value.reset, text: copy.value.resetText, action: copy.value.resetYes };
  if (won.value) return { title: copy.value.won, text: copy.value.wonText, action: copy.value.keep };
  if (over.value) return { title: copy.value.over, text: copy.value.overText, action: copy.value.again };
  return null;
});
const format = (value: number) => new Intl.NumberFormat(locale.value).format(value);
const boardText = computed(() =>
  Array.from({ length: 4 }, (_, row) =>
    Array.from(
      { length: 4 },
      (_, col) => state.value.tiles.find((tile) => tile.row === row && tile.col === col)?.value || 0,
    ).join(', '),
  ).join('; '),
);
const statusText = computed(
  () => `${copy.value.score}: ${state.value.score}. ${boardText.value}. ${message.value?.title || ''}`,
);
const moveControls: { name: Direction; angle: number }[] = [
  { name: 'left', angle: -90 },
  { name: 'up', angle: 0 },
  { name: 'down', angle: 180 },
  { name: 'right', angle: 90 },
];
const tileStyle = (tile: Tile) => ({
  transform: `translate(calc(${tile.col} * (100% + var(--board-gap))), calc(${tile.row} * (100% + var(--board-gap))))`,
});
const focusBoard = () => nextTick(() => board.value?.focus({ preventScroll: true }));

function move(direction: Direction) {
  if (confirmReset.value || won.value || over.value) return;
  if (animating.value) {
    queued = direction;
    return;
  }
  const result = moveTiles(state.value, direction);
  if (!result.changed) return;
  bornIDs.value = [];
  mergedIDs.value = [];
  animating.value = true;
  rendered.value = result.sliding;
  // Commit and save the final board immediately, even if the panel closes mid-animation.
  state.value = spawnTile(result.state);
  persist();
  scoreGain.value = result.gain;
  gainRevision.value++;
  timer = setTimeout(
    () => {
      rendered.value = state.value.tiles;
      mergedIDs.value = result.mergedIDs;
      bornIDs.value = [state.value.nextID - 1];
      animating.value = false;
      const pending = queued;
      queued = null;
      if (pending) nextTick(() => move(pending));
    },
    reducedMotion.matches ? 0 : 130,
  );
}
function requestReset() {
  if (animating.value) return;
  if (state.value.score || state.value.tiles.length > 2) confirmReset.value = true;
  else reset();
}
function reset() {
  clearTimeout(timer);
  cancelAnimationFrame(frame);
  queued = null;
  animating.value = false;
  confirmReset.value = false;
  scoreGain.value = 0;
  state.value = createGame(state.value.best);
  rendered.value = state.value.tiles;
  bornIDs.value = state.value.tiles.map((t) => t.id);
  mergedIDs.value = [];
  persist();
  void focusBoard();
}
function messageAction() {
  if (won.value && !confirmReset.value) {
    state.value = { ...state.value, continued: true };
    persist();
    void focusBoard();
  } else reset();
}
function onKey(event: KeyboardEvent) {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable="true"]'))
  )
    return;
  const key = event.key.toLowerCase();
  const direction = (
    {
      arrowleft: 'left',
      a: 'left',
      arrowright: 'right',
      d: 'right',
      arrowup: 'up',
      w: 'up',
      arrowdown: 'down',
      s: 'down',
    } as Record<string, Direction>
  )[key];
  if (direction) {
    event.preventDefault();
    event.stopPropagation();
    move(direction);
  }
}
let pointer: { id: number; x: number; y: number; threshold: number; consumed: boolean } | null = null;
function onPointerDown(event: PointerEvent) {
  if (!event.isPrimary || pointer) {
    cancelPointer();
    return;
  }
  if (event.button !== 0 || message.value || (event.target as HTMLElement).closest('button')) return;
  pointer = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    threshold: Math.max(22, (board.value?.clientWidth || 320) * 0.06),
    consumed: false,
  };
  board.value?.setPointerCapture(event.pointerId);
  void focusBoard();
}
function onPointerMove(event: PointerEvent) {
  if (!pointer || pointer.id !== event.pointerId || pointer.consumed) return;
  const direction = swipeDirection(event.clientX - pointer.x, event.clientY - pointer.y, pointer.threshold);
  if (direction) {
    pointer.consumed = true;
    move(direction);
  }
}
function onPointerUp(event: PointerEvent) {
  if (pointer?.id !== event.pointerId) return;
  onPointerMove(event);
  cancelPointer();
}
function cancelPointer() {
  pointer = null;
}
onBeforeUnmount(() => {
  clearTimeout(timer);
  cancelAnimationFrame(frame);
  queued = null;
  cancelPointer();
});
</script>

<style scoped lang="scss">
.playground-panel {
  --board-gap: 9px;
  --game-frame-space: 88px;
  --game-ease: cubic-bezier(0.23, 1, 0.32, 1);
  color: rgb(var(--v-theme-text-primary));
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 22px;
  box-shadow:
    0 16px 64px #142b4029,
    0 2px 8px #142b4010;
  overflow-y: auto;
  overscroll-behavior: contain;
  max-height: calc(100dvh - 88px);
}
.playground-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 2px 24px;
}
.playground-eyebrow {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: rgb(var(--v-theme-text-secondary));
  span {
    margin: 0 7px;
    opacity: 0.5;
  }
}
.playground-icon,
.game-new {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  flex-shrink: 0;
}
svg {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}
button {
  cursor: pointer;
  touch-action: manipulation;
  transition:
    background-color 120ms ease,
    transform 120ms var(--game-ease);
}
button:active {
  transform: scale(0.96);
}
button:focus-visible,
.puzzle-2048-board:focus-visible {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: 4px;
}
button:disabled {
  opacity: 0.4;
  cursor: default;
}
.playground-content {
  padding: 0 24px 22px;
}
.game-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  h2 {
    font-size: 70px;
    font-weight: 850;
    line-height: 1.12;
    letter-spacing: -0.07em;
    span {
      color: #b58333;
    }
  }
}
.game-mark {
  display: grid;
  place-items: center;
  margin-right: 5px;
  width: 52px;
  height: 52px;
  font-size: 42px;
  color: #aa803e;
}
.game-subtitle {
  color: rgb(var(--v-theme-text-secondary));
  font-size: 14px;
  margin: 4px 0 22px;
}
.game-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  align-items: center;
}
.game-stat {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgb(var(--v-theme-inset-hover));
  min-width: 0;
  > span:first-child {
    font-size: 11px;
    font-weight: 650;
    color: rgb(var(--v-theme-text-secondary));
  }
  strong {
    font-size: 23px;
    font-weight: 750;
    line-height: 1.3;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
}
.game-best {
  background: rgb(var(--v-theme-support-surface));
  strong {
    color: rgb(var(--v-theme-support-accent));
  }
}
.game-new {
  border: 1px solid rgb(var(--v-theme-surface-border));
  width: 46px;
  height: 58px;
}
.puzzle-2048-board {
  position: relative;
  aspect-ratio: 1;
  container-type: inline-size;
  width: 100%;
  background-color: #233b3d;
  background-image: linear-gradient(#183134ce, #183134ce), url('@/assets/images/playground/runestone.webp');
  background-size:
    auto,
    192px 192px;
  border: 2px solid #967744;
  box-shadow:
    inset 0 0 0 2px #152c2e,
    inset 0 0 0 4px #a0834860,
    0 2px 5px #182b3020;
  border-radius: 16px;
  padding: 11px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  outline: none;
}
.puzzle-2048-board::before {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1px solid #ac8b4b85;
  border-radius: 10px;
  pointer-events: none;
}
.board-cells,
.board-tiles {
  position: absolute;
  inset: 11px;
}
.board-cells {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--board-gap);
  span {
    border-radius: 9px;
    background: #102b2e55;
    border: 1px solid #b397543b;
    box-shadow: inset 0 1px 5px #071a1f55;
  }
}
.board-tiles {
  pointer-events: none;
}
.game-tile {
  position: absolute;
  width: calc((100% - 3 * var(--board-gap)) / 4);
  height: calc((100% - 3 * var(--board-gap)) / 4);
  transition: transform 130ms var(--game-ease);
}
.tile-face {
  --stone-color: #d7d0be;
  --stone-ink: #263b3e;
  --stone-rim: #858679;
  position: relative;
  isolation: isolate;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--stone-rim);
  border-radius: 8px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(18px, 9cqw, 34px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.065em;
  color: var(--stone-ink);
  background-color: var(--stone-color);
  background-image: linear-gradient(145deg, #ffffff28, transparent 45%, #00000020);
  box-shadow:
    inset 0 1px 1px #ffffff85,
    inset 0 -2px 1px #00000045,
    0 2px 3px #071c2660;
  > span {
    z-index: 2;
    text-shadow: 0 1px 1px #00000045;
  }
}
.tile-face::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: url('@/assets/images/playground/runestone.webp') center / 100% 100%;
  mix-blend-mode: soft-light;
  opacity: 0.55;
  pointer-events: none;
}
.tile-face::after {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid var(--stone-rim);
  border-radius: 5px;
  opacity: 0.55;
  pointer-events: none;
}
.tile-2 > span,
.tile-4 > span {
  text-shadow:
    0 1px 0 #ffffff85,
    0 -1px 0 #00000025;
}
.tile-4 {
  --stone-color: #c1c2b5;
  --stone-rim: #7e867c;
}
.tile-8 {
  --stone-color: #566c77;
  --stone-ink: #f4e8cf;
  --stone-rim: #a9b1a0;
}
.tile-16 {
  --stone-color: #405d68;
  --stone-ink: #f5e7cc;
  --stone-rim: #8fa798;
}
.tile-32 {
  --stone-color: #2f4d58;
  --stone-ink: #f5e7cc;
  --stone-rim: #849b8d;
}
.tile-64 {
  --stone-color: #203e44;
  --stone-ink: #f5e7cc;
  --stone-rim: #ac8b4b;
}
.tile-128 {
  --stone-color: #605c49;
  --stone-ink: #ffdf8d;
  --stone-rim: #ae945a;
}
.tile-256 {
  --stone-color: #484936;
  --stone-ink: #f0ce80;
  --stone-rim: #bc9b51;
}
.tile-512 {
  --stone-color: #304544;
  --stone-ink: #eec66d;
  --stone-rim: #b7954b;
}
.tile-1024 {
  --stone-color: #203738;
  --stone-ink: #f0cc7b;
  --stone-rim: #c9a653;
}
.tile-2048 {
  --stone-color: #193335;
  --stone-ink: #ffe5a3;
  --stone-rim: #ddbd6c;
  box-shadow:
    inset 0 1px 1px #fff0bd70,
    inset 0 0 0 3px #bea05d35,
    0 0 12px #d1a74545;
  > span {
    transform: translateY(-12%);
  }
}
.tile-long {
  font-size: clamp(14px, 7cqw, 27px);
}
.tile-carving {
  position: absolute;
  inset: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  color: var(--stone-rim);
  opacity: 0.85;
  pointer-events: none;
}
.tile-grail {
  position: absolute;
  width: 24%;
  height: 24%;
  bottom: 6%;
  color: var(--stone-ink);
  opacity: 0.8;
  pointer-events: none;
}
.tile-born {
  animation: tile-arrive 160ms var(--game-ease) both;
}
.tile-merged {
  animation: tile-combine 180ms var(--game-ease) both;
}
@keyframes tile-arrive {
  from {
    opacity: 0;
    transform: scale(0.88);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes tile-combine {
  0% {
    transform: scale(0.96);
  }
  45% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
.score-gain {
  position: absolute;
  right: 10px;
  top: 20px;
  color: rgb(var(--v-theme-primary));
  font-weight: 750;
  font-size: 16px;
  animation: score-rise 280ms var(--game-ease) both;
}
@keyframes score-rise {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-32px);
  }
}
.game-hint {
  font-size: 13px;
  line-height: 1.6;
  color: rgb(var(--v-theme-text-secondary));
  margin: 18px 0 14px;
}
.game-controls {
  display: flex;
  justify-content: center;
  gap: 9px;
  button {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 1px solid rgb(var(--v-theme-surface-border));
    border-radius: 10px;
  }
}
.game-key-hint {
  display: block;
  text-align: center;
  margin-top: 8px;
  font-size: 11px;
  color: rgb(var(--v-theme-text-secondary));
}
.playground-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-top: 1px solid rgb(var(--v-theme-surface-border));
  padding: 14px 20px;
  font-size: 11px;
  color: rgb(var(--v-theme-text-secondary));
  svg {
    width: 16px;
    height: 16px;
  }
}
.save-warning {
  color: rgb(var(--v-theme-support-accent));
}
.game-end {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  background: rgba(var(--v-theme-surface), 0.95);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  h3 {
    font-size: 23px;
    line-height: 1.2;
    letter-spacing: -0.03em;
  }
  p {
    font-size: 13px;
    color: rgb(var(--v-theme-text-secondary));
    line-height: 1.5;
  }
}
.end-mark {
  color: rgb(var(--v-theme-support-accent));
  font-size: 30px;
  font-weight: 800;
}
.game-primary,
.game-secondary {
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 650;
}
.game-primary {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.game-secondary {
  border: 1px solid rgb(var(--v-theme-surface-border));
}
.game-message-enter-active,
.game-message-leave-active {
  transition: opacity 180ms var(--game-ease);
}
.game-message-enter-from,
.game-message-leave-to {
  opacity: 0;
}
.game-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
:global(.v-theme--darkTheme .puzzle-2048-board) {
  background-color: #162c30;
}
:global(.v-theme--darkTheme .board-cells span) {
  background: #0e252855;
}
@media (hover: hover) and (pointer: fine) {
  .playground-icon:hover,
  .game-new:hover,
  .game-controls button:hover,
  .game-secondary:hover {
    background: rgb(var(--v-theme-inset-hover));
  }
}
@media (max-width: 480px) {
  .playground-panel {
    --game-frame-space: 24px;
    max-height: calc(100dvh - 24px);
    border-radius: 20px;
  }
  .playground-content {
    padding: 0 20px 18px;
  }
  .playground-header {
    padding-left: 20px;
  }
  .game-heading h2 {
    font-size: 60px;
  }
  .game-subtitle {
    margin-bottom: 16px;
  }
}
@media (max-height: 740px) {
  .game-heading h2 {
    font-size: 48px;
  }
  .game-subtitle {
    margin-bottom: 12px;
  }
  .game-toolbar {
    margin-bottom: 12px;
  }
  .game-key-hint {
    display: none;
  }
  .playground-footer {
    padding: 10px 16px;
  }
}
// Keep the complete game in view on laptop screens and when browser zoom reduces the viewport.
@media (max-height: 900px) {
  .game-heading h2 {
    font-size: 48px;
  }
  .game-subtitle,
  .game-hint {
    display: none;
  }
  .playground-content {
    padding-bottom: 16px;
  }
  .game-toolbar {
    margin-bottom: 12px;
  }
  .puzzle-2048-board {
    width: min(100%, max(200px, calc(100dvh - var(--game-frame-space) - 330px)));
    min-height: 0;
    margin-inline: auto;
  }
  .game-controls {
    margin-top: 14px;
  }
  .playground-footer {
    padding: 10px 16px;
  }
  .game-end {
    padding: 12px;
    gap: 8px;
    h3 {
      font-size: 20px;
    }
    p {
      font-size: 12px;
    }
  }
  .end-mark {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .game-tile {
    transition: none;
  }
  .tile-born,
  .tile-merged,
  .score-gain {
    animation: none;
  }
  .score-gain {
    display: none;
  }
  button {
    transition: background-color 120ms ease;
  }
  button:active {
    transform: none;
  }
}
</style>
<style lang="scss">
.playground-overlay {
  align-items: flex-start;
  justify-content: flex-start;
}
.playground-overlay > .v-overlay__content {
  margin: 64px 16px 16px;
  max-height: calc(100dvh - 80px);
}
@media (max-width: 480px) {
  .playground-overlay > .v-overlay__content {
    width: calc(100% - 24px);
    max-width: 416px !important;
    margin: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
    max-height: calc(100dvh - 24px);
  }
}
</style>
