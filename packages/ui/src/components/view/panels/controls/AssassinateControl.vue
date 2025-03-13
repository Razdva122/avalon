<template>
  <div class="d-flex mb-2" v-if="assassinateTargets.length > 1 && !progressData">
    <v-btn-toggle v-model="selectedTarget" density="comfortable" divided>
      <v-btn v-if="assassinateTargets.includes('merlin')" class="button-content" value="merlin" variant="plain">
        <template v-slot:prepend>
          <div class="merlin-radio-button radio-button"></div>
        </template>
        {{ $t('roles.merlin') }}
      </v-btn>
      <v-btn v-if="assassinateTargets.includes('lovers')" class="button-content" value="lovers" variant="plain">
        <template v-slot:prepend>
          <div class="lovers-radio-button radio-button"></div>
        </template>
        {{ $t('assassinate.lovers') }}
      </v-btn>
      <v-btn v-if="assassinateTargets.includes('guinevere')" class="button-content" value="guinevere" variant="plain">
        <template v-slot:prepend>
          <div class="guinevere-radio-button radio-button"></div>
        </template>
        {{ $t('roles.guinevere') }}
      </v-btn>
      <v-btn v-if="assassinateTargets.includes('cleric')" class="button-content" value="cleric" variant="plain">
        <template v-slot:prepend>
          <div class="cleric-radio-button radio-button"></div>
        </template>
        {{ $t('roles.cleric') }}
      </v-btn>
    </v-btn-toggle>
  </div>
  <div class="d-flex mb-2" v-if="progressData">
    <v-btn-toggle v-model="selectedRole" density="comfortable" divided>
      <v-btn
        v-for="role in progressData.possibleTargets"
        :value="role"
        size="x-small"
        variant="plain"
        class="button-content button-small"
      >
        <template v-slot:prepend>
          <PlayerIcon :icon="role" class="role-icon radio-button" />
        </template>
        <template v-if="progressData.possibleTargets!.length <= 3">
          {{ $t(`roles.${role}`) }}
        </template>
      </v-btn>
    </v-btn-toggle>
  </div>
  <div>
    <v-btn
      color="error"
      :disabled="progressData ? isCustomAssassinateDisabled : isAssassinateDisabled"
      @click="onAssassinateClick"
      >{{ $t('assassinate.assassinate') }}</v-btn
    >
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, toRefs, ref } from 'vue';
import type { VisualGameState, TAssassinateType, TRoles } from '@avalon/types';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import { socket } from '@/api/socket';

export default defineComponent({
  name: 'AssassinateControl',
  props: {
    game: {
      required: true,
      type: Object as PropType<VisualGameState>,
    },
  },
  components: {
    PlayerIcon,
  },
  setup(props) {
    const { game } = toRefs(props);

    const assassinateTargets = computed(() => {
      return game.value.addonsData.assassin!.assassinateTargets;
    });

    const progressData = computed(() => {
      return game.value.addonsData.assassin!.progressData;
    });

    const selectedTarget = ref<TAssassinateType | undefined>(
      assassinateTargets.value.length === 1 ? assassinateTargets.value[0] : undefined,
    );

    const selectedRole = ref<TRoles | undefined>(undefined);

    const isAssassinateDisabled = computed(() => {
      if (!selectedTarget.value) {
        return true;
      }

      const players = game.value.players.filter((player) => player.features.isSelected).length;

      const needPlayer: { [key in TAssassinateType]: number } = {
        merlin: 1,
        lovers: 2,
        guinevere: 1,
        cleric: 1,
      };

      return needPlayer[selectedTarget.value] !== players;
    });

    const isCustomAssassinateDisabled = computed(() => {
      const players = game.value.players.filter((player) => player.features.isSelected).length;

      return players !== 1 || !selectedRole.value;
    });

    const onAssassinateClick = () => {
      if (progressData.value) {
        socket.emit('assassinate', game.value.uuid, progressData.value.type, selectedRole.value);
      } else {
        socket.emit('assassinate', game.value.uuid, selectedTarget.value!);
      }
    };

    return {
      assassinateTargets,
      selectedTarget,
      progressData,
      selectedRole,

      isAssassinateDisabled,
      isCustomAssassinateDisabled,

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

.role-icon {
  width: 40px;
  height: 40px;
  border: 3px solid;
}

.v-btn--active {
  .radio-button {
    border-color: rgb(var(--v-theme-error));
  }

  opacity: 1;
}

.merlin-radio-button {
  background-image: getIconPathByName('merlin_hat.webp');
}

.lovers-radio-button {
  background-image: getIconPathByName('lovers_rose.webp');
}

.guinevere-radio-button {
  background-image: getIconPathByName('tiara.webp');
}

.cleric-radio-button {
  background-image: getIconPathByName('cleric_cross.webp');
}

.button-content {
  color: white;
  text-transform: none;
  font-size: 20px;
}

.button-small {
  font-size: 14px;
}
</style>
