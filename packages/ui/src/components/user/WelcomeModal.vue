<template>
  <v-dialog v-model="open" max-width="820" aria-labelledby="welcome-title" class="welcome-dialog" scrollable>
    <v-card class="welcome-card" elevation="0">
      <div class="welcome-chrome">
        <span class="welcome-confirmation">
          <v-icon icon="check_circle" size="16" aria-hidden="true" />
          {{ $t('welcome.accountCreated') }}
        </span>
        <v-btn
          class="welcome-close"
          icon="close"
          variant="text"
          color="text-primary"
          :aria-label="$t('infoMessage.close')"
          @click="close"
        />
      </div>

      <div class="welcome-body">
        <header class="welcome-header">
          <h1 id="welcome-title">{{ $t('welcome.title') }}</h1>
          <div class="welcome-art" aria-hidden="true"></div>
        </header>

        <div class="welcome-options">
          <section
            class="welcome-option"
            :class="{ 'welcome-option--recommended': aiAvailability === 'available' }"
            aria-labelledby="welcome-ai-title"
          >
            <span class="welcome-icon"><v-icon icon="fa:fa-solid fa-robot" size="24" aria-hidden="true" /></span>
            <div class="welcome-option-copy">
              <h2 id="welcome-ai-title">{{ $t('welcome.aiTitle') }}</h2>
              <p>{{ $t('welcome.aiDescription') }}</p>
            </div>
            <BotRoomButton
              beginner
              color="primary"
              hide-icon
              inline-errors
              :unavailable-text="$t('welcome.aiUnavailable')"
              :busy-text="$t('welcome.aiBusy')"
              :loading-text="$t('welcome.aiChecking')"
              :error-text="$t('welcome.aiAccessError')"
              :disabled="busy"
              @availability="aiAvailability = $event"
              @busy="setAiBusy"
              @error="aiError = $event"
              @opened="close"
            >
              {{ $t('welcome.aiAction') }}
            </BotRoomButton>
          </section>

          <section
            class="welcome-option"
            :class="{ 'welcome-option--recommended': recommendCompany }"
            aria-labelledby="welcome-board-title"
          >
            <span class="welcome-icon"><v-icon icon="groups" size="24" aria-hidden="true" /></span>
            <div class="welcome-option-copy">
              <h2 id="welcome-board-title">{{ $t('welcome.boardTitle') }}</h2>
              <p>{{ $t('welcome.boardDescription') }}</p>
            </div>
            <v-btn
              :to="communityPath"
              :disabled="busy"
              color="primary"
              :variant="recommendCompany ? 'flat' : 'outlined'"
              @click="close"
            >
              {{ $t('welcome.boardAction') }}
            </v-btn>
          </section>

          <section class="welcome-option" aria-labelledby="welcome-friends-title">
            <span class="welcome-icon"><v-icon icon="meeting_room" size="24" aria-hidden="true" /></span>
            <div class="welcome-option-copy">
              <h2 id="welcome-friends-title">{{ $t('welcome.friendsTitle') }}</h2>
              <p>{{ $t('welcome.friendsDescription') }}</p>
              <span class="welcome-player-count">{{ $t('welcome.friendsPlayerCount') }}</span>
            </div>
            <v-btn color="primary" variant="outlined" :loading="creating" :disabled="busy" @click="createRoom">
              {{ $t('welcome.friendsAction') }}
            </v-btn>
          </section>
        </div>

        <p v-if="busy" class="welcome-status" role="status">
          {{ $t(aiBusy ? 'welcome.aiOpening' : 'welcome.roomOpening') }}
        </p>
        <p v-if="error || aiError" class="welcome-error" role="alert">{{ error ? $t('errors.' + error) : aiError }}</p>
      </div>

      <footer class="welcome-footer">
        <v-btn variant="text" color="text-primary" @click="close">{{ $t('welcome.later') }}</v-btn>
      </footer>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, unref } from 'vue';
import { socket } from '@/api/socket';
import { localizedPath } from '@/router/paths';
import { openRoomRoute } from '@/helpers/open-room-route';
import BotRoomButton from '@/pages/lobby/BotRoomButton.vue';

