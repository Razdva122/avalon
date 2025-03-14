<template>
  <v-alert
    v-model="alert"
    class="alert"
    rounded="lg"
    icon="$info"
    :title="$t('alert.title' + id)"
    density="compact"
    closable
  >
    <slot></slot>
    <template v-slot:close>
      <v-btn @click="alert = false" size="regular" color="text-primary">
        <template v-slot:prepend>
          <span class="material-icons"> close </span>
        </template>
      </v-btn>
    </template>
  </v-alert>
</template>

<script lang="ts">
import { TAlertsName } from '@/store';
import { defineComponent, watch, ref, PropType } from 'vue';
import { useStore } from '@/store';

export default defineComponent({
  name: 'TemporaryAlert',
  props: {
    id: {
      type: String as PropType<TAlertsName>,
      required: true,
    },
    maxVisibleCounter: {
      type: Number,
      default: 3,
    },
  },
  setup(props) {
    const store = useStore();
    const alert = ref((store.state.alerts[props.id] ?? 0) < props.maxVisibleCounter);

    watch(alert, (newValue) => {
      if (newValue === false) {
        store.commit('updateAlertCounter', props.id);
      }
    });

    return {
      alert,
    };
  },
});
</script>

<style></style>
