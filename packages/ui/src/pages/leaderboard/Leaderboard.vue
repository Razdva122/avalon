<template>
  <div class="info-page-content leaderboard-page">
    <h1>{{ $t('leaderboard.title') }}</h1>

    <div class="custom-tabs-container">
      <div class="custom-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.value"
          class="custom-tab"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          <span class="material-icons"> {{ tab.icon }} </span>
          <span>{{ tab.title }}</span>
        </div>
      </div>
    </div>

    <v-window v-model="activeTab" class="mt-4" :touch="false">
      <v-window-item value="trueskill">
        <TrueSkillLeaderboard />
      </v-window-item>
      <v-window-item value="roles">
        <RoleRatings />
      </v-window-item>
    </v-window>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import RoleRatings from '@/components/stats/RoleRatings.vue';
import TrueSkillLeaderboard from '@/components/stats/TrueSkillLeaderboard.vue';

export default defineComponent({
  name: 'Leaderboard',
  components: {
    RoleRatings,
    TrueSkillLeaderboard,
  },
  setup() {
    const { t } = useI18n();
    const activeTab = ref('trueskill');

    const tabs = computed(() => [
      {
        value: 'trueskill',
        title: t('leaderboard.trueskill'),
        icon: 'format_list_numbered',
      },
      {
        value: 'roles',
        title: t('leaderboard.roles'),
        icon: 'group',
      },
    ]);

    return {
      activeTab,
      tabs,
    };
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.leaderboard-page {
  margin-bottom: 40px;
}

.custom-tabs-container {
  margin: 20px 0;
  display: flex;
  justify-content: center;
}

.custom-tabs {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: rgba(var(--v-theme-surface), 1);
}

.custom-tab {
  padding: 12px 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  min-width: 160px;
  margin-bottom: 0px !important;

  &:hover:not(.active) {
    background-color: rgba(var(--v-theme-primary), 0.05);
  }

  &.active {
    color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.1);

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background-color: rgb(var(--v-theme-primary));
    }
  }
}

.tab-icon {
  font-size: 20px;
}
</style>
