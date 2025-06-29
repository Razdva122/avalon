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
    <div class="content">
      <slot></slot>
    </div>
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

<style scoped>
.alert {
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-shadow), 0.15);
  border-left: 4px solid rgb(var(--v-theme-primary));
  transition: all 0.3s ease;
}

.alert:hover {
  box-shadow: 0 6px 16px rgba(var(--v-theme-shadow), 0.2);
  transform: translateY(-2px);
}

.content {
  margin: 4px;
}

/* Стили для ссылок внутри алерта */
:deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  font-weight: bold;
  transition: all 0.2s ease;
  padding: 2px 4px;
  border-radius: 4px;
}

:deep(a:hover) {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-info));
  text-decoration: underline;
}

:deep(a:active) {
  background-color: rgba(var(--v-theme-primary), 0.2);
}

/* Пульсация для привлечения внимания к ссылкам */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(var(--v-theme-primary), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0);
  }
}

:deep(a) {
  position: relative;
  animation: pulse 2s infinite;
}
</style>
