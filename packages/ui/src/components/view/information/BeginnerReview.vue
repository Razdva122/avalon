<template>
  <aside
    v-if="review"
    class="beginner-review"
    :class="{ 'is-expanded': expanded, 'is-hidden': view === 'hidden' }"
    :aria-label="t('beginnerReview.title')"
    :aria-busy="busy"
  >
    <button
      v-if="view === 'hidden'"
      ref="restoreButton"
      type="button"
      class="review-restore"
      @click="setView('compact')"
    >
      <span class="material-icons" aria-hidden="true">keyboard_arrow_up</span>{{ t('beginnerReview.title') }}
    </button>
    <template v-else>
      <header class="review-header">
        <div class="review-toolbar">
          <button
            ref="headingButton"
            class="review-heading"
            type="button"
            :aria-expanded="expanded"
            aria-controls="beginner-review-content"
            @click="setView(expanded ? 'compact' : 'expanded')"
          >
            <span>{{ t('beginnerReview.title') }}</span>
            <span class="material-icons" aria-hidden="true">{{
              expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_up'
            }}</span>
          </button>
          <button type="button" class="review-hide" :aria-label="t('beginnerReview.hide')" @click="setView('hidden')">
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
        </div>
        <div class="review-result">
          <h2>
            {{
              t(
                review.kind === 'unfinished'
                  ? 'beginnerReview.unfinishedTitle'
                  : `beginnerReview.${game.result?.winner}Win`,
              )
            }}
          </h2>
          <span
            class="review-role-badge"
            :aria-label="t('beginnerTips.yourRole', { role: t(`roles.${review.role}`) })"
            >{{ t(`roles.${review.role}`) }}</span
          >
        </div>
        <p v-if="!expanded && review.kind !== 'unfinished'" class="review-reason">
          {{ t(`endReason.${game.result.reason}`) }}
        </p>
      </header>
      <div v-show="expanded || chooseRole" class="review-content" tabindex="0">
        <fieldset
          v-if="chooseRole"
          id="beginner-review-role"
          ref="rolePicker"
          class="review-role"
          :disabled="busy || !!preparedRoomID"
        >
          <legend>
            {{ t('beginnerReview.nextRole') }}
            <strong aria-live="polite">{{ t(`roles.${selectedRole}`) }}</strong>
          </legend>
          <div class="review-role-options">
            <label
              v-for="role in roles"
              :key="role"
              class="review-role-option"
              :class="{ 'is-selected': selectedRole === role }"
              :title="t(`roles.${role}`)"
            >
              <input
                v-model="selectedRole"
                type="radio"
                name="beginner-role"
                :value="role"
                :aria-label="t(`roles.${role}`)"
              />
              <img :src="getAvatarPathByID('roles', role)" alt="" width="36" height="36" />
              <span v-if="selectedRole === role" class="material-icons review-role-check" aria-hidden="true"
                >check</span
              >
            </label>
          </div>
        </fieldset>
        <div v-show="expanded" id="beginner-review-content">
          <p v-if="analysis" class="review-episode">
            <span class="review-ai">AI</span>
            {{ t('beginnerReview.mission', { mission: analysis.mission }) }}
            <span aria-hidden="true">·</span>
            {{ t(`beginnerReview.actions.${analysis.action}`) }}
          </p>
          <p v-else-if="analysisLoading" class="review-loading" role="status">{{ t('beginnerReview.analyzing') }}</p>
          <section v-if="analysis" class="review-step review-decision">
            <span class="review-step-number" aria-hidden="true">1</span>
            <div>
              <h3>{{ t('beginnerReview.decision') }}</h3>
              <p>{{ analysis.decision }}</p>
            </div>
          </section>
          <details v-if="analysis" class="review-observation">
            <summary>
              <span class="review-step-number" aria-hidden="true">2</span>
              <h3>{{ t('beginnerReview.notice') }}</h3>
              <span class="material-icons" aria-hidden="true">expand_more</span>
            </summary>
            <p>{{ analysis.observation }}</p>
          </details>
          <section v-else class="review-step review-observation">
            <span class="review-step-number" aria-hidden="true">1</span>
            <div>
              <h3>{{ t('beginnerReview.notice') }}</h3>
              <p>{{ t(`beginnerReview.${review.kind}`, { mission: review.mission }) }}</p>
            </div>
          </section>
          <section v-if="analysis || review.tip" class="review-step review-tip">
            <span class="material-icons review-step-number" aria-hidden="true">arrow_forward</span>
            <div>
              <h3>{{ t('beginnerReview.next') }}</h3>
              <p>{{ analysis?.next ?? t(`beginnerReview.tip_${review.tip}`) }}</p>
            </div>
          </section>
        </div>
      </div>
      <footer class="review-footer">
        <div class="review-actions">
          <button class="review-play" type="button" :disabled="busy || !selectedRole" @click="playAgain">
            <span class="material-icons" aria-hidden="true">play_arrow</span>
            {{ busy ? t('beginnerReview.preparing') : replayLabel }}
          </button>
          <button
            type="button"
            class="review-change"
            :disabled="busy || !!preparedRoomID"
            :aria-expanded="chooseRole"
            aria-controls="beginner-review-role"
            @click="toggleRole"
          >
            {{ t('beginnerReview.changeRole') }}
          </button>
        </div>
        <p v-if="error" class="review-error" role="alert">{{ error }}</p>
      </footer>
    </template>
  </aside>
