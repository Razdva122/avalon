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
    <span v-if="game.ai" class="game-emblem ai-emblem" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7">
        <rect x="4" y="6" width="16" height="15" rx="5" />
        <path d="M12 6V3M1 12v4m22-4v4M9 17h6" />
        <circle cx="9" cy="12" r="1" fill="currentColor" />
        <circle cx="15" cy="12" r="1" fill="currentColor" />
      </svg>
    </span>
    <span
      v-else-if="game.result?.winner"
      class="game-emblem"
      :class="`${game.result.winner}-loyalty-icon`"
      aria-hidden="true"
    />
    <span v-else class="game-emblem material-icons room-icon" aria-hidden="true">{{
      game.result ? 'flag' : canJoin ? 'meeting_room' : 'sports_esports'
    }}</span>
    <div class="game-info">
      <div class="game-heading" :title="game.ai ? aiTitle : userName">
        <span v-if="game.ai" class="ai-title">{{ aiTitle }}</span>
        <span v-else class="host-name">{{ userName }}</span>
      </div>
      <div class="game-details">
        <div v-if="game.ai" class="ai-meta">
          <span>{{ aiRosterLabel }}</span>
          <span v-if="game.aiOpenSeats" class="ai-open-seat">{{ $t('aiArena.cardFriendSeatOpen') }}</span>
          <span class="ai-language">{{ aiLanguageLabel }}</span>
          <span v-if="aiModeLabel" class="ai-mode">{{ aiModeLabel }}</span>
        </div>
        <span v-else class="players-amount" :aria-label="`${game.players} ${$t('mainPage.players')}`">
          <span class="material-icons" aria-hidden="true">group</span>
          {{ game.state === 'created' && !game.result ? `${game.players}/10` : game.players }}
        </span>
        <OptionsPreview
          v-if="hasOptions"
          :linked="false"
          :max-view="5"
          :roles="game.options.roles"
          :addons="game.options.addons"
        />
      </div>
    </div>
    <span
      class="game-status"
      :class="{
        'game-status--recruiting': isRecruiting,
        'game-status--playing': !game.ai && game.state === 'started' && !game.result,
      }"
    >
      <template v-if="game.ai">
        <span class="ai-status" :class="{ 'ai-status--live': game.aiStatus === 'running' }">
          <i v-if="game.aiStatus === 'running'" aria-hidden="true"></i>
          <span v-else-if="game.result?.winner" :class="`${game.result.winner}-loyalty-icon`" aria-hidden="true"></span>
          {{ aiStatusLabel }}
        </span>
      </template>
      <span v-else class="human-status"
        ><i v-if="isRecruiting || (game.state === 'started' && !game.result)" aria-hidden="true"></i
        >{{ $t(`mainPage.${status}`) }}</span
      >
      <small v-if="game.result || (game.ai && ['finished', 'stopped'].includes(game.aiStatus || ''))" class="ai-date">{{
        aiDate
      }}</small>
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
  () =>
    ({ en: 'English', ru: 'Русский', 'zh-tw': '繁體中文（台灣）', es: 'Español', vi: 'Tiếng Việt' })[
      game.value.aiLanguage || 'en'
    ],
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
const aiRosterLabel = computed(() => {
  const humans = game.value.aiHumanCount ?? (game.value.aiTitle ? 1 : 0);
  const bots = game.value.aiBotCount ?? game.value.players - humans;
  if (humans > 1) return t('aiArena.cardHumanRoster', { humans, bots });
  return t(humans === 1 ? 'aiArena.mixedPlayerCount' : 'aiArena.playerCount', { count: bots });
});
const aiModeLabel = computed(() =>
  game.value.aiBeginner
    ? t('aiArena.cardBeginner')
    : game.value.aiBotDifficulty
      ? t(game.value.aiBotDifficulty === 'smart' ? 'aiArena.cardSmart' : 'aiArena.cardRegular')
      : '',
);
const aiAction = computed(() => t(game.value.aiStatus === 'running' ? 'aiArena.cardWatch' : 'mainPage.viewGame'));
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
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 124px minmax(140px, max-content);
  align-items: center;
  gap: 12px;
  min-height: 84px;
  padding: 12px 16px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.08);
  border-radius: 10px;
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
}
.game:hover {
  background: rgb(var(--v-theme-inset-hover));
  border-color: rgba(var(--v-theme-primary), 0.25);
}
.game:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
.game--recruiting {
  border-left: 3px solid rgb(var(--v-theme-success));
  padding-left: 14px;
}
.game-emblem {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.ai-emblem {
  background: rgba(var(--v-theme-primary), 0.08);
  border-radius: 8px;
  color: rgb(var(--v-theme-primary));
}
.room-icon {
  font-size: 22px;
  color: rgba(var(--v-theme-text-primary), 0.5);
}
.game-info,
.game-heading {
  min-width: 0;
}
.host-name,
.ai-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}
.game-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 5px;
  min-width: 0;
}
.players-amount {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: rgba(var(--v-theme-text-primary), 0.65);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.players-amount .material-icons {
  font-size: 16px;
}
.game :deep(.game-options) {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  max-width: 100%;
}
.game :deep(.game-options > div) {
  flex-shrink: 0;
}
.game :deep(.icon-in-link) {
  width: 24px;
  height: 24px;
}
.ai-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 8px;
  min-width: 0;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(var(--v-theme-text-primary), 0.65);
}
.ai-language {
  color: rgba(var(--v-theme-text-primary), 0.8);
}
.ai-language::before {
  content: '·';
  margin-right: 8px;
  color: rgba(var(--v-theme-text-primary), 0.4);
}
.ai-mode {
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
}
.ai-open-seat {
  color: rgb(var(--v-theme-primary));
}
.game-status {
  min-width: 0;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(var(--v-theme-text-primary), 0.65);
}
.ai-status,
.human-status {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ai-status--live,
.game-status--playing,
.game-status--recruiting {
  color: rgb(var(--v-theme-text-primary));
  font-weight: 500;
}
.ai-status i,
.human-status i {
  display: block;
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  background: rgb(var(--v-theme-success));
  border-radius: 50%;
}
.game-status--playing .human-status i {
  background: rgb(var(--v-theme-primary));
}
.ai-date {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  font-weight: 400;
  color: rgba(var(--v-theme-text-primary), 0.6);
}
.room-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: rgba(var(--v-theme-text-primary), 0.8);
}
.room-link--join {
  color: rgb(var(--v-theme-primary));
  border: 1px solid rgba(var(--v-theme-primary), 0.22);
  background: rgba(var(--v-theme-primary), 0.08);
}
.game:hover .room-link--join {
  background: rgba(var(--v-theme-primary), 0.14);
}
@import '@/styles/loyalty-icons.scss';
.game-status .evil-loyalty-icon,
.game-status .good-loyalty-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
@container lobby-games (max-width: 760px) {
  .game {
    grid-template-columns: 28px minmax(0, 1fr) 112px minmax(134px, max-content);
    gap: 10px;
    padding: 12px;
  }
  .game-emblem {
    width: 28px;
    height: 28px;
  }
  .game--recruiting {
    padding-left: 10px;
  }
}
@container lobby-games (max-width: 600px) {
  .game {
    grid-template-columns: 28px minmax(0, 1fr) max-content;
    gap: 8px 10px;
    align-items: start;
  }
  .game-info {
    grid-column: 2 / -1;
  }
  .game-emblem {
    grid-row: 1;
  }
  .game-status {
    grid-column: 1 / 3;
    grid-row: 2;
    align-self: center;
  }
  .room-link {
    grid-column: 3;
    grid-row: 2;
    justify-self: end;
    padding-inline: 8px;
  }
  .game-details {
    gap: 6px 8px;
  }
}
</style>
