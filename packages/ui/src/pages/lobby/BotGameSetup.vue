<template>
  <v-dialog
    v-model="open"
    max-width="560"
    class="bot-setup-dialog"
    scrollable
    :persistent="busy"
    :aria-label="$t('aiArena.setupTitle')"
  >
    <section class="bot-setup">
      <header class="bot-setup-header">
        <h2>{{ $t('aiArena.setupTitle') }}</h2>
        <button
          type="button"
          class="close-button"
          :aria-label="$t('infoMessage.close')"
          :disabled="busy"
          @click="open = false"
        >
          <v-icon icon="close" />
        </button>
      </header>
      <div class="bot-setup-body">
        <div class="play-format" role="group" :aria-label="$t('aiArena.setupTitle')">
          <button type="button" :aria-pressed="!withFriend" :disabled="busy" @click="withFriend = false">
            <v-icon icon="person" />{{ $t('aiArena.setupSolo') }}
          </button>
          <button type="button" :aria-pressed="withFriend" :disabled="busy" @click="withFriend = true">
            <v-icon icon="people" />{{ $t('aiArena.setupFriend') }}
          </button>
        </div>
        <label v-if="withFriend" class="language-field human-seats-field">
          <span>{{ $t('aiArena.setupHumanPlayers') }}</span>
          <select v-model="humanSeats" :disabled="busy" data-human-seats>
            <option :value="2">2</option>
            <option :value="3">3</option>
          </select>
        </label>
        <p v-if="withFriend" class="friend-hint">{{ $t('aiArena.setupFriendHint') }}</p>
        <div v-if="notice" class="availability-notice" role="status">
          <v-icon icon="schedule" />
          <div>
            <strong>{{ notice }}</strong>
            <p v-if="waitHours !== undefined">
              {{ $t('aiArena.setupAvailableIn', { hours: formatHours(waitHours) }) }}
            </p>
          </div>
        </div>
        <fieldset class="mode-options">
          <legend class="sr-only">{{ $t('aiArena.setupTitle') }}</legend>
          <div class="standard-modes">
            <label
              v-for="mode in ['regular', 'smart'] as const"
              :key="mode"
              class="mode-option"
              :class="{ selected: selectedMode === mode, unavailable: !modeAvailable(mode) }"
            >
              <span class="mode-heading"
                ><v-icon :icon="mode === 'smart' ? 'shield' : 'flag'" /><input
                  v-model="selectedMode"
                  type="radio"
                  name="bot-mode"
                  :value="mode"
                  :disabled="busy || !modeAvailable(mode)"
                  :class="{ 'sr-only': !modeAvailable(mode) }" /><v-icon
                  v-if="!modeAvailable(mode)"
                  icon="lock"
                  :aria-label="$t('aiArena.botUnavailable')"
              /></span>
              <strong>{{ $t(mode === 'smart' ? 'aiArena.setupSmart' : 'aiArena.setupRegular') }}</strong>
              <span class="mode-hint">{{
                $t(mode === 'smart' ? 'aiArena.setupSmartHint' : 'aiArena.setupRegularHint')
              }}</span>
            </label>
          </div>
          <label
            class="mode-option beginner-option"
            :class="{ selected: selectedMode === 'beginner', unavailable: !modeAvailable('beginner') }"
          >
            <v-icon icon="menu_book" /><span
              ><strong>{{ $t('aiArena.setupBeginner') }}</strong
              ><span class="mode-hint">{{ $t('aiArena.setupBeginnerHint') }}</span></span
            >
            <input
              v-model="selectedMode"
              type="radio"
              name="bot-mode"
              value="beginner"
              :disabled="busy || !modeAvailable('beginner')"
              :class="{ 'sr-only': !modeAvailable('beginner') }"
            /><v-icon v-if="!modeAvailable('beginner')" icon="lock" :aria-label="$t('aiArena.botUnavailable')" />
          </label>
        </fieldset>
        <div class="language-field">
          <span id="bot-language-label">{{ $t('aiArena.selectLanguage') }}</span>
          <v-select
            v-model="language"
            :items="languageChoices"
            :disabled="busy"
            aria-labelledby="bot-language-label"
            variant="outlined"
            density="comfortable"
            hide-details
            class="artwork-select"
            data-bot-language
          >
            <template #selection="{ item }">
              <span class="select-choice">
                <img :src="item.raw.flag" alt="" class="language-flag" width="24" height="16" />
                <span>{{ item.title }}</span>
              </span>
            </template>
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" class="artwork-option">
                <template #prepend>
                  <img :src="item.raw.flag" alt="" class="language-flag" width="24" height="16" />
                </template>
              </v-list-item>
            </template>
          </v-select>
        </div>
        <div v-if="!withFriend" class="language-field role-field">
          <span id="bot-role-label">{{ $t('aiArena.selectRole') }}</span>
          <v-select
            v-model="selectedRole"
            :items="roleChoices"
            :disabled="busy"
            aria-labelledby="bot-role-label"
            variant="outlined"
            density="comfortable"
            hide-details
            class="artwork-select"
            data-solo-role
          >
            <template #selection="{ item }">
              <span class="select-choice">
                <PlayerIcon
                  :icon="item.raw.icon"
                  thumbnail
                  aria-hidden="true"
                  class="choice-role-icon"
                  :class="rolesShortInfo[item.raw.icon].loyalty"
                />
                <span>{{ item.title }}</span>
              </span>
            </template>
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" class="artwork-option">
                <template #prepend>
                  <PlayerIcon
                    :icon="item.raw.icon"
                    thumbnail
                    aria-hidden="true"
                    class="choice-role-icon"
                    :class="rolesShortInfo[item.raw.icon].loyalty"
                  />
                </template>
              </v-list-item>
            </template>
          </v-select>
        </div>
        <fieldset class="seat-options">
          <legend>{{ $t('aiArena.botTotalPlayers') }}</legend>
          <div class="seat-row">
            <button
              v-for="count in [5, 6, 7, 8] as const"
              :key="count"
              type="button"
              :data-player-count="count"
              :aria-pressed="playerCount === count"
              :disabled="busy || (selectedMode === 'beginner' && count !== 5) || (count >= 7 && !canPlayLargeTables)"
              @click="playerCount = count"
            >
              <span>{{ count }}</span
              ><span v-if="count >= 7" class="premium-label"><v-icon icon="fa:fa-solid fa-crown" />Premium</span>
            </button>
          </div>
          <p class="premium-hint">{{ $t('aiArena.botPremiumSeats') }}</p>
        </fieldset>
      </div>
      <footer class="setup-footer">
        <p>
          {{ rosterText }}
          · {{ $t('aiArena.setupNoRating') }}
        </p>
        <v-btn
          color="primary"
          block
          :loading="busy"
          :disabled="busy || (signedIn && !canCreate)"
          data-create-bot-game
          @click="create"
          >{{
            $t(signedIn ? (ownRoomID ? 'aiArena.botContinue' : 'aiArena.setupCreate') : 'aiArena.setupGuest')
          }}</v-btn
        >
        <p v-if="error" class="setup-error" role="alert">{{ error }}</p>
      </footer>
    </section>
  </v-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useStore } from '@/store';
