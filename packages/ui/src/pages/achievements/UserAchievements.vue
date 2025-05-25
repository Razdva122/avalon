<template>
  <div class="info-page-content achievements-page">
    <div class="page-header mb-4">
      <h1>{{ $t('achievements.userAchievementsTitle') }}</h1>
      <v-btn color="primary" to="/achievements/global/" variant="outlined" class="navigation-btn">
        {{ $t('achievements.viewGlobalAchievements') }}
      </v-btn>
    </div>

    <div v-if="loading" class="text-center my-5">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <UserProfileHeader :uuid="uuid" class="mb-4" />

      <div class="achievements-summary">
        <v-card class="mb-4 summary-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center flex-wrap">
              <div class="achievements-summary__stats">
                <div class="text-h6">{{ $t('achievements.summary') }}</div>
                <div class="text-subtitle-1">
                  {{ $t('achievements.completed') }}: {{ completedCount }} / {{ totalCount }} ({{
                    completionPercentage
                  }}%)
                </div>
              </div>
              <v-progress-circular :model-value="completionPercentage" :size="80" :width="8" color="primary">
                {{ completionPercentage }}%
              </v-progress-circular>
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
          :isUnlocked="achievement.completed"
          :isOpen="true"
          :progress="achievement.progress"
          :showProgress="true"
          :metadata="achievement.metadata"
          :state="achievement.state"
          :showDetailedProgress="shouldShowDetailedProgress(achievement.id)"
        />
      </div>

      <h2>{{ $t('achievements.hiddenAchievements') }}</h2>
      <div class="achievements-grid">
        <achievement-card
          v-for="achievement in hiddenAchievements"
          :key="achievement.id"
          :achievementID="achievement.id"
          :isUnlocked="achievement.completed"
          :isOpen="false"
          :progress="achievement.progress"
          :showProgress="true"
          :metadata="achievement.metadata"
          :state="achievement.state"
          :showDetailedProgress="shouldShowDetailedProgress(achievement.id)"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { socket } from '@/api/socket';
import AchievementCard from '@/components/achievements/AchievementCard.vue';
import UserProfileHeader from '@/components/stats/UserProfileHeader.vue';
import { Achievement, AchievementType } from '@avalon/types';
import { ACHIEVEMENT_ALL_STANDARD_ROLES, ACHIEVEMENT_DIFFERENT_PLAYER_COUNT } from '@avalon/types';

interface UserAchievementData {
  id: string;
  type: AchievementType;
  completed: boolean;
  progress: {
    currentValue: number;
    maxValue: number;
  };
  metadata?: {
    roles?: string[];
    playerCounts?: number[];
  };
  state?: Record<string, boolean>;
}

export default defineComponent({
  name: 'UserAchievements',
  components: {
    AchievementCard,
    UserProfileHeader,
  },
  props: {
    uuid: {
      type: String,
      default: null,
    },
  },
  setup(props) {
    const route = useRoute();
    const loading = ref(true);
    const achievements = ref<UserAchievementData[]>([]);

    const fetchUserAchievements = async () => {
      try {
        loading.value = true;

        const achievementsResponse = await socket.emitWithAck('getAllAchievements');
        const userAchievementsResponse = await socket.emitWithAck('getUserAchievements', props.uuid);

        if (!achievementsResponse.success || !userAchievementsResponse.success) {
          console.error('Error fetching achievements data');
          return;
        }

        // Преобразуем данные в формат для отображения
        if (achievementsResponse.achievements && userAchievementsResponse.userAchievements) {
          achievements.value = achievementsResponse.achievements.map((achievement: Achievement) => {
            const userAchievement = userAchievementsResponse.userAchievements?.find(
              (ua) => ua.achievementID === achievement.id,
            );

            return {
              id: achievement.id,
              type: achievement.type,
              completed: userAchievement?.completed || false,
              progress: {
                currentValue: userAchievement?.currentProgress || 0,
                maxValue: achievement.requirement,
              },
              metadata: achievement.metadata as { roles?: string[]; playerCounts?: number[] },
              state: (userAchievement?.state as Record<string, boolean>) || {},
            };
          });
        }
      } catch (error) {
        console.error('Error fetching user achievements:', error);
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchUserAchievements);

    // Обновляем данные при изменении параметров маршрута
    watch(
      () => [props.uuid, route.params.uuid],
      () => {
        fetchUserAchievements();
      },
    );

    const openAchievements = computed(() => {
      return achievements.value.filter((achievement) => achievement.type === AchievementType.OPEN);
    });

    const hiddenAchievements = computed(() => {
      return achievements.value.filter((achievement) => achievement.type === AchievementType.HIDDEN);
    });

    const completedCount = computed(() => {
      return achievements.value.filter((achievement) => achievement.completed).length;
    });

    const totalCount = computed(() => {
      return achievements.value.length;
    });

    const completionPercentage = computed(() => {
      if (totalCount.value === 0) return 0;
      return Math.round((completedCount.value / totalCount.value) * 100);
    });

    return {
      loading,
      achievements,
      openAchievements,
      hiddenAchievements,
      completedCount,
      totalCount,
      completionPercentage,
    };
  },
  methods: {
    /**
     * Определяет, нужно ли показывать детальный прогресс для достижения
     */
    shouldShowDetailedProgress(achievementID: string): boolean {
      // Показываем детальный прогресс только для достижений с ролями и количеством игроков
      return [ACHIEVEMENT_ALL_STANDARD_ROLES, ACHIEVEMENT_DIFFERENT_PLAYER_COUNT].includes(achievementID);
    },
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.achievements-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
  }
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

.summary-card {
  background-color: rgb(var(--v-theme-surface-light));
}
</style>
