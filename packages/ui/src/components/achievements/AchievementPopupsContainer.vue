<template>
  <div class="achievement-popups-container">
    <transition-group name="popup-list">
      <achievement-popup
        v-for="popup in popups"
        :key="popup.id"
        :achievementID="popup.achievementID"
        :stickerIDs="popup.stickerIDs"
        :type="popup.type"
        :progress="popup.progress"
        @close="closePopup(popup.id)"
      />
    </transition-group>
  </div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import type { AchievementProgress } from './AchievementPopup.vue';
import { socket } from '@/api/socket';
import { store } from '@/store';
import { useStickers } from '@/helpers/composables/useStickers';
import { STICKERS } from '@avalon/types/user/stickers';
import { v4 as uuidv4 } from 'uuid';

export interface AchievementData {
  id: string;
  type: 'unlocked' | 'progress';
  achievementID?: string;
  stickerIDs?: string[];
  progress?: AchievementProgress;
}

export default defineComponent({
  name: 'AchievementPopupsContainer',
  components: {
    AchievementPopup: defineAsyncComponent(() => import('@/components/achievements/AchievementPopup.vue')),
  },
  setup() {
    const popups = ref<AchievementData[]>([]);
    const { collection } = useStickers();
    // Dismissal only hides this session's notice. New badges persist on the server.
    const announced = new Set<string>();
    const closePopup = (id: string) => {
      popups.value = popups.value.filter((popup) => popup.id !== id);
    };
    watch(
      () => store.state.profile?.id,
      () => {
        popups.value = [];
        announced.clear();
      },
    );
    watch(
      collection,
      (value) => {
        if (!value) return;
        const stickerIDs = value.stickers
          .filter((s) => s.available && s.isNew && !announced.has(s.id))
          .map((s) => s.id);
        if (!stickerIDs.length) return;
        stickerIDs.forEach((id) => announced.add(id));
        const existing = popups.value.find((p) => p.stickerIDs);
        if (existing) existing.stickerIDs!.push(...stickerIDs);
        else popups.value.push({ id: uuidv4(), type: 'unlocked', stickerIDs });
      },
      { immediate: true },
    );
    const handleAchievementUnlocked = (achievementID: string) => {
      // An achievement's own card already contains its sticker reward.
      const stickerIDs = STICKERS.filter((s) => s.achievement === achievementID).map((s) => s.id);
      stickerIDs.forEach((id) => announced.add(id));
      for (const popup of popups.value) {
        if (popup.stickerIDs) popup.stickerIDs = popup.stickerIDs.filter((id) => !stickerIDs.includes(id));
      }
      popups.value = popups.value.filter((p) =>
        p.stickerIDs ? p.stickerIDs.length : p.achievementID !== achievementID,
      );
      popups.value.push({ id: uuidv4(), achievementID, type: 'unlocked' });
    };
    const handleAchievementProgress = (data: {
      achievementID: string;
      currentProgress: number;
      requirement: number;
    }) => {
      if (popups.value.some((p) => p.achievementID === data.achievementID && p.type === 'unlocked')) return;
      const progress = { currentValue: data.currentProgress, maxValue: data.requirement };
      const existing = popups.value.find((p) => p.achievementID === data.achievementID);
      if (existing) existing.progress = progress;
      else popups.value.push({ id: uuidv4(), achievementID: data.achievementID, type: 'progress', progress });
    };
    onMounted(() => {
      socket.on('achievementUnlocked', handleAchievementUnlocked);
      socket.on('achievementProgress', handleAchievementProgress);
    });
    onUnmounted(() => {
      socket.off('achievementUnlocked', handleAchievementUnlocked);
      socket.off('achievementProgress', handleAchievementProgress);
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
