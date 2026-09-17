<template>
  <img class="sticker-image" :src="src" :alt="$t(`stickers.${id}`)" draggable="false" />
</template>
<script setup lang="ts">
import { getImagePathByID } from '@/helpers/images';
import { computed } from 'vue';
const props = defineProps<{ id: string }>();
const src = computed(() => getImagePathByID('stickers', props.id));
</script>
<style scoped>
.sticker-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
