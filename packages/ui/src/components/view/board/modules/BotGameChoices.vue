<template>
  <section class="bot-game-choices" :aria-label="$t('aiArena.playWithBots')">
    <div v-if="difficulty" class="prepared-bot-game">
      <h2 class="bot-table">{{ rosterText }}</h2>
      <p>{{ waitingForPlayers ? waitingText : $t('aiArena.ready') }}</p>
      <BotGameTimer v-if="expiresAt" :expires-at="expiresAt" phase="preparation" compact />
      <v-btn
        class="prepared-start"
        variant="flat"
        prepend-icon="play_arrow"
        :loading="busy && !!pendingDifficulty"
        :disabled="busy || !canPlay || !botModes[beginner ? 'beginner' : difficulty] || waitingForPlayers"
        data-prepared-start
        @click="play(difficulty)"
        >{{ $t('aiArena.setupStart') }}</v-btn
      >
      <v-btn
        class="prepared-cancel"
        variant="outlined"
        :disabled="busy"
        :loading="busy && !pendingDifficulty"
        @click="leave"
        >{{ $t('aiArena.setupCancel') }}</v-btn
      >
      <p v-if="error" class="bot-error" role="alert">{{ error }}</p>
    </div>
    <template v-else>
      <h2 class="bot-table" :title="title">{{ rosterText }}</h2>
      <button
        ref="settingsTrigger"
        v-if="!beginner"
        type="button"
        class="bot-configuration"
        data-bot-settings
        :aria-label="$t('aiArena.botSettings')"
        aria-haspopup="dialog"
        :disabled="busy"
        @click="settingsOpen = true"
      >
        <span>{{ $t('aiArena.botPreparationSummary', { language: languageName, count: selectedPlayerCount }) }}</span>
        <v-icon icon="settings" class="bot-settings-icon" aria-hidden="true" />
      </button>
      <p v-if="waitingForPlayers" role="status">{{ waitingText }}</p>
      <div class="bot-modes" :class="{ 'bot-modes--beginner': beginner }">
        <div v-for="difficulty in botDifficulties" :key="difficulty" class="bot-mode">
          <v-btn
            :data-bot-mode="difficulty"
            :class="`bot-mode-button bot-mode-button--${difficulty}`"
            :loading="busy && pendingDifficulty === difficulty"
            :disabled="busy || !canPlay || !botModes[beginner ? 'beginner' : difficulty] || waitingForPlayers"
            :aria-describedby="`bot-${difficulty}-availability`"
            @click="play(difficulty)"
          >
            {{
              $t(
                beginner
                  ? 'aiArena.botBeginnerStart'
                  : difficulty === 'smart'
                    ? 'aiArena.botSmart'
                    : 'aiArena.botRegular',
              )
            }}
          </v-btn>
          <p
            :id="`bot-${difficulty}-availability`"
            class="bot-availability"
            role="status"
            :aria-label="!botModes[beginner ? 'beginner' : difficulty] && botsBusy ? $t('aiArena.botBusy') : undefined"
          >
            <template v-if="!botModes[beginner ? 'beginner' : difficulty]">
              {{
                !botsBusy && botWaitHours[beginner ? 'beginner' : difficulty] !== undefined
                  ? $t('aiArena.botAvailabilityShort', {
                      hours: formatHours(botWaitHours[beginner ? 'beginner' : difficulty]!),
                    })
                  : $t(botsBusy ? 'aiArena.botBusyShort' : 'aiArena.botUnavailable')
              }}
            </template>
          </p>
        </div>
      </div>
      <div class="bot-time-row">
        <BotGameTimer v-if="expiresAt" :expires-at="expiresAt" phase="preparation" compact />
        <button
          ref="timeHelpTrigger"
          type="button"
          class="bot-time-help"
          :aria-label="$t('aiArena.botTimeHelp')"
          aria-haspopup="dialog"
          :disabled="busy"
          @click="timeHelpOpen = true"
        >
          ?
        </button>
      </div>
      <v-btn
        class="bot-leave-button"
        variant="text"
        :loading="busy && !pendingDifficulty"
        :disabled="busy || !canPlay"
        @click="leave"
        >{{ $t('aiArena.botLeaveShort') }}</v-btn
      >
      <p v-if="error" class="bot-error" role="alert">{{ error }}</p>

      <v-dialog
        v-model="settingsOpen"
        class="bot-preparation-dialog"
        max-width="420"
        :aria-label="$t('aiArena.botSettings')"
        @after-leave="settingsTrigger?.focus()"
      >
        <section class="bot-preparation-sheet">
          <header class="bot-sheet-header">
            <h2>{{ $t('aiArena.botSettings') }}</h2>
            <button
              type="button"
              class="bot-sheet-close"
              :aria-label="$t('aiArena.botSettingsDone')"
              :disabled="busy"
              @click="settingsOpen = false"
            >
              <v-icon icon="close" aria-hidden="true" />
            </button>
          </header>
          <div class="bot-setting-fields">
            <label v-if="!beginner" class="bot-language">
              <span>{{ $t('aiArena.selectLanguage') }}</span>
              <select v-model="selectedLanguage" :disabled="busy">
                <option value="en">English</option>
                <option value="ru">Русский</option>
                <option value="zh-tw">繁體中文（台灣）</option>
              </select>
            </label>
            <label v-if="!beginner" class="bot-language">
              <span>{{ $t('aiArena.botTotalPlayers') }}</span>
              <select v-model="selectedPlayerCount" :disabled="busy">
                <option :value="5">5</option>
                <option :value="6">6</option>
                <option :value="7" :disabled="!canPlayLargeTables">7 · Premium</option>
                <option :value="8" :disabled="!canPlayLargeTables">8 · Premium</option>
              </select>
            </label>
          </div>
          <p class="bot-sheet-note">{{ rosterText }}</p>
          <p v-if="!beginner && !canPlayLargeTables" class="bot-sheet-note">{{ $t('aiArena.botPremiumSeats') }}</p>
          <div class="bot-sheet-explanations">
            <p v-if="beginner">{{ $t('aiArena.botBeginnerHint') }}</p>
            <template v-else>
              <p>
                <strong>{{ $t('aiArena.botRegular') }}.</strong> {{ $t('aiArena.botRegularHint') }}
              </p>
              <p>
                <strong>{{ $t('aiArena.botSmart') }}.</strong> {{ $t('aiArena.botSmartHint') }}
              </p>
            </template>
          </div>
          <button
            type="button"
            class="bot-sheet-done"
            data-bot-settings-done
            :disabled="busy"
            @click="settingsOpen = false"
          >
            {{ $t('aiArena.botSettingsDone') }}
          </button>
        </section>
      </v-dialog>
      <v-dialog
        v-model="timeHelpOpen"
        class="bot-preparation-dialog"
        max-width="420"
        :aria-label="$t('aiArena.botTimeHelp')"
        @after-leave="timeHelpTrigger?.focus()"
      >
        <section class="bot-preparation-sheet">
          <header class="bot-sheet-header">
            <h2>{{ $t('aiArena.botTimeHelp') }}</h2>
            <button
              type="button"
              class="bot-sheet-close"
              :aria-label="$t('aiArena.botSettingsDone')"
              :disabled="busy"
              @click="timeHelpOpen = false"
            >
              <v-icon icon="close" aria-hidden="true" />
            </button>
          </header>
          <p class="bot-time-explanation">
            {{ $t(withFriend ? 'aiArena.botFriendDeadlineHint' : 'aiArena.botActionDeadlineHint') }}
          </p>
          <p v-if="beginner" class="bot-time-explanation">{{ $t('aiArena.botBeginnerHint') }}</p>
          <button type="button" class="bot-sheet-done" :disabled="busy" @click="timeHelpOpen = false">
            {{ $t('aiArena.botSettingsDone') }}
          </button>
        </section>
      </v-dialog>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAiAccess } from '@/helpers/composables/useAiAccess';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { localizedPath } from '@/router/paths';
