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
  evil: {
    loyalty: 'evil',
    info: 'Evil player with an unknown role',
  },
  good: {
    loyalty: 'good',
    info: 'Good player with an unknown role',
  },
  unknown: {
    loyalty: 'unknown',
    info: 'Unknown role',
  },
  mysteryWizard: {
    loyalty: 'unknown',
    info: 'One of the two wizards is good (Merlin) or evil (Morgana)',
  },
};
