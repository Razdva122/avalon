<template>
  <div class="info-page-content achievements-page">
    <div class="d-flex justify-space-between align-center mb-4">
      <h1>{{ $t('achievements.globalAchievementsTitle') }}</h1>
      <v-btn v-if="isUserLoggedIn" color="primary" :to="`/achievements/user/${userID}/`" variant="outlined">
        {{ $t('achievements.viewPersonalAchievements') }}
      </v-btn>
    </div>

    <div v-if="loading" class="text-center my-5">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <div class="achievements-summary">
        <v-card class="mb-4">
          <v-card-text>
            <div class="d-flex justify-space-between align-center flex-wrap">
              <div class="achievements-summary__stats">
                <div class="text-h6">{{ $t('achievements.globalSummary') }}</div>
                <div class="text-subtitle-1">{{ $t('achievements.totalUsers') }}: {{ totalUsers }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <h2>{{ $t('achievements.openAchievements') }}</h2>
      <div class="achievements-grid">
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

      <h2>{{ $t('achievements.hiddenAchievements') }}</h2>
      <div class="achievements-grid">
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
import { useI18n } from 'vue-i18n';
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
    const { t } = useI18n();
    const loading = ref(true);
    const achievements = ref<GlobalAchievementData[]>([]);
    const totalUsers = ref(0);

    const fetchGlobalAchievements = async () => {
      try {
        loading.value = true;

        // Получаем данные о достижениях и глобальную статистику
        const achievementsResponse = await socket.emitWithAck('getAllAchievements');
        const statsResponse = await socket.emitWithAck('getAchievementStats');

        if (!achievementsResponse.success || !statsResponse.success) {
          console.error('Error fetching achievements data');
          return;
        }

        // Получаем общее количество пользователей
        // Это может быть получено из другого эндпоинта или вычислено
        totalUsers.value = statsResponse.stats?.[0]?.totalUsers || 0;

        // Преобразуем данные в формат для отображения
        if (achievementsResponse.achievements && statsResponse.stats) {
          achievements.value = achievementsResponse.achievements.map((achievement: Achievement) => {
            const stats = statsResponse.stats?.find((stat: AchievementStats) => stat.achievementID === achievement.id);

            return {
              id: achievement.id,
              type: achievement.type,
              stats: stats || {
                achievementID: achievement.id,
                totalUsers: totalUsers.value,
                completedUsers: 0,
                completionPercentage: 0,
              },
            };
          });
        }
      } catch (error) {
        console.error('Error fetching global achievements:', error);
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchGlobalAchievements);

    const openAchievements = computed(() => {
      return achievements.value.filter((achievement) => achievement.type === AchievementType.OPEN);
    });

    const hiddenAchievements = computed(() => {
      return achievements.value.filter((achievement) => achievement.type === AchievementType.HIDDEN);
    });

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
      achievements,
      openAchievements,
      hiddenAchievements,
      totalUsers,
      isUserLoggedIn,
      userID,
    };
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.achievements-page {
  padding-bottom: 40px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
  margin-bottom: 32px;

  @media (min-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 960px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.achievements-summary {
  margin-bottom: 32px;

  &__stats {
    margin-right: 16px;
  }
}
</style>
