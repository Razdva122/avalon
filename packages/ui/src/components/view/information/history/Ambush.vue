<template>
  <div>
    <span
      v-html="
        $t('ambush.history', {
          ownerName: calculateNameByID(data.ownerID),
          targetName: calculateNameByID(data.targetID),
          result: data.result ? $t('inGame.' + data.result) : $t('ambush.resultHidden'),
        })
      "
    >
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { Ambush } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<Ambush>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
