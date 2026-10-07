/**
 * History-related translations for Russian language
 * This file contains translations for game history
 */
export default {
  history: {
    listView: 'События',
    tableView: 'Таблица голосов',
    noVotes: 'Голосований пока нет',
    teamMember: 'В команде',
    teamLeader: 'Лидер',
    anonymousVotes: 'Анонимный голос',
    scrollTable: 'Прокрутите по горизонтали, чтобы увидеть все голоса',
    player: 'Игрок',
    voteTotals: 'За / Против',

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
    cardSuccess: 'Успех',
    cardFail: 'Провал',
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
    checkInfo: '{ladyOwner} проверил лояльность {ladyTarget}',
  },
  revealLoyalty: {
    revealInfo: '{revealer} показал свою лояльность {target}',
  },
  announceLoyalty: {
    announceInfo: '{announcer} объявил лояльность {target}',
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
    switchInfo: '{switcher} использовал Экскалибур и изменил решение {target} на',
  },
  assassinate: {
    verdictHit: 'Убит',
    verdictMiss: 'Промах',
    lovers: 'Любовники',
    assassinate: 'Убить',
    shot: '{killerName} убил {killedName}',
    shotResultHit: '{killedName} был {roleName}',
    shotResultMiss: '{killedName} не был {roleName}',
  },
  giveCard: {
    toPlayer: '{leaderName} передал карту «{cardName}» игроку {cardOwner}',
    toSelf: '{leaderName} получил карту «{cardName}» себе',
  },
  restoreHonor: {
    transfer: '{newOwnerName} забрал карту «{cardName}» у {prevOwnerName}',
  },
  ambush: {
    history: '{ownerName} использовал карту Засада на {targetName} и увидел его действие: {result}',
    resultHidden: 'скрыто',
  },
  leadToVictory: {
    history: '{cardOwner} использовал карту «{cardName}» и забрал лидерство у {prevLeaderName}',
  },
  kingReturns: {
    history: '{cardOwner} использовал карту «{cardName}» для отмены последнего голосования и смены лидерства',
  },
  weFoundYou: {
    history:
      '{cardOwner} использовал карту «{cardName}» на {selectedPlayer}, заставив его сыграть карту похода открыто',
  },
  playCard: {
    history: '{cardOwner} сыграл карту «{cardName}»',
  },
  preVote: {
    title: 'Предварительное голосование',
  },
};
