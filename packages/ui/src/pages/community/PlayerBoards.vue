<template>
  <section id="player-boards" class="player-boards" aria-labelledby="board-title">
    <header class="board-heading">
      <div>
        <h2 id="board-title">{{ t(`playerBoards.${kind}`) }}</h2>
        <p>{{ t('playerBoards.intro') }}</p>
      </div>
    </header>
    <p class="rules">{{ t('playerBoards.rules') }}</p>
    <aside class="giveaway-note">
      <strong>{{ t('giveaway.title') }}</strong>
      <p>{{ t('giveaway.boardNotice') }}</p>
      <LocaleLink :to="{ name: 'support', hash: '#giveaway' }">{{ t('giveaway.rulesTitle') }} →</LocaleLink>
    </aside>
    <div class="toolbar">
      <fieldset class="language-filter">
        <legend>{{ t('playerBoards.languages') }}</legend>
        <select v-model="language" class="mobile-language-select" :aria-label="t('playerBoards.languages')">
          <option value="">{{ t('playerBoards.allLanguages') }}</option>
          <option v-for="item in BOARD_LANGUAGES" :key="item.value" :value="item.value">
            {{ languageFlags[item.value] }} {{ t(`playerBoards.language_${item.value}`) }}
          </option>
        </select>
        <div class="language-options">
          <button type="button" :aria-pressed="language === ''" @click="language = ''">
            {{ t('playerBoards.allLanguages') }}
          </button>
          <button
            v-for="item in BOARD_LANGUAGES"
            :key="item.value"
            type="button"
            :aria-pressed="language === item.value"
            @click="language = item.value"
          >
            <span
              ><span aria-hidden="true">{{ languageFlags[item.value] }}</span>
              {{ t(`playerBoards.language_${item.value}`) }}</span
            >
            <small v-if="item.title && t(`playerBoards.language_${item.value}`) !== item.title">{{ item.title }}</small>
          </button>
        </div>
      </fieldset>
      <button v-if="!profile" type="button" class="primary" @click="login">{{ t('playerBoards.login') }}</button>
      <button
        v-else-if="account && !own && !account.banned"
        type="button"
        class="primary"
        :disabled="busy || (kind === 'group' && !account.canRecruit)"
        @click="editing = true"
      >
        {{ t('playerBoards.publish') }}
      </button>
    </div>
    <p v-if="account?.banned" class="notice">{{ t('playerBoards.banned') }}</p>
    <p v-else-if="profile && kind === 'group' && account && !account.canRecruit" class="notice">
      {{ t('playerBoards.eligibility') }}
    </p>
    <p v-if="accountLoading" role="status">{{ t('playerBoards.loading') }}</p>
    <p v-if="accountError" role="alert">
      {{ t(`playerBoards.${accountError}`) }} <button @click="loadAccount">{{ t('playerBoards.retry') }}</button>
    </p>
    <p v-if="error" ref="mutationNotice" tabindex="-1" role="alert" class="notice error">
      {{ t(`playerBoards.${error}`) }}
    </p>
    <p v-if="success" role="status" class="notice">{{ t(`playerBoards.${success}`) }}</p>
    <BoardForm
      v-if="editing && profile && account && !account.banned"
      :key="`${kind}:${own?.id || 'new'}`"
      :kind="kind"
      :initial="own"
      :busy="busy"
      @save="save"
      @cancel="editing = false"
    />
    <div v-if="own && !editing" ref="ownListingElement" tabindex="-1" class="own-listing">
      <BoardCard
        :listing="own"
        owner
        :banned="account?.banned"
        :busy="busy"
        :now="now"
        @edit="editing = true"
        @action="act"
      />
    </div>
    <p v-if="loading" class="empty" role="status">{{ t('playerBoards.loading') }}</p>
    <div v-else-if="loadError" class="empty" role="alert">
      {{ t(`playerBoards.${loadError}`) }} <button @click="loadPublic">{{ t('playerBoards.retry') }}</button>
    </div>
    <template v-else>
      <p v-if="!visibleListings.length" class="empty">{{ t(own ? 'playerBoards.noMatches' : 'playerBoards.empty') }}</p>
      <BoardCard
        v-for="listing in visibleListings"
        :key="listing.id"
        :listing="listing"
        :busy="busy"
        :now="now"
        :can-report="Boolean(profile) && listing.userID !== profile?.id"
        @report="reportTarget = listing.id"
      />
      <div v-if="page > 1 || hasMore" class="pagination">
        <button :disabled="page <= 1" @click="page--">{{ t('playerBoards.previous') }}</button><span>{{ page }}</span
        ><button :disabled="!hasMore" @click="page++">{{ t('playerBoards.next') }}</button>
      </div>
    </template>
    <v-dialog
      :model-value="Boolean(reportTarget)"
      max-width="460"
      :persistent="busy"
      aria-labelledby="report-dialog-title"
      @update:model-value="
        (value) => {
          if (!value && !busy) reportTarget = '';
        }
      "
    >
      <v-card class="report-dialog">
        <form @submit.prevent="sendReport">
          <div class="report-heading">
            <span class="report-symbol"><ReportIcon /></span>
            <h2 id="report-dialog-title">{{ t('playerBoards.report') }}</h2>
          </div>
          <p class="report-context">{{ reportListingName }}</p>
          <fieldset class="report-reasons" :disabled="busy">
            <legend>{{ t('playerBoards.reportReason') }}</legend>
            <label v-for="reason in BOARD_REPORT_REASONS" :key="reason" :class="{ selected: reportReason === reason }">
              <input v-model="reportReason" type="radio" name="board-report-reason" :value="reason" />
              <span>{{ t(`playerBoards.${reason}`) }}</span>
            </label>
          </fieldset>
          <p v-if="reportError" role="alert" class="report-error">{{ t(`playerBoards.${reportError}`) }}</p>
          <div class="report-actions">
            <button type="button" :disabled="busy" @click="reportTarget = ''">{{ t('playerBoards.cancel') }}</button>
            <button type="submit" class="primary" :disabled="busy">
              {{ t(`playerBoards.${busy ? 'loading' : 'sendReport'}`) }}
            </button>
          </div>
        </form>
      </v-card>
    </v-dialog>
    <BoardModeration v-if="account?.isAdmin" :key="profile?.id" @changed="refresh" />
  </section>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from '@/store';
