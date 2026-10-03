<template>
  <div
    itemscope
    itemtype="http://schema.org/ImageObject"
    class="schema-image-container"
    :class="{ 'role-art': role }"
    :style="role ? calculateRolePortraitStyle(role) : undefined"
  >
    <img class="image-content" itemprop="contentUrl" :src="src" :alt="alt" />
    <meta itemprop="name" :content="alt" />
    <meta itemprop="description" :content="description || alt" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { calculateRolePortraitStyle } from '@/helpers/styles';

export default defineComponent({
  name: 'SchemaImage',
  methods: { calculateRolePortraitStyle },
  props: {
    role: String,
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

.role-art .image-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: var(--role-image-position, center);
  transform: scale(var(--role-image-scale, 1));
  transform-origin: var(--role-image-position, center);
}
</style>
