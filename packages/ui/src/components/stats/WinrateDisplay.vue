<template>
  <v-chip :color="chipColor" :variant="chipVariant" size="small" class="font-weight-medium">
    {{ `${winrate} %` }}
  </v-chip>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  props: {
    winrate: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const winrateValue = computed(() => {
      return parseFloat(props.winrate);
    });

    const chipColor = computed(() => {
      const value = winrateValue.value;

      if (value < 40) {
        return 'error'; // Red for 0-40%
      } else if (value >= 40 && value < 50) {
        return 'warning'; // Orange for 40-50%
      } else {
        return 'success'; // Green for 50%+
      }
    });

    const chipVariant = computed(() => {
      const value = winrateValue.value;

      if (value >= 60) {
        return 'flat'; // Flat green for 60%+
      } else {
        return 'tonal'; // Tonal for all other ranges
      }
    });

    return {
      winrateValue,
      chipColor,
      chipVariant,
    };
  },
});
</script>
