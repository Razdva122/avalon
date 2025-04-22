<template>
  <div v-if="!loading && trueSkillRating">
    <v-chip color="primary" variant="tonal" size="default" class="font-weight-medium">
      {{ trueSkillRating?.mu ? Math.round(trueSkillRating?.mu) : '???' }}
    </v-chip>
    <div class="info-hint">TrueSkill</div>
  </div>
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
    userID: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const loading = ref(true);
    const trueSkillRating = ref<PlayerTrueSkillRating | null>(null);
    const error = ref('');

    const fetchTrueSkillRating = async (userID: string) => {
      loading.value = true;

      socket.emit('getTrueSkillRating', userID, (result) => {
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
</style>
