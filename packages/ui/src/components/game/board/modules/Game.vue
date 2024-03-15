<template>
  <div class="game-container">
    <div class="history-actions mb-4 d-flex flex-column justify-end">
      <div
        class="d-flex flex-column align-center justify-end"
        v-if="
          (!gameState.features.hiddenHistory && gameState.history.length) ||
          gameState.stage === 'end' ||
          stateManager.viewMode.value === 'live'
        "
      >
        <Spoiler :size="{ width: '250px', height: '40px' }">
          <div class="mb-1" v-if="stateManager.viewMode.value === 'live'">
            <History :history="gameState.history" :players="gameState.players" />
            <v-btn
              @click="() => stateManager.toggleViewMode()"
              class="action-icon"
              density="comfortable"
              icon="pause_circle_outline"
              variant="plain"
              color="white"
            ></v-btn>
          </div>
          <template v-else>
            <div class="d-flex align-center justify-center w-100">
              <div class="history-text left-text text-grey">{{ historyTextArray[0] }}</div>
              <div class="history-text">{{ historyTextArray[1] }}</div>
              <div class="history-text right-text text-grey">{{ historyTextArray[2] }}</div>
            </div>
            <div class="d-flex flex-row justify-center align-center">
              <v-btn
                @click="stateManager.moveToPrevStage()"
                :disabled="roomState.pointer === 0"
                class="action-icon navigate-icon"
                density="comfortable"
                icon="navigate_before"
                size="large"
                variant="text"
                color="yellow"
              ></v-btn>
              <div class="history-hint">History mode</div>
              <v-btn
                @click="stateManager.moveToNextStage()"
                :disabled="roomState.pointer === roomState.gameStates.length - 1"
                class="action-icon navigate-icon"
                density="comfortable"
                icon="navigate_next"
                size="large"
                variant="text"
                color="yellow"
              ></v-btn>
              <v-btn
                @click="() => stateManager.toggleViewMode()"
                class="action-icon"
                density="comfortable"
                icon="play_circle_outline"
                variant="plain"
                color="white"
              ></v-btn>
            </div>
          </template>
        </Spoiler>
      </div>
    </div>
    <div class="d-flex flex-row mb-4">
      <Mission v-for="mission in missions" :mission="mission" />
    </div>
    <div class="mb-4">Vote stage: {{ gameState.vote + 1 }} / 5</div>
    <div class="button-panel actions-or-info mb-4 d-flex flex-column align-center">
      <InGamePanel v-if="inGamePanel && !visibleHistory && stateManager.viewMode.value === 'live'" :game="gameState" />
      <div class="d-flex flex-row align-center justify-center" v-if="visibleHistory?.type === 'mission'">
        <template v-for="i in visibleHistory.settings.players">
          <div
            class="mission-result-element"
            :class="'icon-loyalty-' + (i <= visibleHistory.fails ? 'evil' : 'good')"
          ></div>
        </template>
      </div>
      <div class="vote-container" v-if="visibleHistory?.type === 'vote' && visibleHistory.anonymous">
        <template v-for="i in gameState.players.length">
          <i class="material-icons icon-result" :class="i <= visibleHistory.votes.approve ? 'check' : 'close'"></i>
        </template>
      </div>
    </div>
    <div class="meta-info font-weight-bold d-flex justify-space-between">
      <div>
        <span>stage: {{ stageText }}</span>
      </div>
      <div>
        <span class="text-info">{{ gameState.settings.players.good }}</span> vs
        <span class="text-error">{{ gameState.settings.players.evil }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as _ from 'lodash';
import type { IHistoryMission, THistoryResults } from '@avalon/types';
import type { IMissionWithResult } from '@/components/game/board/interface';
import { defineComponent, PropType, computed, inject } from 'vue';
import Mission from '@/components/game/board/modules/Mission.vue';
import History from '@/components/game/information/History.vue';
import InGamePanel from '@/components/game/panels/InGamePanel.vue';
import Spoiler from '@/components/feedback/Spoiler.vue';
import { gameStateKey, stateManagerKey } from '@/helpers/game-state-manager';

export default defineComponent({
  name: 'Game',
  components: {
    Mission,
    History,
    InGamePanel,
    Spoiler,
  },
  props: {
    inGamePanel: {
      required: true,
      type: Boolean,
    },
    visibleHistory: {
      type: Object as PropType<THistoryResults>,
    },
  },
  setup() {
    const gameState = inject(gameStateKey)!;
    const stateManager = inject(stateManagerKey)!;
    const roomState = stateManager.startedRoomState;

    const missions = computed(() => {
      const missions: IMissionWithResult[] = _.cloneDeep(gameState.value.settings.missions);

      gameState.value.history
        .filter((el): el is IHistoryMission => el.type === 'mission')
        .forEach((mission, index) => {
          missions[index].result = mission.result;
          missions[index].fails = mission.fails;
        });

      return missions;
    });

    const historyTextArray = computed(() => {
      const roomState = stateManager.startedRoomState;

      function calculateTextFromPointer(pointer: number): string | undefined {
        if (pointer > roomState.value.gameStates.length - 1 || pointer < 0) {
          return;
        }

        if (pointer === roomState.value.gameStates.length - 1) {
          return 'Live';
        }

        const historyText: { [key in THistoryResults['type']]: string } = {
          vote: 'Vote',
          checkLoyalty: 'Lady',
          mission: 'Mission',
          assassinate: 'Assassinate',
          switchResult: 'Excalibur',
          hidden: 'Hidden',
        };

        const lastElement = _.last(roomState.value.gameStates[pointer].history)!;

        return historyText[lastElement.type];
      }

      return [
        calculateTextFromPointer(roomState.value.pointer - 1),
        calculateTextFromPointer(roomState.value.pointer),
        calculateTextFromPointer(roomState.value.pointer + 1),
      ];
    });

    const stageText = computed(() => {
      return {
        votingForTeam: 'voting',
        useExcalibur: 'excalibur',
        selectTeam: 'team building',
        onMission: 'mission',
        initialization: 'initialization',
        giveExcalibur: 'excalibur',
        checkLoyalty: 'lady of lake',
        end: 'end',
        assassinate: 'assassinate',
        announceLoyalty: 'lady of lake',
        hidden: 'hidden',
      }[gameState.value.stage];
    });

    return {
      missions,
      gameState,
      stateManager,
      stageText,
      roomState,
      historyTextArray,
    };
  },
});
</script>

<style scoped lang="scss">
.meta-info {
  margin: 0 12px;
  font-size: larger;
}

.game-container {
  max-height: 340px;
}

.actions-or-info {
  height: 84px;
}

.action-icon {
  font-size: 24px;
}

.navigate-icon {
  font-size: 30px;
}

.history-hint {
  width: 100px;
}

.history-actions {
  height: 74px;
}

.history-text {
  flex: 1;
  text-align: center;
  font-size: 20px;
  display: inline-block;
}

.left-text {
  text-align: end;
}

.right-text {
  text-align: start;
}
.mission-result-element {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 4px;
}

.icon-loyalty-good {
  background-image: url('@/assets/blue_team_no_background.png');
  border: 2px solid rgb(var(--v-theme-info));
  background-size: contain;
}

.icon-loyalty-evil {
  background-image: url('@/assets/red_team_no_background.png');
  border: 2px solid rgb(var(--v-theme-error));
  background-size: contain;
}

.vote-container {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 220px;
  flex-wrap: wrap;
}

.icon-result {
  font-size: 35px;
  border-radius: 50%;
  border: 2px solid white;

  &.check {
    color: rgb(var(--v-theme-success));
    border-color: rgb(var(--v-theme-success));
  }

  &.close {
    color: rgb(var(--v-theme-error));
    border-color: rgb(var(--v-theme-error));
  }
}
</style>
