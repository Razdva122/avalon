<template>
  <v-btn v-if="canOpen" ref="trigger" variant="flat" color="info" data-open-lobby-ai @click="openDialog">
    <v-icon icon="smart_toy" start aria-hidden="true" />{{ $t('aiArena.lobbyPlay') }}
  </v-btn>
  <v-dialog
    v-model="open"
    class="lobby-ai-overlay"
    max-width="600"
    :persistent="busy"
    :transition="reducedMotion ? false : undefined"
    :aria-label="$t('aiArena.lobbyPlay')"
    @after-leave="trigger?.$el?.focus()"
  >
    <section class="lobby-ai-dialog">
      <header class="dialog-header">
        <div class="header-icon"><v-icon icon="smart_toy" size="24" aria-hidden="true" /></div>
        <div class="header-copy">
          <h2>{{ $t('aiArena.lobbyPlay') }}</h2>
          <p>{{ $t('aiArena.lobbyStrong') }}</p>
        </div>
        <button
          type="button"
          class="close-button"
          data-close-lobby-ai
          :aria-label="$t('infoMessage.close')"
          :disabled="busy"
          @click="open = false"
        >
          <v-icon icon="close" size="22" aria-hidden="true" />
        </button>
      </header>
      <div class="dialog-body">
        <fieldset class="size-field">
          <legend>{{ $t('aiArena.botTotalPlayers') }}</legend>
          <div class="size-options">
            <button
              v-for="size in sizes"
              :key="size.playerCount"
              type="button"
              :data-lobby-ai-size="size.playerCount"
              :aria-pressed="playerCount === size.playerCount"
              :aria-describedby="size.requiresPremium ? `premium-limit-${roomID}` : undefined"
              :disabled="busy || size.requiresPremium"
              @click="playerCount = size.playerCount"
            >
              <v-icon v-if="size.requiresPremium" class="size-state" icon="lock" size="15" aria-hidden="true" />
              <v-icon
                v-else-if="playerCount === size.playerCount"
                class="size-state"
                icon="check_circle"
                size="16"
                aria-hidden="true"
              />
              <strong>{{ size.playerCount }}</strong>
              <span>{{ $t('aiArena.lobbyBotCount', { count: size.botCount }) }}</span>
              <small v-if="size.requiresPremium">Premium</small>
            </button>
          </div>
        </fieldset>
        <p v-if="sizes.some((size) => size.requiresPremium)" :id="`premium-limit-${roomID}`" class="premium-note">
          <v-icon icon="workspace_premium" size="18" aria-hidden="true" />
          <span>{{ $t('aiArena.lobbyPremiumLimit') }}</span>
        </p>
        <section v-if="confirmedRoster" class="table-preview" :aria-label="$t('aiArena.setupTableRoles')">
          <div class="section-heading">
            <h3>{{ $t('aiArena.setupTableRoles') }}</h3>
            <span class="fixed-label"
              ><v-icon icon="lock_outline" size="14" aria-hidden="true" />{{ $t('aiArena.lobbyFixed') }}</span
            >
          </div>
          <div class="role-teams" aria-live="polite">
            <div v-for="loyalty in ['good', 'evil']" :key="loyalty" class="role-team" :class="loyalty">
              <h4>{{ $t(loyalty === 'good' ? 'aiArena.setupGood' : 'aiArena.setupEvil') }}</h4>
              <span
                v-for="role in tableRoles.filter((entry) => entry.loyalty === loyalty)"
                :key="role.name"
                class="table-role"
                :data-table-role="role.name"
                :data-role-count="role.count"
              >
                <PlayerIcon :icon="role.name" thumbnail class="role-portrait" aria-hidden="true" />
                <span>{{ $t(`roles.${role.name}`) }}</span
                ><b v-if="role.count > 1">×{{ role.count }}</b>
              </span>
            </div>
          </div>
          <div class="table-addons">
            <span>{{ $t('options.addons') }}</span>
            <span v-if="playerCount >= 7" class="addon-value"
              ><AddonIcon addon="ladyOfLake" aria-hidden="true" />{{ $t('addons.ladyOfLake') }}</span
            >
            <span v-else>{{ $t('aiArena.setupNoAddons') }}</span>
          </div>
          <p class="fixed-note">{{ $t('aiArena.lobbyFixedRules') }}</p>
        </section>
        <div class="chat-note">
          <v-icon icon="chat" size="21" aria-hidden="true" />
          <div>
            <h3>{{ $t('aiArena.lobbyChatTitle') }}</h3>
            <p>{{ $t('aiArena.lobbyTextOnly') }}</p>
          </div>
        </div>
        <div class="language-field">
          <span :id="`lobby-ai-language-${roomID}`"
            ><v-icon icon="translate" size="19" aria-hidden="true" />{{ $t('aiArena.selectLanguage') }}</span
          >
          <v-select
            v-model="language"
            :items="languageChoices"
            :disabled="busy"
            :aria-labelledby="`lobby-ai-language-${roomID}`"
            variant="outlined"
            density="compact"
            hide-details
            class="language-select"
            data-lobby-ai-language
          >
            <template #selection="{ item }">
              <span class="language-choice"
                ><img :src="item.raw.flag" alt="" width="24" height="16" class="language-flag" /><span>{{
                  item.title
                }}</span></span
              >
            </template>
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" class="language-option">
                <template #prepend
                  ><img :src="item.raw.flag" alt="" width="24" height="16" class="language-flag"
                /></template>
              </v-list-item>
            </template>
          </v-select>
        </div>
        <p class="match-note">{{ $t('aiArena.lobbyTimersRating') }}</p>
        <p v-if="!confirmedRoster" class="status-note" role="alert">{{ $t('aiArena.lobbyRosterChanged') }}</p>
        <p v-else-if="!available" class="status-note" role="status">{{ $t('aiArena.botUnavailable') }}</p>
        <p v-if="error" class="status-note" role="alert">{{ error }}</p>
      </div>
      <footer class="dialog-actions">
        <div v-if="confirmedRoster" class="launch-summary" aria-live="polite">
          <v-icon icon="groups" size="22" aria-hidden="true" />
          <span>{{
            $t('aiArena.cardHumanRoster', { humans: humanPlayerIDs.length, bots: playerCount - humanPlayerIDs.length })
          }}</span>
        </div>
        <v-btn
          color="primary"
          variant="flat"
          data-launch-lobby-ai
          :loading="busy"
          :disabled="!canLaunch"
          @click="launch"
        >
          <v-icon icon="play_arrow" size="20" start aria-hidden="true" />{{
            $t('aiArena.lobbyLaunch', { count: playerCount })
          }}
        </v-btn>
      </footer>
    </section>
  </v-dialog>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMediaQuery } from '@vueuse/core';
