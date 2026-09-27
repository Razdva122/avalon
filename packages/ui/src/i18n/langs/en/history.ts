/**
 * History-related translations for English language
 * This file contains translations for game history
 */
export default {
  history: {
    listView: 'Event log',
    tableView: 'Vote table',
    noVotes: 'No votes yet',
    teamMember: 'Team member',
    teamLeader: 'Team leader',
    anonymousVotes: 'Anonymous vote',
    scrollTable: 'Scroll horizontally to see all votes',
    player: 'Player',
    voteTotals: 'For / Against',

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
    checkInfo: '{ladyOwner} checked the loyalty of {ladyTarget}',
  },
  revealLoyalty: {
    revealInfo: '{revealer} revealed their loyalty to {target}',
  },
  announceLoyalty: {
    announceInfo: '{announcer} announced the loyalty of {target}',
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
    switchInfo: "{switcher} used Excalibur and changed {target}'s decision to",
  },
  assassinate: {
    lovers: 'Lovers',
    assassinate: 'Assassinate',
    shot: '{killerName} killed {killedName}',
    shotResultHit: '{killedName} was {roleName}',
    shotResultMiss: '{killedName} was not {roleName}',
  },
  giveCard: {
    toPlayer: '{leaderName} gave the card "{cardName}" to player {cardOwner}',
    toSelf: '{leaderName} took the card "{cardName}" for themselves',
  },
  restoreHonor: {
    transfer: '{newOwnerName} took the card "{cardName}" from {prevOwnerName}',
  },
  ambush: {
    history: '{ownerName} used the Ambush card on {targetName} and saw their action: {result}',
    resultHidden: 'hidden',
  },
  leadToVictory: {
    history: '{cardOwner} used the card "{cardName}" and took leadership from {prevLeaderName}',
  },
  kingReturns: {
    history: '{cardOwner} used the card "{cardName}" to cancel the last vote and change leadership',
  },
  weFoundYou: {
    history:
      '{cardOwner} used the card "{cardName}" on {selectedPlayer}, forcing them to play their mission card openly',
  },
  playCard: {
    history: '{cardOwner} played the card "{cardName}"',
  },
  preVote: {
    title: 'Preliminary vote',
  },
};
