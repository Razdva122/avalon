<template>
  <div class="game-container">
    <div class="history-actions mb-4 d-flex flex-column justify-end">
      <div
        class="d-flex flex-column align-center justify-end"
        v-if="
          (!gameState.features.hiddenHistory && gameState.history.length) ||
          gameState.stage === 'end' ||
          stateManager.viewMode.value === 'history'
        "
      >
        <Spoiler :size="{ width: '250px', height: '40px' }">
          <div class="mb-1" v-if="stateManager.viewMode.value === 'live'">
            <History
              :history="gameState.history"
              :players="gameState.players"
              :display-index="gameState.features.displayIndex"
            />
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
      <LancelotsView v-if="visibleHistory?.type === 'switchLancelots'" :data="visibleHistory"></LancelotsView>
      <div v-if="gameState.result && stateManager.viewMode.value === 'live'" class="game-result">
        <div v-if="gameState.result.winner">
          Winner:
          <span :class="gameState.result.winner === 'evil' ? 'text-error' : 'text-info'" class="winner-text"
            ><b>{{ gameState.result.winner }}</b></span
          >
        </div>
        <div v-else>Game is ended.</div>
        <div>
          {{ endReason }}
        </div>
      </div>
      <slot name="restart"></slot>
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
import cloneDeep from 'lodash/cloneDeep';
import last from 'lodash/last';
import type { IHistoryMission, THistoryResults, TGameEndReasons } from '@avalon/types';
import type { IMissionWithResult } from '@/components/view/board/interface';
import { defineComponent, PropType, computed, inject } from 'vue';
import Mission from '@/components/view/board/game/modules/Mission.vue';
import History from '@/components/view/information/History.vue';
import InGamePanel from '@/components/view/panels/InGamePanel.vue';
import Spoiler from '@/components/feedback/Spoiler.vue';
import { gameStateKey, stateManagerKey } from '@/helpers/game-state-manager';
import LancelotsView from '@/components/view/board/game/modules/LancelotsView.vue';

export default defineComponent({
  name: 'Game',
  components: {
    Mission,
    History,
    InGamePanel,
    Spoiler,
    LancelotsView,
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
      const missions: IMissionWithResult[] = cloneDeep(gameState.value.settings.missions);

      gameState.value.history
        .filter((el): el is IHistoryMission => el.type === 'mission')
        .forEach((mission, index) => {
          missions[index].result = mission.result;
          missions[index].fails = mission.fails;
        });

      return missions;
    });

    const endReason = computed(() => {
      if (gameState.value.result) {
        const resultText: { [key in TGameEndReasons]: string } = {
          manualy: 'The game is finished manually',
          evilTeamMissions: 'The evil team failed 3 missions',
          goodTeamMissions: 'The good team successes 3 missions',
          missMerlin: 'The evil team tried to kill Merlin but missed',
          missGuinevere: 'The evil team tried to kill Guinevere but missed',
          missLovers: 'The evil team tried to kill Lovers but missed',
          killGuinevere: 'The evil team killed Guinevere',
          killLovers: 'The evil team killed Lovers',
          killMerlin: 'The evil team killed Merlin',
        };

        return resultText[gameState.value.result.reason];
      }
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
          switchLancelots: 'Lancelots',
          hidden: 'Hidden',
        };

        const lastElement = last(roomState.value.gameStates[pointer].history)!;

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
        switchLancelots: 'lancelots',
        assassinate: 'assassinate',
        announceLoyalty: 'lady of lake',
        hidden: 'hidden',
      }[gameState.value.stage];
    });

    return {
      missions,
      gameState,
      stateManager,
      endReason,
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

.game-result {
  font-size: 18px;
}

.icon-loyalty-good {
  background-image: url('@/assets/blue_team_no_background.webp');
  border: 2px solid rgb(var(--v-theme-info));
  background-size: contain;
}

.icon-loyalty-evil {
  background-image: url('@/assets/red_team_no_background.webp');
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

.winner-text {
  text-transform: uppercase;
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