import { socket } from '@/api/socket';
import { aiHumanRoles } from '@avalon/types/room/ai-roles';
import { lobbyAiSizes } from '@avalon/types/room/lobby-ai';
import type { AiLanguage, AiPlayerCount } from '@avalon/types';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import AddonIcon from '@/components/view/information/AddonIcon.vue';

const props = defineProps<{ roomID: string; humanPlayerIDs: string[] }>();
const { locale, t } = useI18n();
const trigger = ref<{ $el?: HTMLElement } | null>(null);
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
const languageChoices = [
  { value: 'en', title: 'English', flag: '/flags/en.svg' },
  { value: 'ru', title: 'Русский', flag: '/flags/ru.svg' },
  { value: 'zh-tw', title: '繁體中文（台灣）', flag: '/flags/zh-tw.svg' },
  { value: 'es', title: 'Español', flag: '/flags/es.svg' },
  { value: 'vi', title: 'Tiếng Việt', flag: '/flags/vi.svg' },
];
const open = ref(false);
const busy = ref(false);
const available = ref(false);
const premium = ref(false);
const confirmedRoster = ref<string[] | null>(null);
const error = ref('');
const playerCount = ref<AiPlayerCount>(5);
const language = ref<AiLanguage>(
  ['ru', 'es', 'vi'].includes(locale.value)
    ? (locale.value as AiLanguage)
    : /^zh[-_]tw$/i.test(locale.value)
      ? 'zh-tw'
      : 'en',
);
const rosterKey = (ids: string[]) => JSON.stringify([...ids].sort());
const sizes = computed(() => lobbyAiSizes(props.humanPlayerIDs.length, premium.value));
const canOpen = computed(() => available.value && sizes.value.some((size) => !size.requiresPremium));
const canLaunch = computed(
  () =>
    !busy.value &&
    available.value &&
    confirmedRoster.value !== null &&
    rosterKey(confirmedRoster.value) === rosterKey(props.humanPlayerIDs) &&
    sizes.value.some((size) => size.playerCount === playerCount.value && !size.requiresPremium),
);
const tableRoles = computed(() =>
  aiHumanRoles(playerCount.value).map((name) => ({
    name,
    loyalty: ['merlin', 'percival', 'servant'].includes(name) ? 'good' : 'evil',
    count: name === 'servant' ? playerCount.value - (playerCount.value >= 7 ? 5 : 4) : 1,
  })),
);
let version = 0;
let interval: ReturnType<typeof setInterval> | undefined;
async function refresh() {
  const current = ++version;
  const roomID = props.roomID;
  const roster = rosterKey(props.humanPlayerIDs);
  try {
    const access = await socket.timeout(10000).emitWithAck('getLobbyAiAccess', roomID);
    if (current !== version || roomID !== props.roomID || roster !== rosterKey(props.humanPlayerIDs)) return false;
    if ('error' in access) {
      available.value = false;
      return false;
    }
    available.value = access.available;
    premium.value = access.hostPremium;
    if (rosterKey(access.humanPlayerIDs) !== roster) {
      confirmedRoster.value = null;
      return false;
    }
    return available.value;
  } catch {
    if (current === version) available.value = false;
    return false;
  }
}
function openDialog() {
  if (!canOpen.value || busy.value) return;
  error.value = '';
  confirmedRoster.value = [...props.humanPlayerIDs];
  if (!sizes.value.some((size) => size.playerCount === playerCount.value && !size.requiresPremium))
    playerCount.value = sizes.value.find((size) => !size.requiresPremium)!.playerCount;
  open.value = true;
  void refresh();
}
async function launch() {
  if (!canLaunch.value) return;
  const humanPlayerIDs = [...confirmedRoster.value!];
  const roomID = props.roomID;
  busy.value = true;
  error.value = '';
  try {
    if (
      !(await refresh()) ||
      !confirmedRoster.value ||
      roomID !== props.roomID ||
      rosterKey(humanPlayerIDs) !== rosterKey(props.humanPlayerIDs) ||
      !sizes.value.some((size) => size.playerCount === playerCount.value && !size.requiresPremium)
    )
      return;
    const result = await socket.timeout(30000).emitWithAck('startLobbyAiRoom', roomID, {
      playerCount: playerCount.value,
      language: language.value,
      humanPlayerIDs,
    });
    if (roomID !== props.roomID) return;
    if ('error' in result) error.value = t('aiArena.botPlayError');
    else open.value = false;
  } catch {
    error.value = t('aiArena.connectionError');
  } finally {
    busy.value = false;
  }
}
watch([() => props.roomID, () => rosterKey(props.humanPlayerIDs)], () => {
  version++;
  available.value = false;
  confirmedRoster.value = null;
  void refresh();
});
function disconnect() {
  version++;
  available.value = false;
}
function backgroundRefresh() {
  if (!busy.value) return refresh();
}
onMounted(() => {
  void refresh();
  socket.on('connect', backgroundRefresh);
  socket.on('disconnect', disconnect);
  interval = setInterval(backgroundRefresh, 15000);
});
onBeforeUnmount(() => {
  version++;
  clearInterval(interval);
  socket.off('connect', backgroundRefresh);
  socket.off('disconnect', disconnect);
});
</script>
<style scoped>
.lobby-ai-dialog {
  --dialog-line: rgba(var(--v-theme-on-surface), 0.12);
  --dialog-muted: rgba(var(--v-theme-on-surface), 0.74);
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: min(860px, calc(100dvh - 48px));
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface));
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--dialog-line);
  border-radius: 20px;
  box-shadow: 0 24px 80px #0003;
}
h2,
h3,
h4,
p {
  margin: 0;
}
.dialog-header {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-shrink: 0;
  padding: 24px 24px 20px;
}
.header-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 14px;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.09);
}
.header-copy {
  flex: 1;
  min-width: 0;
}
h2 {
  font-size: 24px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.header-copy p {
  margin-top: 6px;
  color: var(--dialog-muted);
  font-size: 14px;
  line-height: 1.45;
}
.close-button {
  display: grid;
  place-items: center;
  align-self: flex-start;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  margin: -6px -8px 0 0;
  border-radius: 50%;
  color: var(--dialog-muted);
}
.dialog-body {
  overflow-y: auto;
  min-height: 0;
  padding: 0 24px 24px;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
.size-field {
  border: 0;
  padding: 0;
  min-width: 0;
}
legend,
h3 {
  font-size: 14px;
  font-weight: 650;
  line-height: 1.4;
}
legend {
  margin-bottom: 10px;
}
.size-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.size-options button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 92px;
  min-width: 0;
  padding: 12px 4px 10px;
  color: inherit;
  border: 1px solid var(--dialog-line);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}
.size-options strong {
  font-size: 26px;
  font-weight: 650;
  line-height: 1;
}
.size-options button > span {
  font-size: 12px;
  line-height: 1.4;
  color: var(--dialog-muted);
  white-space: nowrap;
}
.size-options button[aria-pressed='true'] {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.07);
}
.size-options button[aria-pressed='true'] strong,
.size-state {
  color: rgb(var(--v-theme-primary));
}
.size-options button:disabled {
  background: rgb(var(--v-theme-inset-hover));
}
.size-options button:disabled strong,
.size-options button:disabled .size-state {
  color: var(--dialog-muted);
}
.size-state {
  position: absolute;
  top: 9px;
  right: 9px;
}
.size-options small {
  font-size: 10px;
  line-height: 1;
  font-weight: 600;
  color: var(--dialog-muted);
}
.premium-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 10px;
  color: var(--dialog-muted);
  font-size: 12px;
  line-height: 1.5;
}
.premium-note .v-icon {
  flex-shrink: 0;
  margin-top: 1px;
}
.table-preview {
  margin-top: 22px;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.fixed-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--dialog-muted);
  font-size: 12px;
}
.role-teams {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.role-team {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.role-team h4 {
  font-size: 12px;
  font-weight: 650;
  line-height: 1.5;
  color: rgb(var(--v-theme-primary));
}
.role-team.evil h4 {
  color: rgb(var(--v-theme-on-surface));
}
.table-role {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  font-size: 13px;
  line-height: 1.3;
}
.table-role > span:not(.role-portrait) {
  overflow-wrap: anywhere;
}
.role-portrait {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background-color: rgb(var(--v-theme-inset-hover));
  border: 2px solid transparent;
}
.role-team.good .role-portrait {
  border-color: rgb(var(--v-theme-info));
}
.role-team.evil .role-portrait {
  border-color: rgb(var(--v-theme-error));
}
.table-role b {
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: var(--dialog-muted);
}
.table-addons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--dialog-line);
  font-size: 12px;
  line-height: 1.5;
}
.table-addons > span:first-child {
  color: var(--dialog-muted);
}
.addon-value {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.addon-value :deep(.addon-image) {
  width: 24px;
  height: 24px;
}
.fixed-note {
  margin-top: 8px;
  color: var(--dialog-muted);
  font-size: 12px;
  line-height: 1.5;
}
.chat-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 20px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.07);
}
.chat-note > .v-icon {
  margin-top: 1px;
  flex-shrink: 0;
  color: rgb(var(--v-theme-primary));
}
.chat-note h3 {
  margin-bottom: 4px;
  font-size: 13px;
}
.chat-note p {
  font-size: 13px;
  line-height: 1.5;
  color: var(--dialog-muted);
}
.language-field {
  display: grid;
  grid-template-columns: 1fr minmax(140px, 46%);
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}
.language-field > span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.language-field .v-icon {
  color: var(--dialog-muted);
  flex-shrink: 0;
}
.language-select {
  min-width: 0;
  font-size: 13px;
}
.language-select :deep(.v-field) {
  border-radius: 8px;
  font-size: 13px;
}
.language-select :deep(.v-field__input) {
  min-height: 44px;
  padding-block: 8px;
}
.language-select :deep(.v-select__selection) {
  max-width: 100%;
  margin-block: 0;
}
.language-choice {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.language-choice > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.language-flag {
  display: block;
  width: 24px;
  height: 16px;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: 2px;
}
.language-option :deep(.v-list-item__prepend) {
  margin-right: 10px;
}
.match-note {
  margin-top: 14px;
  color: var(--dialog-muted);
  font-size: 12px;
  line-height: 1.5;
}
.status-note {
  margin-top: 12px;
  padding: 10px 12px;
  border-left: 3px solid rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-inset-hover));
  font-size: 13px;
  line-height: 1.5;
}
.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 16px 24px max(16px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--dialog-line);
  background: rgb(var(--v-theme-surface));
}
.launch-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--dialog-muted);
  font-size: 12px;
  line-height: 1.4;
}
.launch-summary .v-icon {
  flex-shrink: 0;
}
.dialog-actions :deep(.v-btn) {
  flex-shrink: 0;
  min-height: 46px;
  padding-inline: 18px;
  border-radius: 10px;
  text-transform: none;
  letter-spacing: 0;
  font-size: 14px;
  font-weight: 650;
}
button:focus-visible,
select:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
@media (hover: hover) {
  .close-button:hover {
    background: rgb(var(--v-theme-inset-hover));
  }
  .size-options button:not(:disabled):hover {
    border-color: rgb(var(--v-theme-primary));
  }
}
button:active:not(:disabled) {
  opacity: 0.8;
}
@media (max-width: 600px) {
  .lobby-ai-dialog {
    max-height: calc(100dvh - 24px);
    border-radius: 16px;
  }
  .dialog-header {
    gap: 10px;
    padding: 20px 18px 18px;
  }
  .header-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
  h2 {
    font-size: 21px;
    letter-spacing: -0.3px;
  }
  .header-copy p {
    font-size: 12px;
    margin-top: 4px;
  }
  .dialog-body {
    padding: 0 18px 18px;
  }
  .size-options {
    gap: 6px;
  }
  .size-options button {
    min-height: 88px;
    border-radius: 10px;
  }
  .size-options strong {
    font-size: 24px;
  }
  .size-options button > span {
    font-size: 11px;
  }
  .size-state {
    top: 7px;
    right: 6px;
  }
  .role-teams {
    gap: 16px;
  }
  .table-preview {
    margin-top: 18px;
  }
  .dialog-actions {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px 18px max(14px, env(safe-area-inset-bottom));
  }
  .launch-summary {
    justify-content: center;
    flex: 1 0 100%;
  }
  .launch-summary .v-icon {
    width: 18px;
    font-size: 18px;
  }
  .dialog-actions :deep(.v-btn) {
    width: 100%;
    min-height: 48px;
  }
}
</style>
