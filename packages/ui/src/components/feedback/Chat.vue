<template>
  <div>
    <template v-if="isHidden">
      <v-btn class="chat-bubble" density="comfortable" @click="toggleChat" icon="chat" variant="plain" color="white">
        <span class="material-icons"> chat </span>
        <div v-if="messages.length" class="pointer"></div>
      </v-btn>
    </template>
    <div v-else class="chat-window">
      <div id="messages-container" class="messages-container">
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
      <v-btn @click="toggleChat" class="close" icon="close" variant="text" density="compact" />
      <v-text-field
        class="input"
        v-model="currentMessage"
        hide-details="auto"
        label="message"
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
      currentMessage: '',
    };
  },
  watch: {
    messages() {
      this.scrollChatToBottom();
    },
  },
  methods: {
    toggleChat() {
      this.isHidden = !this.isHidden;

      if (!this.isHidden) {
        this.scrollChatToBottom();
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
        eventBus.emit('infoMessage', 'Log in to send a message');
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
  background-color: white;
  width: 300px;
  height: 450px;
  border-radius: 8px;
  padding-top: 30px;
}

.close {
  position: absolute;
  top: 4px;
  right: 4px;
}

.input {
  color: black;
}

.messages-container {
  height: calc(450px - 56px - 30px);
  color: black;
  overflow-y: scroll;
  padding: 12px;
}

.message-author {
  font-size: 10px;
  color: gray;
  padding: 5px;
}

.message-text {
  max-width: 276px;
  display: inline-block;
  word-wrap: break-word;
  border-radius: 10px;
  padding: 5px 5px 0px 5px;
  background-color: #f0f0f0;
}

.message-from-author {
  text-align: right;

  .message-author {
    color: #6e95f0;
  }

  .message-text {
    background-color: #d1e8f0;
  }
}

.pointer {
  width: 10px;
  height: 10px;
  background-color: red;
  position: absolute;
  border-radius: 50%;
  top: 10px;
  right: 10px;
}
</style>
