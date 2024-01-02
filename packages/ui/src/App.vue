<template>
  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <Transition mode="out-in">
        <Suspense>
          <component :is="Component"></component>

          <template #fallback> Loading... </template>
        </Suspense>
      </Transition>
    </template>
  </RouterView>
  <Registration v-if="!isUserExist" />
  <ConnectStatus class="connect-status" />
  <ErrorSnackbar />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Registration from '@/components/Registration.vue';
import ConnectStatus from '@/components/feedback/ConnectStatus.vue';
import ErrorSnackbar from '@/components/feedback/ErrorSnackbar.vue';

export default defineComponent({
  components: {
    Registration,
    ConnectStatus,
    ErrorSnackbar,
  },
  computed: {
    isUserExist() {
      return this.$store.state.user;
    },
  },
});
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.connect-status {
  position: absolute;
  top: 0px;
  left: 2px;
}

body {
  background-color: #edebee;
}
</style>
