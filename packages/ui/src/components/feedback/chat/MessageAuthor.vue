<template>
  <div class="author-container d-flex align-center">
    <v-skeleton-loader class="loader" v-if="!author || author.status === 'loading'" type="list-item-avatar" />
    <template v-else>
      <Avatar class="author-avatar" :avatarID="author.profile.avatar" :size="24" />
      <div class="author-name ml-2">
        {{ author.profile.name }}
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import Avatar from '@/components/user/Avatar.vue';
import { useStore } from '@/store';

export default defineComponent({
  components: { Avatar },
  props: {
    authorID: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();

    store.dispatch('getUserPublicProfile', { uuid: props.authorID });

    const author = computed(() => {
      return store.state.users[props.authorID];
    });

    return {
      author,
    };
  },
});
</script>

<style scoped>
.author-container {
  margin-bottom: 4px;
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
}

.author-name {
  font-weight: 500;
  font-size: 14px;
  color: var(--v-text-primary);
}

.loader {
  height: 24px;
  width: 100px;
}

:deep(.v-skeleton-loader__avatar) {
  margin: 0px;
  width: 24px !important;
  min-width: 24px !important;
  height: 24px !important;
  min-height: 24px !important;
}

:deep(.v-skeleton-loader__text) {
  margin: 0px;
  margin-left: 8px;
}
</style>
