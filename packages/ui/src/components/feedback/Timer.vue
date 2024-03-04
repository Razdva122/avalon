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
    };
  },
  created() {
    this.initTimer();
  },
  watch: {
    duration() {
      this.time = this.duration;
      this.initTimer();
    },
  },
  methods: {
    initTimer() {
      if (this.time <= 0) {
        return;
      }

      const id = setInterval(() => {
        this.time -= 1000;
        if (this.time < 0) {
          this.$emit('timerEnd');
          clearInterval(id);
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