import { BOARD_LANGUAGES, BOARD_REPORT_REASONS } from '@avalon/types/player-board';
import type {
  BoardKind,
  BoardListing,
  BoardDraft,
  BoardAction,
  BoardPage,
  BoardOwnerState,
  BoardReportReason,
} from '@avalon/types/player-board';
import { boardRequest } from '@/api/player-boards';
import { listingState, publicQuery, boardClientError } from './board-helpers';
import { prerender } from '@/helpers/prerender';
import eventBus from '@/helpers/event-bus';
import { languageFlags } from './board-display';
import ReportIcon from './ReportIcon.vue';
import BoardCard from './BoardCard.vue';
import BoardForm from './BoardForm.vue';
import BoardModeration from './BoardModeration.vue';
import LocaleLink from '@/components/feedback/LocaleLink.vue';
const { t } = useI18n();
const store = useStore();
const profile = computed(() => store.state.profile);
const props = defineProps<{ kind?: BoardKind }>();
const kind = computed(() => props.kind ?? 'solo');
const language = ref('');
const page = ref(1);
const hasMore = ref(false);
const listings = ref<BoardListing[]>([]);
const account = ref<BoardOwnerState | null>(null);
const own = computed(() => account.value?.listings.find((item) => item.kind === kind.value));
const now = ref(Date.now());
const visibleListings = computed(() =>
  listings.value.filter((item) => item.id !== own.value?.id && listingState(item, now.value) === 'active'),
);
const editing = ref(false);
const ownListingElement = ref<HTMLElement | null>(null);
const mutationNotice = ref<HTMLElement | null>(null);
async function reveal(element: typeof ownListingElement) {
  await nextTick();
  element.value?.focus({ preventScroll: true });
  element.value?.scrollIntoView({ block: 'start' });
}
const loading = ref(!prerender);
const accountLoading = ref(false);
const busy = ref(false);
const error = ref('');
const loadError = ref('');
const accountError = ref('');
const success = ref('');
const reportTarget = ref('');
const reportListingName = computed(() => {
  const listing = listings.value.find((item) => item.id === reportTarget.value);
  return listing?.kind === 'group' ? listing.groupName : listing?.name;
});
const reportReason = ref<BoardReportReason>('spam');
const reportError = ref('');
let publicGeneration = 0;
let accountGeneration = 0;
let mounted = false;
let timer: ReturnType<typeof setInterval> | undefined;
const login = () => eventBus.emit('openAuthModal');
async function loadPublic() {
  if (!mounted) return;
  const generation = ++publicGeneration;
  loading.value = true;
  loadError.value = '';
  try {
    const result = await boardRequest<BoardPage>(publicQuery(kind.value, language.value, page.value));
    if (generation !== publicGeneration) return;
    listings.value = result.listings;
    hasMore.value = result.hasMore;
  } catch (e) {
    if (generation === publicGeneration) loadError.value = boardClientError(e);
  } finally {
    if (generation === publicGeneration) loading.value = false;
  }
}
async function loadAccount() {
  const generation = ++accountGeneration;
  accountError.value = '';
  if (!profile.value || !mounted) {
    account.value = null;
    accountLoading.value = false;
    return;
  }
  accountLoading.value = true;
  try {
    const result = await boardRequest<BoardOwnerState>('/me');
    if (generation === accountGeneration) account.value = result;
  } catch (e) {
    if (generation === accountGeneration) accountError.value = boardClientError(e);
  } finally {
    if (generation === accountGeneration) accountLoading.value = false;
  }
}
async function refresh() {
  await Promise.all([loadPublic(), loadAccount()]);
}
async function mutate(path: string, method: string, body: unknown, message: string) {
  if (busy.value) return;
  const token = profile.value?.token;
  busy.value = true;
  error.value = '';
  success.value = '';
  try {
    await boardRequest(path, method, body);
    if (token !== profile.value?.token) return;
    editing.value = false;
    success.value = message;
    await refresh();
    await reveal(ownListingElement);
  } catch (e) {
    if (token === profile.value?.token) {
      error.value = boardClientError(e);
      await reveal(mutationNotice);
    }
  } finally {
    busy.value = false;
  }
}
const save = (draft: BoardDraft) => mutate(`/me/${kind.value}`, 'PUT', draft, 'saved');
const act = (action: BoardAction) =>
  mutate(
    `/me/${kind.value}/${action}`,
    'POST',
    undefined,
    { bump: 'bumpedSuccess', hide: 'hiddenSuccess', reactivate: 'reactivatedSuccess' }[action],
  );
