<template>
  <div v-if="snackbar">
    <v-snackbar v-model="snackbar" class="text-center ma-2">
      <div class="snackbar-content">
        {{ text }}
      </div>
      <template v-slot:actions>
        <v-btn color="pink" variant="text" @click="snackbar = false"> {{ $t('infoMessage.close') }} </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { socket } from '@/api/socket';
import eventBus from '@/helpers/event-bus';

export default defineComponent({
  setup() {
    const snackbar = ref<boolean>(false);
    const text = ref<string>('');

    eventBus.on('infoMessage', (message) => {
      snackbar.value = true;
      text.value = message;
    });

    socket.on('serverError', (error) => {
      snackbar.value = true;
      text.value = `Server error: ${error}`;
    });

    return {
      snackbar,
      text,
    };
  },
});
</script>

<style scoped lang="scss">
.snackbar-content {
  font-size: 20px;
}
</style>
