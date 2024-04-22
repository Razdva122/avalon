import { TLoyalty, TVisibleRole } from '@avalon/types';

export const rolesShortInfo: { [key in TVisibleRole]: { loyalty: TLoyalty | 'unknown'; info: string } } = {
  merlin: {
    loyalty: 'good',
    info: 'Knows evil, must remain hidden',
  },
  merlinPure: {
    loyalty: 'good',
    info: 'Knows evil and their roles, must remain hidden',
  },
  percival: {
    loyalty: 'good',
    info: 'Knows two wizards (Merlin and Morgana), but does not know which of them is which',
  },
  servant: {
    loyalty: 'good',
    info: 'Loyal Servant of Arthur',
  },
  troublemaker: {
    loyalty: 'good',
    info: 'Obliged to lie about his loyalty',
  },
  guinevere: {
    loyalty: 'good',
    info: 'Knows two Lancelots but does not know their loyalty',
  },
  goodLancelot: {
    loyalty: 'good',
    info: 'Good lancelot, can switch role to evil in game',
  },
  evilLancelot: {
    loyalty: 'evil',
    info: 'Evil lancelot, can switch role to good in game',
  },
  mordred: {
    loyalty: 'evil',
    info: 'Unknown to Merlin',
  },
  morgana: {
    loyalty: 'evil',
    info: 'Appears as Merlin for Percival',
  },
  oberon: {
    loyalty: 'evil',
    info: 'Unknown to Evil',
  },
  minion: {
    loyalty: 'evil',
    info: 'Minion of Mordred',
  },
  isolde: {
    loyalty: 'good',
    info: 'Lover. Knows Tristan, must remain hidden',
  },
  tristan: {
    loyalty: 'good',
    info: 'Lover. Knows Isolde, must remain hidden',
  },
  evil: {
    loyalty: 'evil',
    info: 'Evil player with an unknown role',
  },
  good: {
    loyalty: 'good',
    info: 'Good player with an unknown role',
  },
  trickster: {
    loyalty: 'evil',
    info: 'Lying about his loyalty',
  },
  lunatic: {
    loyalty: 'evil',
    info: 'Must fail on every mission',
  },
  unknown: {
    loyalty: 'unknown',
    info: 'Unknown role',
  },
  mysteryWizard: {
    loyalty: 'unknown',
    info: 'One of the two wizards is good (Merlin) or evil (Morgana)',
  },
  unknownLancelot: {
    loyalty: 'unknown',
    info: 'Lancelot, whose loyalty is not known',
  },
};
