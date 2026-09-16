<template>
  <div class="achievements-page">
    <div class="page-header mb-4">
      <div>
        <h1>{{ $t('achievements.userAchievementsTitle') }}</h1>
        <p class="page-description">{{ $t('achievements.personalIntro') }}</p>
      </div>
      <v-btn color="primary" to="/achievements/global/" variant="tonal" class="navigation-btn">
        {{ $t('achievements.viewGlobalAchievements') }}
      </v-btn>
    </div>

    <div v-if="loading" class="loading-state" role="status" :aria-label="$t('achievements.loading')">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal" class="state-message">
      {{ $t('achievements.loadError') }}
      <v-btn variant="outlined" @click="fetchUserAchievements">{{ $t('achievements.retry') }}</v-btn>
    </v-alert>
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

      <p v-if="!achievements.length" class="empty-state">{{ $t('achievements.emptyCollection') }}</p>
      <h2 v-if="openAchievements.length" class="section-heading">
        {{ $t('achievements.openAchievements') }} <span>{{ openAchievements.length }}</span>
      </h2>
      <div v-if="openAchievements.length" class="achievements-grid">
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

      <h2 v-if="hiddenAchievements.length" class="section-heading">
        {{ $t('achievements.hiddenAchievements') }} <span>{{ hiddenAchievements.length }}</span>
      </h2>
      <div v-if="hiddenAchievements.length" class="achievements-grid">
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
import type { AchievementResponse } from '@avalon/types';
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
    const loading = ref(true);
    const error = ref(false);
    let requestId = 0;
    const achievements = ref<UserAchievementData[]>([]);

    const fetchUserAchievements = async () => {
      const currentRequest = ++requestId;
      error.value = false;
      try {
        loading.value = true;

        const [achievementsResponse, userAchievementsResponse] = await Promise.all([
          socket.timeout(10000).emitWithAck('getAllAchievements') as Promise<AchievementResponse>,
          socket.timeout(10000).emitWithAck('getUserAchievements', props.uuid) as Promise<AchievementResponse>,
        ]);
        if (currentRequest !== requestId) return;
        if (
          !achievementsResponse.success ||
          !userAchievementsResponse.success ||
          !achievementsResponse.achievements ||
          !userAchievementsResponse.userAchievements
        ) {
          error.value = true;
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
      } catch (cause) {
        if (currentRequest === requestId) error.value = true;
        console.error('Error fetching user achievements:', cause);
      } finally {
        if (currentRequest === requestId) loading.value = false;
      }
    };

    onMounted(fetchUserAchievements);

    // Обновляем данные при изменении параметров маршрута
    watch(
      () => props.uuid,
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
      error,
      fetchUserAchievements,

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
@import '@/styles/achievements-page.scss';
</style>
