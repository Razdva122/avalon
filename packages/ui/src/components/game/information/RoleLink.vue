<template>
  <a class="role-link" :class="rolesShortInfo[role].loyalty + '-role'" @click="$router.push({ name: role })">
    <PlayerIcon class="icon-in-link" :icon="role" />
    {{ role }}
  </a>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { TVisibleRole } from '@avalon/types';

import { rolesShortInfo } from '@/components/game/information/const';

import PlayerIcon from '@/components/game/information/PlayerIcon.vue';

export default defineComponent({
  components: {
    PlayerIcon,
  },
  data: () => ({
    rolesShortInfo,
  }),
  props: {
    role: {
      required: true,
      type: String as PropType<TVisibleRole>,
    },
  },
});
</script>

<style scoped lang="scss">
.role-link {
  display: inline-flex;
  cursor: pointer;
  text-transform: capitalize;
  gap: 4px;
  align-items: baseline;
}

.icon-in-link {
  display: inline-block;
  width: 24px;
  height: 24px;
  align-self: center;
}

.evil-role {
  &.role-link:hover {
    color: rgb(255, 101, 112);
  }

  .icon-in-link {
    border: 0.5px solid rgb(255, 101, 112);
  }
}

.good-role {
  &.role-link:hover {
    color: rgb(101, 201, 255);
  }

  .icon-in-link {
    border: 0.5px solid rgb(101, 201, 255);
  }
}
</style>
