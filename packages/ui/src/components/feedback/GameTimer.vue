<template>
  <section class="game-timer-container" :aria-label="$t('options.timer')">
    <div
      class="timer-reading"
      :class="{ 'timer-adjustable': canAdjust && isCustom }"
      :title="canAdjust && isCustom ? $t('timerUi.doubleClickMinute') : undefined"
      @dblclick.prevent="onDoubleClick"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
    >
      <span class="material-icons" aria-hidden="true">timer</span>
      <div>
        <p class="timer-caption sr-only">{{ $t(isCustom ? 'timerUi.manual' : 'timerUi.stage') }}</p>
        <span
          class="time"
          role="timer"
          aria-live="off"
          :class="{
            'low-time': active && seconds > 0 && seconds <= 10,
            'critical-time': active && seconds > 0 && seconds <= 5,
          }"
          >{{ timeInString }}</span
        >
      </div>
      <span class="timer-status sr-only" role="status">{{
        $t(!active ? 'timerUi.stopped' : seconds === 0 ? 'timerUi.finished' : 'timerUi.running')
      }}</span>
    </div>
    <slot name="timer-controls"></slot>
  </section>
</template>
<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, computed, watch } from 'vue';
export default defineComponent({
  props: {
    endTime: { required: true, type: Number },
    isCustom: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    canAdjust: { type: Boolean, default: false },
  },
  emits: ['timerEnd', 'addMinute'],
  setup(props, { emit }) {
    const seconds = ref(0);
    let interval: number | undefined;
    let finished = false;
    const clear = () => {
      if (interval !== undefined) window.clearInterval(interval);
      interval = undefined;
    };
    function tick() {
      seconds.value = props.active ? Math.max(0, Math.ceil((props.endTime - Date.now()) / 1000)) : 0;
      if (!props.active || seconds.value === 0) {
        clear();
        if (props.active && !finished) {
          finished = true;
          emit('timerEnd');
        }
      }
    }
    function restart() {
      clear();
      finished = false;
      tick();
      if (props.active && seconds.value > 0) interval = window.setInterval(tick, 250);
    }
    onMounted(restart);
    watch(() => [props.endTime, props.active], restart);
    onUnmounted(clear);
    const timeInString = computed(
      () => `${String(Math.floor(seconds.value / 60)).padStart(2, '0')}:${String(seconds.value % 60).padStart(2, '0')}`,
    );
    function addMinute() {
      if (props.canAdjust && props.isCustom) emit('addMinute');
    }
    const tapWindow = 350;
    const tapDistance = 24;
    let touchStart: { id: number; x: number; y: number; at: number } | undefined;
    let previousTap: { x: number; y: number; at: number } | undefined;
    let ignoreDoubleClickUntil = 0;
    function onPointerCancel() {
      touchStart = undefined;
      previousTap = undefined;
    }
    function onPointerDown(event: PointerEvent) {
      if (event.pointerType !== 'touch') return;
      ignoreDoubleClickUntil = Date.now() + 800;
      if (!event.isPrimary || !props.canAdjust || !props.isCustom) {
        onPointerCancel();
        return;
      }
      touchStart = { id: event.pointerId, x: event.clientX, y: event.clientY, at: Date.now() };
    }
    function onPointerMove(event: PointerEvent) {
      if (
        touchStart?.id === event.pointerId &&
        Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > tapDistance
      )
        onPointerCancel();
    }
    function onPointerUp(event: PointerEvent) {
      if (event.pointerType !== 'touch') return;
      // Some mobile browsers also dispatch dblclick after the touch sequence.
      ignoreDoubleClickUntil = Date.now() + 800;
      const start = touchStart;
      touchStart = undefined;
      if (
        !start ||
        start.id !== event.pointerId ||
        !event.isPrimary ||
        Date.now() - start.at > tapWindow ||
        Math.hypot(event.clientX - start.x, event.clientY - start.y) > tapDistance ||
        !props.canAdjust ||
        !props.isCustom
      ) {
        previousTap = undefined;
        return;
      }
      const now = Date.now();
      if (
        previousTap &&
        now - previousTap.at <= tapWindow &&
        Math.hypot(event.clientX - previousTap.x, event.clientY - previousTap.y) <= tapDistance
      ) {
        previousTap = undefined;
        addMinute();
      } else {
        previousTap = { x: event.clientX, y: event.clientY, at: now };
      }
    }
    function onDoubleClick() {
      if (Date.now() >= ignoreDoubleClickUntil) addMinute();
    }
    watch(() => [props.canAdjust, props.isCustom], onPointerCancel);
    return {
      seconds,
      timeInString,
      addMinute,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onDoubleClick,
    };
  },
});
</script>
<style scoped lang="scss">
.game-timer-container,
.timer-reading {
  display: flex;
  align-items: center;
  gap: 6px;
}
.game-timer-container {
  color: rgb(var(--v-theme-text-primary));
  background: rgb(var(--v-theme-inset));
  border-radius: 8px;
  padding: 0 4px 0 10px;
  box-shadow: 0 1px 4px #0002;
}
.game-timer-container:has(> .timer-reading:last-child) {
  padding-right: 10px;
}
.timer-reading {
  flex-shrink: 0;
  min-height: 44px;
  user-select: none;
}
.timer-reading > .material-icons {
  font-size: 20px;
  color: rgb(var(--v-theme-primary));
}
.timer-adjustable {
  cursor: pointer;
  touch-action: manipulation;
}
.time {
  display: block;
  font-size: 22px;
  line-height: 1;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.low-time {
  color: rgb(var(--v-theme-warning));
}
.critical-time {
  color: rgb(var(--v-theme-error));
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
