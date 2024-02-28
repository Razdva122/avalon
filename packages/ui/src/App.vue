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
  <div class="header-right-container d-flex align-center">
    <ConnectStatus class="connect-status mr-4" />
    <Socials />
  </div>
  <InfoSnackbar />
  <Version class="version" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Settings from '@/components/user/Settings.vue';
import Profile from '@/components/user/Profile.vue';
import ConnectStatus from '@/components/feedback/ConnectStatus.vue';
import InfoSnackbar from '@/components/feedback/InfoSnackbar.vue';
import Version from '@/components/feedback/Version.vue';
import Socials from '@/components/feedback/Socials.vue';

export default defineComponent({
  components: {
    Settings,
    ConnectStatus,
    InfoSnackbar,
    Profile,
    Version,
    Socials,
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
  height: 100vh;
  overflow: hidden;
}

.connect-status {
  font-size: large;
}

.header-right-container {
  height: 36px;
  position: fixed;
  top: 5px;
  left: 10px;
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
