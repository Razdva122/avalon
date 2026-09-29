<template>
  <article class="board-card" :class="{ 'board-card-own': owner }">
    <div v-if="owner" class="owner-toolbar">
      <strong>{{ t('playerBoards.mine') }}</strong>
      <button
        v-if="!listing.moderated && !banned"
        type="button"
        class="edit-button"
        :disabled="busy"
        @click="$emit('edit')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z" />
        </svg>
        {{ t('playerBoards.edit') }}
      </button>
    </div>
    <header>
      <Avatar v-if="listing.kind === 'solo'" :avatarID="listing.avatar" class="board-avatar" />
      <div class="identity">
        <h3>{{ listing.kind === 'group' ? listing.groupName : listing.name }}</h3>
      </div>
      <span v-if="owner" class="status">{{ t(`playerBoards.${state}`) }}</span>
    </header>
    <p class="listing-details">
      <span><CategoryIcon :type="listing.experience" />{{ t(`playerBoards.${listing.experience}`) }}</span
      ><span><CategoryIcon :type="listing.communication" />{{ t(`playerBoards.${listing.communication}`) }}</span>
    </p>
    <p v-if="listing.kind === 'group'" class="group-size">
      {{ t('playerBoards.groupMembers', { size: listing.groupSize }) }}
    </p>
    <ul class="tags" :aria-label="t('playerBoards.languages')">
      <li v-for="language in listing.languages" :key="language">
        <span aria-hidden="true">{{ languageFlags[language] }}</span>
        {{ language === 'other' ? listing.otherLanguage : t(`playerBoards.language_${language}`) }}
      </li>
      <li v-if="listing.kind === 'group' && listing.beginnerFriendly">{{ t('playerBoards.beginnerFriendly') }}</li>
      <li v-if="listing.canTeach">{{ t('playerBoards.canTeach') }}</li>
    </ul>
    <p v-if="listing.scheduleEnabled" class="schedule">
      {{ listing.days.map((day) => t(`playerBoards.${dayKeys[day - 1]}`)).join(', ') }}<br />
      <strong>{{ formatHour(listing.startHour) }}–{{ formatHour(listing.endHour) }}</strong> · {{ listing.timeZone }}
      <span v-if="listing.endHour < listing.startHour"> · {{ t('playerBoards.overnight') }}</span>
    </p>
    <div class="board-contacts">
      <div v-for="(contact, index) in listing.contacts" :key="contact.type" class="contact">
        <span class="contact-platform"
          ><ContactIcon :type="contact.type" /><span>{{
            contact.type === 'qqGroup' ? t('playerBoards.qqGroup') : contactLabel(contact.type)
          }}</span></span
        ><a
          v-if="listing.kind === 'group' && boardInviteUrl(contact.type, contact.value)"
          class="invite-link"
          :href="boardInviteUrl(contact.type, contact.value)!"
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          >{{ t('playerBoards.openInvite') }} ↗</a
        ><code v-else>{{ contact.value }}</code>
        <button
          type="button"
          :aria-label="`${t(boardInviteUrl(contact.type, contact.value) ? 'playerBoards.copyLink' : 'playerBoards.copy')}: ${contactLabel(contact.type)}`"
          @click="copy(contact.value, index)"
        >
          {{
            t(
              `playerBoards.${copied === index ? 'copied' : boardInviteUrl(contact.type, contact.value) ? 'copyLink' : 'copy'}`,
            )
          }}
        </button>
      </div>
    </div>
    <p v-if="copyFailed" role="status" class="hint">{{ t('playerBoards.copyError') }}</p>
    <footer>
      <span>{{ t('playerBoards.bumped', { date: date(listing.bumpedAt) }) }}</span>
    </footer>
    <div v-if="owner" class="card-actions">
      <template v-if="!listing.moderated && !banned">
        <button
          v-if="state === 'active'"
          type="button"
          :disabled="busy || now < nextBumpAt(listing)"
          @click="$emit('action', 'bump')"
        >
          {{ t('playerBoards.bump') }}
        </button>
        <button v-else type="button" class="activate-button" :disabled="busy" @click="$emit('action', 'reactivate')">
          {{ t('playerBoards.reactivate') }}
        </button>
      </template>
      <button v-if="state === 'active'" type="button" :disabled="busy" @click="$emit('action', 'hide')">
        {{ t('playerBoards.hide') }}
      </button>
      <p v-if="state === 'active' && !banned && now < nextBumpAt(listing)" class="hint">
        {{ t('playerBoards.bumpAvailable', { date: date(new Date(nextBumpAt(listing)).toISOString(), true) }) }}
      </p>
    </div>
    <button v-else-if="canReport" type="button" class="report-button" :disabled="busy" @click="$emit('report')">
      <ReportIcon />{{ t('playerBoards.report') }}
    </button>
  </article>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ContactIcon from './ContactIcon.vue';
