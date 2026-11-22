<template>
  <v-dialog
    :model-value="open"
    :scrim="false"
    :transition="false"
    scroll-strategy="none"
    max-width="var(--excalibur-max-width)"
    class="excalibur-overlay"
    aria-labelledby="excalibur-title"
    @update:model-value="close('close')"
    @after-enter="draw"
    @after-leave="returned ? emit('back') : emit('close')"
  >
    <section class="jump-panel" :class="{ 'jump-dark': isDark }" @keydown="keyDown" @keyup="keyUp">
      <header class="jump-header">
        <button type="button" class="jump-icon" :aria-label="backLabel" @click="close('back')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="m14 6-6 6 6 6" />
          </svg>
        </button>
        <span class="jump-eyebrow">AVALON <span aria-hidden="true">/</span> PLAYGROUND</span>
        <button type="button" class="jump-icon" :aria-label="copy.close" @click="close('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </header>
      <div class="jump-identity">
        <h2 id="excalibur-title">Excalibur Jump<span aria-hidden="true">.</span></h2>
        <p>{{ copy.lake }}</p>
      </div>
      <div class="jump-stats">
        <div class="jump-stat">
          <span>{{ copy.height }}</span> <strong data-jump-height>{{ format(score) }}</strong>
        </div>
        <div class="jump-stat jump-best">
          <span>{{ copy.best }}</span> <strong>{{ format(best) }}</strong>
        </div>
      </div>
      <div class="jump-field">
        <div ref="backdrop" class="jump-backdrop" aria-hidden="true"></div>
        <canvas
          ref="canvas"
          :width="WIDTH * 2"
          :height="HEIGHT * 2"
          tabindex="0"
          :aria-label="copy.controls"
          @pointerdown="beginFieldSteering"
          @pointermove="moveFieldSteering"
          @pointerup="release"
          @pointercancel="release"
          @lostpointercapture="release"
        />
        <div v-if="surging && mode === 'playing'" class="jump-surge" role="status">{{ copy.surge }}</div>
        <span class="jump-mordred-spoken" role="status">{{
          mordredSeconds && mode === 'playing' ? copy.mordredWarning : ''
        }}</span>
        <div
          v-if="mordredSeconds > MORDRED_DURATION - MORDRED_TRANSITION && mode === 'playing'"
          class="jump-mordred-title"
          aria-hidden="true"
        >
          Mordred is coming
        </div>
        <div v-if="mordredSeconds && mode === 'playing'" class="jump-mordred">
          <img :src="mordredPortrait" alt="" width="30" height="30" />
          <strong>{{ copy.mordred }}</strong>
          <span class="jump-mordred-time" role="timer">{{ format(mordredSeconds) }}{{ copy.seconds }}</span>
        </div>
        <div v-if="mode !== 'playing'" class="jump-message">
          <div class="jump-message-card">
            <div role="status" class="jump-message-title">{{ copy[mode] }}</div>
            <p v-if="mode === 'over'">{{ score ? copy.height + ' · ' + format(score) : copy.firstLedge }}</p>
            <p v-else-if="mode === 'ready'">
              {{ copy.hint }} <span class="jump-key-hint">{{ copy.keyHint }}</span>
              <span class="jump-touch-hint">{{ copy.touchHint }}</span>
            </p>
            <button type="button" class="jump-action" @click="start">{{ copy[action] }}</button>
          </div>
        </div>
      </div>
      <div class="jump-controls">
        <button
          v-for="(label, index) in [copy.left, copy.right]"
          :key="index"
          type="button"
          :class="index === 0 ? 'jump-left' : 'jump-right'"
          :aria-label="label"
          :disabled="mode !== 'playing'"
          @pointerdown="hold($event, index === 0 ? -1 : 1)"
          @lostpointercapture="release"
          @pointerup="release"
          @pointercancel="release"
        >
          {{ index === 0 ? '←' : '→' }}
        </button>
        <button type="button" class="jump-hold" :disabled="mode !== 'playing'" @click="pauseRun">
          {{ copy.pauseLabel }}
        </button>
      </div>
    </section>
  </v-dialog>
</template>

