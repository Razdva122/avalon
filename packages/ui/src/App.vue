<template>
  <header class="header">
    <div class="header-right-container d-flex align-center mr-4 ml-4">
      <ConnectStatus class="connect-status mr-4" />
      <Socials />
    </div>
    <div class="header-left-container d-flex align-center mr-2">
      <SpoilerEye />
      <Menu @profileClick="profileClick" />
    </div>
  </header>
  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <Transition mode="out-in">
        <Suspense>
          <component :is="Component" class="page"></component>

          <template #fallback> Loading... </template>
        </Suspense>
      </Transition>
    </template>
  </RouterView>
  <Settings ref="settings" />
  <InfoSnackbar />
  <Version class="version" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Settings from '@/components/user/Settings.vue';
import Menu from '@/components/header/Menu.vue';
import ConnectStatus from '@/components/feedback/ConnectStatus.vue';
import InfoSnackbar from '@/components/feedback/InfoSnackbar.vue';
import Version from '@/components/feedback/Version.vue';
import Socials from '@/components/feedback/Socials.vue';
import SpoilerEye from '@/components/feedback/SpoilerEye.vue';

export default defineComponent({
  components: {
    Settings,
    ConnectStatus,
    InfoSnackbar,
    Version,
    Socials,
    Menu,
    SpoilerEye,
  },
  data() {
    const { user } = this.$store.state;

    return {
      user,
    };
  },
  methods: {
    profileClick() {
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
}

.header {
  height: 50px;
  width: 100%;
  background-color: #2c3e50;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  display: flex;
  justify-content: space-between;
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: 100;
}

.page {
  padding-top: 50px;
}

.connect-status {
  font-size: large;
}

.header-left-container {
  font-size: large;
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