import type { BoardAction, BoardListing } from '@avalon/types/player-board';
import { boardInviteUrl } from '@avalon/types/board-contact';
import ReportIcon from './ReportIcon.vue';
import CategoryIcon from './CategoryIcon.vue';
import Avatar from '@/components/user/Avatar.vue';
import { contactLabel, listingState, nextBumpAt } from './board-helpers';
import { dayKeys, formatHour, languageFlags } from './board-display';
const props = defineProps<{
  listing: BoardListing;
  owner?: boolean;
  banned?: boolean;
  busy?: boolean;
  canReport?: boolean;
  now: number;
}>();
defineEmits<{ (e: 'edit'): void; (e: 'action', action: BoardAction): void; (e: 'report'): void }>();
const { t, locale } = useI18n();
const state = computed(() => listingState(props.listing, props.now));
const copied = ref(-1);
const copyFailed = ref(false);
function date(value: string, time = false) {
  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    ...(time ? { timeStyle: 'short' as const } : {}),
  }).format(new Date(value));
}
async function copy(value: string, index: number) {
  copyFailed.value = false;
  try {
    await navigator.clipboard.writeText(value);
    copied.value = index;
  } catch {
    copyFailed.value = true;
  }
}
</script>
<style scoped lang="scss">
.activate-button {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.board-card {
  padding: 24px;
  margin: 16px 0;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 14px;
  overflow-wrap: anywhere;
}
.board-card-own {
  border: 2px solid rgb(var(--v-theme-primary));
  background:
    linear-gradient(rgba(var(--v-theme-primary), 0.05), rgba(var(--v-theme-primary), 0.05)), rgb(var(--v-theme-surface));
}
.owner-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.25);
  strong {
    font-size: 15px;
  }
}
.edit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  svg {
    width: 18px;
    height: 18px;
  }
}
header {
  display: flex;
  align-items: center;
  gap: 14px;
}
.board-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
.identity {
  flex: 1;
  min-width: 0;
  h3 {
    font-size: 20px;
  }
  p {
    margin-top: 4px;
    font-size: 13px;
  }
}
.status {
  font-size: 12px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.25);
  border-radius: 6px;
  padding: 4px 8px;
}
.group-size {
  margin-top: 16px;
  font-weight: 600;
}
.tags {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
  padding: 0;
  li {
    font-size: 13px;
    padding: 4px 9px;
    border-radius: 5px;
    background: rgba(var(--v-theme-text-primary), 0.07);
  }
}
.schedule {
  line-height: 1.8;
  font-size: 14px;
}
.board-contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 18px 0;
}
.contact {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.2);
  border-radius: 8px;
  font-size: 13px;
  code {
    user-select: all;
    overflow-wrap: anywhere;
  }
}
button {
  padding: 8px 12px;
  min-height: 44px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.25);
  border-radius: 6px;
  font-size: 13px;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
button:focus-visible {
  outline: 2px solid rgb(var(--v-theme-support-accent));
  outline-offset: 3px;
}
footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  font-size: 12px;
}
.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
  .hint {
    flex-basis: 100%;
  }
}
.hint {
  font-size: 13px;
  line-height: 1.6;
  margin-top: 6px;
}
.report-button {
  display: flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  margin: 12px 0 -8px auto;
  border-color: transparent;
  border-radius: 8px;
  color: rgb(var(--v-theme-text-secondary));
  &:hover {
    background: rgb(var(--v-theme-inset-hover));
    color: rgb(var(--v-theme-text-primary));
  }
}
.listing-details,
.listing-details span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.listing-details {
  flex-wrap: wrap;
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.5;
  column-gap: 16px;
  color: rgb(var(--v-theme-text-secondary));
}
.invite-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  text-underline-offset: 3px;
}
.contact-platform {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
@media (max-width: 600px) {
  .board-card {
    padding: 16px;
    margin: 12px 0;
    border-radius: 16px;
  }
  header {
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
  }
  .board-avatar {
    width: 40px;
    height: 40px;
  }
  .identity {
    flex-basis: calc(100% - 50px);
    align-self: center;
  }
  .identity h3 {
    font-size: 19px;
    line-height: 1.3;
  }
  .status {
    margin: 0;
    max-width: 100%;
    color: rgb(var(--v-theme-text-secondary));
    background: rgb(var(--v-theme-inset));
  }
  .listing-details {
    gap: 8px 16px;
    margin-top: 14px;
    align-items: flex-start;
  }
  .listing-details span {
    align-items: flex-start;
    min-width: 0;
  }
  .listing-details :deep(svg) {
    flex-shrink: 0;
    margin-top: 2px;
  }
  .tags {
    gap: 6px;
    margin: 14px 0;
  }
  .tags li {
    max-width: 100%;
    padding: 5px 8px;
    line-height: 1.4;
  }
  .group-size {
    margin-top: 12px;
    font-size: 14px;
  }
  .schedule {
    line-height: 1.6;
  }
  .board-contacts {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    margin: 16px 0;
  }
  .contact {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 4px 10px;
    padding: 12px;
    background: rgb(var(--v-theme-inset));
    border-color: rgb(var(--v-theme-surface-border));
    border-radius: 10px;
  }
  .contact-platform {
    grid-column: 1;
    font-size: 13px;
  }
  .contact code,
  .contact .invite-link {
    grid-column: 1 / -1;
    grid-row: 2;
    min-width: 0;
    font-size: 14px;
    line-height: 1.5;
    white-space: normal;
  }
  .contact button {
    grid-column: 2;
    grid-row: 1;
    max-width: 150px;
    min-height: 44px;
    padding: 8px 10px;
    background: rgb(var(--v-theme-surface));
  }
  footer {
    display: grid;
    gap: 4px;
    padding-top: 12px;
    border-top: 1px solid rgb(var(--v-theme-surface-border));
    line-height: 1.5;
    color: rgb(var(--v-theme-text-secondary));
  }
  .card-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin-top: 16px;
  }
  .card-actions button {
    min-height: 48px;
    padding: 10px 8px;
    line-height: 1.4;
  }
  .card-actions button:last-of-type:nth-of-type(odd),
  .card-actions .hint {
    grid-column: 1 / -1;
  }
  .report-button {
    margin: 8px -8px -8px auto;
  }
}
</style>
