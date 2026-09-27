/**
 * History-related translations for Portuguese language
 * This file contains translations for game history
 */
export default {
  history: {
    listView: 'Eventos',
    tableView: 'Tabela de votos',
    noVotes: 'Ainda não há votos',
    teamMember: 'Na equipe',
    teamLeader: 'Líder',
    anonymousVotes: 'Voto anônimo',
    scrollTable: 'Role horizontalmente para ver todos os votos',
    player: 'Jogador',
    voteTotals: 'A favor / Contra',

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
    checkInfo: '{ladyOwner} verificou a lealdade de {ladyTarget}',
  },
  revealLoyalty: {
    revealInfo: '{revealer} revelou sua lealdade para {target}',
  },
  announceLoyalty: {
    announceInfo: '{announcer} anunciou a lealdade de {target}',
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
    switchInfo: '{switcher} usou excalibur para mudar a ação de {target} para',
  },
  assassinate: {
    lovers: 'Amantes',
    assassinate: 'Assassinar',
    shot: '{killerName} assassina {killedName}',
    shotResultHit: '{killedName} é {roleName}',
    shotResultMiss: '{killedName} não é {roleName}',
  },
  giveCard: {
    toPlayer: '{leaderName} deu a carta «{cardName}» para {cardOwner}',
    toSelf: '{leaderName} recebeu a carta «{cardName}» para si mesmo',
  },
  restoreHonor: {
    transfer: '{newOwnerName} pegou a carta «{cardName}» de {prevOwnerName}',
  },
  ambush: {
    history: '{ownerName} usou a carta Emboscada em {targetName} e viu sua ação: {result}',
    resultHidden: 'oculto',
  },
  leadToVictory: {
    history: '{cardOwner} usou a carta «{cardName}» e assumiu a liderança de {prevLeaderName}',
  },
  kingReturns: {
    history: '{cardOwner} usou a carta «{cardName}» para cancelar a última votação e mudar a liderança',
  },
  weFoundYou: {
    history:
      '{cardOwner} usou a carta «{cardName}» em {selectedPlayer}, forçando-o a jogar sua carta de missão abertamente',
  },
  playCard: {
    history: '{cardOwner} jogou a carta «{cardName}»',
  },
  preVote: {
    title: 'Votação preliminar',
  },
};
