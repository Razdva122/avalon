<template>
  <div class="d-flex flex-row align-center justify-center">
    <div :class="state.class" class="rounded-circle circle"></div>
    <div class="ml-2 connection-state">{{ state.text }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  computed: {
    state() {
      const { connect } = this.$store.state;

      if (connect === null) {
        return {
          class: 'bg-warning',
          text: this.$t('onlineStatus.connecting'),
        };
      }

      if (connect === true) {
        return {
          class: 'bg-success',
          text: this.$t('onlineStatus.connected'),
        };
      }

      return {
        class: 'bg-error',
        text: this.$t('onlineStatus.error'),
      };
    },
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
