import { i18n } from '@/plugins/i18n';

const { t } = i18n.global;

import { TLoyalty, TVisibleRole } from '@avalon/types';

// Resolve descriptions when read: dictionaries load asynchronously and the locale can change.
export const rolesShortInfo: { [key in TVisibleRole]: { loyalty: TLoyalty | 'unknown'; info: string } } = {
  merlin: {
    loyalty: 'good',
    get info() {
      return t('rolesInfo.merlinInfo');
    },
  },
  merlinPure: {
    loyalty: 'good',
    get info() {
      return t('rolesInfo.merlinPureInfo');
    },
  },
  percival: {
    loyalty: 'good',
    get info() {
      return t('rolesInfo.percivalInfo');
    },
  },
  servant: {
    loyalty: 'good',
    get info() {
      return t('rolesInfo.servantInfo');
    },
  },
  troublemaker: {
    loyalty: 'good',
    get info() {
      return t('rolesInfo.troublemakerInfo');
    },
  },
  guinevere: {
    loyalty: 'good',
    get info() {
      return t('rolesInfo.guinevereInfo');
    },
  },
  goodLancelot: {
    loyalty: 'good',
    get info() {
      return t('rolesInfo.goodLancelotInfo');
    },
  },
  evilLancelot: {
    loyalty: 'evil',
    get info() {
      return t('rolesInfo.evilLancelotInfo');
    },
  },
  mordred: {
    loyalty: 'evil',
    get info() {
      return t('rolesInfo.mordredInfo');
    },
  },
  morgana: {
    loyalty: 'evil',
    get info() {
      return t('rolesInfo.morganaInfo');
    },
  },
  oberon: {
    loyalty: 'evil',
    get info() {
      return t('rolesInfo.oberonInfo');
    },
  },
  wraith: {
    loyalty: 'evil',
    get info() {
      return t('rolesInfo.wraithInfo');
    },
  },
  minion: {
    loyalty: 'evil',
    get info() {
      return t('rolesInfo.minionInfo');
    },
  },
  isolde: {
    loyalty: 'good',
    get info() {
      return t('rolesInfo.isoldeInfo');
    },
  },
  tristan: {
    loyalty: 'good',
    get info() {
      return t('rolesInfo.tristanInfo');
    },
  },
  evil: {
    loyalty: 'evil',
    get info() {
      return t('rolesInfo.evilInfo');
    },
  },
  good: {
    loyalty: 'good',
    get info() {
      return t('rolesInfo.goodInfo');
    },
  },
  trickster: {
    loyalty: 'evil',
    get info() {
      return t('rolesInfo.tricksterInfo');
    },
  },
  lunatic: {
    loyalty: 'evil',
    get info() {
      return t('rolesInfo.lunaticInfo');
    },
  },
  brute: {
    loyalty: 'evil',
    get info() {
      return t('rolesInfo.bruteInfo');
    },
  },
  witch: {
    loyalty: 'evil',
    get info() {
      return t('rolesInfo.witchInfo');
    },
  },
  revealer: {
    loyalty: 'evil',
    get info() {
      return t('rolesInfo.revealerInfo');
    },
  },
  cleric: {
    loyalty: 'good',
    get info() {
      return t('rolesInfo.clericInfo');
    },
  },
  unknown: {
    loyalty: 'unknown',
    get info() {
      return t('rolesInfo.unknownInfo');
    },
  },
  mysteryWizard: {
    loyalty: 'unknown',
    get info() {
      return t('rolesInfo.mysteryWizardInfo');
    },
  },
  unknownLancelot: {
    loyalty: 'unknown',
    get info() {
      return t('rolesInfo.unknownLancelotInfo');
    },
  },
};
