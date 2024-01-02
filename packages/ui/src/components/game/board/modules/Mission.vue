<template>
  <div class="mission mr-2 d-flex flex-column justify-center" :class="missionClasses">
    <div>
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
        classes.push('bg-error');
      } else if (this.mission.result === 'success') {
        classes.push('bg-success');
      } else {
        classes.push('bg-blue-grey-lighten-2');
      }

      return classes;
    },
  },
});
</script>

<style scoped lang="scss">
.mission {
  width: 75px;
  height: 75px;
  border-radius: 50%;
  font-size: x-large;
}
</style>
