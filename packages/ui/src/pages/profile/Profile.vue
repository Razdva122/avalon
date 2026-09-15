<template>
  <div class="profile-page-wrapper">
    <div v-if="$store.state.profile" class="profile-page">
      <!-- Секция профиля -->
      <v-card class="profile-card mb-6" elevation="2">
        <v-card-title class="card-header">
          <span class="material-icons">person</span>
          {{ $t('profile.profile') }}
        </v-card-title>
        <v-card-text>
          <div class="profile-header">
            <Avatar @click="openAvatarModal" class="avatar" :avatarID="$store.state.profile.avatar" />
            <div class="profile-info">
              <div class="profile-name">
                {{ $store.state.profile.login }}
                <span @click="updateLogin" class="edit-icon material-icons">edit</span>
              </div>
              <div class="profile-email">
                {{ $store.state.profile.email }}
                <span @click="updateEmail" class="edit-icon material-icons">edit</span>
              </div>
              <div v-if="!ratingLoading && trueSkillRating" class="profile-rating">
                <UserTrueSkillRating :userID="$store.state.profile.id" />
              </div>
            </div>
          </div>
          <div class="profile-actions">
            <v-btn class="action-btn" size="large" @click="goToStats" variant="elevated" color="primary">
              <template v-slot:prepend>
                <span class="material-icons">analytics</span>
              </template>
              {{ $t('profile.stats') }}
            </v-btn>
            <v-btn class="action-btn" size="large" @click="goToAchievements" variant="elevated" color="primary">
              <template v-slot:prepend>
                <span class="material-icons">emoji_events</span>
              </template>
              {{ $t('menu.achievements') }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="profile-card mb-6"><StickerCollection /></v-card>

      <!-- Секция аккаунта -->
      <v-card class="profile-card mb-6" elevation="2">
        <v-card-title class="card-header">
          <span class="material-icons">manage_accounts</span>
          {{ $t('profile.account') }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            hide-details="auto"
            v-model="username"
            :label="$t('profile.username')"
            class="w-100 mb-3"
            variant="outlined"
            density="comfortable"
          >
            <template v-slot:append-inner>
              <v-btn :disabled="!updateAvailable" @click="update" size="small" variant="tonal" color="primary">
                {{ $t('profile.change') }}
              </v-btn>
            </template>
          </v-text-field>
          <v-btn variant="outlined" color="primary" @click="updatePassword" class="w-100 password-btn">
            <template v-slot:prepend>
              <span class="material-icons">lock</span>
            </template>
            {{ $t('profile.changePassword') }}
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- Секция настроек -->
      <v-card class="profile-card mb-6" elevation="2">
        <v-card-title class="card-header">
          <span class="material-icons">settings</span>
          {{ $t('profile.settings') }}
        </v-card-title>
        <v-card-text>
          <v-select
            :label="$t('profile.language')"
            :items="availableLocales"
            class="w-100 mb-3"
            v-model="locale"
            hide-details="auto"
            variant="outlined"
            density="comfortable"
          ></v-select>
          <v-select
            :label="$t('profile.colorTheme')"
            :items="availableThemes"
            class="w-100 mb-3"
            v-model="colorTheme"
            hide-details="auto"
            variant="outlined"
            density="comfortable"
          ></v-select>
          <v-select
            :label="$t('profile.imageStyle')"
            :items="availableStyles"
            class="w-100 mb-4"
            v-model="imageStyle"
            hide-details="auto"
            variant="outlined"
            density="comfortable"
          ></v-select>

          <div class="settings-divider"></div>
          <div class="settings-subtitle">{{ $t('profile.gameSettings') }}</div>

          <v-checkbox
            v-model="hideSpoilers"
            :hide-details="true"
            :label="$t('profile.hideSpoilersHint')"
            density="comfortable"
          ></v-checkbox>
          <v-checkbox
            v-model="hideIndexInHistory"
            :hide-details="true"
            :label="$t('profile.hideIndexHint')"
            density="comfortable"
          ></v-checkbox>
        </v-card-text>
      </v-card>

      <!-- Опасная зона -->
      <v-card class="profile-card danger-zone mb-4" elevation="2">
        <v-card-title class="card-header danger-header">
          <span class="material-icons">warning</span>
          {{ $t('profile.dangerZone') }}
        </v-card-title>
        <v-card-text>
          <!-- Сброс рейтинга -->
          <div v-if="!ratingLoading && trueSkillRating" class="danger-item">
            <div class="danger-info">
              <div class="danger-title">{{ $t('profile.resetRating') }}</div>
              <div class="danger-description">{{ $t('profile.resetRatingHint') }}</div>
              <div v-if="!canResetRating" class="danger-cooldown">
                {{ $t('profile.nextResetAvailable') }}: {{ formatNextResetDate }}
              </div>
            </div>
            <v-btn
              color="error"
              variant="outlined"
              @click="confirmResetRating"
              :disabled="!canResetRating"
              :loading="ratingResetLoading"
            >
              {{ $t('profile.resetRating') }}
            </v-btn>
          </div>

          <div class="settings-divider" v-if="!ratingLoading && trueSkillRating"></div>

          <!-- Выход из аккаунта -->
          <div class="danger-item">
            <div class="danger-info">
              <div class="danger-title">{{ $t('profile.logoutTitle') }}</div>
              <div class="danger-description">{{ $t('profile.logoutHint') }}</div>
            </div>
            <v-btn color="error" variant="outlined" @click="logout">
              <template v-slot:prepend>
                <span class="material-icons">logout</span>
              </template>
              {{ $t('profile.logout') }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <AvatarModal ref="avatarModal" />

    <!-- Модальное окно подтверждения сброса рейтинга -->
    <v-dialog v-model="resetRatingDialog" max-width="420px">
      <v-card class="reset-rating-dialog">
        <v-card-title class="dialog-title">
          <span class="material-icons warning-icon">warning</span>
          {{ $t('profile.resetRatingConfirmTitle') }}
        </v-card-title>
        <v-card-text class="dialog-text">
          {{ $t('profile.resetRatingConfirmText') }}
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-btn color="primary" variant="tonal" @click="resetRatingDialog = false" class="dialog-btn">
            {{ $t('modal.cancel') }}
          </v-btn>
          <v-btn color="error" variant="elevated" @click="resetRating" :loading="ratingResetLoading" class="dialog-btn">
            {{ $t('profile.resetRating') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { LanguageMap, TLanguage } from '@/helpers/i18n';
import { store } from '@/store';
import eventBus from '@/helpers/event-bus';
import { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import StickerCollection from '@/components/stickers/StickerCollection.vue';
import Avatar from '@/components/user/Avatar.vue';
import AvatarModal from '@/components/user/AvatarModal.vue';
import { socket } from '@/api/socket';
import UserTrueSkillRating from '@/components/stats/UserTrueSkillRating.vue';
import type { PlayerTrueSkillRating } from '@avalon/types';

export default defineComponent({
  name: 'Profile',
  components: {
    StickerCollection,
    Avatar,
    AvatarModal,
    UserTrueSkillRating,
  },
  data() {
    const { profile } = this.$store.state;

    return {
      username: profile?.name || '',
      availableLocales: this.$i18n.availableLocales.map((el) => ({
        value: el,
        title: LanguageMap[<TLanguage>el],
      })),
      // Добавляем новые поля для функционала сброса рейтинга
      resetRatingDialog: false,
      nextResetDate: null as Date | null,
      ratingResetLoading: false,
      trueSkillRating: null as PlayerTrueSkillRating | null,
      ratingLoading: true,
    };
  },
  mounted() {
    this.$store.dispatch('refreshProfile');
    // Добавляем проверку возможности сброса рейтинга и загрузку данных о рейтинге
    this.checkResetRatingAvailability();
  },
  computed: {
    hideSpoilers: {
      get() {
        return this.$store.state.hideSpoilers;
      },
      set(value: boolean) {
        this.$store.commit('updateHideSpoilers', value);
      },
    },
    locale: {
      get() {
        return LanguageMap[<TLanguage>(<unknown>this.$i18n.locale)];
      },
      set(value: string) {
        this.$store.commit('updateUserSettings', { key: 'locale', value: { value, isDefault: false } });
        (<unknown>this.$i18n.locale) = value;
        document.documentElement.lang = value;
      },
    },
    hideIndexInHistory: {
      get() {
        return Boolean(this.$store.state.settings?.hideIndexInHistory);
      },
      set(value: boolean) {
        this.$store.commit('updateUserSettings', { key: 'hideIndexInHistory', value });
      },
    },
    colorTheme: {
      get() {
        return this.$store.state.settings?.colorTheme || 'light';
      },
      set(value: 'light' | 'dark') {
        this.$store.commit('updateUserSettings', { key: 'colorTheme', value });
        // @ts-ignore
        this.$vuetify.theme.global.name = value === 'dark' ? 'darkTheme' : 'lightTheme';
      },
    },
    imageStyle: {
      get() {
        return this.$store.state.settings?.style || 'default';
      },
      set(value: 'default' | 'legacy' | 'anime') {
        this.$store.commit('updateUserSettings', { key: 'style', value });
      },
    },
    updateAvailable() {
      return this.username !== '' && this.$store.state.profile?.name !== this.username;
    },
    availableThemes() {
      return [
        {
          value: 'light',
          title: this.$t('profile.lightTheme'),
        },
        {
          value: 'dark',
          title: this.$t('profile.darkTheme'),
        },
      ];
    },
    availableStyles() {
      return [
        {
          value: 'default',
          title: this.$t('profile.styleDefault'),
        },
        {
          value: 'legacy',
          title: this.$t('profile.styleLegacy'),
        },
        {
          value: 'anime',
          title: this.$t('profile.styleAnime'),
        },
      ];
    },
    // Добавляем новые вычисляемые свойства для функционала сброса рейтинга
    canResetRating() {
      return !this.nextResetDate || new Date() >= new Date(this.nextResetDate);
    },

    formatNextResetDate() {
      if (!this.nextResetDate) return '';
      return new Date(this.nextResetDate).toLocaleDateString();
    },
  },
  methods: {
    openAvatarModal() {
      (this.$refs.avatarModal as typeof AvatarModal).displayModal();
    },
    logout() {
      this.$router.push({ name: 'lobby' });
      this.$store.commit('clearUserProfile');
    },
    updateEmail() {
      eventBus.emit('openCredentialsModal', 'email');
    },
    updateLogin() {
      eventBus.emit('openCredentialsModal', 'login');
    },
    updatePassword() {
      eventBus.emit('openCredentialsModal', 'password');
    },
    goToStats() {
      this.$router.push({ name: 'user_stats', params: { uuid: this.$store.state.profile!.id } });
    },
    goToAchievements() {
      this.$router.push({ name: 'user_achievements', params: { uuid: this.$store.state.profile!.id } });
    },
    update() {
      this.$store.dispatch('updateUserName', { name: this.username });
    },

    // Добавляем новые методы для функционала сброса рейтинга
    confirmResetRating() {
      this.resetRatingDialog = true;
    },

    resetRating() {
      this.ratingResetLoading = true;

      // Вызываем сокет-метод для сброса рейтинга
      if (!this.$store.state.profile) return;

      socket.emit('resetTrueSkillRating', this.$store.state.profile.id, (response) => {
        this.ratingResetLoading = false;
        this.resetRatingDialog = false;

        if (response.success) {
          // Показываем уведомление об успешном сбросе
          eventBus.emit('infoMessage', this.$t('infoMessage.ratingReset'));

          // Обновляем профиль пользователя
          this.$store.dispatch('refreshProfile');

          // Обновляем информацию о возможности сброса рейтинга
          this.checkResetRatingAvailability();
        } else {
          // Показываем уведомление об ошибке
          eventBus.emit('infoMessage', response.error || this.$t('infoMessage.ratingResetError'));

          // Если есть дата следующего возможного сброса, сохраняем её
          if (response.nextResetAvailableAt) {
            const lastResetDate = new Date(response.nextResetAvailableAt);
            const nextResetDate = new Date(lastResetDate);
            nextResetDate.setMonth(nextResetDate.getMonth() + 3);

            this.nextResetDate = nextResetDate;
          }
        }
      });
    },

    checkResetRatingAvailability() {
      if (!this.$store.state.profile) return;

      this.ratingLoading = true;

      socket.emit('getTrueSkillRating', this.$store.state.profile.id, (response) => {
        this.ratingLoading = false;

        if (response.success && response.rating) {
          this.trueSkillRating = response.rating;

          if (response.rating.lastResetAt) {
            const lastResetDate = new Date(response.rating.lastResetAt);
            const nextResetDate = new Date(lastResetDate);
            nextResetDate.setMonth(nextResetDate.getMonth() + 3);

            this.nextResetDate = nextResetDate;
          }
        }
      });
    },
  },
  beforeRouteEnter(_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) {
    if (!store.state.profile) {
      next({ name: 'lobby' });
      eventBus.emit('openAuthModal');
    } else {
      next();
    }
  },
});
</script>

<style scoped lang="scss">
.profile-page-wrapper {
  padding: 60px 20px 20px 20px;
  min-height: 100vh;
}

.profile-page {
  max-width: 600px;
  margin: 0 auto;
}

.profile-card {
  border-radius: 16px;
  overflow: hidden;
  background-color: rgb(var(--v-theme-inset));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 600;
    padding: 18px 24px;
    background: rgba(var(--v-theme-primary), 0.08);

    .material-icons {
      font-size: 24px;
      opacity: 0.8;
    }
  }

  :deep(.v-card-text) {
    padding: 24px;
  }
}

// Шапка профиля
.profile-header {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.avatar {
  cursor: pointer;
  height: 120px;
  width: 120px;
  border-radius: 16px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 2px solid rgba(var(--v-theme-primary), 0.2);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 24px rgba(var(--v-theme-primary), 0.35);
    border-color: rgba(var(--v-theme-primary), 0.4);
  }
}

.profile-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.profile-name {
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-email {
  font-size: 14px;
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-rating {
  margin-top: 4px;
}

.edit-icon {
  cursor: pointer;
  font-size: 18px;
  opacity: 0.6;
  transition: all 0.2s ease;
  padding: 4px;
  border-radius: 4px;
  color: rgb(var(--v-theme-primary));

  &:hover {
    opacity: 1;
    background-color: rgba(var(--v-theme-primary), 0.1);
  }
}

// Кнопки действий
.profile-actions {
  display: flex;
  gap: 16px;

  .action-btn {
    flex: 1;
    font-weight: 500;
    letter-spacing: 0.5px;
    box-shadow: 0 3px 8px rgba(25, 118, 210, 0.35);
    min-height: 48px;

    &:hover {
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.45);
    }
  }
}

// Кнопка изменения пароля
.password-btn {
  border-width: 2px;
  font-weight: 500;

  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
  }
}

// Настройки
.settings-divider {
  height: 1px;
  background: rgba(var(--v-theme-on-surface), 0.1);
  margin: 20px 0;
}

.settings-subtitle {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.7;
  margin-bottom: 12px;
}

// Опасная зона
.danger-zone {
  border: 1px solid rgba(var(--v-theme-error), 0.3);

  .danger-header {
    background: rgba(var(--v-theme-error), 0.1);
    color: rgb(var(--v-theme-error));

    .material-icons {
      color: rgb(var(--v-theme-error));
    }
  }
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.danger-info {
  flex: 1;
}

.danger-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.danger-description {
  font-size: 13px;
  opacity: 0.7;
}

.danger-cooldown {
  font-size: 12px;
  color: rgb(var(--v-theme-error));
  margin-top: 4px;
}

// Адаптивность
@media (max-width: 600px) {
  .profile-page-wrapper {
    padding: 50px 12px 12px 12px;
  }

  .profile-card {
    :deep(.v-card-text) {
      padding: 16px;
    }
  }

  .profile-header {
    flex-direction: row;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .avatar {
    height: 80px;
    width: 80px;
    border-radius: 12px;
  }

  .profile-info {
    gap: 4px;
    align-items: flex-start;
  }

  .profile-name {
    font-size: 20px;
    justify-content: flex-start;
  }

  .profile-email {
    font-size: 13px;
    justify-content: flex-start;
  }

  .profile-rating {
    margin-top: 2px;
  }

  .profile-actions {
    flex-direction: column;
    gap: 10px;
  }

  .action-btn {
    min-height: 44px;
  }

  .danger-item {
    flex-direction: column;
    align-items: stretch;
    text-align: center;

    .v-btn {
      width: 100%;
    }
  }
}

// Диалог сброса рейтинга
.reset-rating-dialog {
  border-radius: 16px !important;
  background-color: rgb(var(--v-theme-inset)) !important;
  overflow: hidden;

  .dialog-title {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px 12px;
    font-size: 18px;
    font-weight: 600;

    .warning-icon {
      color: rgb(var(--v-theme-warning));
      font-size: 28px;
    }
  }

  .dialog-text {
    padding: 0 24px 16px;
    font-size: 15px;
    line-height: 1.5;
    opacity: 0.85;
  }

  .dialog-actions {
    padding: 12px 24px 20px;
    gap: 12px;

    .dialog-btn {
      flex: 1;
      min-height: 44px;
    }
  }
}
</style>