<script lang="ts">
import type { JumpRun, Ledge } from './excaliburJump';

// Keep the interrupted attempt in this tab while the playground panel is unmounted.
let savedRun: JumpRun | undefined;
let tabBest = 0;
const recordKey = 'avalon.playground.excalibur-jump.best';
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from 'vuetify';
import { getAvatarPathByID } from '@/helpers/images';
import {
  advance,
  createRun,
  height,
  HEIGHT,
  JUMP_STEP,
  landingPreview,
  ledgeX,
  MORDRED_DURATION,
  MORDRED_TRANSITION,
  mordredFocus,
  mordredTime,
  SURGE_DURATION,
  WIDTH,
} from './excaliburJump';

defineProps<{ backLabel: string }>();
const emit = defineEmits<{ (event: 'back'): void; (event: 'close'): void }>();
const { locale } = useI18n();
const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);
const copy = computed(() =>
  locale.value === 'ru'
    ? {
        lake: 'Озеро Владычицы',
        height: 'Высота',
        best: 'Рекорд',
        surge: 'Рывок!',
        mordred: 'Мордред',
        mordredWarning: 'Мордред приближается. Обзор сужается.',
        seconds: ' с',
        ready: 'Пробуждение меча',
        paused: 'Пауза',
        over: 'Меч вернулся в озеро',
        start: 'Начать',
        resume: 'Продолжить',
        retry: 'Ещё раз',
        pauseLabel: 'Пауза',
        close: 'Вернуться к столу',
        hint: 'Меч отскакивает сам. Ведите его к следующему уступу.',
        firstLedge: 'Цель первого прыжка — уступ справа.',
        keyHint: 'Удерживайте ← или →.',
        touchHint: 'Удерживайте левую или правую сторону поля.',
        controls: 'Поле Excalibur Jump. Используйте стрелки или удерживайте левую или правую сторону поля.',
        left: 'Двигаться влево',
        right: 'Двигаться вправо',
      }
    : {
        lake: 'Lake of the Lady',
        height: 'Height',
        best: 'Best',
        surge: 'Rune surge!',
        mordred: 'Mordred',
        mordredWarning: 'Mordred is coming. Your vision is narrowing.',
        seconds: 's',
        ready: 'Awaken the sword',
        paused: 'Paused',
        over: 'The sword returned to the lake',
        start: 'Start',
        resume: 'Resume',
        retry: 'Try again',
        pauseLabel: 'Pause',
        close: 'Return to table',
        hint: 'The sword bounces on its own. Steer it toward the next ledge.',
        firstLedge: 'Aim for the ledge on the right on your first jump.',
        keyHint: 'Hold ← or →.',
        touchHint: 'Hold either side of the playfield.',
        controls: 'Excalibur Jump playfield. Use the arrow keys or hold either side of the playfield.',
        left: 'Move left',
        right: 'Move right',
      },
);
const formatter = computed(() => new Intl.NumberFormat(locale.value));
const format = (value: number) => formatter.value.format(value);
const canvas = ref<HTMLCanvasElement>();
const backdrop = ref<HTMLElement>();
const open = ref(true);
const mode = ref<'ready' | 'paused' | 'playing' | 'over'>(savedRun ? (savedRun.over ? 'over' : 'paused') : 'ready');
const action = computed(() => (mode.value === 'over' ? 'retry' : mode.value === 'paused' ? 'resume' : 'start'));
let run = savedRun ?? createRun();
let returned = false;
let frame = 0;
let lastTime = 0;
let remaining = 0;
const keys = { ArrowLeft: -1, ArrowRight: 1, KeyA: -1, KeyD: 1 };
const pressed = new Set<keyof typeof keys>();
const pointers = new Map<number, number>();
const score = ref(height(run));
const surging = ref(run.surge > 0);
const mordredSeconds = ref(Math.ceil(mordredTime(run)));
const mordredPortrait = getAvatarPathByID('roles', 'mordred');
const best = ref(Math.max(score.value, tabBest));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let backdropOffset = 0;
const sprites = {
  stone: loadSprite(new URL('../../assets/images/playground/excalibur-stone.webp', import.meta.url).href),
  lily: loadSprite(new URL('../../assets/images/playground/excalibur-lily.webp', import.meta.url).href),
  cracked: loadSprite(new URL('../../assets/images/playground/excalibur-cracked.webp', import.meta.url).href),
  wood: loadSprite(new URL('../../assets/images/playground/excalibur-wood.webp', import.meta.url).href),
  woodDamaged: loadSprite(new URL('../../assets/images/playground/excalibur-wood-cracked.webp', import.meta.url).href),
  sword: loadSprite(new URL('../../assets/images/playground/excalibur-sword.webp', import.meta.url).href),
  rune: loadSprite(new URL('../../assets/images/playground/excalibur-rune.webp', import.meta.url).href),
};

