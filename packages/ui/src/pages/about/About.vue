<template>
  <div class="info-page-content">
    <h1 class="title">{{ $t('about.title') }}</h1>
    <div v-html="$t('about.content')"></div>

    <div v-html="$t('about.description')"></div>

    <div class="image">
      <img class="preview" alt="preview" :src="getImagePathByID('other', 'preview')" />
    </div>

    <div>
      <LocalizedTextWrapper keypath="about.roles" />
    </div>

    <div>
      <LocalizedTextWrapper keypath="about.extraRoles" />
    </div>

    <div>
      {{ $t('about.features') }}
    </div>

    <section class="supporters" aria-labelledby="supporters-title">
      <h2 id="supporters-title">{{ $t('about.supportersTitle') }}</h2>
      <p>{{ $t('about.supportersThanks') }}</p>
      <template v-if="supporters.length">
        <p>{{ $t('about.recentSupporters') }}</p>
        <ul class="supporters-list">
          <li v-for="supporter in supporters" :key="supporter.userID!">
            <router-link :to="{ name: 'user_stats', params: { uuid: supporter.userID } }">
              {{ supporter.name }}
            </router-link>
          </li>
        </ul>
      </template>
      <p v-if="supportersError" role="status">{{ $t('support.error') }}</p>
      <router-link class="support-link" :to="{ name: 'support' }">{{ $t('about.supportProject') }}</router-link>
    </section>

    <div class="socials">
      {{ $t('about.code') }} <b><a href="https://github.com/Razdva122/avalon" target="_blank">github</a></b
      >.
    </div>
    <div class="socials">
      {{ $t('about.contact') }} <b><a href="https://discord.gg/DR9cEDDNdN" target="_blank">discord</a></b
      >.
    </div>
    <div
      v-if="$store.state.profile && !$store.state.profile?.knownAchievements?.includes('secret_hunter')"
      @click="redeemAvatar"
      class="socials secret-avatar"
    >
      {{ $t('about.secretAvatar') }}
    </div>

    <div>
      <strong>{{ $t('about.disclaimerTitle') }}</strong>
    </div>
    <div class="disclaimer">
      {{ $t('about.disclaimerContent') }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { supportRequest, SupportInfo } from '@/api/support';
import { getImagePathByID } from '@/helpers/images';
import { socket } from '@/api/socket';

export default defineComponent({
  data() {
    return {
      getImagePathByID,
      supporters: [] as SupportInfo['donations'],
      supportersError: false,
    };
  },
  async mounted() {
    try {
      const info = await supportRequest<SupportInfo>();
      const seen = new Set<string>();
      this.supporters = info.donations.filter((donation) => {
        if (!donation.userID || !donation.name || seen.has(donation.userID)) return false;
        seen.add(donation.userID);
        return true;
      });
    } catch {
      this.supportersError = true;
    }
  },
  methods: {
    redeemAvatar() {
      socket.emit('revealEasterEgg');
    },
  },
});
</script>

<style scoped lang="scss">
@import '@/styles/info-page.scss';

.supporters {
  margin: 24px 0;
  padding: 20px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 12px;
}

.supporters h2 {
  font-size: 24px;
  margin-bottom: 12px;
}

.supporters-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  list-style: none;
  padding: 0;
}

.supporters a {
  display: inline-block;
  padding: 8px 0;
  overflow-wrap: anywhere;
}

.supporters a:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

.support-link {
  font-weight: 700;
}

.socials {
  font-size: 24px;
}

.preview {
  width: 100%;
  max-width: 600px;
}

.secret-avatar {
  cursor: pointer;
}

.image {
  text-align: center;
}

.disclaimer {
  font-size: 12px;
}
</style>
