<template>
  <div class="mission-container">
    <v-tooltip :disabled="!mission.result && !mission.hidden" location="top center" origin="auto" no-click-animation>
      <template v-slot:activator="{ props: tooltip }">
        <div v-bind="tooltip" class="mission mr-2 d-flex flex-column justify-center" :class="missionClasses">
          <div v-if="!mission.result">
            {{ mission.players }}
          </div>
        </div>
      </template>

      <div>{{ $t('mission.players') }}: {{ mission.players }}</div>
      <div>{{ $t('mission.fails') }}: {{ mission.fails === undefined ? '?' : mission.fails }}</div>
    </v-tooltip>
    <div class="fails" v-if="mission.failsRequired > 1">{{ $t('mission.fails') }}: {{ mission.failsRequired }}</div>
  </div>
</template>

<script lang="ts">
import type { IMissionWithResult } from '@/components/view/board/interface';
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
      } else if (this.mission.hidden === true) {
        classes.push('mission-hidden');
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
  text-align: center;
  width: 65px;
  height: 65px;
  border-radius: 50%;
  font-size: x-large;
  border: 2px solid #f2d8a9;
  background-color: #f2d8a9;
  color: black;
}

.mission-success {
  background-image: url('@/assets/blue_team_no_background.webp');
  background-size: contain;
}

.mission-fail {
  background-image: url('@/assets/red_team_no_background.webp');
  background-size: contain;
}

.mission-hidden {
  background-image: url('@/assets/roles/witch.webp');
  background-size: contain;
}

.mission-container {
  max-width: 73px;
}

.fails {
  white-space: nowrap;
}
</style>
