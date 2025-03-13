<template>
  <v-overlay v-model="overlay" :persistent="persistent" class="align-center justify-center">
    <v-card>
      <v-sheet :width="$props.width" class="mx-auto pa-4">
        <slot name="header"></slot>
        <div v-if="error" class="error-message mb-2 ml-2">
          {{ $t('errors.' + error) }}
          <div v-if="additionalError">
            {{ additionalError }}
          </div>
        </div>
        <slot></slot>
      </v-sheet>
      <v-btn @click="closeModal" class="close" icon="close" variant="text" density="compact" />
    </v-card>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BaseModal',
  props: {
    modelValue: {
      type: Boolean,
    },
    error: {
      type: String,
      default: '',
    },
    additionalError: {
      type: String,
    },
    width: {
      type: Number,
    },
    persistent: {
      type: Boolean,
    },
  },
  emits: ['update:modelValue', 'close'],
  data() {
    return {
      overlay: this.modelValue,
    };
  },
  watch: {
    modelValue(newValue) {
      this.overlay = newValue;
    },
    overlay(newValue) {
      this.$emit('update:modelValue', newValue);
    },
  },
  methods: {
    closeModal() {
      this.overlay = false;
      this.$emit('close');
    },
  },
});
</script>

<style scoped lang="scss">
.close {
  position: absolute;
  top: 4px;
  right: 4px;
}

.error-message {
  color: rgb(var(--v-theme-error));
}
</style>
