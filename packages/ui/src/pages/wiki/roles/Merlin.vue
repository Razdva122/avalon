<template>
  <div class="info-page-content wiki-page">
    <WikiBreadCrumbs />
    <h1>
      <div class="good-loyalty-icon"></div>
      {{ $t('roles.merlin') }} {{ $t('roles.role') }}
    </h1>

    <div class="merlin-overview">
      <SchemaImage
        class="merlin-portrait"
        :src="calculateRoleUrl('merlin')"
        :alt="$t('roles.merlin')"
        :description="$t('roles.merlin')"
      />

      <section class="wiki-panel">
        <h2>{{ $t('merlin.factsTitle') }}</h2>
        <dl class="role-facts">
          <div class="role-fact" v-for="fact in ['team', 'sees', 'hidden', 'percival', 'loss']" :key="fact">
            <dt>{{ $t(`merlin.${fact}Label`) }}</dt>
            <dd><LocalizedTextWrapper :keypath="`merlin.${fact}Value`" /></dd>
          </div>
        </dl>
        <nav class="wiki-nav" :aria-label="$t('wiki.title')">
          <LocaleLink :to="{ name: 'rules' }">{{ $t('wiki.rules') }}</LocaleLink>
          <LocaleLink :to="{ name: 'roles' }">{{ $t('wiki.rolesTitle') }}</LocaleLink>
        </nav>
      </section>
    </div>

    <h2>{{ $t('merlin.generalInformationTitle') }}</h2>
    <p>
      <LocalizedTextWrapper keypath="merlin.generalInformationText" />
    </p>

    <TopRolePlayer role="merlin" class="my-4" />

    <h2>{{ $t('merlin.generalTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('merlin.cautiousKnowledgeTitle') }}</strong>
        <span>
          <LocalizedTextWrapper keypath="merlin.cautiousKnowledgeText" />
        </span>
      </li>
      <li>
        <strong>{{ $t('merlin.useHintsWiselyTitle') }}</strong>
        <span>
          <LocalizedTextWrapper keypath="merlin.useHintsWiselyText" />
        </span>
      </li>
      <li>
        <strong>{{ $t('merlin.carefulAccusationsTitle') }}</strong>
        <span>{{ $t('merlin.carefulAccusationsText') }}</span>
      </li>
      <li>
        <strong>{{ $t('merlin.maintainBalanceTitle') }}</strong>
        <span>{{ $t('merlin.maintainBalanceText') }}</span>
      </li>
      <li>
        <strong>{{ $t('merlin.attentionAssassinTitle') }}</strong>
        <span>
          <LocalizedTextWrapper keypath="merlin.attentionAssassinText" />
        </span>
      </li>
    </ul>

    <h2>{{ $t('merlin.strategicTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('merlin.strategizeSilenceTitle') }}</strong> {{ $t('merlin.strategizeSilence') }}
      </li>
      <li>
        <strong>{{ $t('merlin.revealEvilsTitle') }}</strong> {{ $t('merlin.revealEvils') }}
      </li>
      <li>
        <strong>{{ $t('merlin.utilizeAmbiguityTitle') }}</strong> {{ $t('merlin.utilizeAmbiguity') }}
      </li>
      <li>
        <strong>{{ $t('merlin.buildTrustTitle') }}</strong> {{ $t('merlin.buildTrust') }}
      </li>
      <li>
        <strong>{{ $t('merlin.supportAlliesTitle') }}</strong> {{ $t('merlin.supportAllies') }}
      </li>
    </ul>

    <p>
      <localized-text-wrapper keypath="merlin.playingAsMerlin"></localized-text-wrapper>
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import SchemaImage from '@/components/view/SchemaImage.vue';
import LocalizedTextWrapper from '@/components/feedback/LocalizedTextWrapper.vue';
import TopRolePlayer from '@/components/stats/TopRolePlayer.vue';
import { calculateRoleUrl } from '@/helpers/styles';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
    SchemaImage,
    LocalizedTextWrapper,
    TopRolePlayer,
  },
  methods: {
    calculateRoleUrl: calculateRoleUrl,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';
@import '@/styles/wiki-page.scss';

.role-facts {
  dt {
    font-weight: 700;
    margin-top: 12px;
  }
  dd {
    margin: 4px 0 12px;
  }
}

h2 {
  margin-top: 20px;
}
</style>

<style scoped lang="scss">
.merlin-overview {
  display: grid;
  grid-template-columns: minmax(160px, 240px) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  margin: 28px 0 36px;
}
.wiki-page .merlin-portrait {
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  aspect-ratio: 1;
}
.role-fact + .role-fact {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-top: 10px;
}
.wiki-page .role-facts dd {
  margin: 4px 0 16px;
}
@media (max-width: 700px) {
  .merlin-overview {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .wiki-page .merlin-portrait {
    width: 140px;
    justify-self: center;
  }
}
</style>
