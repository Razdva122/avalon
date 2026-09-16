<template>
  <div class="profile-page-wrapper">
    <div v-if="$store.state.profile" class="profile-page">
      <h1 class="page-title">{{ $t('profile.profile') }}</h1>
      <!-- Секция профиля -->
      <v-card class="profile-card profile-summary" elevation="0">
        <v-card-text>
          <div class="profile-header">
            <button
              type="button"
              @click="openAvatarModal"
              class="avatar-button"
              :aria-label="$t('profile.changeAvatar')"
            >
              <Avatar class="avatar" :avatarID="$store.state.profile.avatar" />
              <span class="avatar-edit"><span class="material-icons" aria-hidden="true">photo_camera</span></span>
            </button>
            <div class="profile-info">
              <h2 class="profile-name">{{ $store.state.profile.name || $store.state.profile.login }}</h2>
              <div class="profile-login">{{ $store.state.profile.login }}</div>
              <button type="button" @click="openAvatarModal" class="avatar-link">
                {{ $t('profile.changeAvatar') }}
              </button>
              <div v-if="!ratingLoading && trueSkillRating" class="profile-rating">
                <UserTrueSkillRating :userID="$store.state.profile.id" />
              </div>
            </div>
          </div>
          <div class="profile-actions">
            <v-btn class="action-btn" size="large" @click="goToStats" variant="tonal" color="primary">
              <template v-slot:prepend>
                <span class="material-icons">analytics</span>
              </template>
              {{ $t('profile.stats') }}
            </v-btn>
            <v-btn class="action-btn" size="large" @click="goToAchievements" variant="tonal" color="primary">
              <template v-slot:prepend>
                <span class="material-icons">emoji_events</span>
              </template>
              {{ $t('menu.achievements') }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <div class="profile-grid">
        <!-- Секция аккаунта -->
        <v-card class="profile-card" elevation="0">
          <v-card-title tag="h2" class="card-header">
            <span class="material-icons">manage_accounts</span>
            {{ $t('profile.account') }}
          </v-card-title>
          <v-card-text>
            <form class="name-form" @submit.prevent="update">
              <v-text-field
                hide-details="auto"
                v-model="username"
                :label="$t('profile.username')"
                class="name-field"
                autocomplete="nickname"
                variant="outlined"
                density="comfortable"
              >
              </v-text-field>
              <v-btn :disabled="!updateAvailable" type="submit" variant="tonal" color="primary" class="save-name">
                {{ $t('profile.change') }}
              </v-btn>
            </form>
            <div class="credential-row">
              <div class="credential-info">
                <span class="field-label">{{ $t('modal.login') }}</span
                ><span>{{ $store.state.profile.login }}</span>
              </div>
              <v-btn variant="text" color="primary" @click="updateLogin" :aria-label="$t('modal.changelogin')">{{
                $t('profile.change')
              }}</v-btn>
            </div>
            <div class="credential-row">
              <div class="credential-info">
                <span class="field-label">{{ $t('modal.email') }}</span
                ><span>{{ $store.state.profile.email }}</span>
              </div>
              <v-btn variant="text" color="primary" @click="updateEmail" :aria-label="$t('modal.changeemail')">{{
                $t('profile.change')
              }}</v-btn>
            </div>
            <v-btn variant="outlined" color="primary" @click="updatePassword" class="w-100 password-btn">
              <template v-slot:prepend>
                <span class="material-icons">lock</span>
              </template>
              {{ $t('profile.changePassword') }}
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Секция настроек -->
        <v-card class="profile-card" elevation="0">
          <v-card-title tag="h2" class="card-header">
            <span class="material-icons">settings</span>
            {{ $t('profile.settings') }}
          </v-card-title>
          <v-card-text>
            <p class="section-hint">{{ $t('profile.autoSaveHint') }}</p>
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

            <v-switch
              color="primary"
              inset
              v-model="hideSpoilers"
              :hide-details="true"
              :label="$t('profile.hideSpoilersHint')"
              density="comfortable"
            ></v-switch>
            <v-switch
              color="primary"
              inset
              v-model="hideIndexInHistory"
              :hide-details="true"
              :label="$t('profile.hideIndexHint')"
              density="comfortable"
            ></v-switch>
          </v-card-text>
        </v-card>
      </div>
      <v-card class="profile-card collection-card" elevation="0"><StickerCollection /></v-card>

      <v-card class="profile-card session-card" elevation="0">
        <v-card-text class="danger-item">
          <div class="danger-info">
            <h2 class="danger-title">{{ $t('profile.logoutTitle') }}</h2>
            <div class="danger-description">{{ $t('profile.logoutHint') }}</div>
          </div>
          <v-btn color="primary" variant="outlined" @click="logout" prepend-icon="logout">{{
            $t('profile.logout')
          }}</v-btn>
        </v-card-text>
      </v-card>
      <!-- Опасная зона -->
      <v-card v-if="!ratingLoading && trueSkillRating" class="profile-card danger-zone" elevation="0">
        <v-card-title tag="h2" class="card-header danger-header">
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
import { localizedPath } from '@/router/paths';
import { i18n } from '@/plugins/i18n';
import { rememberLanguage } from '@/helpers/i18n/preference';
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
    const initialName = this.username;
    this.$store.dispatch('refreshProfile').then(() => {
      if (this.username === initialName) this.username = this.$store.state.profile?.name || '';
    });
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
        return this.$i18n.locale;
      },
      set(value: string) {
        const language = rememberLanguage(value);
        if (language) i18n.global.locale.value = language;
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
      return this.username.trim() !== '' && this.$store.state.profile?.name !== this.username.trim();
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
      this.$router.push(localizedPath('/', i18n.global.locale.value));
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
      if (!this.updateAvailable) return;
      this.username = this.username.trim();
      this.$store.dispatch('updateUserName', { name: this.username });
    },

    // Добавляем новые методы для функционала сброса рейтинга
    confirmResetRating() {
      this.resetRatingDialog = true;
    },

    resetRating() {
      if (!this.$store.state.profile || this.ratingResetLoading || !this.canResetRating) return;
      this.ratingResetLoading = true;

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
      next(localizedPath('/', i18n.global.locale.value));
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
  max-width: 1040px;
  margin: 0 auto;
  display: grid;
  gap: 24px;
}

