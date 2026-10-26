<template>
  <button
    class="playground-launcher"
    type="button"
    :title="$t('menu.playground')"
    :aria-label="$t('menu.playground')"
    :aria-expanded="pickerOpen || visible"
    aria-haspopup="dialog"
    @click="pickerOpen = true"
  >
    <span v-if="turnActive" class="playground-turn-dot" aria-hidden="true" />
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path
        d="M7.4 6h9.2a3 3 0 0 1 2.9 2.3l1.6 7.1a2.6 2.6 0 0 1-4.5 2.3L14.4 15H9.6l-2.2 2.7a2.6 2.6 0 0 1-4.5-2.3l1.6-7.1A3 3 0 0 1 7.4 6Z"
      />
      <path d="M7.5 9v5M5 11.5h5" />
      <circle cx="16" cy="10" r=".65" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12.5" r=".65" fill="currentColor" stroke="none" />
    </svg>
  </button>
  <v-dialog
    :model-value="pickerOpen"
    @update:model-value="close"
    class="playground-picker-overlay"
    max-width="360"
    :scrim="false"
    scroll-strategy="none"
    aria-labelledby="playground-picker-title"
    @after-leave="afterPickerLeave"
    @after-enter="focusFirstGame"
  >
    <section class="playground-picker">
      <header class="picker-heading">
        <div>
          <span class="picker-eyebrow">AVALON</span>
          <h2 id="playground-picker-title">{{ $t('menu.playgroundTitle') }}</h2>
        </div>
        <button
          class="playground-picker-close picker-close"
          type="button"
          :aria-label="$t('menu.playgroundClose')"
          @click="close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </header>
      <PlaygroundTurnNotice v-if="turnActive" class="picker-turn-notice" @return="close" />
      <div class="playground-choices">
        <button
          ref="firstGame"
          class="playground-choice playground-game-2048"
          type="button"
          :disabled="loading"
          :aria-busy="loading"
          @click="chooseGame"
        >
          <span class="picker-game-icon picker-runestone" aria-hidden="true">
            <svg viewBox="0 0 72 72" fill="none">
              <rect class="rune-underlay" x="15" y="12" width="44" height="50" rx="7" transform="rotate(-9 37 37)" />
              <rect class="rune-slab" x="11" y="10" width="50" height="51" rx="7" />
              <rect class="rune-bevel" x="14" y="13" width="44" height="45" rx="5" />
              <path class="rune-etch" d="M18 26v-9h9m18 0h9v9M18 45v9h9m18 0h9v-9M18 21h4v-4m28 0v4h4" />
              <text x="36" y="38" text-anchor="middle">2048</text>
              <path
                class="rune-cup"
                d="M31 43h10l-1 4a4 4 0 0 1-8 0l-1-4Zm5 8v4m-3 0h6m-8-11h-2v2a3 3 0 0 0 3 3m9-5h2v2a3 3 0 0 1-3 3"
              />
            </svg>
          </span>
          <strong>{{ loading ? $t('mainPage.loading') : '2048' }}</strong>
        </button>
        <button v-for="slot in 2" :key="slot" class="playground-choice playground-soon" type="button" disabled>
          <span class="picker-game-icon" aria-hidden="true">
            <svg
              v-if="slot === 1"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
            >
              <path d="m16 4 11 6v12l-11 6-11-6V10l11-6Zm0 12v12M5 10l11 6 11-6M11 7l11 6" />
            </svg>
            <svg v-else viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <rect x="5" y="5" width="22" height="22" rx="6" />
              <path d="M16 10v12M10 16h12" />
            </svg>
          </span>
          <span>{{ $t('menu.playgroundSoon') }}</span>
        </button>
      </div>
    </section>
  </v-dialog>
  <component
    :is="game"
    v-if="visible && game"
    :back-label="$t('menu.playgroundBack')"
    :turn-active="turnActive"
    @back="
      visible = false;
      pickerOpen = true;
    "
    @close="visible = false"
  />
