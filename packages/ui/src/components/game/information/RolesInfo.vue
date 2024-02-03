<template>
  <v-btn class="roles" color="info" @click="overlay = !overlay"> Roles </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="roles-info d-flex flex-column align-center pa-4 rounded-lg">
      <div class="d-flex flex-row align-center">
        <h2 class="title">{{ selectedRole ? selectedRole : 'Roles' }}</h2>
        <v-switch
          v-if="!selectedRole && visibleRolesInfo.length > 2"
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
        <PlayerIcon class="big-role mt-4 mb-4" :class="'role-loyalty-' + roleInfo.loyalty" :icon="selectedRole" />
        <div class="role-info">{{ roleInfo.info }}</div>
        <div v-if="roleInfo.loyalty" :class="'icon-loyalty-' + roleInfo.loyalty"></div>
      </template>
      <template v-else>
        <div class="loyalty-container" v-if="mode === 'real'" v-for="loyalty in ['good', 'evil'] as const">
          <div v-for="role in gameRoles[loyalty]">
            <div class="role-name">{{ role }}</div>
            <PlayerIcon @click="selectRole(role)" class="role" :class="'role-loyalty-' + loyalty" :icon="role" />
          </div>
          <v-divider v-if="loyalty === 'good'" :thickness="2" class="mt-2 mb-2"></v-divider>
        </div>
        <div class="loyalty-container" v-else>
          <div v-for="role in visibleRolesInfo">
            <div class="role-name">{{ role.name }}</div>
            <PlayerIcon
              @click="selectRole(role.name)"
              class="role"
              :class="'role-loyalty-' + role.loyalty"
              :icon="role.name"
            />
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
import type { TGameRoles, TVisibleRole } from '@avalon/types';
import { defineComponent, PropType } from 'vue';
import PlayerIcon from '@/components/game/information/PlayerIcon.vue';
import { rolesShortInfo } from '@/components/game/information/const';

export default defineComponent({
  components: {
    PlayerIcon,
  },
  props: {
    gameRoles: {
      required: true,
      type: Object as PropType<TGameRoles>,
    },
    visibleRoles: {
      required: true,
      type: Array as PropType<TVisibleRole[]>,
    },
  },
  data: () => ({
    overlay: false,
    mode: 'real',
    selectedRole: undefined as TVisibleRole | undefined,
  }),
  computed: {
    roleInfo() {
      return rolesShortInfo[this.selectedRole!];
    },
    visibleRolesInfo() {
      return this.visibleRoles
        .map((el) => ({ name: el, ...rolesShortInfo[el] }))
        .sort((a) => {
          if (a.loyalty === 'evil') {
            return -1;
          }

          return a.loyalty === 'good' ? 0 : 1;
        });
    },
  },
  methods: {
    selectRole(role: TVisibleRole) {
      this.selectedRole = role;
    },
  },
  watch: {
    overlay(value: boolean) {
      if (value === true) {
        this.selectedRole = undefined;
        this.mode = 'real';
      }
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
  min-height: 500px;
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

.role-loyalty-unknown {
  border: 5px solid gray;
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
