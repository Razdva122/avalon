<template>
  <div class="game-options">
    <div v-for="role in visibleRoles">
      <div class="mr-1 d-flex">
        <PreviewLink :target="role" text="" />
      </div>
    </div>
    <div v-if="hiddenRolesCount > 0" class="mr-1 d-flex hidden-roles-indicator">
      <span class="hidden-roles-text">+{{ hiddenRolesCount }}</span>
    </div>
    <div v-for="(amount, addon) of addons">
      <div v-if="amount" class="mr-1 d-flex">
        <PreviewLink :target="addon" text="" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import {
  GameOptionsRoles,
  GameOptionsAddons,
  evilRolesImportance,
  goodRolesImportance,
  TGoodRoles,
  TEvilRoles,
  TVisibleRole,
} from '@avalon/types';

import PreviewLink from '@/components/view/information/PreviewLink.vue';

export default defineComponent({
  components: {
    PreviewLink,
  },
  props: {
    roles: {
      required: true,
      type: Object as PropType<GameOptionsRoles>,
    },
    addons: {
      required: true,
      type: Object as PropType<GameOptionsAddons>,
    },
    maxView: {
      default: 100,
      type: Number,
    },
  },
  computed: {
    sortedRoles() {
      return <TVisibleRole[]>Object.entries(this.roles)
        .reduce<TVisibleRole[]>((acc, [role, amount]) => {
          for (let i = 0; i < amount; i += 1) {
            acc.push(<TVisibleRole>role);
          }

          return acc;
        }, [])
        .sort((a, b) => {
          const aIndex =
            a in goodRolesImportance ? goodRolesImportance[<TGoodRoles>a] : evilRolesImportance[<TEvilRoles>a] + 10000;
          const bIndex =
            b in goodRolesImportance ? goodRolesImportance[<TGoodRoles>b] : evilRolesImportance[<TEvilRoles>b] + 10000;
          return aIndex - bIndex;
        });
    },
    visibleRoles() {
      const amountOfAddons = Object.values(this.addons).filter((el) => el).length;
      return this.sortedRoles.slice(0, this.maxView - amountOfAddons);
    },
    hiddenRolesCount() {
      return Math.max(0, this.sortedRoles.length - this.visibleRoles.length);
    },
  },
});
</script>

<style scoped lang="scss">
.game-options {
  display: flex;
}

.hidden-roles-indicator {
  align-items: center;
  justify-content: center;
  background-color: rgb(var(--v-theme-inset-hover));
  border-radius: 50%;
  border: 1px solid white;
  width: 24px;
  height: 24px;
}

.hidden-roles-text {
  color: rgb(var(--v-theme-text-primary));
  font-size: 12px;
  font-weight: bold;
}
</style>
