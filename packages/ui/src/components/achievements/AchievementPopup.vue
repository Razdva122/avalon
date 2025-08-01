<template>
  <div
    class="achievement-popup"
    :class="{ 'achievement-popup--progress': type === 'progress' }"
    @click="navigateToUserAchievements"
  >
    <div class="achievement-popup__content">
      <div class="achievement-popup__icon">
        <v-icon v-if="!achievement.icon" size="large" icon="fa:fa-solid fa-trophy" />
        <img v-else :src="achievement.icon" alt="Achievement icon" />
      </div>
      <div class="achievement-popup__info">
        <div class="achievement-popup__title">
          {{ type === 'unlocked' ? $t('achievementsPopup.unlocked') : $t('achievementsPopup.progress') }}
        </div>
        <div class="achievement-popup__name">{{ achievement.name }}</div>
        <div class="achievement-popup__description">{{ achievement.description }}</div>
        <div v-if="type === 'progress'" class="achievement-popup__progress">
          <v-progress-linear
            :model-value="(progress.currentValue / progress.maxValue) * 100"
            color="primary"
            height="10"
          />
          <div class="achievement-popup__progress-text">{{ progress.currentValue }} / {{ progress.maxValue }}</div>
        </div>
        <div
          v-if="avatarReward"
          class="achievement-popup__reward"
          :class="{ 'achievement-popup__reward--unlocked': type === 'unlocked' }"
        >
          <div class="achievement-popup__reward-text">{{ $t('achievements.avatarReward') }}</div>
          <div class="achievement-popup__reward-icon">
            <Avatar :avatarID="avatarReward" size="medium" />
          </div>
        </div>
      </div>
    </div>
    <v-btn
      @click.stop="$emit('close')"
      class="achievement-popup__close"
      icon="close"
      color="text-primary"
      variant="text"
      density="compact"
    />
  </div>
</template>

<script lang="ts">
import { getAchievementsText } from '@/helpers/achievements';
import { defineComponent, computed, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { store } from '@/store';
import { ACHIEVEMENT_TO_AVATAR_MAP } from '@avalon/types';
import Avatar from '@/components/user/Avatar.vue';

export interface AchievementProgress {
  currentValue: number;
  maxValue: number;
}

export default defineComponent({
  name: 'AchievementPopup',
  components: {
    Avatar,
  },
  props: {
    achievementID: {
      type: String,
      required: true,
    },
    type: {
      type: String as PropType<'unlocked' | 'progress'>,
      required: true,
      validator: (value: string) => ['unlocked', 'progress'].includes(value),
    },
    progress: {
      type: Object as PropType<AchievementProgress>,
      required: false,
      default: () => ({ currentValue: 0, maxValue: 0 }),
    },
  },
  emits: ['close'],
  setup(props) {
    const { t } = useI18n();
    const router = useRouter();

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

    // Функция для перехода на страницу личных достижений
    const navigateToUserAchievements = () => {
      const userID = store.state.profile?.id;
      if (userID) {
        router.push(`/achievements/user/${userID}/`);
      }
      // Если пользователь не авторизован, ничего не делаем
    };

    return {
      achievement,
      navigateToUserAchievements,
      avatarReward,
    };
  },
});
</script>

<style scoped lang="scss">
.achievement-popup {
  position: relative;
  width: 350px;
  padding: 16px;
  background-color: rgb(var(--v-theme-bg-header));
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: 16px;
  animation: slide-in 0.3s ease-out;
  cursor: pointer;

  &__content {
    display: flex;
    align-items: center;
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
  }

  &__title {
    font-size: 14px;
    font-weight: bold;
    color: rgb(var(--v-theme-primary));
    margin-bottom: 4px;
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

  &__close {
    position: absolute;
    top: 8px;
    right: 8px;
  }

  &--progress {
    background-color: rgb(var(--v-theme-bg-header));
  }

  &__reward {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    margin-top: 12px;
    background-color: rgba(var(--v-theme-primary), 0.1);
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.3s ease;

    &--unlocked {
      background-color: rgba(var(--v-theme-success), 0.15);
      border: 1px solid rgba(var(--v-theme-success), 0.3);
    }
  }

  &__reward-icon {
    display: flex;
    align-items: center;
    justify-content: center;

    :deep(img) {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: transform 0.3s ease;
    }

    &:hover :deep(img) {
      transform: scale(1.1);
    }
  }

  &__reward-text {
    font-weight: 500;
    color: rgb(var(--v-theme-text-primary));
  }
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
