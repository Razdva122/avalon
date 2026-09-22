<template>
  <RouterLink
    class="game"
    :class="{ 'game--recruiting': isRecruiting, 'game--ai': game.ai }"
    :to="{ name: 'room', params: { uuid: game.uuid } }"
    :aria-label="
      game.ai
        ? `${$t('aiArena.title')}. ${aiStatusLabel}. ${aiAction}`
        : `${$t(`mainPage.${action}`)} — ${userName}. ${$t(`mainPage.${status}`)}`
    "
  >
    <div class="game-info">
      <div v-if="game.ai" class="ai-identity">
        <span class="ai-emblem" aria-hidden="true"
          ><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7">
            <rect x="4" y="6" width="16" height="15" rx="5" />
            <path d="M12 6V3M1 12v4m22-4v4M9 17h6" />
            <circle cx="9" cy="12" r="1" fill="currentColor" />
            <circle cx="15" cy="12" r="1" fill="currentColor" /></svg
        ></span>
        <div class="ai-heading">
          <div class="ai-eyebrow">
            {{ $t('aiArena.title') }} <span>{{ $t('aiArena.english') }}</span>
          </div>
          <span class="ai-title">{{ $t('aiArena.tagline') }}</span>
          <span class="ai-subtitle">{{ $t('aiArena.subtitle') }}</span>
          <span v-if="game.aiModel" class="ai-subtitle">{{ $t('aiArena.model', { model: game.aiModel }) }}</span>
        </div>
      </div>
      <div v-if="!game.ai" class="game-name">
        <span v-if="game.result?.winner" :class="`${game.result.winner}-loyalty-icon`" aria-hidden="true"></span>
        <span v-else class="material-icons room-icon" aria-hidden="true">{{
          game.result ? 'flag' : canJoin ? 'meeting_room' : 'sports_esports'
        }}</span>
        <span class="host-name">{{ userName }}</span>
      </div>
      <OptionsPreview
        v-if="hasOptions"
        :linked="false"
        :max-view="5"
        :roles="game.options.roles"
        :addons="game.options.addons"
      />
    </div>
    <span class="game-status" :class="{ 'game-status--recruiting': isRecruiting }">
      <span v-if="isRecruiting" class="material-icons recruitment-icon" aria-hidden="true">person_add</span>
      <template v-if="game.ai">
        <span class="ai-status" :class="{ 'ai-status--live': game.aiStatus === 'running' }"
          ><i aria-hidden="true"></i>{{ aiStatusLabel }}</span
        >
        <small class="ai-date">{{ aiDate }}</small>
        <small v-if="cost !== undefined" class="ai-cost">{{ cost.toFixed(2) }} ₽</small>
      </template>
      <span v-else>{{ $t(`mainPage.${status}`) }}</span>
    </span>
    <span class="players-amount" :aria-label="`${game.players} ${$t('mainPage.players')}`">
      <span class="material-icons" aria-hidden="true">group</span>
      {{ game.state === 'created' && !game.result ? `${game.players}/10` : game.players }}
    </span>
    <span class="room-link" :class="{ 'room-link--join': canJoin }">
      {{ game.ai ? aiAction : $t(`mainPage.${action}`) }} <span aria-hidden="true">→</span>
    </span>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TRoomInfo } from '@avalon/types';
import { useUserProfile } from '@/helpers/composables';
import OptionsPreview from '@/components/view/information/OptionsPreview.vue';

const props = defineProps<{ game: TRoomInfo; cost?: number }>();
const hostID = computed(() => props.game.hostID);
const { userName } = useUserProfile(hostID);
const game = toRef(props, 'game');
const { locale, t } = useI18n();
const aiDate = computed(() =>
  new Date(game.value.startAt || game.value.createAt).toLocaleString(locale.value, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }),
);
const aiStatusLabel = computed(() => {
  if (game.value.aiStatus === 'finished' && game.value.result?.winner)
    return t(`aiArena.${game.value.result.winner === 'good' ? 'goodWon' : 'evilWon'}`);
  return t(`aiArena.${game.value.aiStatus || (game.value.result ? 'finished' : 'ready')}`);
});
const aiAction = computed(() => t(`aiArena.${game.value.aiStatus === 'running' ? 'watch' : 'discussion'}`));
const canJoin = computed(
  () => !game.value.ai && !game.value.result && game.value.state === 'created' && game.value.players < 10,
);
const hasOptions = computed(() =>
  [...Object.values(game.value.options.roles), ...Object.values(game.value.options.addons)].some(Boolean),
);
const status = computed(() => {
  if (game.value.result) return 'finished';
  if (game.value.state === 'locked') return 'starting';
  if (game.value.state === 'started') return 'inProgress';
  if (game.value.players >= 10) return 'full';
  return game.value.options.features?.lookingForPlayers ? 'lookingForPlayers' : 'waiting';
});
const isRecruiting = computed(() => canJoin.value && status.value === 'lookingForPlayers');
const action = computed(() => (game.value.result ? 'viewGame' : canJoin.value ? 'join' : 'watch'));
</script>

