<template>
  <BaseModal v-model="overlay" :error="error" :additionalError="additionalError" @close="closeModal">
    <template #header>
      <h1 class="modal-header">{{ $t('avatars.modalHeader') }}</h1>
    </template>
    <div class="avatars-container">
      <AvatarPreview
        v-for="avatar in state"
        :key="avatar.id"
        :isSelected="avatar.id === selectedAvatar"
        :avatar="avatar"
        :selectAvatar="selectAvatar"
      />
    </div>
  </BaseModal>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/components/user/BaseModal.vue';
import { socket } from '@/api/socket';
import { IAvatarInfo } from '@avalon/types';
import Avatar from '@/components/user/Avatar.vue';
import AvatarPreview from '@/components/user/AvatarPreview.vue';
import { useStore } from '@/store';

export default defineComponent({
  components: {
    BaseModal,
    Avatar,
    AvatarPreview,
  },
  setup() {
    const overlay = ref<boolean>(false);
    const error = ref<string>('');
    const additionalError = ref<string>('additionalError');
    const state = ref<IAvatarInfo[]>([]);
    const store = useStore();
    const { t } = useI18n();

    const selectedAvatar = computed(() => {
      return store.state.profile?.avatar;
    });

    const initState = async () => {
      const avatars = await socket.emitWithAck('getUserAvatars');

      const sortedAvatars = [...avatars].sort((a, b) => {
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        return 0;
      });

      state.value = sortedAvatars;
    };

    onMounted(() => {
      initState();
    });

    const closeModal = () => {
      overlay.value = false;
    };

    const displayModal = () => {
      overlay.value = true;
    };

    const selectAvatar = async (avatar: IAvatarInfo) => {
      if (!avatar.available) {
        error.value = 'avatarNotAvailable';
        additionalError.value = t('avatars.' + avatar.id + 'Hint');
        return;
      }

      const result = await store.dispatch('updateUserAvatar', { avatarID: avatar.id });

      if (result !== true) {
        error.value = result.error;
        additionalError.value = '';
      } else {
        error.value = '';
        additionalError.value = '';
      }
    };

    return {
      state,
      overlay,
      error,
      closeModal,
      selectedAvatar,
      additionalError,
      selectAvatar,
      displayModal,
    };
  },
});
</script>

<style scoped lang="scss">
.form {
  display: flex;
  flex-direction: column;
}

.avatars-container {
  display: flex;
  justify-content: center;
  gap: 5px;
  flex-wrap: wrap;
}

.modal-header {
  text-align: center;
}
</style>