import { socket } from '@/api/socket';
import type { AiBotDifficulty, AiLanguage, AiPlayerCount } from '@avalon/types';
import BotGameTimer from './BotGameTimer.vue';
const props = defineProps<{
  roomID: string;
  title?: string;
  expiresAt?: number;
  beginner?: boolean;
  withFriend?: boolean;
  humanCount?: number;
  humanSeats?: number;
  difficulty?: AiBotDifficulty;
  language?: AiLanguage;
  playerCount?: AiPlayerCount;
}>();
const { t, locale } = useI18n();
const router = useRouter();
const { canPlay, canPlayLargeTables, botModes, botsBusy, botWaitHours, accessStatus, refresh } = useAiAccess();
const formatHours = (hours: number) => new Intl.NumberFormat(locale.value.replace('_', '-')).format(hours);
const botDifficulties = computed<AiBotDifficulty[]>(() => (props.beginner ? ['regular'] : ['regular', 'smart']));
const selectedPlayerCount = ref<AiPlayerCount>(props.playerCount ?? 5);
const expectedHumanCount = computed(() => (props.withFriend ? (props.humanSeats ?? 2) : 1));
const openHumanSeats = computed(() => Math.max(0, expectedHumanCount.value - (props.humanCount ?? 1)));
const waitingForPlayers = computed(() => openHumanSeats.value > 0);
const waitingText = computed(() => t('aiArena.botWaitingForFriends', { count: openHumanSeats.value }));
const rosterText = computed(() =>
  t('aiArena.cardHumanRoster', {
    humans: expectedHumanCount.value,
    bots: selectedPlayerCount.value - expectedHumanCount.value,
  }),
);