function loadSprite(url: string) {
  const sprite = new Image();
  sprite.onload = () => {
    if (mode.value !== 'playing') draw();
  };
  sprite.src = url;
  return sprite;
}

function updateScore() {
  score.value = height(run);
  surging.value = run.surge > 0;
  mordredSeconds.value = Math.ceil(mordredTime(run));
  best.value = Math.max(best.value, score.value);
}

function saveRecord() {
  tabBest = Math.max(tabBest, best.value);
  try {
    const previous = Number(localStorage.getItem(recordKey));
    localStorage.setItem(recordKey, String(Math.max(tabBest, Number.isSafeInteger(previous) ? previous : 0)));
  } catch {
    // The tab still remembers the record when browser storage is unavailable.
  }
}

function stop() {
  cancelAnimationFrame(frame);
  pressed.clear();
  pointers.clear();
  saveRecord();
}

function pauseRun() {
  if (mode.value !== 'playing') return;
  mode.value = 'paused';
  stop();
  void nextTick(() => canvas.value?.parentElement?.querySelector('button')?.focus({ preventScroll: true }));
}

function close(target: 'back' | 'close') {
  if (!open.value) return;
  returned = target === 'back';
  pauseRun();
  open.value = false;
}

function tick(time: number) {
  if (mode.value !== 'playing') return;
  if (lastTime) remaining += Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;
  const direction = Math.sign(
    [...pressed].reduce((sum, key) => sum + keys[key], 0) +
      [...pointers.values()].reduce((sum, input) => sum + input, 0),
  );
  while (remaining >= JUMP_STEP && !run.over) {
    advance(run, JUMP_STEP, direction);
    remaining -= JUMP_STEP;
  }
  updateScore();
  draw();
  if (run.over) {
    mode.value = 'over';
    stop();
    void nextTick(() => canvas.value?.parentElement?.querySelector('button')?.focus({ preventScroll: true }));
    return;
  }
  frame = requestAnimationFrame(tick);
}

function start() {
  if (mode.value === 'over') run = createRun();
  savedRun = run;
  updateScore();
  draw();
  mode.value = 'playing';
  lastTime = 0;
  remaining = 0;
  canvas.value?.focus({ preventScroll: true });
  frame = requestAnimationFrame(tick);
}

function keyDown(event: KeyboardEvent) {
  if (mode.value !== 'playing') return;
  if (typeof keys[event.code as keyof typeof keys] === 'number' && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    pressed.add(event.code as keyof typeof keys);
  }
}

function keyUp(event: KeyboardEvent) {
  pressed.delete(event.code as keyof typeof keys);
}

function hold(event: PointerEvent, direction: number) {
  if (event.button !== 0) return;
  const button = event.currentTarget as HTMLButtonElement;
  button.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, direction);
}

function fieldDirection(event: PointerEvent) {
  const bounds = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect();
  const offset = event.clientX - (bounds.left + bounds.width / 2);
  return Math.abs(offset) > 10 ? Math.sign(offset) : 0;
}

function beginFieldSteering(event: PointerEvent) {
  if (mode.value === 'playing' && (event.pointerType === 'touch' || event.pointerType === 'pen')) {
    event.preventDefault();
    hold(event, fieldDirection(event));
  }
}

function moveFieldSteering(event: PointerEvent) {
  if (pointers.has(event.pointerId)) pointers.set(event.pointerId, fieldDirection(event));
}

