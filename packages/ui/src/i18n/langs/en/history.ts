/**
 * History-related translations for English language
 * This file contains translations for game history
 */
export default {
  history: {
    history: 'History',
    live: 'Live',
    vote: 'Vote',
    checkLoyalty: 'Check',
    mission: 'Mission',
    assassinate: 'Assassinate',
    switchResult: 'Excalibur',
    switchLancelots: 'Lancelots',
    giveCard: 'Card',
    preVote: 'PreVote',
    leadToVictory: 'Lead',
    restoreHonor: 'Honor',
    ambush: 'Ambush',
    kingReturns: 'King',
    playCard: 'Play',
    charge: 'Charge',
    showNature: 'Nature',
    areYouTheOne: 'Check',
    weFoundYou: 'Found',
    showStrength: 'Strength',
    revealLoyalty: 'Reveal',
    announceLoyalty: 'Announce',
    hidden: 'Hidden',
  },
  mission: {
    players: 'Players',
    fails: 'Fails',
    indexMission: '{index} mission',
    failsCount: 'fails {count}',
    hidden: 'hidden by Witch',
    team: 'Team:',
  },
  vote: {
    forcedVote: 'Forced vote',
    voteIndex: '{index} vote',
    teamSelected: 'team selected',
    team: 'Team:',
    excaliburOwner: '(Excalibur)',
    approve: 'Approve:',
    reject: 'Reject:',
  },
  checkLoyalty: {
    checkInfo: '<b>{ladyOwner}</b> checked the loyalty of <b>{ladyTarget}</b>',
  },
  revealLoyalty: {
    revealInfo: '<b>{revealer}</b> revealed their loyalty to <b>{target}</b>',
  },
  announceLoyalty: {
    announceInfo: '<b>{announcer}</b> announced the loyalty of <b>{target}</b>',
    declareInfo: 'and declared their loyalty as',
    actualInfo: 'actually',
  },
  lancelotsHistory: {
    becameEvil: 'became evil',
    becameGood: 'became good',
    lancelotSaveLoyalty: 'kept loyalty',
    lancelotsLoyal: 'kept loyalty',
    lancelotsSwap: 'swapped loyalty',
    cards: 'Cards:',
  },
  switch: {
    skip: 'decided not to use Excalibur',
    switchInfo: "<b>{switcher}</b> used Excalibur and changed <b>{target}</b>'s decision to",
  },
  assassinate: {
    lovers: 'Lovers',
    assassinate: 'Assassinate',
    shot: '{killerName} killed {killedName}',
    shotResultHit: '{killedName} was {roleName}',
    shotResultMiss: '{killedName} was not {roleName}',
  },
  giveCard: {
    toPlayer: '<b>{leaderName}</b> gave the card "{cardName}" to player <b>{cardOwner}</b>',
    toSelf: '<b>{leaderName}</b> took the card "{cardName}" for themselves',
  },
  restoreHonor: {
    transfer: '<b>{newOwnerName}</b> took the card "{cardName}" from <b>{prevOwnerName}</b>',
  },
  ambush: {
    history: '<b>{ownerName}</b> used the Ambush card on <b>{targetName}</b> and saw their action: {result}',
    resultHidden: 'hidden',
  },
  leadToVictory: {
    history: '<b>{cardOwner}</b> used the card "{cardName}" and took leadership from <b>{prevLeaderName}</b>',
  },
  kingReturns: {
    history: '<b>{cardOwner}</b> used the card "{cardName}" to cancel the last vote and change leadership',
  },
  weFoundYou: {
    history:
      '<b>{cardOwner}</b> used the card "{cardName}" on <b>{selectedPlayer}</b>, forcing them to play their mission card openly',
  },
  playCard: {
    history: '<b>{cardOwner}</b> played the card "{cardName}"',
  },
  preVote: {
    title: 'Preliminary vote',
  },
};
