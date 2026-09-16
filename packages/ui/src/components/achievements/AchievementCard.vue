<template>
  <v-card
    class="achievement-card"
    :class="{
      'achievement-card--locked': !isUnlocked && !isOpen,
      'achievement-card--in-progress': !isUnlocked && isInProgress,
      'achievement-card--completed': isUnlocked && !showGlobalStats,
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
            <div v-if="!showGlobalStats" class="achievement-card__status" :class="{ completed: isUnlocked }">
              <span class="material-icons" aria-hidden="true">{{
                isUnlocked ? 'check_circle' : isInProgress ? 'timelapse' : 'radio_button_unchecked'
              }}</span>
              {{
                $t(
                  isUnlocked
                    ? 'achievements.completed'
                    : isInProgress
                      ? 'achievements.inProgress'
                      : 'achievements.notStarted',
                )
              }}
            </div>
            <h3 class="achievement-card__name">{{ achievement.name }}</h3>
            <div class="achievement-card__description">{{ achievement.description }}</div>
            <div v-if="showProgress && progress && shouldShowProgressBar" class="achievement-card__progress">
              <v-progress-linear
                :model-value="Math.min(100, Math.max(0, (progress.currentValue / progress.maxValue) * 100))"
                :aria-label="achievement.name"
                color="primary"
                height="6"
                rounded
              />
              <div class="achievement-card__progress-text">{{ progress.currentValue }} / {{ progress.maxValue }}</div>
            </div>

            <details
              v-if="showDetailedProgress && (metadata?.roles || metadata?.playerCounts)"
              class="achievement-card__details"
            >
              <summary>{{ $t('achievements.progressDetails') }}</summary>
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
                      :icon="state[role] ? 'fa:fa-solid fa-check' : 'fa:fa-regular fa-circle'"
                      :color="state[role] ? 'success' : undefined"
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
                      :icon="state[count] ? 'fa:fa-solid fa-check' : 'fa:fa-regular fa-circle'"
                      :color="state[count] ? 'success' : undefined"
                      size="small"
                    />
                    <span>{{ count }} {{ $t('achievements.players') }}</span>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
        <div v-if="showGlobalStats && globalStats" class="achievement-card__global-stats">
          <div class="achievement-card__global-progress">
            <v-progress-linear :model-value="globalStats.completionPercentage" color="primary" height="6" rounded />
          </div>
          <div class="achievement-card__global-text">
            {{ $t('achievements.globalCompletion', { percentage: globalStats.completionPercentage.toFixed(1) }) }}
          </div>
        </div>
      </div>
      <section
        v-if="avatarReward || stickerRewards.length"
        class="achievement-card__rewards"
        :class="{ 'achievement-card__rewards--unlocked': isUnlocked && !showGlobalStats }"
      >
        <h4 class="achievement-card__rewards-title">
          <span class="material-icons" aria-hidden="true">redeem</span>{{ $t('achievements.rewards') }}
        </h4>
        <div class="achievement-card__reward-list">
          <div v-if="avatarReward" class="achievement-card__reward-item">
            <Avatar :avatarID="avatarReward" class="achievement-card__reward-image" />
            <span>{{ $t('achievements.avatarType') }}</span>
          </div>
          <div v-for="sticker in stickerRewards" :key="sticker.id" class="achievement-card__reward-item">
            <StickerImage :id="sticker.id" class="achievement-card__reward-image" />
            <div>
              <span>{{ $t('achievements.stickerType') }}</span>
              <div class="achievement-card__reward-name">{{ $t(`stickers.${sticker.id}`) }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </v-card>
</template>

<script lang="ts">
import { getAchievementsText } from '@/helpers/achievements';
import { defineComponent, computed, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AchievementStats } from '@avalon/types';
import { ACHIEVEMENT_TO_AVATAR_MAP } from '@avalon/types/stats/achievement-avatars';
import { STICKERS } from '@avalon/types/user/stickers';
import StickerImage from '@/components/stickers/StickerImage.vue';
import Avatar from '@/components/user/Avatar.vue';

export interface AchievementProgress {
  currentValue: number;
  maxValue: number;
}

export default defineComponent({
  name: 'AchievementCard',
  components: {
    Avatar,
    StickerImage,
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
      return ACHIEVEMENT_TO_AVATAR_MAP[props.achievementID];
    });

    const stickerRewards = computed(() => STICKERS.filter((sticker) => sticker.achievement === props.achievementID));

    // Определяем, находится ли достижение в процессе выполнения
    const isInProgress = computed(() => {
      return props.progress && props.progress.currentValue > 0 && props.progress.currentValue < props.progress.maxValue;
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
      stickerRewards,
    };
  },
});
</script>

<style scoped lang="scss">
.achievement-card {
  width: 100%;
  height: 100%;
  min-width: 0;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: none;
  background-color: rgb(var(--v-theme-inset));
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &__wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  &__main {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  &__content {
    display: flex;
    padding: 16px;
  }

  &__icon {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
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
    color: rgb(var(--v-theme-on-surface));
  }

  &__description {
    font-size: 14px;
    color: rgba(var(--v-theme-on-surface), 0.7);
    margin-bottom: 8px;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
  }

  &__rewards {
    padding: 12px 16px;
    background: rgba(var(--v-theme-primary), 0.06);
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    &--unlocked {
      background: rgba(var(--v-theme-success), 0.08);
    }
  }
  &__rewards-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 8px;
    color: rgba(var(--v-theme-on-surface), 0.7);
    .material-icons {
      font-size: 16px;
    }
  }
  &__reward-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 16px;
  }
  &__reward-item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    font-size: 13px;
  }
  &__reward-image {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    object-fit: contain;
    border-radius: 8px;
  }
  &__reward-name {
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.7);
    overflow-wrap: anywhere;
  }

  &__progress {
    margin-top: 8px;

    &-text {
      font-size: 12px;
      text-align: right;
      margin-top: 4px;
      color: rgba(var(--v-theme-on-surface), 0.7);
    }
  }

  &__detailed-progress {
    margin-top: 16px;
    padding-top: 8px;
    border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
    width: 100%;
    overflow: hidden;
  }

  &__detailed-title {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 8px;
    color: rgb(var(--v-theme-on-surface));
  }

  &__detailed-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 8px;
    width: 100%;
    overflow: hidden;
  }

  &__detailed-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    padding: 4px;
    border-radius: 4px;
    min-width: 0;
    overflow: hidden;
    white-space: normal;
    overflow-wrap: anywhere;
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
    margin-top: auto;
    padding: 8px 16px;
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.7);
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  }

  &__global-progress {
    margin-bottom: 4px;
  }

  &__global-text {
    text-align: right;
    font-size: 12px;
    margin-top: 4px;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 5px;
    color: rgba(var(--v-theme-on-surface), 0.7);
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 8px;
    .material-icons {
      font-size: 16px;
    }
    &.completed {
      color: rgb(var(--v-theme-success));
    }
  }
  &--completed {
    border-color: rgba(var(--v-theme-success), 0.4);
  }
  &__details summary {
    cursor: pointer;
    padding: 12px 0;
    min-height: 44px;
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--v-theme-primary));
  }
  &__details summary:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: -2px;
  }
  &__description {
    line-height: 1.5;
  }
}
</style>