function release(event: PointerEvent) {
  pointers.delete(event.pointerId);
}

function visibilityChanged() {
  if (document.hidden) pauseRun();
}

function drawFracture(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, age: number) {
  if (age >= 1) return;
  const reach = width * 0.14 + 8 * age;
  const lift = 3 + 7 * age;
  ctx.save();
  ctx.globalAlpha = 1 - age;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(x + side * reach, y - lift);
    ctx.lineTo(x + side * (reach + 5), y - lift - 6);
    ctx.moveTo(x + side * (reach + 6), y + 1);
    ctx.lineTo(x + side * (reach + 12), y - 1);
  }
  ctx.strokeStyle = '#4b2922';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = '#fff1b5';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawCrack(ctx: CanvasRenderingContext2D, x: number, y: number, depth: number) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x - 2, y + depth * 0.34);
  ctx.lineTo(x + 2, y + depth * 0.57);
  ctx.lineTo(x - 4, y + depth);
  ctx.moveTo(x - 2, y + depth * 0.34);
  ctx.lineTo(x - 9, y + depth * 0.51);
  ctx.strokeStyle = '#f4c589';
  ctx.lineWidth = 3.8;
  ctx.stroke();
  ctx.strokeStyle = '#36201e';
  ctx.lineWidth = 2.1;
  ctx.stroke();
  ctx.restore();
}

function drawLedge(ctx: CanvasRenderingContext2D, ledge: Ledge, y: number) {
  const x = ledgeX(ledge, run.elapsed);
  const width = ledge.width;
  const worn = ledge.wornAt !== undefined;
  const sprite = worn ? sprites.woodDamaged : sprites[ledge.kind];
  if (!sprite.naturalWidth) {
    if (ledge.shatteredAt === undefined) {
      ctx.fillStyle = '#a4c4bb';
      ctx.fillRect(x, y, width, 3);
    }
    return;
  }
  const spriteHeight = (width * sprite.naturalHeight) / sprite.naturalWidth;
  // Align the landing plane to the painted surface, below the flower on the lily.
  const top = y - spriteHeight * (ledge.kind === 'lily' ? 0.66 : 0.15);
  const middle = x + width / 2;
  if (ledge.shatteredAt !== undefined) {
    const seconds = run.elapsed - ledge.shatteredAt;
    if (reducedMotion.matches) {
      if (seconds < 0.18) drawFracture(ctx, middle, y, width, 0);
      return;
    }
    const age = seconds / 0.52;
    if (age >= 1) return;
    ctx.save();
    ctx.globalAlpha = 1 - age * age;
    for (let piece = 0; piece < 3; piece++) {
      const side = piece - 1;
      const slice = sprite.naturalWidth / 3;
      const fragmentWidth = width / 3;
      const dx = middle + side * (fragmentWidth + age * 33);
      const dy = top + spriteHeight / 2 + age * age * (31 + piece * 13) - age * 13;
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate((side || -0.38) * age * 1.8);
      ctx.drawImage(
        sprite,
        slice * piece,
        0,
        slice,
        sprite.naturalHeight,
        -fragmentWidth / 2,
        -spriteHeight / 2,
        fragmentWidth,
        spriteHeight,
      );
      ctx.restore();
    }
    ctx.restore();
    drawFracture(ctx, middle, y, width, age);
    return;
  }
  ctx.drawImage(sprite, x, top, width, spriteHeight);
  if (worn || ledge.kind === 'cracked') drawCrack(ctx, x + width * 0.54, top + 1, spriteHeight - 2);
  if (ledge.wornAt !== undefined) {
    const seconds = run.elapsed - ledge.wornAt;
    if (reducedMotion.matches) {
      if (seconds < 0.18) drawFracture(ctx, middle, y, width, 0);
    } else {
      drawFracture(ctx, middle, y, width, seconds / 0.26);
    }
  }
}

