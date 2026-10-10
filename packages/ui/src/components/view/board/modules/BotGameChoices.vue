<template>
  <section class="bot-game-choices" :aria-label="$t('aiArena.playWithBots')">
    <h2 class="bot-table" :title="title">{{ title || $t('aiArena.botTable') }}</h2>
    <BotGameTimer v-if="expiresAt" :expires-at="expiresAt" phase="preparation" />
    <label class="bot-language">
      <span>{{ $t('aiArena.selectLanguage') }}</span>
      <select v-model="selectedLanguage" :disabled="busy">
        <option value="en">English</option>
        <option value="ru">Русский</option>
        <option value="zh-tw">繁體中文（台灣）</option>
      </select>
    </label>
    <div class="bot-modes">
      <div
        v-for="difficulty in botDifficulties"
        :key="difficulty"
        class="bot-mode"
        :class="{ 'bot-mode--unavailable': !botModes[difficulty] }"
      >
        <v-btn
          :data-bot-mode="difficulty"
          :color="difficulty === 'smart' ? 'primary' : 'secondary'"
          :loading="busy && pendingDifficulty === difficulty"
          :disabled="busy || !canPlay || !botModes[difficulty]"
          :aria-describedby="`bot-${difficulty}-hint bot-${difficulty}-availability`"
          @click="play(difficulty)"
        >
          <span class="bot-mode-label">
            <v-icon
              class="bot-mode-icon"
              :icon="difficulty === 'smart' ? 'fa:fa-solid fa-brain' : 'fa:fa-solid fa-graduation-cap'"
              aria-hidden="true"
            />
            <span>{{ $t(difficulty === 'smart' ? 'aiArena.botSmart' : 'aiArena.botRegular') }}</span>
          </span>
        </v-btn>
        <p :id="`bot-${difficulty}-hint`">
          {{ $t(difficulty === 'smart' ? 'aiArena.botSmartHint' : 'aiArena.botRegularHint') }}
        </p>
        <p :id="`bot-${difficulty}-availability`" role="status">
          <template v-if="!botModes[difficulty]">{{ $t('aiArena.botUnavailable') }}</template>
        </p>
      </div>
    </div>
    <p class="bot-action-hint">{{ $t('aiArena.botActionDeadlineHint') }}</p>
    <p v-if="error" role="alert">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAiAccess } from '@/helpers/composables/useAiAccess';
import { useI18n } from 'vue-i18n';
import { socket } from '@/api/socket';
import type { AiBotDifficulty, AiLanguage } from '@avalon/types';
import BotGameTimer from './BotGameTimer.vue';
const props = defineProps<{ roomID: string; title?: string; expiresAt?: number }>();
const { t, locale } = useI18n();
const { canPlay, botModes, refresh } = useAiAccess();
const botDifficulties: AiBotDifficulty[] = ['smart', 'regular'];
const selectedLanguage = ref<AiLanguage>(
  locale.value === 'ru' ? 'ru' : /^zh[-_]tw$/i.test(locale.value) ? 'zh-tw' : 'en',
);
const pendingDifficulty = ref<AiBotDifficulty>();
const busy = ref(false);
const error = ref('');
async function play(difficulty: AiBotDifficulty) {
  if (busy.value || !canPlay.value || !botModes.value[difficulty]) return;
  if (props.expiresAt && Date.now() >= props.expiresAt) {
    error.value = t('aiArena.botTimeout');
    return;
  }
  busy.value = true;
  pendingDifficulty.value = difficulty;
  error.value = '';
  try {
    const result = await socket.timeout(30000).emitWithAck('startHumanAiRoom', props.roomID, {
      difficulty,
      language: selectedLanguage.value,
    });
    if ('error' in result) {
      error.value = t('aiArena.botPlayError');
      await refresh();
    }
  } catch {
    error.value = t('aiArena.connectionError');
    await refresh();
  } finally {
    busy.value = false;
    pendingDifficulty.value = undefined;
  }
}
</script>

<style scoped>
.bot-game-choices {
  width: 390px;
  max-width: 100%;
  margin: 8px 0 12px;
  text-align: center;
}
.bot-table {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bot-language {
  display: grid;
  gap: 4px;
  margin: 8px 0 12px;
  font-size: 14px;
}
.bot-language select {
  min-height: 44px;
  width: 100%;
  padding: 6px 10px;
  border: 1px solid currentColor;
  border-radius: 4px;
  color: rgb(var(--v-theme-on-surface));
  background: rgb(var(--v-theme-surface));
  font: inherit;
  appearance: auto;
}
.bot-language select:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.bot-modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.bot-mode {
  min-width: 0;
}
.bot-mode :deep(.v-btn) {
  width: 100%;
  min-height: 44px;
  text-transform: none;
  letter-spacing: 0;
}
.bot-mode-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.bot-mode-icon {
  width: 18px;
  height: 18px;
  font-size: 18px;
}
.bot-mode p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.4;
}
.bot-action-hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.3;
}
@media (max-width: 600px), (max-height: 600px) {
  .bot-game-choices {
    zoom: calc(1 / var(--board-scale, 1));
    width: 190px;
    max-width: none;
    margin: 0;
  }
  .bot-table {
    font-size: 14px;
    line-height: 18px;
    margin-bottom: 2px;
  }
  .bot-language {
    gap: 2px;
    margin: 4px 0 6px;
    font-size: 12px;
  }
  .bot-language > span {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .bot-language select {
    min-height: 45px;
  }
  .bot-modes {
    gap: 8px;
  }
  .bot-mode :deep(.v-btn) {
    min-height: 45px;
    font-size: 13px;
    letter-spacing: 0;
    padding: 0 6px;
  }
  .bot-mode :deep(.v-btn__content) {
    white-space: normal;
  }
  .bot-mode-label {
    flex-direction: column;
    gap: 2px;
    line-height: 13px;
  }
  .bot-mode-icon {
    width: 14px;
    height: 14px;
    font-size: 14px;
  }
  .bot-mode p {
    font-size: 11px;
    line-height: 1.2;
    margin-top: 4px;
  }
  .bot-action-hint {
    font-size: 11px;
    line-height: 1.2;
    margin-top: 6px;
  }
  .bot-mode p[role='status']:empty,
  .bot-mode--unavailable p:first-of-type {
    display: none;
  }
}
@media (max-height: 600px) {
  .bot-game-choices {
    width: 170px;
  }
  .bot-table {
    font-size: 12px;
    line-height: 14px;
    margin-bottom: 0;
  }
  :deep(.bot-game-timer) {
    font-size: 11px;
    line-height: 13px;
    margin: 0;
  }
  .bot-language {
    margin: 2px 0 4px;
  }
  .bot-mode {
    display: contents;
  }
  .bot-mode :deep(.v-btn) {
    grid-row: 1;
  }
  .bot-mode:first-child :deep(.v-btn) {
    grid-column: 1;
  }
  .bot-mode:last-child :deep(.v-btn) {
    grid-column: 2;
  }
  .bot-mode p {
    grid-column: 1 / -1;
    margin-top: 0;
    line-height: 1.15;
  }
  .bot-mode:first-child p {
    grid-row: 2;
  }
  #bot-smart-hint,
  #bot-smart-availability {
    display: none;
  }
  .bot-mode:last-child p {
    grid-row: 3;
  }
  .bot-modes {
    row-gap: 2px;
  }
  .bot-action-hint {
    max-width: 150px;
    margin: 4px auto 0;
  }
}
</style>