const selectedLanguage = ref<AiLanguage>(
  props.language ?? (locale.value === 'ru' ? 'ru' : /^zh[-_]tw$/i.test(locale.value) ? 'zh-tw' : 'en'),
);
const settingsOpen = ref(false);
const timeHelpOpen = ref(false);
const settingsTrigger = ref<HTMLButtonElement>();
const timeHelpTrigger = ref<HTMLButtonElement>();
const languageName = computed(
  () => ({ en: 'English', ru: 'Русский', 'zh-tw': '繁體中文（台灣）' })[selectedLanguage.value],
);
const pendingDifficulty = ref<AiBotDifficulty>();
const busy = ref(false);
const error = ref('');
async function leave() {
  if (busy.value || !canPlay.value) return;
  busy.value = true;
  error.value = '';
  try {
    const result = await socket.timeout(10000).emitWithAck('controlAiRoom', props.roomID, 'stop');
    if ('error' in result) {
      error.value = t('aiArena.botLeaveError');
      return;
    }
    await router.push(localizedPath('/', locale.value));
  } catch {
    error.value = t('aiArena.connectionError');
  } finally {
    busy.value = false;
  }
}
async function play(difficulty: AiBotDifficulty) {
  if (waitingForPlayers.value) return;
  if (
    busy.value ||
    !canPlay.value ||
    !botModes.value[props.beginner ? 'beginner' : difficulty] ||
    accessStatus.value !== 'ready'
  )
    return;
  if (!props.beginner && selectedPlayerCount.value >= 7 && !canPlayLargeTables.value) return;
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
      ...(!props.beginner && selectedPlayerCount.value !== 5 ? { playerCount: selectedPlayerCount.value } : {}),
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
.prepared-bot-game {
  display: grid;
  gap: 12px;
}
.prepared-bot-game p {
  font-size: 16px;
  line-height: 1.5;
}
.prepared-bot-game :deep(.v-btn) {
  width: 100%;
  min-height: 44px;
  text-transform: none;
  letter-spacing: 0;
}
.prepared-bot-game :deep(.prepared-start) {
  min-height: 48px;
  background: #295f8f;
  color: #fff;
  border: 1px solid #75a3c6;
  font-size: 18px;
  font-weight: 600;
}
.prepared-bot-game :deep(.prepared-start.v-btn--disabled) {
  opacity: 1;
  background: #354142;
  color: #b7c1be;
  border-color: #657172;
  box-shadow: none;
}
.prepared-bot-game :deep(.prepared-start.v-btn--disabled .v-btn__overlay) {
  opacity: 0;
}
.prepared-bot-game :deep(.prepared-cancel) {
  border-color: rgba(244, 239, 223, 0.55);
  background: rgba(0, 0, 0, 0.16);
  color: #f4efdf;
}
.bot-game-choices {
  width: 390px;
  max-width: 100%;
  text-align: center;
  color: #f4efdf;
}
.bot-table {
  margin: 0;
  font-size: 22px;
  line-height: 1.25;
  font-weight: 600;
}
.bot-configuration {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: auto;
  max-width: 100%;
  min-height: 40px;
  padding: 4px;
  color: #ded9c9;
  font-size: 14px;
  cursor: pointer;
}
.bot-settings-icon {
  flex-shrink: 0;
  font-size: 18px;
  width: 18px;
  height: 18px;
}
.bot-modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 8px;
}
.bot-modes--beginner {
  grid-template-columns: 1fr;
}
.bot-mode {
  min-width: 0;
}
.bot-mode :deep(.bot-mode-button) {
  width: 100%;
  min-height: 48px;
  height: auto;
  padding: 10px;
  border-radius: 8px;
  text-transform: none;
  letter-spacing: 0;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 600;
}
.bot-mode :deep(.v-btn__content) {
  white-space: normal;
}
.bot-mode :deep(.bot-mode-button--regular) {
  background: #f1eadb;
  color: #263438;
}
.bot-mode :deep(.bot-mode-button--smart) {
  background: #295f8f;
  color: #fff;
  border: 1px solid #75a3c6;
}
.bot-mode :deep(.v-btn--disabled) {
  opacity: 1;
  background: #354142;
  color: #b7c1be;
  border: 1px solid #657172;
  box-shadow: none;
}
.bot-mode :deep(.v-btn--disabled .v-btn__overlay) {
  opacity: 0;
}
.bot-availability {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.25;
  color: #d4c9ac;
}
.bot-availability:empty {
  display: none;
}
.bot-time-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  color: #d4d5c9;
}
.bot-time-row :deep(.bot-game-timer) {
  margin: 0;
  font-size: 14px;
}
.bot-time-help {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 1px solid #87918a;
  border-radius: 50%;
  font-size: 14px;
  color: #e3dfd0;
  cursor: pointer;
}
.bot-game-choices :deep(.bot-leave-button) {
  width: auto;
  min-height: 36px;
  padding: 4px 12px;
  color: #bfc8c2;
  font-size: 14px;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-transform: none;
  letter-spacing: 0;
}
.bot-error {
  margin-top: 8px;
  max-height: 100px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.4;
}
.bot-configuration:disabled,
.bot-time-help:disabled,
.bot-preparation-sheet button:disabled {
  opacity: 0.6;
  cursor: default;
}
.bot-configuration:focus-visible,
.bot-time-help:focus-visible,
.bot-preparation-sheet button:focus-visible,
.bot-language select:focus-visible {
  outline: 3px solid #98c8ed;
  outline-offset: 3px;
}
.bot-preparation-sheet {
  padding: 20px;
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 16px;
  background: #202d30;
  color: #f4efdf;
  text-align: left;
}
.bot-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.bot-sheet-header h2 {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
}
.bot-sheet-close {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  cursor: pointer;
}
.bot-setting-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}
.bot-language {
  display: grid;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  color: #c4c9bf;
}
.bot-language select {
  width: 100%;
  min-height: 44px;
  padding: 8px;
  border: 1px solid #657172;
  border-radius: 8px;
  background: #28373a;
  color: #f4efdf;
  font: inherit;
  font-size: 16px;
  appearance: auto;
}
.bot-sheet-note {
  margin: 10px 0 0;
  color: #bfc8c2;
  font-size: 13px;
  line-height: 1.4;
}
.bot-sheet-explanations {
  display: grid;
  gap: 12px;
  border-top: 1px solid #52615d;
  margin-top: 20px;
  padding-top: 16px;
  font-size: 14px;
  line-height: 1.5;
}
.bot-time-explanation {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 12px;
}
.bot-sheet-done {
  width: 100%;
  min-height: 44px;
  padding: 10px;
  margin-top: 20px;
  border-radius: 8px;
  background: #d8c39d;
  color: #263438;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
@media (max-width: 600px), (max-height: 600px) {
  .bot-game-choices {
    width: 440px;
    max-width: none;
    transform: translateY(6px);
  }
  .bot-table {
    font-size: 28px;
  }
  .bot-configuration {
    min-height: 64px;
    gap: 12px;
    font-size: 26px;
  }
  .bot-settings-icon {
    font-size: 32px;
    width: 32px;
    height: 32px;
  }
  .bot-modes {
    gap: 22px;
    margin-top: 4px;
  }
  .bot-mode :deep(.bot-mode-button) {
    min-height: 96px;
    padding: 12px;
    font-size: 30px;
  }
  .bot-availability {
    font-size: 24px;
    margin-top: 2px;
  }
  .bot-time-row {
    margin-top: 4px;
    gap: 22px;
  }
  .bot-time-row :deep(.bot-game-timer) {
    font-size: 26px;
  }
  .bot-time-help {
    width: 64px;
    height: 64px;
    font-size: 28px;
  }
  .bot-game-choices :deep(.bot-leave-button) {
    min-height: 64px;
    font-size: 26px;
    padding: 6px 16px;
  }
  .bot-error {
    font-size: 24px;
  }
}
@media (max-width: 600px) {
  .bot-preparation-dialog :deep(.v-overlay__content) {
    bottom: 0;
    margin: 0;
    width: 100%;
    max-width: 100%;
    max-height: calc(100dvh - 24px);
  }
  .bot-preparation-sheet {
    max-height: calc(100dvh - 24px);
    padding-bottom: calc(20px + env(safe-area-inset-bottom));
    border-radius: 20px 20px 0 0;
  }
}
</style>
