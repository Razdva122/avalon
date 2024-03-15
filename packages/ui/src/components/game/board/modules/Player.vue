<template>
  <div class="player-container" :class="playerClasses" @click="$emit('playerClick', player.id)">
    <img class="player-frame" alt="frame" src="@/assets/player-frame.png" />
    <div class="player-icon"></div>
    <PlayerIcon v-if="'role' in player" class="role-container" :icon="player.role" />
    <img class="player-crown" alt="crown" src="@/assets/crown.png" />
    <div class="player-actions-features">
      <img class="lady-of-lake" alt="lady" src="@/assets/features/lady_of_lake.png" />
      <img class="excalibur" alt="excalibur" src="@/assets/features/excalibur.png" />
    </div>
    <i class="material-icons action-icon close text-error"></i>
    <i class="material-icons action-icon check"></i>
    <div class="switch-image">
      <div class="icon-good-mission"></div>
      <i class="material-icons icon-switch arrow_forward"></i>
      <div class="icon-evil-mission"></div>
    </div>
    <span class="player-name">{{ player.name }}</span>
  </div>
</template>

<script lang="ts">
import * as _ from 'lodash';
import { defineComponent, PropType, inject } from 'vue';
import type { TRoomPlayer, THistoryResults, Dictionary, TGameStage, IActionWithResult } from '@avalon/types';
import type { IFrontendPlayer } from '@/components/game/board/interface';
import { gameStateKey } from '@/helpers/game-state-manager';
import PlayerIcon from '@/components/game/information/PlayerIcon.vue';

export default defineComponent({
  components: {
    PlayerIcon,
  },
  props: {
    playerState: {
      type: Object as PropType<IFrontendPlayer | TRoomPlayer>,
      required: true,
    },
    visibleHistory: {
      type: Object as PropType<THistoryResults>,
    },
    currentStage: {
      type: String as PropType<TGameStage>,
    },
    displayKick: {
      type: Boolean as PropType<boolean>,
    },
  },
  computed: {
    player(): IFrontendPlayer | TRoomPlayer {
      const clone = _.cloneDeep(this.playerState);
      const gameState = inject(gameStateKey)!;

      if ('features' in clone) {
        const isGameEnded = gameState.value.stage === 'end';

        if (this.visibleHistory?.type === 'vote') {
          clone.features.waitForAction = false;

          if (this.visibleHistory.forced) {
            clone.features.vote = 'forced-approve';
          } else {
            if (this.visibleHistory.anonymous !== true) {
              const userVote = this.visibleHistory.votes.find((player) => player.playerID === clone.id)!;

              clone.features.vote = userVote.value;
            }
          }
        }

        if (this.visibleHistory?.type === 'checkLoyalty' && this.visibleHistory.result) {
          if (clone.id === this.visibleHistory.inspectedID) {
            clone.role = this.visibleHistory.result;
          }
        }

        if (this.visibleHistory?.type === 'switchResult' && this.visibleHistory.targetID) {
          if (clone.id === this.visibleHistory.targetID) {
            clone.role = 'excalibur';
          }
        }

        if (this.visibleHistory?.type === 'mission') {
          clone.features.waitForAction = false;
          clone.features.isSelected = false;

          const switchedAction = this.visibleHistory.actions?.find(
            (action) => action.playerID === clone.id && action.switchedBy,
          );

          const visibleAction = this.visibleHistory.actions?.find(
            (action) => action.playerID === clone.id && 'value' in action,
          ) as IActionWithResult;

          if (switchedAction && visibleAction) {
            clone.features.switch = visibleAction.value === 'fail' ? 'toFail' : 'toSuccess';
          } else if (visibleAction) {
            clone.role = visibleAction.value === 'fail' ? 'evil' : 'good';
          } else if (switchedAction) {
            clone.role = 'excalibur';
          }
        }

        if (this.$store.state.hideSpoilers && !isGameEnded) {
          if (clone.role !== 'excalibur') {
            clone.role = 'unknown';
          }

          clone.features.switch = undefined;
        }
      }

      return clone;
    },

    playerClasses() {
      let classes: Dictionary<string | boolean> = {};

      if ('features' in this.player) {
        classes = {
          ...Object.entries(this.player.features).reduce<{ [key: string]: boolean }>((acc, [key, value]) => {
            if (typeof value === 'string') {
              acc[`player-feature-${key}-${value}`] = true;
            } else {
              acc[`player-feature-${key}`] = value;
            }

            return acc;
          }, {}),
          ...classes,
        };

        if (
          this.currentStage === 'checkLoyalty' ||
          (this.currentStage === 'announceLoyalty' && this.player.features.ladyOfLake === 'has')
        ) {
          classes['player-lady-active'] = true;
        }

        if (this.currentStage === 'useExcalibur' && this.player.features.excalibur) {
          classes['player-excalibur-active'] = true;
        }
      } else {
        classes = {
          'player-feature-isLeader': this.player.isLeader,
          'player-feature-kick': Boolean(this.displayKick),
        };
      }

      return classes;
    },
  },
});
</script>

