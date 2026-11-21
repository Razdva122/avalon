<template>
  <div v-if="message" class="weekly-bot-game" :class="{ used: weekly?.remaining === 0 }" role="status">
    <v-icon icon="event" size="18" aria-hidden="true" />
    <div>
      <strong>{{ message }}</strong>
      <p v-if="detail">{{ detail }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { WeeklyLargeBotGame } from '@avalon/types';

const props = defineProps<{
  weekly?: WeeklyLargeBotGame;
  premium?: boolean;
  guest?: boolean;
  launch?: boolean;
  lobby?: boolean;
}>();
const { locale, t } = useI18n();
const message = computed(() => {
  if (props.guest) return t('aiArena.weeklyGameGuest');
  if (props.premium) return t('aiArena.weeklyGamePremium');
  if (!props.weekly) return '';
  if (props.weekly.limit === 0) return t('aiArena.weeklyGameNewAccount');
  if (props.weekly.remaining === 0) return t('aiArena.weeklyGameUsed');
  if (props.launch) return t('aiArena.weeklyGameLaunch');
  if (props.weekly.remaining === 2) return t('aiArena.weeklyGameTwoAvailable');
  return t(props.weekly.limit === 2 ? 'aiArena.weeklyGameOneOfTwo' : 'aiArena.weeklyGameAvailable');
});
const detail = computed(() => {
  if (props.guest || props.premium || !props.weekly) return '';
  if (props.weekly.remaining > 0) {
    if (props.launch) return '';
    return t(props.lobby ? 'aiArena.weeklyLobbyGameDetails' : 'aiArena.weeklyGameDetails');
  }
  const newAccount = props.weekly.limit === 0;
  const availableAt = props.weekly.unlocksAt ?? (newAccount ? undefined : props.weekly.resetsAt);
  const date =
    availableAt === undefined
      ? ''
      : new Intl.DateTimeFormat(locale.value.replace('_', '-'), {
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        }).format(availableAt);
  const reset = date ? t(newAccount ? 'aiArena.weeklyGameUnlock' : 'aiArena.weeklyGameReset', { date }) : '';
  return props.lobby ? [reset, t('aiArena.weeklyLobbyGameDetails')].filter(Boolean).join(' ') : reset;
});
</script>

<style scoped>
.weekly-bot-game {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.09);
  color: rgb(var(--v-theme-text-primary));
  font-size: 14px;
  line-height: 1.4;
  text-align: start;
}
.weekly-bot-game.used {
  background: rgb(var(--v-theme-bg-app));
}
.weekly-bot-game .v-icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: rgb(var(--v-theme-primary));
}
.weekly-bot-game p {
  margin: 3px 0 0;
  color: rgb(var(--v-theme-text-secondary));
  font-size: 13px;
}
</style>
