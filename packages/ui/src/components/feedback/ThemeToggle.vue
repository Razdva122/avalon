<template>
  <button type="button" class="theme-switch" role="switch" :aria-checked="isDark" @click="toggleTheme">
    <span class="theme-symbol" aria-hidden="true">☾</span>
    <span>{{ $t('menu.darkTheme') }}</span>
    <span class="switch-track" :class="{ checked: isDark }" aria-hidden="true"><span /></span>
  </button>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from '@/store';
import { useTheme } from 'vuetify';

export default defineComponent({
  setup() {
    const store = useStore();
    const theme = useTheme();

    const isDark = computed(() => store.state.settings?.colorTheme === 'dark');

    const toggleTheme = () => {
      const newTheme = store.state.settings?.colorTheme === 'dark' ? 'light' : 'dark';
      theme.global.name.value = newTheme === 'dark' ? 'darkTheme' : 'lightTheme';
      store.commit('updateUserSettings', { key: 'colorTheme', value: newTheme });
    };

    return {
      isDark,
      toggleTheme,
    };
  },
});
</script>

<style scoped lang="scss">
.theme-switch {
  display: flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  text-align: left;
  font-size: 14px;
  &:hover {
    background: rgb(var(--v-theme-inset-hover));
  }
}
.theme-symbol {
  width: 22px;
  font-size: 22px;
  flex-shrink: 0;
}
.switch-track {
  display: flex;
  align-items: center;
  width: 38px;
  height: 22px;
  padding: 3px;
  flex-shrink: 0;
  margin-left: auto;
  background: rgb(var(--v-theme-text-secondary));
  border-radius: 12px;
  span {
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
  }
  &.checked {
    background: rgb(var(--v-theme-primary));
    span {
      transform: translateX(16px);
    }
  }
}
</style>
