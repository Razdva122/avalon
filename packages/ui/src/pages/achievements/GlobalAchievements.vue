<template>
  <div class="achievements-page">
    <div class="page-header mb-4">
      <div>
        <h1>{{ $t('achievements.globalAchievementsTitle') }}</h1>
        <p class="page-description">{{ $t('achievements.globalIntro') }}</p>
      </div>
      <v-btn
        v-if="isUserLoggedIn"
        color="primary"
        :to="`/achievements/user/${userID}/`"
        variant="tonal"
        class="navigation-btn"
      >
        {{ $t('achievements.viewPersonalAchievements') }}
      </v-btn>
    </div>

    <div v-if="loading" class="loading-state" role="status" :aria-label="$t('achievements.loading')">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal" class="state-message">
      {{ $t('achievements.loadError') }}
      <v-btn variant="outlined" @click="fetchGlobalAchievements">{{ $t('achievements.retry') }}</v-btn>
    </v-alert>
    <template v-else>
      <div class="global-summary">
        <span>{{ $t('achievements.globalSummary') }}</span
        ><strong>{{ totalCount }} · {{ $t('menu.achievements') }}</strong
        ><span>{{ $t('achievements.totalUsers') }}: {{ totalUsers }}</span>
      </div>
      <p v-if="!achievements.length" class="empty-state">{{ $t('achievements.emptyCollection') }}</p>
      <h2 v-if="openAchievements.length" class="section-heading">
        {{ $t('achievements.openAchievements') }} <span>{{ openAchievements.length }}</span>
      </h2>
      <div v-if="openAchievements.length" class="achievements-grid">
        <achievement-card
          v-for="achievement in openAchievements"
          :key="achievement.id"
          :achievementID="achievement.id"
          :isUnlocked="true"
          :isOpen="true"
          :showProgress="false"
          :globalStats="achievement.stats"
          :showGlobalStats="true"
        />
      </div>

      <h2 v-if="hiddenAchievements.length" class="section-heading">
        {{ $t('achievements.hiddenAchievements') }} <span>{{ hiddenAchievements.length }}</span>
      </h2>
      <div v-if="hiddenAchievements.length" class="achievements-grid">
        <achievement-card
          v-for="achievement in hiddenAchievements"
          :key="achievement.id"
          :achievementID="achievement.id"
          :isUnlocked="true"
          :isOpen="false"
          :showProgress="false"
          :globalStats="achievement.stats"
          :showGlobalStats="true"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import type { AchievementResponse } from '@avalon/types';
import { socket } from '@/api/socket';
import { store } from '@/store';
import AchievementCard from '@/components/achievements/AchievementCard.vue';
import { Achievement, AchievementStats, AchievementType } from '@avalon/types';

interface GlobalAchievementData {
  id: string;
  type: AchievementType;
  stats: AchievementStats;
}

export default defineComponent({
  name: 'GlobalAchievements',
  components: {
    AchievementCard,
  },
  setup() {
    const loading = ref(true);
    const error = ref(false);
    let requestId = 0;
    const achievements = ref<GlobalAchievementData[]>([]);

    const fetchGlobalAchievements = async () => {
      const currentRequest = ++requestId;
      error.value = false;
      try {
        loading.value = true;

        const [achievementsResponse, statsResponse] = await Promise.all([
          socket.timeout(10000).emitWithAck('getAllAchievements') as Promise<AchievementResponse>,
          socket.timeout(10000).emitWithAck('getAchievementStats') as Promise<AchievementResponse>,
        ]);
        if (currentRequest !== requestId) return;
        if (
          !achievementsResponse.success ||
          !statsResponse.success ||
          !achievementsResponse.achievements ||
          !statsResponse.stats
        ) {
          error.value = true;
          return;
        }

        // Преобразуем данные в формат для отображения
        if (achievementsResponse.achievements && statsResponse.stats) {
          achievements.value = achievementsResponse.achievements.map((achievement: Achievement) => {
            const stats = statsResponse.stats?.find((stat: AchievementStats) => stat.achievementID === achievement.id);

            return {
              id: achievement.id,
              type: achievement.type,
              stats: stats || {
                achievementID: achievement.id,
                totalUsers: statsResponse.stats?.[0]?.totalUsers || 0,
                completedUsers: 0,
                completionPercentage: 0,
              },
            };
          });
        }
      } catch (cause) {
        if (currentRequest === requestId) error.value = true;
        console.error('Error fetching global achievements:', cause);
      } finally {
        if (currentRequest === requestId) loading.value = false;
      }
    };

    onMounted(fetchGlobalAchievements);

    const openAchievements = computed(() => {
      return achievements.value.filter((achievement) => achievement.type === AchievementType.OPEN);
    });

    const hiddenAchievements = computed(() => {
      return achievements.value.filter((achievement) => achievement.type === AchievementType.HIDDEN);
    });

    const totalCount = computed(() => achievements.value.length);
    const totalUsers = computed(() => achievements.value[0]?.stats.totalUsers || 0);

    // Проверяем, авторизован ли пользователь
    const isUserLoggedIn = computed(() => {
      return !!store.state.profile?.id;
    });

    // Получаем ID пользователя
    const userID = computed(() => {
      return store.state.profile?.id || '';
    });

    return {
      loading,
      error,
      fetchGlobalAchievements,
      totalCount,
      totalUsers,

      achievements,
      openAchievements,
      hiddenAchievements,
      isUserLoggedIn,
      userID,
    };
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/achievements-page.scss';
</style>