async function sendReport() {
  if (busy.value || !reportTarget.value) return;
  busy.value = true;
  reportError.value = '';
  const token = profile.value?.token;
  try {
    await boardRequest(`/${reportTarget.value}/report`, 'POST', { reason: reportReason.value });
    if (token !== profile.value?.token) return;
    reportTarget.value = '';
    success.value = 'reportSent';
  } catch (e) {
    if (token === profile.value?.token) reportError.value = boardClientError(e);
  } finally {
    busy.value = false;
  }
}
watch(kind, () => {
  editing.value = false;
});
watch([kind, language], () => {
  error.value = '';
  success.value = '';
  if (page.value !== 1) page.value = 1;
  else void loadPublic();
});
watch(page, () => void loadPublic());
watch(
  () => profile.value?.token,
  () => {
    editing.value = false;
    account.value = null;
    reportTarget.value = '';
    error.value = '';
    success.value = '';
    void loadAccount();
  },
);
watch(reportTarget, () => {
  reportError.value = '';
  reportReason.value = 'spam';
});
onMounted(() => {
  if (prerender) return;
  mounted = true;
  void refresh();
  timer = setInterval(() => {
    now.value = Date.now();
  }, 30000);
});
onBeforeUnmount(() => {
  mounted = false;
  publicGeneration++;
  accountGeneration++;
  clearInterval(timer);
});
</script>
<style scoped lang="scss">
.giveaway-note {
  margin: 16px 0;
  padding: 14px 16px;
  border-left: 3px solid rgb(var(--v-theme-support-accent));
  background: rgba(var(--v-theme-support-accent), 0.06);
  font-size: 14px;
  line-height: 1.6;
}
.giveaway-note p {
  margin: 6px 0;
}
.giveaway-note a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}
.player-boards {
  margin: 0 0 56px;
  scroll-margin-top: 80px;
}
.board-heading h2 {
  font-size: clamp(24px, 4vw, 32px);
  line-height: 1.2;
  margin-bottom: 12px;
}
.board-heading p {
  max-width: 680px;
  line-height: 1.65;
}
.rules {
  font-size: 13px;
  line-height: 1.6;
  margin: 12px 0 24px;
}

