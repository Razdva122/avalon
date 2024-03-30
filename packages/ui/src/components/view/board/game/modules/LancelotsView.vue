<template>
  <div class="lancelots-view">
    <div class="preview-container">
      <span
        v-for="(item, index) in data.switches"
        class="material-icons swap-preview"
        :class="index === data.pointer ? 'active-swap' : 'inactive-swap'"
      >
        {{ item === null ? 'question_mark' : item ? 'swap_horiz' : 'close' }}
      </span>
    </div>
    <div class="switch-container" v-if="data.result">
      <PlayerIcon icon="goodLancelot" class="lancelot-icon good-icon" />
      <span class="material-icons swap-icon"> swap_horiz </span>
      <PlayerIcon icon="evilLancelot" class="lancelot-icon evil-icon" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import type { ISwitchLancelots } from '@avalon/types';

export default defineComponent({
  components: {
    PlayerIcon,
  },
  props: {
    data: {
      required: true,
      type: Object as PropType<ISwitchLancelots>,
    },
  },
});
</script>

<style scoped lang="scss">
.lancelot-icon {
  width: 60px;
  height: 60px;
}

.switch-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.good-icon {
  border-radius: 50%;
  border: 2px solid rgb(var(--v-theme-info));
}

.evil-icon {
  border-radius: 50%;
  border: 2px solid rgb(var(--v-theme-error));
}

.swap-preview {
  border-radius: 50%;
  background-color: #f2d8a9;
  border: 3px solid #f2d8a9;
  margin-bottom: 4px;
  color: black;
  font-size: 28px;
}

.lancelots-view {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.preview-container {
  display: flex;
  gap: 4px;
}

.swap-icon {
  font-size: 36px;
}

.active-swap {
  border-color: rgb(var(--v-theme-info));
}
</style>
