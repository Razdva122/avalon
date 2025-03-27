import { TPlotCard } from '@/core/game/addons/plot-cards/interface';
import {
  ChargeCard,
  LeadToVictoryCard,
  AmbushCard,
  KingReturnsCard,
  RestoreHonorCard,
  ShowNatureCard,
  AreYouTheOneCard,
  WeFoundYouCard,
  ShowStrengthCard,
} from '@/core/game/addons/plot-cards/cards';

export function isChargeCard(card: TPlotCard): card is ChargeCard {
  return card.name === 'charge' && card instanceof ChargeCard;
}

export function isLeadToVictoryCard(card: TPlotCard): card is LeadToVictoryCard {
  return card.name === 'leadToVictory' && card instanceof LeadToVictoryCard;
}

export function isAmbushCard(card: TPlotCard): card is AmbushCard {
  return card.name === 'ambush' && card instanceof AmbushCard;
}

export function isKingReturnsCard(card: TPlotCard): card is KingReturnsCard {
  return card.name === 'kingReturns' && card instanceof KingReturnsCard;
}

export function isRestoreHonorCard(card: TPlotCard): card is RestoreHonorCard {
  return card.name === 'restoreHonor' && card instanceof RestoreHonorCard;
}

export function isShowNatureCard(card: TPlotCard): card is ShowNatureCard {
  return card.name === 'showNature' && card instanceof ShowNatureCard;
}

export function isAreYouTheOneCard(card: TPlotCard): card is AreYouTheOneCard {
  return card.name === 'areYouTheOne' && card instanceof AreYouTheOneCard;
}

export function isWeFoundYouCard(card: TPlotCard): card is WeFoundYouCard {
  return card.name === 'weFoundYou' && card instanceof WeFoundYouCard;
}

export function isShowStrengthCard(card: TPlotCard): card is ShowStrengthCard {
  return card.name === 'showStrength' && card instanceof ShowStrengthCard;
}
