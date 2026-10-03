<template>
  <div class="reward-actions">
    <v-btn
      v-if="avatarID"
      color="primary"
      variant="tonal"
      :loading="savingAvatar"
      :disabled="savingAvatar || selected"
      @click="chooseAvatar"
      >{{ $t(selected ? 'avatars.selected' : 'cosmeticRewards.chooseAvatar') }}</v-btn
    >
    <v-btn
      v-for="id in stickerIDs"
      :key="id"
      color="primary"
      variant="tonal"
      :loading="busy && savingSticker === id"
      :disabled="busy || isFavorite(id)"
      @click="favorite(id)"
      >{{ $t(isFavorite(id) ? 'cosmeticRewards.inFavorites' : 'stickers.add') }}</v-btn
    >
    <router-link v-if="stickerIDs.length" class="collection-link" :to="{ name: 'profile', hash: '#stickers' }">
      {{ $t('stickers.collection') }}
    </router-link>
    <p v-if="full && stickerIDs.some((id) => !isFavorite(id))" class="reward-feedback">
      {{ $t('cosmeticRewards.favoriteLimit') }}
    </p>
    <p v-if="saveFailed" class="reward-feedback text-error" role="alert">{{ $t('avatars.saveFailed') }}</p>
    <p v-if="stickerError" class="reward-feedback text-error" role="alert">{{ $t('stickers.failed') }}</p>
    <p v-if="saved" class="reward-feedback" role="status">{{ $t('avatars.saved') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '@/store';
import { useStickers } from '@/helpers/composables/useStickers';
import { STICKER_FAVORITES_LIMIT } from '@avalon/types/user/stickers';
const props = withDefaults(defineProps<{ avatarID?: string; stickerIDs?: string[] }>(), { stickerIDs: () => [] });
const emit = defineEmits<{ (event: 'busy', value: boolean): void }>();
const router = useRouter();
const { collection, busy, save, markSeen } = useStickers();
const savingAvatar = ref(false),
  saveFailed = ref(false),
  saved = ref(false),
  savingSticker = ref(''),
  stickerError = ref(false);
const selected = computed(() => store.state.profile?.avatar === props.avatarID);
const full = computed(() => (collection.value?.favorites.length || 0) >= STICKER_FAVORITES_LIMIT);
const isFavorite = (id: string) => collection.value?.favorites.includes(id);
const chooseAvatar = async () => {
  if (!props.avatarID || savingAvatar.value) return;
  savingAvatar.value = true;
  saveFailed.value = false;
  saved.value = false;
  emit('busy', true);
  const owner = store.state.profile?.id;
  try {
    const result = await store.dispatch('updateUserAvatar', { avatarID: props.avatarID });
    if (owner !== store.state.profile?.id) return;
    saved.value = result === true;
    saveFailed.value = result !== true;
  } catch {
    if (owner === store.state.profile?.id) saveFailed.value = true;
  } finally {
    savingAvatar.value = false;
    emit('busy', false);
  }
};
const favorite = async (id: string) => {
  if (!collection.value || busy.value) return;
  if (full.value) {
    await router.push({ name: 'profile', hash: '#stickers' });
    return;
  }
  savingSticker.value = id;
  stickerError.value = false;
  emit('busy', true);
  try {
    if (await save([...collection.value.favorites, id])) await markSeen([id]);
    else stickerError.value = true;
  } finally {
    savingSticker.value = '';
    emit('busy', false);
  }
};
</script>

<style scoped>
.reward-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.reward-actions :deep(.v-btn) {
  min-height: 44px;
  height: auto;
  max-width: 100%;
  padding: 10px 12px;
  text-transform: none;
  letter-spacing: normal;
}
.reward-actions :deep(.v-btn__content) {
  white-space: normal;
}
.collection-link {
  padding: 10px 0;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.reward-feedback {
  flex-basis: 100%;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
</style>
