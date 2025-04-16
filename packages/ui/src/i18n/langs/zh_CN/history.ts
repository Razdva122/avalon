/**
 * History-related translations for Chinese (Simplified) language
 * This file contains translations for game history
 */
export default {
  history: {
    history: '记录',
    live: '现况',
    vote: '投票',
    checkLoyalty: '检查',
    mission: '任务',
    assassinate: '暗杀',
    switchResult: '神剑',
    switchLancelots: '兰斯洛特',
    hidden: '隐藏',
    giveCard: '卡牌',
    preVote: '预投票',
    leadToVictory: '领袖',
    restoreHonor: '荣誉',
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
    fails: '失败',
    indexMission: '{index} 任务',
    failsCount: '失败 {count}',
    hidden: '由巫婆隐藏',
    team: '团队：',
  },
  vote: {
    forcedVote: '强制投票',
    voteIndex: '{index} 票',
    teamSelected: '由选择的团队',
    team: '团队',
    excaliburOwner: '(神剑)',
    approve: '批准：',
    reject: '拒绝：',
  },
  checkLoyalty: {
    checkInfo: '<b>{ladyOwner}</b> 检查了 <b>{ladyTarget}</b> 的忠诚',
  },
  revealLoyalty: {
    revealInfo: '<b>{revealer}</b> 向 <b>{target}</b> 揭示了自己的忠诚',
  },
  announceLoyalty: {
    announceInfo: '<b>{announcer}</b> 宣布了 <b>{target}</b> 的忠诚',
    declareInfo: '并宣布他的忠诚为',
    actualInfo: '实际上',
  },
  lancelotsHistory: {
    becameEvil: '变得邪恶',
    becameGood: '变得善良',
    lancelotSaveLoyalty: '保持忠诚',
    lancelotsLoyal: '保持忠诚',
    lancelotsSwap: '更改了忠诚',
    cards: '卡牌：',
  },
  switch: {
    skip: '决定不使用 神剑',
    switchInfo: '<b>{switcher}</b> 使用 神剑 将 <b>{target}</b> 的行动更改为',
  },
  assassinate: {
    lovers: '恋人',
    assassinate: '暗杀',
    shot: '{killerName} 暗杀 {killedName}',
    shotResultHit: '{killedName} 是 {roleName}',
    shotResultMiss: '{killedName} 不是 {roleName}',
  },
  giveCard: {
    toPlayer: '<b>{leaderName}</b> 将卡牌 «{cardName}» 给了 <b>{cardOwner}</b>',
    toSelf: '<b>{leaderName}</b> 自己收到了卡牌 «{cardName}»',
  },
  restoreHonor: {
    transfer: '<b>{newOwnerName}</b> 从 <b>{prevOwnerName}</b> 那里拿走了卡牌 «{cardName}»',
  },
  ambush: {
    history: '<b>{ownerName}</b> 对 <b>{targetName}</b> 使用了伏击卡并看到了他们的行动: {result}',
    resultHidden: '隐藏',
  },
  leadToVictory: {
    history: '<b>{cardOwner}</b> 使用了卡牌 «{cardName}» 并从 <b>{prevLeaderName}</b> 接过了领导权',
  },
  kingReturns: {
    history: '<b>{cardOwner}</b> 使用了卡牌 «{cardName}» 取消了最后一次投票并更换了领导权',
  },
  weFoundYou: {
    history: '<b>{cardOwner}</b> 对 <b>{selectedPlayer}</b> 使用了卡牌 «{cardName}»，迫使他公开打出任务卡',
  },
  playCard: {
    history: '<b>{cardOwner}</b> 使用了卡牌 «{cardName}»',
  },
  preVote: {
    title: '初步投票',
  },
};
