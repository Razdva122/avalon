<template>
  <template v-if="time > 0">
    <span>
      {{ timeInString }}
    </span>
  </template>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    duration: {
      required: true,
      type: Number,
    },
  },
  data() {
    const time = this.duration;

    return {
      time,
      intervalID: undefined as ReturnType<typeof setInterval> | undefined,
    };
  },
  created() {
    this.initTimer();
  },
  beforeUnmount() {
    this.clearTimer();
  },
  watch: {
    duration() {
      this.time = this.duration;
      this.initTimer();
    },
  },
  methods: {
    clearTimer() {
      if (this.intervalID !== undefined) clearInterval(this.intervalID);
      this.intervalID = undefined;
    },
    initTimer() {
      this.clearTimer();
      if (this.time <= 0) {
        return;
      }

      this.intervalID = setInterval(() => {
        this.time = Math.max(0, this.time - 1000);
        if (this.time === 0) {
          this.clearTimer();
          this.$emit('timerEnd');
        }
      }, 1000);
    },
  },
  computed: {
    timeInString() {
      const seconds = String(Math.floor(this.time / 1000));

      return seconds.length === 1 ? `0${seconds}` : seconds;
    },
  },
});
</script>

<style scoped lang="scss"></style>
