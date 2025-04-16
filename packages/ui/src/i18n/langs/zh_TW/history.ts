/**
 * History-related translations for Chinese (Traditional) language
 * This file contains translations for game history
 */
export default {
  history: {
    history: '記錄',
    live: '現況',
    vote: '投票',
    checkLoyalty: '檢查',
    mission: '任務',
    assassinate: '暗殺',
    switchResult: '神劍',
    switchLancelots: '蘭斯洛特',
    hidden: '隱藏',
    giveCard: '卡牌',
    preVote: '預投票',
    leadToVictory: '領袖',
    restoreHonor: '榮譽',
    ambush: '埋伏',
    kingReturns: '王者',
    playCard: '出牌',
    charge: '指控',
    showNature: '真我',
    areYouTheOne: '天命',
    weFoundYou: '找到',
    showStrength: '力量',
    revealLoyalty: '揭示',
    announceLoyalty: '宣布',
  },
  mission: {
    players: '玩家',
    fails: '失敗',
    indexMission: '{index} 任務',
    failsCount: '失敗 {count}',
    hidden: '由巫婆隱藏',
    team: '團隊：',
  },
  vote: {
    forcedVote: '強制投票',
    voteIndex: '{index} 投票',
    teamSelected: '團隊選擇者',
    team: '團隊',
    excaliburOwner: '(神劍)',
    approve: '同意:',
    reject: '拒絕:',
  },
  checkLoyalty: {
    checkInfo: '<b>{ladyOwner}</b> 檢查了 <b>{ladyTarget}</b> 的忠誠',
  },
  revealLoyalty: {
    revealInfo: '<b>{revealer}</b> 向 <b>{target}</b> 揭示了自己的忠誠',
  },
  announceLoyalty: {
    announceInfo: '<b>{announcer}</b> 宣布了 <b>{target}</b> 的忠誠',
    declareInfo: '並宣稱他的忠誠為',
    actualInfo: '實際上',
  },
  lancelotsHistory: {
    becameEvil: '變成了邪惡',
    becameGood: '變成了善良',
    lancelotSaveLoyalty: '保持忠誠',
    lancelotsLoyal: '保持忠誠',
    lancelotsSwap: '改變了忠誠',
    cards: '卡牌：',
  },
  switch: {
    skip: '決定不使用 神劍',
    switchInfo: '<b>{switcher}</b> 使用 神劍 將 <b>{target}</b> 的動作更改為',
  },
  assassinate: {
    lovers: '戀人',
    assassinate: '暗殺',
    shot: '{killerName} 暗殺 {killedName}',
    shotResultHit: '{killedName} 是 {roleName}',
    shotResultMiss: '{killedName} 不是 {roleName}',
  },
  giveCard: {
    toPlayer: '<b>{leaderName}</b> 將卡牌 «{cardName}» 給了 <b>{cardOwner}</b>',
    toSelf: '<b>{leaderName}</b> 自己收到了卡牌 «{cardName}»',
  },
  restoreHonor: {
    transfer: '<b>{newOwnerName}</b> 從 <b>{prevOwnerName}</b> 那裡拿走了卡牌 «{cardName}»',
  },
  ambush: {
    history: '<b>{ownerName}</b> 對 <b>{targetName}</b> 使用了伏擊卡並看到了他們的行動: {result}',
    resultHidden: '隱藏',
  },
  leadToVictory: {
    history: '<b>{cardOwner}</b> 使用了卡牌 «{cardName}» 並從 <b>{prevLeaderName}</b> 接過了領導權',
  },
  kingReturns: {
    history: '<b>{cardOwner}</b> 使用了卡牌 «{cardName}» 取消了最後一次投票並更換了領導權',
  },
  weFoundYou: {
    history: '<b>{cardOwner}</b> 對 <b>{selectedPlayer}</b> 使用了卡牌 «{cardName}»，迫使他公開打出任務卡',
  },
  playCard: {
    history: '<b>{cardOwner}</b> 使用了卡牌 «{cardName}»',
  },
  preVote: {
    title: '初步投票',
  },
};
