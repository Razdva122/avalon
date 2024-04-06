<template>
  <div class="d-flex mb-2" v-if="assassinateTargets.length > 1">
    <v-btn-toggle v-model="selectedTarget" density="comfortable" divided>
      <v-btn v-if="assassinateTargets.includes('merlin')" class="button-content" value="merlin" variant="plain">
        <template v-slot:prepend>
          <div class="merlin-radio-button radio-button"></div>
        </template>
        Merlin
      </v-btn>
      <v-btn v-if="assassinateTargets.includes('lovers')" class="button-content" value="lovers" variant="plain">
        <template v-slot:prepend>
          <div class="lovers-radio-button radio-button"></div>
        </template>
        Lovers
      </v-btn>
      <v-btn v-if="assassinateTargets.includes('guinevere')" class="button-content" value="guinevere" variant="plain">
        <template v-slot:prepend>
          <div class="guinevere-radio-button radio-button"></div>
        </template>
        Guinevere
      </v-btn>
    </v-btn-toggle>
  </div>
  <div>
    <v-btn color="error" :disabled="isAssassinateDisabled" @click="onAssassinateClick">Assassinate</v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, toRefs, ref } from 'vue';
import type { IVisualGameState, TAssassinateType } from '@avalon/types';
import { socket } from '@/api/socket';

export default defineComponent({
  name: 'AssassinateControl',
  props: {
    game: {
      required: true,
      type: Object as PropType<IVisualGameState>,
    },
  },
  setup(props) {
    const { game } = toRefs(props);

    const assassinateTargets = computed(() => {
      return game.value.addonsData.assassin!.assassinateTargets;
    });

    const selectedTarget = ref<TAssassinateType | undefined>(
      assassinateTargets.value.length === 1 ? assassinateTargets.value[0] : undefined,
    );

    const isAssassinateDisabled = computed(() => {
      if (!selectedTarget.value) {
        return true;
      }

      const players = game.value.players.filter((player) => player.features.isSelected).length;

      const needPlayer: { [key in TAssassinateType]: number } = {
        merlin: 1,
        lovers: 2,
        guinevere: 1,
      };

      return needPlayer[selectedTarget.value] !== players;
    });

    const onAssassinateClick = () => {
      socket.emit('assassinate', game.value.uuid, selectedTarget.value!);
    };

    return {
      assassinateTargets,
      selectedTarget,

      isAssassinateDisabled,

      onAssassinateClick,
    };
  },
});
</script>

<style scoped lang="scss">
.radio-button {
  background-size: 120%;
  background-position: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid;
}

.v-btn--active {
  .radio-button {
    border-color: rgb(var(--v-theme-error));
  }

  opacity: 1;
}

.merlin-radio-button {
  background-image: url('@/assets/icons/merlin_hat.webp');
}

.lovers-radio-button {
  background-image: url('@/assets/icons/lovers_rose.webp');
}

.guinevere-radio-button {
  background-image: url('@/assets/icons/tiara.webp');
}

.button-content {
  color: white;
  text-transform: none;
  font-size: 20px;
}
</style>
