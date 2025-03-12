<template>
  <v-text-field
    v-model="fieldValue"
    :autocomplete="autocomplete"
    :rules="rules"
    :label="label"
    :hint="hint"
    :counter="counter"
    :type="type"
    class="w-100 mb-2"
    @input="$emit('update:modelValue', fieldValue)"
  ></v-text-field>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'TextField',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      required: true,
    },
    rules: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    hint: {
      type: String,
      default: '',
    },
    counter: {
      type: Boolean,
      default: false,
    },
    autocomplete: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'text',
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      fieldValue: this.modelValue,
    };
  },
  watch: {
    modelValue(newValue) {
      this.fieldValue = newValue;
    },
  },
});
</script>
