<template>
  <div class="role-ratings">
    <h2 class="mb-4">{{ $t('stats.roleRatingsTitle', { role: formatRoleName(selectedRole) }) }}</h2>

    <v-select
      v-model="selectedRole"
      :items="availableRoles"
      item-title="label"
      item-value="value"
      :label="$t('stats.selectRole')"
      variant="outlined"
      density="comfortable"
      hide-details
      class="role-select mb-4"
    ></v-select>

    <div class="table-container">
      <v-data-table
        :headers="headers"
        :items="leaderboard"
        :loading="loading"
        class="leaderboard-table"
        disable-sort
        :mobile="false"
        :hide-default-header="isMobile"
        hide-default-footer
        item-value="userID"
      >
        <template v-slot:item="{ item }">
          <tr class="hoverable-row leaderboard-row" @click="navigateToPlayerStats(item)">
            <td class="leaderboard-rank">
              <div class="rank-cell">{{ item.rank }}</div>
            </td>

            <td class="leaderboard-player">
              <router-link :to="{ name: 'user_stats', params: { uuid: item.userID } }" @click.stop>
                <TeammateProfile :teammateID="item.userID" />
              </router-link>
            </td>

            <td class="leaderboard-rating">
              <span v-if="isMobile" class="mobile-metric-label">{{ $t('stats.rating') }}</span>
              <div class="rating-cell">{{ item.rating }}</div>
            </td>

            <td class="leaderboard-winrate">
              <span v-if="isMobile" class="mobile-metric-label">{{ $t('stats.winrate') }}</span>
              <div class="winrate-cell">
                <WinrateDisplay :winrate="item.winrate.toFixed(2)" />
              </div>
            </td>

            <td v-if="!isMobile" class="text-center">
              <div class="games-count-cell">
                {{ item.gamesCount }}
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
import { useRouter } from 'vue-router';
import { socket } from '@/api/socket';
import TeammateProfile from '@/components/stats/TeammateProfile.vue';
import WinrateDisplay from '@/components/stats/WinrateDisplay.vue';
import type { TRoles, RoleRating } from '@avalon/types';
import { goodRolesImportance, evilRolesImportance } from '@avalon/types/consts';
import { useResponsive } from '@/helpers/composables';

export default defineComponent({
  name: 'RoleRatings',
  components: {
    TeammateProfile,
    WinrateDisplay,
  },
  setup() {
    const router = useRouter();
    const { t } = useI18n();
    const { isMobile } = useResponsive(960);

    const leaderboard = ref<RoleRating[]>([]);
    const loading = ref(true);
    const selectedRole = ref<TRoles>('merlin');
    const rolesWithRatings = ref<TRoles[]>([]);

    const availableRoles = computed(() => {
      return rolesWithRatings.value.map((role) => ({
        label: t(`roles.${role}`),
        value: role,
      }));
    });

    const headers = computed(() => {
      const rankHeader = {
        title: '#',
        value: 'rank',
        width: '40px',
      };

      const userIDHeader = {
        title: t('stats.player'),
        value: 'userID',
      };

      const ratingHeader = {
        title: t('stats.rating'),
        value: 'rating',
        width: '150px',
      };

      const winrateHeader = {
        title: t('stats.winrate'),
        value: 'winrate',
        width: '100px',
      };

      const gamesCountHeader = {
        title: t('stats.games'),
        value: 'gamesCount',
        width: '100px',
      };

      const baseHeaders = [rankHeader, userIDHeader, ratingHeader, winrateHeader];

      // Add gamesCount column only on desktop
      if (!isMobile.value) {
        baseHeaders.push(gamesCountHeader);
      }

      return baseHeaders;
    });

    const fetchLeaderboard = (role: TRoles) => {
      loading.value = true;

      socket.emit('getRoleLeaderboard', role, (response) => {
        if ('error' in response) {
          console.error('Error from API:', response.error);
        } else {
          leaderboard.value = response.filter((el) => el.rating > 0);
        }

        loading.value = false;
      });
    };

    const formatRoleName = (role: TRoles) => {
      const roleItem = availableRoles.value.find((r) => r.value === role);
      return roleItem ? roleItem.label : role;
    };

    const sortRolesByImportance = (roles: TRoles[]): TRoles[] => {
      // Separate good and evil roles
      const goodRoles = roles.filter((role) => role in goodRolesImportance);
      const evilRoles = roles.filter((role) => role in evilRolesImportance);

      // Sort good roles by importance (lower number = higher importance)
      const sortedGoodRoles = goodRoles.sort((a, b) => {
        return (
          goodRolesImportance[a as keyof typeof goodRolesImportance] -
          goodRolesImportance[b as keyof typeof goodRolesImportance]
        );
      });

      // Sort evil roles by importance (lower number = higher importance)
      const sortedEvilRoles = evilRoles.sort((a, b) => {
        return (
          evilRolesImportance[a as keyof typeof evilRolesImportance] -
          evilRolesImportance[b as keyof typeof evilRolesImportance]
        );
      });

      // Return good roles first, then evil roles
      return [...sortedGoodRoles, ...sortedEvilRoles];
    };

    const fetchRolesWithRatings = () => {
      socket.emit('getRolesWithRatings', (response) => {
        if ('error' in response) {
          console.error('Error from API:', response.error);
        } else {
          // Sort roles by importance
          rolesWithRatings.value = sortRolesByImportance(response);

          // If no roles are available or the selected role is not in the list, select the first available role
          if (rolesWithRatings.value.length > 0 && !rolesWithRatings.value.includes(selectedRole.value)) {
            selectedRole.value = rolesWithRatings.value[0];
          }
        }
      });
    };

    watch(selectedRole, (newRole) => {
      fetchLeaderboard(newRole);
    });

    // Initial fetch
    fetchRolesWithRatings();
    fetchLeaderboard(selectedRole.value);

    const navigateToPlayerStats = (item: RoleRating) => {
      router.push({ name: 'user_stats', params: { uuid: item.userID } });
    };

    return {
      leaderboard,
      loading,
      selectedRole,
      availableRoles,
      rolesWithRatings,
      headers,
      formatRoleName,
      navigateToPlayerStats,
      isMobile,
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
  color: rgb(var(--v-theme-primary));
}

.leaderboard-table {
  margin-top: 16px;
}

.table-container {
  overflow-x: auto;
}

.rating-cell {
  font-weight: bold;
  text-align: center;
}

.winrate-cell {
  text-align: center;
}

.games-count-cell {
  white-space: nowrap;
  text-align: center;
}
</style>
