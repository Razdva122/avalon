<template>
  <v-btn density="comfortable" @click="toggleTheme" :icon="themeIcon" variant="plain" color="text-primary"></v-btn>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from '@/store';
import { useTheme } from 'vuetify';

export default defineComponent({
  setup() {
    const store = useStore();
    const theme = useTheme();

    const themeIcon = computed(() => (store.state.settings?.colorTheme === 'dark' ? 'light_mode' : 'dark_mode'));

    const toggleTheme = () => {
      const newTheme = store.state.settings?.colorTheme === 'dark' ? 'light' : 'dark';
      theme.global.name.value = newTheme === 'dark' ? 'darkTheme' : 'lightTheme';
      store.commit('updateUserSettings', { key: 'colorTheme', value: newTheme });
    };

    return {
      themeIcon,
      toggleTheme,
    };
  },
});
</script>

<style scoped lang="scss"></style>
