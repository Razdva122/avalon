<template>
  <div class="mission">
    <div v-if="!compact">
      <span :class="data.result && (data.result === 'fail' ? 'text-error' : 'text-success')">
        {{ $t('mission.indexMission', { index: data.index + 1 }) }}
      </span>
      <template v-if="data.result === undefined">
        <span> / {{ $t('mission.hidden') }} </span>
      </template>
      <template v-else>
        <span :class="data.result === 'fail' ? 'text-error' : 'text-success'">
          — {{ $t(data.result === 'fail' ? 'mission.failed' : 'mission.succeeded') }}
        </span>
        <span> · {{ $t('mission.failsCount', { count: data.fails }) }} </span>
      </template>
    </div>
    <MissionTeam
      v-if="data.actions?.length"
      :team="data.actions.map((action) => ({ id: action.playerID }))"
      :player-names="playerNames"
      :leader-i-d="data.leaderID"
      :actions="data.actions"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import MissionTeam from './MissionTeam.vue';
import type { THistoryMission } from '@avalon/types';

export default defineComponent({
  components: { MissionTeam },
  props: {
    compact: Boolean,
    data: {
      required: true,
      type: Object as PropType<THistoryMission>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<Record<string, string>>,
    },
  },
});
</script>

<style scoped lang="scss">
.mission {
  font-size: inherit;
  > div:first-child {
    font-weight: 600;
  }
}
</style>
