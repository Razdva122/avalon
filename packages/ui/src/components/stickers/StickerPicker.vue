<template>
  <div class="sticker-control">
    <v-menu v-model="open" :close-on-content-click="false" location="top end" max-width="360">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          class="sticker-trigger"
          icon
          :class="{ 'sticker-trigger-open': open }"
          variant="text"
          :aria-label="newCount ? $t('cosmeticRewards.openWithNew', { count: newCount }) : $t('stickers.title')"
          :title="$t('stickers.title')"
          color="text-primary"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M14 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8Z" />
            <path d="M14 21v-4a3 3 0 0 1 3-3h4" />
            <circle cx="8.5" cy="9" r="1" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="9" r="1" fill="currentColor" stroke="none" />
            <path d="M8 13a4 4 0 0 0 5 2" />
          </svg>
          <span v-if="newCount" class="new-count" aria-hidden="true">{{ newCount }}</span>
        </v-btn>
      </template>
      <v-card class="picker" rounded="lg">
        <div class="picker-header">
          <strong>{{ $t('stickers.favorites') }}</strong
          ><v-btn
            icon="close"
            variant="text"
            color="text-primary"
            size="small"
            :aria-label="$t('stickers.close')"
            @click="open = false"
          />
        </div>
        <p v-if="!$store.state.profile" class="pa-3">{{ $t('stickers.login') }}</p>
        <v-progress-linear v-if="loading" indeterminate />
        <div v-if="collection" class="quick-grid">
          <button
            v-for="id in collection.favorites"
            :key="id"
            class="quick-sticker"
            :disabled="sending || remaining > 0"
            :aria-label="$t(`stickers.${id}`)"
            :title="$t(`stickers.${id}`)"
            @click="send(id)"
          >
            <StickerImage :id="id" />
          </button>
          <p v-if="!collection.favorites.length" class="pa-3">{{ $t('stickers.empty') }}</p>
        </div>
        <p v-if="remaining > 0" class="status" role="status">{{ $t('stickers.wait', { count: remaining }) }}</p>
        <p v-if="sendError || error" class="status text-error" role="alert">
          {{ $t(`stickers.${sendError || error}`) }}
        </p>
        <div v-if="$store.state.profile" class="collection-footer">
          <v-btn
            class="collection-button"
            block
            variant="flat"
            color="primary"
            prepend-icon="collections_bookmark"
            append-icon="chevron_right"
            rounded="lg"
            @click="
              open = false;
              showCollection = true;
            "
          >
            {{ $t('stickers.collection') }}
          </v-btn>
        </div>
      </v-card>
    </v-menu>
    <v-dialog v-model="showCollection" max-width="820" scrollable>
      <v-card
        ><v-card-text class="pa-0"><StickerCollection selectable @send="sendFromCollection" /></v-card-text
        ><v-card-actions
          ><v-spacer /><v-btn color="primary" @click="showCollection = false">{{
            $t('stickers.close')
          }}</v-btn></v-card-actions
        ></v-card
      >
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { socket } from '@/api/socket';
import { STICKER_COOLDOWN_MS } from '@avalon/types/user/stickers';
import { useStickers } from '@/helpers/composables/useStickers';
import StickerImage from './StickerImage.vue';
import StickerCollection from './StickerCollection.vue';
const props = defineProps<{ roomID: string }>();
const emit = defineEmits<{ (event: 'hideOnBoard', value: boolean): void }>();
const { collection, load, loading, error, newCount, markSeen } = useStickers();
const open = ref(false),
  showCollection = ref(false),
  sending = ref(false),
  sendError = ref('');
const remaining = ref(0);
let cooldown: ReturnType<typeof setInterval> | undefined;
watch(
  collection,
  (value) => {
    if (value) emit('hideOnBoard', value.hideOnBoard);
  },
  { immediate: true },
);
watch(open, (value) => {
  if (value) {
    sendError.value = '';
    void load();
  }
});
watch(showCollection, (value) => {
  if (!value) void load();
});
watch(
  () => props.roomID,
  () => {
    open.value = false;
  },
);
const startCooldown = (ms: number) => {
  clearInterval(cooldown);
  const until = Date.now() + ms;
  remaining.value = Math.ceil(ms / 1000);
  cooldown = setInterval(() => {
    remaining.value = Math.max(0, Math.ceil((until - Date.now()) / 1000));
    if (!remaining.value) clearInterval(cooldown);
  }, 250);
};
const send = async (id: string) => {
  if (sending.value || remaining.value > 0) return;
  sending.value = true;
  sendError.value = '';
  try {
    const result = await socket.timeout(10000).emitWithAck('sendSticker', props.roomID, id);
    if (result === true) {
      open.value = false;
      startCooldown(STICKER_COOLDOWN_MS);
      void markSeen([id]);
    } else {
      sendError.value = result.error;
      if (result.retryAfter) startCooldown(result.retryAfter);
    }
  } catch {
    sendError.value = 'failed';
  } finally {
    sending.value = false;
  }
};
const sendFromCollection = async (id: string) => {
  showCollection.value = false;
  open.value = true;
  await send(id);
};
onUnmounted(() => {
  clearInterval(cooldown);
});
</script>
<style scoped>
.sticker-trigger {
  width: 48px;
  min-width: 48px;
  height: 48px;
  padding: 0;
  border-radius: 14px;
  background: rgb(var(--v-theme-inset));
}
.sticker-trigger-open {
  box-shadow: inset 0 0 0 2px rgb(var(--v-theme-primary));
}
.sticker-trigger:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.picker {
  width: min(350px, calc(100vw - 24px));
  padding: 12px;
}
.collection-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.15);
}
.collection-button {
  min-height: 48px;
  height: auto;
  padding: 10px 12px;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
}
.collection-button :deep(.v-btn__content) {
  white-space: normal;
}
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 8px;
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.quick-sticker {
  height: 92px;
  padding: 6px;
  border-radius: 12px;
  transition: background 0.15s;
}
.quick-sticker:hover,
.quick-sticker:focus-visible {
  background: rgba(var(--v-theme-primary), 0.15);
  outline: 2px solid rgb(var(--v-theme-primary));
}
.quick-sticker:disabled {
  opacity: 0.4;
}
.status {
  font-size: 12px;
  text-align: center;
  padding: 8px;
}
.new-count {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 11px;
  line-height: 18px;
  font-weight: 700;
}
</style>
