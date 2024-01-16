<template>
  <div class="player-container" :class="playerClasses" @click="$emit('playerClick', player.id)">
    <img class="player-frame" alt="frame" src="@/assets/player-frame.png" />
    <div class="player-icon"></div>
    <template v-if="'role' in player">
      <Role class="role-container" :role="player.role" />
      <img v-if="player.features.isLeader" class="player-crown" alt="crown" src="@/assets/crown.png" />
      <i v-if="player.features.vote === 'reject'" class="material-icons action-icon close text-error"></i>
      <i v-if="player.features.vote === 'approve'" class="material-icons action-icon check text-success"></i>
    </template>
    <span class="player-name">{{ player.name }}</span>
  </div>
</template>

<script lang="ts">
import * as _ from 'lodash';
import { defineComponent, PropType } from 'vue';
import type { IPlayerWithVote, TRoomPlayer, THistoryResults } from '@avalon/types';
import Role from '@/components/game/information/Role.vue';

export default defineComponent({
  components: {
    Role,
  },
  props: {
    playerState: {
      type: Object as PropType<IPlayerWithVote | TRoomPlayer>,
      required: true,
    },
    visibleHistory: {
      type: Object as PropType<THistoryResults>,
    },
  },
  computed: {
    player(): IPlayerWithVote | TRoomPlayer {
      if ('features' in this.playerState && this.visibleHistory?.type === 'vote') {
        const clone = _.cloneDeep(this.playerState);
        const userVote = this.visibleHistory.votes.find((player) => player.playerID === clone.id)!;

        clone.features.isLeader = this.visibleHistory.leaderID === clone.id;
        clone.features.isSelected = false;
        clone.features.isSent = userVote.onMission;
        clone.features.vote = userVote.value;
        clone.features.waitForAction = false;

        return clone;
      }

      return this.playerState;
    },

    playerClasses() {
      if ('features' in this.player) {
        return Object.entries(this.player.features).reduce<{ [key: string]: boolean }>((acc, [key, value]) => {
          acc[`player-feature-${key}`] = value;
          return acc;
        }, {});
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

.player-feature-waitForAction .player-name {
  border-color: rgba(65, 105, 225, 0.8);
}

.player-feature-isAssassin .player-name {
  border-color: rgba(220, 20, 60, 0.6);
}

.player-feature-isSelected .player-icon {
  border-color: rgba(255, 245, 50, 0.642);
}

.player-feature-isSent .player-icon {
  border-color: rgba(255, 255, 255, 0.8);
}

.player-crown {
  position: absolute;
  top: -18px;
  left: 20px;
  width: 48px;
}
</style>
