<template>
  <section class="sticker-collection">
    <header>
      <div>
        <h2>{{ $t('stickers.title') }}</h2>
        <p>{{ $t('stickers.subtitle') }}</p>
      </div>
      <span v-if="collection" class="collection-count"
        >{{ collection.stickers.filter((s) => s.available).length }} / {{ STICKERS.length }}</span
      >
    </header>
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-alert v-if="error" type="error" variant="tonal"
      >{{ $t(`stickers.${error}`) }} <v-btn @click="load">{{ $t('stickers.retry') }}</v-btn></v-alert
    >
    <template v-if="collection">
      <h3>
        {{ $t('stickers.favorites') }} <small>{{ collection.favorites.length }} / 6</small>
      </h3>
      <p class="hint">{{ $t('stickers.favoriteHint') }}</p>
      <div class="favorite-row">
        <div v-for="(id, index) in collection.favorites" :key="id" class="favorite-item">
          <StickerImage :id="id" />
          <div class="reorder">
            <v-btn
              size="x-small"
              variant="text"
              color="text-primary"
              icon="chevron_left"
              :aria-label="$t('stickers.moveLeft')"
              :disabled="busy || index === 0"
              @click="move(index, -1)"
            />
            <v-btn
              size="x-small"
              variant="text"
              color="text-primary"
              icon="close"
              :aria-label="$t('stickers.remove')"
              :disabled="busy"
              @click="toggle(id)"
            />
            <v-btn
              size="x-small"
              variant="text"
              color="text-primary"
              icon="chevron_right"
              :aria-label="$t('stickers.moveRight')"
              :disabled="busy || index === collection.favorites.length - 1"
              @click="move(index, 1)"
            />
          </div>
        </div>
        <span v-if="!collection.favorites.length" class="hint">{{ $t('stickers.empty') }}</span>
      </div>
      <v-switch
        :model-value="collection.hideOnBoard"
        :label="$t('stickers.hideOnBoard')"
        :disabled="busy"
        color="primary"
        hide-details
        @update:model-value="save(collection.favorites, !!$event)"
      />
      <div class="sticker-grid">
        <article
          v-for="sticker in collection.stickers"
          :key="sticker.id"
          class="sticker-card"
          :class="{ locked: !sticker.available }"
        >
          <span v-if="sticker.isNew" class="new-badge">{{ $t('stickers.new') }}</span>
          <span v-if="isPremium(sticker.id)" class="premium-label">Premium</span>
          <div class="art">
            <span v-if="secret(sticker.id, sticker.available)" class="secret-art">?</span
            ><StickerImage v-else :id="sticker.id" />
          </div>
          <h4>{{ secret(sticker.id, sticker.available) ? $t('stickers.secret') : $t(`stickers.${sticker.id}`) }}</h4>
          <p class="requirement">{{ requirement(sticker.id, sticker.available) }}</p>
          <template v-if="!sticker.available && !secret(sticker.id, false) && !isPremium(sticker.id)">
            <v-progress-linear
              :model-value="(sticker.progress / sticker.requirement) * 100"
              color="primary"
              rounded
              height="5"
            />
            <small>{{ sticker.progress }} / {{ sticker.requirement }}</small>
          </template>
          <v-btn
            v-if="sticker.available"
            class="favorite-button"
            color="primary"
            size="small"
            variant="tonal"
            :disabled="busy || (!collection.favorites.includes(sticker.id) && collection.favorites.length >= 6)"
            :prepend-icon="collection.favorites.includes(sticker.id) ? 'star' : 'star_border'"
            @click="toggle(sticker.id)"
          >
            {{ $t(collection.favorites.includes(sticker.id) ? 'stickers.remove' : 'stickers.add') }}
          </v-btn>
          <v-btn
            v-if="sticker.available && selectable"
            class="mt-2"
            size="small"
            color="primary"
            @click="$emit('send', sticker.id)"
            >{{ $t('stickers.send') }}</v-btn
          >
          <router-link
            v-if="!sticker.available && isPremium(sticker.id)"
            class="premium-link"
            :to="{ name: 'support' }"
            >{{ $t('premiumCosmetics.explore') }}</router-link
          >
          <span v-else-if="!sticker.available" class="locked-label"
            ><span class="material-icons">lock</span>{{ $t('stickers.locked') }}</span
          >
        </article>
      </div>
      <v-btn
        v-if="collection.stickers.some((s) => s.isNew)"
        variant="text"
        color="text-primary"
        class="mt-3"
        @click="markSeen(collection.stickers.filter((s) => s.isNew).map((s) => s.id))"
        >{{ $t('stickers.markSeen') }}</v-btn
      >
    </template>
  </section>
