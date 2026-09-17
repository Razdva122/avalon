<template>
  <RouterLink
    class="game"
    :class="{ 'game--recruiting': isRecruiting }"
    :to="{ name: 'room', params: { uuid: game.uuid } }"
    :aria-label="`${$t(`mainPage.${action}`)} — ${userName}. ${$t(`mainPage.${status}`)}`"
  >
    <div class="game-info">
      <div class="game-name">
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
      <span>{{ $t(`mainPage.${status}`) }}</span>
    </span>
    <span class="players-amount" :aria-label="`${game.players} ${$t('mainPage.players')}`">
      <span class="material-icons" aria-hidden="true">group</span>
      {{ game.state === 'created' && !game.result ? `${game.players}/10` : game.players }}
    </span>
    <span class="room-link" :class="{ 'room-link--join': canJoin }">
      {{ $t(`mainPage.${action}`) }} <span aria-hidden="true">→</span>
    </span>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { TRoomInfo } from '@avalon/types';
import { useUserProfile } from '@/helpers/composables';
import OptionsPreview from '@/components/view/information/OptionsPreview.vue';

const props = defineProps<{ game: TRoomInfo }>();
const hostID = computed(() => props.game.hostID);
const { userName } = useUserProfile(hostID);
const game = toRef(props, 'game');
const canJoin = computed(() => !game.value.result && game.value.state === 'created' && game.value.players < 10);
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