function drawRune(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const runeSize = 28;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = '#e9a645';
  ctx.shadowBlur = 13;
  if (sprites.rune.naturalWidth) {
    ctx.drawImage(sprites.rune, -runeSize / 2, -runeSize / 2, runeSize, runeSize);
  } else {
    ctx.fillStyle = '#f5ca78';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSurge(ctx: CanvasRenderingContext2D, swordY: number, screenY: (y: number) => number) {
  const strength = run.surge / SURGE_DURATION;
  const age = 1 - strength;
  const x = run.x;
  const length = 55 + strength * 110;
  ctx.save();
  if (run.surgeOrigin && age < 0.54) {
    const { x: runeX, y: runeY } = run.surgeOrigin;
    ctx.globalAlpha = 1 - age / 0.54;
    ctx.strokeStyle = '#ffe2aa';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(runeX, screenY(runeY), 14 + age * 115, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = strength;
  const ribbonGradient = ctx.createLinearGradient(0, swordY - 8, 0, swordY + length);
  ribbonGradient.addColorStop(0, '#fff5d0');
  ribbonGradient.addColorStop(0.26, '#ffd889');
  ribbonGradient.addColorStop(0.68, '#d38e7566');
  ribbonGradient.addColorStop(1, '#d38e7500');
  ctx.strokeStyle = ribbonGradient;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + side * 6, swordY - 12);
    ctx.bezierCurveTo(x + side * 27, swordY + 28, x - side * 27, swordY + length * 0.56, x + side * 9, swordY + length);
    ctx.stroke();
  }
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, swordY);
  ctx.quadraticCurveTo(x + Math.sin(age * 8) * 15, swordY + length * 0.65, x - 2, swordY + length * 0.87);
  ctx.stroke();
  ctx.fillStyle = '#ffe9b0';
  for (let spark = 0; spark < 9; spark++) {
    const progress = (spark / 9 + age * 1.8) % 1;
    const px = x + Math.sin(spark * 2.4 + age * 5) * (8 + progress * 24);
    const py = swordY + progress * length;
    ctx.globalAlpha = strength * (1 - progress);
    ctx.beginPath();
    ctx.ellipse(px, py, 1.2, 3.5 - progress * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMordredFog(ctx: CanvasRenderingContext2D, swordY: number) {
  const focus = mordredFocus(mordredTime(run));
  if (!focus || run.over) return;
  const centerY = swordY - 29;
  const stretch = 1.22;
  ctx.save();
  ctx.translate(run.x, centerY);
  ctx.scale(stretch, 1);
  const fog = ctx.createRadialGradient(0, 0, 0, 0, 0, 138 + 98 * (1 - focus));
  fog.addColorStop(0.48, 'rgba(18, 12, 34, 0)');
  fog.addColorStop(0.79, 'rgba(18, 12, 34, 0.56)');
  fog.addColorStop(1, 'rgba(18, 12, 34, 0.96)');
  ctx.globalAlpha = focus;
  ctx.fillStyle = fog;
  ctx.fillRect(-run.x / stretch, -centerY, WIDTH / stretch, HEIGHT);
  ctx.restore();
}

function draw() {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) return;
  const offset = reducedMotion.matches ? 0 : Math.round(Math.min(run.scrollY / 760, 1) * 14);
  if (backdrop.value && offset !== backdropOffset) {
    backdrop.value.style.transform = `translateY(${offset}%)`;
    backdropOffset = offset;
  }
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const screenY = (y: number) => HEIGHT - 42 + run.scrollY - y;
  for (const ledge of run.ledges) {
    const y = screenY(ledge.y);
    if (y >= -50 && y < HEIGHT + 10) drawLedge(ctx, ledge, y);
    if (ledge.rune) drawRune(ctx, ledge.rune.x, screenY(ledge.rune.y));
  }

  const landing = mode.value === 'playing' ? landingPreview(run) : undefined;
  if (landing) {
    const y = screenY(landing.y) - 2;
    ctx.fillStyle = isDark.value ? '#d4faee' : '#164955';
    ctx.beginPath();
    ctx.ellipse(run.x, y, 8, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const swordY = screenY(run.y) - 17;
  if (run.surge > 0 && !reducedMotion.matches) drawSurge(ctx, swordY, screenY);

  ctx.save();
  ctx.translate(run.x, screenY(run.y));
  ctx.rotate(0.13);
  ctx.shadowColor = run.surge > 0 ? '#ffc97b' : isDark.value ? '#83e5ff' : '#203a57';
  ctx.shadowBlur = run.surge > 0 ? 18 : isDark.value ? 7 : 4;
  const sword = sprites.sword;
  if (sword.naturalHeight) {
    const swordHeight = 50;
    const swordWidth = (swordHeight * sword.naturalWidth) / sword.naturalHeight;
    ctx.drawImage(sword, -swordWidth / 2, -swordHeight, swordWidth, swordHeight);
  } else {
    ctx.fillStyle = '#e8f8ff';
    ctx.fillRect(-2, -32, 4, 32);
    ctx.fillRect(-8, -30, 16, 3);
  }
  ctx.restore();
  drawMordredFog(ctx, swordY);
}

watch([canvas, isDark], draw, { flush: 'post' });
onMounted(() => {
  try {
    const record = Number(localStorage.getItem(recordKey));
    if (Number.isSafeInteger(record)) best.value = Math.max(best.value, record);
  } catch {
    // Browser storage is optional.
  }
  window.addEventListener('blur', pauseRun);
  document.addEventListener('visibilitychange', visibilityChanged);
});
onBeforeUnmount(() => {
  stop();
  for (const sprite of Object.values(sprites)) sprite.onload = null;
  window.removeEventListener('blur', pauseRun);
  document.removeEventListener('visibilitychange', visibilityChanged);
});
</script>

<style scoped lang="scss">
@import './game-chrome';

.jump-panel {
  @include playground-panel;
  padding: 10px 24px 18px;
  max-height: calc(100dvh - 88px);
}
.jump-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.jump-eyebrow {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: rgb(var(--v-theme-text-secondary));
  span {
    margin-inline: 7px;
    opacity: 0.5;
  }
}
.jump-icon {
  @include playground-header-icon;
  svg {
    width: 22px;
    height: 22px;
  }
}
.jump-identity {
  h2 {
    font-size: clamp(24px, 7.4vw, 43px);
    font-weight: 850;
    line-height: 1.12;
    letter-spacing: -0.07em;
    span {
      color: #b58333;
    }
  }
  p {
    margin: 4px 0 14px;
    color: rgb(var(--v-theme-text-secondary));
    font-size: 14px;
  }
}
.jump-panel button {
  cursor: pointer;
}
.jump-panel :focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
.jump-stats {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.jump-stat {
  @include playground-stat;
}
.jump-best {
  @include playground-best;
}
.jump-field {
  position: relative;
  width: min(100%, max(138px, calc((100dvh - 390px) * 320 / 410)));
  margin-inline: auto;
  aspect-ratio: 320 / 410;
  overflow: hidden;
  border: 2px solid #967744;
  border-radius: 16px;
  background: #cadbdd;
}
.jump-backdrop {
  position: absolute;
  inset: -17% 0 0;
  background: url('@/assets/images/playground/excalibur-lake-day.webp') center / cover;
  pointer-events: none;
}
.jump-dark {
  .jump-field {
    background: #29233f;
  }
  .jump-backdrop {
    background-image: url('@/assets/images/playground/excalibur-lake.webp');
  }
}
.jump-field canvas {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
.jump-field canvas:focus-visible {
  outline-offset: -3px;
}
.jump-surge,
.jump-mordred-spoken {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.jump-mordred-title {
  position: absolute;
  inset: 9px 10px auto;
  color: #fff2dc;
  font-family: Georgia, serif;
  font-size: clamp(19px, 5vw, 32px);
  font-weight: 700;
  line-height: 1.05;
  text-align: center;
  text-shadow:
    0 2px 5px #170f22,
    0 0 12px #170f22,
    0 0 20px #170f22;
  text-wrap: balance;
  pointer-events: none;
  animation: jump-mordred-enter 180ms ease-out both;
}
.jump-mordred {
  position: absolute;
  inset: auto auto 8px 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 16px);
  padding: 4px 8px 4px 4px;
  border: 1px solid #aa8bbb63;
  border-radius: 10px;
  background: #21182f;
  color: #f8efff;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  animation: jump-mordred-enter 180ms ease-out both;

  img {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    object-fit: cover;
  }
}
.jump-mordred-time {
  color: #ead2f7;
  font-variant-numeric: tabular-nums;
}
@keyframes jump-mordred-enter {
  from {
    opacity: 0;
    transform: translateX(-6px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .jump-mordred-title,
  .jump-mordred {
    animation: none;
  }
}
.jump-message {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 8px;
  background: rgba(var(--v-theme-surface), 0.18);
}
.jump-message-card {
  display: grid;
  justify-items: center;
  gap: 10px;
  max-width: 270px;
  padding: 14px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 14px;
  background: rgba(var(--v-theme-surface), 0.96);
  text-align: center;
  box-shadow: 0 6px 24px #142b4029;
}
.jump-message-title {
  font-size: clamp(16px, 4vw, 23px);
  font-weight: 750;
  line-height: 1.2;
  letter-spacing: -0.03em;
}
.jump-message p {
  font-size: 13px;
  color: rgb(var(--v-theme-text-secondary));
}
.jump-touch-hint {
  display: none;
}
@media (pointer: coarse) {
  .jump-touch-hint {
    display: inline;
  }
  .jump-key-hint {
    display: none;
  }
}
.jump-action {
  @include playground-action;
  @include playground-primary;
}
.jump-action:focus-visible {
  outline-color: rgb(var(--v-theme-on-primary));
  outline-offset: -4px;
}
.jump-controls {
  display: flex;
  justify-content: center;
  gap: 9px;
  margin-top: 12px;
  button {
    @include playground-action;
    display: grid;
    place-items: center;
    min-width: 44px;
    height: 44px;
    padding: 0 10px;
    border: 1px solid rgb(var(--v-theme-surface-border));
    touch-action: none;
    user-select: none;
    &:active {
      background: rgb(var(--v-theme-inset-hover));
    }
    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }
}
.jump-controls .jump-left,
.jump-controls .jump-right {
  font-size: 19px;
}
@media (hover: hover) and (pointer: fine) {
  .jump-icon:hover,
  .jump-controls button:enabled:hover {
    background: rgb(var(--v-theme-inset-hover));
  }
}
@media (max-width: 480px) {
  .jump-panel {
    padding-inline: 20px;
    border-radius: 20px;
  }
  .jump-field {
    width: min(100%, max(138px, calc((100dvh - 315px) * 320 / 410)));
  }
  .jump-eyebrow span {
    display: none;
  }
}
</style>

<style>
.excalibur-overlay {
  --excalibur-max-width: 416px;
  align-items: flex-start;
  justify-content: flex-start;
}
.excalibur-overlay > .v-overlay__content {
  width: min(var(--excalibur-max-width), calc(100% - 24px));
  margin: 64px 12px 12px;
}
@media (max-width: 480px) {
  .excalibur-overlay > .v-overlay__content {
    margin: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
    max-height: calc(100dvh - 24px);
  }
  .excalibur-overlay .jump-panel {
    max-height: calc(100dvh - 26px);
  }
}
@media (min-width: 520px) and (max-height: 520px) {
  .excalibur-overlay {
    --excalibur-max-width: 560px;
  }
  .excalibur-overlay > .v-overlay__content {
    margin: 12px;
    max-height: calc(100dvh - 24px);
  }
  .excalibur-overlay .jump-panel {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto auto 1fr;
    grid-template-areas:
      'field header'
      'field identity'
      'field stats'
      'field inputs';
    column-gap: 14px;
    max-height: calc(100dvh - 24px);
  }
  .excalibur-overlay .jump-field {
    grid-area: field;
    width: max(126px, min(51vw, calc((100dvh - 54px) * 320 / 410)));
  }
  .excalibur-overlay .jump-header {
    grid-area: header;
  }
  .excalibur-overlay .jump-identity {
    grid-area: identity;
  }
  .excalibur-overlay .jump-identity h2 {
    font-size: clamp(20px, 4vw, 32px);
  }
  .excalibur-overlay .jump-stats {
    grid-area: stats;
  }
  .excalibur-overlay .jump-controls {
    grid-area: inputs;
    align-self: end;
  }
}
</style>
