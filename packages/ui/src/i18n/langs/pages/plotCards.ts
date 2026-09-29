import type { TLanguage } from '@/i18n/interface';
import type { Dictionary } from '@avalon/types';

export const plotCards: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoIntro:
      "{plotCards} add information, leadership changes and public actions to Avalon. This page explains the site's version; card names and details can differ from The Resistance editions.",
    seoRule1:
      'At the start of each mission round, before the first team proposal, draw 1 card with 5–6 players, 2 with 7–8, or 3 with 9–10. The deck contains 7 cards with 5–6 players and 15 with 7–10.',
    seoRule2:
      'The leader distributes cards to other players, except Show Your Strength, which activates on the leader. A rejected team does not start a new mission round or replenish plot cards.',
    seoRule3:
      'Instant cards resolve when received. Usable cards can be kept for their permitted stage and are spent when used. Charge is a continuing effect. Ownership of held cards is public.',
    seoLimit1:
      'Can you combine expansions? Yes: {plotCards} work with {excalibur} and either {ladyOfLake} or {ladyOfSea}. The two Ladies are alternatives in the room settings.',
    seoLimit2:
      "Are loyalty checks always true to the player's team? They use displayed loyalty: {trickster} appears good and {troublemaker} appears evil. A public claim about a private check can also be a lie.",
    seoScenario1:
      'With 8 players, two cards are drawn before the first team proposal. If that team is rejected, the next leader proposes another team without drawing two more cards.',
    seoScenario2:
      'The King Returns rejects a team even after approval and advances the failed-vote count. Using it on the fifth proposal can therefore give evil the win.',
    seoHeading: 'Avalon Plot Cards: rules, card list and distribution',
    cardsInGame: 'Cards Used in the Game',
    fiveToSixPlayers: 'For 5-6 Players (7 cards)',
    sevenPlusPlayers: 'For 7+ Players (15 cards)',
    additionalCards: 'Additional cards used with 7+ players:',
    cardTypes: 'Types of Plot Cards',
    usableCards: 'Usable Cards',
    leadToVictoryDesc:
      'The player who receives this card may use this card to become the Leader. When "Lead to Victory" is played, another "Lead to Victory" may not be played until a vote has taken place.',
    ambushDesc:
      "The player who receives this card may use this card to examine a played mission card. The player does not need to announce that they will use this card before mission cards are played. This card does not affect the mission card checked. Multiple mission cards may be checked in a single round, but no more than one player may check a single player's mission card on a mission.",
    kingReturnsDesc:
      'Use after a team is approved, before mission cards are played. Reject that team and pass leadership; this advances the failed-vote count and can trigger an evil win on the fifth proposal.',
    weFoundYouDesc:
      'The player who receives this card may use this card to force a player to play their mission card faceup. The player playing this card must declare its use and the target player prior to any player on the Team selecting their mission card.',
    instantCards: 'Instant Cards',
    restoreHonorDesc:
      'Take one held Plot Card from another player immediately. If no other player has a card to take, this effect is skipped.',
    showStrengthDesc:
      "The Leader must pass a Loyalty card to any other player for examination. This allows players to gain verified information about another player's loyalty.",
    showNatureDesc:
      "The player who receives this card must pass a Loyalty card to any other player (including the Leader) for examination. This reveals the card holder's loyalty to another player.",
    areYouTheOneDesc:
      'The player who receives this card may check the loyalty of one adjacent player using Loyalty cards. This provides targeted information about players sitting next to the card holder.',
    effectsCards: 'Effects Cards',
    chargeDesc:
      'The player who receives this card must select and reveal their vote token before any other players have selected their vote tokens. This card remains in effect until the end of the game. If two "Charge!" cards are in play, those players must reveal their votes simultaneously.',
  },
  ru: {
    seoIntro:
      '{plotCards} добавляют в Авалон проверки, смену лидера и публичные действия. Здесь описана версия сайта: названия и детали могут отличаться от изданий «Сопротивления».',
    seoRule1:
      'В начале раунда миссии, до первого предложения команды, берут 1 карту при 5–6 игроках, 2 при 7–8 или 3 при 9–10. В колоде 7 карт для 5–6 игроков и 15 для 7–10.',
    seoRule2:
      'Лидер раздаёт карты другим игрокам. Исключение — «Покажи свою силу»: она активируется у лидера. Отклонение команды не начинает новый раунд миссии и не добавляет карты.',
    seoRule3:
      'Мгновенные карты разрешаются при получении. Применяемые можно сохранить до разрешённого этапа; после использования они расходуются. «Иду на вы» действует постоянно. Владельцы полученных карт известны всем.',
    seoLimit1:
      'Можно ли сочетать дополнения? Да: можно вместе включить {plotCards}, {excalibur} и одну из Леди — {ladyOfLake} или {ladyOfSea}. Две Леди взаимоисключающие в настройках комнаты.',
    seoLimit2:
      'Всегда ли проверка показывает настоящую сторону? Она использует отображаемую лояльность: {trickster} выглядит добрым, {troublemaker} — злым. Публичный рассказ о тайной проверке тоже может быть ложью.',
    seoScenario1:
      'При 8 игроках перед первым предложением команды берут две карты. Если команду отклонили, следующий лидер предлагает новую без раздачи ещё двух карт.',
    seoScenario2:
      '«Король возвращается» отменяет уже одобренную команду и увеличивает счётчик отклонённых голосований. Применение на пятом предложении может сразу дать победу злу.',
    seoHeading: 'Карты сюжета в Авалоне: правила, состав и раздача',
    cardsInGame: 'Карты, используемые в игре',
    fiveToSixPlayers: 'Для 5-6 игроков (7 карт)',
    sevenPlusPlayers: 'Для 7+ игроков (15 карт)',
    additionalCards: 'Дополнительные карты, используемые при игре с 7+ игроками:',
    cardTypes: 'Типы Сюжетных карт',
    usableCards: 'Используемые Карты',
    leadToVictoryDesc:
      'Игрок, получивший эту карту, может использовать её, чтобы стать Лидером. Когда "Привести к победе" разыгрывается, другая карта "Привести к победе" не может быть разыграна до тех пор, пока не состоится голосование.',
    ambushDesc:
      'Игрок, получивший эту карту, может использовать её для проверки разыгранной карты похода. Игроку не нужно объявлять, что он будет использовать эту карту до того, как карты похода будут разыграны. Эта карта не влияет на проверяемую карту похода. В одном раунде можно проверить несколько карт похода, но не более одного игрока может проверить карту похода одного игрока на походе.',
    kingReturnsDesc:
      'Применяется после одобрения команды, до сдачи карт миссии. Отменяет команду и передаёт лидерство; счётчик отклонённых голосований растёт, и на пятом предложении зло может победить.',
    weFoundYouDesc:
      'Игрок, получивший эту карту, может использовать её, чтобы заставить игрока разыграть свою карту похода лицевой стороной вверх. Игрок, разыгрывающий эту карту, должен объявить о её использовании и целевом игроке до того, как любой игрок в Команде выберет свою карту похода.',
    instantCards: 'Мгновенные Карты',
    restoreHonorDesc:
      'Сразу заберите одну полученную карту сюжета у другого игрока. Если у остальных нет карт, которые можно забрать, действие пропускается.',
    showStrengthDesc:
      'Лидер должен передать карту Лояльности любому другому игроку для проверки. Это позволяет игрокам получить проверенную информацию о лояльности другого игрока.',
    showNatureDesc:
      'Игрок, получивший эту карту, должен передать карту Лояльности любому другому игроку (включая Лидера) для проверки. Это раскрывает лояльность владельца карты другому игроку.',
    areYouTheOneDesc:
      'Игрок, получивший эту карту, может проверить лояльность одного соседнего игрока, используя карты Лояльности. Это предоставляет целевую информацию об игроках, сидящих рядом с владельцем карты.',
    effectsCards: 'Карты Эффектов',
    chargeDesc:
      'Игрок, получивший эту карту, должен выбрать и показать свой жетон голосования до того, как другие игроки выбрали свои жетоны. Эта карта остается в силе до конца игры. Если в игре две карты "Иду на вы", эти игроки должны раскрывать свои голоса одновременно.',
  },
  es: {
    seoIntro:
      'Las {plotCards} añaden información, cambios de líder y acciones públicas a Avalon. Esta guía describe la versión del sitio; nombres y detalles pueden variar respecto a las ediciones de La Resistencia.',
    seoRule1:
      'Al inicio de cada ronda de misión, antes de la primera propuesta, se roba 1 carta con 5–6 jugadores, 2 con 7–8 y 3 con 9–10. El mazo tiene 7 cartas para 5–6 jugadores y 15 para 7–10.',
    seoRule2:
      'El líder reparte a otros jugadores, salvo la carta que hace revelar su propia lealtad: se activa sobre el líder. Rechazar un equipo no inicia otra ronda de misión ni repone las cartas.',
    seoRule3:
      'Las cartas instantáneas se resuelven al recibirlas. Las utilizables pueden guardarse hasta su fase permitida y se gastan al usarlas. La carta de voto público tiene un efecto continuo. Todos conocen a los propietarios de las cartas recibidas.',
    seoLimit1:
      '¿Se pueden combinar expansiones? Sí: {plotCards} funcionan con {excalibur} y con {ladyOfLake} o {ladyOfSea}. Las dos Damas son alternativas en los ajustes de sala.',
    seoLimit2:
      '¿Las consultas siempre muestran el bando real? Usan la lealtad mostrada: {trickster} aparece como bien y {troublemaker} como mal. También se puede mentir al contar un resultado privado.',
    seoScenario1:
      'Con 8 jugadores se roban dos cartas antes de proponer el primer equipo. Si se rechaza, el siguiente líder propone otro sin robar dos cartas más.',
    seoScenario2:
      'La carta que rechaza un equipo ya aprobado aumenta el contador de votaciones fallidas. Usarla en la quinta propuesta puede dar la victoria al mal.',
    seoHeading: 'Cartas de Trama en Avalon: reglas, lista y reparto',
    cardsInGame: 'Cartas Utilizadas en el Juego',
    fiveToSixPlayers: 'Para 5-6 Jugadores (7 cartas)',
    sevenPlusPlayers: 'Para 7+ Jugadores (15 cartas)',
    additionalCards: 'Cartas adicionales utilizadas con 7+ jugadores:',
    cardTypes: 'Tipos de Cartas de Trama',
    usableCards: 'Cartas Utilizables',
    leadToVictoryDesc:
      'El jugador que recibe esta carta puede usarla para convertirse en Líder. Cuando se juega "Liderar hacia la Victoria", no se puede jugar otra carta "Liderar hacia la Victoria" hasta que se haya realizado una votación.',
    ambushDesc:
      'El jugador que recibe esta carta puede usarla para examinar una carta de misión jugada. El jugador no necesita anunciar que usará esta carta antes de que se jueguen las cartas de misión. Esta carta no afecta a la carta de misión examinada. Se pueden examinar múltiples cartas de misión en una sola ronda, pero no más de un jugador puede examinar la carta de misión de un solo jugador en una misión.',
    kingReturnsDesc:
      'Úsala tras aprobar un equipo y antes de jugar cartas de misión. Rechaza ese equipo y pasa el liderazgo; aumenta el contador de votos fallidos y puede dar la victoria al mal en la quinta propuesta.',
    weFoundYouDesc:
      'El jugador que recibe esta carta puede usarla para forzar a un jugador a jugar su carta de misión boca arriba. El jugador que juega esta carta debe declarar su uso y el jugador objetivo antes de que cualquier jugador en el Equipo seleccione su carta de misión.',
    instantCards: 'Cartas Instantáneas',
    restoreHonorDesc:
      'Toma inmediatamente una Carta de Trama que tenga otro jugador. Si nadie más tiene una carta disponible, se omite el efecto.',
    showStrengthDesc:
      'El Líder debe pasar una carta de Lealtad a cualquier otro jugador para su examen. Esto permite a los jugadores obtener información verificada sobre la lealtad de otro jugador.',
    showNatureDesc:
      'El jugador que recibe esta carta debe pasar una carta de Lealtad a cualquier otro jugador (incluido el Líder) para su examen. Esto revela la lealtad del portador de la carta a otro jugador.',
    areYouTheOneDesc:
      'El jugador que recibe esta carta puede comprobar la lealtad de un jugador adyacente usando cartas de Lealtad. Esto proporciona información específica sobre los jugadores sentados junto al portador de la carta.',
    effectsCards: 'Cartas de Efectos',
    chargeDesc:
      'El jugador que recibe esta carta debe seleccionar y revelar su ficha de voto antes de que cualquier otro jugador haya seleccionado sus fichas de voto. Esta carta permanece en efecto hasta el final del juego. Si hay dos cartas "Acusación" en juego, esos jugadores deben revelar sus votos simultáneamente.',
  },
  pt: {
    seoIntro:
      'As {plotCards} acrescentam informação, mudanças de líder e ações públicas a Avalon. Esta página descreve a versão do site; nomes e detalhes podem variar entre edições de The Resistance.',
    seoRule1:
      'No início de cada rodada de missão, antes da primeira proposta, compre 1 carta com 5–6 jogadores, 2 com 7–8 ou 3 com 9–10. O baralho tem 7 cartas para 5–6 jogadores e 15 para 7–10.',
    seoRule2:
      'O líder distribui cartas a outros jogadores, exceto a carta que revela sua própria lealdade: ela é ativada no líder. Rejeitar uma equipe não inicia outra rodada de missão nem repõe as cartas.',
    seoRule3:
      'Cartas instantâneas são resolvidas ao serem recebidas. Cartas utilizáveis podem ser guardadas até a etapa permitida e são gastas ao usar. A carta de voto público tem efeito contínuo. Os donos das cartas recebidas são conhecidos por todos.',
    seoLimit1:
      'É possível combinar expansões? Sim: {plotCards} funcionam com {excalibur} e com {ladyOfLake} ou {ladyOfSea}. As duas Damas são alternativas nos ajustes da sala.',
    seoLimit2:
      'A verificação sempre mostra o lado real? Ela usa a lealdade exibida: {trickster} aparece como bem e {troublemaker} como mal. O relato público de um resultado privado também pode ser falso.',
    seoScenario1:
      'Com 8 jogadores, duas cartas são compradas antes da primeira equipe proposta. Se a equipe for rejeitada, o próximo líder propõe outra sem comprar mais duas cartas.',
    seoScenario2:
      'A carta que rejeita uma equipe já aprovada aumenta o contador de votações rejeitadas. Usá-la na quinta proposta pode dar a vitória ao mal.',
    seoHeading: 'Cartas de Enredo em Avalon: regras, lista e distribuição',
    cardsInGame: 'Cartas Usadas no Jogo',
    fiveToSixPlayers: 'Para 5-6 Jogadores (7 cartas)',
    sevenPlusPlayers: 'Para 7+ Jogadores (15 cartas)',
    additionalCards: 'Cartas adicionais usadas com 7+ jogadores:',
    cardTypes: 'Tipos de Cartas de Enredo',
    usableCards: 'Cartas Utilizáveis',
    leadToVictoryDesc:
      'O jogador que recebe esta carta pode usá-la para se tornar o Líder. Quando "Liderar para a Vitória" é jogada, outra carta "Liderar para a Vitória" não pode ser jogada até que uma votação tenha ocorrido.',
    ambushDesc:
      'O jogador que recebe esta carta pode usá-la para examinar uma carta de missão jogada. O jogador não precisa anunciar que usará esta carta antes que as cartas de missão sejam jogadas. Esta carta não afeta a carta de missão verificada. Várias cartas de missão podem ser verificadas em uma única rodada, mas não mais de um jogador pode verificar a carta de missão de um único jogador em uma missão.',
    kingReturnsDesc:
      'Use após a aprovação da equipe e antes das cartas de missão. Rejeite a equipe e passe a liderança; isso aumenta o contador de votações rejeitadas e pode dar a vitória ao mal na quinta proposta.',
    weFoundYouDesc:
      'O jogador que recebe esta carta pode usá-la para forçar um jogador a jogar sua carta de missão com a face para cima. O jogador que joga esta carta deve declarar seu uso e o jogador alvo antes que qualquer jogador na Equipe selecione sua carta de missão.',
    instantCards: 'Cartas Instantâneas',
    restoreHonorDesc:
      'Pegue imediatamente uma Carta de Enredo que esteja com outro jogador. Se ninguém mais tiver uma carta disponível, o efeito é ignorado.',
    showStrengthDesc:
      'O Líder deve passar uma carta de Lealdade para qualquer outro jogador examinar. Isso permite que os jogadores obtenham informações verificadas sobre a lealdade de outro jogador.',
    showNatureDesc:
      'O jogador que recebe esta carta deve passar uma carta de Lealdade para qualquer outro jogador (incluindo o Líder) examinar. Isso revela a lealdade do portador da carta para outro jogador.',
    areYouTheOneDesc:
      'O jogador que recebe esta carta pode verificar a lealdade de um jogador adjacente usando cartas de Lealdade. Isso fornece informações direcionadas sobre jogadores sentados ao lado do portador da carta.',
    effectsCards: 'Cartas de Efeitos',
    chargeDesc:
      'O jogador que recebe esta carta deve selecionar e revelar sua ficha de voto antes que quaisquer outros jogadores tenham selecionado suas fichas de voto. Esta carta permanece em efeito até o final do jogo. Se duas cartas "Avante!" estiverem em jogo, esses jogadores devem revelar seus votos simultaneamente.',
  },
  'zh-CN': {
    seoIntro:
      '{plotCards}为阿瓦隆增加信息查验、队长更换和公开行动。本页介绍本站版本，卡名与细节可能不同于《抵抗组织》的其他版本。',
    seoRule1:
      '每次任务轮开始、首次组队前抽牌：5–6人抽1张，7–8人抽2张，9–10人抽3张。5–6人使用7张牌的牌组，7–10人使用15张。',
    seoRule2:
      '队长把牌发给其他玩家；让队长展示自身阵营的牌是例外，会在队长身上生效。队伍被否决不会开启新的任务轮，也不会补发剧情卡。',
    seoRule3:
      '即时卡收到后立即处理。可使用卡可以保留到允许的阶段，用后消耗。公开投票卡具有持续效果。所有人都知道已发出的牌由谁持有。',
    seoLimit1:
      '可以搭配其他扩展吗？可以：{plotCards}可与{excalibur}及{ladyOfLake}或{ladyOfSea}搭配。房间设置中两位仙女只能选一位。',
    seoLimit2:
      '查验一定显示真实阵营吗？查验采用显示阵营：{trickster}显示好人，{troublemaker}显示坏人。公开转述私下结果时也可以说谎。',
    seoScenario1: '8人局首次组队前抽两张牌。如果队伍被否决，下一位队长重新组队，不再额外抽两张。',
    seoScenario2: '否决已获批准队伍的卡会增加否决计数。对第5次提案使用它，可能直接让坏人获胜。',
    seoHeading: '阿瓦隆剧情卡：完整列表、发牌与使用规则',
    cardsInGame: '游戏中使用的卡牌',
    fiveToSixPlayers: '5-6名玩家（7张卡）',
    sevenPlusPlayers: '7名或更多玩家（15张卡）',
    additionalCards: '7名或更多玩家额外使用的卡牌：',
    cardTypes: '情节卡类型',
    usableCards: '可使用卡',
    leadToVictoryDesc:
      '获得此卡的玩家可以使用它成为领导者。当"引领胜利"被使用后，在进行投票之前，不能使用另一张"引领胜利"卡。',
    ambushDesc:
      '获得此卡的玩家可以使用它检查一张已打出的任务卡。玩家不需要在任务卡打出前宣布他们将使用此卡。此卡不影响被检查的任务卡。在一个回合中可以检查多张任务卡，但一名玩家的任务卡在一次任务中不能被多人检查。',
    kingReturnsDesc:
      '在队伍获批后、任务牌提交前使用，否决该队伍并转移队长。否决计数增加，对第5次提案使用时可能让坏人直接获胜。',
    weFoundYouDesc:
      '获得此卡的玩家可以使用它强制一名玩家正面朝上打出他们的任务卡。使用此卡的玩家必须在团队中任何玩家选择任务卡之前宣布使用此卡及其目标玩家。',
    instantCards: '即时卡',
    restoreHonorDesc: '立即拿走另一位玩家持有的一张剧情卡。如果其他人都没有可拿的牌，则跳过此效果。',
    showStrengthDesc: '领导者必须将一张忠诚卡传给任何其他玩家检查。这使玩家能够获得关于另一名玩家忠诚度的确认信息。',
    showNatureDesc:
      '获得此卡的玩家必须将一张忠诚卡传给任何其他玩家（包括领导者）检查。这向另一名玩家揭示了持卡者的忠诚度。',
    areYouTheOneDesc:
      '获得此卡的玩家可以使用忠诚卡检查一名相邻玩家的忠诚度。这提供了关于坐在持卡者旁边的玩家的有针对性的信息。',
    effectsCards: '效果卡',
    chargeDesc:
      '获得此卡的玩家必须在其他玩家选择投票标记之前选择并揭示自己的投票标记。此卡效果持续到游戏结束。如果有两张"指控"卡在场，这些玩家必须同时揭示他们的投票。',
  },
  'zh-TW': {
    seoIntro:
      '{plotCards}為阿瓦隆增加資訊查驗、隊長更換和公開行動。本頁介紹本站版本，卡名與細節可能不同於《抵抗組織》的其他版本。',
    seoRule1:
      '每次任務輪開始、首次組隊前抽牌：5–6人抽1張，7–8人抽2張，9–10人抽3張。5–6人使用7張牌的牌組，7–10人使用15張。',
    seoRule2:
      '隊長把牌發給其他玩家；讓隊長展示自身陣營的牌是例外，會在隊長身上生效。隊伍被否決不會開啟新的任務輪，也不會補發劇情卡。',
    seoRule3:
      '即時卡收到後立即處理。可使用卡可以保留到允許的階段，用後消耗。公開投票卡具有持續效果。所有人都知道已發出的牌由誰持有。',
    seoLimit1:
      '可以搭配其他擴充嗎？可以：{plotCards}可與{excalibur}及{ladyOfLake}或{ladyOfSea}搭配。房間設定中兩位仙女只能選一位。',
    seoLimit2:
      '查驗一定顯示真實陣營嗎？查驗採用顯示陣營：{trickster}顯示好人，{troublemaker}顯示壞人。公開轉述私下結果時也可以說謊。',
    seoScenario1: '8人局首次組隊前抽兩張牌。如果隊伍被否決，下一位隊長重新組隊，不再額外抽兩張。',
    seoScenario2: '否決已獲批准隊伍的卡會增加否決計數。對第5次提案使用它，可能直接讓壞人獲勝。',
    seoHeading: '阿瓦隆劇情卡：完整列表、發牌與使用規則',
    cardsInGame: '遊戲中使用的卡牌',
    fiveToSixPlayers: '5-6名玩家（7張卡）',
    sevenPlusPlayers: '7名或更多玩家（15張卡）',
    additionalCards: '7名或更多玩家額外使用的卡牌：',
    cardTypes: '情節卡類型',
    usableCards: '可使用卡',
    leadToVictoryDesc:
      '獲得此卡的玩家可以使用它成為領導者。當"引領勝利"被使用後，在進行投票之前，不能使用另一張"引領勝利"卡。',
    ambushDesc:
      '獲得此卡的玩家可以使用它檢查一張已打出的任務卡。玩家不需要在任務卡打出前宣布他們將使用此卡。此卡不影響被檢查的任務卡。在一個回合中可以檢查多張任務卡，但一名玩家的任務卡在一次任務中不能被多人檢查。',
    kingReturnsDesc:
      '在隊伍獲批後、任務牌提交前使用，否決該隊伍並轉移隊長。否決計數增加，對第5次提案使用時可能讓壞人直接獲勝。',
    weFoundYouDesc:
      '獲得此卡的玩家可以使用它強制一名玩家正面朝上打出他們的任務卡。使用此卡的玩家必須在團隊中任何玩家選擇任務卡之前宣布使用此卡及其目標玩家。',
    instantCards: '即時卡',
    restoreHonorDesc: '立即拿走另一位玩家持有的一張劇情卡。如果其他人都沒有可拿的牌，則跳過此效果。',
    showStrengthDesc: '領導者必須將一張忠誠卡傳給任何其他玩家檢查。這使玩家能夠獲得關於另一名玩家忠誠度的確認信息。',
    showNatureDesc:
      '獲得此卡的玩家必須將一張忠誠卡傳給任何其他玩家（包括領導者）檢查。這向另一名玩家揭示了持卡者的忠誠度。',
    areYouTheOneDesc:
      '獲得此卡的玩家可以使用忠誠卡檢查一名相鄰玩家的忠誠度。這提供了關於坐在持卡者旁邊的玩家的有針對性的信息。',
    effectsCards: '效果卡',
    chargeDesc:
      '獲得此卡的玩家必須在其他玩家選擇投票標記之前選擇並揭示自己的投票標記。此卡效果持續到遊戲結束。如果有兩張"指控"卡在場，這些玩家必須同時揭示他們的投票。',
  },
};
