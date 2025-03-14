<template>
  <div class="d-flex flex-row align-center justify-center">
    <div :class="state.class" class="rounded-circle circle"></div>
    <div class="ml-2 connection-state">{{ state.text }}</div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from '@/store';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  setup() {
    const store = useStore();
    const { t } = useI18n();

    const state = computed(() => {
      const connect = store.state.connect;

      if (connect === null) {
        return {
          class: 'bg-warning',
          text: t('onlineStatus.connecting'),
        };
      }

      if (connect === true) {
        return {
          class: 'bg-success',
          text: t('onlineStatus.connected'),
        };
      }

      return {
        class: 'bg-error',
        text: t('onlineStatus.error'),
      };
    });

    return {
      state,
    };
  },
});
</script>

<style scoped lang="scss">
.circle {
  width: 14px;
  height: 14px;
}

@media only screen and (max-width: 600px) {
  .connection-state {
    display: none;
  }
}
</style>
