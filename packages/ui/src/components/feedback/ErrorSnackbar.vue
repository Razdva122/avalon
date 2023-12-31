<template>
  <div class="text-center ma-2">
    <v-snackbar v-model="snackbar">
      Server error: {{ text }}

      <template v-slot:actions>
        <v-btn color="pink" variant="text" @click="snackbar = false"> Close </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { socket } from '@/api/socket';

export default defineComponent({
  setup() {
    const snackbar = ref<boolean>(false);
    const text = ref<string>('');

    socket.on('serverError', (error) => {
      snackbar.value = true;
      text.value = error;
    });

    return {
      snackbar,
      text,
    };
  },
});
</script>
