import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const plotCards: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    intro:
      ' is an expansion that adds a new layer of strategy and intrigue to the game. Plot Cards provide players with special abilities that can be used at strategic moments to gain information, influence game outcomes, or change the course of play.',
    howItWorks: 'How Plot Cards Work',
    mechanics:
      'The number of Plot Cards included in the game depends on the number of players: 7 cards for 5-6 players, and all 15 cards for 7+ players. Plot Cards are not secret and are kept face up throughout the game. At the beginning of each Round (there are 5 Rounds total), the leader draws Plot Cards (1 card for 5-6 players, 2 cards for 7-8 players, and 3 cards for 9-10 players) and distributes them to other players (not to themselves). Plot Cards come in three different types, each with unique timing and effects.',
    cardTypes: 'Types of Plot Cards',
    typesIntro:
      'Plot Cards are divided into three categories: Usable Cards, Instant Cards, and Effects Cards. Each type has different activation conditions and strategic applications.',
    cardsInGame: 'Cards Used in the Game',
    fiveToSixPlayers: 'For 5-6 Players (7 cards)',
    sevenPlusPlayers: 'For 7+ Players (15 cards)',
    additionalCards: 'Additional cards used with 7+ players:',
    usableCards: 'Usable Cards',
    usableIntro:
      'Usable Cards can be activated at specific moments during the game, providing powerful abilities that can significantly impact gameplay.',
    instantCards: 'Instant Cards',
    instantIntro:
      'Instant Cards provide immediate information to the holder, allowing them to gain valuable insights about other players.',
    effectsCards: 'Effects Cards',
    effectsIntro:
      'Effects Cards modify game mechanics, adding new stages or altering existing ones to create unique gameplay situations.',

    // Card Descriptions
    leadToVictoryDesc:
      'The player who receives this card may use this card to become the Leader. When "Lead to Victory" is played, another "Lead to Victory" may not be played until a vote has taken place.',

    ambushDesc:
      "The player who receives this card may use this card to examine a played mission card. The player does not need to announce that they will use this card before mission cards are played. This card does not affect the mission card checked. Multiple mission cards may be checked in a single round, but no more than one player may check a single player's mission card on a mission.",

    kingReturnsDesc:
      'The player who receives this card may use this card to reject an approved Team (successful vote). Using this card counts as a failed vote for the round and can trigger the five consecutive failed votes rule. The card must be declared before the current Leader takes any actions, such as drawing Plot cards or distributing Team tokens.',

    weFoundYouDesc:
      'The player who receives this card may use this card to force a player to play their mission card faceup. The player playing this card must declare its use and the target player prior to any player on the Team selecting their mission card.',

    restoreHonorDesc: 'The player who receives this card must take one Plot card from any other player.',

    showStrengthDesc:
      "The Leader must pass a Loyalty card to any other player for examination. This allows players to gain verified information about another player's loyalty.",

    showNatureDesc:
      "The player who receives this card must pass a Loyalty card to any other player (including the Leader) for examination. This reveals the card holder's loyalty to another player.",

    areYouTheOneDesc:
      'The player who receives this card may check the loyalty of one adjacent player using Loyalty cards. This provides targeted information about players sitting next to the card holder.',

    chargeDesc:
      'The player who receives this card must select and reveal their vote token before any other players have selected their vote tokens. This card remains in effect until the end of the game. If two "Charge!" cards are in play, those players must reveal their votes simultaneously.',

    gameplayTips: 'Strategic Gameplay Tips',
    strategicUse: 'Strategic Card Use:',
    strategicTips:
      'Timing is crucial when using Plot Cards. Good players might want to use information-gathering cards early to identify evil players, while evil players might save their cards for critical moments to sabotage missions or create confusion.',
    timing: 'Optimal Timing:',
    timingTips:
      'Consider the game state before using your card. Some cards are more effective in early rounds when information is scarce, while others can be game-changing in later rounds when tensions are high.',
    information: 'Information Management:',
    informationTips:
      'Information gained from Plot Cards should be shared strategically. Good players need to share information to coordinate, but be careful not to reveal too much to evil players.',
    deception: 'Deception Tactics:',
    deceptionTips:
      'Evil players can use Plot Cards to create false narratives or cast suspicion on good players. Consider how your card use will be perceived by others and how you can leverage it for deception.',

    faq: 'Frequently Asked Questions',
    canCombine: 'Can Plot Cards be combined with other expansions?',
    canCombineAnswer:
      'Yes, Plot Cards can be combined with other expansions like {ladyOfLake} or {excalibur}. This creates more complex gameplay with multiple strategic layers.',
    whenDistributed: 'How are Plot Cards distributed in the game?',
    whenDistributedAnswer:
      'At the beginning of each Round (there are 5 Rounds total), the leader draws Plot Cards (1 card for 5-6 players, 2 cards for 7-8 players, and 3 cards for 9-10 players) and distributes them to other players (not to themselves). The number of Plot Cards included in the game depends on the number of players: 7 cards for 5-6 players, and all 15 cards for 7+ players.',
    seeOthers: 'Can players see what Plot Cards others have?',
    seeOthersAnswer:
      'Yes, all Plot Cards remain face up after distribution, so all players can see which cards other players have received.',
    mustUse: 'Must players use their Plot Cards?',
    mustUseAnswer:
      "It depends on the card type. Effect Cards activate automatically, Instant Cards are used immediately after being given to a player, while Usable Cards can be used at the player's discretion - they can choose when to use them or not use them at all.",
  },
  ru: {
    intro:
      ' — это дополнение, которое добавляет новый уровень стратегии и интриги в игру. Сюжетные карты предоставляют игрокам особые способности, которые можно использовать в стратегические моменты для получения информации, влияния на исход игры или изменения хода игры.',
    howItWorks: 'Как работают Сюжетные карты',
    mechanics:
      'Количество Сюжетных карт, включенных в игру, зависит от числа игроков: 7 карт для 5-6 игроков и все 15 карт для 7+ игроков. Сюжетные карты не являются секретными и остаются открытыми на протяжении всей игры. В начале каждого Раунда (Раундом является успешно собранный поход перед тем, как игроки выбирают успех/провал; всего 5 Раундов), лидер берет Сюжетные карты (1 карту для 5-6 игроков, 2 карты для 7-8 игроков и 3 карты для 9-10 игроков) и распределяет их между другими игроками (не себе). Сюжетные карты бывают трех различных типов, каждый со своим временем активации и эффектами.',
    cardTypes: 'Типы Сюжетных карт',
    typesIntro:
      'Сюжетные карты делятся на три категории: Используемые Карты, Мгновенные Карты и Карты Эффектов. Каждый тип имеет различные условия активации и стратегические применения.',
    cardsInGame: 'Карты, используемые в игре',
    fiveToSixPlayers: 'Для 5-6 игроков (7 карт)',
    sevenPlusPlayers: 'Для 7+ игроков (15 карт)',
    additionalCards: 'Дополнительные карты, используемые при игре с 7+ игроками:',
    usableCards: 'Используемые Карты',
    usableIntro:
      'Используемые Карты могут быть активированы в определенные моменты во время игры, предоставляя мощные способности, которые могут значительно повлиять на игровой процесс.',
    instantCards: 'Мгновенные Карты',
    instantIntro:
      'Мгновенные Карты предоставляют немедленную информацию владельцу, позволяя получить ценные сведения о других игроках.',
    effectsCards: 'Карты Эффектов',
    effectsIntro:
      'Карты Эффектов изменяют игровую механику, добавляя новые этапы или изменяя существующие, чтобы создать уникальные игровые ситуации.',

    // Card Descriptions
    leadToVictoryDesc:
      'Игрок, получивший эту карту, может использовать её, чтобы стать Лидером. Когда "Привести к победе" разыгрывается, другая карта "Привести к победе" не может быть разыграна до тех пор, пока не состоится голосование.',

    ambushDesc:
      'Игрок, получивший эту карту, может использовать её для проверки разыгранной карты похода. Игроку не нужно объявлять, что он будет использовать эту карту до того, как карты похода будут разыграны. Эта карта не влияет на проверяемую карту похода. В одном раунде можно проверить несколько карт похода, но не более одного игрока может проверить карту похода одного игрока на походе.',

    kingReturnsDesc:
      'Игрок, получивший эту карту, может использовать её для отклонения утвержденной Команды (успешное голосование). Использование этой карты считается проваленным голосованием для раунда и может запустить правило пяти последовательных проваленных голосований. Карта должна быть объявлена до того, как текущий Лидер предпримет какие-либо действия, такие как вытягивание карт Сюжета или распределение жетонов Команды.',

    weFoundYouDesc:
      'Игрок, получивший эту карту, может использовать её, чтобы заставить игрока разыграть свою карту похода лицевой стороной вверх. Игрок, разыгрывающий эту карту, должен объявить о её использовании и целевом игроке до того, как любой игрок в Команде выберет свою карту похода.',

    restoreHonorDesc: 'Игрок, получивший эту карту, должен взять одну Сюжетную карту у любого другого игрока.',

    showStrengthDesc:
      'Лидер должен передать карту Лояльности любому другому игроку для проверки. Это позволяет игрокам получить проверенную информацию о лояльности другого игрока.',

    showNatureDesc:
      'Игрок, получивший эту карту, должен передать карту Лояльности любому другому игроку (включая Лидера) для проверки. Это раскрывает лояльность владельца карты другому игроку.',

    areYouTheOneDesc:
      'Игрок, получивший эту карту, может проверить лояльность одного соседнего игрока, используя карты Лояльности. Это предоставляет целевую информацию об игроках, сидящих рядом с владельцем карты.',

    chargeDesc:
      'Игрок, получивший эту карту, должен выбрать и показать свой жетон голосования до того, как другие игроки выбрали свои жетоны. Эта карта остается в силе до конца игры. Если в игре две карты "Иду на вы", эти игроки должны раскрывать свои голоса одновременно.',

    gameplayTips: 'Стратегические Советы по Игре',
    strategicUse: 'Стратегическое Использование Карт:',
    strategicTips:
      'Время использования Сюжетных карт имеет решающее значение. Добрые игроки могут захотеть использовать карты сбора информации рано, чтобы идентифицировать злых игроков, в то время как злые игроки могут сохранить свои карты для критических моментов.',
    timing: 'Оптимальное Время:',
    timingTips:
      'Учитывайте состояние игры перед использованием вашей карты. Некоторые карты более эффективны в ранних раундах, когда информации мало, в то время как другие могут изменить ход игры в поздних раундах, когда напряжение высоко.',
    information: 'Управление Информацией:',
    informationTips:
      'Информация, полученная из Сюжетных карт, должна быть стратегически распространена. Добрым игрокам нужно делиться информацией для координации, но будьте осторожны, чтобы не раскрыть слишком много злым игрокам.',
    deception: 'Тактика Обмана:',
    deceptionTips:
      'Злые игроки могут использовать Сюжетные карты для создания ложных нарративов или бросания подозрений на добрых игроков. Подумайте, как ваше использование карты будет воспринято другими и как вы можете использовать его для обмана.',

    faq: 'Часто Задаваемые Вопросы',
    canCombine: 'Можно ли комбинировать Сюжетные карты с другими дополнениями?',
    canCombineAnswer:
      'Да, Сюжетные карты можно комбинировать с другими дополнениями, такими как {ladyOfLake} или {excalibur}. Это создает более сложный игровой процесс с несколькими стратегическими слоями.',
    whenDistributed: 'Как распределяются Сюжетные карты в игре?',
    whenDistributedAnswer:
      'В начале каждого Раунда (всего 5 Раундов), лидер берет Сюжетные карты (1 карту для 5-6 игроков, 2 карты для 7-8 игроков и 3 карты для 9-10 игроков) и распределяет их между другими игроками (не себе). Количество Сюжетных карт, включенных в игру, зависит от числа игроков: 7 карт для 5-6 игроков и все 15 карт для 7+ игроков.',
    seeOthers: 'Могут ли игроки видеть, какие Сюжетные карты есть у других?',
    seeOthersAnswer:
      'Да, все Сюжетные карты остаются открытыми после распределения, поэтому все игроки видят, какие карты получили другие игроки.',
    mustUse: 'Обязаны ли игроки использовать свои Сюжетные карты?',
    mustUseAnswer:
      'Это зависит от типа карты. Карты Эффектов срабатывают автоматически, Мгновенные Карты используются сразу после передачи игроку, а Используемые Карты могут быть использованы по усмотрению игрока - он может выбрать, когда их использовать или не использовать вообще.',
  },
  'zh-CN': {
    intro:
      ' 是一个扩展，为游戏增加了新的战略和阴谋层面。情节卡为玩家提供了特殊能力，可以在战略时刻使用，以获取信息、影响游戏结果或改变游戏进程。',
    howItWorks: '情节卡如何运作',
    mechanics:
      '游戏中包含的情节卡数量取决于玩家人数：5-6名玩家使用7张卡，7名或更多玩家使用全部15张卡。情节卡不是秘密的，在整个游戏过程中都保持正面朝上。在每个回合开始时（总共有5个回合），领导者抽取情节卡（5-6名玩家抽1张，7-8名玩家抽2张，9-10名玩家抽3张）并分发给其他玩家（不包括自己）。情节卡有三种不同类型，每种类型都有独特的时机和效果。',
    cardTypes: '情节卡类型',
    typesIntro: '情节卡分为三类：可使用卡、即时卡和效果卡。每种类型都有不同的激活条件和战略应用。',
    cardsInGame: '游戏中使用的卡牌',
    fiveToSixPlayers: '5-6名玩家（7张卡）',
    sevenPlusPlayers: '7名或更多玩家（15张卡）',
    additionalCards: '7名或更多玩家额外使用的卡牌：',
    usableCards: '可使用卡',
    usableIntro: '可使用卡可以在游戏中特定时刻激活，提供强大的能力，可以显著影响游戏进程。',
    instantCards: '即时卡',
    instantIntro: '即时卡为持有者提供即时信息，使他们能够获得关于其他玩家的宝贵见解。',
    effectsCards: '效果卡',
    effectsIntro: '效果卡修改游戏机制，添加新阶段或改变现有阶段，创造独特的游戏情境。',

    // Card Descriptions
    leadToVictoryDesc:
      '获得此卡的玩家可以使用它成为领导者。当"引领胜利"被使用后，在进行投票之前，不能使用另一张"引领胜利"卡。',

    ambushDesc:
      '获得此卡的玩家可以使用它检查一张已打出的任务卡。玩家不需要在任务卡打出前宣布他们将使用此卡。此卡不影响被检查的任务卡。在一个回合中可以检查多张任务卡，但一名玩家的任务卡在一次任务中不能被多人检查。',

    kingReturnsDesc:
      '获得此卡的玩家可以使用它拒绝一个已批准的团队（成功投票）。使用此卡视为该回合的失败投票，可能触发连续五次失败投票规则。必须在当前领导者采取任何行动（如抽取情节卡或分发团队标记）之前宣布使用此卡。',

    weFoundYouDesc:
      '获得此卡的玩家可以使用它强制一名玩家正面朝上打出他们的任务卡。使用此卡的玩家必须在团队中任何玩家选择任务卡之前宣布使用此卡及其目标玩家。',

    restoreHonorDesc: '获得此卡的玩家必须从任何其他玩家那里拿走一张情节卡。',

    showStrengthDesc: '领导者必须将一张忠诚卡传给任何其他玩家检查。这使玩家能够获得关于另一名玩家忠诚度的确认信息。',

    showNatureDesc:
      '获得此卡的玩家必须将一张忠诚卡传给任何其他玩家（包括领导者）检查。这向另一名玩家揭示了持卡者的忠诚度。',

    areYouTheOneDesc:
      '获得此卡的玩家可以使用忠诚卡检查一名相邻玩家的忠诚度。这提供了关于坐在持卡者旁边的玩家的有针对性的信息。',

    chargeDesc:
      '获得此卡的玩家必须在其他玩家选择投票标记之前选择并揭示自己的投票标记。此卡效果持续到游戏结束。如果有两张"指控"卡在场，这些玩家必须同时揭示他们的投票。',

    gameplayTips: '战略游戏技巧',
    strategicUse: '战略性使用卡牌：',
    strategicTips:
      '使用情节卡的时机至关重要。好人可能想要早期使用信息收集卡来识别坏人，而坏人可能会保留他们的卡牌，在关键时刻破坏任务或制造混乱。',
    timing: '最佳时机：',
    timingTips:
      '在使用卡牌前考虑游戏状态。有些卡牌在早期回合信息稀缺时更有效，而其他卡牌在后期回合紧张局势下可能改变游戏走向。',
    information: '信息管理：',
    informationTips: '从情节卡获得的信息应该战略性地分享。好人需要分享信息以协调行动，但要小心不要向坏人透露太多。',
    deception: '欺骗策略：',
    deceptionTips:
      '坏人可以使用情节卡创造虚假叙述或对好人产生怀疑。考虑你的卡牌使用如何被他人感知，以及如何利用它进行欺骗。',

    faq: '常见问题',
    canCombine: '情节卡可以与其他扩展结合使用吗？',
    canCombineAnswer:
      '是的，情节卡可以与其他扩展如{ladyOfLake}或{excalibur}结合使用。这创造了具有多层战略的更复杂游戏玩法。',
    whenDistributed: '情节卡在游戏中如何分发？',
    whenDistributedAnswer:
      '在每个回合开始时（总共有5个回合），领导者抽取情节卡（5-6名玩家抽1张，7-8名玩家抽2张，9-10名玩家抽3张）并分发给其他玩家（不包括自己）。游戏中包含的情节卡数量取决于玩家人数：5-6名玩家使用7张卡，7名或更多玩家使用全部15张卡。',
    seeOthers: '玩家可以看到其他人拥有什么情节卡吗？',
    seeOthersAnswer: '是的，所有情节卡在分发后都保持正面朝上，所以所有玩家都可以看到其他玩家收到了哪些卡牌。',
    mustUse: '玩家必须使用他们的情节卡吗？',
    mustUseAnswer:
      '这取决于卡牌类型。效果卡自动激活，即时卡在给予玩家后立即使用，而可使用卡可以由玩家自行决定——他们可以选择何时使用或完全不使用。',
  },
  'zh-TW': {
    intro:
      ' 是一個擴展，為遊戲增加了新的戰略和陰謀層面。情節卡為玩家提供了特殊能力，可以在戰略時刻使用，以獲取信息、影響遊戲結果或改變遊戲進程。',
    howItWorks: '情節卡如何運作',
    mechanics:
      '遊戲中包含的情節卡數量取決於玩家人數：5-6名玩家使用7張卡，7名或更多玩家使用全部15張卡。情節卡不是秘密的，在整個遊戲過程中都保持正面朝上。在每個回合開始時（總共有5個回合），領導者抽取情節卡（5-6名玩家抽1張，7-8名玩家抽2張，9-10名玩家抽3張）並分發給其他玩家（不包括自己）。情節卡有三種不同類型，每種類型都有獨特的時機和效果。',
    cardTypes: '情節卡類型',
    typesIntro: '情節卡分為三類：可使用卡、即時卡和效果卡。每種類型都有不同的激活條件和戰略應用。',
    cardsInGame: '遊戲中使用的卡牌',
    fiveToSixPlayers: '5-6名玩家（7張卡）',
    sevenPlusPlayers: '7名或更多玩家（15張卡）',
    additionalCards: '7名或更多玩家額外使用的卡牌：',
    usableCards: '可使用卡',
    usableIntro: '可使用卡可以在遊戲中特定時刻激活，提供強大的能力，可以顯著影響遊戲進程。',
    instantCards: '即時卡',
    instantIntro: '即時卡為持有者提供即時信息，使他們能夠獲得關於其他玩家的寶貴見解。',
    effectsCards: '效果卡',
    effectsIntro: '效果卡修改遊戲機制，添加新階段或改變現有階段，創造獨特的遊戲情境。',

    // Card Descriptions
    leadToVictoryDesc:
      '獲得此卡的玩家可以使用它成為領導者。當"引領勝利"被使用後，在進行投票之前，不能使用另一張"引領勝利"卡。',

    ambushDesc:
      '獲得此卡的玩家可以使用它檢查一張已打出的任務卡。玩家不需要在任務卡打出前宣布他們將使用此卡。此卡不影響被檢查的任務卡。在一個回合中可以檢查多張任務卡，但一名玩家的任務卡在一次任務中不能被多人檢查。',

    kingReturnsDesc:
      '獲得此卡的玩家可以使用它拒絕一個已批准的團隊（成功投票）。使用此卡視為該回合的失敗投票，可能觸發連續五次失敗投票規則。必須在當前領導者採取任何行動（如抽取情節卡或分發團隊標記）之前宣布使用此卡。',

    weFoundYouDesc:
      '獲得此卡的玩家可以使用它強制一名玩家正面朝上打出他們的任務卡。使用此卡的玩家必須在團隊中任何玩家選擇任務卡之前宣布使用此卡及其目標玩家。',

    restoreHonorDesc: '獲得此卡的玩家必須從任何其他玩家那裡拿走一張情節卡。',

    showStrengthDesc: '領導者必須將一張忠誠卡傳給任何其他玩家檢查。這使玩家能夠獲得關於另一名玩家忠誠度的確認信息。',

    showNatureDesc:
      '獲得此卡的玩家必須將一張忠誠卡傳給任何其他玩家（包括領導者）檢查。這向另一名玩家揭示了持卡者的忠誠度。',

    areYouTheOneDesc:
      '獲得此卡的玩家可以使用忠誠卡檢查一名相鄰玩家的忠誠度。這提供了關於坐在持卡者旁邊的玩家的有針對性的信息。',

    chargeDesc:
      '獲得此卡的玩家必須在其他玩家選擇投票標記之前選擇並揭示自己的投票標記。此卡效果持續到遊戲結束。如果有兩張"指控"卡在場，這些玩家必須同時揭示他們的投票。',

    gameplayTips: '戰略遊戲技巧',
    strategicUse: '戰略性使用卡牌：',
    strategicTips:
      '使用情節卡的時機至關重要。好人可能想要早期使用信息收集卡來識別壞人，而壞人可能會保留他們的卡牌，在關鍵時刻破壞任務或製造混亂。',
    timing: '最佳時機：',
    timingTips:
      '在使用卡牌前考慮遊戲狀態。有些卡牌在早期回合信息稀缺時更有效，而其他卡牌在後期回合緊張局勢下可能改變遊戲走向。',
    information: '信息管理：',
    informationTips: '從情節卡獲得的信息應該戰略性地分享。好人需要分享信息以協調行動，但要小心不要向壞人透露太多。',
    deception: '欺騙策略：',
    deceptionTips:
      '壞人可以使用情節卡創造虛假敘述或對好人產生懷疑。考慮你的卡牌使用如何被他人感知，以及如何利用它進行欺騙。',

    faq: '常見問題',
    canCombine: '情節卡可以與其他擴展結合使用嗎？',
    canCombineAnswer:
      '是的，情節卡可以與其他擴展如{ladyOfLake}或{excalibur}結合使用。這創造了具有多層戰略的更複雜遊戲玩法。',
    whenDistributed: '情節卡在遊戲中如何分發？',
    whenDistributedAnswer:
      '在每個回合開始時（總共有5個回合），領導者抽取情節卡（5-6名玩家抽1張，7-8名玩家抽2張，9-10名玩家抽3張）並分發給其他玩家（不包括自己）。遊戲中包含的情節卡數量取決於玩家人數：5-6名玩家使用7張卡，7名或更多玩家使用全部15張卡。',
    seeOthers: '玩家可以看到其他人擁有什麼情節卡嗎？',
    seeOthersAnswer: '是的，所有情節卡在分發後都保持正面朝上，所以所有玩家都可以看到其他玩家收到了哪些卡牌。',
    mustUse: '玩家必須使用他們的情節卡嗎？',
    mustUseAnswer:
      '這取決於卡牌類型。效果卡自動激活，即時卡在給予玩家後立即使用，而可使用卡可以由玩家自行決定——他們可以選擇何時使用或完全不使用。',
  },
  es: {
    intro:
      ' es una expansión que añade una nueva capa de estrategia e intriga al juego. Las Cartas de Trama proporcionan a los jugadores habilidades especiales que pueden ser utilizadas en momentos estratégicos para obtener información, influir en los resultados del juego o cambiar el curso del juego.',
    howItWorks: 'Cómo Funcionan las Cartas de Trama',
    mechanics:
      'El número de Cartas de Trama incluidas en el juego depende del número de jugadores: 7 cartas para 5-6 jugadores, y todas las 15 cartas para 7+ jugadores. Las Cartas de Trama no son secretas y se mantienen boca arriba durante todo el juego. Al comienzo de cada Ronda (hay 5 Rondas en total), el líder roba Cartas de Trama (1 carta para 5-6 jugadores, 2 cartas para 7-8 jugadores, y 3 cartas para 9-10 jugadores) y las distribuye a otros jugadores (no a sí mismo). Las Cartas de Trama vienen en tres tipos diferentes, cada uno con tiempos y efectos únicos.',
    cardTypes: 'Tipos de Cartas de Trama',
    typesIntro:
      'Las Cartas de Trama se dividen en tres categorías: Cartas Utilizables, Cartas Instantáneas y Cartas de Efectos. Cada tipo tiene diferentes condiciones de activación y aplicaciones estratégicas.',
    cardsInGame: 'Cartas Utilizadas en el Juego',
    fiveToSixPlayers: 'Para 5-6 Jugadores (7 cartas)',
    sevenPlusPlayers: 'Para 7+ Jugadores (15 cartas)',
    additionalCards: 'Cartas adicionales utilizadas con 7+ jugadores:',
    usableCards: 'Cartas Utilizables',
    usableIntro:
      'Las Cartas Utilizables pueden ser activadas en momentos específicos durante el juego, proporcionando poderosas habilidades que pueden impactar significativamente en el juego.',
    instantCards: 'Cartas Instantáneas',
    instantIntro:
      'Las Cartas Instantáneas proporcionan información inmediata al portador, permitiéndoles obtener valiosas perspectivas sobre otros jugadores.',
    effectsCards: 'Cartas de Efectos',
    effectsIntro:
      'Las Cartas de Efectos modifican las mecánicas del juego, añadiendo nuevas etapas o alterando las existentes para crear situaciones de juego únicas.',

    // Card Descriptions
    leadToVictoryDesc:
      'El jugador que recibe esta carta puede usarla para convertirse en Líder. Cuando se juega "Liderar hacia la Victoria", no se puede jugar otra carta "Liderar hacia la Victoria" hasta que se haya realizado una votación.',

    ambushDesc:
      'El jugador que recibe esta carta puede usarla para examinar una carta de misión jugada. El jugador no necesita anunciar que usará esta carta antes de que se jueguen las cartas de misión. Esta carta no afecta a la carta de misión examinada. Se pueden examinar múltiples cartas de misión en una sola ronda, pero no más de un jugador puede examinar la carta de misión de un solo jugador en una misión.',

    kingReturnsDesc:
      'El jugador que recibe esta carta puede usarla para rechazar un Equipo aprobado (votación exitosa). Usar esta carta cuenta como una votación fallida para la ronda y puede activar la regla de cinco votaciones fallidas consecutivas. La carta debe ser declarada antes de que el Líder actual tome cualquier acción, como robar cartas de Trama o distribuir fichas de Equipo.',

    weFoundYouDesc:
      'El jugador que recibe esta carta puede usarla para forzar a un jugador a jugar su carta de misión boca arriba. El jugador que juega esta carta debe declarar su uso y el jugador objetivo antes de que cualquier jugador en el Equipo seleccione su carta de misión.',

    restoreHonorDesc: 'El jugador que recibe esta carta debe tomar una carta de Trama de cualquier otro jugador.',

    showStrengthDesc:
      'El Líder debe pasar una carta de Lealtad a cualquier otro jugador para su examen. Esto permite a los jugadores obtener información verificada sobre la lealtad de otro jugador.',

    showNatureDesc:
      'El jugador que recibe esta carta debe pasar una carta de Lealtad a cualquier otro jugador (incluido el Líder) para su examen. Esto revela la lealtad del portador de la carta a otro jugador.',

    areYouTheOneDesc:
      'El jugador que recibe esta carta puede comprobar la lealtad de un jugador adyacente usando cartas de Lealtad. Esto proporciona información específica sobre los jugadores sentados junto al portador de la carta.',

    chargeDesc:
      'El jugador que recibe esta carta debe seleccionar y revelar su ficha de voto antes de que cualquier otro jugador haya seleccionado sus fichas de voto. Esta carta permanece en efecto hasta el final del juego. Si hay dos cartas "Acusación" en juego, esos jugadores deben revelar sus votos simultáneamente.',

    gameplayTips: 'Consejos Estratégicos de Juego',
    strategicUse: 'Uso Estratégico de Cartas:',
    strategicTips:
      'El momento es crucial al usar las Cartas de Trama. Los jugadores buenos podrían querer usar cartas de recopilación de información temprano para identificar a los jugadores malvados, mientras que los jugadores malvados podrían guardar sus cartas para momentos críticos para sabotear misiones o crear confusión.',
    timing: 'Momento Óptimo:',
    timingTips:
      'Considera el estado del juego antes de usar tu carta. Algunas cartas son más efectivas en las primeras rondas cuando la información es escasa, mientras que otras pueden cambiar el juego en rondas posteriores cuando las tensiones son altas.',
    information: 'Gestión de la Información:',
    informationTips:
      'La información obtenida de las Cartas de Trama debe ser compartida estratégicamente. Los jugadores buenos necesitan compartir información para coordinarse, pero ten cuidado de no revelar demasiado a los jugadores malvados.',
    deception: 'Tácticas de Engaño:',
    deceptionTips:
      'Los jugadores malvados pueden usar las Cartas de Trama para crear narrativas falsas o arrojar sospechas sobre los jugadores buenos. Considera cómo será percibido tu uso de la carta por otros y cómo puedes aprovecharlo para el engaño.',

    faq: 'Preguntas Frecuentes',
    canCombine: '¿Se pueden combinar las Cartas de Trama con otras expansiones?',
    canCombineAnswer:
      'Sí, las Cartas de Trama se pueden combinar con otras expansiones como {ladyOfLake} o {excalibur}. Esto crea un juego más complejo con múltiples capas estratégicas.',
    whenDistributed: '¿Cómo se distribuyen las Cartas de Trama en el juego?',
    whenDistributedAnswer:
      'Al comienzo de cada Ronda (hay 5 Rondas en total), el líder roba Cartas de Trama (1 carta para 5-6 jugadores, 2 cartas para 7-8 jugadores, y 3 cartas para 9-10 jugadores) y las distribuye a otros jugadores (no a sí mismo). El número de Cartas de Trama incluidas en el juego depende del número de jugadores: 7 cartas para 5-6 jugadores, y todas las 15 cartas para 7+ jugadores.',
    seeOthers: '¿Pueden los jugadores ver qué Cartas de Trama tienen los demás?',
    seeOthersAnswer:
      'Sí, todas las Cartas de Trama permanecen boca arriba después de la distribución, por lo que todos los jugadores pueden ver qué cartas han recibido los demás jugadores.',
    mustUse: '¿Deben los jugadores usar sus Cartas de Trama?',
    mustUseAnswer:
      'Depende del tipo de carta. Las Cartas de Efectos se activan automáticamente, las Cartas Instantáneas se usan inmediatamente después de ser entregadas a un jugador, mientras que las Cartas Utilizables pueden ser usadas a discreción del jugador - pueden elegir cuándo usarlas o no usarlas en absoluto.',
  },
};
