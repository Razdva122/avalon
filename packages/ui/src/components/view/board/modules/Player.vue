<template>
  <div class="player-container" :class="playerClasses" @click="$emit('playerClick', player.id)">
    <img class="player-frame" alt="frame" src="@/assets/player-frame.webp" />
    <div class="player-icon"></div>
    <PlayerIcon v-if="'role' in player" class="role-container" :icon="player.role" />
    <div class="player-crown" alt="crown"></div>
    <div class="player-actions-features">
      <img class="lady-of-lake" alt="lady" src="@/assets/features/lady_of_lake.webp" />
      <img class="excalibur" alt="excalibur" src="@/assets/features/excalibur.webp" />
    </div>
    <i class="material-icons action-icon close text-error"></i>
    <i class="material-icons action-icon check"></i>
    <div class="switch-image">
      <div class="icon-good-mission"></div>
      <i class="material-icons icon-switch arrow_forward"></i>
      <div class="icon-evil-mission"></div>
    </div>
    <div class="message-container" v-if="chatMessage?.message">{{ chatMessage?.message }}</div>
    <span class="player-name">
      <span class="player-name-text">
        <span v-if="'index' in player && displayIndex">
          <b>{{ `${player.index}.` }}</b>
        </span>
        {{ player.name }}
      </span>
    </span>
  </div>
</template>

<script lang="ts">
import cloneDeep from 'lodash/cloneDeep';
import { defineComponent, PropType, inject, computed, toRefs, ref } from 'vue';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import type { TRoomPlayer, THistoryResults, Dictionary, TGameStage, IActionWithResult } from '@avalon/types';
import type { IFrontendPlayer } from '@/components/view/board/interface';
import { gameStateKey } from '@/helpers/game-state-manager';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';

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
      type: Boolean,
    },
    displayIndex: {
      type: Boolean,
    },
  },
  setup(props) {
    const gameState = inject(gameStateKey)!;
    const store = useStore();
    const { playerState, visibleHistory, currentStage, displayKick } = toRefs(props);
    const chatMessage = ref<{ message?: string; timeoutId?: number }>();

    socket.on('newMessage', (message) => {
      if (message.author === playerState.value.id) {
        if (chatMessage.value?.timeoutId) {
          window.clearTimeout(chatMessage.value?.timeoutId);
        }

        const timeoutId = window.setTimeout(() => {
          chatMessage.value = {};
        }, 5000);

        chatMessage.value = { message: message.text, timeoutId };
      }
    });

    const player = computed(() => {
      const clone = cloneDeep(playerState.value);

      if ('features' in clone) {
        const isGameEnded = gameState.value.stage === 'end';

        if (visibleHistory.value?.type === 'vote') {
          clone.features.waitForAction = false;

          if (visibleHistory.value.forced) {
            clone.features.vote = 'forced-approve';
          } else {
            if (visibleHistory.value.anonymous !== true) {
              const userVote = visibleHistory.value.votes.find((player) => player.playerID === clone.id)!;

              clone.features.vote = userVote.value;
            }
          }
        }

        if (visibleHistory.value?.type === 'switchLancelots') {
          clone.features.waitForAction = false;
          clone.features.isSelected = false;
          clone.features.isSent = false;
        }

        if (visibleHistory.value?.type === 'checkLoyalty' && visibleHistory.value.result) {
          if (clone.id === visibleHistory.value.inspectedID) {
            clone.role = visibleHistory.value.result;
          }
        }

        if (visibleHistory.value?.type === 'switchResult' && visibleHistory.value.targetID) {
          if (clone.id === visibleHistory.value.targetID) {
            clone.role = 'excalibur';
          }
        }

        if (visibleHistory.value?.type === 'mission') {
          clone.features.waitForAction = false;
          clone.features.isSelected = false;

          const switchedAction = visibleHistory.value.actions?.find(
            (action) => action.playerID === clone.id && action.switchedBy,
          );

          const visibleAction = visibleHistory.value.actions?.find(
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

        if (store.state.hideSpoilers && !isGameEnded) {
          if (clone.role !== 'excalibur') {
            clone.role = 'unknown';
          }

          clone.features.switch = undefined;
        }
      }

      return clone;
    });

    const playerClasses = computed(() => {
      let classes: Dictionary<string | boolean> = {};

      if ('features' in player.value) {
        classes = {
          ...Object.entries(player.value.features).reduce<{ [key: string]: boolean }>((acc, [key, value]) => {
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
          currentStage.value === 'checkLoyalty' ||
          (currentStage.value === 'announceLoyalty' && player.value.features.ladyOfLake === 'has')
        ) {
          classes['player-lady-active'] = true;
        }

        if (currentStage.value === 'useExcalibur' && player.value.features.excalibur) {
          classes['player-excalibur-active'] = true;
        }
      } else {
        classes = {
          'player-feature-isLeader': player.value.isLeader,
          'player-feature-kick': Boolean(displayKick.value),
        };
      }

      return classes;
    });

    return {
      player,
      playerClasses,
      chatMessage,
    };
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
  background-image: url('@/assets/name-frame.webp');
  background-size: 95% 75%;
  background-position: center;
  color: white;
  @include dropShadowBorder(rgba(0, 0, 0, 0.5), 1px);
}

.player-name-text {
  width: 110px;
  @include text-overflow(1);
  margin-left: 2.5px;
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
  background-image: url('@/assets/crown.webp');
  background-size: contain;
  background-position: center;
  position: absolute;
  top: -45px;
  left: 5px;
  width: 80px;
  height: 80px;
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
  background-image: url('@/assets/blue_team_no_background.webp');
  border: 2px solid rgb(var(--v-theme-info));
  background-size: contain;
}

.icon-evil-mission {
  background-image: url('@/assets/red_team_no_background.webp');
  border: 2px solid rgb(var(--v-theme-error));
  background-size: contain;
}

.message-container {
  border-radius: 8px;
  text-align: center;
  padding: 2px 6px;
  background-color: rgb(var(--v-theme-surface-variant));
  position: absolute;
  bottom: 30px;
  @include text-overflow(5);
}
</style>