</template>
<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { AiRoomState, VisualGameState, BeginnerGameReview } from '@avalon/types';
import { aiHumanRoles, type AiHumanRole } from '@avalon/types/room/ai-roles';
import { beginnerReview } from '@/helpers/beginner-review';
import { socket } from '@/api/socket';
import { getAvatarPathByID } from '@/helpers/images';
import { openRoomRoute } from '@/helpers/open-room-route';
const props = defineProps<{ game: VisualGameState; ai: AiRoomState; userID?: string; roomID: string }>();
const { t, locale } = useI18n();
const router = useRouter();
const review = computed(() => beginnerReview(props.game, props.ai, props.userID));
const roles = aiHumanRoles(5);
const selectedRole = ref<AiHumanRole>(
  roles.includes(review.value?.role as AiHumanRole) ? (review.value!.role as AiHumanRole) : 'servant',
);
const view = ref<'hidden' | 'compact' | 'expanded'>('compact');
const expanded = computed(() => view.value === 'expanded');
const headingButton = ref<HTMLButtonElement>();
const restoreButton = ref<HTMLButtonElement>();
const replayLabel = computed(() =>
  t('beginnerReview.againRole', {
    role:
      locale.value === 'ru' ? t(`beginnerReview.replayRoles.${selectedRole.value}`) : t(`roles.${selectedRole.value}`),
  }),
);
async function setView(value: 'hidden' | 'compact' | 'expanded') {
  view.value = value;
  if (value === 'hidden') chooseRole.value = false;
  await nextTick();
  (value === 'hidden' ? restoreButton.value : headingButton.value)?.focus({ preventScroll: true });
}
let layoutQuery: MediaQueryList | undefined;
const syncLayout = () => {
  view.value = layoutQuery?.matches ? 'expanded' : 'compact';
};
onMounted(() => {
  layoutQuery = window.matchMedia('(min-width: 1280px)');
  syncLayout();
  void loadAnalysis();
  layoutQuery.addEventListener('change', syncLayout);
});
const chooseRole = ref(false);
const rolePicker = ref<HTMLFieldSetElement>();
async function toggleRole() {
  chooseRole.value = !chooseRole.value;
  if (chooseRole.value) {
    await nextTick();
    rolePicker.value?.querySelector<HTMLInputElement>('input:checked')?.focus();
  }
}
const busy = ref(false);
const error = ref('');
const preparedRoomID = ref('');
let preparedAt = 0;
let started = false;
let active = true;
const originalUserID = props.userID;
const isActive = () =>
  active && props.userID === originalUserID && router.currentRoute.value.params.uuid === props.roomID;