.profile-card {
  border-radius: 16px;
  overflow: hidden;
  background-color: rgb(var(--v-theme-inset));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: none;
  min-width: 0;

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 600;
    padding: 18px 24px;
    white-space: normal;

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
  margin-bottom: 0;
  align-items: center;
}

.avatar {
  display: block;
  height: 104px;
  width: 104px;
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
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.profile-name {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.profile-login {
  color: rgba(var(--v-theme-on-surface), 0.65);
  overflow-wrap: anywhere;
}
.profile-rating {
  margin-top: 4px;
}

// Кнопки действий
.profile-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .action-btn {
    flex: 1;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
    box-shadow: none;
    min-height: 48px;
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
  font-size: 16px;
  font-weight: 600;
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
    padding: 50px 12px 24px;
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
    margin-bottom: 0;
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
    text-align: left;

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

.page-title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}
.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}
.profile-summary :deep(.v-card-text) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
}
.avatar-button {
  position: relative;
  flex-shrink: 0;
  border-radius: 16px;
  cursor: pointer;
}
.avatar-edit {
  position: absolute;
  right: -4px;
  bottom: -4px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border: 3px solid rgb(var(--v-theme-inset));
}
.avatar-edit .material-icons {
  font-size: 18px;
}
.avatar-link {
  align-self: flex-start;
  min-height: 44px;
  text-align: left;
  color: rgb(var(--v-theme-primary));
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.avatar-link:hover {
  text-decoration: underline;
}
.avatar-button:focus-visible,
.avatar-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 4px;
}
.name-form {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}
.name-field {
  min-width: 0;
}
.save-name {
  min-height: 48px;
}
.credential-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}
.credential-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
  overflow-wrap: anywhere;
}
.field-label,
.section-hint {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 13px;
}
.section-hint {
  margin-bottom: 20px;
  line-height: 1.5;
}
.password-btn {
  margin-top: 12px;
  min-height: 44px;
}
.profile-page :deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0;
  min-height: 44px;
}
.profile-page :deep(.v-btn__content) {
  white-space: normal;
}
.profile-page :deep(.v-selection-control__input) {
  flex-shrink: 0;
}
@media (max-width: 760px) {
  .profile-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
  .profile-page {
    gap: 20px;
  }
  .profile-summary :deep(.v-card-text) {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
  .profile-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .profile-actions .action-btn {
    flex: 1 1 160px;
  }
}
@media (max-width: 400px) {
  .name-form {
    flex-direction: column;
    align-items: stretch;
  }
  .profile-header {
    align-items: flex-start;
  }
  .profile-name {
    font-size: 22px;
  }
}
</style>
