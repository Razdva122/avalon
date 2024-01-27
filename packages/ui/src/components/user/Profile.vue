<template>
  <div class="d-flex flex-row align-center justify-center text-white">
    <SpoilerEye class="mr-1" />
    <span class="mr-2">User: </span
    ><v-btn @click="$emit('usernameClick')" class="user" variant="outlined" color="white" density="comfortable">{{
      userName
    }}</v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SpoilerEye from '@/components/feedback/SpoilerEye.vue';

export default defineComponent({
  components: {
    SpoilerEye,
  },
  computed: {
    userName() {
      const { user } = this.$store.state;

      return user?.name || '';
    },
  },
});
</script>

<style scoped lang="scss">
.user {
  padding: 0px;
}
</style>
