<template>
  <div class="teammate-profile d-flex align-center">
    <v-skeleton-loader class="loader" v-if="!userState || userState.status === 'loading'" type="list-item-avatar" />
    <template v-else>
      <div class="teammate-avatar-container">
        <Avatar class="teammate-avatar" :avatarID="userState.profile.avatar" :size="48" />
      </div>
      <div class="teammate-name ml-3">
        {{ userState.profile.name }}
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Avatar from '@/components/user/Avatar.vue';
import { useUserProfile } from '@/helpers/setup';

export default defineComponent({
  components: { Avatar },
  props: {
    teammateID: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { userState } = useUserProfile(props.teammateID);

    return {
      userState,
    };
  },
});
</script>

<style lang="scss" scoped>
.teammate-profile {
  padding: 4px 0;
  margin: 4px 0 !important;
}

.teammate-avatar-container {
  min-width: 48px;
  width: 48px;
  flex-shrink: 0;
}

.teammate-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
}

.teammate-name {
  max-width: 150px;
  @include text-overflow(1);
  font-weight: 600;
  font-size: 18px;
  color: var(--v-text-primary);
}

.loader {
  height: 48px;
  width: 180px;
}

:deep(.v-skeleton-loader__avatar) {
  margin: 0px;
  width: 48px !important;
  min-width: 48px !important;
  height: 48px !important;
  min-height: 48px !important;
}

:deep(.v-skeleton-loader__text) {
  margin: 0px;
  margin-left: 12px;
}
</style>
