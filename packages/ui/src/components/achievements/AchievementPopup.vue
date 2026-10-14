<template>
  <article
    class="achievement-popup"
    role="status"
    aria-atomic="true"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="leaveFocus"
  >
    <div class="achievement-popup__icon" aria-hidden="true">
      <v-icon size="20" icon="fa:fa-solid fa-trophy" />
    </div>
    <div class="achievement-popup__body">
      <h3>{{ $t('cosmeticRewards.received') }}</h3>
      <p>{{ summary }}</p>
      <router-link :to="{ name: 'profile', hash: '#stickers' }" @click="$emit('close')">
        {{ $t('stickers.collection') }}
      </router-link>
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
import { defineComponent, computed, ref, watch, onMounted, onUnmounted, PropType } from 'vue';
import { useDocumentVisibility } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import { ACHIEVEMENT_TO_AVATAR_MAP } from '@avalon/types/stats/achievement-avatars';

export default defineComponent({
  name: 'AchievementPopup',
  props: {
    achievementIDs: { type: Array as PropType<string[]>, default: () => [] },
    stickerIDs: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const hovered = ref(false),
      focused = ref(false);
    const visibility = useDocumentVisibility();
    const paused = computed(() => hovered.value || focused.value || visibility.value === 'hidden');
    const summary = computed(() => {
      const avatars = new Set(props.achievementIDs.map((id) => ACHIEVEMENT_TO_AVATAR_MAP[id]).filter(Boolean));
      return [
        props.achievementIDs.length
          ? t('cosmeticRewards.earnedAchievements', { count: props.achievementIDs.length })
          : '',
        props.stickerIDs.length ? t('cosmeticRewards.earnedStickers', { count: props.stickerIDs.length }) : '',
        avatars.size ? t('cosmeticRewards.earnedAvatars', { count: avatars.size }) : '',
      ]
        .filter(Boolean)
        .join(' · ');
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      if (!paused.value) timer = setTimeout(() => emit('close'), 12000);
    };
    watch([paused, () => props.achievementIDs.length, () => props.stickerIDs.length], schedule);
    onMounted(schedule);
    onUnmounted(() => clearTimeout(timer));
    const leaveFocus = (event: FocusEvent) => {
      focused.value =
        event.relatedTarget instanceof Node && (event.currentTarget as HTMLElement).contains(event.relatedTarget);
    };
    return { hovered, focused, leaveFocus, summary };
  },
});
</script>

<style scoped lang="scss">
.achievement-popup {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 16px 48px 12px 16px;
  color: rgb(var(--v-theme-text-primary));
  background: rgb(var(--v-theme-bg-header));
  border: 1px solid rgba(var(--v-theme-primary), 0.24);
  border-top: 3px solid rgb(var(--v-theme-primary));
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.16);

  &__icon {
    display: grid;
    place-items: center;
    flex: 0 0 36px;
    height: 36px;
    border-radius: 50%;
    color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.1);
  }
  &__body {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  h3 {
    margin: 0;
    font-size: 16px;
    line-height: 1.4;
  }
  p {
    margin: 4px 0 0;
    color: rgb(var(--v-theme-text-secondary));
    font-size: 13px;
    line-height: 1.5;
  }
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-size: 13px;
    text-decoration: underline;
    text-underline-offset: 3px;
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
  }
  a:focus-visible,
  &__close:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }
}
</style>
