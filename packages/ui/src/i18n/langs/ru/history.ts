/**
 * History-related translations for Russian language
 * This file contains translations for game history
 */
export default {
  history: {
    history: 'История',
    live: 'Сейчас',
    vote: 'Голосование',
    checkLoyalty: 'Проверка',
    mission: 'Поход',
    assassinate: 'Убийство',
    switchResult: 'Экскалибур',
    switchLancelots: 'Ланселоты',
    hidden: 'Скрыто',
    giveCard: 'Карта',
    preVote: 'ПредГолос',
    leadToVictory: 'Лидер',
    restoreHonor: 'Честь',
    ambush: 'Засада',
    kingReturns: 'Король',
    playCard: 'Играть',
    charge: 'Вызов',
    showNature: 'Суть',
    areYouTheOne: 'Тот самый',
    weFoundYou: 'Нашли',
    showStrength: 'Сила',
    revealLoyalty: 'Показать',
    announceLoyalty: 'Объявить',
  },
  mission: {
    players: 'Игроков',
    fails: 'Провалов',
    indexMission: '{index} поход',
    failsCount: 'провалов {count}',
    hidden: 'поход скрыт Ведьмой',
    team: 'Команда:',
  },
  vote: {
    forcedVote: 'Принудительное голосование',
    voteIndex: '{index} голосование',
    teamSelected: 'команда собрана',
    team: 'Команда:',
    excaliburOwner: '(Экскалибур)',
    approve: 'За:',
    reject: 'Против:',
  },
  checkLoyalty: {
    checkInfo: '<b>{ladyOwner}</b> проверил лояльность <b>{ladyTarget}</b>',
  },
  revealLoyalty: {
    revealInfo: '<b>{revealer}</b> показал свою лояльность <b>{target}</b>',
  },
  announceLoyalty: {
    announceInfo: '<b>{announcer}</b> объявил лояльность <b>{target}</b>',
    declareInfo: 'и сказал что его лояльность -',
    actualInfo: 'на самом деле',
  },
  lancelotsHistory: {
    becameEvil: 'стал темным',
    becameGood: 'стал светлым',
    lancelotSaveLoyalty: 'сохранил лояльность',
    lancelotsLoyal: 'сохранили лояльность',
    lancelotsSwap: 'сменили лояльность',
    cards: 'Карты:',
  },
  switch: {
    skip: 'решил не использовать Экскалибур',
    switchInfo: '<b>{switcher}</b> использовал Экскалибур и изменил решение <b>{target}</b> на',
  },
  assassinate: {
    lovers: 'Любовники',
    assassinate: 'Убить',
    shot: '{killerName} убил {killedName}',
    shotResultHit: '{killedName} был {roleName}',
    shotResultMiss: '{killedName} не был {roleName}',
  },
  giveCard: {
    toPlayer: '<b>{leaderName}</b> передал карту «{cardName}» игроку <b>{cardOwner}</b>',
    toSelf: '<b>{leaderName}</b> получил карту «{cardName}» себе',
  },
  restoreHonor: {
    transfer: '<b>{newOwnerName}</b> забрал карту «{cardName}» у <b>{prevOwnerName}</b>',
  },
  ambush: {
    history: '<b>{ownerName}</b> использовал карту Засада на <b>{targetName}</b> и увидел его действие: {result}',
    resultHidden: 'скрыто',
  },
  leadToVictory: {
    history: '<b>{cardOwner}</b> использовал карту «{cardName}» и забрал лидерство у <b>{prevLeaderName}</b>',
  },
  kingReturns: {
    history: '<b>{cardOwner}</b> использовал карту «{cardName}» для отмены последнего голосования и смены лидерства',
  },
  weFoundYou: {
    history:
      '<b>{cardOwner}</b> использовал карту «{cardName}» на <b>{selectedPlayer}</b>, заставив его сыграть карту похода открыто',
  },
  playCard: {
    history: '<b>{cardOwner}</b> сыграл карту «{cardName}»',
  },
  preVote: {
    title: 'Предварительное голосование',
  },
};
