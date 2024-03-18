<template>
  <template v-if="target in rolesShortInfo">
    <a
      class="preview-link"
      :class="rolesShortInfo[target as TVisibleRole].loyalty + '-role'"
      @click="$router.push({ name: target })"
    >
      <PlayerIcon class="icon-in-link" :icon="target as TVisibleRole" />
      {{ target }}
    </a>
  </template>
  <template v-else>
    <a class="preview-link addon" @click="$router.push({ name: target })">
      <AddonIcon class="icon-in-link" :addon="target as TAddonsName" />
      {{ target }}
    </a>
  </template>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { TVisibleRole } from '@avalon/types';

import { rolesShortInfo } from '@/components/game/information/const';

import type { TAddonsName } from '@/components/game/information/interface';

import PlayerIcon from '@/components/game/information/PlayerIcon.vue';
import AddonIcon from '@/components/game/information/AddonIcon.vue';

export default defineComponent({
  components: {
    PlayerIcon,
    AddonIcon,
  },
  data: () => ({
    rolesShortInfo,
  }),
  props: {
    target: {
      required: true,
      type: String as PropType<TVisibleRole | TAddonsName>,
    },
  },
});
</script>

<style scoped lang="scss">
.preview-link {
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
  &.preview-link:hover {
    color: rgb(255, 101, 112);
  }

  .icon-in-link {
    border: 0.5px solid rgb(255, 101, 112);
  }
}

.good-role {
  &.preview-link:hover {
    color: rgb(101, 201, 255);
  }

  .icon-in-link {
    border: 0.5px solid rgb(101, 201, 255);
  }
}

.addon {
  &.preview-link:hover {
    color: rgb(176, 176, 176);
  }

  .icon-in-link {
    border: 0.5px solid rgb(176, 176, 176);
  }
}
</style>
