<template>
  <div class="player-container" @click="$emit('playerClick', player.id)">
    <img class="player-frame" alt="frame" src="@/assets/player-frame.png" />
    <div class="player-icon" :class="iconClasses"></div>
    <template v-if="'role' in player && player.role !== 'unknown'">
      <span class="player-role">{{ player.role }}</span>
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

.player-icon-active {
  border-color: rgba(173, 255, 47, 0.6);
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
</style>
