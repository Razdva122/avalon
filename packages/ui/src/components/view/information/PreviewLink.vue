<template>
  <template v-if="targetIsRole(target)">
    <component
      :is="linked ? 'LocaleLink' : 'span'"
      class="preview-link"
      :class="rolesShortInfo[target].loyalty + '-role'"
      :to="linked ? { name: toSnakeCase(normalizeRoleRoute) } : undefined"
    >
      <PlayerIcon thumbnail class="icon-in-link" :icon="target" />
      <template v-if="text !== ''">
        {{ text ? $t('previewLink.' + text) : $t('roles.' + target) }}
      </template>
    </component>
  </template>
  <template v-else>
    <component
      :is="linked ? 'LocaleLink' : 'span'"
      class="preview-link addon"
      :to="linked ? { name: toSnakeCase(target) } : undefined"
    >
      <AddonIcon class="icon-in-link" :addon="target" />
      <template v-if="text !== ''">
        {{ text ? $t('previewLink.' + text) : $t('addons.' + target) }}
      </template>
    </component>
  </template>
</template>

<script lang="ts">
import snakeCase from 'lodash/snakeCase';

import { defineComponent, PropType } from 'vue';

import type { TVisibleRole } from '@avalon/types';

import { rolesShortInfo } from '@/components/view/information/const';

import type { TAddonsName } from '@avalon/types';

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
    linked: {
      type: Boolean,
      default: true,
    },
    target: {
      required: true,
      type: String as PropType<TVisibleRole | TAddonsName>,
    },
    text: {
      type: String,
    },
  },
  computed: {
    normalizeRoleRoute(): string {
      if (this.target === 'tristan' || this.target === 'isolde') return 'lovers';
      if (this.target === 'goodLancelot' || this.target === 'evilLancelot') return 'lancelots';
      return this.target;
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
