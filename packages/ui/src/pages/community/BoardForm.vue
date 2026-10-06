<template>
  <form class="board-form" @submit.prevent="submit">
    <fieldset :disabled="busy">
      <legend>{{ t(`playerBoards.${initial ? 'edit' : 'publish'}`) }}</legend>
      <div class="form-grid">
        <label v-if="kind === 'group'" class="wide"
          >{{ t('playerBoards.groupName')
          }}<input v-model.trim="draft.groupName" required maxlength="60" autocomplete="off"
        /></label>
        <div class="wide">
          <p id="board-languages-label">{{ t('playerBoards.languages') }}</p>
          <div class="language-choices" role="group" aria-labelledby="board-languages-label">
            <label
              v-for="language in BOARD_LANGUAGES"
              :key="language.value"
              :class="{ selected: draft.languages.includes(language.value) }"
            >
              <input v-model="draft.languages" type="checkbox" :value="language.value" />
              <span
                ><span aria-hidden="true">{{ languageFlags[language.value] }}</span>
                {{ t(`playerBoards.language_${language.value}`)
                }}<small v-if="language.title">{{ language.title }}</small></span
              >
            </label>
          </div>
        </div>
        <label v-if="draft.languages.includes('other')" class="wide"
          >{{ t('playerBoards.otherLanguage')
          }}<input
            v-model.trim="draft.otherLanguage"
            required
            maxlength="60"
            :placeholder="t('playerBoards.otherLanguagePlaceholder')"
        /></label>
        <label class="check wide schedule-toggle"
          ><input
            v-model="draft.scheduleEnabled"
            type="checkbox"
            aria-controls="board-schedule"
            :aria-expanded="draft.scheduleEnabled"
          />{{ t('playerBoards.specifyTime') }}</label
        >
        <div v-if="draft.scheduleEnabled" id="board-schedule" class="form-grid wide schedule-fields">
          <div class="wide">
            <p id="board-days-label">{{ t('playerBoards.days') }}</p>
            <div class="day-options" role="group" aria-labelledby="board-days-label">
              <label v-for="(day, index) in dayKeys" :key="day"
                ><input v-model="draft.days" type="checkbox" :value="index + 1" />{{ t(`playerBoards.${day}`) }}</label
              >
            </div>
          </div>
          <label
            >{{ t('playerBoards.startHour')
            }}<select v-model.number="draft.startHour">
              <option v-for="hour in hours" :key="hour" :value="hour">{{ formatHour(hour) }}</option>
            </select></label
          >
          <label
            >{{ t('playerBoards.endHour')
            }}<select v-model.number="draft.endHour">
              <option v-for="hour in hours" :key="hour" :value="hour">{{ formatHour(hour) }}</option>
            </select></label
          >
          <label class="wide"
            >{{ t('playerBoards.timeZone')
            }}<input
              v-model.trim="draft.timeZone"
              list="board-time-zones"
              required
              maxlength="80"
              aria-describedby="board-time-hint"
            />
            <datalist id="board-time-zones"><option v-for="zone in timeZones" :key="zone" :value="zone" /></datalist>
          </label>
          <p id="board-time-hint" class="hint wide">
            {{ t('playerBoards.timeHint') }}
            <span v-if="draft.endHour < draft.startHour">{{ t('playerBoards.overnight') }}.</span>
          </p>
        </div>
        <label
          >{{ t('playerBoards.communication')
          }}<select v-model="draft.communication">
            <option v-for="value in ['voice', 'text', 'either']" :key="value" :value="value">
              {{ t(`playerBoards.${value}`) }}
            </option>
          </select></label
        >
        <label
          >{{ t('playerBoards.experience')
          }}<select v-model="draft.experience">
            <option v-for="value in ['beginner', 'experienced']" :key="value" :value="value">
              {{ t(`playerBoards.${value}`) }}
            </option>
          </select></label
        >
        <label v-if="kind === 'group'" class="check"
          ><input v-model="draft.beginnerFriendly" type="checkbox" />{{ t('playerBoards.beginnerFriendly') }}</label
        >
        <label class="check"><input v-model="draft.canTeach" type="checkbox" />{{ t('playerBoards.canTeach') }}</label>
        <template v-if="kind === 'group'">
          <label
            >{{ t('playerBoards.groupSize')
            }}<input v-model.number="draft.groupSize" type="number" min="1" max="10" required
          /></label>
          <MemberPicker
            class="wide"
            v-model="draft.memberIDs"
            :members="initial && 'members' in initial ? (initial as BoardListing).members : []"
            :limit="Math.min(10, draft.groupSize || 0)"
          />
          <p v-if="invalid && (draft.memberIDs?.length || 0) > draft.groupSize" class="form-error wide" role="alert">
            {{ t('giveaway.membersLimit') }}
          </p>
        </template>
      </div>
      <h4>{{ t('playerBoards.contacts') }}</h4>
      <p class="hint">{{ t(`playerBoards.${kind === 'group' ? 'groupContactHint' : 'contactHint'}`) }}</p>
      <div v-for="(contact, index) in draft.contacts" :key="index" class="contact-row">
        <label
          ><span><ContactIcon :type="contact.type" /> {{ t('playerBoards.contactType') }}</span
          ><select v-model="contact.type">
            <option v-for="type in contactTypes" :key="type" :value="type">
              {{ type === 'qqGroup' ? t('playerBoards.qqGroup') : contactLabel(type) }}
            </option>
          </select></label
        >
        <label
          >{{ t(`playerBoards.${kind === 'group' ? 'contactIDOrLink' : 'contactID'}`)
          }}<input
            v-model.trim="contact.value"
            :aria-describedby="kind === 'group' ? `contact-help-${index}` : undefined"
            required
            :maxlength="kind === 'group' ? 512 : 80"
            autocomplete="off"
            spellcheck="false"
        /></label>
        <p v-if="kind === 'group'" :id="`contact-help-${index}`" class="hint contact-help">
          {{ t(`playerBoards.inviteHelp_${contact.type}`) }}
        </p>
        <p
          v-if="invalid && !validBoardContact(contact.type, contact.value, kind === 'group')"
          class="form-error contact-help"
          role="alert"
        >
          {{ t('playerBoards.invalidContact') }}
        </p>
        <button v-if="draft.contacts.length > 1" type="button" @click="draft.contacts.splice(index, 1)">
          {{ t('playerBoards.removeContact') }}
        </button>
      </div>
      <button v-if="draft.contacts.length < 2" type="button" @click="addContact">
        {{ t('playerBoards.addContact') }}
      </button>
      <p class="privacy-note">{{ t('playerBoards.publicContacts') }}</p>
      <p v-if="invalid" class="form-error" role="alert">{{ t('playerBoards.required') }}</p>
      <div class="form-actions">
        <button class="primary" type="submit">{{ t(`playerBoards.${initial ? 'save' : 'publish'}`) }}</button
        ><button type="button" @click="$emit('cancel')">{{ t('playerBoards.cancel') }}</button>
      </div>
    </fieldset>
  </form>
