import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const witch: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    generalInformation: 'General Information: ',
    intro: `Playing as {witch} gives you a unique power within the minions of evil: the ability to hide the outcome of one mission. Your goal is to create uncertainty and chaos among the forces of good, ensuring that they remain in doubt, ultimately tilting the game in favor of evil while maintaining your cover.`,
    generalTipsTitle: `General Tips:`,

    sowSeedsTitle: `Sow seeds of confusion:`,
    sowSeedsText: `Utilize your skill to keep players uncertain about mission outcomes, causing doubt and indecision within the ranks of good.`,

    collaborateTitle: `Collaborate with fellow evildoers:`,
    collaborateText: `Work closely with other evil players to synchronize your actions and maximize the impact of your hidden missions.`,

    utilizePowerTitle: `Utilize your power strategically:`,
    utilizePowerText: `Timing is crucial when deciding to hide a mission's result. Choose the moment that will best serve the interests of the evil team.`,

    maintainDisguiseTitle: `Maintain your disguise:`,
    maintainDisguiseText: `Avoid giving away any hints that could reveal your true allegiance or arouse suspicion about your intentions.`,

    strategicTipsTitle: `Strategic Tips:`,

    createUncertaintyTitle: `Create uncertainty:`,
    createUncertaintyText: `Your ability to obscure mission results leaves good players in the dark, making it difficult for them to strategize effectively.`,

    influenceGameplayTitle: `Influence gameplay:`,
    influenceGameplayText: `Encourage doubt and discord among good players, steering discussions and decisions in a direction favorable to evil.`,

    hideEarlyMissionsTitle: `Hide early missions:`,
    hideEarlyMissionsText: `The most logical choice is to hide the results of the first or second mission to introduce confusion early and shake the foundation of trust among good players.`,

    conclusion: `As {witch}, you weave uncertainty and misdirection into the fabric of the game. By masking the truth, you can destabilize the forces of good and steer the tide of battle in evil's favor. Embrace your role and let chaos reign supreme!`,
  },
  ru: {
    generalInformation: 'Общая информация: ',
    intro:
      'Играя за {witch}, вы получаете уникальную власть среди приспешников зла: способность скрывать результат одной миссии. Ваша цель — посеять неуверенность и хаос среди сил добра, заставить их сомневаться и в конечном итоге привести игру в пользу зла, при этом оставаясь в тени.',
    generalTipsTitle: 'Общие советы:',

    sowSeedsTitle: 'Посейте семена сомнений:',
    sowSeedsText:
      'Используйте свои способности, чтобы оставлять игроков в неведении относительно результатов миссий, вызывая сомнения и нерешительность среди добрых сил.',

    collaborateTitle: 'Сотрудничайте с другими злодеями:',
    collaborateText:
      'Работайте в тесном сотрудничестве с другими игроками зла, чтобы синхронизировать ваши действия и максимизировать влияние ваших скрытых миссий.',

    utilizePowerTitle: 'Используйте свою силу стратегически:',
    utilizePowerText:
      'Время имеет решающее значение при выборе, когда скрыть результат миссии. Выбирайте момент, который лучше всего послужит интересам команды зла.',

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
      'Наиболее логичным выбором будет скрыть результаты первой или второй миссии, чтобы ввести путаницу на раннем этапе и поколебать доверие среди добрых игроков.',

    conclusion:
      'Как {witch}, вы внедряете неуверенность и ошибки в игру. Скрывая правду, вы можете дестабилизировать силы добра и направить ход битвы в пользу зла. Примите свою роль и позвольте хаосу властвовать!',
  },
  'zh-CN': {
    generalInformation: '一般信息：',
    intro:
      '作为{witch}，你拥有一项独特的力量，可以隐藏任务的结果。你的目标是在人群中制造不确定性和混乱，并确保他们持续怀疑，最终让游戏朝向有利于邪恶的一方，同时维持你的掩饰。',
    generalTipsTitle: '一般提示：',

    sowSeedsTitle: '播下困惑的种子：',
    sowSeedsText: '利用你的技能让玩家对任务结果产生不确定性，在善良力量的行列中引起怀疑和犹豫。',

    collaborateTitle: '与其他邪恶势力合作：',
    collaborateText: '与其他邪恶玩家紧密合作，以同步你的行动并最大化你隐藏任务的影响。',

    utilizePowerTitle: '战略性地使用你的能力：',
    utilizePowerText: '在决定何时隐藏任务结果时，时机至关重要。选择对邪恶团队利益最大化的时机。',

    maintainDisguiseTitle: '保持你的伪装：',
    maintainDisguiseText: '避免透露可能揭露你真实意图的任何线索，或者引起怀疑。',

    strategicTipsTitle: '战略提示：',

    createUncertaintyTitle: '制造不确定性：',
    createUncertaintyText: '你隐藏任务结果的能力让善良玩家一无所知，使他们难以有效地计划。',

    influenceGameplayTitle: '影响游戏：',
    influenceGameplayText: '鼓励善良玩家之间的疑虑和不和谐，引导讨论和决策朝着有利于邪恶的方向发展。',

    hideEarlyMissionsTitle: '隐藏早期任务：',
    hideEarlyMissionsText: '最合理的选择是隐藏第一或第二个任务的结果，以便早期引导混乱，并动摇善良玩家间的信任基础。',

    conclusion:
      '作为 {witch}，你将不确定性和误导编织成游戏的一部分。通过掩盖事实，你能不稳定善良的力量并将战斗的潮流导向邪恶的一方。接受你的角色，让混乱无比壮大！',
  },
  'zh-TW': {
    generalInformation: '一般信息：',
    intro:
      '作為 {witch}，你擁有一項獨特的力量，可以隱藏一項任務的結果。你的目標是在人群中製造不確定性和混亂，並確保他們繼續懷疑，最終在維持你的掩護的同時，將勝利推向邪惡的一方。',
    generalTipsTitle: '一般提示：',

    sowSeedsTitle: '播下混亂的種子：',
    sowSeedsText: '利用你的技能使玩家對任務結果感到不確定，在善良力量的行列中造成懷疑和猶豫。',

    collaborateTitle: '與其他邪惡的人合作：',
    collaborateText: '與其他邪惡玩家密切合作，以協調你的行動並最大化隱藏任務的影響。',

    utilizePowerTitle: '戰略性地運用你的力量：',
    utilizePowerText: '在決定隱藏任務結果時，時機至關重要。選擇最符合邪惡團隊利益的時機。',

    maintainDisguiseTitle: '保持你的偽裝：',
    maintainDisguiseText: '避免透露可能揭示你真正意圖的任何提示或引起懷疑。',

    strategicTipsTitle: '戰略提示：',

    createUncertaintyTitle: '製造不確定性：',
    createUncertaintyText: '你對任務結果的遮掩能力使善良玩家一片黑暗，讓他們難以有效策劃。',

    influenceGameplayTitle: '影響遊戲：',
    influenceGameplayText: '鼓勵善良玩家之間的懷疑和不和，將討論和決策引向對邪惡有利的方向。',

    hideEarlyMissionsTitle: '隱藏早期任務：',
    hideEarlyMissionsText: '最明智的選擇是隱藏第一或第二任務的結果，在早期引入混亂，並動搖善良玩家間的信任基礎。',

    conclusion:
      '作為 {witch}，你將不確定性和誤導編織成遊戲的一部分。通過掩蓋真相，你能夠破壞善良的力量並引導戰鬥的潮流朝向邪惡的方向。擁抱你的角色，讓混亂覆蓋一切！',
  },
  es: {
    generalInformation: 'Información General: ',
    intro:
      'Jugando como {witch} tienes un poder único dentro de los secuaces del mal: la capacidad de ocultar el resultado de una misión. Tu objetivo es crear incertidumbre y caos entre las fuerzas del bien, asegurándote de que permanezcan en duda, inclinando finalmente el juego a favor del mal mientras mantienes tu cobertura.',
    generalTipsTitle: 'Consejos Generales:',

    sowSeedsTitle: 'Siembra semillas de confusión:',
    sowSeedsText:
      'Utiliza tu habilidad para mantener a los jugadores inciertos sobre los resultados de las misiones, causando dudas e indecisión dentro de las filas del bien.',

    collaborateTitle: 'Colabora con otros malvados:',
    collaborateText:
      'Trabaja estrechamente con otros jugadores malvados para sincronizar tus acciones y maximizar el impacto de tus misiones ocultas.',

    utilizePowerTitle: 'Utiliza tu poder estratégicamente:',
    utilizePowerText:
      'El momento es crucial a la hora de decidir ocultar el resultado de una misión. Elige el momento que mejor sirva a los intereses del equipo malvado.',

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
      'La elección más lógica es ocultar los resultados de la primera o segunda misión para introducir confusión temprana y sacudir la base de confianza entre los jugadores del bien.',

    conclusion:
      'Como {witch}, tejes incertidumbre y desinformación en el tejido del juego. Al enmascarar la verdad, puedes desestabilizar a las fuerzas del bien y orientar la marea de la batalla a favor del mal. ¡Abraza tu rol y deja que el caos reine supremo!',
  },
};
