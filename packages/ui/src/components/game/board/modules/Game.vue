<template>
  <div>
    <template v-if="gameState.history.length">
      <div class="mb-8 d-flex flex-row justify-center text-white align-center history-actions">
        <template v-if="stateManager.viewMode.value === 'live'">
          <History :history="gameState.history" :players="gameState.players" />
          <v-btn
            @click="() => stateManager.toggleViewMode()"
            class="action-icon"
            density="comfortable"
            icon="pause_circle_outline"
            variant="plain"
            color="white"
          ></v-btn>
        </template>
        <template v-else>
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
        </template>
      </div>
    </template>
    <div class="d-flex flex-row mb-4">
      <Mission v-for="mission in missions" :mission="mission" />
    </div>
    <div class="text-white mb-4">Vote stage: {{ gameState.vote + 1 }} / 5</div>
    <div class="button-panel mb-4 d-flex flex-column align-center">
      <InGamePanel v-if="inGamePanel && !visibleHistory && stateManager.viewMode.value === 'live'" :game="gameState" />
    </div>
    <div class="teams text-white font-weight-bold">
      <span class="text-info">{{ gameState.settings.players.good }}</span> vs
      <span class="text-error">{{ gameState.settings.players.evil }}</span>
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
import { gameStateKey, stateManagerKey } from '@/pages/room/game-state-manager';

export default defineComponent({
  name: 'Game',
  components: {
    Mission,
    History,
    InGamePanel,
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
    const roomState = stateManager.getStartedRoomState();

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

    return {
      missions,
      gameState,
      stateManager,
      roomState,
    };
  },
});
</script>

<style scoped lang="scss">
.teams {
  font-size: larger;
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
  height: 44px;
}
</style>
