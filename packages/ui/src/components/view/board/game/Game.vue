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
              <div class="history-hint">{{ $t('game.historyMode') }}</div>
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
      <Mission v-for="mission in gameState.missionState" :mission="mission" />
    </div>
    <div class="mb-4">{{ $t('game.voteStage') }}: {{ gameState.vote + 1 }} / 5</div>
    <div class="button-panel actions-or-info mb-4 d-flex flex-column align-center">
      <PlotCardsView
        class="mb-2"
        v-if="gameState.addonsData.plotCards?.activeCards.length"
        :data="gameState.addonsData.plotCards?.activeCards"
      />
      <InGamePanel v-if="inGamePanel && !visibleHistory && stateManager.viewMode.value === 'live'" :game="gameState" />
      <div class="d-flex flex-row align-center justify-center" v-if="visibleHistory?.type === 'mission'">
        <template v-for="i in visibleHistory.settings.players">
          <div
            v-if="visibleHistory.fails !== undefined"
            class="mission-result-element"
            :class="'icon-loyalty-' + (i <= visibleHistory.fails ? 'evil' : 'good')"
          ></div>
          <div v-else class="mission-result-element icon-witch-hidden" :class="computedStyles()"></div>
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
          {{ $t('game.winner') }}:
          <span :class="gameState.result.winner === 'evil' ? 'text-error' : 'text-info'" class="winner-text"
            ><b>{{ $t('game.' + gameState.result.winner) }}</b></span
          >
        </div>
        <div v-else>{{ $t('game.gameIsEnded') }}.</div>
        <div>
          {{ endReason }}
        </div>
      </div>
      <slot name="restart"></slot>
    </div>
    <div class="meta-info font-weight-bold d-flex justify-space-between">
      <div>
        <span>{{ $t('game.stage') + ': ' + $t('game.' + stageText) }}</span>
      </div>
      <div>
        <span class="text-info">{{ gameState.settings.players.good }}</span> vs
        <span class="text-error">{{ gameState.settings.players.evil }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import last from 'lodash/last';
import { useI18n } from 'vue-i18n';
import type { THistoryResults } from '@avalon/types';
import { defineComponent, PropType, computed, inject } from 'vue';
import Mission from '@/components/view/board/game/modules/Mission.vue';
import History from '@/components/view/information/History.vue';
import InGamePanel from '@/components/view/panels/InGamePanel.vue';
import Spoiler from '@/components/feedback/Spoiler.vue';
import { gameStateKey, stateManagerKey } from '@/helpers/game-state-manager';
import LancelotsView from '@/components/view/board/game/modules/LancelotsView.vue';
import PlotCardsView from '@/components/view/board/game/modules/PlotCardsView.vue';
import { computedStyles } from '@/helpers/styles';

export default defineComponent({
  name: 'Game',
  components: {
    Mission,
    History,
    InGamePanel,
    Spoiler,
    LancelotsView,
    PlotCardsView,
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
    const { t } = useI18n();
    const gameState = inject(gameStateKey)!;
    const stateManager = inject(stateManagerKey)!;
    const roomState = stateManager.startedRoomState;

    const endReason = computed(() => {
      if (gameState.value.result) {
        return t('endReason.' + gameState.value.result.reason);
      }
    });

    const historyTextArray = computed(() => {
      const roomState = stateManager.startedRoomState;

      function calculateTextFromPointer(pointer: number): string | undefined {
        if (pointer > roomState.value.gameStates.length - 1 || pointer < 0) {
          return;
        }

        if (pointer === roomState.value.gameStates.length - 1) {
          return t('history.live');
        }

        const lastElement = last(roomState.value.gameStates[pointer].history)!;

        return t(`history.${lastElement.type}`);
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
        checkLoyalty: 'check loyalty',
        witchLoyalty: 'witch loyalty',
        end: 'end',
        switchLancelots: 'lancelots',
        assassinate: 'assassinate',
        announceLoyalty: 'announce loyalty',
        hidden: 'hidden',
        witchAbility: 'witch',
        giveCard: 'give card',
        preVote: 'voting',
        leadToVictory: 'lead to victory',
      }[gameState.value.stage];
    });

    return {
      gameState,
      stateManager,
      endReason,
      stageText,
      roomState,
      historyTextArray,
      computedStyles,
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
  max-width: 380px;
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
  text-align: center;
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
  background-image: getImagePathByID('core', 'blue_team_no_background');
  border: 2px solid rgb(var(--v-theme-info));
  background-size: contain;
}

.icon-loyalty-evil {
  background-image: getImagePathByID('core', 'red_team_no_background');
  border: 2px solid rgb(var(--v-theme-error));
  background-size: contain;
}

.anime-style.icon-witch-hidden {
  background-image: getImagePathByID('roles/anime', 'witch');
}

.icon-witch-hidden {
  background-image: getImagePathByID('roles', 'witch');
  border: 2px solid rgb(var(--v-theme-warning));
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
