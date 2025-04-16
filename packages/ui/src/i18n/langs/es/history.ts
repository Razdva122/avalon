/**
 * History-related translations for Spanish language
 * This file contains translations for game history
 */
export default {
  history: {
    history: 'Historia',
    live: 'En vivo',
    vote: 'Voto',
    checkLoyalty: 'Verificación',
    mission: 'Misión',
    assassinate: 'Asesinato',
    switchResult: 'Excalibur',
    switchLancelots: 'Lancelotes',
    hidden: 'Oculto',
    giveCard: 'Carta',
    preVote: 'PreVoto',
    leadToVictory: 'Líder',
    restoreHonor: 'Honor',
    ambush: 'Emboscada',
    kingReturns: 'Rey',
    playCard: 'Jugar',
    charge: 'Acusación',
    showNature: 'Naturaleza',
    areYouTheOne: 'Elegido',
    weFoundYou: 'Encontrado',
    showStrength: 'Fuerza',
    revealLoyalty: 'Revelar',
    announceLoyalty: 'Anunciar',
  },
  mission: {
    players: 'Jugadores',
    fails: 'Fallos',
    indexMission: '{index} misión',
    failsCount: 'fallos {count}',
    hidden: 'oculto por la Bruja',
    team: 'Equipo:',
  },
  vote: {
    forcedVote: 'Voto forzado',
    voteIndex: '{index} voto',
    teamSelected: 'equipo seleccionado por',
    team: 'Equipo',
    excaliburOwner: '(Excalibur)',
    approve: 'Aprobar:',
    reject: 'Rechazar:',
  },
  checkLoyalty: {
    checkInfo: '<b>{ladyOwner}</b> verificó la lealtad de <b>{ladyTarget}</b>',
  },
  revealLoyalty: {
    revealInfo: '<b>{revealer}</b> reveló su lealtad a <b>{target}</b>',
  },
  announceLoyalty: {
    announceInfo: '<b>{announcer}</b> anunció la lealtad de <b>{target}</b>',
    declareInfo: 'Y declaró su lealtad como',
    actualInfo: 'en realidad',
  },
  lancelotsHistory: {
    becameEvil: 'se volvió malvado',
    becameGood: 'se volvió bueno',
    lancelotSaveLoyalty: 'permanece leal',
    lancelotsLoyal: 'permanecieron leales',
    lancelotsSwap: 'han cambiado de lealtad',
    cards: 'Cartas:',
  },
  switch: {
    skip: 'decidió no usar excalibur',
    switchInfo: '<b>{switcher}</b> usó excalibur para cambiar la acción de <b>{target}</b> a',
  },
  assassinate: {
    lovers: 'Amantes',
    assassinate: 'Asesinato',
    shot: '{killerName} asesina a {killedName}',
    shotResultHit: '{killedName} es {roleName}',
    shotResultMiss: '{killedName} no es {roleName}',
  },
  giveCard: {
    toPlayer: '<b>{leaderName}</b> dio la carta «{cardName}» a <b>{cardOwner}</b>',
    toSelf: '<b>{leaderName}</b> se dio la carta «{cardName}» a sí mismo',
  },
  restoreHonor: {
    transfer: '<b>{newOwnerName}</b> tomó la carta «{cardName}» de <b>{prevOwnerName}</b>',
  },
  ambush: {
    history: '<b>{ownerName}</b> usó la carta Emboscada en <b>{targetName}</b> y vio su acción: {result}',
    resultHidden: 'oculto',
  },
  leadToVictory: {
    history: '<b>{cardOwner}</b> usó la carta «{cardName}» y tomó el liderazgo de <b>{prevLeaderName}</b>',
  },
  kingReturns: {
    history: '<b>{cardOwner}</b> usó la carta «{cardName}» para cancelar la última votación y cambiar el liderazgo',
  },
  playCard: {
    history: '<b>{cardOwner}</b> jugó la carta «{cardName}»',
  },
  preVote: {
    title: 'Votación preliminar',
  },
};
