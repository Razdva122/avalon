<template>
  <span>
    <template v-for="(part, index) in messageParts" :key="index">
      <PreviewLink v-if="part.target" :target="part.target" />
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>

<script>
import { defineComponent } from 'vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import { rolesShortInfo } from '@/components/view/information/const';

export default defineComponent({
  props: {
    keypath: {
      type: String,
      required: true,
    },
  },
  components: {
    PreviewLink,
  },
  computed: {
    targetNames() {
      return [...Object.keys(rolesShortInfo), 'ladyOfLake', 'ladyOfSea', 'excalibur', 'plotCards'];
    },
    messageParts() {
      // i18n-t reuses the same slot VNode for repeated named placeholders.
      // Give every occurrence its own component, including during hydration.
      // Translation still handles interpolation; Vue renders all text escaped.
      const tokens = Object.fromEntries(this.targetNames.map((name) => [name, `\u0001${name}\u0001`]));
      return this.$t(this.keypath, tokens)
        .split(/(\u0001[^\u0001]+\u0001)/g)
        .filter(Boolean)
        .map((text) => {
          const target = text.slice(1, -1);
          return text.startsWith('\u0001') && this.targetNames.includes(target) ? { target } : { text };
        });
    },
  },
});
</script>
