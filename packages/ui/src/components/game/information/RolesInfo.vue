<template>
  <v-btn class="roles" color="info" @click="overlay = !overlay"> Roles </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="roles-info d-flex flex-column align-center pa-4 rounded-lg">
      <div class="d-flex flex-row align-center">
        <h2 class="title">{{ selectedRole ? selectedRole : 'Roles' }}</h2>
        <v-switch
          v-if="!selectedRole && visibleRoles"
          v-model="mode"
          hide-details
          true-value="real"
          false-value="visible"
          class="ml-4"
          :label="`${mode == 'real' ? 'Roles in game' : 'Roles visible to you'}`"
        ></v-switch>
      </div>
      <v-divider :thickness="3" class="mt-1 mb-1 w-100"></v-divider>
      <template v-if="selectedRole">
        <Role class="big-role mt-4 mb-4" :class="'role-loyalty-' + roleInfo.loyalty" :role="selectedRole" />
        <div class="role-info">{{ roleInfo.info }}</div>
        <div v-if="roleInfo.loyalty" :class="'icon-loyalty-' + roleInfo.loyalty"></div>
      </template>
      <template v-else-if="mode == 'real'">
        <div class="loyalty-container">
          <div v-for="role in gameRolesArray.good">
            <div class="role-name">{{ role }}</div>
            <Role @click="selectRole(role)" class="role-loyalty-good role" :role="role" />
          </div>
          <v-divider :thickness="2" class="mt-4 mb-4"></v-divider>
        </div>
        <div class="loyalty-container">
          <div v-for="role in gameRolesArray.evil">
            <div class="role-name">{{ role }}</div>
            <Role @click="selectRole(role)" class="role-loyalty-evil role" :role="role" />
          </div>
        </div>
      </template>
      <v-btn
        size="x-large"
        v-if="selectedRole"
        @click="selectedRole = undefined"
        class="back"
        icon="arrow_back"
        variant="text"
        density="compact"
      />
    </div>
  </v-overlay>
</template>

<script lang="ts">
import type { IGameSettingsWithRoles, TVisibleRole } from '@avalon/types';
import { defineComponent, PropType } from 'vue';
import Role from '@/components/game/information/Role.vue';
import { rolesShortInfo } from '@/components/game/information/const';

export default defineComponent({
  components: {
    Role,
  },
  props: {
    gameRoles: {
      required: true,
      type: Object as PropType<IGameSettingsWithRoles['roles']>,
    },
    visibleRoles: {
      type: Array as PropType<TVisibleRole[]>,
    },
  },
  data: () => ({
    overlay: false,
    mode: 'real',
    selectedRole: undefined as TVisibleRole | undefined,
  }),
  computed: {
    gameRolesArray() {
      function accumulateRoles(acc: TVisibleRole[], [role, amount]: [TVisibleRole, number]) {
        for (let i = 0; i < amount; i += 1) {
          acc.push(role);
        }

        return acc;
      }

      const roles = {
        evil: (<[TVisibleRole, number][]>Object.entries(this.gameRoles.evil))
          .reduce<TVisibleRole[]>(accumulateRoles, [])
          .reverse(),
        good: (<[TVisibleRole, number][]>Object.entries(this.gameRoles.good))
          .reduce<TVisibleRole[]>(accumulateRoles, [])
          .reverse(),
      };

      return roles;
    },
    roleInfo() {
      return rolesShortInfo[this.selectedRole!];
    },
  },
  methods: {
    selectRole(role: TVisibleRole) {
      this.selectedRole = role;
    },
  },
});
</script>

<style scoped lang="scss">
.roles {
  position: fixed;
  left: -28px;
  top: 47%;
  transform: rotate(90deg);
}

.roles-info {
  background-color: white;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.title {
  text-align: center;
  text-transform: capitalize;
}

.role {
  width: 100px;
  height: 100px;
}

.big-role {
  width: 250px;
  height: 250px;
}

.role-info {
  font-size: 24px;
  text-align: center;
}

.role-loyalty-good {
  border: 5px solid rgb(var(--v-theme-info));
}

.role-loyalty-evil {
  border: 5px solid rgb(var(--v-theme-error));
}

.icon-loyalty-good,
.icon-loyalty-evil {
  position: absolute;
  right: 100px;
  top: 250px;
  width: 75px;
  height: 75px;
  border-radius: 50%;
}

.icon-loyalty-good {
  background-image: url('@/assets/blue_team_no_background.png');
  border: 2px solid rgb(var(--v-theme-info));
  background-size: contain;
}

.icon-loyalty-evil {
  background-image: url('@/assets/red_team_no_background.png');
  border: 2px solid rgb(var(--v-theme-error));
  background-size: contain;
}

.loyalty-container {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 10px;
}

.back {
  font-size: 28px;
  position: absolute;
  top: 12px;
  left: 18px;
}

.role-name {
  text-align: center;
  text-transform: capitalize;
  font-weight: bold;
}
</style>
