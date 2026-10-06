<template>
  <section class="member-picker" :aria-label="t('giveaway.members')">
    <h4>{{ t('giveaway.members') }}</h4>
    <p id="member-help" class="hint">{{ t('giveaway.membersHint') }}</p>
    <ul v-if="modelValue?.length" class="selected-members">
      <li v-for="id in modelValue" :key="id">
        <LocaleLink v-if="known[id]" :to="{ name: 'user_stats', params: { uuid: id } }">{{
          known[id].name
        }}</LocaleLink>
        <span v-else>{{ t('giveaway.missingMember') }} ({{ id }})</span>
        <button
          type="button"
          :aria-label="`${t('giveaway.removeMember')}: ${known[id]?.name || id}`"
          @click="remove(id)"
        >
          {{ t('giveaway.removeMember') }}
        </button>
      </li>
    </ul>
    <label for="member-query">{{ t('giveaway.memberSearch') }}</label>
    <input
      id="member-query"
      v-model="query"
      maxlength="80"
      autocomplete="off"
      aria-describedby="member-help member-status"
      :disabled="full"
    />
    <p id="member-status" role="status" aria-live="polite" class="hint">
      {{
        t(
          `giveaway.${full ? 'membersFull' : status === 'loading' ? 'memberLoading' : status === 'error' ? 'memberError' : status === 'ready' && !available.length ? 'memberEmpty' : 'memberSearchHint'}`,
        )
      }}
    </p>
    <ul v-if="!full && available.length" class="member-results" :aria-label="t('giveaway.memberResults')">
      <li v-for="member in available" :key="member.userID">
        <LocaleLink :to="{ name: 'user_stats', params: { uuid: member.userID } }">{{ member.name }}</LocaleLink>
        <button type="button" :disabled="full" @click="add(member)">{{ t('giveaway.addMember') }}</button>
      </li>
    </ul>
  </section>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BoardMember } from '@avalon/types/player-board';
import { boardRequest } from '@/api/player-boards';
import LocaleLink from '@/components/feedback/LocaleLink.vue';
const props = defineProps<{ modelValue?: string[]; members?: BoardMember[]; limit: number }>();
const emit = defineEmits<{ (event: 'update:modelValue', ids: string[]): void }>();
const { t } = useI18n();
const known = reactive<Record<string, BoardMember>>(
  Object.fromEntries((props.members ?? []).map((member) => [member.userID, member])),
);
const query = ref('');
const results = ref<BoardMember[]>([]);
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
const full = computed(() => (props.modelValue?.length || 0) >= Math.max(0, props.limit));
const available = computed(() => results.value.filter((member) => !props.modelValue?.includes(member.userID)));
let timer: ReturnType<typeof setTimeout> | undefined;
let revision = 0;
watch(
  [query, full],
  () => {
    const request = ++revision;
    clearTimeout(timer);
    results.value = [];
    status.value = 'idle';
    const value = query.value.trim();
    if (full.value || value.length < 2 || /[\p{Cc}\p{Cf}]/u.test(value)) return;
    status.value = 'loading';
    timer = setTimeout(async () => {
      try {
        const response = await boardRequest<{ members: BoardMember[] }>(`/members?query=${encodeURIComponent(value)}`);
        if (request !== revision) return;
        results.value = response.members;
        status.value = 'ready';
      } catch {
        if (request === revision) status.value = 'error';
      }
    }, 300);
  },
  { flush: 'sync' },
);
onBeforeUnmount(() => {
  ++revision;
  clearTimeout(timer);
});
function add(member: BoardMember) {
  if (full.value || props.modelValue?.includes(member.userID)) return;
  known[member.userID] = member;
  emit('update:modelValue', [...(props.modelValue ?? []), member.userID]);
}
function remove(id: string) {
  emit(
    'update:modelValue',
    (props.modelValue ?? []).filter((value) => value !== id),
  );
}
</script>
<style scoped lang="scss">
.member-picker {
  padding: 16px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 10px;
}
h4 {
  font-size: 16px;
}
.hint {
  font-size: 13px;
  line-height: 1.6;
  margin: 8px 0;
}
label {
  display: block;
  margin-top: 12px;
  font-size: 14px;
}
input {
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  margin-top: 6px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.35);
  border-radius: 6px;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-text-primary));
}
ul {
  list-style: none;
  padding: 0;
  margin: 12px 0;
}
li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  overflow-wrap: anywhere;
}
a {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}
button {
  flex-shrink: 0;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 6px;
}
:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
</style>
