<template>
  <div :title="'role' in player ? player.role : ''" class="player-container" @click="$emit('playerClick', player.id)">
    <img class="player-frame" alt="frame" src="@/assets/player-frame.png" />
    <div class="player-icon" :class="iconClasses"></div>
    <template v-if="'role' in player">
      <div class="player-role-icon" :class="'role-' + player.role"></div>
      <img v-if="player.features.isLeader" class="player-crown" alt="crown" src="@/assets/crown.png" />
    </template>
    <span class="player-name" :class="nameClasses">{{ player.name }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { IPlayer, TRoomPlayer } from '@avalon/types';

export default defineComponent({
  props: {
    player: {
      type: Object as PropType<IPlayer | TRoomPlayer>,
      required: true,
    },
  },
  computed: {
    iconClasses() {
      if ('features' in this.player) {
        return {
          'player-icon-active': this.player.features.waitForAction,
          'player-icon-assassin': this.player.features.isAssassin,
        };
      }

      return {};
    },
    nameClasses() {
      if ('features' in this.player) {
        return {
          'player-name-selected': this.player.features.isSelected,
          'player-name-sent': this.player.features.isSent,
        };
      }

      return {};
    },
  },
});
</script>

<style scoped lang="scss">
.player-container {
  width: 125px;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: all;
}

.player-name {
  width: 125px;
}

.player-frame {
  width: 115px;
}

.player-name {
  @include text-overflow(1);
  background-image: url('@/assets/name-frame.png');
  background-size: contain;
  color: white;
}

.player-role {
  position: absolute;
  top: 50px;
  color: white;
}

.player-icon,
.player-name {
  border-width: 6px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0);
}

.player-icon {
  border-radius: 50%;
}

.player-name {
  border-radius: 8px;
}

.player-icon {
  position: absolute;
  top: 8px;
  width: 100px;
  height: 100px;
}

.player-role-icon {
  position: absolute;
  top: 13px;
  width: 90px;
  height: 90px;
  background-size: 160%;
}

.player-icon-active {
  border-color: rgba(65, 105, 225, 0.8);
  box-shadow:
    2px 4px 8px 0px rgba(130, 144, 255, 0.3),
    2px 4px 16px 0px rgba(130, 144, 255, 0.3);
}

.player-icon-assassin {
  border-color: rgba(220, 20, 60, 0.6);
}

.player-name-selected {
  border-color: rgba(255, 245, 50, 0.642);
}

.player-name-sent {
  border-color: rgba(220, 20, 60, 0.6);
}

.player-crown {
  position: absolute;
  top: -18px;
  left: 20px;
  width: 48px;
}

.player-role-icon {
  border-radius: 50%;
}

.role-merlin {
  background-image: url('@/assets/roles/merlin.png');
  background-position: 50% 22%;
}

.role-morgana {
  background-image: url('@/assets/roles/morgana.png');
  background-position: 47% 35%;
  background-size: 180%;
}

.role-percival {
  background-image: url('@/assets/roles/percival.png');
  background-position: 50% 15%;
  background-size: 170%;
}

.role-mystery-wizard {
  background-image: url('@/assets/roles/mystery.png');
  background-position: 50% 5%;
}

.role-minion {
  background-image: url('@/assets/roles/minion.png');
  background-position: 40% 0%;
  background-size: 150%;
}

.role-servant {
  background-image: url('@/assets/roles/servant.png');
  background-position: 48% 25%;
  background-size: 150%;
}

.role-evil {
  background-image: url('@/assets/red_team_no_background.png');
  background-position: 50% 52%;
  background-size: 135%;
}
</style>
