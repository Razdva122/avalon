<template>
  <article class="info-page-content wiki-page guide-page" :lang="language">
    <nav class="guide-breadcrumbs" :aria-label="copy.breadcrumbLabel">
      <RouterLink :to="path('/')">{{ copy.home }}</RouterLink>
      <span aria-hidden="true">/</span>
      <template v-if="guide !== 'social_deduction_games_online'">
        <RouterLink :to="path('/guides/social-deduction-games-online/')">{{
          collection.guides.social_deduction_games_online.breadcrumb
        }}</RouterLink>
        <span aria-hidden="true">/</span>
      </template>
      <span aria-current="page">{{ page.breadcrumb }}</span>
    </nav>

    <h1>{{ page.title }}</h1>
    <p class="guide-lead">{{ page.lead }}</p>

    <nav class="wiki-nav guide-actions" :aria-label="copy.startLabel">
      <RouterLink
        class="primary-cta"
        :to="{ path: path('/'), hash: '#play-with-ai' }"
        @click="trackCta($event, 'ai')"
        >{{ copy.aiCta }}</RouterLink
      >
      <RouterLink :to="path('/')" @click="trackCta($event, 'lobby')">{{ copy.lobbyCta }}</RouterLink>
    </nav>
    <p class="guide-access-note">
      {{ copy.aiAccessNote }} <a href="#guide-play">{{ copy.setupLabel }}</a>
    </p>

    <details class="guide-toc">
      <summary>{{ copy.tocTitle }}</summary>
      <nav :aria-label="copy.tocTitle">
        <ul>
          <li>
            <a href="#guide-comparison">{{ copy.comparisonLabel }}</a>
          </li>
          <li v-for="(section, index) in page.sections" :key="section.title">
            <a :href="`#guide-section-${index}`">{{ section.title }}</a>
          </li>
          <li>
            <a href="#guide-play">{{ copy.setupLabel }}</a>
          </li>
          <li>
            <a href="#variant-title">{{ copy.variantTitle }}</a>
          </li>
        </ul>
      </nav>
    </details>

    <section id="guide-comparison" class="guide-comparison" aria-labelledby="guide-comparison-title">
      <h2 id="guide-comparison-title">{{ page.table.caption }}</h2>
      <div class="guide-table" role="region" :aria-label="page.table.caption" tabindex="0">
        <table>
          <caption>
            {{
              page.table.caption
            }}
          </caption>
          <thead>
            <tr>
              <th v-for="column in page.table.columns" :key="column" scope="col">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in page.table.rows" :key="row.title">
              <th scope="row">
                {{ row.title }}
                <a v-if="row.source" class="source-link" :href="row.source.url">{{ row.source.label }}</a>
              </th>
              <td v-for="(cell, index) in row.cells" :key="index">{{ cell }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="guide-cards">
        <section
          v-for="(row, rowIndex) in page.table.rows"
          :key="row.title"
          class="guide-card"
          :aria-labelledby="`comparison-row-${rowIndex}`"
        >
          <h3 :id="`comparison-row-${rowIndex}`">{{ row.title }}</h3>
          <dl>
            <template v-for="(cell, index) in row.cells" :key="index">
              <dt>{{ page.table.columns[index + 1] }}</dt>
              <dd>{{ cell }}</dd>
            </template>
          </dl>
          <a v-if="row.source" class="source-link" :href="row.source.url">{{ row.source.label }}</a>
        </section>
      </div>
    </section>

    <figure v-if="page.preview" class="guide-preview">
      <img :src="preview" :alt="copy.previewAlt" width="1250" height="1250" loading="lazy" />
      <figcaption>{{ copy.previewCaption }}</figcaption>
    </figure>

    <section
      v-for="(section, index) in page.sections"
      class="guide-prose"
      :key="section.title"
      :aria-labelledby="`guide-section-${index}`"
    >
      <h2 :id="`guide-section-${index}`">{{ section.title }}</h2>
      <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
      <p v-if="section.source" class="guide-source">
        {{ copy.sourceLabel }}: <a :href="section.source.url">{{ section.source.label }}</a
        >.
      </p>
    </section>

    <aside id="guide-play" class="wiki-panel guide-setup" aria-labelledby="setup-title">
      <h2 id="setup-title">{{ copy.setupTitle }}</h2>
      <section aria-labelledby="human-setup-title">
        <h3 id="human-setup-title">{{ copy.humanTitle }}</h3>
        <dl>
          <div>
            <dt>{{ copy.playersLabel }}</dt>
            <dd>{{ copy.humanPlayers }}</dd>
          </div>
          <div>
            <dt>{{ copy.accessLabel }}</dt>
            <dd>{{ copy.humanAccess }}</dd>
          </div>
          <div>
            <dt>{{ copy.discussionLabel }}</dt>
            <dd>{{ copy.humanDiscussion }}</dd>
          </div>
          <div>
            <dt>{{ copy.findingGroupLabel }}</dt>
            <dd>{{ copy.findingGroup }}</dd>
          </div>
        </dl>
        <p>{{ copy.boardsNote }}</p>
      </section>
      <section aria-labelledby="ai-setup-title">
        <h3 id="ai-setup-title">{{ copy.aiTitle }}</h3>
        <p>{{ copy.aiIntro }}</p>
        <p>{{ copy.aiAvailability }}</p>
      </section>
      <details class="guide-start-steps">
        <summary>{{ copy.setupLabel }}</summary>
        <p>{{ copy.nextAi }}</p>
        <p>{{ copy.nextHuman }}</p>
      </details>
    </aside>

    <aside class="wiki-panel guide-variant" aria-labelledby="variant-title">
      <h2 id="variant-title">{{ copy.variantTitle }}</h2>
      <p>{{ copy.proposalVariant }}</p>
      <p>{{ copy.assassinationVariant }}</p>
      <RouterLink :to="path('/wiki/rules/')">{{ copy.fullRulesCta }}</RouterLink>
    </aside>

    <section class="guide-prose" aria-labelledby="next-title">
      <h2 id="next-title">{{ copy.nextTitle }}</h2>
      <nav class="wiki-nav" :aria-label="copy.arrangeLabel">
        <RouterLink
          class="primary-cta"
          :to="{ path: path('/'), hash: '#play-with-ai' }"
          @click="trackCta($event, 'ai')"
          >{{ copy.aiCta }}</RouterLink
        >
        <RouterLink :to="path('/')" @click="trackCta($event, 'lobby')">{{ copy.lobbyCta }}</RouterLink>
        <RouterLink :to="path('/community/groups/')" @click="trackCta($event, 'community')">{{
          copy.browseGroupsCta
        }}</RouterLink>
        <RouterLink :to="path('/community/players/')" @click="trackCta($event, 'community')">{{
          copy.findPlayersCta
        }}</RouterLink>
        <RouterLink :to="path('/wiki/roles/merlin/')">{{ copy.merlinCta }}</RouterLink>
      </nav>
    </section>

    <nav class="guide-related" :aria-label="copy.relatedLabel">
      <h2>{{ copy.relatedTitle }}</h2>
      <ul>
        <li v-for="other in related" :key="other.slug">
          <RouterLink :to="path(`/guides/${other.slug}/`)">{{ other.title }}</RouterLink>
        </li>
      </ul>
    </nav>
    <p class="guide-source">
      {{ copy.ownership }}
    </p>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import type { TLanguage } from '@/i18n/interface';
import { localizedPath } from '@/router/paths';
import { getGuideLocale } from './locales';
import { trackGuideVisit, trackGuideCta } from '@/helpers/acquisition';
import { getImagePathByID } from '@/helpers/images';
import type { GuideId } from './content';

const props = defineProps<{ guide: GuideId }>();
const route = useRoute();
const language = computed(() => (route.meta.lang || 'en') as TLanguage);
const collection = computed(() => getGuideLocale(language.value));
const copy = computed(() => collection.value.copy);
const page = computed(() => collection.value.guides[props.guide]);
const path = (pathname: string) => localizedPath(pathname, language.value);
const related = computed(() =>
  Object.entries(collection.value.guides)
    .filter(([id]) => id !== props.guide)
    .map(([, guide]) => guide),
);
const preview = getImagePathByID('other', 'preview');
let mounted = false;
onMounted(() => {
  mounted = true;
  trackGuideVisit(page.value.slug, language.value);
});
watch([() => props.guide, language], () => {
  if (mounted) trackGuideVisit(page.value.slug, language.value);
});

function trackCta(event: MouseEvent, destination: 'lobby' | 'community' | 'ai') {
  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    trackGuideCta(page.value.slug, destination, language.value);
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';
@import '@/styles/wiki-page.scss';

.guide-breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  margin-bottom: 18px;
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
}
.guide-lead {
  max-width: 74ch;
  font-size: 18px;
}
.guide-prose {
  max-width: 78ch;
}
.guide-actions {
  margin-bottom: 10px;
}
.guide-access-note {
  max-width: 78ch;
  font-size: 14px;
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
}
.guide-toc {
  margin-block: 20px 28px;
  max-width: 850px;
  border-block: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  summary {
    padding: 14px 0;
    min-height: 48px;
    font-weight: 700;
    cursor: pointer;
  }
  ul {
    margin: 0 0 16px;
    padding: 0;
    list-style: none;
  }
  li {
    padding: 0;
    margin: 0;
  }
  a {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding-block: 8px;
  }
}
summary:focus-visible {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: 4px;
}
.guide-comparison,
.guide-page h2,
.guide-setup {
  scroll-margin-top: 80px;
}
.guide-setup {
  max-width: 850px;
  margin-block: 28px;
  h2 {
    font-size: 22px;
  }
  dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 24px;
    margin-bottom: 18px;
  }
  dt {
    font-weight: 700;
  }
  dd {
    margin: 0;
  }
  .wiki-nav {
    margin-bottom: 0;
  }
}
.guide-page .wiki-nav a.primary-cta {
  font-weight: 700;
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  &:hover {
    background: rgba(var(--v-theme-primary), 0.88);
  }
}
.guide-start-steps {
  margin-top: 24px;
  summary {
    min-height: 44px;
    cursor: pointer;
    font-weight: 700;
  }
  p:first-of-type {
    margin-top: 16px;
  }
}
.guide-table {
  max-width: 100%;
  overflow-x: auto;
  margin-block: 20px 32px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 12px;
  &:focus-visible {
    outline: 3px solid rgb(var(--v-theme-primary));
    outline-offset: 4px;
  }
  table {
    width: 100%;
    min-width: 620px;
    border-collapse: collapse;
    text-align: left;
  }
  caption {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  th,
  td {
    padding: 16px;
    vertical-align: top;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  }
  thead th {
    background: rgba(var(--v-theme-primary), 0.08);
  }
  tbody th {
    width: 25%;
  }
}
.guide-cards {
  display: none;
}
.source-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: 8px;
  font-size: 14px;
  font-weight: 400;
}
.guide-source {
  font-size: 14px;
}
.guide-variant {
  margin-block: 32px;
}
.guide-preview {
  max-width: 540px;
  margin: 36px auto;
  img {
    display: block;
    width: 100%;
    height: auto;
  }
  figcaption {
    margin-top: 12px;
    font-size: 14px;
  }
}
.guide-related {
  margin-top: 36px;
}
@media (max-width: 700px) {
  .guide-setup dl {
    grid-template-columns: 1fr;
  }
  .guide-table {
    display: none;
  }
  .guide-cards {
    display: grid;
    gap: 16px;
  }
  .guide-card {
    padding: 18px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
    border-radius: 12px;
    background: rgb(var(--v-theme-surface));
    h3 {
      margin: 0 0 16px;
      font-size: 18px;
    }
    dl {
      margin: 0;
    }
    dt {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    dd {
      margin: 0 0 16px;
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
