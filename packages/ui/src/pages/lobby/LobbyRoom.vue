<template>
  <RouterLink
    class="game"
    :class="{ 'game--recruiting': isRecruiting, 'game--ai': game.ai }"
    :to="{ name: 'room', params: { uuid: game.uuid } }"
    :aria-label="
      game.ai
        ? `${game.aiTitle || $t('aiArena.title')}. ${$t('aiArena.language', { language: aiLanguageLabel })}. ${aiStatusLabel}. ${aiAction}`
        : `${$t(`mainPage.${action}`)} — ${userName}. ${$t(`mainPage.${status}`)}`
    "
  >
    <div class="game-info">
      <div v-if="game.ai" class="ai-identity">
        <span class="ai-emblem" aria-hidden="true"
          ><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7">
            <rect x="4" y="6" width="16" height="15" rx="5" />
            <path d="M12 6V3M1 12v4m22-4v4M9 17h6" />
            <circle cx="9" cy="12" r="1" fill="currentColor" />
            <circle cx="15" cy="12" r="1" fill="currentColor" /></svg
        ></span>
        <div class="ai-heading">
          <span class="ai-title">{{ aiTitle }}</span>
          <div class="ai-meta">
            <span>{{
              $t(game.aiTitle ? 'aiArena.mixedPlayerCount' : 'aiArena.playerCount', {
                count: game.players - (game.aiTitle ? 1 : 0),
              })
            }}</span>
            <span class="ai-language">{{ aiLanguageLabel }}</span>
            <span v-if="aiModeLabel" class="ai-mode">{{ aiModeLabel }}</span>
          </div>
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
          ><i v-if="game.aiStatus === 'running'" aria-hidden="true"></i>
          <span v-else-if="game.result?.winner" :class="`${game.result.winner}-loyalty-icon`" aria-hidden="true"></span>
          {{ aiStatusLabel }}</span
        >
        <small class="ai-date">{{ aiDate }}</small>
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

const props = defineProps<{ game: TRoomInfo }>();
const hostID = computed(() => props.game.hostID);
const { userName } = useUserProfile(hostID);
const game = toRef(props, 'game');
const { locale, t } = useI18n();
const aiLanguageLabel = computed(
  () => ({ en: 'English', ru: 'Русский', 'zh-tw': '繁體中文（台灣）' })[game.value.aiLanguage || 'en'],
);
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
const aiTitle = computed(
  () => game.value.aiTitle?.replace(/ vs \d+ Bots$/, '') || t('aiArena.tagline', { count: game.value.players }),
);
const aiModeLabel = computed(() =>
  game.value.aiBeginner
    ? t('aiArena.cardBeginner')
    : game.value.aiBotDifficulty
      ? t(game.value.aiBotDifficulty === 'smart' ? 'aiArena.botSmart' : 'aiArena.botRegular')
      : '',
);
const aiAction = computed(() => t(`aiArena.${game.value.aiStatus === 'running' ? 'cardWatch' : 'cardDiscussion'}`));
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
  color: rgb(var(--v-theme-on-primary));
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
  min-height: 84px;
  grid-template-columns: minmax(0, 1fr) 148px 48px 116px;
  padding: 12px 16px;
  border-color: rgba(var(--v-theme-text-primary), 0.12);
}
.game--ai:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
}
.game--ai .game-info {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}
.ai-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.ai-emblem {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
}
.ai-heading {
  display: grid;
  gap: 5px;
  min-width: 0;
}
.ai-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ai-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: rgba(var(--v-theme-text-primary), 0.7);
}
.ai-language,
.ai-mode {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 16px;
}
.ai-language {
  border: 1px solid rgba(var(--v-theme-text-primary), 0.18);
  color: rgb(var(--v-theme-text-primary));
}
.ai-mode {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
.ai-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-text-primary));
}
.ai-status i {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  background: rgb(var(--v-theme-success));
  border-radius: 50%;
}
.ai-date {
  display: block;
  margin-top: 5px;
  font-size: 11px;
}
.game--ai .room-link {
  min-height: 44px;
  white-space: nowrap;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}
.game--ai :deep(.game-options) {
  flex: none;
  overflow: hidden;
  gap: 0;
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
@media (max-width: 1100px) {
  .game--ai .game-info {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }
  .game--ai :deep(.game-options) {
    margin-left: 42px;
  }
}
@media (max-width: 600px) {
  .game--ai {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px 12px;
    padding: 12px;
  }
  .game--ai .game-info {
    padding-right: 32px;
  }
  .ai-meta > span:first-child {
    flex-basis: 100%;
  }
  .game--ai .players-amount {
    top: 14px;
  }
  .game--ai .room-link {
    min-width: 104px;
  }
}
</style>
