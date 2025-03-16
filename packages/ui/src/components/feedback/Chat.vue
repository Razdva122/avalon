<template>
  <div>
    <template v-if="isHidden">
      <v-btn
        class="chat-bubble"
        color="inset-reverted"
        density="comfortable"
        @click="toggleChat"
        icon="chat"
        variant="plain"
      >
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
          <div class="author-container">
            <template v-if="users[message.user.id]">
              <Avatar class="message-author-avatar" :avatarID="users[message.user.id]!.avatar" />
            </template>
            <div @click="onUserClick(message.user)" class="message-author">
              {{ users[message.user.id]?.name ?? message.user.name }}
            </div>
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
        color="text-primary"
        density="compact"
      />
      <v-btn @click="toggleChat" class="close" icon="close" variant="text" color="text-primary" density="compact" />
      <v-text-field
        class="input"
        variant="solo-filled"
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
import { ChatMessage, Dictionary, PublicUserProfile, User, UserForUI } from '@avalon/types';
import { defineComponent, PropType } from 'vue';
import { socket } from '@/api/socket';
import eventBus from '@/helpers/event-bus';
import Avatar from '@/components/user/Avatar.vue';

export default defineComponent({
  components: {
    Avatar,
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
      users: <Dictionary<PublicUserProfile | null>>{},
    };
  },
  watch: {
    messages: {
      handler(current, prev) {
        this.scrollChatToBottom();

        (<ChatMessage[]>current).forEach((message) => {
          if (this.users[message.user.id] === null || this.users[message.user.id]) {
            return;
          }

          this.users[message.user.id] = null;
          socket.emitWithAck('getUserProfile', message.user.id).then((user) => (this.users[message.user.id] = user));
        });

        if (this.isHidden) {
          if (current.length === 0) {
            this.counter = 0;
          } else {
            this.counter += current.length - prev?.length;
          }
        }
      },
      immediate: true,
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
    onUserClick(user: User) {
      this.$router.push({ name: 'user_stats', params: { uuid: user.id } });
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
