<template>
  <img class="sticker-image" :src="src" :alt="$t(`stickers.${id}`)" draggable="false" />
</template>
<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ id: string }>();
const src = computed(() => require(`@/assets/images/stickers/${props.id}.png`));
</script>
<style scoped>
.sticker-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
