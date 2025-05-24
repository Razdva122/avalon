<template>
  <div class="info-page-content achievements-page">
    <div class="d-flex justify-space-between align-center mb-4">
      <h1>{{ $t('achievements.userAchievementsTitle') }}</h1>
      <v-btn color="primary" to="/achievements/global/" variant="outlined">
        {{ $t('achievements.viewGlobalAchievements') }}
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
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { socket } from '@/api/socket';
import { store } from '@/store';
import AchievementCard from '@/components/achievements/AchievementCard.vue';
import { Achievement, AchievementType } from '@avalon/types';
import { OPEN_ACHIEVEMENT_IDS } from '@avalon/types';

interface UserAchievementData {
  id: string;
  type: AchievementType;
  completed: boolean;
  progress: {
    currentValue: number;
    maxValue: number;
  };
}

export default defineComponent({
  name: 'UserAchievements',
  components: {
    AchievementCard,
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
