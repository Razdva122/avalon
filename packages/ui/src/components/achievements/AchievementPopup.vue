<template>
  <article
    class="achievement-popup"
    :class="{ 'achievement-popup--progress': type === 'progress' }"
    role="status"
    aria-atomic="true"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="leaveFocus"
  >
    <div class="achievement-popup__body">
      <div class="achievement-popup__header">
        <div class="achievement-popup__icon" aria-hidden="true">
          <v-icon size="20" :icon="type === 'progress' ? 'fa:fa-solid fa-chart-line' : 'fa:fa-solid fa-trophy'" />
        </div>
        <div class="achievement-popup__heading">
          <div class="achievement-popup__title">
            {{
              achievementID
                ? $t(type === 'unlocked' ? 'achievementsPopup.unlocked' : 'achievementsPopup.progress')
                : $t('stickers.unlocked')
            }}
          </div>
          <h3 class="achievement-popup__name">
            {{ achievementID ? achievement.name : $t('cosmeticRewards.newStickers', { count: stickerIDs.length }) }}
          </h3>
        </div>
      </div>
      <p class="achievement-popup__description">
        {{ achievementID ? achievement.description : $t('cosmeticRewards.unlockedHint') }}
      </p>
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
        v-if="avatarReward || stickerRewards.length"
        class="achievement-popup__rewards"
        :class="{ 'achievement-popup__rewards--unlocked': type === 'unlocked' }"
      >
        <div class="achievement-popup__rewards-title">
          {{ $t(type === 'unlocked' ? 'cosmeticRewards.received' : 'cosmeticRewards.futureRewards') }}
        </div>
        <div class="achievement-popup__reward-list">
          <div v-if="avatarReward" class="achievement-popup__reward">
            <div class="achievement-popup__reward-image achievement-popup__reward-image--avatar">
              <Avatar :avatarID="avatarReward" />
            </div>
            <div class="achievement-popup__reward-copy">
              <span class="achievement-popup__reward-label">{{ $t('achievements.avatarType') }}</span>
              <strong>{{ avatarName(avatarReward) }}</strong>
            </div>
          </div>
          <div v-for="sticker in stickerRewards" :key="sticker.id" class="achievement-popup__reward">
            <div class="achievement-popup__reward-image"><StickerImage :id="sticker.id" /></div>
            <div class="achievement-popup__reward-copy">
              <span class="achievement-popup__reward-label">{{ $t('achievements.stickerType') }}</span>
              <strong>{{ $t(`stickers.${sticker.id}`) }}</strong>
            </div>
          </div>
        </div>
      </section>
      <RewardActions
        v-if="type === 'unlocked' && $store.state.profile && (avatarReward || stickerRewards.length)"
        class="achievement-popup__actions"
        :avatarID="avatarReward"
        :stickerIDs="stickerRewards.length === 1 ? [stickerRewards[0].id] : []"
        @busy="busy = $event"
      />
      <router-link
        v-if="!achievementID && stickerRewards.length !== 1"
        class="achievement-popup__details-link"
        :to="{ name: 'profile', hash: '#stickers' }"
        >{{ $t('stickers.collection') }}</router-link
      >
      <router-link
        v-if="achievementID && $store.state.profile"
        class="achievement-popup__details-link"
        :to="achievementPath"
        >{{ $t('cosmeticRewards.viewAchievement') }}</router-link
      >
    </div>
    <button
      type="button"
      class="achievement-popup__close"
      :aria-label="$t('infoMessage.close')"
      @click="$emit('close')"
    >
      <v-icon icon="close" size="20" aria-hidden="true" />
    </button>
  </article>
</template>

<script lang="ts">
import { getAchievementsText } from '@/helpers/achievements';
import { avatarName } from '@/helpers/avatars';
import { localizedPath } from '@/router/paths';
import { defineComponent, computed, ref, watch, onMounted, onUnmounted, PropType } from 'vue';
import { useDocumentVisibility } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import { store } from '@/store';
import StickerImage from '@/components/stickers/StickerImage.vue';
import { STICKERS } from '@avalon/types/user/stickers';
import { ACHIEVEMENT_TO_AVATAR_MAP } from '@avalon/types/stats/achievement-avatars';
import Avatar from '@/components/user/Avatar.vue';
import RewardActions from './RewardActions.vue';

export interface AchievementProgress {
  currentValue: number;
  maxValue: number;
}

export default defineComponent({
  name: 'AchievementPopup',
  components: { Avatar, StickerImage, RewardActions },
  props: {
    achievementID: { type: String, default: '' },
    stickerIDs: { type: Array as PropType<string[]>, default: () => [] },
    type: { type: String as PropType<'unlocked' | 'progress'>, required: true },
    progress: { type: Object as PropType<AchievementProgress>, default: () => ({ currentValue: 0, maxValue: 0 }) },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { t, locale } = useI18n();
    const hovered = ref(false),
      focused = ref(false),
      busy = ref(false);
    const visibility = useDocumentVisibility();
    const paused = computed(() => hovered.value || focused.value || busy.value || visibility.value === 'hidden');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      if (!paused.value) timer = setTimeout(() => emit('close'), 12000);
    };
    watch([paused, () => props.progress, () => props.stickerIDs.length, () => props.type], schedule);
    onMounted(schedule);
    onUnmounted(() => clearTimeout(timer));
    const leaveFocus = (event: FocusEvent) => {
      focused.value =
        event.relatedTarget instanceof Node && (event.currentTarget as HTMLElement).contains(event.relatedTarget);
    };
    const achievement = computed(() => ({
      name: t(`achievements.${props.achievementID}`),
      description: getAchievementsText(props.achievementID, t(`achievements.${props.achievementID}_description`)),
    }));
    const stickerRewards = computed(() =>
      STICKERS.filter(
        (s) =>
          props.stickerIDs.includes(s.id) ||
          (s.achievement === props.achievementID && (!s.hidden || props.type === 'unlocked')),
      ),
    );
    const avatarReward = computed(() => ACHIEVEMENT_TO_AVATAR_MAP[props.achievementID]);
    const achievementPath = computed(
      () =>
        localizedPath(`/achievements/user/${store.state.profile?.id}/`, locale.value) +
        `#achievement-${props.achievementID}`,
    );
    return {
      hovered,
      focused,
      busy,
      leaveFocus,
      achievement,
      stickerRewards,
      avatarReward,
      achievementPath,
      avatarName: (id: string) => avatarName(id, t),
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
  }
  &__actions {
    margin-top: 14px;
  }
  &__details-link {
    display: inline-block;
    margin-top: 10px;
    padding: 8px 0;
    font-size: 13px;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  &__reward-copy {
    min-width: 0;
  }
  &__reward-label {
    display: block;
    color: rgb(var(--v-theme-text-secondary));
    font-size: 12px;
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
