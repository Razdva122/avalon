<template>
  <span> V: {{ APP_VERSION }} </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data() {
    return {
      APP_VERSION,
    };
  },
});
</script>

<style scoped lang="scss"></style>
