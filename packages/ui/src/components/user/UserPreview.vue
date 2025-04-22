<template>
  <div class="user-preview d-flex align-center" :class="[`user-preview--${size}`]" @click="$emit('click')">
    <v-skeleton-loader class="loader" v-if="!userState || userState.status === 'loading'" type="list-item-avatar" />
    <template v-else>
      <Avatar class="user-preview__avatar" :avatarID="userState.profile.avatar" />
      <div class="user-preview__name ml-2">
        {{ userState.profile.name }}
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import Avatar from '@/components/user/Avatar.vue';
import { useUserProfile } from '@/helpers/composables';

export default defineComponent({
  components: { Avatar },
  props: {
    userID: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      default: 'medium', // 'small', 'medium', 'large'
      validator: (value: string) => ['small', 'medium', 'large'].includes(value),
    },
  },
  emits: ['click'],
  setup(props) {
    const { userState } = useUserProfile(props.userID);

    return {
      userState,
    };
  },
});
</script>

<style scoped lang="scss">
.user-preview {
  margin-bottom: 4px;
}

.user-preview__avatar {
  border-radius: 50%;
  overflow: hidden;
}

.user-preview__name {
  font-weight: 500;
  color: var(--v-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Size variants */
.user-preview[class*='small'] {
  .user-preview__name {
    font-size: 12px;
    max-width: 60px;
  }

  .user-preview__avatar {
    width: 20px;
    height: 20px;
  }
}

.user-preview[class*='medium'] {
  .user-preview__name {
    font-size: 14px;
    max-width: 70px;
  }

  .user-preview__avatar {
    width: 24px;
    height: 24px;
  }
}

.user-preview[class*='large'] {
  .user-preview__name {
    font-size: 16px;
    max-width: 80px;
  }

  .user-preview__avatar {
    width: 28px;
    height: 28px;
  }
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
