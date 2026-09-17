<template>
  <details class="support-benefits">
    <summary>
      <span class="preview-heading">
        <span class="preview-title">{{ t('support.benefitsTitle') }}</span>
        <span class="disclosure"
          ><span class="when-closed">{{ t('support.showBenefits') }}</span
          ><span class="when-open">{{ t('support.hideBenefits') }}</span
          ><span class="material-icons" aria-hidden="true">expand_more</span></span
        >
      </span>
      <span class="tier-previews">
        <span v-for="tier in tiers" :key="tier.key" class="tier-preview">
          <span class="tier-heading"
            ><span class="material-icons" aria-hidden="true">{{ tier.icon }}</span
            ><strong>${{ tier.amount }}+</strong></span
          >
          <span class="tier-title">{{ t(`support.${tier.key}Title`) }}</span>
          <span class="tier-summary">{{ t(`support.${tier.key}Preview`) }}</span>
        </span>
      </span>
    </summary>
    <div class="benefits-details">
      <div class="reward-details">
        <section v-for="tier in tiers" :key="tier.key">
          <span class="reward-amount"
            ><span class="material-icons" aria-hidden="true">{{ tier.icon }}</span
            >${{ tier.amount }}+</span
          >
          <h2>{{ t(`support.${tier.key}Title`) }}</h2>
          <ul class="reward-perks">
            <li v-for="perk in tier.perks" :key="perk.label">
              <span class="perk-icon material-icons" aria-hidden="true">{{ perk.icon }}</span>
              <span>{{ t(perk.label) }}</span>
            </li>
          </ul>
        </section>
      </div>
      <div class="reward-notes">
        <p>{{ t('support.tiersNote') }}</p>
        <p>
          {{ t('support.rewardContact') }}
          <a href="https://discord.gg/DR9cEDDNdN" target="_blank" rel="noopener noreferrer"
            >Discord<span class="material-icons" aria-hidden="true">open_in_new</span></a
          >
        </p>
      </div>
      <PremiumCollection :active="active" compact />
    </div>
  </details>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import PremiumCollection from './PremiumCollection.vue';
defineProps<{ active: boolean }>();
const { t } = useI18n();
const tiers = [
  {
    key: 'premium',
    amount: 10,
    icon: 'workspace_premium',
    perks: [
      { icon: 'all_inclusive', label: 'support.lifetimePremium' },
      { icon: 'face', label: 'premiumCosmetics.title' },
      { icon: 'restart_alt', label: 'support.resetTitle' },
      { icon: 'verified', label: 'support.badgeTitle' },
      { icon: 'visibility', label: 'support.privacyTitle' },
    ],
  },
  {
    key: 'patron',
    amount: 50,
    icon: 'groups',
    perks: [
      { icon: 'edit', label: 'support.patronNamePerk' },
      { icon: 'forum', label: 'support.patronContactPerk' },
    ],
  },
  {
    key: 'creator',
    amount: 1000,
    icon: 'auto_awesome',
    perks: [
      { icon: 'auto_fix_high', label: 'support.creatorRolePerk' },
      { icon: 'emoji_events', label: 'support.creatorAchievementPerk' },
    ],
  },
];
</script>

<style scoped lang="scss">
.support-benefits {
  border: 1px solid #b3863760;
  border-radius: 18px;
  background: linear-gradient(120deg, #b3863714, transparent);
  overflow: hidden;
}
summary {
  padding: 26px;
  cursor: pointer;
  list-style: none;
  &::-webkit-details-marker {
    display: none;
  }
  &:hover {
    background: #b3863709;
  }
  &:focus-visible {
    outline: 3px solid #b38637;
    outline-offset: -4px;
  }
}
.preview-heading,
.disclosure,
.tier-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}
.preview-heading {
  justify-content: space-between;
  gap: 20px;
}
.preview-title {
  font-size: 22px;
  font-weight: 700;
}
.disclosure {
  flex-shrink: 0;
  font-size: 13px;
  min-height: 44px;
}
.when-open {
  display: none;
}
.support-benefits[open] {
  > summary .tier-previews {
    display: none;
  }
  .when-open {
    display: inline;
  }
  .when-closed {
    display: none;
  }
  .disclosure .material-icons {
    transform: rotate(180deg);
  }
}
.tier-previews {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  margin-top: 22px;
}
.tier-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tier-preview + .tier-preview {
  border-left: 1px solid #b3863735;
  padding-left: 22px;
}
.tier-heading {
  color: rgb(var(--v-theme-text-primary));
}
.tier-heading strong {
  font-size: 28px;
  line-height: 1.1;
}
.tier-heading .material-icons {
  color: #b38637;
  font-size: 24px;
}
.tier-title {
  font-size: 16px;
  font-weight: 650;
}
.tier-summary {
  font-size: 13px;
  line-height: 1.65;
  opacity: 0.85;
}
.benefits-details {
  padding: 0 26px 26px;
}
h2 {
  font-size: 18px;
  margin-bottom: 8px;
}
p {
  line-height: 1.65;
}
.reward-details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
  padding-top: 22px;
  border-top: 1px solid #b3863735;
}
.reward-amount {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  margin-bottom: 12px;
  border-radius: 7px;
  background: #e7c675;
  color: #382a0c;
  font-size: 14px;
  font-weight: 700;
}
.reward-details p {
  font-size: 14px;
}
.reward-amount .material-icons {
  font-size: 18px;
}
.reward-perks {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 12px;
  font-size: 14px;
  line-height: 1.5;
}
.reward-perks li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.perk-icon {
  display: grid;
  place-items: center;
  flex: 0 0 28px;
  height: 28px;
  margin-top: -3px;
  border-radius: 8px;
  background: rgba(var(--v-theme-support-accent), 0.1);
  color: rgb(var(--v-theme-support-accent));
  font-size: 19px;
}
.reward-notes {
  display: grid;
  gap: 8px;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid #b3863735;
  font-size: 13px;
  opacity: 0.85;
}
a {
  color: inherit;
  font-weight: 600;
  text-underline-offset: 3px;
}
a .material-icons {
  font-size: 14px;
  vertical-align: middle;
  margin-left: 4px;
}
a:focus-visible {
  outline: 2px solid #b38637;
  outline-offset: 3px;
}
@media (max-width: 700px) {
  summary {
    padding: 20px;
  }
  .benefits-details {
    padding: 0 20px 20px;
  }
  .preview-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 0;
  }
  .preview-title {
    font-size: 20px;
  }
  .tier-previews {
    grid-template-columns: 1fr;
    gap: 18px;
    margin-top: 12px;
  }
  .tier-preview {
    gap: 7px;
  }
  .tier-preview + .tier-preview {
    border-left: 0;
    border-top: 1px solid #b3863735;
    padding: 18px 0 0;
  }
  .tier-heading strong {
    font-size: 24px;
  }
  .reward-details {
    grid-template-columns: 1fr;
  }
}
</style>
