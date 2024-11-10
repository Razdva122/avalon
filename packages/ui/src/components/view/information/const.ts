import { i18n } from '@/plugins/i18n';

const { t } = i18n.global;

import { TLoyalty, TVisibleRole } from '@avalon/types';

export const rolesShortInfo: { [key in TVisibleRole]: { loyalty: TLoyalty | 'unknown'; info: string } } = {
  merlin: {
    loyalty: 'good',
    info: t('rolesInfo.merlinInfo'),
  },
  merlinPure: {
    loyalty: 'good',
    info: t('rolesInfo.merlinPureInfo'),
  },
  percival: {
    loyalty: 'good',
    info: t('rolesInfo.percivalInfo'),
  },
  servant: {
    loyalty: 'good',
    info: t('rolesInfo.servantInfo'),
  },
  troublemaker: {
    loyalty: 'good',
    info: t('rolesInfo.troublemakerInfo'),
  },
  guinevere: {
    loyalty: 'good',
    info: t('rolesInfo.guinevereInfo'),
  },
  goodLancelot: {
    loyalty: 'good',
    info: t('rolesInfo.goodLancelotInfo'),
  },
  evilLancelot: {
    loyalty: 'evil',
    info: t('rolesInfo.evilLancelotInfo'),
  },
  mordred: {
    loyalty: 'evil',
    info: t('rolesInfo.mordredInfo'),
  },
  morgana: {
    loyalty: 'evil',
    info: t('rolesInfo.morganaInfo'),
  },
  oberon: {
    loyalty: 'evil',
    info: t('rolesInfo.oberonInfo'),
  },
  minion: {
    loyalty: 'evil',
    info: t('rolesInfo.minionInfo'),
  },
  isolde: {
    loyalty: 'good',
    info: t('rolesInfo.isoldeInfo'),
  },
  tristan: {
    loyalty: 'good',
    info: t('rolesInfo.tristanInfo'),
  },
  evil: {
    loyalty: 'evil',
    info: t('rolesInfo.evilInfo'),
  },
  good: {
    loyalty: 'good',
    info: t('rolesInfo.goodInfo'),
  },
  trickster: {
    loyalty: 'evil',
    info: t('rolesInfo.tricksterInfo'),
  },
  lunatic: {
    loyalty: 'evil',
    info: t('rolesInfo.lunaticInfo'),
  },
  brute: {
    loyalty: 'evil',
    info: t('rolesInfo.bruteInfo'),
  },
  witch: {
    loyalty: 'evil',
    info: t('rolesInfo.witchInfo'),
  },
  unknown: {
    loyalty: 'unknown',
    info: t('rolesInfo.unknownInfo'),
  },
  mysteryWizard: {
    loyalty: 'unknown',
    info: t('rolesInfo.mysteryWizardInfo'),
  },
  unknownLancelot: {
    loyalty: 'unknown',
    info: t('rolesInfo.unknownLancelotInfo'),
  },
};
