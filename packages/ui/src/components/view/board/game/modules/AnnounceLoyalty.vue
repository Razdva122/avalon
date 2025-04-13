<template>
  <Spoiler :size="{ width: '300px', height: '200px' }">
    <div class="d-flex flex-column align-center justify-center" v-if="loyalty">
      <PlayerIcon :icon="loyalty" class="mb-4 role-icon" />
      <template v-if="isLadyOfSea">
        <v-btn-toggle class="mb-2 btn-sections" v-model="selectedLoyalty" density="default" divided>
          <v-btn
            v-for="role in possibleSeaTargets"
            :value="role"
            size="x-small"
            variant="plain"
            class="button-content button-small"
          >
            <template v-slot:prepend>
              <PlayerIcon :icon="role" class="small-role-icon radio-button" />
            </template>
          </v-btn>
        </v-btn-toggle>

        <v-btn :disabled="!selectedLoyalty" color="success" @click="announceLoyalty(selectedLoyalty!)">
          {{ $t('ladyModule.announce') }}
        </v-btn>
      </template>
      <template v-else>
        <div>
          <v-btn class="mr-4" color="success" @click="announceLoyalty('good')">
            {{ $t('ladyModule.announceGood') }}
          </v-btn>
          <v-btn color="error" @click="announceLoyalty('evil')"> {{ $t('ladyModule.announceEvil') }} </v-btn>
        </div>
      </template>
    </div>
  </Spoiler>
</template>

<script lang="ts">
import { defineComponent, inject, Ref, ref, computed } from 'vue';
import { socket } from '@/api/socket';
import { gameStateKey } from '@/helpers/game-state-manager';
import { TLoyalty, TRoles } from '@avalon/types';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import Spoiler from '@/components/feedback/Spoiler.vue';

export default defineComponent({
  components: {
    Spoiler,
    PlayerIcon,
  },
  async setup() {
    const gameState = inject(gameStateKey)!;

    const loyalty = ref() as Ref<TLoyalty | TRoles>;
    const selectedLoyalty = ref<TRoles | TLoyalty | undefined>(undefined);

    const activeCard = computed(() => {
      return gameState.value.addonsData.plotCards?.cardsInGame.find(
        (card) =>
          (card.name === 'showNature' || card.name === 'areYouTheOne' || card.name === 'showStrength') &&
          card.stage === 'active',
      );
    });

    if (activeCard.value) {
      loyalty.value = await socket.emitWithAck('getLoyaltyWithCard', gameState.value.uuid, activeCard.value.id);
    } else {
      loyalty.value = await socket.emitWithAck('getLoyalty', gameState.value.uuid);
    }

    const announceLoyalty = (loyalty: TLoyalty | TRoles) => {
      if (activeCard.value) {
        socket.emit('announceLoyaltyWithCard', gameState.value.uuid, loyalty, activeCard.value.id);
      } else {
        socket.emit('announceLoyalty', gameState.value.uuid, loyalty);
      }
    };

    const isLadyOfSea = computed(() => {
      return (
        gameState.value.addonsData.ladyOfSea &&
        gameState.value.players.some((player) => player.features.ladyOfSea === 'active')
      );
    });

    const possibleSeaTargets = computed(() => {
      return gameState.value.addonsData.ladyOfSea?.loyaltyTargets || [];
    });

    return {
      isLadyOfSea,
      loyalty,
      selectedLoyalty,
      possibleSeaTargets,
      announceLoyalty,
    };
  },
});
</script>

<style scoped lang="scss">
.role-icon {
  width: 200px;
  height: 200px;
  background-size: contain;
  border-radius: 50%;
  border: 3px solid white;
}

.small-role-icon {
  width: 50px;
  height: 50px;
  border: 3px solid;
}

.radio-button {
  background-size: 120%;
  background-position: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 3px solid;
}

.v-btn--active {
  .radio-button {
    border-color: rgb(var(--v-theme-error));
  }

  opacity: 1;
}

.btn-sections {
  height: 50px;
}
</style>
