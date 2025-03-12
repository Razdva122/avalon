<template>
  <v-overlay v-model="overlay" :persistent="true" class="align-center justify-center">
    <v-card>
      <v-sheet width="300" class="mx-auto pa-4">
        <slot name="header"></slot>
        <div v-if="error" class="error-message mb-2 ml-2">
          {{ $t('errors.' + error) }}
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
      default: false,
    },
    error: {
      type: String,
      default: '',
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
