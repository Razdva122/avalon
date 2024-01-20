<template>
  <div class="d-flex flex-column align-center justify-center" v-if="loyalty">
    <div class="mb-8" :class="loyalty"></div>
    <div>
      <v-btn class="mr-4" color="success" @click="announceLoyalty('good')"> Announce Good </v-btn>
      <v-btn color="error" @click="announceLoyalty('evil')"> Announce Evil </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, Ref, ref } from 'vue';
import { socket } from '@/api/socket';
import { roomStateKey } from '@/pages/room/const';
import { TLoyalty } from '@avalon/types';

export default defineComponent({
  async setup() {
    const roomState = inject(roomStateKey)!;
    const loyalty = ref() as Ref<TLoyalty>;
    loyalty.value = await socket.emitWithAck('getLoyalty', roomState.value.roomID);

    const announceLoyalty = (loyalty: TLoyalty) => {
      socket.emit('announceLoyalty', roomState.value.roomID, loyalty);
    };

    return {
      loyalty,

      announceLoyalty,
    };
  },
});
</script>

<style scoped lang="scss">
.evil,
.good {
  width: 200px;
  height: 200px;
  background-size: contain;
  border-radius: 50%;
  border: 3px solid white;
}

.evil {
  background-image: url('@/assets/red_team_no_background.png');
}

.good {
  background-image: url('@/assets/blue_team_no_background.png');
}
</style>
