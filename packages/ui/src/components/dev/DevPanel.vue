<template>
  <div v-if="isDev" class="dev-panel">
    <v-btn icon="settings" @click="togglePanel" variant="plain" color="text-primary"> </v-btn>

    <v-overlay v-model="isPanelOpen" class="dev-overlay">
      <v-card class="dev-card">
        <v-btn @click="togglePanel" class="close" icon="close" color="text-primary" variant="text" density="compact" />
        <v-card-title>Developer Tools</v-card-title>
        <v-card-actions>
          <v-btn color="error" @click="resetStore"> Reset Store </v-btn>
          <v-btn color="success" @click="createFakeAccount"> Create Test Account </v-btn>
          <v-btn color="on-surface" @click="togglePanel"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-overlay>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useStore } from '@/store';

export default defineComponent({
  name: 'DevPanel',
  setup() {
    const store = useStore();
    const isPanelOpen = ref(false);
    const isDev = computed(() => process.env.NODE_ENV === 'development');

    const togglePanel = () => {
      isPanelOpen.value = !isPanelOpen.value;
    };

    const resetStore = () => {
      store.commit('clearUserProfile');
    };

    const createFakeAccount = async () => {
      const randomString = () => Math.random().toString(36).substring(2, 10);
      const fakeUser = {
        login: `testuser_${randomString()}`,
        email: `test_${randomString()}@example.com`,
        password: randomString(),
        name: randomString(),
      };

      store.dispatch('registerUser', fakeUser);
      isPanelOpen.value = false;
    };

    return {
      isDev,
      isPanelOpen,
      togglePanel,
      resetStore,
      createFakeAccount,
    };
  },
});
</script>

<style scoped>
.close {
  position: absolute;
  width: auto !important;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.dev-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dev-card {
  padding: 24px;
  min-width: 350px;
  border-radius: 12px;
}

.dev-card .v-card-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.dev-card .v-card-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
}

.dev-card .v-btn {
  width: 100%;
  height: 48px;
}
</style>
