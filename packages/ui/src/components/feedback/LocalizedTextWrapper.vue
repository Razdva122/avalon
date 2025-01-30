<template>
  <i18n-t :keypath="keypath" tag="span">
    <template v-for="targetName in targetNames" v-slot:[targetName]>
      <PreviewLink :target="targetName" />
    </template>
  </i18n-t>
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
      return [...Object.keys(rolesShortInfo), 'ladyOfLake', 'ladyOfSea', 'excalibur'];
    },
  },
});
</script>
