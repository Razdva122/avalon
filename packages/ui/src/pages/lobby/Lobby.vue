<template>
  <div class="lobby">
    <v-btn color="info" @click="createRoom"> Create room </v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { socket } from '@/api/socket';

export default defineComponent({
  methods: {
    async createRoom(): Promise<void> {
      const uuid = await socket.emitWithAck('createRoom');
      this.$router.push({ name: 'room', params: { uuid } });
    },
  },
});
</script>

<style scoped lang="scss">
.lobby {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>
