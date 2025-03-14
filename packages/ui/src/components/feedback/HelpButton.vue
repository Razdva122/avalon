<template>
  <div>
    <v-tooltip location="top center" origin="auto" no-click-animation>
      <template v-slot:activator="{ props: tooltip }">
        <v-btn
          v-bind="tooltip"
          @click="openInNewTab"
          density="comfortable"
          variant="plain"
          size="x-small"
          class="button-help"
          color="text-primary"
          :class="route ? 'with-route' : undefined"
        >
          <span class="material-icons"> question_mark </span>
        </v-btn>
      </template>

      <div class="content">{{ content }}</div>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    content: {
      type: String,
    },
    route: {
      type: String,
    },
  },
  methods: {
    openInNewTab() {
      if (!this.route) {
        return;
      }

      const routeData = this.$router.resolve({
        name: this.route,
      });

      window.open(routeData.href, '_blank');
    },
  },
});
</script>

<style scoped lang="scss">
.v-btn.button-help {
  padding: 0px;
  width: 36px;
  height: 36px;
  cursor: auto;
}

.content {
  font-size: 16px;
}

.v-btn.with-route {
  cursor: pointer;
}
</style>
