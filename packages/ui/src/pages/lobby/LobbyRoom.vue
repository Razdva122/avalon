<template>
  <article class="game" :class="{ 'game--open': canJoin }">
    <div class="game-info">
      <div class="game-name">
        <span v-if="game.result?.winner" :class="`${game.result.winner}-loyalty-icon`" aria-hidden="true"></span>
        <span v-else class="material-icons room-icon" aria-hidden="true">{{
          canJoin ? 'meeting_room' : 'sports_esports'
        }}</span>
        <span class="host-name">{{ userName }}</span>
      </div>
      <OptionsPreview v-if="hasOptions" :max-view="5" :roles="game.options.roles" :addons="game.options.addons" />
    </div>
    <span class="game-status" :class="{ 'game-status--open': canJoin }">{{ $t(`mainPage.${status}`) }}</span>
    <span class="players-amount" :aria-label="`${game.players} ${$t('mainPage.players')}`">
      <span class="material-icons" aria-hidden="true">group</span>
      {{ game.state === 'created' && !game.result ? `${game.players}/10` : game.players }}
    </span>
    <RouterLink
      class="room-link"
      :class="{ 'room-link--join': canJoin }"
      :to="{ name: 'room', params: { uuid: game.uuid } }"
      :aria-label="`${$t(`mainPage.${action}`)} — ${userName}`"
    >
      {{ $t(`mainPage.${action}`) }} <span aria-hidden="true">→</span>
    </RouterLink>
  </article>
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
const action = computed(() => (game.value.result ? 'viewGame' : canJoin.value ? 'join' : 'watch'));
</script>

<style scoped lang="scss">
.game {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px 58px 140px;
  align-items: center;
  gap: 12px;
  min-height: 70px;
  padding: 12px 16px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.06);
  border-radius: 12px;
  background: rgb(var(--v-theme-inset));
}
.game--open {
  border-left: 3px solid rgb(var(--v-theme-success));
  padding-left: 14px;
}
.game:hover {
  background: rgb(var(--v-theme-inset-hover));
}
.game-info {
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 12px;
}
.game-name {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.host-name {
  font-size: 14px;
  font-weight: 600;
  @include text-overflow(1);
  overflow-wrap: anywhere;
}
.room-icon {
  font-size: 20px;
  opacity: 0.5;
}
.game-status {
  font-size: 11px;
  color: rgba(var(--v-theme-text-primary), 0.65);
  line-height: 1.4;
}
.game-status--open {
  color: rgb(var(--v-theme-text-primary));
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
.room-link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
}
.game:has(.room-link:focus-visible) {
  outline: 2px solid rgb(var(--v-theme-text-primary));
  outline-offset: 3px;
}
.game :deep(.game-options) {
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
  gap: 3px 0;
}
.game :deep(.preview-link:focus-visible) {
  outline: 2px solid rgb(var(--v-theme-text-primary));
  outline-offset: 3px;
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
    grid-template-columns: minmax(0, 1fr) 80px 48px 140px;
    gap: 8px;
    padding-right: 12px;
  }
}
@media (max-width: 600px) {
  .game {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px 12px;
    padding: 12px;
  }
  .game-info {
    grid-column: 1;
    grid-row: 1;
  }
  .players-amount {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
  }
  .game-status {
    grid-column: 1;
    grid-row: 2;
  }
  .room-link {
    grid-column: 2;
    grid-row: 2;
    min-width: 104px;
    min-height: 40px;
  }
}
</style>
