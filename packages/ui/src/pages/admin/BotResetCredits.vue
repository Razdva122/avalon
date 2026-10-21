<template>
  <section class="reset-credits" :aria-labelledby="`reset-title-${bot.id}`">
    <h3 :id="`reset-title-${bot.id}`">{{ $t('aiArena.resetTitle') }}</h3>
    <p v-if="!credits" class="muted">{{ $t('aiArena.resetUnavailable') }}</p>
    <template v-else>
      <p>{{ $t('aiArena.resetCount', { count: credits.availableCount }) }}</p>
      <ul v-if="credits.credits?.length" class="muted">
        <li v-for="credit in credits.credits" :key="credit.id">
          {{
            credit.expiresAt === null
              ? $t('aiArena.resetExpiryUnknown')
              : $t('aiArena.resetExpires', { date: formatExpiry(credit.expiresAt) })
          }}
        </li>
      </ul>
      <p v-else-if="credits.availableCount" class="muted">{{ $t('aiArena.resetExpiryUnknown') }}</p>
    </template>
    <v-dialog v-model="open" :persistent="pending" max-width="480" :aria-labelledby="`reset-confirm-${bot.id}`">
      <template #activator="{ props: activatorProps }">
        <v-btn
          v-bind="activatorProps"
          color="primary"
          variant="outlined"
          :disabled="disabled || (!retry && !canReset)"
          :loading="pending"
          :aria-label="$t(retry ? 'aiArena.resetRetryAccount' : 'aiArena.resetAccount', { account: bot.id })"
          >{{ $t(retry ? 'aiArena.resetRetry' : 'aiArena.resetUse') }}</v-btn
        >
      </template>
      <v-card>
        <v-card-title :id="`reset-confirm-${bot.id}`" class="confirm-title">{{
          $t('aiArena.resetConfirmTitle')
        }}</v-card-title>
        <v-card-text>
          <p>{{ $t(retry ? 'aiArena.resetConfirmRetry' : 'aiArena.resetConfirm', { account: bot.id }) }}</p>
        </v-card-text>
        <v-card-actions class="confirm-actions">
          <v-btn color="primary" variant="text" :disabled="pending" @click="open = false">{{
            $t('aiArena.resetCancel')
          }}</v-btn>
          <v-btn color="primary" :loading="pending" :disabled="disabled || (!retry && !canReset)" @click="confirm">
            {{ $t(retry ? 'aiArena.resetRetry' : 'aiArena.resetUse') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <p v-if="feedback" class="reset-feedback" :role="feedback === 'error' ? 'alert' : 'status'">
      {{ $t(`aiArena.resetResult${feedback}`) }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AiBotInstanceStatus } from '@avalon/types';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  bot: AiBotInstanceStatus;
  pending: boolean;
  disabled: boolean;
  retry: boolean;
  feedback?: string;
}>();
const emit = defineEmits<{ consume: [] }>();
const { locale } = useI18n({ useScope: 'global' });
const open = ref(false);
const credits = computed(() => props.bot.quota?.resetCredits);
const canReset = computed(
  () =>
    !!credits.value &&
    credits.value.availableCount > 0 &&
    (credits.value.credits === null ||
      credits.value.credits.some((credit) => credit.expiresAt === null || credit.expiresAt * 1000 > Date.now())),
);
const formatExpiry = (timestamp: number) =>
  new Date(timestamp * 1000).toLocaleString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
function confirm() {
  if (props.disabled || props.pending || (!props.retry && !canReset.value)) return;
  open.value = false;
  emit('consume');
}
</script>

<style scoped lang="scss">
.reset-credits {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  font-size: 13px;
  line-height: 1.6;
}
h3 {
  font-size: 14px;
  margin-bottom: 4px;
}
ul {
  padding-inline-start: 20px;
}
.muted {
  color: rgba(var(--v-theme-on-surface), 0.72);
}
.reset-credits :deep(.v-btn) {
  min-height: 44px;
  margin-top: 10px;
}
.reset-feedback {
  margin-top: 8px;
}
.confirm-title {
  white-space: normal;
  overflow-wrap: anywhere;
}
.confirm-actions {
  flex-wrap: wrap;
}
.confirm-actions :deep(.v-btn) {
  min-height: 44px;
}
</style>
