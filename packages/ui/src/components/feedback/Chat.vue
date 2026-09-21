<template>
  <aside
    class="room-chat"
    :class="{ 'room-chat-open': open }"
    :style="viewportStyle"
    :aria-label="$t('chat.title')"
    @keydown.esc.stop="close"
  >
    <template v-if="open">
      <header class="chat-header">
        <div>
          <strong>{{ $t('chat.title') }}</strong
          ><span v-if="!connected" class="connection-status" role="status">{{ $t('chat.offline') }}</span>
        </div>
        <v-btn
          icon="close"
          variant="text"
          color="text-primary"
          :aria-label="$t('chat.close')"
          :title="$t('chat.close')"
          @click="close"
        />
      </header>
      <div ref="history" class="messages-container" tabindex="0" :aria-label="$t('chat.history')" @scroll="onScroll">
        <p v-if="!messages.length && !outbox.length" class="empty-chat">{{ $t('chat.empty') }}</p>
        <template v-for="(group, index) in groups" :key="group.key">
          <div v-if="isNewDay(index)" class="date-divider">{{ formatDate(group.entries[0].message.timestamp) }}</div>
          <div v-if="group.key === unreadBoundary" class="unread-divider">{{ $t('chat.unread') }}</div>
          <section class="message-group" :class="{ 'message-own': group.userID === userID }">
            <button
              class="message-author"
              type="button"
              :aria-label="$t('chat.viewAuthor', { name: authorName(group.userID) })"
              @click="selectedUser = group.userID"
            >
              <UserPreview :userID="group.userID" size="chat" />
            </button>
            <div
              v-for="entry in group.entries"
              :key="entry.key"
              :data-message-key="entry.key"
              class="message-entry"
              :class="{ 'message-highlight': highlighted === entry.key }"
            >
              <div v-if="entry.message.kind === 'sticker' && entry.message.stickerID" class="chat-sticker">
                <StickerImage :id="entry.message.stickerID" @load="onMediaLoad" />
              </div>
              <div v-else class="message-text">{{ entry.message.message }}</div>
              <time
                :datetime="new Date(entry.message.timestamp).toISOString()"
                :title="new Date(entry.message.timestamp).toLocaleString()"
                >{{ formatTime(entry.message.timestamp) }}</time
              >
            </div>
          </section>
        </template>
        <section v-for="message in outbox" :key="message.requestID" class="message-group message-own outgoing-message">
          <div class="message-text">{{ message.message }}</div>
          <span v-if="message.status === 'sending'" class="delivery-state" role="status">{{ $t('chat.sending') }}</span>
          <span v-else-if="message.status === 'failed'" class="delivery-state" role="alert"
            >{{ $t('chat.failed') }}
            <v-btn
              variant="text"
              color="text-primary"
              size="small"
              :disabled="!connected"
              @click="retry(message.requestID)"
              >{{ $t('chat.retry') }}</v-btn
            >
          </span>
          <time v-else>{{ formatTime(message.timestamp) }}</time>
        </section>
      </div>
      <div v-if="nearBottom && unread.length" class="jump-container">
        <v-btn color="primary" size="small" prepend-icon="arrow_upward" rounded @click="focusMessage(unread[0])"
          >{{ $t('chat.unread') }} · {{ unread.length }}</v-btn
        >
      </div>
      <div v-else-if="!nearBottom" class="jump-container">
        <v-btn color="primary" size="small" prepend-icon="arrow_downward" rounded @click="jumpToLatest">{{
          unread.length ? $t('chat.newMessages', { count: unread.length }) : $t('chat.latest')
        }}</v-btn>
      </div>
      <div class="sr-only" aria-live="polite" aria-atomic="true">
        {{ unread.length ? $t('chat.newMessages', { count: unread.length }) : '' }}
      </div>
    </template>
    <div class="chat-composer" :class="{ 'chat-launchers': !open }">
      <slot name="stickers" />
      <v-btn
        v-if="!open"
        ref="launcher"
        class="chat-bubble"
        color="text-primary"
        icon
        variant="text"
        :aria-label="unread.length ? $t('chat.openUnread', { count: unread.length }) : $t('chat.open')"
        :title="$t('chat.open')"
        @click="emit('update:open', true)"
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
          <path d="M21 14a3 3 0 0 1-3 3H8l-5 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z" />
          <path d="M7 8h10M7 12h7" />
        </svg>
        <span v-if="unread.length" class="unread-count">{{ unread.length > 99 ? '99+' : unread.length }}</span>
      </v-btn>
      <template v-else>
        <v-textarea
          ref="input"
          v-model="draft"
          class="chat-input"
          variant="solo-filled"
          :label="$t('chat.message')"
          rows="1"
          :max-rows="shortViewport ? 2 : 4"
          auto-grow
          hide-details
          :maxlength="2000"
          @keydown="onInputKey"
        />
        <v-btn
          class="send-button"
          icon="send"
          color="primary"
          variant="flat"
          :disabled="!draft.trim() || !connected"
          :aria-label="$t('chat.send')"
          :title="$t('chat.send')"
          @click="send"
        />
      </template>
    </div>
    <v-dialog :model-value="!!selectedUser" max-width="380" scrollable @update:model-value="selectedUser = undefined">
      <UserHoverCard v-if="selectedUser" :key="selectedUser" :userID="selectedUser" :isVisible="true" compact>
        <template #actions>
          <v-btn
            icon="close"
            variant="text"
            color="text-primary"
            :aria-label="$t('chat.closeProfile')"
            @click="selectedUser = undefined"
          />
        </template>
      </UserHoverCard>
    </v-dialog>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { ChatMessage } from '@avalon/types';
