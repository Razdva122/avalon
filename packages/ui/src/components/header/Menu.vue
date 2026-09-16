<template>
  <v-menu :eager="true">
    <template v-slot:activator="{ props }">
      <v-btn color="text-primary" size="large" variant="plain" v-bind="props">
        <template v-slot:append>
          <span class="material-icons"> menu </span>
        </template>
        {{ $t('menu.menu') }}
      </v-btn>
    </template>
    <nav>
      <LocaleLink to="/" class="menu-item">
        <span class="material-icons">home</span>
        <span class="menu-text">{{ $t('menu.home') }}</span>
      </LocaleLink>
      <LocaleLink @click="$emit('profileClick')" :to="{ name: 'profile' }" class="menu-item">
        <span class="material-icons">person</span>
        <span class="menu-text">{{ $t('menu.profile') }}</span>
      </LocaleLink>
      <LocaleLink :to="{ name: 'wiki' }" class="menu-item">
        <span class="material-icons">menu_book</span>
        <span class="menu-text">{{ $t('menu.wiki') }}</span>
      </LocaleLink>
      <LocaleLink :to="{ name: 'stats' }" class="menu-item">
        <span class="material-icons">analytics</span>
        <span class="menu-text">{{ $t('menu.stats') }}</span>
      </LocaleLink>
      <LocaleLink :to="{ name: 'leaderboard' }" class="menu-item">
        <span class="material-icons">workspace_premium</span>
        <span class="menu-text">{{ $t('menu.leaderboard') }}</span>
      </LocaleLink>
      <LocaleLink :to="{ name: 'global_achievements' }" class="menu-item">
        <span class="material-icons">emoji_events</span>
        <span class="menu-text">{{ $t('menu.achievements') }}</span>
      </LocaleLink>
      <LocaleLink :to="{ name: 'about' }" class="menu-item">
        <span class="material-icons">info</span>
        <span class="menu-text">{{ $t('menu.about') }}</span>
      </LocaleLink>
      <div class="language-links" :aria-label="$t('profile.language')">
        <template v-for="language in languageLinks" :key="language.code">
          <button
            v-if="neutralPage"
            type="button"
            :lang="language.code"
            :aria-pressed="currentLanguage === language.code"
            @click="chooseLanguage(language.code)"
          >
            {{ language.title }}
          </button>
          <router-link
            v-else
            :to="{ path: language.path, query: $route.query, hash: $route.hash }"
            :hreflang="language.code"
            :lang="language.code"
            @click="rememberChoice($event, language.code)"
          >
            {{ language.title }}
          </router-link>
        </template>
      </div>
    </nav>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, unref } from 'vue';
import { LanguageMap } from '@/helpers/i18n';
import { localizedPath, isNeutralPath } from '@/router/paths';
import { rememberLanguage, chooseLanguage } from '@/helpers/i18n/preference';

export default defineComponent({
  methods: {
    chooseLanguage,
    rememberChoice(event: MouseEvent, value: string) {
      if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey)
        rememberLanguage(value);
    },
  },
  computed: {
    currentLanguage() {
      return unref(this.$i18n.locale);
    },
    neutralPage() {
      return isNeutralPath(this.$route.path);
    },
    languageLinks() {
      const path = this.$route.path;
      return Object.entries(LanguageMap).map(([code, title]) => ({ code, title, path: localizedPath(path, code) }));
    },
  },
});
</script>

<style scoped lang="scss">
.language-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  max-width: 280px;
  padding: 14px 20px;
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.15);
  font-size: 14px;
  a,
  button {
    text-decoration: underline;
  }
}

nav {
  background-color: rgba(var(--v-theme-bg-header), 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  font-size: 18px;
  display: flex;
  align-items: stretch;
  flex-direction: column;
  overflow: hidden;
  min-width: 200px;
  margin-top: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  text-decoration: none;
  color: rgb(var(--v-theme-text-primary));
  transition: all 0.2s ease;
  position: relative;
  opacity: 0;
  transform: translateX(10px);
  animation: slideIn 0.25s ease forwards;

  .material-icons {
    font-size: 22px;
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }

  .menu-text {
    flex: 1;
  }

  &:hover {
    background-color: rgba(var(--v-theme-text-primary), 0.08);

    .material-icons {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(0.98);
  }

  &.router-link-exact-active {
    color: rgb(var(--v-theme-info));
    background-color: rgba(var(--v-theme-info), 0.1);

    .material-icons {
      opacity: 1;
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 60%;
      background: rgb(var(--v-theme-info));
      border-radius: 0 4px 4px 0;
    }
  }

  // Stagger animation for each menu item
  @for $i from 1 through 7 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.04}s;
    }
  }
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