import { socket } from '@/api/socket';
import eventBus from '@/helpers/event-bus';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import { rolesShortInfo } from '@/components/view/information/const';
import { useAiAccess } from '@/helpers/composables/useAiAccess';
import { openRoomRoute } from '@/helpers/open-room-route';
import type { AiLanguage, AiPlayerCount } from '@avalon/types';
import { aiHumanRoles, type AiHumanRole } from '@avalon/types/room/ai-roles';
const props = defineProps<{ modelValue: boolean; beginner?: boolean; withFriend?: boolean }>();
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'opened'): void;
  (event: 'busy', value: boolean): void;
  (event: 'error', message: string): void;
}>();
const { t, locale } = useI18n();
const router = useRouter();
const store = useStore();
const { canPlay, canPlayLargeTables, botModes, botWaitHours, botsBusy, accessStatus, ownRoomID, refresh } =
  useAiAccess();
const open = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) });
const signedIn = computed(() => Boolean(store.state.profile?.id));
const selectedMode = ref<'regular' | 'smart' | 'beginner'>(props.beginner ? 'beginner' : 'regular');
const withFriend = ref(Boolean(props.withFriend));
const humanSeats = ref<2 | 3>(2);
const language = ref<AiLanguage>(locale.value === 'ru' ? 'ru' : /^zh[-_]tw$/i.test(locale.value) ? 'zh-tw' : 'en');
const playerCount = ref<AiPlayerCount>(5);
const selectedRole = ref<AiHumanRole | ''>('');
const availableRoles = computed(() => aiHumanRoles(playerCount.value));
const roleChoices = computed(() => [
  { value: '', title: t('aiArena.randomRole'), icon: 'unknown' as const },
  ...availableRoles.value.map((role) => ({ value: role, title: t(`roles.${role}`), icon: role })),
]);
const languageChoices = [
  { value: 'en', title: 'English', flag: '/flags/en.svg' },
  { value: 'ru', title: 'Русский', flag: '/flags/ru.svg' },
  { value: 'zh-tw', title: '繁體中文（台灣）', flag: '/flags/zh-tw.svg' },
];
watch([playerCount, withFriend], () => {
  if (withFriend.value || (selectedRole.value && !availableRoles.value.includes(selectedRole.value)))
    selectedRole.value = '';
});
const rosterText = computed(() => {
  const humans = withFriend.value ? humanSeats.value : 1;
  return t('aiArena.cardHumanRoster', { humans, bots: playerCount.value - humans });
});
const busy = ref(false);
const error = ref('');
const resumeAfterAuth = ref(false);
let active = true;
onBeforeUnmount(() => {
  active = false;
});
function modeAvailable(mode: 'regular' | 'smart' | 'beginner') {
  return (
    accessStatus.value === 'ready' &&
    canPlay.value &&
    botModes.value[mode] &&
    !(mode === 'beginner' && withFriend.value)
  );
}
const canCreate = computed(
  () =>
    Boolean(ownRoomID.value) ||
    (modeAvailable(selectedMode.value) && (playerCount.value < 7 || canPlayLargeTables.value)),
);
watch([resumeAfterAuth, accessStatus], () => {
  if (!resumeAfterAuth.value || accessStatus.value === 'loading') return;
  resumeAfterAuth.value = false;
  if (active && open.value && accessStatus.value === 'ready') void create();
});
watch([selectedMode, canPlayLargeTables], () => {
  if (selectedMode.value === 'beginner' || (!canPlayLargeTables.value && playerCount.value >= 7)) playerCount.value = 5;
});
watch(open, (value) => {
  if (!value) resumeAfterAuth.value = false;
  if (value) {
    error.value = '';
    void refresh();
  }
});
const notice = computed(() => {
  if (!signedIn.value) return '';
  if (ownRoomID.value) return t('aiArena.botContinue');
  if (accessStatus.value === 'loading') return '';
  if (accessStatus.value === 'error') return t('aiArena.connectionError');
  if (botsBusy.value) return t('aiArena.setupBusy');
  if (!canPlay.value || (!botModes.value.smart && !botModes.value.regular && !modeAvailable('beginner')))
    return t('aiArena.setupAllUnavailable');
  if (!botModes.value.smart) return t('aiArena.setupSmartUnavailable');
  if (!botModes.value.regular) return t('aiArena.setupRegularUnavailable');
  return '';
});
const waitHours = computed(() => {
  if (botsBusy.value || accessStatus.value !== 'ready' || !signedIn.value) return undefined;
  if (modeAvailable('smart') || modeAvailable('regular') || modeAvailable('beginner')) {
    if (!botModes.value.smart) return botWaitHours.value.smart;
    if (!botModes.value.regular) return botWaitHours.value.regular;
    return undefined;
  }
  const modes = withFriend.value ? (['smart', 'regular'] as const) : (['smart', 'regular', 'beginner'] as const);
  const waits = modes.map((mode) => botWaitHours.value[mode]).filter((hours): hours is number => hours !== undefined);
  return waits.length ? Math.min(...waits) : undefined;
});
const formatHours = (hours: number) => new Intl.NumberFormat(locale.value.replace('_', '-')).format(hours);
async function create() {
  if (!active || busy.value) return;
  if (!signedIn.value) {
    eventBus.emit(
      'openAuthModal',
      () => {
        if (active && open.value) resumeAfterAuth.value = true;
      },
      'ai_game',
    );
    return;
  }
  if (!canCreate.value) return;
  busy.value = true;
  error.value = '';
  emit('busy', true);
  try {
    const result = ownRoomID.value
      ? { roomID: ownRoomID.value }
      : await socket.timeout(30000).emitWithAck('createHumanAiRoom', {
          beginner: selectedMode.value === 'beginner',
          ...(!withFriend.value && selectedRole.value ? { role: selectedRole.value } : {}),
          withFriend: withFriend.value,
          ...(withFriend.value && humanSeats.value === 3 ? { humanSeats: humanSeats.value } : {}),
          difficulty: selectedMode.value === 'smart' ? 'smart' : 'regular',
          language: language.value,
          playerCount: playerCount.value,
        });
    if (!active) return;
    if ('error' in result) {
      error.value = t('aiArena.botPlayError');
      emit('error', error.value);
      void refresh();
    } else if (await openRoomRoute(router, result.roomID, () => active)) {
      open.value = false;
      emit('opened');
    }
  } catch {
    if (active) {
      error.value = t('aiArena.connectionError');
      emit('error', error.value);
      void refresh();
    }
  } finally {
    busy.value = false;
    if (active) emit('busy', false);
  }
}
</script>
<style scoped>
.bot-setup {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 48px);
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 16px;
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
  overflow: hidden;
}
.bot-setup-header {
  position: relative;
  flex-shrink: 0;
  padding: 20px 52px 12px;
  text-align: center;
}
.bot-setup-header h2 {
  font-size: 20px;
  font-weight: 600;
}
.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 44px;
  height: 44px;
}
.bot-setup-body {
  padding: 4px 20px 16px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.play-format {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: rgb(var(--v-theme-bg-app));
}
.play-format button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 15px;
  color: rgb(var(--v-theme-text-secondary));
}
.play-format button[aria-pressed='true'] {
  border-color: rgb(var(--v-theme-surface-border));
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
}
.friend-hint,
.premium-hint,
.mode-hint {
  font-size: 13px;
  line-height: 1.5;
  color: rgb(var(--v-theme-text-secondary));
}
.human-seats-field {
  margin-bottom: 12px;
}
.friend-hint {
  margin: -4px 0 16px;
}
.availability-notice {
  display: flex;
  gap: 10px;
  padding: 12px;
  margin-bottom: 18px;
  background: rgba(var(--v-theme-primary), 0.08);
  border-radius: 8px;
  font-size: 14px;
}
.availability-notice > .v-icon {
  flex-shrink: 0;
  color: rgb(var(--v-theme-primary));
}
.availability-notice p {
  margin: 4px 0 0;
}
fieldset {
  border: 0;
  padding: 0;
  min-width: 0;
}
.standard-modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.mode-option {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 10px;
  cursor: pointer;
}
.mode-option.selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary));
}
.mode-option.unavailable {
  background: rgb(var(--v-theme-bg-app));
  border-color: rgb(var(--v-theme-surface-border));
  box-shadow: none;
  color: rgb(var(--v-theme-text-secondary));
  cursor: not-allowed;
}
.mode-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mode-option input {
  width: 18px;
  height: 18px;
  accent-color: rgb(var(--v-theme-primary));
}
.mode-option strong {
  font-size: 15px;
  line-height: 1.3;
}
.mode-hint {
  display: block;
}
.beginner-option {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin: 12px 0 20px;
}
.beginner-option > span {
  flex: 1;
  min-width: 0;
}
.language-field {
  display: grid;
  gap: 6px;
  font-size: 14px;
}
.language-field select {
  width: 100%;
  min-height: 44px;
  padding: 8px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 6px;
  font: inherit;
  font-size: 16px;
  background: rgb(var(--v-theme-inset));
  color: inherit;
  appearance: auto;
}
.select-choice {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.choice-role-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 2px solid rgb(var(--v-theme-surface-border));
}
.choice-role-icon.good {
  border-color: rgb(var(--v-theme-info));
}
.choice-role-icon.evil {
  border-color: rgb(var(--v-theme-error));
}
.language-flag {
  display: block;
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
  flex-shrink: 0;
}
.artwork-select :deep(.v-field__input) {
  padding-block: 8px;
  min-height: 48px;
}
.artwork-select :deep(.v-select__selection) {
  margin-block: 0;
}
.artwork-option :deep(.v-list-item__prepend) {
  margin-right: 10px;
}
.role-field {
  margin-top: 16px;
}
.seat-options {
  margin-top: 16px;
}
.seat-options legend {
  font-size: 14px;
  margin-bottom: 8px;
}
.seat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.seat-row button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 64px;
  padding: 6px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 8px;
  font-size: 18px;
}
.seat-row button[aria-pressed='true'] {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}
.seat-row button:disabled {
  background: rgb(var(--v-theme-bg-app));
  color: rgb(var(--v-theme-text-secondary));
  cursor: not-allowed;
}
.premium-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgb(var(--v-theme-support-accent));
  font-size: 11px;
  font-weight: 600;
}
.premium-label .v-icon {
  font-size: 12px;
}
.premium-hint {
  margin-top: 8px;
}
.setup-footer {
  flex-shrink: 0;
  padding: 12px 20px 20px;
  border-top: 1px solid rgb(var(--v-theme-surface-border));
}
.setup-footer p {
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 10px;
  color: rgb(var(--v-theme-text-secondary));
}
.setup-footer .v-btn {
  min-height: 48px;
  text-transform: none;
  letter-spacing: 0;
}
.setup-footer .setup-error {
  margin: 10px 0 0;
  color: rgb(var(--v-theme-error));
}
.bot-setup button:focus-visible,
.bot-setup select:focus-visible,
.bot-setup input:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@media (max-width: 600px) {
  .bot-setup-dialog :deep(.v-overlay__content) {
    width: 100%;
    max-width: 100%;
    margin: 0;
    bottom: 0;
    max-height: 100dvh;
  }
  .bot-setup {
    max-height: 100dvh;
    border-radius: 16px 16px 0 0;
  }
  .bot-setup-body {
    padding-inline: 16px;
  }
  .setup-footer {
    padding: 12px 16px calc(16px + env(safe-area-inset-bottom));
  }
}
</style>
