<template>
  <div class="mission mr-2 d-flex flex-column justify-center" :class="missionClasses">
    <div v-if="!mission.result">
      {{ mission.players }}
    </div>
  </div>
</template>

<script lang="ts">
import type { IMissionWithResult } from '@/components/game/board/interface';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    mission: {
      required: true,
      type: Object as PropType<IMissionWithResult>,
    },
  },
  computed: {
    missionClasses() {
      const classes = [];

      if (this.mission.result === 'fail') {
        classes.push('mission-fail');
      } else if (this.mission.result === 'success') {
        classes.push('mission-success');
      } else {
        classes.push('mission-empty');
      }

      return classes;
    },
  },
});
</script>

<style scoped lang="scss">
.mission {
  width: 65px;
  height: 65px;
  border-radius: 50%;
  font-size: x-large;
  border: 2px solid #f2d8a9;
  background-color: #f2d8a9;
}

.mission-success {
  background-image: url('@/assets/blue_team_no_background.png');
  background-size: contain;
}

.mission-fail {
  background-image: url('@/assets/red_team_no_background.png');
  background-size: contain;
}
</style>
