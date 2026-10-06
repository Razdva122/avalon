<template>
  <span>{{
    time ? t(compact ? 'giveaway.timingShort' : 'giveaway.timing', { time }) : t('giveaway.timingFallback')
  }}</span>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatGiveawayTime, nextGiveawayAt } from './giveaway-time';
const props = defineProps<{ at?: string; compact?: boolean }>();
const { t, locale } = useI18n();
// Prerendered HTML must not use the build machine's time zone.
const zone = ref<string>();
onMounted(() => {
  zone.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
});
const time = computed(() =>
  zone.value ? formatGiveawayTime(props.at || nextGiveawayAt(), locale.value, zone.value) : null,
);
</script>
