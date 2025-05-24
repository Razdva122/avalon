<template>
  <div class="achievement-popup" :class="{ 'achievement-popup--progress': type === 'progress' }">
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
      </div>
    </div>
    <v-btn
      @click="$emit('close')"
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

export interface AchievementProgress {
  currentValue: number;
  maxValue: number;
}

export default defineComponent({
  name: 'AchievementPopup',
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

    const achievement = computed(() => {
      return {
        name: t(`achievements.${props.achievementID}`),
        description: getAchievementsText(props.achievementID, t(`achievements.${props.achievementID}_description`)),
        icon: undefined,
      };
    });

    return {
      achievement,
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
