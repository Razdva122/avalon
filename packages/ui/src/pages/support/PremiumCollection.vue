<template>
  <section class="premium-collection" aria-labelledby="premium-collection-title">
    <div class="collection-heading">
      <div>
        <h3 id="premium-collection-title">{{ t('premiumCosmetics.title') }}</h3>
        <p v-if="!compact">{{ t('premiumCosmetics.description') }}</p>
      </div>
      <span v-if="active" class="included">{{ t('premiumCosmetics.included') }}</span>
    </div>
    <div class="exclusive-grid">
      <article v-for="item in items" :key="item.id" class="exclusive" :class="item.kind">
        <div class="exclusive-art">
          <template v-if="imagesVisible">
            <img
              v-if="item.kind === 'avatar'"
              :src="avatarPreviews[item.id]"
              :alt="t('premiumCosmetics.' + item.id)"
              width="512"
              height="512"
              loading="lazy"
              decoding="async"
            />
            <StickerImage v-else :id="item.id" width="512" height="512" loading="lazy" decoding="async" />
          </template>
        </div>
        <div class="exclusive-copy">
          <span class="exclusive-kind">{{ t('premiumCosmetics.' + item.kind) }}</span>
          <h4>{{ t('premiumCosmetics.' + item.id) }}</h4>
          <p v-if="!compact">{{ t('premiumCosmetics.' + item.description) }}</p>
        </div>
      </article>
    </div>
    <footer v-if="!compact" class="collection-footer">
      <p v-if="!compact">{{ t('premiumCosmetics.activation') }}</p>
      <router-link v-if="active" class="collection-action" :to="{ name: 'profile' }">{{
        t('premiumCosmetics.collection')
      }}</router-link>
      <a v-else class="collection-action" href="#support-checkout">{{ t('premiumCosmetics.support') }}</a>
    </footer>
  </section>
</template>
<script setup lang="ts">
import { getImagePathByID } from '@/helpers/images';
import { useI18n } from 'vue-i18n';
import StickerImage from '@/components/stickers/StickerImage.vue';
withDefaults(defineProps<{ active: boolean; compact?: boolean; imagesVisible?: boolean }>(), { imagesVisible: true });
const { t } = useI18n();
// Marketing previews remain visible even when gameplay cosmetics are disabled.
const avatarPreviews: Record<string, string> = {
  puppeteer: getImagePathByID('premium', 'puppeteer'),
  'eclipse-queen': getImagePathByID('premium', 'eclipse-queen'),
};
const items = [
  { id: 'puppeteer', kind: 'avatar', description: 'puppeteerDescription' },
  { id: 'eclipse-queen', kind: 'avatar', description: 'queenDescription' },
  { id: 'mordred-puppet', kind: 'sticker', description: 'puppetDescription' },
  { id: 'morgana-violin', kind: 'sticker', description: 'violinDescription' },
];
</script>
<style scoped lang="scss">
.premium-collection {
  margin-top: 32px;
}
.collection-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.collection-heading h3 {
  font-size: 28px;
  line-height: 1.2;
  margin-bottom: 8px;
}
p {
  line-height: 1.6;
}
.collection-heading p {
  max-width: 620px;
  font-size: 15px;
}
.included {
  padding: 6px 10px;
  border-radius: 6px;
  background: #e7c675;
  color: #382a0c;
  font-size: 12px;
  font-weight: 600;
}
.exclusive-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.exclusive {
  min-width: 0;
}
.exclusive-art {
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--v-theme-text-primary), 0.04);
}
.exclusive-art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sticker .exclusive-art {
  padding: 10px;
}
.sticker .exclusive-art img {
  object-fit: contain;
}
.exclusive-copy {
  padding-top: 14px;
}
.exclusive-kind {
  font-size: 12px;
  opacity: 0.75;
}
h4 {
  font-size: 17px;
  line-height: 1.35;
  margin: 5px 0 8px;
}
.exclusive-copy p {
  font-size: 13px;
  opacity: 0.85;
}
.collection-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 24px;
  padding: 20px 0;
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.15);
  border-bottom: 1px solid rgba(var(--v-theme-text-primary), 0.15);
}
.collection-footer p {
  max-width: 640px;
  font-size: 13px;
}
.collection-action {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 8px;
  color: #382a0c;
  background: #e7c675;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
}
.collection-action:hover {
  background: #f0d58f;
}
.collection-action:focus-visible {
  outline: 3px solid rgb(var(--v-theme-text-primary));
  outline-offset: 3px;
}
@media (max-width: 850px) {
  .exclusive-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 16px;
  }
  .collection-footer {
    align-items: start;
    flex-direction: column;
    gap: 16px;
  }
}
@media (max-width: 480px) {
  .collection-heading {
    flex-direction: column;
  }
  .exclusive-grid {
    gap: 20px 12px;
  }
  h4 {
    font-size: 16px;
  }
  .exclusive-copy p {
    font-size: 12px;
  }
  .sticker .exclusive-art {
    padding: 4px;
  }
  .collection-action {
    width: 100%;
  }
}
</style>
