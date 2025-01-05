import type { TLanguage } from '@/helpers/i18n/interface';
import { Dictionary } from '@avalon/types';

export const wiki: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    rules: 'Rules',
    roles: 'Roles',
    rolesTitle: 'All Roles in the Board Game Avalon',
    rolesInfo:
      'Each role has its own characteristics and objectives, making the game diverse and exciting. Below are all the available roles in the board game Avalon.',
    addons: 'Expansions',
    addonsTitle: 'Expansions for the Board Game Avalon',
    addonsInfo:
      'Adding elements such as {ladyOfLake} and {excalibur} deepens strategic possibilities and brings more intrigue to the gameplay. Below are the pages for each expansion.',
    title: 'Avalon: The Resistance - Core Game Logic',
    setup: 'Game Setup',
    playerAssignment:
      '<b>1. Player Assignment</b>: Assign each player a random character role, determining their allegiance.',
    revealPhase: "<b>2. Reveal Phase</b>: Players learn information based on their character's abilities.",
    missionSelection: 'Mission Selection',
    leaderSelection: '<b>3. Leader Selection</b>: Rotate the leader role among players.',
    teamProposal: '<b>4. Team Proposal</b>: The current leader proposes a team for the mission.',
    voteTeam: '<b>5. Vote on the Team</b>: All players vote on whether to approve the mission team.',
    missionPhase: 'Mission Phase',
    missionOutcome: "<b>6. Mission Outcome</b>: Assigned team members secretly choose the mission's outcome.",
    revealMissionResult: "<b>7. Reveal Mission Result</b>: Announce the mission's success or failure.",
    specialRolesInteractions: "Special Roles' Interactions",
    usingSpecialAbilities:
      '<b>8. Using Special Abilities</b>: Special characters may use their abilities at designed points.',
    assassinationPhase:
      '<b>9. Assassination Phase</b>: If the good side secures three missions, the Assassin gets a chance to identify Merlin to win for evil side.',
    victoryConditions: 'Victory Conditions',
    determineWinner:
      '<b>10. Determine Winner</b>: The game concludes when one side secures three missions or the Assassin correctly identifies Merlin post good side victories.',
  },
  ru: {
    rules: 'Правила',
    roles: 'Роли',
    rolesTitle: 'Все роли в настольной игре Avalon',
    rolesInfo:
      'Каждая роль имеет свои особенности и задачи, что делает игру разнообразной и увлекательной. Ниже представлены все доступные роли в настольной игре Avalon.',
    addons: 'Дополнения',
    addonsTitle: 'Дополнения для настольной игры Avalon',
    addonsInfo:
      'Добавление элементов, таких как {ladyOfLake} и {excalibur}, углубляет стратегические возможности и вносит больше интриги в игровой процесс. Ниже представлены страницы по каждому дополнению.',
    title: 'Авалон: Сопротивление - Основная Логика Игры',
    setup: 'Подготовка к Игре',
    playerAssignment:
      '<b>1. Распределение ролей</b>: Назначьте каждому игроку случайную роль, определяющую его принадлежность.',
    revealPhase: '<b>2. Фаза знакомства</b>: Игроки получают информацию в зависимости от способностей их персонажей.',
    missionSelection: 'Сбор Похода',
    leaderSelection: '<b>3. Выбор лидера</b>: Передача роли лидера между игроками.',
    teamProposal: '<b>4. Предложение команды</b>: Текущий лидер предлагает команду для совершения похода.',
    voteTeam: '<b>5. Голосование за команду</b>: Все игроки голосуют за утверждение команды для похода.',
    missionPhase: 'Фаза Похода',
    missionOutcome: '<b>6. Исход похода</b>: Назначенные члены команды тайно выбирают результат похода.',
    revealMissionResult: '<b>7. Объявление результата</b>: Оповещение о успехе или провале похода.',
    specialRolesInteractions: 'Взаимодействия Специальных Ролей',
    usingSpecialAbilities:
      '<b>8. Использование специальных способностей</b>: Специальные персонажи могут использовать свои способности в определенные моменты.',
    assassinationPhase:
      '<b>9. Фаза убийства</b>: Если светлая сторона выполняет три миссии, Убийца получает шанс на убийство Мерлина для победы темной стороны.',
    victoryConditions: 'Условия Победы',
    determineWinner:
      '<b>10. Определение победителя</b>: Игра завершается, когда одна из сторон выполнит три миссии или Убийца правильно убьет Мерлина после победы светлой стороны.',
  },
  'zh-CN': {
    rules: '规则',
    roles: '角色',
    rolesTitle: '桌游《阿瓦隆》的所有角色',
    rolesInfo: '每个角色都有其独特的特性和任务，使游戏变得多样而有趣。以下是桌游《阿瓦隆》中所有可用的角色。',
    addons: '插件',
    addonsTitle: '桌游《阿瓦隆》的扩展包',
    addonsInfo:
      '添加像 {ladyOfLake} 和 {excalibur} 这样的元素加深了战略可能性，并为游戏过程带来更多的阴谋。以下是每个扩展包的介绍页。',
    title: '阿瓦隆：反抗组织 - 核心游戏逻辑',
    setup: '游戏设置',
    playerAssignment: '<b>1. 玩家分配</b>: 给每位玩家分配一个随机角色，决定他们的阵营。',
    revealPhase: '<b>2. 揭示阶段</b>: 玩家根据自己角色的能力获得信息。',
    missionSelection: '任务选择',
    leaderSelection: '<b>3. 领袖选择</b>: 在玩家之间轮流担任领袖角色。',
    teamProposal: '<b>4. 队伍提议</b>: 当前领袖提议一个任务队伍。',
    voteTeam: '<b>5. 投票</b>: 所有玩家投票决定是否批准任务队伍。',
    missionPhase: '任务阶段',
    missionOutcome: '<b>6. 任务结果</b>: 分配的队伍成员秘密选择任务的结果。',
    revealMissionResult: '<b>7. 揭示任务结果</b>: 宣布任务的成功或失败。',
    specialRolesInteractions: '特殊角色互动',
    usingSpecialAbilities: '<b>8. 使用特殊能力</b>: 特殊角色在指定时刻使用他们的能力。',
    assassinationPhase: '<b>9. 刺杀阶段</b>: 如果好的一方完成三个任务，刺客有机会识别梅林来让坏的一方获胜。',
    victoryConditions: '胜利条件',
    determineWinner: '<b>10. 确定胜者</b>: 当一方完成三个任务或刺客在好的一方获胜后正确识别梅林时，游戏结束。',
  },
  'zh-TW': {
    rules: '規則',
    roles: '角色',
    rolesTitle: '桌遊《阿瓦隆》的所有角色',
    rolesInfo: '每個角色都有其獨特的特性和任務，使遊戲變得多樣而有趣。以下是桌遊《阿瓦隆》中所有可用的角色。',
    addons: '插件',
    addonsTitle: '桌遊《阿瓦隆》的擴充包',
    addonsInfo:
      '添加像 {ladyOfLake} 和 {excalibur} 這樣的元素加深了戰略可能性，並為遊戲過程帶來更多的陰謀。以下是每個擴充包的介紹頁。',
    title: '阿瓦隆：反抗勢力 - 核心遊戲邏輯',
    setup: '遊戲設置',
    playerAssignment: '<b>1. 玩家分配</b>: 指派每位玩家一個隨機角色，決定他們的陣營。',
    revealPhase: '<b>2. 揭示階段</b>: 玩家根據角色的能力獲得信息。',
    missionSelection: '任務選擇',
    leaderSelection: '<b>3. 領袖選擇</b>: 領袖角色在玩家之間輪流。',
    teamProposal: '<b>4. 隊伍提議</b>: 當前的領袖提議一個任務隊伍。',
    voteTeam: '<b>5. 隊伍投票</b>: 所有玩家投票是否批准任務隊伍。',
    missionPhase: '任務階段',
    missionOutcome: '<b>6. 任務結果</b>: 分配的隊伍成員秘密選擇任務的結果。',
    revealMissionResult: '<b>7. 揭示任務結果</b>: 宣布任務的成功或失敗。',
    specialRolesInteractions: '特殊角色的互動',
    usingSpecialAbilities: '<b>8. 使用特殊能力</b>: 特殊角色可在指定時點使用其能力。',
    assassinationPhase: '<b>9. 刺殺階段</b>: 如果好的勢力完成了三次任務，刺客有機會識別梅林以讓壞的勢力獲勝。',
    victoryConditions: '勝利條件',
    determineWinner: '<b>10. 確定贏家</b>: 當一方完成三次任務或刺客在好方獲勝後正確識別梅林時，遊戲結束。',
  },
  es: {
    rules: 'Reglas',
    roles: 'Roles',
    rolesTitle: 'Todos los Roles en el Juego de Mesa Avalon',
    rolesInfo:
      'Cada rol tiene sus propias características y objetivos, haciendo que el juego sea diverso y emocionante. A continuación se presentan todos los roles disponibles en el juego de mesa Avalon.',
    addons: 'Expansiones',
    addonsTitle: 'Expansiones para el Juego de Mesa Avalon',
    addonsInfo:
      'Añadir elementos como {ladyOfLake} y {excalibur} amplía las posibilidades estratégicas y aporta más intriga al juego. A continuación se muestran las páginas para cada expansión.',
    title: 'Avalon: La Resistencia - Lógica Central del Juego',
    setup: 'Configuración del Juego',
    playerAssignment:
      '<b>1. Asignación de Jugadores</b>: Asigna a cada jugador un rol de personaje aleatorio, determinando su lealtad.',
    revealPhase:
      '<b>2. Fase de Revelación</b>: Los jugadores obtienen información según las habilidades de su personaje.',
    missionSelection: 'Selección de Misión',
    leaderSelection: '<b>3. Selección de Líder</b>: Rota el papel de líder entre los jugadores.',
    teamProposal: '<b>4. Propuesta de Equipo</b>: El líder actual propone un equipo para la misión.',
    voteTeam: '<b>5. Votación sobre el Equipo</b>: Todos los jugadores votan sobre si aprueban el equipo de la misión.',
    missionPhase: 'Fase de Misión',
    missionOutcome:
      '<b>6. Resultado de la Misión</b>: Los miembros del equipo asignado eligen en secreto el resultado de la misión.',
    revealMissionResult: '<b>7. Revelar Resultado de la Misión</b>: Se anuncia el éxito o fracaso de la misión.',
    specialRolesInteractions: 'Interacciones de Roles Especiales',
    usingSpecialAbilities:
      '<b>8. Uso de Habilidades Especiales</b>: Los personajes especiales pueden usar sus habilidades en momentos designados.',
    assassinationPhase:
      '<b>9. Fase de Asesinato</b>: Si el lado bueno asegura tres misiones, el Asesino tiene la oportunidad de identificar a Merlín para ganar para el lado malvado.',
    victoryConditions: 'Condiciones de Victoria',
    determineWinner:
      '<b>10. Determinar Ganador</b>: El juego concluye cuando un lado asegura tres misiones o el Asesino identifica correctamente a Merlín después de las victorias del lado bueno.',
  },
};
