<template>
  <v-card
    class="achievement-card"
    :class="{
      'achievement-card--locked': !isUnlocked && !isOpen,
      'achievement-card--in-progress': !isUnlocked && isInProgress,
    }"
  >
    <div class="achievement-card__wrapper">
      <div class="achievement-card__main">
        <div class="achievement-card__content">
          <div class="achievement-card__icon">
            <v-icon v-if="!achievement.icon" size="large" icon="fa:fa-solid fa-trophy" />
            <img v-else :src="achievement.icon" alt="Achievement icon" />
          </div>
          <div class="achievement-card__info">
            <div class="achievement-card__name">{{ achievement.name }}</div>
            <div class="achievement-card__description">{{ achievement.description }}</div>
            <div v-if="showProgress && progress && shouldShowProgressBar" class="achievement-card__progress">
              <v-progress-linear
                :model-value="(progress.currentValue / progress.maxValue) * 100"
                color="primary"
                height="10"
              />
              <div class="achievement-card__progress-text">{{ progress.currentValue }} / {{ progress.maxValue }}</div>
            </div>

            <!-- Отображение прогресса по ролям -->
            <div v-if="showDetailedProgress && metadata?.roles && state" class="achievement-card__detailed-progress">
              <div class="achievement-card__detailed-title">{{ $t('achievements.rolesProgress') }}</div>
              <div class="achievement-card__detailed-grid">
                <div
                  v-for="role in metadata.roles"
                  :key="role"
                  class="achievement-card__detailed-item"
                  :class="{ completed: state[role] }"
                >
                  <v-icon
                    :icon="state[role] ? 'fa:fa-solid fa-check' : 'fa:fa-solid fa-times'"
                    :color="state[role] ? 'success' : 'error'"
                    size="small"
                  />
                  <span>{{ $t(`roles.${role}`) }}</span>
                </div>
              </div>
            </div>

            <!-- Отображение прогресса по количеству игроков -->
            <div
              v-if="showDetailedProgress && metadata?.playerCounts && state"
              class="achievement-card__detailed-progress"
            >
              <div class="achievement-card__detailed-title">{{ $t('achievements.playerCountsProgress') }}</div>
              <div class="achievement-card__detailed-grid">
                <div
                  v-for="count in metadata.playerCounts"
                  :key="count"
                  class="achievement-card__detailed-item"
                  :class="{ completed: state[count] }"
                >
                  <v-icon
                    :icon="state[count] ? 'fa:fa-solid fa-check' : 'fa:fa-solid fa-times'"
                    :color="state[count] ? 'success' : 'error'"
                    size="small"
                  />
                  <span>{{ count }} {{ $t('achievements.players') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="showGlobalStats && globalStats" class="achievement-card__global-stats">
          <div class="achievement-card__global-progress">
            <v-progress-linear :model-value="globalStats.completionPercentage" color="primary" height="10" />
          </div>
          <div class="achievement-card__global-text">
            {{ $t('achievements.globalCompletion', { percentage: globalStats.completionPercentage.toFixed(1) }) }}
          </div>
        </div>
      </div>
      <div
        v-if="avatarReward"
        class="achievement-card__reward"
        :class="{ 'achievement-card__reward--unlocked': isUnlocked }"
      >
        <div class="achievement-card__reward-text">{{ $t('achievements.avatarReward') }}</div>
        <Avatar :avatarID="avatarReward" class="achievement-card__reward-icon" />
      </div>
    </div>
  </v-card>
</template>

<script lang="ts">
import { getAchievementsText } from '@/helpers/achievements';
import { defineComponent, computed, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { AchievementStats } from '@avalon/types';
import Avatar from '@/components/user/Avatar.vue';

export interface AchievementProgress {
  currentValue: number;
  maxValue: number;
}

export default defineComponent({
  name: 'AchievementCard',
  components: {
    Avatar,
  },
  props: {
    achievementID: {
      type: String,
      required: true,
    },
    isUnlocked: {
      type: Boolean,
      default: false,
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    progress: {
      type: Object as PropType<AchievementProgress>,
      required: false,
      default: null,
    },
    showProgress: {
      type: Boolean,
      default: true,
    },
    globalStats: {
      type: Object as PropType<AchievementStats>,
      required: false,
      default: null,
    },
    showGlobalStats: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Object as PropType<{ roles?: string[]; playerCounts?: number[] }>,
      required: false,
      default: null,
    },
    state: {
      type: Object as PropType<Record<string, boolean>>,
      required: false,
      default: () => ({}),
    },
    showDetailedProgress: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const achievement = computed(() => {
      return {
        name: t(`achievements.${props.achievementID}`),
        description: getAchievementsText(props.achievementID, t(`achievements.${props.achievementID}_description`)),
        icon: undefined,
      };
    });

    // Определяем ID аватарки, которая выдается за достижение
    const avatarReward = computed(() => {
      const achievementToAvatarMap: Record<string, string> = {
        top_player: 'anime/witch',
        secret_hunter: 'mystery',
        still_worthy: 'excalibur',
        mistakes_happen: 'evil',
        seer: 'good',
        dark_wins: 'oberon',
        light_wins: 'anime/servant',
        bodyguard: 'percival',
        wrong_choice: 'morgana',
        useless_role: 'cleric',
        serial_killer: 'lunatic',
        detective: 'merlin',
        undercover_agent: 'anime/merlin',
        assassin_kills: 'minion',
        different_player_count: 'anime/minion',
        all_standard_roles: 'anime/troublemaker',
      };

      return achievementToAvatarMap[props.achievementID];
    });

    // Определяем, находится ли достижение в процессе выполнения
    const isInProgress = computed(() => {
      return props.progress && props.progress.currentValue < props.progress.maxValue;
    });

    // Определяем, нужно ли показывать полоску прогресса
    const shouldShowProgressBar = computed(() => {
      return props.progress && props.progress.maxValue > 1;
    });

    return {
      achievement,
      isInProgress,
      shouldShowProgressBar,
      avatarReward,
    };
  },
});
</script>

<style scoped lang="scss">
.achievement-card {
  width: 100%;
  margin-bottom: 16px;
  background-color: rgb(var(--v-theme-surface-light));
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &__wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  &__main {
    flex: 1;
  }

  &__content {
    display: flex;
    padding: 16px;
  }

  &__icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    color: rgb(var(--v-theme-primary));

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__info {
    flex: 1;
    min-width: 0; /* Важно для работы text-overflow в flex-контейнере */
    overflow: hidden;
  }

  &__name {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 4px;
    color: rgb(var(--v-theme-text-primary));
  }

  &__description {
    font-size: 14px;
    color: rgb(var(--v-theme-text-secondary));
    margin-bottom: 8px;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
  }

  &__reward {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background-color: rgba(var(--v-theme-primary), 0.1);
    border-top: 1px solid rgba(var(--v-theme-border), 0.12);
    font-size: 14px;
    transition: all 0.3s ease;
    margin-top: auto;

    &--unlocked {
      background-color: rgba(var(--v-theme-success), 0.15);
      border-top: 1px solid rgba(var(--v-theme-success), 0.3);
    }
  }

  &__reward-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.2);
    }
  }

  &__reward-text {
    font-weight: 500;
    color: rgb(var(--v-theme-text-primary));
  }

  &__progress {
    margin-top: 8px;

    &-text {
      font-size: 12px;
      text-align: right;
      margin-top: 4px;
      color: rgb(var(--v-theme-text-secondary));
    }
  }

  &__detailed-progress {
    margin-top: 16px;
    padding-top: 8px;
    border-top: 1px dashed rgba(var(--v-theme-border), 0.12);
    width: 100%;
    overflow: hidden;
  }

  &__detailed-title {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 8px;
    color: rgb(var(--v-theme-text-primary));
  }

  &__detailed-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    width: 100%;
    overflow: hidden;

    @media (min-width: 600px) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__detailed-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    padding: 4px;
    border-radius: 4px;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    &.completed {
      background-color: rgba(var(--v-theme-success), 0.1);
    }

    .v-icon {
      margin-right: 4px;
      flex-shrink: 0;
    }

    span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__global-stats {
    padding: 8px 16px;
    font-size: 12px;
    color: rgb(var(--v-theme-text-secondary));
    border-top: 1px solid rgba(var(--v-theme-border), 0.12);
  }

  &__global-progress {
    margin-bottom: 4px;
  }

  &__global-text {
    text-align: right;
    font-size: 12px;
    margin-top: 4px;
  }

  &--in-progress {
    opacity: 0.85;

    .achievement-card__icon {
      color: rgb(var(--v-theme-text-secondary));
    }

    .achievement-card__name,
    .achievement-card__description {
      color: rgb(var(--v-theme-text-secondary));
    }
  }

  &--locked {
    opacity: 0.7;

    .achievement-card__icon {
      color: rgb(var(--v-theme-text-secondary));
    }
  }
}
</style>