button {
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.25);
  border-radius: 8px;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
button:hover:not(:disabled) {
  border-color: rgb(var(--v-theme-support-accent));
}
.primary {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  flex-wrap: wrap;
  margin: 20px 0;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}
select {
  padding: 10px 12px;
  min-height: 44px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.3);
  border-radius: 6px;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-text-primary));
}
.notice {
  scroll-margin-top: 80px;
  margin: 16px 0;
  line-height: 1.6;
}
.error {
  color: rgb(var(--v-theme-error));
}
.own-listing {
  scroll-margin-top: 80px;
  margin: 24px 0;
}
.empty {
  padding: 32px 0;
  line-height: 1.7;
}
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 24px;
}
:focus-visible {
  outline: 2px solid rgb(var(--v-theme-support-accent));
  outline-offset: 3px;
}
@media (max-width: 480px) {
  .toolbar {
    align-items: stretch;
    > * {
      width: 100%;
    }
  }
}
.language-filter {
  border: 0;
  min-width: 0;
  width: 100%;
}
.language-filter legend {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}
.language-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.language-options button {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
}
.language-options small {
  font-size: 12px;
  color: rgb(var(--v-theme-text-secondary));
}
.language-options button[aria-pressed='true'] {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary));
}
.mobile-language-select {
  display: none;
}
@media (max-width: 600px) {
  .language-options {
    display: none;
  }
  .mobile-language-select {
    display: block;
    width: 100%;
    min-height: 48px;
    padding-right: 32px;
    appearance: auto;
    font-size: 16px;
    background: rgb(var(--v-theme-surface));
  }
}
.report-dialog {
  padding: 28px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 20px !important;
  background: rgb(var(--v-theme-surface));
}
.report-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}
.report-heading h2 {
  font-size: 23px;
  line-height: 1.3;
  font-weight: 650;
}
.report-symbol {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgb(var(--v-theme-inset-hover));
}
.report-context {
  margin: 12px 0 24px;
  color: rgb(var(--v-theme-text-secondary));
  overflow-wrap: anywhere;
}
.report-reasons {
  border: 0;
  padding: 0;
  min-width: 0;
}
.report-reasons legend {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  color: rgb(var(--v-theme-text-secondary));
}
.report-reasons label {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 14px;
  margin-bottom: 8px;
  min-height: 52px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
}
.report-reasons label.selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.07);
}
.report-reasons input {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  accent-color: rgb(var(--v-theme-primary));
}
.report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}
.report-actions button {
  border-radius: 10px;
}
.report-error {
  margin-top: 12px;
  color: rgb(var(--v-theme-error));
  font-size: 14px;
}
@media (max-width: 480px) {
  .report-dialog {
    padding: 20px;
  }
  .report-actions {
    flex-direction: column-reverse;
  }
  .report-actions button {
    width: 100%;
  }
}
</style>
