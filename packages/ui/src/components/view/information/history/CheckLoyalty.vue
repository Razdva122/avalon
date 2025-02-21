<template>
  <div>
    <span
      v-html="
        $t('checkLoyalty.checkInfo', {
          ladyOwner: calculateNameByID(data.validatorID),
          ladyTarget: calculateNameByID(data.inspectedID),
        })
      "
    ></span>
    <span v-if="data.visibleLoyalty">
      -
      <span :class="data.visibleLoyalty === 'good' ? 'text-success' : 'text-error'">
        {{ getText(data.visibleLoyalty) }}
      </span>
    </span>
  </div>
  <div>
    {{ $t('checkLoyalty.declareInfo') }}
    <span :class="data.result === 'good' ? 'text-success' : 'text-error'"> {{ getText(data.result) }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { CheckLoyalty, TLoyalty, TRoles } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<CheckLoyalty>,
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
