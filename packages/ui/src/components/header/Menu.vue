<template>
  <v-dialog
    v-model="open"
    eager
    class="site-menu-overlay"
    max-width="360"
    aria-labelledby="site-menu-title"
    @after-enter="resetMenu"
  >
    <template #activator="{ props }">
      <button type="button" class="menu-trigger" v-bind="props">
        <span
          v-if="newCount"
          class="new-stickers-dot"
          :aria-label="$t('cosmeticRewards.openWithNew', { count: newCount })"
        />
        {{ $t('menu.menu') }}<span class="material-icons" aria-hidden="true">menu</span>
      </button>
    </template>
    <div class="menu-panel">
      <header class="menu-heading">
        <button v-if="languageView" ref="languageBack" type="button" class="back-menu" @click="showLanguages(false)">
          <span aria-hidden="true">‹</span>{{ $t('menu.back') }}
        </button>
        <h2 id="site-menu-title">{{ languageView ? languageLabel : $t('menu.menu') }}</h2>
        <button type="button" class="close-menu" :aria-label="$t('menu.close')" @click="open = false">
          <span class="material-icons" aria-hidden="true">close</span>
        </button>
      </header>
      <nav v-show="!languageView" ref="menuContent" :aria-label="$t('menu.menu')" class="menu-content">
        <section class="mobile-navigation menu-section">
          <h3>{{ $t('menu.account') }}</h3>
          <button type="button" class="menu-item account-item" @click="openProfile">
            <Avatar v-if="$store.state.profile" :avatarID="$store.state.profile.avatar" alt="" />
            <span v-else class="material-icons" aria-hidden="true">person</span>
            <span class="account-copy">
              <strong v-if="$store.state.profile">{{ $store.state.profile.name }}</strong>
              <span>{{ $t($store.state.profile ? 'menu.myProfile' : 'menu.signInRegister') }}</span>
            </span>
          </button>
          <LocaleLink
            :to="{ name: 'wiki' }"
            class="menu-item"
            :class="{ active: active('/wiki/') }"
            @click="open = false"
          >
            <span class="material-icons" aria-hidden="true">menu_book</span>{{ $t('menu.rulesRoles') }}
          </LocaleLink>
        </section>
        <LocaleLink
          v-if="$store.state.profile"
          :to="{ name: 'profile', hash: '#stickers' }"
          class="menu-item"
          @click="open = false"
        >
          <span class="material-icons" aria-hidden="true">collections_bookmark</span
          >{{ $t('cosmeticRewards.collectionNav') }}
          <span v-if="newCount" class="new-stickers-count">{{ newCount }}</span>
        </LocaleLink>
        <section class="menu-section">
          <h3>{{ $t('menu.playersResults') }}</h3>
          <LocaleLink
            v-for="item in resultLinks"
            :key="item.name"
            :to="{ name: item.name }"
            class="menu-item"
            :class="{ active: active(item.path) }"
            @click="open = false"
          >
            <span class="material-icons" aria-hidden="true">{{ item.icon }}</span
            >{{ $t(item.label) }}
          </LocaleLink>
        </section>
        <section class="menu-section">
          <h3>{{ $t('menu.aboutAvalon') }}</h3>
          <LocaleLink
            :to="{ name: 'about' }"
            class="menu-item"
            :class="{ active: active('/about/') }"
            @click="open = false"
          >
            <span class="material-icons" aria-hidden="true">info</span>{{ $t('menu.about') }}
          </LocaleLink>
          <LocaleLink
            :to="{ name: 'support' }"
            class="menu-item"
            :class="{ active: active('/support/') }"
            @click="open = false"
          >
            <span class="material-icons" aria-hidden="true">favorite</span>{{ $t('about.supportProject') }}
          </LocaleLink>
          <div class="menu-social-links">
            <a href="https://discord.gg/DR9cEDDNdN" target="_blank" rel="noopener noreferrer"
              >Discord <span aria-hidden="true">↗</span></a
            >
            <a href="https://github.com/Razdva122/avalon" target="_blank" rel="noopener noreferrer"
              >GitHub <span aria-hidden="true">↗</span></a
            >
          </div>
        </section>
        <section class="menu-section compact-settings" :aria-label="$t('menu.settings')">
          <button ref="languageTrigger" type="button" class="language-trigger" @click="showLanguages(true)">
            <svg
              class="language-symbol"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <ellipse cx="12" cy="12" rx="4" ry="9" />
              <path d="M3 12h18" />
            </svg>
            <span>{{ languageLabel }}</span>
            <span class="current-language" :lang="currentLanguage">{{ currentLanguageTitle }}</span>
            <span aria-hidden="true">›</span>
          </button>
          <div class="theme-slot"><ThemeToggle v-if="open" /></div>
          <DevPanel />
        </section>
      </nav>
      <LanguageChoices
        v-if="languageView"
        :current-language="currentLanguage"
        :neutral="neutralPage"
        @select="selectLanguage"
        @remember="rememberChoice"
      />
    </div>
  </v-dialog>
</template>
<script lang="ts">
import { defineAsyncComponent, defineComponent, nextTick, unref } from 'vue';
import { LanguageMap } from '@/helpers/i18n';
import { isNeutralPath } from '@/router/paths';
import { rememberLanguage, chooseLanguage } from '@/helpers/i18n/preference';
import { inNavigationSection } from './navigation';
import Avatar from '@/components/user/Avatar.vue';
import DevPanel from '@/components/dev/DevPanel.vue';
import { useStickers } from '@/helpers/composables/useStickers';

