<template>
  <div class="player-container" @click="$emit('playerClick', player.id)">
    <img class="player-frame" alt="frame" src="@/assets/player-frame.png" />
    <div class="player-icon" :class="iconClasses"></div>
    <template v-if="'role' in player">
      <Role class="role-container" :role="player.role" />
      <img v-if="player.features.isLeader" class="player-crown" alt="crown" src="@/assets/crown.png" />
    </template>
    <span class="player-name" :class="nameClasses">{{ player.name }}</span>
    <i ref="cross" :style="getIconsStyle('cross')" class="material-icons action-icon close text-error"></i>
    <i ref="check" :style="getIconsStyle('check')" class="material-icons action-icon check text-success"></i>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { IPlayer, TRoomPlayer } from '@avalon/types';
import Role from '@/components/game/information/Role.vue';

export default defineComponent({
  components: {
    Role,
  },
  props: {
    player: {
      type: Object as PropType<IPlayer | TRoomPlayer>,
      required: true,
    },
    check: {
      type: Boolean,
    },
    cross: {
      type: Boolean,
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
  methods: {
    getIconsStyle(iconName: 'check' | 'cross') {
      return `display: ${this[iconName] ? 'block' : 'none'}`;
    },
    displayIcon(iconName: 'check' | 'cross', timeout?: number) {
      const style = (<HTMLElement>this.$refs[iconName]).style;
      style.cssText = 'display: block';

      if (timeout) {
        setTimeout(() => {
          style.cssText = 'display: none';
        }, timeout);
      }
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

.action-icon {
  position: absolute;
  font-size: 90px;
  top: 12px;
  left: 16px;
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

.role-container {
  position: absolute;
  top: 13px;
  width: 90px;
  height: 90px;
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
</style>
