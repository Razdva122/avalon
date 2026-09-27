<template>
  <div>
    <i18n-t keypath="ambush.history" tag="span" scope="global">
      <template #ownerName
        ><b>{{ playerNames[data.ownerID] }}</b></template
      >
      <template #targetName
        ><b>{{ playerNames[data.targetID] }}</b></template
      >
      <template #result>{{ data.result ? $t('inGame.' + data.result) : $t('ambush.resultHidden') }}</template>
    </i18n-t>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { Ambush } from '@avalon/types';
import type { TPlayerNames } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<Ambush>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<TPlayerNames>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