onBeforeUnmount(() => {
  active = false;
  layoutQuery?.removeEventListener('change', syncLayout);
});
const analysis = ref<BeginnerGameReview>();
const analysisLoading = ref(false);
async function loadAnalysis() {
  if (!isActive() || !review.value || review.value.kind === 'unfinished' || analysisLoading.value || analysis.value)
    return;
  analysisLoading.value = true;
  try {
    const result = await socket.timeout(100000).emitWithAck('getBeginnerReview', props.roomID);
    if (isActive() && result.status === 'complete') analysis.value = result.review;
  } catch {
    /* Keep the factual lesson available when optional analysis fails. */
  } finally {
    analysisLoading.value = false;
  }
}
async function playAgain() {
  if (!isActive() || busy.value || !review.value || !roles.includes(selectedRole.value)) return;
  busy.value = true;
  error.value = '';
  const language = props.ai.language ?? 'en';
  try {
    if (preparedRoomID.value && !started && Date.now() - preparedAt >= 60000) preparedRoomID.value = '';
    if (!preparedRoomID.value) {
      const access = await socket.timeout(30000).emitWithAck('getAiRoomAccess');
      if (!isActive()) return;
      // A previous request may have succeeded even if its acknowledgement was lost.
      if (access.ownRoomID) {
        if (!(await openRoomRoute(router, access.ownRoomID, isActive))) error.value = t('aiArena.connectionError');
        return;
      }
      if (!access.canPlay || !access.botModes?.beginner) {
        error.value = t(access.botsBusy ? 'aiArena.setupBusy' : 'aiArena.setupAllUnavailable');
        return;
      }
      const result = await socket.timeout(30000).emitWithAck('createHumanAiRoom', {
        beginner: true,
        role: selectedRole.value,
        difficulty: 'regular',
        language,
        playerCount: 5,
      });
      if (!isActive()) return;
      if ('error' in result) {
        error.value = t('aiArena.botPlayError');
        return;
      }
      preparedRoomID.value = result.roomID;
      preparedAt = Date.now();
    }
    if (!started) {
      const result = await socket.timeout(30000).emitWithAck('startHumanAiRoom', preparedRoomID.value, {
        difficulty: 'regular',
        language,
        playerCount: 5,
      });
      if (!isActive()) return;
      if ('error' in result) {
        error.value = t('aiArena.botPlayError');
        return;
      }
      started = true;
    }
    if (!(await openRoomRoute(router, preparedRoomID.value, isActive))) error.value = t('aiArena.connectionError');
  } catch {
    if (!isActive()) return;
    error.value = t('aiArena.connectionError');
    // Recover an uncertain start through the room's existing ready/running UI.
    if (preparedRoomID.value) await openRoomRoute(router, preparedRoomID.value, isActive).catch(() => false);
  } finally {
    busy.value = false;
  }
}
</script>
<style scoped>
.beginner-review {
  position: fixed;
  z-index: 15;
  left: 12px;
  right: 12px;
  bottom: max(72px, calc(env(safe-area-inset-bottom) + 64px));
  max-width: 480px;
  margin-inline: auto;
  max-height: min(52dvh, 460px);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.12);
  border-radius: 18px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-text-primary));
  box-shadow:
    0 8px 32px #00000012,
    0 2px 6px #00000008;
  font-size: 14px;
  line-height: 1.5;
  overflow: hidden;
}
button {
  font: inherit;
  color: inherit;
}
button {
  min-height: 44px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.55;
  cursor: default;
}
button:focus-visible,
.review-content:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -3px;
}
.review-header,
.review-footer {
  flex-shrink: 0;
  padding: 0 18px;
}
.review-header {
  padding-top: 4px;
}
.review-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: rgba(var(--v-theme-text-primary), 0.65);
}
.review-heading .material-icons {
  font-size: 20px;
}
.review-result {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 6px;
}
h2 {
  font-size: 21px;
  line-height: 1.25;
  font-weight: 650;
  letter-spacing: -0.4px;
  text-wrap: balance;
}
.review-role-badge {
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  background: rgba(var(--v-theme-primary), 0.06);
  border-radius: 6px;
  padding: 2px 7px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  overflow-wrap: anywhere;
}
h3 {
  font-size: 12px;
  font-weight: 650;
  margin: 0 0 6px;
}
p {
  margin: 0;
  overflow-wrap: anywhere;
}
.review-reason {
  font-size: 13px;
  color: rgba(var(--v-theme-text-primary), 0.72);
  margin-bottom: 10px;
}
.review-loading {
  color: rgba(var(--v-theme-text-primary), 0.65);
  font-size: 12px;
  margin-bottom: 8px;
}
.review-content {
  overflow-y: auto;
  overscroll-behavior: contain;
  min-height: 0;
  padding: 10px 18px 14px;
  scrollbar-width: thin;
}
.beginner-review.is-expanded {
  max-height: min(62dvh, 700px);
}
.review-episode {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 12px;
  color: rgba(var(--v-theme-text-primary), 0.72);
}
.review-ai {
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 5px;
  padding: 1px 5px;
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
  font-size: 11px;
}
.review-step {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 10px;
  padding: 14px 0;
}
.review-step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: rgba(var(--v-theme-text-primary), 0.07);
  font-size: 12px;
  font-weight: 700;
}
.review-decision {
  padding-top: 0;
}
.review-decision p {
  font-weight: 600;
}
.review-observation {
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.1);
}
.review-observation summary {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  cursor: pointer;
  list-style: none;
}
.review-observation summary::-webkit-details-marker {
  display: none;
}
.review-observation summary h3 {
  flex: 1;
  margin: 0;
  font-size: 13px;
}
.review-observation summary .material-icons {
  color: rgba(var(--v-theme-text-primary), 0.6);
  font-size: 20px;
}
.review-observation[open] summary .material-icons {
  transform: rotate(180deg);
}
.review-observation > p {
  padding: 0 0 14px 34px;
}
.review-observation summary:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
.review-step h3 {
  font-size: 13px;
  color: rgba(var(--v-theme-text-primary), 0.72);
}
.review-tip {
  padding: 14px 12px;
  background: rgba(var(--v-theme-primary), 0.06);
  border-radius: 10px;
}
.review-tip .review-step-number {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  font-size: 16px;
}
.review-tip h3 {
  color: rgb(var(--v-theme-primary));
}
.review-footer {
  padding-top: 12px;
  padding-bottom: 14px;
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.09);
}
.review-actions {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.review-play {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 9px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
  padding: 8px 12px;
}
.review-play .material-icons {
  flex-shrink: 0;
  font-size: 20px;
}
.review-play:hover:not(:disabled) {
  filter: brightness(0.94);
}
.review-play:active:not(:disabled) {
  filter: brightness(0.88);
}
.review-change {
  padding: 8px 10px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.12);
  border-radius: 9px;
  font-size: 12px;
  line-height: 1.3;
}
.review-change:hover:not(:disabled) {
  background: rgba(var(--v-theme-primary), 0.06);
}
.review-role {
  min-width: 0;
  border: 0;
  padding: 0;
  margin: 0 0 16px;
}
.review-role legend {
  padding: 0;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
}
.review-role legend strong {
  display: inline-block;
  margin-left: 6px;
  color: rgb(var(--v-theme-primary));
}
.review-role-options {
  display: grid;
  grid-template-columns: repeat(5, minmax(44px, 1fr));
  gap: 6px;
}
.review-role-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 48px;
  padding: 5px 3px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.16);
  border-radius: 10px;
  text-align: center;
  font-size: 12px;
  line-height: 1.3;
  overflow-wrap: anywhere;
  cursor: pointer;
}
.review-role-option img {
  border-radius: 50%;
  object-fit: cover;
}
.review-role-option input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: inherit;
}
.review-role-option:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}
.review-role-option.is-selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary));
  font-weight: 600;
}
.review-role-option:has(input:focus-visible) {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.review-role-check {
  position: absolute;
  top: 2px;
  right: 2px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
  font-size: 14px;
  pointer-events: none;
}
.review-role:disabled {
  opacity: 0.55;
}
.review-role:disabled .review-role-option {
  cursor: default;
}
.review-error {
  margin-top: 10px;
  font-size: 13px;
  color: rgb(var(--v-theme-error));
}
.review-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}
.review-heading {
  flex: 1;
}
.review-hide {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  border-radius: 8px;
}
.review-hide:hover,
.review-restore:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}
.review-hide .material-icons {
  font-size: 18px;
}
.review-restore {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
}
.beginner-review.is-hidden {
  width: max-content;
  max-width: calc(100vw - 24px);
  border-radius: 24px;
}
@media (min-width: 650px) and (max-width: 1279px) and (max-height: 600px) {
  .beginner-review,
  .beginner-review.is-expanded {
    top: 64px;
    bottom: 72px;
    left: auto;
    right: 12px;
    width: 300px;
    max-height: none;
  }
  .review-heading {
    min-height: 36px;
  }
  .review-reason {
    display: none;
  }
}
.beginner-review.is-hidden {
  top: auto;
  bottom: max(72px, calc(env(safe-area-inset-bottom) + 64px));
}
@media (min-width: 1280px) {
  .beginner-review,
  .beginner-review.is-expanded {
    top: 154px;
    bottom: auto;
    right: auto;
    left: 16px;
    width: 320px;
    max-height: calc(100dvh - 238px);
  }
  .beginner-review.is-hidden {
    top: auto;
    bottom: max(72px, calc(env(safe-area-inset-bottom) + 64px));
    width: max-content;
  }
  .review-result {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 8px;
    padding-bottom: 10px;
  }
}
</style>
