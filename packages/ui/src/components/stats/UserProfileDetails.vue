<template>
  <dl v-if="userState?.status === 'ready'" class="profile-details">
    <div v-if="userState.profile.aiGamesCount !== undefined">
      <dt>{{ $t('userStats.aiGames') }}</dt>
      <dd>{{ userState.profile.aiGamesCount }}</dd>
    </div>
    <div v-if="registrationDate">
      <dt>{{ $t('userStats.registrationDate') }}</dt>
      <dd>
        <time :datetime="userState.profile.registrationDate">{{ registrationDate }}</time>
      </dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserProfile } from '@/helpers/composables/useUserProfile';

const props = defineProps<{ uuid: string }>();
const { userState } = useUserProfile(toRef(props, 'uuid'));
const { locale } = useI18n();
const registrationDate = computed(() => {
  const value = userState.value?.status === 'ready' ? userState.value.profile.registrationDate : undefined;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(locale.value) : '';
});
</script>

<style scoped lang="scss">
.profile-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin-top: 12px;
  font-size: 14px;
}
dt {
  opacity: 0.8;
}
dd {
  margin: 0;
  font-weight: 500;
}
</style>
