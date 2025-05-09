<template>
  <div class="user-ratings">
    <h2 class="mb-4">{{ $t('stats.userRatingsTitle') }}</h2>

    <div class="table-container">
      <v-data-table
        :headers="headers"
        :items="userRatings"
        :loading="loading"
        class="ratings-table"
        disable-sort
        hide-default-footer
        item-value="role"
      >
        <template v-slot:item="{ item }">
          <tr class="hoverable-row" @click="toggleExpandRow(item.role)">
            <td>
              <PreviewLink :target="item.role" />
            </td>

            <td>
              <v-chip :color="getRankColor(item.rank, item.rating)" small>
                {{ item.rating === 0 ? '???' : item.rank }}
              </v-chip>
            </td>

            <td>
              {{ item.rating === 0 ? '???' : item.rating }}
            </td>

            <td>
              <WinrateDisplay :winrate="item.winrate.toFixed(2)" />
            </td>

            <td>
              {{ item.gamesCount }}
            </td>
          </tr>

          <tr v-if="expandedRole === item.role">
            <td colspan="5" class="pa-0">
              <div class="history-container expanded">
                <RatingHistory :userID="userID" :role="item.role" />
              </div>
            </td>
          </tr>
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { socket } from '@/api/socket';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import WinrateDisplay from '@/components/stats/WinrateDisplay.vue';
import RatingHistory from '@/components/stats/RatingHistory.vue';
import { TRoles, RoleRating } from '@avalon/types';

export default defineComponent({
  name: 'UserRatings',
  components: {
    PreviewLink,
    WinrateDisplay,
    RatingHistory,
  },
  props: {
    userID: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const userRatings = ref<RoleRating[]>([]);
    const loading = ref(true);
    const expandedRole = ref<TRoles | null>(null);
    const userID = ref<string>(props.userID);

    const headers = computed(() => [
      { title: t('stats.role'), value: 'role' },
      { title: t('stats.rank'), value: 'rank' },
      { title: t('stats.rating'), value: 'rating' },
      { title: t('stats.winrate'), value: 'winrate' },
      { title: t('stats.games'), value: 'gamesCount' },
    ]);

    const fetchUserRatings = (uuid: string) => {
      loading.value = true;

      socket.emit('getUserRatings', uuid, (response) => {
        if ('error' in response) {
          console.error('Error from API:', response.error);
        } else {
          userRatings.value = response;
        }

        loading.value = false;
      });
    };

    const getRankColor = (rank: number, rating: number) => {
      if (rating === 0) {
        return 'grey';
      }

      if (rank <= 3) return 'orange accent-3';
      if (rank <= 10) return 'blue';
      if (rank <= 50) return 'green';
      return 'grey';
    };

    const toggleExpandRow = (role: TRoles) => {
      if (expandedRole.value === role) {
        expandedRole.value = null;
      } else {
        expandedRole.value = role;
      }
    };

    watch(
      () => props.userID,
      (newUUID) => {
        userID.value = newUUID;
        expandedRole.value = null;
        fetchUserRatings(newUUID);
      },
    );

    fetchUserRatings(props.userID);

    return {
      userRatings,
      loading,
      headers,
      getRankColor,
      expandedRole,
      toggleExpandRow,
      userID,
    };
  },
});
</script>

<style scoped lang="scss">
.user-ratings {
  margin-top: 24px;
  margin-bottom: 24px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

.ratings-table {
  margin-top: 16px;
  width: 100%;
}

.hoverable-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.hoverable-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.hoverable-row td {
  padding: 12px 16px;
}

.history-container {
  overflow: hidden;
  max-height: 0;
  background-color: rgba(var(--v-theme-surface), 0.5);
  border-top: 1px solid rgba(var(--v-theme-primary), 0.1);
  padding: 0 16px;
}

.history-container.expanded {
  max-height: 400px;
  padding: 16px;
}
</style>