export default defineComponent({
  components: {
    ThemeToggle: defineAsyncComponent(() => import('@/components/feedback/ThemeToggle.vue')),
    LanguageChoices: defineAsyncComponent(() => import('./LanguageChoices.vue')),
    Avatar,
    DevPanel,
  },
  setup: () => ({ newCount: useStickers().newCount }),
  emits: ['profileClick'],
  data: () => ({
    open: false,
    languageView: false,
    resultLinks: [
      { name: 'leaderboard', path: '/leaderboard/', icon: 'workspace_premium', label: 'menu.leaderboard' },
      { name: 'stats', path: '/stats/', icon: 'analytics', label: 'menu.stats' },
      { name: 'global_achievements', path: '/achievements/', icon: 'emoji_events', label: 'menu.achievements' },
    ],
  }),
  watch: {
    open(value: boolean) {
      if (!value) this.languageView = false;
    },
    '$route.fullPath'() {
      this.open = false;
    },
  },
  methods: {
    async showLanguages(value: boolean) {
      this.languageView = value;
      await nextTick();
      const target = this.$refs[value ? 'languageBack' : 'languageTrigger'] as HTMLElement | undefined;
      target?.focus({ preventScroll: true });
    },
    resetMenu() {
      const content = this.$refs.menuContent as HTMLElement | undefined;
      if (content) content.scrollTop = 0;
    },
    active(path: string) {
      return inNavigationSection(this.$route.path, path);
    },
    openProfile() {
      this.open = false;
      this.$emit('profileClick');
    },
    selectLanguage(value: string) {
      chooseLanguage(value);
      this.open = false;
    },
    rememberChoice(event: MouseEvent, value: string) {
      if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        rememberLanguage(value);
        this.open = false;
      }
    },
  },
  computed: {
    languageLabel() {
      return this.currentLanguage === 'en' ? 'Language' : `${this.$t('profile.language')} / Language`;
    },
    currentLanguageTitle() {
      return LanguageMap[this.currentLanguage as keyof typeof LanguageMap] || this.currentLanguage;
    },
    currentLanguage() {
      return unref(this.$i18n.locale);
    },
    neutralPage() {
      return isNeutralPath(this.$route.path);
    },
  },
});
</script>
<style scoped lang="scss">
.new-stickers-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
}
.new-stickers-count {
  margin-left: auto;
  padding: 2px 7px;
  border-radius: 12px;
  font-size: 12px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.menu-trigger,
.close-menu {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  color: rgb(var(--v-theme-text-primary));
  font-size: 14px;
}
.menu-trigger:hover,
.close-menu:hover {
  background: rgb(var(--v-theme-inset-hover));
}
.close-menu {
  width: 44px;
}
.menu-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: calc(100dvh - 80px);
  color: rgb(var(--v-theme-text-primary));
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 16px;
  overflow: hidden;
}
.menu-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 8px 20px;
  border-bottom: 1px solid rgb(var(--v-theme-surface-border));
  flex-shrink: 0;
  h2 {
    font-size: 19px;
  }
}
.menu-content {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 16px 16px;
}
.menu-section {
  padding: 14px 0;
  & + & {
    border-top: 1px solid rgb(var(--v-theme-surface-border));
  }
  h3 {
    font-size: 12px;
    font-weight: 600;
    color: rgb(var(--v-theme-text-secondary));
    margin: 0 8px 6px;
  }
}
.menu-item {
  display: flex;
  width: 100%;
  min-height: 46px;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 8px;
  text-align: left;
  text-decoration: none;
  color: inherit;
  font-size: 15px;
  line-height: 1.4;
  .material-icons {
    font-size: 21px;
    flex-shrink: 0;
    color: rgb(var(--v-theme-text-secondary));
  }
  &:hover {
    background: rgb(var(--v-theme-inset-hover));
  }
  &.active {
    background: rgb(var(--v-theme-support-button));
    color: rgb(var(--v-theme-support-accent));
  }
}
.account-item img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}
.account-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
  overflow-wrap: anywhere;
  strong {
    font-size: 15px;
  }
}
.menu-social-links {
  display: flex;
  gap: 12px;
  padding: 0 8px;
  a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    font-size: 14px;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
}
.theme-slot {
  min-height: 48px;
}
.compact-settings {
  padding: 8px 0;
}
.language-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 48px;
  padding: 8px;
  border-radius: 8px;
  text-align: left;
  font-size: 14px;
  &:hover {
    background: rgb(var(--v-theme-inset-hover));
  }
}
.language-symbol {
  height: 22px;
  width: 22px;
  flex-shrink: 0;
}
.current-language {
  margin-left: auto;
  font-size: 13px;
  color: rgb(var(--v-theme-text-secondary));
}
.back-menu {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 8px;
  font-size: 14px;
  border-radius: 8px;
  span {
    font-size: 26px;
  }
}
.menu-heading:has(.back-menu) {
  padding-left: 8px;
  gap: 4px;
  h2 {
    font-size: 15px;
    text-align: center;
  }
}
.mobile-navigation {
  display: none;
}
@media (max-width: 760px) {
  .mobile-navigation {
    display: block;
  }
  .menu-panel {
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 16px 0 0 16px;
  }
  .menu-heading {
    padding-top: max(8px, env(safe-area-inset-top));
  }
  .menu-content {
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
}
</style>
<style lang="scss">
.site-menu-overlay {
  align-items: flex-start;
  justify-content: flex-end;
}
.site-menu-overlay > .v-overlay__content {
  margin: 58px 16px 16px;
}
@media (max-width: 760px) {
  .site-menu-overlay > .v-overlay__content {
    margin: 0;
    width: min(360px, 100%);
    max-width: 100% !important;
    max-height: 100dvh;
  }
}
</style>
