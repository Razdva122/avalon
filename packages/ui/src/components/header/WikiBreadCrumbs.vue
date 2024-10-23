<template>
  <div class="container">
    <router-link class="bread-crumb" v-for="(item, index) in items" :to="item.to">
      <span>{{ item.title }}</span>
      <span class="divider" v-if="index !== items.length - 1">/</span>
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { LanguageMap } from '@/helpers/i18n';

export default defineComponent({
  computed: {
    items() {
      const normalizeName = (el: string): string => {
        if (el === 'lady') {
          return 'lady_of_lake';
        }

        return el;
      };

      return new URL(window.location.href).pathname
        .split('/')
        .slice(1)
        .filter((el) => el && !Object.keys(LanguageMap).find((lang) => lang.toLowerCase() === el.toLowerCase()))
        .map((el) => ({
          to: { name: normalizeName(el) },
          id: el,
          title: this.$t(`breadCrumbs.${el}`),
        }));
    },
  },
  mounted() {
    document.querySelector('script[type="application/ld+json"]')!.innerHTML = `
		{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [${this.items.reduce((acc, item, index, items) => {
        const el = `{
					"@type": "ListItem",
					"position": ${index + 1},
					"name": "${item.title}",
					"item": "https://avalon-game.com/${items
            .slice(0, index + 1)
            .map((el) => el.id)
            .join('/')}/"
				}${index === items.length - 1 ? '' : ','}`;
        return acc + el;
      }, '')}]
    }
		`;
  },
  beforeUnmount() {
    document.querySelector('script[type="application/ld+json"]')!.innerHTML = ``;
  },
});
</script>

<style scoped lang="scss">
.bread-crumb {
  font-size: 22px;
  text-transform: capitalize;
}

.router-link-exact-active {
  opacity: 0.4;
}

.divider {
  margin: 0 8px;
}

.container {
  padding: 16px 12px;
}
</style>