import { useI18n } from 'vue-i18n';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import eventBus from '@/helpers/event-bus';
import { groupMessages, useRoomChat } from '@/helpers/composables/useRoomChat';
import UserPreview from '@/components/user/UserPreview.vue';
import UserHoverCard from '@/components/user/UserHoverCard.vue';
import StickerImage from '@/components/stickers/StickerImage.vue';
const props = defineProps<{ roomUuid: string; messages: ChatMessage[]; open: boolean }>();
const emit = defineEmits<{ (event: 'update:open', value: boolean): void }>();
const store = useStore();
const { locale, t } = useI18n();
const userID = computed(() => store.state.profile?.id);
const authorName = (id: string) => {
  const user = store.state.users[id];
  return user?.status === 'ready' ? user.profile.name : id;
};
const draft = ref('');
const history = ref<HTMLElement>();
const input = ref<{ focus: () => void }>();
const launcher = ref<{ $el: HTMLElement }>();
const selectedUser = ref<string>();
const nearBottom = ref(true);
const unreadBoundary = ref<string>();
const highlighted = ref<string>();
const connected = ref(socket.connected);
const shortViewport = ref(false);
const viewportStyle = ref<Record<string, string>>({});
const {
  unread,
  outbox,
  receive,
  markRead,
  send: sendText,
  retry,
  reset,
} = useRoomChat(
  () => userID.value,
  (text, requestID) => socket.timeout(10000).emitWithAck('sendMessage', props.roomUuid, text, requestID),
);
const groups = computed(() => groupMessages(props.messages, unreadBoundary.value));
const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString(locale.value.replace('_', '-'), { hour: '2-digit', minute: '2-digit' });
const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString(locale.value.replace('_', '-'), { day: 'numeric', month: 'long' });
const isNewDay = (index: number) =>
  index === 0 ||
  new Date(groups.value[index - 1].entries[0].message.timestamp).toDateString() !==
    new Date(groups.value[index].entries[0].message.timestamp).toDateString();
