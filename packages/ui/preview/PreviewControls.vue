<template>
  <Teleport to=".ai-details"
    ><div class="preview-scenarios">
      <span>Локальный пример</span>
      <select
        aria-label="Этап примера"
        :value="stage.value"
        @change="setStage(($event.target as HTMLSelectElement).value)"
      >
        <option value="selectTeam">Выбор команды</option>
        <option value="fifth">Пятый состав</option>
        <option value="votingForTeam">Голосование</option>
        <option value="onMission">Миссия</option>
        <option value="discussion">Обсуждение</option>
      </select>
    </div></Teleport
  >
</template>
<script setup lang="ts">
import type { Ref } from 'vue';
defineProps<{ stage: Ref<string>; setStage: (next: string) => void }>();
</script>
<style>
.preview-scenarios {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 12px 0;
  font-size: 12px;
  color: rgb(var(--v-theme-text-primary));
}
.preview-scenarios select {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-text-primary));
  border: 1px solid rgba(var(--v-theme-text-primary), 0.18);
  padding: 8px;
  border-radius: 6px;
}
</style>
