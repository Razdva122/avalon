<template>
  <div class="lobby">
    <v-btn rounded="lg" variants="tonal" color="info" @click="createRoom"> Create room </v-btn>
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
