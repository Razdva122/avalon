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
      <div class="playground-choices">
        <button
          ref="firstGame"
          class="playground-choice playground-game-2048"
          type="button"
          :disabled="Boolean(loading)"
          :aria-busy="loading === '2048'"
          @click="chooseGame('2048')"
        >
          <span class="picker-game-icon picker-artwork picker-2048" aria-hidden="true" />
          <strong>{{ loading === '2048' ? $t('mainPage.loading') : '2048' }}</strong>
        </button>
        <button
          class="playground-choice playground-game-excalibur"
          type="button"
          :disabled="Boolean(loading)"
          :aria-busy="loading === 'excalibur'"
          @click="chooseGame('excalibur')"
        >
          <span class="picker-game-icon picker-artwork picker-excalibur" aria-hidden="true" />
          <strong>{{ loading === 'excalibur' ? $t('mainPage.loading') : 'Excalibur Jump' }}</strong>
        </button>
        <button class="playground-choice playground-soon" type="button" disabled>
          <span class="picker-game-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
              <path d="m16 4 11 6v12l-11 6-11-6V10l11-6Zm0 12v12M5 10l11 6 11-6M11 7l11 6" />
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
    v-bind="selected === '2048' ? { turnActive } : {}"
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
defineProps<{ turnActive?: boolean }>();
const gameLoaders = {
  '2048': () => import(/* webpackChunkName: "playground-2048" */ './Game2048.vue'),
  excalibur: () => import(/* webpackChunkName: "playground-excalibur" */ './ExcaliburJump.vue'),
};
type GameID = keyof typeof gameLoaders;
const game = shallowRef<Component>();
const selected = ref<GameID>();
const firstGame = ref<HTMLButtonElement>();
function focusFirstGame() {
  void nextTick(() => firstGame.value?.focus({ preventScroll: true }));
}
const visible = ref(false),
  pickerOpen = ref(false),
  loading = ref<GameID>();
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
async function chooseGame(id: GameID) {
  if (loading.value) return;
  const request = ++revision;
  loading.value = id;
  try {
    const { default: component } = await gameLoaders[id]();
    if (request === revision) {
      game.value = markRaw(component);
      selected.value = id;
      pendingGame = true;
      pickerOpen.value = false;
    }
  } catch {
    if (request === revision) {
      eventBus.emit('infoMessage', t('menu.playgroundError', { game: id === '2048' ? '2048' : 'Excalibur Jump' }));
    }
  } finally {
    loading.value = undefined;
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
.picker-artwork {
  border: 0;
  border-radius: 13px;
  background-color: #153f43;
  background-position: center;
  background-size: cover;
}
.picker-2048 {
  background-image: url('@/assets/images/playground/2048-picker.webp');
}
.picker-excalibur {
  background-image: url('@/assets/images/playground/excalibur-picker.webp');
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
  .playground-launcher:hover,
  .picker-close:hover,
  .playground-choice:not(:disabled):hover {
    background: rgb(var(--v-theme-inset-hover));
  }
}
@media (prefers-reduced-motion: no-preference) {
  .picker-artwork {
    transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .playground-choice:enabled:active .picker-artwork {
    transform: scale(0.96);
  }
}
@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .playground-choice:enabled:hover:not(:active) .picker-artwork {
    transform: translateY(-2px);
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
