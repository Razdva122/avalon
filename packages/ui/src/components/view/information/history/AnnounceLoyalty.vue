<template>
  <div>
    <span
      v-html="
        $t('announceLoyalty.announceInfo', {
          announcer: calculateNameByID(data.announcerID),
          target: calculateNameByID(data.targetID),
        })
      "
    ></span>
  </div>
  <div>
    {{ $t('announceLoyalty.declareInfo') }}
    <span :class="data.announced === 'good' ? 'text-success' : 'text-error'"> {{ getText(data.announced) }}</span>
    <span v-if="data.actual && data.actual !== data.announced">
      ({{ $t('announceLoyalty.actualInfo') }}
      <span :class="data.actual === 'good' ? 'text-success' : 'text-error'"> {{ getText(data.actual) }}</span
      >)
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { AnnounceLoyalty, TLoyalty, TRoles } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<AnnounceLoyalty>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
  methods: {
    getText(result: TRoles | TLoyalty): string {
      if (result === 'good' || result === 'evil') {
        return this.$t('game.' + result);
      }

      return this.$t('roles.' + result);
    },
  },
});
</script>

<style scoped lang="scss"></style>
