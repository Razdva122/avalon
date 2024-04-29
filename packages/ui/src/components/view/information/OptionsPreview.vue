<template>
  <div class="game-options">
    <div v-for="role in sortedRoles">
      <div class="mr-1 d-flex">
        <PreviewLink :target="role" text="" />
      </div>
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
  TGameOptionsRoles,
  TGameOptionsAddons,
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
      type: Object as PropType<TGameOptionsRoles>,
    },
    addons: {
      required: true,
      type: Object as PropType<TGameOptionsAddons>,
    },
  },
  computed: {
    sortedRoles() {
      return <TVisibleRole[]>Object.entries(this.roles)
        .filter(([_, amount]) => amount > 0)
        .map(([role]) => role)
        .sort((a, b) => {
          const aIndex =
            a in goodRolesImportance ? goodRolesImportance[<TGoodRoles>a] : evilRolesImportance[<TEvilRoles>a] + 10000;
          const bIndex =
            b in goodRolesImportance ? goodRolesImportance[<TGoodRoles>b] : evilRolesImportance[<TEvilRoles>b] + 10000;
          return aIndex - bIndex;
        });
    },
  },
});
</script>

<style scoped lang="scss">
.game-options {
  display: flex;
}
</style>
