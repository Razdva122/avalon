<template>
  <div class="info-page-content profile-page">
    <div v-if="$store.state.profile" class="profile-section">
      <h2>
        {{ $t('profile.profile') }}: {{ $store.state.profile.login }}
        <span @click="updateLogin" class="material-icons email-change-icon"> edit </span>
      </h2>
      <Avatar @click="openAvatarModal" class="avatar" :avatarID="$store.state.profile.avatar" />
      <v-btn class="mb-4 w-100" size="large" @click="goToStats">
        <template v-slot:prepend>
          <span class="material-icons"> insert_chart_outlined </span>
        </template>
        {{ $t('profile.stats') }}
      </v-btn>
      <v-btn class="mb-4 w-100" size="large" @click="goToAchievements">
        <template v-slot:prepend>
          <span class="material-icons"> star </span>
        </template>
        {{ $t('menu.achievements') }}
      </v-btn>
      <div class="mb-2">
        {{ $t('modal.email') }}: {{ $store.state.profile.email }}
        <span @click="updateEmail" class="material-icons email-change-icon"> edit </span>
      </div>
      <v-btn class="mb-4" @click="updatePassword">{{ $t('profile.changePassword') }}</v-btn>
      <v-text-field
        hide-details="auto"
        v-model="username"
        :label="$t('profile.username')"
        class="w-100 mb-2"
      ></v-text-field>
      <div class="d-flex justify-space-between">
        <v-btn :disabled="!updateAvailable" @click="update">{{ $t('profile.change') }}</v-btn>
        <v-btn @click="logout">{{ $t('profile.logout') }}</v-btn>
      </div>

      <!-- Добавляем новую секцию для сброса рейтинга (отображается только если у пользователя есть рейтинг) -->
      <div v-if="!ratingLoading && trueSkillRating" class="rating-reset-section mt-4">
        <h3>{{ $t('profile.resetRating') }}</h3>
        <div class="d-flex align-center mb-3">
          <p class="mr-2">{{ $t('profile.currentRating') }}:</p>
          <UserTrueSkillRating :userID="$store.state.profile.id" />
        </div>
        <p class="text-caption mb-2">{{ $t('profile.resetRatingHint') }}</p>

        <div v-if="canResetRating">
          <v-btn color="error" @click="confirmResetRating" class="mt-2" :loading="ratingResetLoading">
            {{ $t('profile.resetRating') }}
          </v-btn>
        </div>
        <div v-else class="mt-2">
          <p class="text-caption">
            {{ $t('profile.resetRatingCooldown') }}
          </p>
          <p class="text-caption">{{ $t('profile.nextResetAvailable') }}: {{ formatNextResetDate }}</p>
        </div>
      </div>
    </div>
    <div class="section-settings">
      <h2>{{ $t('profile.settings') }}</h2>
      <v-select
        :label="$t('profile.language')"
        :items="availableLocales"
        class="w-100 mb-4"
        v-model="locale"
        hide-details="auto"
      ></v-select>
      <v-select
        :label="$t('profile.colorTheme')"
        :items="availableThemes"
        class="w-100 mb-4"
        v-model="colorTheme"
        hide-details="auto"
      ></v-select>
      <v-checkbox v-model="style" :hide-details="true" :label="$t('profile.animeMode')"> </v-checkbox>
      <v-checkbox v-model="hideSpoilers" :hide-details="true" :label="$t('profile.hideSpoilersHint')"> </v-checkbox>
      <v-checkbox v-model="hideIndexInHistory" :hide-details="true" :label="$t('profile.hideIndexHint')"> </v-checkbox>
    </div>
    <AvatarModal ref="avatarModal" />

    <!-- Добавляем модальное окно подтверждения сброса рейтинга -->
    <v-dialog v-model="resetRatingDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ $t('profile.resetRatingConfirmTitle') }}</v-card-title>
        <v-card-text>
          {{ $t('profile.resetRatingConfirmText') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="resetRatingDialog = false">
            {{ $t('modal.cancel') }}
          </v-btn>
          <v-btn color="error" @click="resetRating" :loading="ratingResetLoading">
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
import Avatar from '@/components/user/Avatar.vue';
import AvatarModal from '@/components/user/AvatarModal.vue';
import { socket } from '@/api/socket';
import UserTrueSkillRating from '@/components/stats/UserTrueSkillRating.vue';
import type { PlayerTrueSkillRating } from '@avalon/types';

export default defineComponent({
  name: 'Profile',
  components: {
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
    style: {
      get() {
        return this.$store.state.settings?.style === 'anime';
      },
      set(value: boolean) {
        this.$store.commit('updateUserSettings', { key: 'style', value: value ? 'anime' : 'default' });
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
@import '@/styles/info-page.scss';

.profile-page {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
}

.email-change-icon {
  cursor: pointer;
  padding: 4px;
  font-size: 18px;
}

.avatar {
  cursor: pointer;
  height: 200px;
  width: 200px;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(var(--v-theme-text-primary), 0.5);
}

@media (max-width: 600px) {
  .profile-page {
    flex-direction: column;
  }
}

@media (min-width: 600px) {
  .profile-section,
  .section-settings {
    min-width: 45%;
  }
}

.rating-reset-section {
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.1);
  padding-top: 16px;
  margin-top: 16px;
}
</style>
