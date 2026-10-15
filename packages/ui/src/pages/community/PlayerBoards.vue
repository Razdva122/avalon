<template>
  <section id="player-boards" class="player-boards" aria-labelledby="board-title">
    <h2 id="board-title" class="sr-only">{{ t(`playerBoards.${kind === 'group' ? 'teams' : 'players'}`) }}</h2>
    <aside v-if="showInvitation" class="board-invitation" aria-labelledby="invitation-title">
      <div class="invitation-copy">
        <p class="invitation-context">{{ t(`playerBoards.${kind === 'group' ? 'noTeamsYet' : 'noPlayersYet'}`) }}</p>
        <h3 id="invitation-title">{{ t('playerBoards.invitationTitle') }}</h3>
        <p class="invitation-description">{{ t('playerBoards.invitationBody') }}</p>
        <div class="invitation-actions">
          <LocaleLink
            v-if="kind === 'group'"
            class="primary invitation-action"
            :to="{ name: 'community_solo', query: { publish: '1' } }"
          >
            <v-icon icon="person_add" size="20" aria-hidden="true" />{{ t('playerBoards.invitationAction') }}
          </LocaleLink>
          <button v-else type="button" class="primary invitation-action" :disabled="busy" @click="startPublish">
            <v-icon icon="person_add" size="20" aria-hidden="true" />{{ t('playerBoards.invitationAction') }}
          </button>
          <LocaleLink class="invitation-community" :to="{ name: 'community' }">{{
            t('playerBoards.communitiesAction')
          }}</LocaleLink>
        </div>
        <p class="invitation-note">{{ t('playerBoards.invitationNote') }}</p>
      </div>
      <div class="party-table" aria-hidden="true">
        <div class="party-table-top"><v-icon icon="groups" size="40" /></div>
        <div v-for="seat in 5" :key="seat" class="party-seat" :class="`party-seat--${seat}`">
          <v-icon v-if="seat !== 1" icon="person" size="22" />
        </div>
      </div>
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
      <div class="quick-filters">
        <label
          >{{ t('playerBoards.communication') }}
          <select v-model="communication">
            <option value="">{{ t('playerBoards.anyCommunication') }}</option>
            <option value="voice">{{ t('playerBoards.voice') }}</option>
            <option value="text">{{ t('playerBoards.text') }}</option>
          </select>
        </label>
        <label v-if="kind === 'group'" class="check-filter">
          <input v-model="beginnerFriendly" type="checkbox" />{{ t('playerBoards.beginnerFriendly') }}
        </label>
        <button v-if="hasFilters" type="button" class="reset-filters" @click="resetFilters">
          {{ t('playerBoards.resetFilters') }}
        </button>
      </div>
      <button
        v-if="kind === 'group' && account?.canRecruit && !account.banned && !own && !editing"
        type="button"
        :disabled="busy"
        @click="startPublish"
      >
        {{ t('playerBoards.publishTeam') }}
      </button>
    </div>
    <aside v-if="showCompactInvitation" class="board-profile-prompt" aria-labelledby="profile-prompt-title">
      <div class="profile-prompt-copy">
        <h3 id="profile-prompt-title">
          {{
            t(
              playerListing
                ? 'playerBoards.myPlayerProfile'
                : kind === 'group'
                  ? 'playerBoards.compactInvitationTitle'
                  : 'playerBoards.invitationTitle',
            )
          }}
        </h3>
        <p>{{ t(playerListing ? 'playerBoards.managePlayerProfile' : 'playerBoards.compactInvitationBody') }}</p>
      </div>
      <LocaleLink v-if="kind === 'group'" class="primary invitation-action" :to="playerProfileTarget">
        <v-icon :icon="playerListing ? 'person' : 'person_add'" size="20" aria-hidden="true" />
        {{ t(playerListing ? 'playerBoards.myProfileAction' : 'playerBoards.invitationAction') }}
      </LocaleLink>
      <button v-else type="button" class="primary invitation-action" :disabled="busy" @click="startPublish">
        <v-icon icon="person_add" size="20" aria-hidden="true" />{{ t('playerBoards.invitationAction') }}
      </button>
    </aside>
    <details class="board-how">
      <summary>{{ t('playerBoards.howItWorks') }}</summary>
      <p>{{ t('playerBoards.intro') }}</p>
      <p>{{ t('playerBoards.rules') }}</p>
      <p v-if="profile && kind === 'group' && account && !account.canRecruit && !account.banned">
        {{ t('playerBoards.eligibility') }}
      </p>
    </details>
    <p v-if="account?.banned" class="notice">{{ t('playerBoards.banned') }}</p>
    <p v-if="accountLoading" role="status">{{ t('playerBoards.loading') }}</p>
    <p v-if="accountError" role="alert">
      {{ t(`playerBoards.${accountError}`) }} <button @click="loadAccount">{{ t('playerBoards.retry') }}</button>
    </p>
    <p v-if="error" ref="mutationNotice" tabindex="-1" role="alert" class="notice error">
      {{ t(`playerBoards.${error}`) }}
    </p>
    <p v-if="success" role="status" class="notice">{{ t(`playerBoards.${success}`) }}</p>
    <div v-if="editing" ref="formElement" tabindex="-1" class="board-editor">
      <BoardForm
        v-if="editing && profile && account && !account.banned"
        :key="draftStorageKey"
        :draft-key="draftStorageKey"
        :kind="kind"
        :initial="own"
        :busy="busy"
        @save="save"
        @cancel="editing = false"
      />
    </div>
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
      <div v-if="!visibleListings.length && !showInvitation && !editing" class="empty">
        <p>
          {{
            t(
              hasFilters
                ? 'playerBoards.noFilterMatches'
                : own || playerListing
                  ? 'playerBoards.noMatches'
                  : 'playerBoards.empty',
            )
          }}
        </p>
        <button v-if="hasFilters" type="button" @click="resetFilters">{{ t('playerBoards.resetFilters') }}</button>
      </div>
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
    <aside class="giveaway-note">
      <strong>{{ t('giveaway.title') }}</strong>
      <span><GiveawayTime /></span>
      <LocaleLink :to="{ name: 'support', hash: '#giveaway' }">{{ t('giveaway.rulesTitle') }} →</LocaleLink>
    </aside>
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
import GiveawayTime from '../support/GiveawayTime.vue';
import { computed, defineAsyncComponent, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from '@/store';
import { useRoute, useRouter } from 'vue-router';
import { clearBoardDraft } from './board-form-session';
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
import LocaleLink from '@/components/feedback/LocaleLink.vue';

const BoardForm = defineAsyncComponent(() => import(/* webpackChunkName: 'board-form' */ './BoardForm.vue'));
const BoardModeration = defineAsyncComponent(
  () => import(/* webpackChunkName: 'board-moderation' */ './BoardModeration.vue'),
);
const { t } = useI18n();
const store = useStore();
const profile = computed(() => store.state.profile);
const props = defineProps<{ kind?: BoardKind }>();
const kind = computed(() => props.kind ?? 'solo');
const route = useRoute();
const router = useRouter();
function updateQuery(changes: Record<string, string | undefined>) {
  const query = { ...route.query, ...changes };
  for (const key of Object.keys(query)) if (query[key] === undefined || query[key] === '') delete query[key];
  void router.push({ query });
}
const language = computed({
  get: () => (BOARD_LANGUAGES.some((item) => item.value === route.query.language) ? String(route.query.language) : ''),
  set: (value: string) => updateQuery({ language: value || undefined, page: undefined }),
});
const communication = computed({
  get: () =>
    route.query.communication === 'voice' || route.query.communication === 'text' ? route.query.communication : '',
  set: (value: string) => updateQuery({ communication: value || undefined, page: undefined }),
});
const beginnerFriendly = computed({
  get: () => kind.value === 'group' && route.query.beginnerFriendly === '1',
  set: (value: boolean) => updateQuery({ beginnerFriendly: value ? '1' : undefined, page: undefined }),
});
const page = computed({
  get: () =>
    typeof route.query.page === 'string' && /^[1-9]\d{0,4}$/.test(route.query.page) ? Number(route.query.page) : 1,
  set: (value: number) => updateQuery({ page: value > 1 ? String(value) : undefined }),
});
const hasFilters = computed(() => Boolean(language.value || communication.value || beginnerFriendly.value));
const resetFilters = () =>
  updateQuery({ language: undefined, communication: undefined, beginnerFriendly: undefined, page: undefined });
const hasMore = ref(false);
const listings = ref<BoardListing[]>([]);
const account = ref<BoardOwnerState | null>(null);
const playerListing = computed(() => account.value?.listings.find((item) => item.kind === 'solo'));
const playerProfileTarget = computed(() =>
  playerListing.value ? { name: 'community_solo' } : { name: 'community_solo', query: { publish: '1' } },
);
const own = computed(() => account.value?.listings.find((item) => item.kind === kind.value));
const draftStorageKey = computed(() => `${profile.value?.id}:${kind.value}:${own.value?.id || 'new'}`);
const now = ref(Date.now());
const visibleListings = computed(() =>
  listings.value.filter((item) => item.id !== own.value?.id && listingState(item, now.value) === 'active'),
);
const editing = ref(false);
const publishAfterLogin = ref(false);
const formElement = ref<HTMLElement | null>(null);
const ownListingElement = ref<HTMLElement | null>(null);
const mutationNotice = ref<HTMLElement | null>(null);
async function reveal(element: typeof ownListingElement) {
  await nextTick();
  element.value?.focus({ preventScroll: true });
  element.value?.scrollIntoView({ block: 'start' });
}
const loading = ref(true);
const accountLoading = ref(false);
const busy = ref(false);
const error = ref('');
const loadError = ref('');
const accountError = ref('');
const success = ref('');
const showInvitation = computed(
  () =>
    !loading.value &&
    !loadError.value &&
    !accountLoading.value &&
    !accountError.value &&
    !visibleListings.value.length &&
    !hasFilters.value &&
    page.value === 1 &&
    !own.value &&
    !playerListing.value &&
    !editing.value &&
    !account.value?.banned,
);
const showCompactInvitation = computed(
  () =>
    !loading.value &&
    !accountLoading.value &&
    !accountError.value &&
    !showInvitation.value &&
    !editing.value &&
    (kind.value === 'group' || !own.value) &&
    (!profile.value || (account.value && (!account.value.banned || Boolean(playerListing.value)))),
);
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
function startPublish() {
  if (!profile.value) {
    eventBus.emit(
      'openAuthModal',
      () => {
        if (!mounted) return;
        if (account.value) startPublish();
        else {
          publishAfterLogin.value = true;
          if (!accountLoading.value) void loadAccount();
        }
      },
      'publish_listing',
    );
    return;
  }
  if (!account.value || account.value.banned || (kind.value === 'group' && !account.value.canRecruit)) return;
  editing.value = true;
  void reveal(formElement);
}
async function consumePublishIntent() {
  if (!mounted || kind.value !== 'solo' || route.query.publish !== '1') return;
  if (profile.value && !account.value) return;
  const query = { ...route.query };
  delete query.publish;
  await router.replace({ query });
  if (mounted) startPublish();
}
async function loadPublic() {
  if (!mounted) return;
  const generation = ++publicGeneration;
  loading.value = true;
  loadError.value = '';
  try {
    const result = await boardRequest<BoardPage>(
      publicQuery(kind.value, language.value, page.value, communication.value, beginnerFriendly.value),
    );
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
    if (generation === accountGeneration) {
      account.value = result;
      if (publishAfterLogin.value) {
        publishAfterLogin.value = false;
        startPublish();
      }
      consumePublishIntent();
    }
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
  const savedDraftKey = draftStorageKey.value;
  busy.value = true;
  error.value = '';
  success.value = '';
  try {
    await boardRequest(path, method, body);
    if (token !== profile.value?.token) return;
    if (method === 'PUT') clearBoardDraft(savedDraftKey);
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
  publishAfterLogin.value = false;
});
watch([kind, language, communication, beginnerFriendly, page], () => {
  error.value = '';
  success.value = '';
  void loadPublic();
});
watch(
  () => profile.value?.token,
  (_token, previousToken) => {
    if (previousToken) publishAfterLogin.value = false;
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
watch(() => route.query.publish, consumePublishIntent);
onMounted(() => {
  if (prerender) return;
  mounted = true;
  consumePublishIntent();
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
.board-profile-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px 24px;
  margin: 20px 0 12px;
  padding: 16px 20px;
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  border-left: 3px solid rgb(var(--v-theme-primary));
  border-radius: 8px;
  background: rgb(var(--v-theme-inset));
  .invitation-action {
    flex: 0 0 auto;
  }
}
.profile-prompt-copy {
  min-width: 0;
  h3 {
    font-size: 16px;
    line-height: 1.4;
  }
  p {
    margin-top: 4px;
    font-size: 14px;
    line-height: 1.5;
    color: rgb(var(--v-theme-text-secondary));
  }
}
@media (max-width: 600px) {
  .board-profile-prompt {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 16px;
    .invitation-action {
      width: 100%;
    }
  }
  .profile-prompt-copy p {
    display: none;
  }
}
.board-invitation {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px;
  align-items: center;
  gap: 32px;
  margin-bottom: 28px;
  padding: 32px;
  border: 1px solid rgba(var(--v-theme-primary), 0.45);
  border-radius: 16px;
  background: rgb(var(--v-theme-inset));
}
.invitation-context {
  margin-bottom: 8px;
  font-size: 14px;
  color: rgb(var(--v-theme-text-secondary));
}
.invitation-copy h3 {
  font-size: clamp(26px, 3vw, 32px);
  line-height: 1.2;
  letter-spacing: -0.025em;
  text-wrap: balance;
}
.invitation-description {
  max-width: 54ch;
  margin-top: 12px;
  font-size: 16px;
  line-height: 1.6;
}
.invitation-actions {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
}
.invitation-action {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  text-decoration: none;
}
.invitation-community {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: rgb(var(--v-theme-primary));
  font-size: 14px;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.invitation-note {
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: rgb(var(--v-theme-text-secondary));
}
.party-table {
  position: relative;
  width: 200px;
  height: 190px;
}
.party-table-top {
  position: absolute;
  top: 42px;
  left: 48px;
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.07);
  color: rgb(var(--v-theme-primary));
}
.party-seat {
  position: absolute;
  display: grid;
  place-items: center;
  width: 40px;
  height: 48px;
  border: 1px dashed rgba(var(--v-theme-primary), 0.45);
  border-radius: 10px;
  color: rgba(var(--v-theme-primary), 0.65);
}
.party-seat--1 {
  top: -8px;
  left: 80px;
  border-style: solid;
  background-image: getAvatarPathByID('roles', 'merlin');
  background-size: cover;
  background-position: center 20%;
}
.party-seat--2 {
  top: 48px;
  right: 0;
}
.party-seat--3 {
  top: 140px;
  right: 28px;
}
.party-seat--4 {
  top: 140px;
  left: 28px;
}
.party-seat--5 {
  top: 48px;
  left: 0;
}
@media (max-width: 700px) {
  .board-invitation {
    grid-template-columns: minmax(0, 1fr);
    padding: 20px 16px;
  }
  .party-table {
    display: none;
  }
}
@media (max-width: 480px) {
  .invitation-actions {
    margin-top: 16px;
    gap: 4px;
  }
  .invitation-action,
  .invitation-community {
    width: 100%;
    justify-content: center;
  }
}
.giveaway-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  margin: 16px 0;
  padding: 14px 16px;
  border-left: 3px solid rgb(var(--v-theme-support-accent));
  background: rgba(var(--v-theme-support-accent), 0.06);
  font-size: 14px;
  line-height: 1.6;
}
.giveaway-note strong {
  font-size: 14px;
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
.quick-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 12px 16px;
}
.check-filter {
  flex-direction: row;
  align-items: center;
  min-height: 44px;
  input {
    width: 18px;
    height: 18px;
    accent-color: rgb(var(--v-theme-primary));
  }
}
.board-how {
  font-size: 13px;
  line-height: 1.6;
  summary {
    cursor: pointer;
    width: fit-content;
    padding: 12px 0;
    min-height: 44px;
  }
  p {
    margin: 8px 0;
  }
}
.board-editor {
  scroll-margin-top: 80px;
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