</template>
<script setup lang="ts">
import { STICKERS } from '@avalon/types/user/stickers';
import { useI18n } from 'vue-i18n';
import { useStickers } from '@/helpers/composables/useStickers';
import StickerImage from './StickerImage.vue';
defineProps<{ selectable?: boolean }>();
defineEmits<{ (event: 'send', id: string): void }>();
const { t } = useI18n();
const { collection, loading, error, busy, load, save, markSeen } = useStickers();
const secret = (id: string, available: boolean) => !available && STICKERS.find((s) => s.id === id)?.hidden;
const isPremium = (id: string) => STICKERS.find((s) => s.id === id)?.premium;
const requirement = (id: string, available: boolean) => {
  const def = STICKERS.find((s) => s.id === id)!;
  if (def.premium) return t(available ? 'premiumCosmetics.included' : 'premiumCosmetics.onlyPremium');
  if (secret(id, available)) return t('stickers.secretHint');
  if (def.games) return t('stickers.games', { count: def.games });
  if (def.achievement) return t(`achievements.${def.achievement}_description`);
  return t('stickers.starter');
};
const toggle = async (id: string) => {
  if (!collection.value) return;
  const favorites = collection.value.favorites;
  await save(favorites.includes(id) ? favorites.filter((s) => s !== id) : [...favorites, id]);
};
const move = (index: number, direction: number) => {
  if (!collection.value) return;
  const favorites = [...collection.value.favorites];
  [favorites[index], favorites[index + direction]] = [favorites[index + direction], favorites[index]];
  void save(favorites);
};
</script>
<style scoped lang="scss">
.sticker-collection {
  padding: 24px;
  scroll-margin-top: 75px;
  color: rgb(var(--v-theme-text-primary));
}
header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
}
header p,
.hint,
.requirement {
  opacity: 0.72;
  font-size: 13px;
}
.collection-count {
  white-space: nowrap;
  color: rgb(var(--v-theme-primary));
  font-size: 20px;
}
h3 small {
  opacity: 0.6;
  font-weight: normal;
}
.favorite-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 0;
}
.favorite-item {
  flex: 0 0 80px;
}
.favorite-item > img {
  height: 78px;
}
.reorder {
  display: flex;
  justify-content: center;
}
.sticker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 20px;
}
.sticker-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.24);
  border-radius: 16px;
  background: rgba(var(--v-theme-primary), 0.04);
}
.art {
  width: 112px;
  height: 112px;
  margin-bottom: 8px;
}
.requirement {
  min-height: 38px;
  margin: 8px 0;
}
.favorite-button,
.locked-label {
  margin-top: auto;
}
.locked-label {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.5;
  font-size: 12px;
  padding-top: 10px;
}
.locked-label .material-icons {
  font-size: 14px;
}
.locked .art img {
  filter: grayscale(1);
  opacity: 0.5;
}
.secret-art {
  font-size: 70px;
  color: rgb(var(--v-theme-primary));
  opacity: 0.35;
}
.new-badge {
  position: absolute;
  right: 8px;
  top: 8px;
  font-size: 10px;
  color: rgb(var(--v-theme-primary));
}
.premium-label {
  align-self: flex-start;
  background: #e7c675;
  color: #382a0c;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
}
.premium-link {
  margin-top: auto;
  padding: 12px 4px;
  color: rgb(var(--v-theme-text-primary));
  text-underline-offset: 3px;
}
@media (max-width: 480px) {
  .sticker-collection {
    padding: 16px;
  }
  .sticker-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .art {
    width: 90px;
    height: 90px;
  }
}
</style>
