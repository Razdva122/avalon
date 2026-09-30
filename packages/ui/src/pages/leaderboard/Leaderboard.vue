<template>
  <div class="leaderboard-page">
    <h1>{{ $t('leaderboard.title') }}</h1>

    <div class="custom-tabs-container">
      <div class="custom-tabs" role="group" :aria-label="$t('leaderboard.title')">
        <button
          type="button"
          :aria-pressed="activeTab === tab.value"
          v-for="tab in tabs"
          :key="tab.value"
          class="custom-tab"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          <span class="material-icons"> {{ tab.icon }} </span>
          <span>{{ tab.title }}</span>
        </button>
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
// Keep article-wide margins and word breaking out of tables and profile previews.
.leaderboard-page {
  width: 100%;
  max-width: 1180px;
  min-width: 0;
  margin-inline: auto;
  padding: 82px 28px 64px;
  color: rgb(var(--v-theme-text-primary));
  line-height: 1.5;

  h1 {
    margin-bottom: 28px;
    font-size: clamp(28px, 3.2vw, 40px);
    line-height: 1.2;
    letter-spacing: -0.025em;
  }

  :deep(h2) {
    font-size: clamp(20px, 2.3vw, 27px);
    line-height: 1.35;
  }
}

.leaderboard-page {
  margin-bottom: 40px;
}

.custom-tabs-container {
  margin: 20px 0;
  display: flex;
  justify-content: flex-start;
}

.custom-tabs {
  display: flex;
  width: 100%;
  max-width: 440px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: rgba(var(--v-theme-surface), 1);
}

.custom-tab {
  padding: 12px clamp(12px, 3vw, 24px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  transition: background-color 0.15s ease;
  position: relative;
  min-width: 0;
  min-height: 48px;
  flex: 1;
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

.custom-tab .material-icons {
  font-size: 20px;
  flex-shrink: 0;
}
@media (max-width: 700px) {
  .leaderboard-page {
    padding: 72px 16px 40px;
  }
}

@media (max-width: 959px) {
  .leaderboard-page {
    // These selectors must outrank App.vue's table surface and border rules.
    :deep(.leaderboard-table) {
      background: transparent !important;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      overflow: visible;
    }

    :deep(.table-container),
    :deep(.v-table__wrapper) {
      overflow: visible;
    }

    :deep(.leaderboard-table table) {
      display: block;
    }

    :deep(.leaderboard-table tbody) {
      display: grid;
      gap: 12px;
    }

    :deep(.leaderboard-row) {
      display: grid;
      grid-template-columns: 32px minmax(0, 1fr) minmax(0, 1fr);
      gap: 12px 10px;
      padding: 12px;
      border: 1px solid rgba(var(--v-theme-text-primary), 0.12);
      border-radius: 12px;
      background: rgb(var(--v-theme-surface));
    }

    :deep(.leaderboard-row > td) {
      height: auto;
      min-width: 0;
      padding: 0;
      border: 0 !important;
    }

    :deep(.leaderboard-rank) {
      grid-column: 1;
      grid-row: 1;
      align-self: center;
      font-size: 16px;
      font-variant-numeric: tabular-nums;
    }

    :deep(.leaderboard-player) {
      grid-column: 2 / -1;
    }

    :deep(.leaderboard-player a) {
      display: block;
      min-height: 44px;
      color: inherit;
      text-decoration: none;
    }

    :deep(.teammate-profile),
    :deep(.teammate-name) {
      min-width: 0;
      max-width: 100%;
    }

    :deep(.teammate-name) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :deep(.teammate-profile .loader) {
      width: 100%;
    }

    :deep(.leaderboard-rating) {
      grid-column: 2;
    }

    :deep(.leaderboard-winrate) {
      grid-column: 3;
    }

    :deep(.mobile-metric-label) {
      display: block;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 400;
    }

    :deep(.rating-cell),
    :deep(.winrate-cell) {
      display: flex;
      align-items: center;
      min-height: 32px;
      text-align: left;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    :deep(.v-data-table-footer) {
      justify-content: center;
      gap: 8px;
      padding: 16px 0 0;
    }

    :deep(.v-data-table-footer__items-per-page) {
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      padding: 0;
    }

    :deep(.v-data-table-footer__info) {
      padding: 0;
    }
  }
}
</style>
