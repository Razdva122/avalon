<template>
  <div>
    {{
      $t('assassinate.shot', {
        killerName: playerNames[data.assassinID],
        killedName: data.killedIDs.map((id) => playerNames[id]).join(', '),
      })
    }}
  </div>
  <div>
    {{
      $t(data.result === 'hit' ? 'assassinate.shotResultHit' : 'assassinate.shotResultMiss', {
        killedName: data.killedIDs.map((id) => playerNames[id]).join(', '),
        roleName: data.assassinateType,
      })
    }}
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { HistoryAssassinate } from '@avalon/types';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<HistoryAssassinate>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<Record<string, string>>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
