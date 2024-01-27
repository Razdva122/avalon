<template>
  <span class="material-icons spoiler-eye" @click="toggleSpoilerStatus"> {{ iconName }} </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  computed: {
    iconName() {
      return this.$store.state.hideSpoilers ? 'visibility' : 'visibility_off';
    },
  },
  methods: {
    toggleSpoilerStatus() {
      this.$store.commit('updateHideSpoilers', !this.$store.state.hideSpoilers);
    },
  },
});
</script>

<style scoped lang="scss">
.spoiler-eye {
  cursor: pointer;
}
</style>
