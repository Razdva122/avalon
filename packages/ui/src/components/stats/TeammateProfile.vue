<template>
  <div class="teammate-profile d-flex align-center">
    <v-skeleton-loader class="loader" v-if="!userState || userState.status === 'loading'" type="list-item-avatar" />
    <template v-else>
      <div class="teammate-avatar-container">
        <Avatar class="teammate-avatar" :avatarID="userState.profile.avatar" />
      </div>
      <div class="teammate-name">
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

  @media (max-width: 600px) {
    padding: 2px 0;
    margin: 2px 0 !important;
  }
}

.teammate-avatar-container {
  min-width: 48px;
  width: 48px;
  flex-shrink: 0;

  @media (max-width: 600px) {
    min-width: 36px;
    width: 36px;
  }
}

.teammate-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;

  @media (max-width: 600px) {
    width: 36px;
    height: 36px;
  }
}

.teammate-name {
  max-width: 150px;
  @include text-overflow(1);
  font-weight: 600;
  font-size: 18px;
  color: var(--v-text-primary);
  margin-left: 12px;

  @media (max-width: 600px) {
    max-width: 90px;
    font-size: 14px;
    margin-left: 8px;
  }
}

.loader {
  height: 48px;
  width: 180px;

  @media (max-width: 600px) {
    height: 36px;
    width: 140px;
  }
}

:deep(.v-skeleton-loader__avatar) {
  margin: 0px;
  width: 48px !important;
  min-width: 48px !important;
  height: 48px !important;
  min-height: 48px !important;

  @media (max-width: 600px) {
    width: 36px !important;
    min-width: 36px !important;
    height: 36px !important;
    min-height: 36px !important;
  }
}

:deep(.v-skeleton-loader__text) {
  margin: 0px;
  margin-left: 12px;

  @media (max-width: 600px) {
    margin-left: 8px;
  }
}
</style>
