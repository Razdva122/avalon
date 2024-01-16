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
  <Settings ref="settings" />
  <Profile v-if="user" @usernameClick="usernameClick" class="profile" />
  <ConnectStatus class="connect-status" />
  <ErrorSnackbar />
  <Version class="version" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Settings from '@/components/user/Settings.vue';
import Profile from '@/components/user/Profile.vue';
import ConnectStatus from '@/components/feedback/ConnectStatus.vue';
import ErrorSnackbar from '@/components/feedback/ErrorSnackbar.vue';
import Version from '@/components/feedback/Version.vue';

export default defineComponent({
  components: {
    Settings,
    ConnectStatus,
    ErrorSnackbar,
    Profile,
    Version,
  },
  data() {
    const { user } = this.$store.state;

    return {
      user,
    };
  },
  methods: {
    usernameClick() {
      (<InstanceType<typeof Settings>>this.$refs.settings).displaySettings();
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
  font-size: large;
  position: fixed;
  top: 0px;
  left: 2px;
}

.profile {
  font-size: large;
  position: fixed;
  top: 5px;
  right: 10px;
}

.version {
  opacity: 30%;
  font-size: large;
  position: fixed;
  bottom: 5px;
  right: 10px;
}

body {
  background-color: #635f57;
}
</style>