export default defineComponent({
  components: { BotRoomButton },
  props: { modelValue: Boolean },
  emits: ['update:modelValue'],
  data() {
    return {
      creating: false,
      aiBusy: false,
      aiAvailability: 'loading' as 'available' | 'loading' | 'unavailable' | 'error',
      error: '',
      aiError: '',
      dismissed: false,
    };
  },
  computed: {
    open: {
      get(): boolean {
        return this.modelValue;
      },
      set(value: boolean) {
        if (!value) this.close();
      },
    },
    busy(): boolean {
      return this.creating || this.aiBusy;
    },
    recommendCompany(): boolean {
      return this.aiAvailability === 'unavailable' || this.aiAvailability === 'error';
    },
    communityPath(): string {
      return localizedPath(this.$router.resolve({ name: 'community_group' }).path, unref(this.$i18n.locale));
    },
  },
  beforeUnmount() {
    this.dismissed = true;
  },
  methods: {
    setAiBusy(value: boolean) {
      this.aiBusy = value;
      if (value) {
        this.aiError = '';
        this.error = '';
      }
    },
    close() {
      if (this.dismissed) return;
      this.dismissed = true;
      this.$emit('update:modelValue', false);
    },
    async createRoom() {
      if (this.dismissed || this.busy) return;
      this.creating = true;
      this.error = '';
      this.aiError = '';
      try {
        const result = await socket.timeout(10000).emitWithAck('createRoom');
        if (this.dismissed) return;
        if (typeof result !== 'string') {
          this.error = result.error;
          return;
        }
        const opened = await openRoomRoute(this.$router, result, () => !this.dismissed);
        if (opened) this.close();
      } catch {
        if (!this.dismissed) this.error = 'requestFailed';
      } finally {
        this.creating = false;
      }
    },
  },
});
</script>

<style scoped lang="scss">
.welcome-dialog :deep(.v-overlay__content:focus-visible) {
  outline: none;
}
.welcome-card {
  display: flex;
  flex-direction: column;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 20px !important;
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
}
.welcome-chrome {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px 0 28px;
}
.welcome-confirmation {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgb(var(--v-theme-text-secondary));
  font-size: 13px;
}
.welcome-close {
  width: 44px;
  height: 44px;
}
.welcome-body {
  overflow-y: auto;
  padding: 0 28px;
  scroll-padding-block: 12px;
}
.welcome-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 4px 0 20px;
  h1 {
    max-inline-size: 22ch;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.035em;
    text-wrap: balance;
  }
}
.welcome-art {
  flex: 0 0 60px;
  height: 76px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-primary), 0.35);
  background-image: getAvatarPathByID('roles', 'merlin');
  background-size: cover;
  background-position: center 20%;
}
.welcome-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.welcome-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px 16px 16px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 12px;
  h2 {
    font-size: 18px;
    line-height: 1.35;
    text-wrap: balance;
  }
  p {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: rgb(var(--v-theme-text-secondary));
  }
  .v-btn {
    width: 100%;
    min-height: 44px;
    height: auto;
    padding: 10px 8px;
    text-transform: none;
    letter-spacing: 0;
    font-size: 14px;
    font-weight: 600;
  }
  :deep(.v-btn__content) {
    white-space: normal;
  }
}
.welcome-option--recommended {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.045);
}
.welcome-option-copy {
  flex: 1;
  margin: 12px 0 20px;
}
.welcome-player-count {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: rgb(var(--v-theme-text-secondary));
}
.welcome-icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: rgb(var(--v-theme-primary));
}
.welcome-status,
.welcome-error {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.5;
}
.welcome-status {
  color: rgb(var(--v-theme-text-secondary));
}
.welcome-error {
  color: rgb(var(--v-theme-error));
}
.welcome-footer {
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  padding: 12px 20px;
  .v-btn {
    min-height: 44px;
    text-transform: none;
    letter-spacing: 0;
  }
}
.welcome-card :deep(.v-btn:focus-visible) {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
@media (max-width: 700px) {
  .welcome-dialog :deep(.v-overlay__content) {
    width: calc(100% - 32px);
    max-width: calc(100% - 32px);
    max-height: calc(100dvh - 32px);
    margin: 16px;
  }
  .welcome-chrome {
    padding-left: 20px;
  }
  .welcome-body {
    padding: 0 20px;
  }
  .welcome-header {
    padding: 4px 0 16px;
    gap: 12px;
    h1 {
      font-size: 26px;
    }
  }
  .welcome-art {
    flex-basis: 44px;
    height: 56px;
  }
  .welcome-options {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .welcome-option {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 8px 12px;
    padding: 12px;
    h2 {
      font-size: 17px;
    }
    p {
      margin-top: 4px;
    }
    .v-btn {
      grid-column: 1 / -1;
    }
  }
  .welcome-icon {
    width: 24px;
    height: 24px;
  }
  .welcome-option-copy {
    margin: 0;
  }
  .welcome-footer {
    padding: 8px 20px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .welcome-dialog :deep(.v-overlay__content),
  .welcome-card :deep(.v-btn) {
    transition: none !important;
    animation: none !important;
  }
}
</style>
