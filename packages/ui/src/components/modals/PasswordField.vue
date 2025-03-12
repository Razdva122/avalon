<template>
  <v-text-field
    v-model="passwordValue"
    :autocomplete="autocomplete"
    :append-inner-icon="visible ? 'visibility_off' : 'visibility'"
    :type="visible ? 'text' : 'password'"
    :rules="rules"
    :label="label"
    :hint="hint"
    :counter="counter"
    class="w-100 mb-2"
    @click:append-inner="visible = !visible"
    @input="$emit('update:modelValue', passwordValue)"
  ></v-text-field>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'PasswordField',
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
      default: 'password',
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      visible: false,
      passwordValue: this.modelValue,
    };
  },
  watch: {
    modelValue(newValue) {
      this.passwordValue = newValue;
    },
  },
});
</script>
