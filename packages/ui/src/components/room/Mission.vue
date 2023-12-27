<template>
  <div class="mission mr-2">
    {{ mission.result }}
  </div>
</template>

<script lang="ts">
import type { IMissionWithResult } from '@/components/room/interface';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    mission: {
      required: true,
      type: Object as PropType<IMissionWithResult>,
    },
  },
});
</script>

<style scoped lang="scss">
.mission {
  width: 64px;
  height: 64px;
}
</style>