</template>

<script setup lang="ts">
import { validBoardContact } from '@avalon/types/board-contact';
import { reactive, ref } from 'vue';
import ContactIcon from './ContactIcon.vue';
import MemberPicker from './MemberPicker.vue';
import { useI18n } from 'vue-i18n';
import { BOARD_LANGUAGES, BOARD_CONTACT_TYPES } from '@avalon/types/player-board';
import type { BoardDraft, BoardListing, BoardKind, BoardContactType } from '@avalon/types/player-board';
import { contactLabel, editableDraft } from './board-helpers';
import { dayKeys, formatHour, languageFlags } from './board-display';
const props = defineProps<{ kind: BoardKind; initial?: BoardDraft; busy: boolean }>();
const emit = defineEmits<{ (e: 'save', draft: BoardDraft): void; (e: 'cancel'): void }>();
const { t, locale } = useI18n();
const contactTypes = BOARD_CONTACT_TYPES.filter((type) => props.kind === 'group' || type !== 'qqGroup');
const defaultContact: BoardContactType =
  locale.value === 'zh-TW' ? 'line' : locale.value === 'zh-CN' ? 'wechat' : 'discord';
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const timeZones = Array.from(
  new Set([
    timeZone,
    'UTC',
    'Asia/Shanghai',
    'Asia/Taipei',
    'Asia/Hong_Kong',
    'Asia/Yekaterinburg',
    'Europe/Moscow',
    'Europe/London',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'America/Sao_Paulo',
  ]),
);
const draft = reactive<BoardDraft>(
  props.initial
    ? {
        ...editableDraft(props.initial),
        ...(!props.initial.scheduleEnabled ? { startHour: 19, endHour: 22, timeZone } : {}),
      }
    : {
        kind: props.kind,
        memberIDs: [],
        groupName: '',
        languages: [],
        otherLanguage: '',
        scheduleEnabled: false,
        days: [],
        startHour: 19,
        endHour: 22,
        timeZone,
        communication: 'either',
        experience: 'beginner',
        beginnerFriendly: props.kind === 'group',
        canTeach: false,
        groupSize: props.kind === 'group' ? 4 : 1,

        contacts: [{ type: defaultContact, value: '' }],
      },
);
const hours = Array.from({ length: 24 }, (_, i) => i);
const invalid = ref(false);
function addContact() {
  const type = contactTypes.find((value) => !draft.contacts.some((contact) => contact.type === value));
  if (type) draft.contacts.push({ type, value: '' });
}
function submit() {
  let validZone = true;
  try {
    new Intl.DateTimeFormat('en', { timeZone: draft.timeZone });
  } catch {
    validZone = false;
  }
  invalid.value =
    (draft.scheduleEnabled && (!validZone || !draft.days.length || draft.startHour === draft.endHour)) ||
    !draft.languages.length ||
    (draft.languages.includes('other') && !/^[\p{L}][\p{L}\p{M} '’(),-]{0,59}$/u.test(draft.otherLanguage.trim())) ||
    draft.contacts.some((contact) => !validBoardContact(contact.type, contact.value, props.kind === 'group')) ||
    (props.kind === 'group' && !draft.groupName?.trim()) ||
    (props.kind === 'group' &&
      (!Number.isInteger(draft.groupSize) ||
        draft.groupSize < 1 ||
        draft.groupSize > 10 ||
        (draft.memberIDs?.length || 0) > draft.groupSize ||
        new Set(draft.memberIDs).size !== (draft.memberIDs?.length || 0))) ||
    new Set(draft.contacts.map((contact) => contact.type)).size !== draft.contacts.length;
  if (props.kind === 'solo') {
    draft.beginnerFriendly = false;
    draft.memberIDs = [];
  }
  if (!invalid.value) emit('save', JSON.parse(JSON.stringify(draft)));
}
</script>

<style scoped lang="scss">
.board-form {
  margin: 24px 0;
  padding: 24px;
  border: 1px solid rgb(var(--v-theme-support-border));
  border-radius: 12px;
  background: rgba(var(--v-theme-inset), 0.65);
}
fieldset {
  border: 0;
  min-width: 0;
  padding: 0;
}
legend {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.wide {
  grid-column: 1 / -1;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}
input:not([type='checkbox']),
select {
  padding: 10px 12px;
  min-height: 44px;
  width: 100%;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.35);
  border-radius: 6px;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-text-primary));
}
select[multiple] {
  min-height: 155px;
  option {
    padding: 4px;
  }
}
.day-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 8px;
  label {
    flex-direction: row;
    align-items: center;
    min-height: 44px;
  }
}
input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: rgb(var(--v-theme-primary));
}
.check {
  flex-direction: row;
  align-items: center;
  min-height: 44px;
}
.contact-row {
  display: grid;
  grid-template-columns: minmax(100px, 1fr) minmax(100px, 2fr) auto;
  gap: 12px;
  align-items: end;
  margin: 14px 0;
}
h4 {
  font-size: 18px;
  margin: 24px 0 8px;
}
.hint {
  font-size: 13px;
  line-height: 1.6;
}
.privacy-note {
  margin: 20px 0;
  line-height: 1.6;
  border-left: 3px solid rgb(var(--v-theme-support-accent));
  padding-left: 14px;
}
.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
button {
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.3);
  border-radius: 6px;
}
.primary {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
:disabled {
  opacity: 0.6;
  cursor: wait;
}
:focus-visible {
  outline: 2px solid rgb(var(--v-theme-support-accent));
  outline-offset: 3px;
}
.form-error {
  color: rgb(var(--v-theme-error));
  margin: 12px 0;
}
@media (max-width: 560px) {
  .board-form {
    padding: 16px;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .contact-row {
    grid-template-columns: 1fr;
  }
}
.language-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.language-choices label {
  flex-direction: row;
  align-items: center;
  min-height: 48px;
  padding: 8px 12px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 10px;
  cursor: pointer;
}
.language-choices label.selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}
.language-choices input {
  width: 18px;
  height: 18px;
  accent-color: rgb(var(--v-theme-primary));
}
.language-choices small {
  display: block;
  font-size: 12px;
  color: rgb(var(--v-theme-text-secondary));
}
.schedule-toggle {
  min-height: 44px;
  cursor: pointer;
}
.schedule-fields {
  padding: 18px;
  border: 1px solid rgb(var(--v-theme-surface-border));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}
.contact-help {
  grid-column: 1 / -1;
}
</style>
