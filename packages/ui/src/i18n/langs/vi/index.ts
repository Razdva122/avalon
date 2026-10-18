import { beginnerReview } from '../beginnerReview';
import { beginnerTips } from '../beginnerTips';
import aiAgents from './aiAgents';
import aiArena from './aiArena';
import { passwordRecovery } from '../passwordRecovery';
import { premiumCosmetics } from '../premiumCosmetics';
import stickers from './stickers';
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
import pages from '@/i18n/langs/pages';

export const vi = {
  aiArena,
  beginnerReview: beginnerReview['vi'],
  beginnerTips: beginnerTips.vi,
  aiAgents,
  passwordRecovery: passwordRecovery.vi,
  premiumCosmetics: premiumCosmetics.vi,
  ...menu,
  ...stickers,
  ...room,
  ...game,
  ...roles,
  ...addons,
  ...history,
  ...ui,
  ...errors,
  ...modals,
  ...achievements,
  ...pages.vi,
};
