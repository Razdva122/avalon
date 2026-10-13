<template>
  <aside
    v-if="live && session.enabled && tip && !spoilersHidden"
    class="beginner-live-tip"
    :aria-label="t('beginnerTips.label')"
  >
    <div class="tip-heading">
      <span class="material-icons" aria-hidden="true">info_outline</span>
      <strong>{{ t('beginnerTips.label') }}</strong>
      <button
        type="button"
        @click="collapsed = !collapsed"
        :aria-expanded="!collapsed"
        :aria-label="t(collapsed ? 'beginnerTips.expand' : 'beginnerTips.collapse')"
      >
        <span class="material-icons" aria-hidden="true">{{
          collapsed ? 'keyboard_arrow_up' : 'keyboard_arrow_down'
        }}</span>
      </button>
    </div>
    <template v-if="!collapsed">
      <p aria-live="polite" aria-atomic="true">
        {{ t(`beginnerTips.${tip}`, { count: game.settings.missions[game.mission]?.players }) }}
      </p>
      <details v-if="role && !spoilersHidden" :key="game.uuid">
        <summary>{{ t('beginnerTips.yourRole', { role: t(`roles.${role}`) }) }}</summary>
        <p>{{ t(good ? 'beginnerTips.goodGoal' : 'beginnerTips.evilGoal') }}</p>
        <p v-if="['merlin', 'percival', 'morgana'].includes(role)">{{ t(`beginnerTips.role_${role}`) }}</p>
      </details>
      <button class="tip-disable" type="button" @click="confirmOpen = true">{{ t('beginnerTips.disable') }}</button>
    </template>
  </aside>
  <v-dialog v-model="confirmOpen" max-width="440" aria-labelledby="disable-beginner-tips-title">
    <v-card>
      <v-card-title id="disable-beginner-tips-title" class="text-wrap">{{
        t('beginnerTips.confirmTitle')
      }}</v-card-title>
      <v-card-text>{{ t('beginnerTips.confirmText') }}</v-card-text>
      <v-card-actions class="tip-confirm-actions">
        <v-btn variant="text" @click="confirmOpen = false">{{ t('beginnerTips.keep') }}</v-btn>
        <v-btn color="primary" variant="flat" @click="disable">{{ t('beginnerTips.confirmDisable') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
}>();
const { t } = useI18n();
const collapsed = ref(false);
const shortScreen = useMediaQuery('(max-height: 600px)');
watch(
  shortScreen,
  (value) => {
    collapsed.value = value;
  },
  { immediate: true },
);
const confirmOpen = ref(false);
const tip = computed(() => beginnerTip(props.game, props.ai, props.userID));
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
  width: clamp(220px, calc((100vw - 840px) / 2 - 70px), 280px);
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
  font-weight: 500;
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
.tip-confirm-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  padding: 12px;
}
.room:has(.voice-panel) .beginner-live-tip {
  visibility: hidden;
}
@media (max-width: 1279px) {
  .beginner-live-tip {
    top: auto;
    transform: translateX(-50%);
    left: 50%;
    bottom: max(80px, calc(env(safe-area-inset-bottom) + 64px));
    width: min(520px, calc(100vw - 24px));
    padding: 8px 12px;
    font-size: 13px;
    max-height: 200px;
  }
}
@media (min-width: 650px) and (max-width: 1279px) and (max-height: 600px) {
  .beginner-live-tip {
    top: 50%;
    bottom: auto;
    left: auto;
    right: 12px;
    transform: translateY(-50%);
    width: 200px;
    max-height: calc(100dvh - 100px);
  }
}
</style>