<style scoped lang="scss">
.game {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px 58px 140px;
  align-items: center;
  gap: 12px;
  min-height: 58px;
  padding: 8px 14px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.06);
  border-radius: 12px;
  background: rgb(var(--v-theme-inset));
}
.game--recruiting {
  border-left: 3px solid rgb(var(--v-theme-success));
  padding-left: 12px;
}
.game:hover {
  background: rgb(var(--v-theme-inset-hover));
}
.game-info {
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
}
.game-name {
  min-width: 0;
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  gap: 8px;
}
.game-info:has(.game-options) .game-name {
  max-width: 45%;
}
.host-name {
  font-size: 14px;
  font-weight: 600;
  @include text-overflow(1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.room-icon {
  flex-shrink: 0;
  font-size: 20px;
  opacity: 0.5;
}
.game-status {
  min-width: 0;
  font-size: 11px;
  color: rgba(var(--v-theme-text-primary), 0.65);
  line-height: 1.4;
}
.game-status--recruiting {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 6px;
  max-width: 100%;
  padding: 5px 8px;
  border: 1px solid rgba(var(--v-theme-success), 0.32);
  border-radius: 6px;
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-text-primary));
  font-weight: 600;
}
.recruitment-icon {
  flex-shrink: 0;
  font-size: 17px;
  color: rgb(var(--v-theme-success));
}
.players-amount {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.players-amount .material-icons {
  font-size: 16px;
  opacity: 0.5;
}
.room-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}
.room-link--join {
  background: rgb(var(--v-theme-primary));
  color: white;
}
.game:focus-visible {
  outline: 2px solid rgb(var(--v-theme-text-primary));
  outline-offset: 3px;
}
.game :deep(.game-options) {
  flex: 1 1 0;
  min-width: 0;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: thin;
  gap: 0;
}
.game :deep(.game-options > div) {
  flex-shrink: 0;
}
.game--ai {
  min-height: 112px;
  border-color: rgba(137, 101, 224, 0.42);
  background: linear-gradient(110deg, rgba(137, 101, 224, 0.13), transparent 70%), rgb(var(--v-theme-inset));
  box-shadow: inset 3px 0 0 #9670e8;
}
.game--ai:hover {
  border-color: #9670e8;
  background: linear-gradient(110deg, rgba(137, 101, 224, 0.2), transparent), rgb(var(--v-theme-inset-hover));
}
.game--ai .game-info {
  flex-wrap: wrap;
  gap: 10px 14px;
}
.ai-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
}
.ai-emblem {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  border-radius: 14px;
  background: #7050b5;
  color: #fff;
  font-size: 26px;
  box-shadow: 0 3px 12px #7050b529;
}
.ai-heading {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.ai-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}
.ai-eyebrow span {
  font-size: 8px;
  letter-spacing: 0.6px;
  padding: 2px 5px;
  border-radius: 4px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.25);
}
.ai-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}
.ai-subtitle {
  font-size: 10px;
  opacity: 0.7;
  line-height: 1.4;
}
.ai-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: rgb(var(--v-theme-text-primary));
}
.ai-status i {
  width: 6px;
  height: 6px;
  background: #999;
  border-radius: 50%;
}
.ai-status--live i {
  background: #45bd87;
  box-shadow: 0 0 0 3px #45bd8725;
}
.ai-date {
  display: block;
  margin-top: 4px;
  font-size: 10px;
}
.ai-cost {
  font-size: 11px;
  display: block;
  margin-top: 5px;
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
.game--ai .room-link {
  background: rgba(137, 101, 224, 0.15);
  border: 1px solid rgba(137, 101, 224, 0.22);
}
.game--ai :deep(.game-options) {
  flex: 0 1 auto;
  margin-left: 58px;
}
@media (max-width: 600px) {
  .game--ai {
    padding: 14px;
    gap: 12px;
  }
  .game--ai .game-info {
    padding-right: 0;
  }
  .game--ai .players-amount {
    top: 14px;
    font-size: 11px;
  }
  .game--ai .ai-eyebrow {
    padding-right: 42px;
  }
  .game--ai .ai-title {
    font-size: 14px;
  }
}
@import '@/styles/loyalty-icons.scss';
.evil-loyalty-icon,
.good-loyalty-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
}
@media (max-width: 1100px) {
  .game {
    grid-template-columns: minmax(0, 1fr) 112px 48px 140px;
    gap: 8px;
    padding-right: 12px;
  }
}
@media (max-width: 600px) {
  .game {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 12px;
    padding: 8px 12px;
  }
  .game-info {
    grid-column: 1 / -1;
    grid-row: 1;
    padding-right: 44px;
    min-height: 28px;
  }
  .players-amount {
    position: absolute;
    right: 12px;
    top: 14px;
  }
  .game-status {
    grid-column: 1;
    grid-row: 2;
  }
  .room-link {
    grid-column: 2;
    grid-row: 2;
    min-width: 104px;
    min-height: 36px;
  }
}
</style>
