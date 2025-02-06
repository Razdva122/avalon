<template>
  <div class="info-page-content">
    <WikiBreadCrumbs />
    <h1>
      <div class="evil-loyalty-icon"></div>
      {{ $t('roles.minion') }} {{ $t('roles.role') }}
    </h1>
    <img class="preview-image" :src="calculateRoleUrl('minion')" alt="Minion of Mordred" />
    <h2>{{ $t('minion.generalTipsTitle') }}</h2>

    <ul>
      <li>
        <strong>{{ $t('minion.tipRoleTitle') }}</strong>
        {{ $t('minion.tipRoleText') }}
      </li>
      <li>
        <strong>{{ $t('minion.tipKnowledgeTitle') }}</strong>
        {{ $t('minion.tipKnowledgeText') }}
      </li>
      <li>
        <strong>{{ $t('minion.tipObjectiveTitle') }}</strong>
        {{ $t('minion.tipObjectiveText') }}
      </li>
    </ul>

    <h2>{{ $t('minion.strategicTipsTitle') }}</h2>
    <ul>
      <li>
        <strong>{{ $t('minion.tipDiscreetCollaborationTitle') }}</strong>
        {{ $t('minion.tipDiscreetCollaborationText') }}
      </li>
      <li>
        <strong>{{ $t('minion.tipDeceptionTitle') }}</strong>
        {{ $t('minion.tipDeceptionText') }}
      </li>
      <li>
        <strong>{{ $t('minion.tipPublicDemeanorTitle') }}</strong>
        {{ $t('minion.tipPublicDemeanorText') }}
      </li>
      <li>
        <strong>{{ $t('minion.tipUndermineTrustTitle') }}</strong>
        {{ $t('minion.tipUndermineTrustText') }}
      </li>
      <li>
        <strong>{{ $t('minion.tipSuspectManagementTitle') }}</strong>
        {{ $t('minion.tipSuspectManagementText') }}
      </li>
      <li>
        <strong>{{ $t('minion.tipStrategicSacrificeTitle') }}</strong>
        {{ $t('minion.tipStrategicSacrificeText') }}
      </li>
    </ul>

    <p><LocalizedTextWrapper keypath="minion.conclusionText" /></p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WikiBreadCrumbs from '@/components/header/WikiBreadCrumbs.vue';
import PreviewLink from '@/components/view/information/PreviewLink.vue';
import { calculateRoleUrl } from '@/helpers/styles';

export default defineComponent({
  components: {
    WikiBreadCrumbs,
    PreviewLink,
  },
  methods: {
    calculateRoleUrl: calculateRoleUrl,
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

h2 {
  margin-top: 20px;
}
</style>
