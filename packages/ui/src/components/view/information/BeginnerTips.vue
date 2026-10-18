<template>
  <template v-if="live && session.enabled && tip && !spoilersHidden">
    <button
      v-if="mobileSheet"
      ref="tipLauncher"
      type="button"
      class="tip-launcher"
      :aria-label="t('beginnerTips.label')"
      :title="t('beginnerTips.label')"
      aria-haspopup="dialog"
      :aria-expanded="!collapsed"
      @click="collapsed = false"
    >
      <span class="material-icons" aria-hidden="true">info_outline</span>
      <span class="tip-launcher-text">{{ t('beginnerTips.shortLabel') }}</span>
    </button>
    <component
      :is="mobileSheet ? VDialog : 'div'"
      :style="mobileSheet ? undefined : { display: 'contents' }"
      v-bind="
        mobileSheet
          ? {
              modelValue: !collapsed,
              maxWidth: 520,
              class: 'beginner-tip-dialog',
              'aria-label': t('beginnerTips.label'),
            }
          : {}
      "
      @update:modelValue="collapsed = !$event"
      @afterLeave="tipLauncher?.focus({ preventScroll: true })"
    >
      <aside
        ref="sidebarRef"
        class="beginner-live-tip"
        :style="!mobileViewport && !embedded ? sidebarStyle : undefined"
        :class="{ 'is-collapsed': collapsed && !mobileSheet, 'is-embedded': embedded, 'is-mobile-sheet': mobileSheet }"
        :aria-label="t('beginnerTips.label')"
      >
        <div class="tip-heading">
          <span class="material-icons" aria-hidden="true">info_outline</span>
          <strong>{{ t('beginnerTips.label') }}</strong>
          <button
            type="button"
            @click="collapsed = !collapsed"
            :aria-expanded="mobileSheet ? undefined : !collapsed"
            :aria-label="
              t(mobileSheet ? 'infoMessage.close' : collapsed ? 'beginnerTips.expand' : 'beginnerTips.collapse')
            "
          >
            <span class="material-icons" aria-hidden="true">{{
              mobileSheet ? 'close' : collapsed ? 'keyboard_arrow_up' : 'keyboard_arrow_down'
            }}</span>
          </button>
        </div>
        <p class="tip-copy" aria-live="polite" aria-atomic="true">
          {{ t(`beginnerTips.${tip}`, { count: game.settings.missions[game.mission]?.players }) }}
        </p>
        <template v-if="!collapsed">
          <details v-if="role && !spoilersHidden" :key="game.uuid">
            <summary>{{ t('beginnerTips.yourRole', { role: t(`roles.${role}`) }) }}</summary>
            <p>{{ t(good ? 'beginnerTips.goodGoal' : 'beginnerTips.evilGoal') }}</p>
            <p v-if="['merlin', 'percival', 'morgana'].includes(role)">{{ t(`beginnerTips.role_${role}`) }}</p>
          </details>
          <button class="tip-disable" type="button" @click="confirmOpen = true">{{ t('beginnerTips.disable') }}</button>
        </template>
        <button v-if="mobileSheet" type="button" class="tip-return" @click="collapsed = true">
          {{ t('beginnerTips.backToTable') }}
        </button>
      </aside>
    </component>
  </template>
  <v-dialog v-model="confirmOpen" max-width="440" aria-labelledby="disable-beginner-tips-title">
    <section class="tip-confirm" aria-describedby="disable-beginner-tips-description">
      <header class="tip-confirm-header">
        <h2 id="disable-beginner-tips-title">{{ t('beginnerTips.confirmTitle') }}</h2>
        <v-btn
          icon="close"
          color="text-primary"
          variant="text"
          :aria-label="t('modal.cancel')"
          @click="confirmOpen = false"
        />
      </header>
      <p id="disable-beginner-tips-description">{{ t('beginnerTips.confirmText') }}</p>
      <footer class="tip-confirm-actions">
        <v-btn color="text-primary" variant="outlined" @click="confirmOpen = false">{{ t('modal.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" @click="disable">{{ t('beginnerTips.confirmDisable') }}</v-btn>
      </footer>
    </section>
  </v-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { VDialog } from 'vuetify/components';
import { useI18n } from 'vue-i18n';
import { useMediaQuery } from '@vueuse/core';
import type { VisualGameState, AiRoomState } from '@avalon/types';
import { beginnerTip } from '@/helpers/beginner-tips';
import { beginnerTipsSession as session, setBeginnerTipsEnabled } from '@/helpers/beginner-tips-session';
const props = defineProps<{
  game: VisualGameState;
  ai?: AiRoomState;
  userID?: string;
  live: boolean;
  spoilersHidden: boolean;
  embedded?: boolean;
}>();
const { t } = useI18n();
const collapsed = ref(false);
const mobileViewport = useMediaQuery('(max-width: 959px)');
const shortHeight = useMediaQuery('(max-height: 600px)');
const shortScreen = computed(() => mobileViewport.value || shortHeight.value);
const mobileSheet = computed(() => mobileViewport.value && !props.embedded);
const tipLauncher = ref<HTMLButtonElement>();
const sidebarRef = ref<HTMLElement>();
const sidebarStyle = ref<Record<string, string>>({});
let sidebarObserver: ResizeObserver | undefined;
let sidebarFrame = 0;
function positionSidebar() {
  if (mobileViewport.value || props.embedded || !sidebarRef.value) return;
  const element = sidebarRef.value;
  const room = element.closest('.room');
  if (!room) return;
  const bounds = element.getBoundingClientRect();
  let bands: Array<[number, number]> = [[64, window.innerHeight - 88]];
  const obstacles = room.querySelectorAll('.ai-room-status, [data-player-id] .player-frame');
  for (const obstacle of obstacles) {
    const r = obstacle.getBoundingClientRect();
    if (!r.width || r.right <= bounds.left || r.left >= bounds.right) continue;
    bands = bands.flatMap(([start, end]): Array<[number, number]> => {
      if (r.bottom + 12 <= start || r.top - 12 >= end) return [[start, end]];
      return [
        [start, Math.min(end, r.top - 12)],
        [Math.max(start, r.bottom + 12), end],
      ].filter(([a, b]) => b - a >= 44) as Array<[number, number]>;
    });
  }
  const band = bands.sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
  if (!band) return;
  const maxHeight = band[1] - band[0];
  const height = Math.min(element.scrollHeight + 2, maxHeight);
  const top = Math.max(band[0], Math.min(window.innerHeight / 2 - height / 2, band[1] - height));
  sidebarStyle.value = { top: `${top}px`, maxHeight: `${maxHeight}px`, transform: 'none' };
}
function scheduleSidebar() {
  cancelAnimationFrame(sidebarFrame);
  sidebarFrame = requestAnimationFrame(positionSidebar);
}
function observeSidebar() {
  sidebarObserver?.disconnect();
  if (mobileViewport.value || props.embedded || !sidebarRef.value) return;
  const room = sidebarRef.value.closest('.room');
  for (const element of [sidebarRef.value, room?.querySelector('.wrapper'), room?.querySelector('.ai-room-status')]) {
    if (element) sidebarObserver?.observe(element);
  }
  scheduleSidebar();
}
onMounted(() => {
  sidebarObserver = new ResizeObserver(scheduleSidebar);
  window.addEventListener('resize', scheduleSidebar);
  void nextTick(observeSidebar);
});
onBeforeUnmount(() => {
  sidebarObserver?.disconnect();
  cancelAnimationFrame(sidebarFrame);
  window.removeEventListener('resize', scheduleSidebar);
});
watch([sidebarRef, mobileViewport, () => props.game.uuid], () => void nextTick(observeSidebar), { flush: 'post' });

watch(
  shortScreen,
  (value) => {
    collapsed.value = value;
  },
  { immediate: true },
);
const confirmOpen = ref(false);
const tip = computed(() => beginnerTip(props.game, props.ai, props.userID));
watch(tip, () => void nextTick(scheduleSidebar));
const role = computed(() => props.game.players.find((p) => p.id === props.userID)?.role);
const good = computed(() => props.game.settings.roles.good.some((r) => r === role.value));
watch(
  () => props.game.uuid,
  () => {
    collapsed.value = shortScreen.value;
    confirmOpen.value = false;
  },
);
watch(
  () => session.enabled,
  (enabled) => {
    if (enabled) collapsed.value = shortScreen.value;
  },
);
function disable() {
  setBeginnerTipsEnabled(false);
  confirmOpen.value = false;
}
</script>
<style scoped lang="scss">
.beginner-live-tip {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  left: 56px;
  width: clamp(220px, calc((100vw - 840px) / 2 - 24px), 280px);
  z-index: 14;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-text-primary));
  border: 1px solid rgba(var(--v-theme-primary), 0.24);
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  font-size: 14px;
  line-height: 1.5;
  max-height: calc(100dvh - 170px);
  overflow-y: auto;
}
.tip-heading {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tip-heading > .material-icons {
  font-size: 20px;
  color: rgb(var(--v-theme-primary));
}
.tip-heading strong {
  font-weight: 600;
  font-size: 13px;
}
.tip-heading button {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  min-height: 44px;
  min-width: 44px;
  border-radius: 6px;
  color: inherit;
}
.tip-heading button:hover {
  background: rgb(var(--v-theme-inset-hover));
}
p {
  margin: 6px 0 0;
}
summary {
  font-size: 12px;
  color: rgb(var(--v-theme-primary));
  margin-top: 10px;
  cursor: pointer;
}
.tip-disable {
  display: block;
  font-size: 12px;
  color: rgb(var(--v-theme-text-primary));
  text-decoration: underline;
  text-underline-offset: 3px;
  margin-top: 4px;
  min-height: 36px;
}
.tip-confirm {
  padding: 20px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 16px;
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
}
.tip-confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: -8px -8px 8px 0;
}
.tip-confirm-header h2 {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
}
.tip-confirm > p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: rgb(var(--v-theme-text-secondary));
}
.tip-confirm-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 24px;
}
.tip-confirm-actions :deep(.v-btn) {
  min-height: 44px;
  text-transform: none;
  letter-spacing: 0;
}
.tip-confirm-actions :deep(.v-btn--variant-outlined) {
  color: rgb(var(--v-theme-text-primary));
}
.tip-heading button:focus-visible,
.tip-disable:focus-visible,
summary:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.is-collapsed .tip-copy {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
@media (max-width: 959px) {
  .beginner-live-tip {
    top: auto;
    transform: translateX(-50%);
    left: 50%;
    bottom: max(80px, calc(env(safe-area-inset-bottom) + 64px));
    width: min(520px, calc(100vw - 24px));
    padding: 8px 12px;
    font-size: 13px;
    max-height: min(44dvh, 360px);
  }
}
@media (min-width: 650px) and (max-width: 959px) and (max-height: 600px) {
  .beginner-live-tip {
    top: auto;
    bottom: 80px;
    left: auto;
    right: 12px;
    transform: none;
    width: 260px;
    max-height: calc(100dvh - 144px);
  }
}
.beginner-live-tip.is-embedded {
  position: relative;
  top: auto;
  bottom: auto;
  left: auto;
  right: auto;
  transform: none;
  width: auto;
  flex-shrink: 0;
  margin: 0 8px 8px;
  max-height: min(28dvh, 180px, calc(var(--chat-viewport-height, 100dvh) * 0.28));
  padding: 4px 10px 8px;
  box-shadow: none;
}
.tip-launcher {
  position: fixed;
  z-index: 14;
  bottom: calc(16px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  max-width: calc(100vw - 240px);
  min-width: 44px;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid rgba(var(--v-theme-primary), 0.24);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.tip-launcher .material-icons {
  font-size: 18px;
}
.tip-launcher-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tip-launcher:focus-visible,
.tip-return:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.beginner-live-tip.is-mobile-sheet {
  position: relative;
  top: auto;
  bottom: auto;
  left: auto;
  right: auto;
  transform: none;
  width: 100%;
  max-height: min(70dvh, calc(100dvh - 100px));
  padding: 12px 16px;
  font-size: 15px;
}
.tip-return {
  display: block;
  width: 100%;
  min-height: 44px;
  margin-top: 12px;
  border-radius: 8px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
@media (max-width: 359px) {
  .tip-launcher-text {
    display: none;
  }
}
@media (min-width: 650px) and (max-width: 959px) and (max-height: 600px) {
  .tip-launcher {
    left: auto;
    right: 132px;
    transform: none;
    max-width: 180px;
  }
}
</style>
