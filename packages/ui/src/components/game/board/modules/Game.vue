<template>
  <div>
    <History v-if="game.history.length" :history="game.history" :players="game.players" />
    <div class="d-flex flex-row mb-4">
      <Mission v-for="mission in missions" :mission="mission" />
    </div>
    <div class="text-white mb-4">Vote stage: {{ game.vote + 1 }} / 5</div>
    <div class="button-panel mb-4 d-flex flex-column align-center">
      <InGamePanel v-if="inGamePanel" :game="game" />
    </div>
    <div class="teams text-white font-weight-bold">
      <span class="text-info">{{ game.settings.players.good }}</span> vs
      <span class="text-error">{{ game.settings.players.evil }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import * as _ from 'lodash';
import type { IVisualGameState, THistoryMission } from '@avalon/types';
import type { IMissionWithResult } from '@/components/game/board/interface';
import { defineComponent, PropType } from 'vue';
import Mission from '@/components/game/board/modules/Mission.vue';
import History from '@/components/game/history/History.vue';
import InGamePanel from '@/components/game/panels/InGamePanel.vue';

export default defineComponent({
  name: 'Game',
  components: {
    Mission,
    History,
    InGamePanel,
  },
  props: {
    game: {
      required: true,
      type: Object as PropType<IVisualGameState>,
    },
    inGamePanel: {
      required: true,
      type: Boolean,
    },
  },
  computed: {
    missions() {
      const missions: IMissionWithResult[] = _.cloneDeep(this.game.settings.missions);

      this.game.history
        .filter((el): el is THistoryMission => el.type === 'mission')
        .forEach((mission, index) => {
          missions[index].result = mission.result;
        });

      return missions;
    },
  },
});
</script>

<style scoped lang="scss">
.teams {
  font-size: larger;
}
</style>
