<template>
  <main class="community-page">
    <header class="community-hero">
      <nav class="community-breadcrumbs" :aria-label="t('community.title')">
        <LocaleLink :to="{ name: 'lobby' }">{{ t('menu.home') }}</LocaleLink
        ><span aria-hidden="true">/</span
        ><LocaleLink :to="{ name: 'community' }" :aria-current="activeTab === 'servers' ? 'page' : undefined">{{
          t('community.title')
        }}</LocaleLink
        ><template v-if="activeTab !== 'servers'"
          ><span aria-hidden="true">/</span
          ><span aria-current="page">{{
            t(`playerBoards.${activeTab === 'solo' ? 'seoSoloTitle' : 'seoGroupTitle'}`)
          }}</span></template
        >
      </nav>
      <p class="eyebrow">AVALON · {{ t('community.eyebrow') }}</p>
      <h1>
        {{
          t(
            activeTab === 'servers'
              ? 'community.title'
              : `playerBoards.${activeTab === 'solo' ? 'seoSoloTitle' : 'seoGroupTitle'}`,
          )
        }}
      </h1>
      <p class="intro">
        {{
          t(
            activeTab === 'servers'
              ? 'community.intro'
              : `playerBoards.${activeTab === 'solo' ? 'seoSoloIntro' : 'seoGroupIntro'}`,
          )
        }}
      </p>
    </header>

    <div class="community-tabs" role="tablist" :aria-label="t('community.title')">
      <LocaleLink
        v-for="tab in tabs"
        :id="`community-tab-${tab.value}`"
        :key="tab.value"
        :to="{ name: tab.route }"
        role="tab"
        :aria-selected="activeTab === tab.value"
        :aria-controls="`community-panel-${tab.value}`"
        :tabindex="activeTab === tab.value ? 0 : -1"
        @keydown="onTabKey($event, tab.value)"
      >
        {{ t(tab.label) }}
      </LocaleLink>
    </div>

    <section
      v-show="activeTab === 'servers'"
      id="community-panel-servers"
      role="tabpanel"
      aria-labelledby="community-tab-servers"
      tabindex="0"
    >
      <div class="section-heading">
        <h2 id="servers-title">{{ t('community.servers') }}</h2>
        <span class="server-count">{{ communityServers.length }}</span>
      </div>
      <ul class="server-list">
        <li v-for="{ server } in directoryEntries" :key="server?.id ?? 'promotion'">
          <article v-if="server" class="server-card" :aria-labelledby="`server-${server.id}`">
            <img class="server-logo" :src="server.logo" alt="" width="88" height="88" />
            <div class="server-details">
              <div class="server-heading">
                <h3 :id="`server-${server.id}`">{{ server.name }}</h3>
                <span v-if="server.official" class="official" :aria-label="t('community.official')">
                  <span class="material-icons" aria-hidden="true">verified</span>
                  Official
                </span>
              </div>
              <p class="description">{{ t(server.descriptionKey) }}</p>
              <ul class="language-tags" :aria-label="t('community.languages')">
                <li v-for="language in server.languages" :key="language.code" :lang="language.code">
                  <span aria-hidden="true">{{ languageFlags[language.code] }}</span> {{ language.label }}
                </li>
              </ul>
            </div>
            <a
              class="join-link"
              :href="server.messenger.url"
              target="_blank"
              :rel="server.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'"
            >
              <v-icon :icon="server.messenger.icon" size="20" aria-hidden="true" />
              {{ t('community.join', { messenger: server.messenger.name }) }}
              <span class="material-icons" aria-hidden="true">north_east</span>
              <span class="sr-only">{{ t('community.newTab') }}</span>
            </a>
          </article>
          <aside v-else class="resource-promotion" aria-labelledby="promotion-title">
            <div class="promotion-heading">
              <span class="promotion-label"
                ><span class="material-icons" aria-hidden="true">campaign</span
                >{{ t('community.promotionLabel') }}</span
              >
              <span class="promotion-price">$50+</span>
            </div>
            <h3 id="promotion-title">{{ t('community.promotionTitle') }}</h3>
            <p>{{ t('community.promotionText') }}</p>
            <div class="promotion-footer">
              <LocaleLink class="promotion-link" :to="{ name: 'support' }">
                {{ t('community.promotionAction') }}
                <span class="material-icons" aria-hidden="true">arrow_forward</span>
              </LocaleLink>
              <span class="promotion-note">{{ t('community.promotionNote') }}</span>
            </div>
          </aside>
        </li>
      </ul>
    </section>
    <section
      v-for="board in boardKinds"
      v-show="activeTab === board"
      :id="`community-panel-${board}`"
      :key="board"
      role="tabpanel"
      :aria-labelledby="`community-tab-${board}`"
      tabindex="0"
    >
      <PlayerBoards v-if="activeTab === board" :kind="board" />
    </section>
    <section class="discovery-guide" aria-labelledby="discovery-title">
      <h2 id="discovery-title">{{ t('playerBoards.discoveryTitle') }}</h2>
      <p>{{ t('playerBoards.discoveryHow') }}</p>
      <p>{{ t(activeTab === 'group' ? 'playerBoards.discoveryGroup' : 'playerBoards.discoverySolo') }}</p>
      <p>{{ t('playerBoards.discoveryLifetime') }}</p>
      <nav class="discovery-links" :aria-label="t('community.title')">
        <LocaleLink :to="{ name: 'community_solo' }">{{ t('playerBoards.seoSoloTitle') }}</LocaleLink
        ><LocaleLink :to="{ name: 'community_group' }">{{ t('playerBoards.seoGroupTitle') }}</LocaleLink>
      </nav>
      <h3>{{ t('playerBoards.discoveryNew') }}</h3>
      <p>{{ t('playerBoards.discoveryLearn') }}</p>
      <nav class="discovery-links" :aria-label="t('menu.wiki')">
        <LocaleLink :to="{ name: 'rules' }">{{ t('wiki.rules') }}</LocaleLink
        ><LocaleLink :to="{ name: 'roles' }">{{ t('wiki.roles') }}</LocaleLink
        ><LocaleLink :to="{ name: 'lobby' }">{{ t('menu.home') }}</LocaleLink>
      </nav>
    </section>
  </main>
