<template>
  <div>
    <template v-if="isHidden">
      <v-btn class="chat-bubble" density="comfortable" @click="toggleChat" icon="chat" variant="plain" color="white">
        <span class="material-icons"> chat </span>
        <div v-if="counter" class="pointer">{{ counter }}</div>
      </v-btn>
    </template>
    <div v-else class="chat-window">
      <div v-if="mode === 'full'" id="messages-container" class="messages-container">
        <div
          v-for="message in messages"
          class="message-element"
          :class="isUserMessage(message.user.id) ? 'message-from-author' : ''"
        >
          <div class="message-author">
            {{ message.user.name }}
          </div>
          <div class="message-text">
            {{ message.message }}
          </div>
        </div>
      </div>
      <v-btn
        @click="toggleMode"
        class="compact"
        :icon="mode === 'compact' ? 'arrow_upward' : 'arrow_downward'"
        variant="text"
        density="compact"
      />
      <v-btn @click="toggleChat" class="close" icon="close" variant="text" density="compact" />
      <v-text-field
        class="input"
        v-model="currentMessage"
        hide-details="auto"
        :label="$t('chat.message')"
        append-inner-icon="send"
        @keyup.enter="sendMessage"
        @click:append-inner="sendMessage"
      ></v-text-field>
    </div>
  </div>
</template>

<script lang="ts">
import { TChatMessage } from '@avalon/types';
import { defineComponent, PropType } from 'vue';
import { socket } from '@/api/socket';
import eventBus from '@/helpers/event-bus';

export default defineComponent({
  props: {
    roomUuid: {
      required: true,
      type: String,
    },
    messages: {
      required: true,
      type: Array as PropType<TChatMessage[]>,
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
    messages(current, prev) {
      this.scrollChatToBottom();

      if (this.isHidden) {
        if (current.length === 0) {
          this.counter = 0;
        } else {
          this.counter += current.length - prev.length;
        }
      }
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
      if (!this.$store.state.user) {
        eventBus.emit('openSettings');
        eventBus.emit('infoMessage', this.$t('infoMessage.loginToMessage'));
        return;
      }

      if (this.currentMessage) {
        socket.emit('sendMessage', this.roomUuid, this.currentMessage);
        this.currentMessage = '';
      }
    },
    isUserMessage(userID: string) {
      return this.$store.state.user?.id === userID;
    },
  },
});
</script>

<style scoped lang="scss">
.chat-bubble {
  width: 50px;
  height: 50px;
  background-color: rgb(var(--v-theme-info));
}

.chat-window {
  background-color: rgb(var(--v-theme-surface));
  width: 300px;
  max-height: 450px;
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

.input {
  color: rgb(var(--v-theme-surface-variant));
}

.messages-container {
  height: calc(450px - 56px - 30px);
  color: black;
  overflow-y: scroll;
  padding: 12px;
}

.message-author {
  font-size: 12px;
  color: rgb(var(--v-theme-surface-variant));
  font-weight: 800;
  padding: 8px 5px 0px 5px;
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
  text-align: right;

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
