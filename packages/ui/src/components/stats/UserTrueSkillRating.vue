<template>
  <div v-if="!loading && trueSkillRating" :class="{ 'plain-rating': appearance === 'plain' }">
    <span v-if="appearance === 'plain'" class="rating-value">{{ Math.round(trueSkillRating.mu) }}</span>
    <v-chip v-else color="primary" variant="tonal" size="default" class="font-weight-medium">
      {{ trueSkillRating?.mu ? Math.round(trueSkillRating?.mu) : '???' }}
    </v-chip>
    <div class="info-hint">
      {{
        /^avalon-agent-(?:[1-9]|10)$/.test(userID) && trueSkillRating.gamesCount === 0
          ? $t('userStats.initialRating')
          : 'TrueSkill'
      }}
    </div>
  </div>
  <div v-else-if="error" role="status">{{ $t('userStats.loadError') }}</div>
  <div v-else-if="loading" class="profile-rating-loading">
    <v-skeleton-loader type="text" width="60" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import { socket } from '@/api/socket';
import type { PlayerTrueSkillRating } from '@avalon/types';

export default defineComponent({
  name: 'UserTrueSkillRating',
  props: {
    appearance: {
      type: String,
      default: 'chip',
    },
    userID: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const loading = ref(true);
    const trueSkillRating = ref<PlayerTrueSkillRating | null>(null);
    const error = ref('');

    let requestId = 0;
    const fetchTrueSkillRating = async (userID: string) => {
      const currentRequest = ++requestId;
      loading.value = true;
      trueSkillRating.value = null;
      error.value = '';

      socket.emit('getTrueSkillRating', userID, (result) => {
        if (currentRequest !== requestId) return;
        loading.value = false;

        if (!result.success || result.error) {
          error.value = result.error || 'Failed to load rating';
        } else if (result.rating) {
          trueSkillRating.value = result.rating;
        }
      });
    };

    watch(
      () => props.userID,
      (newUserID) => {
        if (newUserID) {
          fetchTrueSkillRating(newUserID);
        }
      },
    );

    onMounted(() => {
      if (props.userID) {
        fetchTrueSkillRating(props.userID);
      }
    });

    return {
      loading,
      trueSkillRating,
      error,
    };
  },
});
</script>

<style scoped lang="scss">
.info-hint {
  font-size: 14px;
  opacity: 0.8;
  margin-top: -2px;
}

.profile-rating-loading {
  margin-top: 8px;
  margin-bottom: 16px;
}
.plain-rating .rating-value {
  display: block;
  font-size: 26px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
  color: rgb(var(--v-theme-primary));
}
.plain-rating .info-hint {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.45;
  opacity: 1;
  color: rgba(var(--v-theme-on-surface), 0.75);
}
@media (max-width: 600px) {
  .plain-rating .rating-value {
    font-size: 23px;
  }
}
</style>
