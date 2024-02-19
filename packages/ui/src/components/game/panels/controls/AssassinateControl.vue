<template>
  <div v-if="assassinateTargets.length > 1">
    <v-radio-group
      class="text-white mb-2"
      v-model="selectedTarget"
      :hide-details="true"
      color="error"
      inline
      label="Select target"
    >
      <v-radio v-for="target in assassinateTargets" :label="target" :value="target" :hide-details="true" />
    </v-radio-group>
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

<style scoped lang="scss"></style>