</template>

<script setup lang="ts">
import { languageFlags } from './board-display';
import { computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { localizedPath } from '@/router/paths';
import { useI18n } from 'vue-i18n';
import { communityServers } from './servers';
import PlayerBoards from './PlayerBoards.vue';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const boardKinds = ['solo', 'group'] as const;
const tabs = [
  { value: 'servers', label: 'community.servers', route: 'community' },
  { value: 'solo', label: 'playerBoards.solo', route: 'community_solo' },
  { value: 'group', label: 'playerBoards.group', route: 'community_group' },
] as const;
type CommunityTab = (typeof tabs)[number]['value'];
const activeTab = computed<CommunityTab>(() =>
  route.path.includes('/community/players') ? 'solo' : route.path.includes('/community/groups') ? 'group' : 'servers',
);
async function onTabKey(event: KeyboardEvent, current: CommunityTab) {
  const index = tabs.findIndex((tab) => tab.value === current);
  let next: number;
  if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
  else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = tabs.length - 1;
  else return;
  event.preventDefault();
  const container = (event.currentTarget as HTMLElement).parentElement;
  await router.push(localizedPath(router.resolve({ name: tabs[next].route }).path, locale.value));
  await nextTick();
  container?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
}
// Keep the placement offer below official servers and above community listings.
const directoryEntries = [
  ...communityServers.filter((server) => server.official).map((server) => ({ server })),
  { server: null },
  ...communityServers.filter((server) => !server.official).map((server) => ({ server })),
];
</script>

<style scoped lang="scss">
.community-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 84px 24px 64px;
  color: rgb(var(--v-theme-text-primary));
}
.community-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(var(--v-theme-text-primary), 0.2);
  a {
    flex: 1;
    min-width: 0;
    min-height: 48px;
    padding: 12px 16px;
    border: 1px solid rgba(var(--v-theme-text-primary), 0.25);
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    overflow-wrap: anywhere;
    &[aria-selected='true'] {
      background: rgb(var(--v-theme-support-button));
      border-color: rgb(var(--v-theme-support-accent));
      color: rgb(var(--v-theme-support-accent));
    }
  }
}
.community-tabs a:focus-visible,
[role='tabpanel']:focus-visible {
  outline: 2px solid rgb(var(--v-theme-support-accent));
  outline-offset: 3px;
}
@media (max-width: 480px) {
  .community-tabs {
    gap: 6px;
    a {
      padding: 10px 6px;
      font-size: 13px;
    }
  }
}
.community-hero {
  max-width: 730px;
  margin-bottom: 48px;
}
.eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: rgb(var(--v-theme-support-accent));
  text-transform: uppercase;
}
h1 {
  margin: 12px 0 18px;
  font-size: clamp(32px, 5vw, 48px);
  line-height: 1.15;
  overflow-wrap: anywhere;
}
.intro {
  font-size: 18px;
  line-height: 1.65;
}
.section-heading,
.server-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.section-heading {
  margin-bottom: 18px;
  h2 {
    font-size: 20px;
  }
}
.server-count {
  min-width: 28px;
  padding: 3px 9px;
  border-radius: 8px;
  background: rgba(var(--v-theme-text-primary), 0.08);
  text-align: center;
  font-size: 13px;
}
.server-list,
.language-tags {
  list-style: none;
  padding: 0;
  margin: 0;
}
.server-list {
  display: grid;
  gap: 20px;
}
.server-card {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  align-items: start;
  gap: 24px;
  padding: 28px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.14);
  border-radius: 18px;
  background: rgba(var(--v-theme-inset), 0.65);
}
.server-logo {
  border-radius: 20px;
  object-fit: cover;
}
h3 {
  font-size: 25px;
  line-height: 1.3;
}
.official {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 6px;
  background: rgb(var(--v-theme-support-button));
  color: rgb(var(--v-theme-support-accent));
  font-size: 12px;
  font-weight: 700;
  .material-icons {
    font-size: 15px;
  }
}
.description {
  margin: 12px 0 18px;
  line-height: 1.65;
}
.language-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  li {
    padding: 4px 9px;
    border: 1px solid rgba(var(--v-theme-text-primary), 0.2);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }
}
.join-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  align-self: center;
  padding: 12px 16px;
  min-height: 44px;
  border-radius: 10px;
  background: #4855c5;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.15s ease;
  .material-icons {
    font-size: 17px;
  }
  &:hover {
    background: #3c46a8;
  }
  &:focus-visible {
    outline: 3px solid rgb(var(--v-theme-text-primary));
    outline-offset: 4px;
  }
}
.resource-promotion {
  padding: 28px;
  border: 1px solid rgb(var(--v-theme-support-border));
  border-radius: 18px;
  background:
    linear-gradient(120deg, rgba(var(--v-theme-support-accent), 0.09), transparent 75%),
    rgb(var(--v-theme-support-surface));
  color: rgb(var(--v-theme-support-text));
  h3 {
    margin: 18px 0 10px;
    font-size: clamp(23px, 3vw, 30px);
    line-height: 1.25;
  }
  p {
    max-width: 680px;
    line-height: 1.65;
  }
}
.promotion-heading,
.promotion-label,
.promotion-footer,
.promotion-link {
  display: flex;
  align-items: center;
  gap: 10px;
}
.promotion-heading {
  justify-content: space-between;
}
.promotion-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-support-accent));
  .material-icons {
    font-size: 21px;
  }
}
.promotion-price {
  flex-shrink: 0;
  font-size: 24px;
  font-weight: 700;
  color: rgb(var(--v-theme-support-accent));
}
.promotion-footer {
  flex-wrap: wrap;
  gap: 16px 22px;
  margin-top: 24px;
}
.promotion-link {
  justify-content: center;
  min-height: 46px;
  padding: 12px 18px;
  border-radius: 10px;
  background: rgb(var(--v-theme-support-accent));
  color: rgb(var(--v-theme-support-surface));
  text-decoration: none;
  font-weight: 700;
  font-size: 14px;
  .material-icons {
    font-size: 20px;
    flex-shrink: 0;
  }
  &:hover {
    box-shadow: 0 0 0 3px rgba(var(--v-theme-support-accent), 0.2);
  }
  &:focus-visible {
    outline: 3px solid rgb(var(--v-theme-support-text));
    outline-offset: 4px;
  }
}
.promotion-note {
  max-width: 300px;
  font-size: 13px;
  line-height: 1.5;
  color: rgb(var(--v-theme-support-muted));
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@media (max-width: 800px) {
  .server-card {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 18px;
  }
  .server-logo {
    width: 72px;
    height: 72px;
  }
  .join-link {
    grid-column: 2;
    justify-self: start;
  }
}
@media (max-width: 480px) {
  .resource-promotion {
    padding: 20px;
  }
  .promotion-link {
    width: 100%;
  }
  .community-page {
    padding: 64px 16px 40px;
  }
  .community-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 28px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(var(--v-theme-text-primary), 0.2);
    a {
      flex: 1;
      min-width: 0;
      min-height: 48px;
      padding: 12px 16px;
      border: 1px solid rgba(var(--v-theme-text-primary), 0.25);
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      overflow-wrap: anywhere;
      &[aria-selected='true'] {
        background: rgb(var(--v-theme-support-button));
        border-color: rgb(var(--v-theme-support-accent));
        color: rgb(var(--v-theme-support-accent));
      }
    }
  }
  .community-tabs a:focus-visible,
  [role='tabpanel']:focus-visible {
    outline: 2px solid rgb(var(--v-theme-support-accent));
    outline-offset: 3px;
  }
  @media (max-width: 480px) {
    .community-tabs {
      gap: 6px;
      a {
        padding: 10px 6px;
        font-size: 13px;
      }
    }
  }
  .community-hero {
    margin-bottom: 32px;
  }
  .server-card {
    padding: 16px;
    gap: 16px;
    grid-template-columns: minmax(0, 1fr);
  }
  .server-logo {
    width: 56px;
    height: 56px;
  }
  .server-heading {
    flex-wrap: wrap;
    gap: 8px;
  }
  .server-details {
    min-width: 0;
  }
  .server-heading h3 {
    overflow-wrap: anywhere;
  }
  .join-link {
    grid-column: 1;
    justify-self: stretch;
  }
}
@media (prefers-reduced-motion: reduce) {
  .join-link {
    transition: none;
  }
}
</style>

<style scoped>
.discovery-guide {
  border-top: 1px solid rgb(var(--v-theme-surface-border));
  margin: 40px 0;
  padding-top: 28px;
  line-height: 1.8;
}
.discovery-guide h2 {
  font-size: 24px;
}
.discovery-guide h3 {
  margin-top: 24px;
}
.discovery-guide p {
  margin: 12px 0;
  max-width: 78ch;
}
.discovery-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
}
.discovery-links a {
  text-decoration: underline;
  text-underline-offset: 3px;
  padding: 8px 0;
}
</style>

<style scoped>
.community-breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  font-size: 13px;
  margin-bottom: 20px;
  color: rgb(var(--v-theme-text-secondary));
}
.community-breadcrumbs a {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.community-tabs a {
  text-align: center;
}
</style>
