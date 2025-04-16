/**
 * History-related translations for Portuguese language
 * This file contains translations for game history
 */
export default {
  history: {
    history: 'Histórico',
    live: 'Ao vivo',
    vote: 'Voto',
    checkLoyalty: 'Verificar',
    mission: 'Missão',
    assassinate: 'Assassinar',
    switchResult: 'Excalibur',
    switchLancelots: 'Lancelots',
    giveCard: 'Carta',
    preVote: 'Pré-Voto',
    leadToVictory: 'Liderar',
    restoreHonor: 'Honra',
    ambush: 'Emboscada',
    kingReturns: 'Rei',
    playCard: 'Jogar',
    charge: 'Acusação',
    showNature: 'Natureza',
    areYouTheOne: 'Verificar',
    weFoundYou: 'Encontrado',
    showStrength: 'Força',
    revealLoyalty: 'Revelar',
    announceLoyalty: 'Anunciar',
    hidden: 'Oculto',
  },
  mission: {
    players: 'Jogadores',
    fails: 'Falhas',
    indexMission: 'missão {index}',
    failsCount: 'falhas {count}',
    hidden: 'oculto pela Bruxa',
    team: 'Equipe:',
  },
  vote: {
    forcedVote: 'Voto forçado',
    voteIndex: 'voto {index}',
    teamSelected: 'equipe selecionada por',
    team: 'Equipe',
    excaliburOwner: '(Excalibur)',
    approve: 'Aprovar:',
    reject: 'Rejeitar:',
  },
  checkLoyalty: {
    checkInfo: '<b>{ladyOwner}</b> verificou a lealdade de <b>{ladyTarget}</b>',
  },
  revealLoyalty: {
    revealInfo: '<b>{revealer}</b> revelou sua lealdade para <b>{target}</b>',
  },
  announceLoyalty: {
    announceInfo: '<b>{announcer}</b> anunciou a lealdade de <b>{target}</b>',
    declareInfo: 'E declarou sua lealdade como',
    actualInfo: 'na verdade',
  },
  lancelotsHistory: {
    becameEvil: 'tornou-se mau',
    becameGood: 'tornou-se bom',
    lancelotSaveLoyalty: 'permaneceu leal',
    lancelotsLoyal: 'permaneceu leal',
    lancelotsSwap: 'mudou de lealdade',
    cards: 'Cartas:',
  },
  switch: {
    skip: 'decidiu não usar excalibur',
    switchInfo: '<b>{switcher}</b> usou excalibur para mudar a ação de <b>{target}</b> para',
  },
  assassinate: {
    lovers: 'Amantes',
    assassinate: 'Assassinar',
    shot: '{killerName} assassina {killedName}',
    shotResultHit: '{killedName} é {roleName}',
    shotResultMiss: '{killedName} não é {roleName}',
  },
  giveCard: {
    toPlayer: '<b>{leaderName}</b> deu a carta «{cardName}» para <b>{cardOwner}</b>',
    toSelf: '<b>{leaderName}</b> recebeu a carta «{cardName}» para si mesmo',
  },
  restoreHonor: {
    transfer: '<b>{newOwnerName}</b> pegou a carta «{cardName}» de <b>{prevOwnerName}</b>',
  },
  ambush: {
    history: '<b>{ownerName}</b> usou a carta Emboscada em <b>{targetName}</b> e viu sua ação: {result}',
    resultHidden: 'oculto',
  },
  leadToVictory: {
    history: '<b>{cardOwner}</b> usou a carta «{cardName}» e assumiu a liderança de <b>{prevLeaderName}</b>',
  },
  kingReturns: {
    history: '<b>{cardOwner}</b> usou a carta «{cardName}» para cancelar a última votação e mudar a liderança',
  },
  weFoundYou: {
    history:
      '<b>{cardOwner}</b> usou a carta «{cardName}» em <b>{selectedPlayer}</b>, forçando-o a jogar sua carta de missão abertamente',
  },
  playCard: {
    history: '<b>{cardOwner}</b> jogou a carta «{cardName}»',
  },
  preVote: {
    title: 'Votação preliminar',
  },
};
