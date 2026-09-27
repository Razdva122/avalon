/**
 * History-related translations for Spanish language
 * This file contains translations for game history
 */
export default {
  history: {
    listView: 'Eventos',
    tableView: 'Tabla de votos',
    noVotes: 'Aún no hay votos',
    teamMember: 'En el equipo',
    teamLeader: 'Líder',
    anonymousVotes: 'Voto anónimo',
    scrollTable: 'Desliza horizontalmente para ver todos los votos',
    player: 'Jugador',
    voteTotals: 'A favor / En contra',

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
    checkInfo: '{ladyOwner} verificó la lealtad de {ladyTarget}',
  },
  revealLoyalty: {
    revealInfo: '{revealer} reveló su lealtad a {target}',
  },
  announceLoyalty: {
    announceInfo: '{announcer} anunció la lealtad de {target}',
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
    switchInfo: '{switcher} usó excalibur para cambiar la acción de {target} a',
  },
  assassinate: {
    lovers: 'Amantes',
    assassinate: 'Asesinato',
    shot: '{killerName} asesina a {killedName}',
    shotResultHit: '{killedName} es {roleName}',
    shotResultMiss: '{killedName} no es {roleName}',
  },
  giveCard: {
    toPlayer: '{leaderName} dio la carta «{cardName}» a {cardOwner}',
    toSelf: '{leaderName} se dio la carta «{cardName}» a sí mismo',
  },
  restoreHonor: {
    transfer: '{newOwnerName} tomó la carta «{cardName}» de {prevOwnerName}',
  },
  ambush: {
    history: '{ownerName} usó la carta Emboscada en {targetName} y vio su acción: {result}',
    resultHidden: 'oculto',
  },
  leadToVictory: {
    history: '{cardOwner} usó la carta «{cardName}» y tomó el liderazgo de {prevLeaderName}',
  },
  kingReturns: {
    history: '{cardOwner} usó la carta «{cardName}» para cancelar la última votación y cambiar el liderazgo',
  },
  playCard: {
    history: '{cardOwner} jugó la carta «{cardName}»',
  },
  preVote: {
    title: 'Votación preliminar',
  },
};
