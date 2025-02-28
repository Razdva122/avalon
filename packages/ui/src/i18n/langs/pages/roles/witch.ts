import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const witch: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    generalInformation: 'General Information: ',
    intro: `As {witch}, you wield a unique power among evil's minions: hiding one mission's outcome while triggering a loyalty check on a random non-{witch} player. Though this gives good forces intel, your goal is to weaponize it — breed chaos, turn allies against each other, and sway the game to evil's favor, all while maintaining your cover.`,
    generalTipsTitle: `General Tips:`,

    sowSeedsTitle: `Sow seeds of confusion:`,
    sowSeedsText: `Utilize your skill to keep players uncertain about mission outcomes, causing doubt and indecision within the ranks of good.`,

    collaborateTitle: `Collaborate with fellow evildoers:`,
    collaborateText: `Carefully consider the consequences of hiding a mission, and only do so when it benefits you and your allies.`,

    utilizePowerTitle: `Utilize your power strategically:`,
    utilizePowerText: `Timing is crucial as you can only use your power once. When hiding a mission's result, a random non-witch player gets a loyalty check. Choose the moment that maximizes confusion while protecting your allies.`,

    maintainDisguiseTitle: `Maintain your disguise:`,
    maintainDisguiseText: `Avoid giving away any hints that could reveal your true allegiance or arouse suspicion about your intentions.`,

    strategicTipsTitle: `Strategic Tips:`,

    createUncertaintyTitle: `Create uncertainty:`,
    createUncertaintyText: `Your ability to obscure mission results leaves good players in the dark, making it difficult for them to strategize effectively.`,

    influenceGameplayTitle: `Influence gameplay:`,
    influenceGameplayText: `Encourage doubt and discord among good players, steering discussions and decisions in a direction favorable to evil.`,

    hideEarlyMissionsTitle: `Hide early missions:`,
    hideEarlyMissionsText: `Consider hiding early missions to create confusion, but remember this triggers a loyalty check. Coordinate with allies to ensure the check doesn't expose them, while casting suspicion on key opponents.`,

    conclusion: `As {witch}, you weave uncertainty through hidden missions and forced loyalty checks. Your single powerful move can expose others while protecting yourself. Use it to create paradoxes that fracture the good team's trust!`,
  },
  ru: {
    generalInformation: 'Общая информация: ',
    intro:
      'Играя за {witch}, вы получаете уникальную способность среди приспешников зла: скрыть результат одной миссии, активируя проверку лояльности у случайного игрока (не {witch}). Это даёт силам добра информацию, но ваша цель — обратить её против них: посеять хаос, заставить сомневаться в союзниках и склонить игру в пользу зла, сохраняя свою скрытность.',
    generalTipsTitle: 'Общие советы:',

    sowSeedsTitle: 'Посейте семена сомнений:',
    sowSeedsText:
      'Используйте свои способности, чтобы оставлять игроков в неведении относительно результатов миссий, вызывая сомнения и нерешительность среди добрых сил.',

    collaborateTitle: 'Сотрудничайте с другими злодеями:',
    collaborateText:
      'Продумывайте последствия скрытия похода и делайте это только тогда, когда это выгодно вам и вашим союзникам.',

    utilizePowerTitle: 'Используйте свою силу стратегически:',
    utilizePowerText:
      'Время решает всё — вы можете использовать способность лишь раз. Скрывая результат миссии, вы провоцируете проверку лояльности у другого игрока. Выбирайте момент, который максимизирует хаос, защищая своих соратников.',

    maintainDisguiseTitle: 'Сохраняйте маскировку:',
    maintainDisguiseText:
      'Избегайте любых намеков, которые могут выдать вашу истинную принадлежность или вызвать подозрения в ваших намерениях.',

    strategicTipsTitle: 'Стратегические советы:',

    createUncertaintyTitle: 'Создайте неопределенность:',
    createUncertaintyText:
      'Ваше умение скрывать результаты миссий оставляет добрых игроков в темноте, затрудняя им эффективное планирование.',

    influenceGameplayTitle: 'Влияйте на ход игры:',
    influenceGameplayText:
      'Посеять сомнение и раздор среди добрых игроков, направляя обсуждения и решения в сторону, выгодную злу.',

    hideEarlyMissionsTitle: 'Скрывайте результаты ранних миссий:',
    hideEarlyMissionsText:
      'Сокрытие ранних миссий создаёт неразбериху, но запускает проверку. Координируйтесь с союзниками, чтобы проверка не раскрыла их, одновременно бросая тень подозрения на ключевых противников.',

    conclusion:
      'Как {witch}, вы сеете хаос через скрытые миссии и вынужденные проверки. Ваш единственный ход может раскрыть других, защищая вас. Используйте его, чтобы создать неразрешимые противоречия в стане добрых!',
  },
  'zh-CN': {
    generalInformation: '一般信息：',
    intro:
      '身为{witch}，你掌握邪恶阵营独有的能力：隐藏一次任务结果并触发随机玩家（非{witch}）的忠诚检验。尽管这会让正义方获得情报，但你的真正目的是将其化为武器——制造混乱、挑拨盟友互疑，在隐藏身份的同时将游戏导向邪恶的胜利。',
    generalTipsTitle: '一般提示：',

    sowSeedsTitle: '播下困惑的种子：',
    sowSeedsText: '利用你的技能让玩家对任务结果产生不确定性，在善良力量的行列中引起怀疑和犹豫。',

    collaborateTitle: '与其他邪恶势力合作：',
    collaborateText: '隐藏任务前务必权衡后果，仅在对己方有利时使用此能力。',

    utilizePowerTitle: '战略性地使用你的能力：',
    utilizePowerText:
      '时机决定一切——你只能使用一次能力。隐藏任务结果时，会触发其他玩家的忠诚检验。选择最能制造混乱并保护盟友的时机。',

    maintainDisguiseTitle: '保持你的伪装：',
    maintainDisguiseText: '避免透露可能揭露你真实意图的任何线索，或者引起怀疑。',

    strategicTipsTitle: '战略提示：',

    createUncertaintyTitle: '制造不确定性：',
    createUncertaintyText: '你隐藏任务结果的能力让善良玩家一无所知，使他们难以有效地计划。',

    influenceGameplayTitle: '影响游戏：',
    influenceGameplayText: '鼓励善良玩家之间的疑虑和不和谐，引导讨论和决策朝着有利于邪恶的方向发展。',

    hideEarlyMissionsTitle: '隐藏早期任务：',
    hideEarlyMissionsText:
      '隐藏早期任务可制造混乱，但会触发检验。与盟友协调，确保检验不会暴露他们，同时将嫌疑引向关键对手。',

    conclusion:
      '作为{witch}，你通过隐藏任务和强制检验散播混乱。你唯一的能力既可揭露他人，又能保护自己。用它创造正义阵营无法破解的矛盾！',
  },
  'zh-TW': {
    generalInformation: '一般信息：',
    intro:
      '身為{witch}，你掌握邪惡陣營獨有的能力：隱藏一次任務結果並觸發隨機玩家（非{witch}）的忠誠檢驗。儘管這會讓正義方獲得情報，但你的真正目的是將其化為武器——製造混亂、挑撥盟友互疑，在隱藏身份的同時將遊戲導向邪惡的勝利。',
    generalTipsTitle: '一般提示：',

    sowSeedsTitle: '播下混亂的種子：',
    sowSeedsText: '利用你的技能使玩家對任務結果感到不確定，在善良力量的行列中造成懷疑和猶豫。',

    collaborateTitle: '與其他邪惡的人合作：',
    collaborateText: '隱藏任務前務必權衡後果，僅在對己方有利時使用此能力。',

    utilizePowerTitle: '戰略性地運用你的力量：',
    utilizePowerText:
      '時機決定一切——你只能使用一次能力。隱藏任務結果時，會觸發其他玩家的忠誠檢驗。選擇最能製造混亂並保護盟友的時機。',

    maintainDisguiseTitle: '保持你的偽裝：',
    maintainDisguiseText: '避免透露可能揭示你真正意圖的任何提示或引起懷疑。',

    strategicTipsTitle: '戰略提示：',

    createUncertaintyTitle: '製造不確定性：',
    createUncertaintyText: '你對任務結果的遮掩能力使善良玩家一片黑暗，讓他們難以有效策劃。',

    influenceGameplayTitle: '影響遊戲：',
    influenceGameplayText: '鼓勵善良玩家之間的懷疑和不和，將討論和決策引向對邪惡有利的方向。',

    hideEarlyMissionsTitle: '隱藏早期任務：',
    hideEarlyMissionsText:
      '隱藏早期任務可製造混亂，但會觸發檢驗。與盟友協調，確保檢驗不會暴露他們，同時將嫌疑引向關鍵對手。',

    conclusion:
      '作為{witch}，你通過隱藏任務和強制檢驗散播混亂。你唯一的能力既可揭露他人，又能保護自己。用它創造正義陣營無法破解的矛盾！',
  },
  es: {
    generalInformation: 'Información General: ',
    intro:
      'Como {witch}, posees un poder único entre los siervos del mal: ocultar el resultado de una misión mientras activas una verificación de lealtad en un jugador aleatorio (no {witch}). Aunque esto da información al bando bueno, tu objetivo es usarla como arma: sembrar caos, poner aliados en contra y llevar el juego hacia el mal, manteniendo tu tapadera.',
    generalTipsTitle: 'Consejos Generales:',

    sowSeedsTitle: 'Siembra semillas de confusión:',
    sowSeedsText:
      'Utiliza tu habilidad para mantener a los jugadores inciertos sobre los resultados de las misiones, causando dudas e indecisión dentro de las filas del bien.',

    collaborateTitle: 'Colabora con otros malvados:',
    collaborateText:
      'Evalúa cuidadosamente las consecuencias de ocultar una misión, y hazlo solo cuando beneficie a ti y a tus aliados.',

    utilizePowerTitle: 'Utiliza tu poder estratégicamente:',
    utilizePowerText:
      'El momento lo es todo — solo puedes usar tu habilidad una vez. Al ocultar un resultado, provocas una verificación en otro jugador. Elige el momento que maximice el caos protegiendo a tus aliados.',

    maintainDisguiseTitle: 'Mantén tu disfraz:',
    maintainDisguiseText:
      'Evita dar pistas que puedan revelar tu verdadera lealtad o despertar sospechas sobre tus intenciones.',

    strategicTipsTitle: 'Consejos Estratégicos:',

    createUncertaintyTitle: 'Crea incertidumbre:',
    createUncertaintyText:
      'Tu habilidad para obscurecer los resultados de las misiones deja a los jugadores del bien en la oscuridad, dificultándoles planificar de manera efectiva.',

    influenceGameplayTitle: 'Influye en el juego:',

    influenceGameplayText:
      'Fomenta la duda y la discordia entre los jugadores del bien, orientando las discusiones y decisiones hacia una dirección favorable para el mal.',

    hideEarlyMissionsTitle: 'Oculta las primeras misiones:',
    hideEarlyMissionsText:
      'Ocultar misiones tempranas genera confusión, pero activa una verificación. Coordina con aliados para que la verificación no los exponga, mientras señalas a oponentes clave.',

    conclusion:
      '¡Como {witch}, siembras caos mediante misiones ocultas y verificaciones forzadas. Tu único movimiento puede exponer a otros mientras te proteges. Úsalo para crear paradojas que fracturen la confianza del equipo bueno!',
  },
};