</template>
<script setup lang="ts">
import { nextTick, markRaw, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import type { Component } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import eventBus from '@/helpers/event-bus';
import PlaygroundTurnNotice from './PlaygroundTurnNotice.vue';
defineProps<{ turnActive?: boolean }>();
const game = shallowRef<Component>();
const firstGame = ref<HTMLButtonElement>();
function focusFirstGame() {
  void nextTick(() => firstGame.value?.focus({ preventScroll: true }));
}
const visible = ref(false),
  pickerOpen = ref(false),
  loading = ref(false);
const route = useRoute();
const { t } = useI18n();
let revision = 0,
  pendingGame = false;
function close() {
  revision++;
  pickerOpen.value = false;
  visible.value = false;
  pendingGame = false;
}
watch(() => route.fullPath, close);
onBeforeUnmount(close);
function afterPickerLeave() {
  if (pendingGame) {
    pendingGame = false;
    visible.value = true;
  }
}
async function chooseGame() {
  if (loading.value) return;
  const request = ++revision;
  loading.value = true;
  try {
    // Opening the picker downloads no game code, copy or CSS; only choosing 2048 does.
    game.value ??= markRaw(
      (await import(/* webpackChunkName: "playground-2048", webpackPrefetch: false */ './Game2048.vue')).default,
    );
    if (request === revision) {
      pendingGame = true;
      pickerOpen.value = false;
    }
  } catch {
    eventBus.emit('infoMessage', t('menu.playgroundError'));
  } finally {
    loading.value = false;
  }
}
</script>
<style scoped>
.playground-launcher {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  color: rgb(var(--v-theme-primary));
  touch-action: manipulation;
}
.playground-turn-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d49a29;
  box-shadow: 0 0 0 2px rgb(var(--v-theme-surface));
  pointer-events: none;
}
.picker-turn-notice {
  margin-bottom: 18px;
}
.playground-launcher svg {
  width: 25px;
  height: 25px;
}
.playground-launcher[aria-expanded='true'] {
  background: rgb(var(--v-theme-inset-hover));
}
.playground-launcher:disabled {
  opacity: 0.4;
  cursor: default;
}
.playground-picker {
  padding: 20px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-text-primary));
  box-shadow: 0 12px 48px #142b4029;
}
.picker-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}
.picker-eyebrow {
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.17em;
  color: rgb(var(--v-theme-text-secondary));
}
.picker-heading h2 {
  font-size: 22px;
  line-height: 1.4;
}
.picker-close {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
}
.picker-close svg {
  width: 22px;
  height: 22px;
}
.playground-choices {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.playground-choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 0;
  border-radius: 14px;
  padding: 8px 0;
  font-size: 13px;
  text-align: center;
  color: rgb(var(--v-theme-text-primary));
  transition: background-color 140ms ease;
}
.picker-game-icon {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  max-width: 100%;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 18px;
  background: rgb(var(--v-theme-inset-hover));
}
.picker-game-icon svg {
  width: 36px;
  height: 36px;
}
.picker-runestone {
  background: linear-gradient(145deg, #345153, #182f33);
  border-color: #a78b50;
  box-shadow:
    inset 0 0 0 3px #1a3135,
    inset 0 0 0 4px #a78b5055;
}
.picker-runestone svg {
  width: 100%;
  height: 100%;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.rune-underlay {
  fill: #929786;
  stroke: #b5ad8d;
}
.rune-slab {
  fill: #d7d0be;
  stroke: #969882;
  stroke-width: 1.5;
}
.rune-bevel {
  stroke: #f5efd9;
}
.rune-etch {
  stroke: #858c79;
}
.picker-runestone text {
  fill: #263b3e;
  font:
    bold 18px Georgia,
    'Times New Roman',
    serif;
  letter-spacing: -1px;
}
.rune-cup {
  stroke: #7d673b;
  stroke-width: 1.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.playground-game-2048:active .picker-runestone svg {
  transform: scale(0.96);
}
.playground-soon {
  color: rgb(var(--v-theme-text-secondary));
  cursor: default;
}
.playground-soon .picker-game-icon {
  opacity: 0.55;
  border-style: dashed;
}
button:focus-visible {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
@media (hover: hover) and (pointer: fine) {
  .playground-game-2048:hover .picker-runestone svg {
    transform: translateY(-2px);
  }
  .playground-launcher:hover,
  .picker-close:hover,
  .playground-choice:not(:disabled):hover {
    background: rgb(var(--v-theme-inset-hover));
  }
}
@media (prefers-reduced-motion: reduce) {
  .picker-runestone svg {
    transition: none;
    transform: none !important;
  }
}
</style>
<style>
.playground-picker-overlay {
  align-items: flex-start;
  justify-content: flex-start;
}
.playground-picker-overlay > .v-overlay__content {
  margin: 64px 16px 80px;
}
@media (max-width: 480px) {
  .playground-picker-overlay > .v-overlay__content {
    width: calc(100% - 24px);
    max-width: 360px !important;
    margin: max(12px, env(safe-area-inset-top)) 12px 80px;
  }
}
</style>
