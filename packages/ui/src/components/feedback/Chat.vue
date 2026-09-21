<template>
  <div :class="{ 'chat-window': !isHidden }">
    <template v-if="!isHidden">
      <div v-if="mode === 'full'" id="messages-container" class="messages-container">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-element"
          :class="isUserMessage(message.userID) ? 'message-from-author' : ''"
        >
          <UserPreview class="message-author" :userID="message.userID" @click="onUserClick(message.userID)" />
          <div v-if="message.kind === 'sticker' && message.stickerID" class="chat-sticker">
            <StickerImage :id="message.stickerID" />
          </div>
          <div v-else class="message-text">{{ message.message }}</div>
        </div>
      </div>
      <v-btn
        @click="toggleMode"
        class="compact"
        :icon="mode === 'compact' ? 'arrow_upward' : 'arrow_downward'"
        variant="text"
        color="text-primary"
        density="compact"
      />
      <v-btn @click="toggleChat" class="close" icon="close" variant="text" color="text-primary" density="compact" />
    </template>
    <div class="chat-composer" :class="{ 'chat-launchers': isHidden }">
      <slot name="stickers" />
      <v-btn
        v-if="isHidden"
        class="chat-bubble"
        color="inset-reverted"
        density="comfortable"
        @click="toggleChat"
        icon="chat"
        variant="plain"
        :aria-label="$t('chat.message')"
      >
        <span class="material-icons">chat</span>
        <div v-if="counter" class="pointer">{{ counter }}</div>
      </v-btn>
      <v-text-field
        v-else
        class="input"
        variant="solo-filled"
        v-model="currentMessage"
        hide-details="auto"
        :label="$t('chat.message')"
        append-inner-icon="send"
        @keyup.enter="sendMessage"
        @click:append-inner="sendMessage"
      />
    </div>
  </div>
</template>

<script lang="ts">
import StickerImage from '@/components/stickers/StickerImage.vue';
import { ChatMessage } from '@avalon/types';
import { defineComponent, PropType } from 'vue';
import { socket } from '@/api/socket';
import eventBus from '@/helpers/event-bus';
import Avatar from '@/components/user/Avatar.vue';
import UserPreview from '@/components/user/UserPreview.vue';

export default defineComponent({
  components: {
    StickerImage,
    Avatar,
    UserPreview,
  },
  props: {
    roomUuid: {
      required: true,
      type: String,
    },
    messages: {
      required: true,
      type: Array as PropType<ChatMessage[]>,
    },
  },
  data() {
    return {
      isHidden: true,
      mode: 'full',
      currentMessage: '',
      counter: 0,
    };
  },
  watch: {
    messages: {
      handler(current, prev) {
        this.scrollChatToBottom();

        if (this.isHidden) {
          if (current.length === 0) {
            this.counter = 0;
          } else {
            this.counter += current.length - prev?.length;
          }
        }
      },
    },
  },
  methods: {
    toggleChat() {
      this.isHidden = !this.isHidden;

      if (!this.isHidden) {
        this.counter = 0;
        this.scrollChatToBottom();
      }
    },
    toggleMode() {
      if (this.mode === 'full') {
        this.mode = 'compact';
      } else {
        this.mode = 'full';
      }
    },
    scrollChatToBottom() {
      this.$nextTick(() => {
        const container = document.querySelector('#messages-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
    sendMessage() {
      if (!this.$store.state.profile) {
        eventBus.emit('openAuthModal');
        eventBus.emit('infoMessage', this.$t('infoMessage.loginToMessage'));
        return;
      }

      if (this.currentMessage) {
        socket.emit('sendMessage', this.roomUuid, this.currentMessage);
        this.currentMessage = '';
      }
    },
    onUserClick(userID: string) {
      this.$router.push({ name: 'user_stats', params: { uuid: userID } });
    },
    isUserMessage(userID: string) {
      return this.$store.state.profile?.id === userID;
    },
  },
});
</script>

<style scoped lang="scss">
.chat-bubble {
  width: 50px;
  height: 50px;
  background-color: rgb(var(--v-theme-inset));
}

.chat-window {
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-text-primary), 0.5);
  width: min(340px, calc(100vw - 10px));
  max-height: min(450px, calc(100dvh - 100px));
  border-radius: 8px;
  padding-top: 30px;
}

.close {
  position: absolute;
  top: 4px;
  right: 4px;
}

.compact {
  position: absolute;
  top: 4px;
  right: 30px;
}

.chat-composer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
}

.chat-launchers {
  gap: 8px;
  padding: 0;
}

.chat-composer :deep(.sticker-control) {
  flex: 0 0 auto;
}

.input {
  min-width: 0;
  color: rgb(var(--v-theme-surface-variant));
}

.messages-container {
  height: min(356px, calc(100dvh - 194px));
  color: black;
  overflow-y: scroll;
  padding: 12px;
}

.message-element {
  margin-bottom: 4px;
}

.message-author {
  cursor: pointer;
  font-size: 12px;
  color: rgb(var(--v-theme-surface-variant));
  font-weight: 800;
}

.message-author-avatar {
  margin-right: 4px;
  border-radius: 50%;
  width: 20px;
  height: 20px;
}

.author-container {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
  padding: 8px 0px 0px 0px;
}

.message-text {
  max-width: 276px;
  display: inline-block;
  word-wrap: break-word;
  border-radius: 10px;
  padding: 5px 5px 0px 5px;
  color: rgb(var(--v-theme-surface-variant));
  background-color: rgb(var(--v-theme-on-surface-variant));
}

.message-from-author {
  display: flex;
  flex-direction: column;
  align-items: end;
  text-align: right;

  .author-container {
    justify-content: flex-end;
  }

  .message-author {
    color: rgb(var(--v-theme-primary));
  }

  .message-text {
    background-color: rgb(var(--v-theme-on-surface-variant));
  }
}

.pointer {
  display: inline-block;
  padding: 2px 4px;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
  background-color: #e74c3c;
  border-radius: 12px;
  line-height: 1;
  position: absolute;
  top: 7px;
  right: 7px;
}
</style>

<style scoped>
.chat-sticker {
  width: 104px;
  height: 104px;
  margin: 4px 0;
}
</style>
