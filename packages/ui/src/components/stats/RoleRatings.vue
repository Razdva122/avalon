<template>
  <div class="role-ratings">
    <h2 class="mb-4">{{ $t('stats.roleRatingsTitle', { role: formatRoleName(selectedRole) }) }}</h2>

    <v-select
      v-model="selectedRole"
      :items="availableRoles"
      item-title="label"
      item-value="value"
      :label="$t('stats.selectRole')"
      outlined
      dense
      class="mb-4"
    ></v-select>

    <div class="table-container">
      <v-data-table
        :headers="headers"
        :items="leaderboard"
        :loading="loading"
        class="leaderboard-table"
        disable-sort
        hide-default-footer
        item-value="userID"
      >
        <template v-slot:item="{ item }">
          <tr class="hoverable-row" @click="navigateToPlayerStats(item)">
            <td class="text-center" style="width: 50px">
              <div class="rank-cell">{{ item.rank }}</div>
            </td>

            <td>
              <TeammateProfile :teammateID="item.userID" />
            </td>

            <td class="text-center" style="width: 100px">
              {{ item.gamesCount }}
            </td>

            <td class="text-center" style="width: 150px">
              <WinrateDisplay :winrate="item.winrate.toFixed(2)" />
            </td>

            <td class="text-center" style="width: 100px">
              <div class="rating-cell">{{ item.rating }}</div>
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
import { useRouter } from 'vue-router';
import { socket } from '@/api/socket';
import TeammateProfile from '@/components/stats/TeammateProfile.vue';
import WinrateDisplay from '@/components/stats/WinrateDisplay.vue';
import { TRoles, goodRolesImportance, evilRolesImportance } from '@avalon/types';

export default defineComponent({
  name: 'RoleRatings',
  components: {
    TeammateProfile,
    WinrateDisplay,
  },
  setup() {
    const router = useRouter();
    const { t } = useI18n();

    interface LeaderboardItem {
      rank: number;
      userID: string;
      winrate: number;
      gamesCount: number;
      rating: number;
    }

    const leaderboard = ref<LeaderboardItem[]>([]);
    const loading = ref(true);
    const selectedRole = ref<TRoles>('merlin');

    const availableRoles = computed(() => {
      const goodRoles = Object.keys(goodRolesImportance).map((role) => ({
        label: t(`roles.${role}`),
        value: role,
      }));

      const evilRoles = Object.keys(evilRolesImportance).map((role) => ({
        label: t(`roles.${role}`),
        value: role,
      }));

      return [...goodRoles, ...evilRoles];
    });

    const headers = computed(() => [
      { title: t('stats.rank'), value: 'rank' },
      { title: t('stats.player'), value: 'userID' },
      { title: t('stats.games'), value: 'gamesCount' },
      { title: t('stats.winrate'), value: 'winrate' },
      { title: t('stats.rating'), value: 'rating' },
    ]);

    const fetchLeaderboard = (role: TRoles) => {
      loading.value = true;

      socket.emit('getRoleLeaderboard', role, (response) => {
        if ('error' in response) {
          console.error('Error from API:', response.error);
        } else {
          leaderboard.value = response as LeaderboardItem[];
        }

        loading.value = false;
      });
    };

    const formatRoleName = (role: TRoles) => {
      const roleItem = availableRoles.value.find((r) => r.value === role);
      return roleItem ? roleItem.label : role;
    };

    watch(selectedRole, (newRole) => {
      fetchLeaderboard(newRole);
    });

    // Initial fetch
    fetchLeaderboard(selectedRole.value);

    const navigateToPlayerStats = (item: LeaderboardItem) => {
      router.push({ name: 'user_stats', params: { uuid: item.userID } });
    };

    return {
      leaderboard,
      loading,
      selectedRole,
      availableRoles,
      headers,
      formatRoleName,
      navigateToPlayerStats,
    };
  },
});
</script>

<style scoped lang="scss">
.role-ratings {
  margin-top: 24px;
  margin-bottom: 24px;
}

.hoverable-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.hoverable-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.rank-cell {
  font-weight: bold;
  text-align: center;
}

.rating-cell {
  font-weight: bold;
  color: var(--v-primary-base);
}

.leaderboard-table {
  margin-top: 16px;
}
</style>
