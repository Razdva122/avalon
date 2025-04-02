<template>
  <div class="winrate-display" :style="winrateStyle">
    {{ `${winrate} %` }}
  </div>
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

    const winrateStyle = computed(() => {
      const value = winrateValue.value;
      let r, g, b;
      let fontWeight = 500;

      // Create a smoother color transition
      if (value <= 40) {
        // Pure red for very low winrates (0-40%)
        const intensity = 100 + Math.round((40 - value) * 1.5);
        r = Math.min(255, intensity);
        g = 0;
        b = 0;
        fontWeight = 500;
      } else if (value >= 60) {
        // Pure green for high winrates (60-100%)
        const intensity = 100 + Math.round((value - 60) * 1.5);
        r = 0;
        g = Math.min(255, intensity);
        b = 0;
        fontWeight = 500 + Math.round((value - 60) / 8) * 100;
      } else {
        // Gradient from red to yellow to green for middle range (40-60%)
        const position = (value - 40) / 20; // 0 to 1 as we move from 40% to 60%

        // Red component decreases as we approach 60%
        r = Math.round(255 * (1 - position));

        // Green component increases as we approach 60%
        g = Math.round(255 * position);

        // No blue component
        b = 0;

        fontWeight = 500;
      }

      return {
        color: `rgb(${r}, ${g}, ${b})`,
        fontWeight: fontWeight,
      };
    });

    return {
      winrateStyle,
    };
  },
});
</script>

<style scoped lang="scss">
.winrate-display {
  background-color: rgb(var(--v-theme-inset));
  width: fit-content;
  padding: 0px 8px;
  border-radius: 8px;
  white-space: nowrap;

  @media (max-width: 600px) {
    padding: 0px 4px;
    font-size: 14px;
  }
}
</style>
