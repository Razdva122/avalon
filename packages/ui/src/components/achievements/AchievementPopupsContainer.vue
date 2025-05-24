<template>
  <div class="achievement-popups-container">
    <transition-group name="popup-list">
      <achievement-popup
        v-for="popup in popups"
        :key="popup.id"
        :achievementID="popup.achievementID"
        :type="popup.type"
        :progress="popup.progress"
        @close="closePopup(popup.id)"
      />
    </transition-group>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import AchievementPopup, { AchievementProgress } from './AchievementPopup.vue';
import { socket } from '@/api/socket';
import { v4 as uuidv4 } from 'uuid';

export interface AchievementData {
  id: string;
  type: 'unlocked' | 'progress';
  achievementID: string;
  progress?: AchievementProgress;
}

export default defineComponent({
  name: 'AchievementPopupsContainer',
  components: {
    AchievementPopup,
  },
  setup() {
    const popups = ref<AchievementData[]>([]);

    /**
     * Закрывает попап по его ID
     * @param id ID попапа
     */
    const closePopup = (id: string) => {
      const index = popups.value.findIndex((popup) => popup.id === id);
      if (index !== -1) {
        popups.value.splice(index, 1);
      }
    };

    /**
     * Создает новый попап для разблокированного достижения
     * @param achievementId ID достижения
     */
    const createUnlockedPopup = (achievementId: string) => {
      const popup: AchievementData = {
        id: uuidv4(),
        achievementID: achievementId,
        type: 'unlocked',
      };

      popups.value.push(popup);

      // Автоматически закрываем попап через 10 секунд
      setTimeout(() => {
        closePopup(popup.id);
      }, 10000);
    };

    /**
     * Создает новый попап для прогресса достижения
     * @param data Данные о прогрессе достижения
     */
    const createProgressPopup = (data: { achievementID: string; currentProgress: number; requirement: number }) => {
      const popup: AchievementData = {
        id: uuidv4(),
        achievementID: data.achievementID,
        type: 'progress',
        progress: {
          currentValue: data.currentProgress,
          maxValue: data.requirement,
        },
      };

      popups.value.push(popup);

      // Автоматически закрываем попап через 10 секунд
      setTimeout(() => {
        closePopup(popup.id);
      }, 10000);
    };

    /**
     * Обработчик события разблокировки достижения
     */
    const handleAchievementUnlocked = (achievementId: string) => {
      createUnlockedPopup(achievementId);
    };

    /**
     * Обработчик события прогресса достижения
     */
    const handleAchievementProgress = (data: {
      achievementID: string;
      currentProgress: number;
      requirement: number;
    }) => {
      createProgressPopup(data);
    };

    onMounted(() => {
      // Подписываемся на события сокетов
      socket.on('achievementUnlocked', handleAchievementUnlocked);
      socket.on('achievementProgress', handleAchievementProgress);
    });

    onUnmounted(() => {
      // Отписываемся от событий сокетов при размонтировании компонента
      socket.off('achievementUnlocked', handleAchievementUnlocked);
      socket.off('achievementProgress', handleAchievementProgress);
    });

    return {
      popups,
      closePopup,
    };
  },
});
</script>

<style scoped lang="scss">
.achievement-popups-container {
  position: fixed;
  top: 70px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.popup-list-enter-active,
.popup-list-leave-active {
  transition: all 0.3s ease;
}

.popup-list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.popup-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
