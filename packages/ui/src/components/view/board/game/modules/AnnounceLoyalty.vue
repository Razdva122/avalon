<template>
  <Spoiler :size="{ width: '300px', height: '200px' }">
    <div class="d-flex flex-column align-center justify-center" v-if="loyalty">
      <div class="mb-8" :class="loyalty"></div>
      <div>
        <v-btn class="mr-4" color="success" @click="announceLoyalty('good')">
          {{ $t('ladyModule.announceGood') }}
        </v-btn>
        <v-btn color="error" @click="announceLoyalty('evil')"> {{ $t('ladyModule.announceEvil') }} </v-btn>
      </div>
    </div>
  </Spoiler>
</template>

<script lang="ts">
import { defineComponent, inject, Ref, ref } from 'vue';
import { socket } from '@/api/socket';
import { gameStateKey } from '@/helpers/game-state-manager';
import { TLoyalty } from '@avalon/types';
import Spoiler from '@/components/feedback/Spoiler.vue';

export default defineComponent({
  components: {
    Spoiler,
  },
  async setup() {
    const gameState = inject(gameStateKey)!;
    const loyalty = ref() as Ref<TLoyalty>;
    loyalty.value = await socket.emitWithAck('getLoyalty', gameState.value.uuid);

    const announceLoyalty = (loyalty: TLoyalty) => {
      socket.emit('announceLoyalty', gameState.value.uuid, loyalty);
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
  background-image: url('@/assets/red_team_no_background.webp');
}

.good {
  background-image: url('@/assets/blue_team_no_background.webp');
}
</style>
