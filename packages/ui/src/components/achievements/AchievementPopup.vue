<template>
  <article
    class="achievement-popup"
    :class="{ 'achievement-popup--progress': type === 'progress' }"
    role="status"
    aria-atomic="true"
  >
    <div
      class="achievement-popup__body"
      :class="{ 'achievement-popup__body--link': canNavigate }"
      :role="canNavigate ? 'link' : undefined"
      :tabindex="canNavigate ? 0 : undefined"
      @click="navigateToUserAchievements"
      @keydown.enter.prevent="navigateToUserAchievements"
    >
      <div class="achievement-popup__header">
        <div class="achievement-popup__icon" aria-hidden="true">
          <v-icon size="20" :icon="type === 'unlocked' ? 'fa:fa-solid fa-trophy' : 'fa:fa-solid fa-chart-line'" />
        </div>
        <div class="achievement-popup__heading">
          <div class="achievement-popup__title">
            {{ type === 'unlocked' ? $t('achievementsPopup.unlocked') : $t('achievementsPopup.progress') }}
          </div>
          <h3 class="achievement-popup__name">{{ achievement.name }}</h3>
        </div>
      </div>
      <p class="achievement-popup__description">{{ achievement.description }}</p>
      <div v-if="type === 'progress'" class="achievement-popup__progress">
        <v-progress-linear
          :model-value="
            progress.maxValue > 0 ? Math.min(100, Math.max(0, (progress.currentValue / progress.maxValue) * 100)) : 0
          "
          :aria-label="achievement.name"
          color="primary"
          height="6"
          rounded
        />
        <span class="achievement-popup__progress-text">{{ progress.currentValue }} / {{ progress.maxValue }}</span>
      </div>
      <section
        v-if="avatarReward || stickerReward"
        class="achievement-popup__rewards"
        :class="{ 'achievement-popup__rewards--unlocked': type === 'unlocked' }"
      >
        <div class="achievement-popup__rewards-title">{{ $t('achievements.rewards') }}</div>
        <div class="achievement-popup__reward-list">
          <div v-if="avatarReward" class="achievement-popup__reward">
            <div class="achievement-popup__reward-image achievement-popup__reward-image--avatar">
              <Avatar :avatarID="avatarReward" />
            </div>
            <span>{{ $t('achievements.avatarType') }}</span>
          </div>
          <div v-if="stickerReward" class="achievement-popup__reward">
            <div class="achievement-popup__reward-image">
              <StickerImage :id="stickerReward.id" />
            </div>
            <span>{{ $t('achievements.stickerType') }}</span>
          </div>
        </div>
      </section>
    </div>
    <button
      type="button"
      class="achievement-popup__close"
      :aria-label="$t('infoMessage.close')"
      @click.stop="$emit('close')"
    >
      <v-icon icon="close" size="20" aria-hidden="true" />
    </button>
  </article>
</template>

<script lang="ts">
import { getAchievementsText } from '@/helpers/achievements';
import { defineComponent, computed, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { store } from '@/store';
import StickerImage from '@/components/stickers/StickerImage.vue';
import { STICKERS } from '@avalon/types/user/stickers';
import { ACHIEVEMENT_TO_AVATAR_MAP } from '@avalon/types/stats/achievement-avatars';
import Avatar from '@/components/user/Avatar.vue';

export interface AchievementProgress {
  currentValue: number;
  maxValue: number;
}

export default defineComponent({
  name: 'AchievementPopup',
  components: {
    Avatar,
    StickerImage,
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
      };
    });

    // Определяем ID аватарки, которая выдается за достижение
    const stickerReward = computed(() =>
      STICKERS.find((s) => s.achievement === props.achievementID && (!s.hidden || props.type === 'unlocked')),
    );
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

    const canNavigate = computed(() => Boolean(store.state.profile?.id));

    return {
      canNavigate,
      achievement,
      navigateToUserAchievements,
      avatarReward,
      stickerReward,
    };
  },
});
</script>

<style scoped lang="scss">
.achievement-popup {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  color: rgb(var(--v-theme-text-primary));
  background: rgb(var(--v-theme-bg-header));
  border: 1px solid rgba(var(--v-theme-primary), 0.24);
  border-top: 3px solid rgb(var(--v-theme-primary));
  border-radius: 16px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.16);

  &__body {
    padding: 16px;
    overflow-wrap: anywhere;

    &--link {
      cursor: pointer;
    }

    &:focus-visible {
      outline: 2px solid rgb(var(--v-theme-primary));
      outline-offset: -4px;
      border-radius: 13px;
    }
  }

  &__header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding-right: 32px;
  }

  &__icon {
    display: grid;
    place-items: center;
    flex: 0 0 36px;
    height: 36px;
    border-radius: 50%;
    color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.1);
  }

  &__heading {
    min-width: 0;
  }

  &__title {
    margin-bottom: 4px;
    color: rgb(var(--v-theme-primary));
    font-size: 12px;
    font-weight: 600;
    line-height: 1.4;
  }

  &__name {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.3;
    text-wrap: balance;
  }

  &__description {
    margin: 12px 0 0;
    color: rgba(var(--v-theme-text-primary), 0.8);
    font-size: 14px;
    line-height: 1.5;
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 14px;

    .v-progress-linear {
      flex: 1;
    }
  }

  &__progress-text {
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  &__rewards {
    margin-top: 14px;
    padding: 12px;
    background: rgba(var(--v-theme-primary), 0.06);
    border-radius: 10px;

    &--unlocked {
      background: rgba(var(--v-theme-success), 0.15);
      box-shadow: inset 0 0 0 1px rgba(var(--v-theme-success), 0.3);
    }
  }

  &__rewards-title {
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.4;
  }

  &__reward-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
  }

  &__reward {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 13px;
    line-height: 1.4;
  }

  &__reward-image {
    width: 48px;
    height: 48px;
    flex: 0 0 48px;

    :deep(img) {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    &--avatar :deep(img) {
      border-radius: 50%;
    }
  }

  &__close {
    position: absolute;
    top: 3px;
    right: 3px;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    color: rgb(var(--v-theme-text-primary));
    border-radius: 50%;
    cursor: pointer;

    &:hover {
      background: rgba(var(--v-theme-primary), 0.08);
    }

    &:focus-visible {
      outline: 2px solid rgb(var(--v-theme-primary));
      outline-offset: -4px;
    }
  }

  &--progress {
    border-top-color: rgba(var(--v-theme-primary), 0.4);
  }
}

@media (max-width: 480px) {
  .achievement-popup {
    border-radius: 12px;

    &__body {
      padding: 12px;
    }

    &__header {
      gap: 10px;
    }

    &__name {
      font-size: 16px;
    }

    &__reward-list {
      gap: 8px 16px;
    }
  }
}
</style>
