<template>
  <details class="moderation" @toggle="onToggle">
    <summary>{{ t('playerBoards.showModeration') }}</summary>
    <p v-if="loading" role="status">{{ t('playerBoards.loading') }}</p>
    <p v-if="error" role="alert">
      {{ t(`playerBoards.${error}`) }} <button @click="load">{{ t('playerBoards.retry') }}</button>
    </p>
    <template v-if="!loading">
      <p v-if="!reports.length && !error">{{ t('playerBoards.noReports') }}</p>
      <article v-for="report in reports" :key="report.id" class="report">
        <BoardCard :listing="report.listing" :now="Date.now()" />
        <p>
          {{ t('playerBoards.reportCount', { count: report.count }) }} ·
          {{ report.reasons.map((reason) => t(`playerBoards.${reason}`)).join(', ') }}
        </p>
        <div class="actions">
          <button :disabled="busy" @click="act(`/${report.id}/hide`)">{{ t('playerBoards.hideListing') }}</button>
          <button :disabled="busy" @click="act(`/users/${report.listing.userID}/ban`, { banned: !report.banned })">
            {{ t(`playerBoards.${report.banned ? 'unban' : 'ban'}`) }}
          </button>
          <button :disabled="busy" @click="act(`/${report.id}/dismiss`)">{{ t('playerBoards.dismiss') }}</button>
        </div>
      </article>
      <div v-for="user in bannedUsers" :key="user.userID" class="banned-user">
        <span>{{ user.name }}</span
        ><button :disabled="busy" @click="act(`/users/${user.userID}/ban`, { banned: false })">
          {{ t('playerBoards.unban') }}
        </button>
      </div>
    </template>
  </details>
</template>
<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BoardReport } from '@avalon/types/player-board';
import { boardRequest } from '@/api/player-boards';
import BoardCard from './BoardCard.vue';
import { boardClientError } from './board-helpers';
const emit = defineEmits<{ (e: 'changed'): void }>();
const { t } = useI18n();
const reports = ref<BoardReport[]>([]);
const bannedUsers = ref<{ userID: string; name: string }[]>([]);
const loading = ref(false);
const busy = ref(false);
const error = ref('');
let generation = 0;
onBeforeUnmount(() => generation++);
async function load() {
  const current = ++generation;
  loading.value = true;
  error.value = '';
  try {
    const [result, bans] = await Promise.all([
      boardRequest<{ reports: BoardReport[] }>('/moderation'),
      boardRequest<{ users: { userID: string; name: string }[] }>('/moderation/bans'),
    ]);
    if (current !== generation) return;
    reports.value = result.reports;
    bannedUsers.value = bans.users;
  } catch (e) {
    if (current === generation) error.value = boardClientError(e);
  } finally {
    if (current === generation) loading.value = false;
  }
}
function onToggle(event: Event) {
  if ((event.target as HTMLDetailsElement).open) void load();
}
async function act(path: string, body?: unknown) {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await boardRequest(`/moderation${path}`, 'POST', body);
    await load();
    emit('changed');
  } catch (e) {
    error.value = boardClientError(e);
  } finally {
    busy.value = false;
  }
}
</script>
<style scoped>
.moderation {
  margin-top: 28px;
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.2);
  padding-top: 18px;
}
summary {
  cursor: pointer;
  min-height: 44px;
}
.report {
  margin: 12px 0 24px;
}
.actions,
.banned-user {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
}
button {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.3);
  border-radius: 6px;
}
button:disabled {
  opacity: 0.5;
}
:focus-visible {
  outline: 2px solid rgb(var(--v-theme-support-accent));
  outline-offset: 3px;
}
</style>
