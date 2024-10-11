<template>
  <template v-if="targetIsRole(target)">
    <router-link
      class="preview-link"
      :class="rolesShortInfo[target].loyalty + '-role'"
      :to="{ name: toSnakeCase(target) }"
    >
      <PlayerIcon class="icon-in-link" :icon="target" />
      <template v-if="text !== ''">
        {{ text ? $t('previewLink.' + text) : $t('roles.' + target) }}
      </template>
    </router-link>
  </template>
  <template v-else>
    <router-link class="preview-link addon" :to="{ name: toSnakeCase(target) }">
      <AddonIcon class="icon-in-link" :addon="target" />
      <template v-if="text !== ''">
        {{ text ? $t('previewLink.' + text) : $t('addons.' + target) }}
      </template>
    </router-link>
  </template>
</template>

<script lang="ts">
import snakeCase from 'lodash/snakeCase';

import { defineComponent, PropType } from 'vue';

import type { TVisibleRole } from '@avalon/types';

import { rolesShortInfo } from '@/components/view/information/const';

import type { TAddonsName } from '@/components/view/information/interface';

import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import AddonIcon from '@/components/view/information/AddonIcon.vue';

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
    text: {
      type: String,
    },
  },
  methods: {
    targetIsRole(target: TVisibleRole | TAddonsName): target is TVisibleRole {
      return target in rolesShortInfo;
    },
    toSnakeCase(str: string): string {
      return snakeCase(str);
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
