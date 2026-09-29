<template>
  <v-overlay v-model="overlay" :persistent="persistent" class="align-center justify-center modal-overlay">
    <div class="modal-wrapper" :style="maxWidth ? { maxWidth: maxWidth + 'px' } : {}">
      <v-card class="modal-card" :style="maxWidth ? { maxWidth: maxWidth + 'px' } : {}" elevation="8">
        <v-btn
          @click="closeModal"
          :aria-label="$t('infoMessage.close')"
          class="close-btn"
          icon="close"
          color="text-primary"
          variant="text"
          size="small"
        />
        <div class="modal-header-bar">
          <slot name="header"></slot>
        </div>
        <v-sheet :style="$props.width ? { width: $props.width + 'px', maxWidth: '100%' } : {}" class="modal-content">
          <div v-if="error" class="error-message mb-3" role="alert">
            <span class="material-icons error-icon">error</span>
            <div>
              {{ $t('errors.' + error) }}
              <div v-if="additionalError" class="additional-error">
                {{ additionalError }}
              </div>
            </div>
          </div>
          <slot></slot>
        </v-sheet>
      </v-card>
    </div>
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
    maxWidth: {
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
.modal-overlay {
  backdrop-filter: blur(4px);
}

.modal-wrapper {
  position: relative;
  max-width: 90vw;
  max-height: 85vh;
}

.modal-card {
  max-width: 90vw;
  max-height: 85vh;
  overflow: auto;
  border-radius: 16px !important;
  background-color: rgb(var(--v-theme-inset)) !important;
}

.modal-header-bar {
  padding: 16px 20px 0 20px;

  :deep(h1),
  :deep(h2) {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    text-align: center;
  }
}

.close-btn {
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 10;
  opacity: 0.6;
  font-size: 20px;

  &:hover {
    opacity: 1;
  }
}

.modal-content {
  padding: 16px 20px 20px 20px;
  background: transparent !important;
}

.error-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background-color: rgba(var(--v-theme-error), 0.1);
  border-radius: 8px;
  color: rgb(var(--v-theme-error));
  word-break: break-word;
  overflow-wrap: break-word;

  .error-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .additional-error {
    margin-top: 4px;
    font-size: 13px;
    opacity: 0.9;
  }
}

:deep(.v-overlay__content) {
  max-width: 90vw;
  max-height: 85vh;
}
</style>
