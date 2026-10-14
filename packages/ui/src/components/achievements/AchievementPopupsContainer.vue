<template>
  <div class="achievement-popups-container">
    <transition-group name="popup-list">
      <achievement-popup
        v-for="popup in popups"
        :key="popup.id"
        :achievementIDs="popup.achievementIDs"
        :stickerIDs="popup.stickerIDs"
        @close="closePopup(popup.id)"
      />
    </transition-group>
  </div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { socket } from '@/api/socket';
import { store } from '@/store';
import { useStickers } from '@/helpers/composables/useStickers';
import { STICKERS } from '@avalon/types/user/stickers';
import { v4 as uuidv4 } from 'uuid';

export interface AchievementData {
  id: string;
  achievementIDs: string[];
  stickerIDs: string[];
}

export default defineComponent({
  name: 'AchievementPopupsContainer',
  components: {
    AchievementPopup: defineAsyncComponent(() => import('@/components/achievements/AchievementPopup.vue')),
  },
  setup() {
    const popups = ref<AchievementData[]>([]);
    const { unlocked } = useStickers();
    const announcedStickers = new Set<string>();
    const announcedAchievements = new Set<string>();
    const closePopup = (id: string) => {
      popups.value = popups.value.filter((popup) => popup.id !== id);
    };
    watch(
      () => store.state.profile?.id,
      () => {
        popups.value = [];
        announcedStickers.clear();
        announcedAchievements.clear();
      },
      { flush: 'sync' },
    );
    const addRewards = (achievementIDs: string[], stickerIDs: string[]) => {
      if (!store.state.profile?.id) return;
      const achievements = achievementIDs.filter((id) => !announcedAchievements.has(id));
      const stickers = stickerIDs.filter((id) => !announcedStickers.has(id));
      if (!achievements.length && !stickers.length) return;
      achievements.forEach((id) => announcedAchievements.add(id));
      stickers.forEach((id) => announcedStickers.add(id));
      const existing = popups.value[0];
      if (existing) {
        existing.achievementIDs.push(...achievements);
        existing.stickerIDs.push(...stickers);
      } else popups.value.push({ id: uuidv4(), achievementIDs: achievements, stickerIDs: stickers });
    };
    watch(unlocked, (ids) => addRewards([], ids));
    const handleAchievementUnlocked = (achievementID: string) => {
      const stickerIDs = STICKERS.filter((s) => s.achievement === achievementID).map((s) => s.id);
      addRewards([achievementID], stickerIDs);
    };
    onMounted(() => {
      socket.on('achievementUnlocked', handleAchievementUnlocked);
    });
    onUnmounted(() => {
      socket.off('achievementUnlocked', handleAchievementUnlocked);
    });
    return { popups, closePopup };
  },
});
</script>

<style scoped lang="scss">
.achievement-popups-container {
  position: fixed;
  top: calc(70px + env(safe-area-inset-top, 0px));
  right: max(20px, env(safe-area-inset-right, 0px));
  width: min(390px, calc(100vw - 40px));
  max-height: calc(100dvh - 90px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  overscroll-behavior: contain;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.popup-list-enter-active,
.popup-list-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.popup-list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.popup-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
@media (max-width: 480px) {
  .achievement-popups-container {
    right: max(12px, env(safe-area-inset-right, 0px));
    left: max(12px, env(safe-area-inset-left, 0px));
    width: auto;
    gap: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .popup-list-enter-active,
  .popup-list-leave-active {
    transition: none;
  }

  .popup-list-enter-from,
  .popup-list-leave-to {
    transform: none;
  }
}
</style>