<style scoped lang="scss">
@mixin dropShadowBorder($color, $size) {
  filter: drop-shadow($size $size 0 $color) drop-shadow(-$size $size 0 $color) drop-shadow($size (-$size) 0 $color)
    drop-shadow((-$size) (-$size) 0 $color);
}

.player-container {
  width: 125px;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: all;
}

.player-actions-features {
  display: flex;
  position: absolute;
  height: 40px;
  padding: 5px;
  left: 8px;
  top: 75px;
  border-radius: 5px;
}

.lady-of-lake,
.excalibur {
  display: none;
  height: 30px;
  width: 30px;
  border-radius: 50%;
  border: 2px solid grey;
}

.player-actions-features > img {
  margin-right: 2px;
}

.action-icon {
  position: absolute;
  font-size: 90px;
  top: 12px;
  left: 16px;
}

.player-frame {
  width: 115px;
  height: 115px;
  margin-bottom: 10px;
}

.player-name {
  text-align: center;
  width: 115px;
  @include text-overflow(1);
  background-image: url('@/assets/name-frame.png');
  background-size: 100% 100%;
  color: white;
  @include dropShadowBorder(rgba(0, 0, 0, 0.5), 1px);
}

.player-icon {
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
  @include dropShadowBorder(rgba(65, 105, 225, 0.8), 2px);
}

.player-feature-isAssassin .player-name {
  @include dropShadowBorder(rgba(220, 20, 60, 0.6), 2px);
}

.player-feature-isSelected .player-icon {
  border-color: rgba(255, 245, 50, 0.642);
}

.player-feature-isSent .player-icon {
  border-color: rgba(255, 255, 255, 0.8);
}

.player-feature-isSent.player-feature-isSelected .player-icon {
  outline: 3px solid rgba(255, 245, 50, 0.642);
  border-width: 3px;
}

.player-feature-isLeader .player-crown {
  display: block;
}

.player-crown {
  display: none;
  position: absolute;
  top: -45px;
  left: 5px;
  width: 80px;
  transform: rotate(-15deg);
}

.close,
.check,
.switch-image {
  display: none;
}

.player-feature-vote-reject .close {
  display: block;
}

.player-feature-kick:hover .close {
  opacity: 0.8;
  display: block;
}

@media (hover: none) {
  .player-feature-kick .close {
    opacity: 0.8;
    display: block;
  }
}

.player-feature-kick {
  cursor: pointer;
}

.player-feature-vote-approve .check {
  color: rgb(var(--v-theme-success));
  display: block;
}

.player-feature-vote-forced-approve .check {
  color: rgb(var(--v-theme-info));
  display: block;
}

.player-feature-ladyOfLake-used .lady-of-lake {
  display: block;
  filter: grayscale(1);
}

.player-feature-ladyOfLake-has .lady-of-lake {
  display: block;
}

.player-feature-excalibur .excalibur {
  display: block;
}

.player-excalibur-active .excalibur,
.player-lady-active .lady-of-lake {
  border-color: rgba(65, 105, 225, 0.8);
}

.player-feature-switch-toSuccess {
  .icon-evil-mission {
    order: -1;
  }

  .icon-good-mission {
    order: 1;
  }

  .icon-switch {
    color: rgb(var(--v-theme-info));
  }
}

.icon-switch {
  font-size: 40px;
  color: rgb(var(--v-theme-error));
  @include dropShadowBorder(rgba(255, 255, 255, 1), 0.5px);
}

.player-feature-switch-toSuccess,
.player-feature-switch-toFail {
  .switch-image {
    display: flex;
    position: absolute;
    justify-content: space-between;
    align-items: center;
    top: 35px;
  }
}

.icon-evil-mission,
.icon-good-mission {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.icon-good-mission {
  background-image: url('@/assets/blue_team_no_background.png');
  border: 2px solid rgb(var(--v-theme-info));
  background-size: contain;
}

.icon-evil-mission {
  background-image: url('@/assets/red_team_no_background.png');
  border: 2px solid rgb(var(--v-theme-error));
  background-size: contain;
}
</style>