let highlightTimer: ReturnType<typeof setTimeout> | undefined;
let observer: ResizeObserver | undefined;
let scrollFrame = 0;
const markVisible = () => {
  if (!props.open || document.hidden || selectedUser.value || !history.value) return;
  const bounds = history.value.getBoundingClientRect();
  const visible = [...history.value.querySelectorAll<HTMLElement>('[data-message-key]')]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, bounds.top);
      return visibleHeight >= Math.min(rect.height, bounds.height) * 0.6;
    })
    .map((element) => element.dataset.messageKey!);
  markRead(visible);
};
const onScroll = () => {
  const element = history.value;
  if (!element) return;
  nearBottom.value = element.scrollHeight - element.clientHeight - element.scrollTop < 48;
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(markVisible);
};
const jumpToLatest = async () => {
  await nextTick();
  if (history.value) history.value.scrollTop = history.value.scrollHeight;
  nearBottom.value = true;
  markVisible();
};
const onMediaLoad = () => {
  if (nearBottom.value) void jumpToLatest();
};
const focusMessage = async (key: string) => {
  await nextTick();
  const element = [...(history.value?.querySelectorAll<HTMLElement>('[data-message-key]') ?? [])].find(
    (element) => element.dataset.messageKey === key,
  );
  if (!element || !history.value) return false;
  const list = history.value;
  list.scrollTop += element.getBoundingClientRect().top - list.getBoundingClientRect().top - 28;
  highlighted.value = key;
  clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => (highlighted.value = undefined), 2500);
  onScroll();
  return true;
};
const showHistory = async () => {
  unreadBoundary.value = unread.value[0];
  await nextTick();
  if (unread.value.length) await focusMessage(unread.value[0]);
  else await jumpToLatest();
  history.value?.focus({ preventScroll: true });
  observer?.disconnect();
  if (history.value) observer?.observe(history.value);
};
watch(
  () => props.messages,
  async (messages) => {
    const follow = nearBottom.value;
    receive(messages);
    if (!unreadBoundary.value && unread.value.length) unreadBoundary.value = unread.value[0];
    if (props.open) {
      if (follow) await jumpToLatest();
      else {
        await nextTick();
        markVisible();
      }
    }
  },
  { immediate: true },
);
watch(
  () => props.open,
  (open) => {
    if (open) void showHistory();
    else {
      observer?.disconnect();
      unreadBoundary.value = undefined;
    }
  },
);
watch(
  () => props.roomUuid,
  () => {
    reset();
    receive(props.messages);
    draft.value = '';
    selectedUser.value = undefined;
    unreadBoundary.value = undefined;
    highlighted.value = undefined;
    nearBottom.value = true;
    if (props.open) void jumpToLatest();
  },
  { flush: 'sync' },
);
watch(userID, () => {
  reset();
  receive(props.messages);
  unreadBoundary.value = undefined;
});
watch(selectedUser, () => nextTick(markVisible));
const close = () => {
  emit('update:open', false);
  void nextTick(() => launcher.value?.$el.focus());
};
const send = async () => {
  if (!userID.value) {
    eventBus.emit('openAuthModal');
    eventBus.emit('infoMessage', t('infoMessage.loginToMessage'));
    return;
  }
  if (!draft.value.trim() || !connected.value) return;
  const text = draft.value;
  draft.value = '';
  const pending = sendText(text);
  await jumpToLatest();
  await pending;
};
const onInputKey = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    void send();
  }
};
const updateViewport = () => {
  const viewport = window.visualViewport;
  shortViewport.value = (viewport?.height ?? window.innerHeight) < 400;
  viewportStyle.value = {
    '--chat-viewport-height': `${viewport?.height ?? window.innerHeight}px`,
    '--chat-keyboard-offset': `${Math.max(0, window.innerHeight - (viewport?.height ?? window.innerHeight) - (viewport?.offsetTop ?? 0))}px`,
  };
  if (nearBottom.value && props.open) void jumpToLatest();
};
const onConnect = () => (connected.value = true);
const onDisconnect = () => (connected.value = false);
onMounted(() => {
  updateViewport();
  observer = new ResizeObserver(() => {
    if (nearBottom.value) void jumpToLatest();
    else markVisible();
  });
  window.visualViewport?.addEventListener('resize', updateViewport);
  window.visualViewport?.addEventListener('scroll', updateViewport);
  window.addEventListener('resize', updateViewport);
  document.addEventListener('visibilitychange', markVisible);
  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);
  if (props.open) void showHistory();
});
onUnmounted(() => {
  reset();
  clearTimeout(highlightTimer);
  cancelAnimationFrame(scrollFrame);
  observer?.disconnect();
  window.visualViewport?.removeEventListener('resize', updateViewport);
  window.visualViewport?.removeEventListener('scroll', updateViewport);
  window.removeEventListener('resize', updateViewport);
  document.removeEventListener('visibilitychange', markVisible);
  socket.off('connect', onConnect);
  socket.off('disconnect', onDisconnect);
});
</script>

