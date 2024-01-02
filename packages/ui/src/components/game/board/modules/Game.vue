<template>
  <div>
    <div v-for="mission in missions" class="d-flex flex-row">
      <Mission :mission="mission" />
    </div>
    <div>Vote stage: {{ game.vote }}</div>
  </div>
</template>

<script lang="ts">
import * as _ from 'lodash';
import type { IVisualGameState, THistoryMission } from '@avalon/types';
import type { IMissionWithResult } from '@/components/game/board/interface';
import { defineComponent, PropType } from 'vue';
import Mission from '@/components/game/board/modules/Mission.vue';

export default defineComponent({
  name: 'Game',
  components: {
    Mission,
  },
  props: {
    game: {
      required: true,
      type: Object as PropType<IVisualGameState>,
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

<style scoped lang="scss"></style>
