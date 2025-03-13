<template>
  <BaseModal v-model="overlay" :error="error" :additionalError="additionalError" @close="closeModal">
    <template #header>
      <h1 class="modal-header">{{ $t('avatars.modalHeader') }}</h1>
    </template>
    <div class="avatars-container">
      <Avatar
        @click="selectAvatar(avatar)"
        :class="calculateAvatarClasses(avatar)"
        v-for="avatar in state"
        :avatarID="avatar.id"
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
import { useStore } from '@/store';

export default defineComponent({
  components: {
    BaseModal,
    Avatar,
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

      state.value = avatars;
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

    const calculateAvatarClasses = (avatar: IAvatarInfo) => {
      const classes = ['avatar-preview'];

      if (avatar.id === selectedAvatar.value) {
        classes.push('avatar-selected');
      }

      if (!avatar.available) {
        classes.push('avatar-not-available');
      }

      return classes;
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
      calculateAvatarClasses,
    };
  },
});
</script>

<style scoped lang="scss">
.form {
  display: flex;
  flex-direction: column;
}

.avatar-preview {
  width: 100px;
  height: 100px;
}

.avatar-selected {
  border: 4px solid rgb(var(--v-theme-info));
}

.avatar-not-available {
  filter: grayscale(1);
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
