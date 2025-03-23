<template>
  <div itemscope itemtype="http://schema.org/ImageObject" class="schema-image-container">
    <img class="image-content" itemprop="contentUrl" :src="src" :alt="alt" />
    <meta itemprop="name" :content="alt" />
    <meta itemprop="description" :content="description || alt" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SchemaImage',
  props: {
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
});
</script>

<style scoped>
.schema-image-container {
  display: inline-block;
}

.image-content {
  display: block;
  width: 100%;
}
</style>
