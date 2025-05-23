/**
 * Main export file for Russian translations
 * Imports and combines all feature-specific translation modules
 */
import pages from '@/i18n/langs/pages';
import menu from './menu';
import room from './room';
import game from './game';
import roles from './roles';
import addons from './addons';
import history from './history';
import ui from './ui';
import errors from './errors';
import modals from './modals';
import achievements from './achievements';

export const ru = {
  ...menu,
  ...room,
  ...game,
  ...roles,
  ...addons,
  ...history,
  ...ui,
  ...errors,
  ...modals,
  ...achievements,
  ...pages.ru,
};
