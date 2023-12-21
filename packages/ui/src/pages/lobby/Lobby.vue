<template>
  <div class="lobby">
    <v-btn rounded="lg" variants="tonal" color="info" @click="createRoom"> Create room </v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';

export default defineComponent({
  methods: {
    async createRoom(): Promise<void> {
      const data = (await axios.get<string>('http://localhost:3000/api/create_room')).data;
      this.$router.push({ name: 'room', params: { uuid: data } });
    },
  },
});
</script>