<style scoped lang="scss">
.room-chat {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 16;
  color: rgb(var(--v-theme-text-primary));
}
.room-chat-open {
  width: 360px;
  height: min(600px, calc(100dvh - 96px));
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-text-primary), 0.18);
  border-radius: 16px;
  box-shadow: 0 8px 32px #0003;
  overflow: hidden;
}
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 8px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-text-primary), 0.12);
  flex-shrink: 0;
}
.connection-status {
  display: block;
  font-size: 12px;
}
.messages-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px;
  overflow-anchor: none;
}
.message-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.message-own {
  align-items: flex-end;
}
.message-author {
  max-width: 100%;
  min-height: 32px;
  text-align: left;
  border-radius: 6px;
}
.message-author :deep(.user-preview) {
  margin: 0;
}
.message-author :deep(.user-preview__name) {
  max-width: 245px;
  color: rgb(var(--v-theme-text-primary));
}
.message-entry {
  max-width: 88%;
  min-width: 0;
  border-radius: 12px;
}
.message-text {
  padding: 9px 12px;
  border-radius: 12px;
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 14px;
  line-height: 1.5;
  text-align: left;
}
.message-own .message-text {
  background: rgba(var(--v-theme-primary), 0.14);
}
.message-entry time,
.outgoing-message time {
  display: block;
  font-size: 11px;
  margin: 3px 4px;
  color: rgb(var(--v-theme-text-primary));
  opacity: 0.75;
}
.message-own time {
  text-align: right;
}
.message-highlight {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
.chat-sticker {
  width: 104px;
  height: 104px;
}
.date-divider,
.unread-divider {
  margin: 8px 0 16px;
  text-align: center;
  font-size: 12px;
}
.unread-divider {
  border-block: 1px solid rgba(var(--v-theme-primary), 0.4);
  padding: 6px;
  font-weight: 600;
}
.empty-chat {
  padding: 28px 12px;
  text-align: center;
  font-size: 14px;
}
.jump-container {
  display: flex;
  justify-content: center;
  padding: 6px;
}
.chat-composer {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 8px;
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.12);
  flex-shrink: 0;
}
.chat-launchers {
  padding: 0;
  border: 0;
  align-items: center;
  gap: 8px;
}
.chat-input {
  min-width: 0;
}
.chat-composer :deep(.sticker-control),
.send-button {
  flex-shrink: 0;
}
.send-button {
  width: 44px;
  height: 48px;
}
.chat-bubble {
  width: 48px;
  min-width: 48px;
  height: 48px;
  padding: 0;
  border-radius: 14px;
  background: rgb(var(--v-theme-inset));
}
.chat-bubble:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.unread-count {
  position: absolute;
  top: 0;
  right: -3px;
  padding: 2px 5px;
  min-width: 19px;
  background: #b91c1c;
  color: white;
  border-radius: 10px;
  font-size: 11px;
}
.delivery-state {
  font-size: 12px;
}
.outgoing-message > .message-text {
  max-width: 88%;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.message-author:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
@media (min-width: 1280px) {
  .room-chat-open {
    top: 80px;
    bottom: 16px;
    height: auto;
  }
}
@media (max-width: 1279px) {
  .room-chat {
    bottom: calc(16px + env(safe-area-inset-bottom) + var(--chat-keyboard-offset, 0px));
  }
  .room-chat-open {
    height: min(600px, calc(var(--chat-viewport-height, 100dvh) - 72px));
  }
}
@media (max-width: 600px) {
  .room-chat {
    right: 8px;
    bottom: calc(8px + env(safe-area-inset-bottom) + var(--chat-keyboard-offset, 0px));
  }
  .room-chat-open {
    width: calc(100vw - 16px);
    height: min(72dvh, calc(var(--chat-viewport-height, 100dvh) - 72px));
    border-radius: 16px 16px 8px 8px;
  }
  .chat-header {
    padding: 4px 8px 4px 12px;
  }
  .message-author :deep(.user-preview__name) {
    max-width: calc(100vw - 104px);
  }
}
</style>
