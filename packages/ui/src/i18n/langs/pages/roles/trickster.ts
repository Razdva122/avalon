import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const trickster: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    generalInformation: 'General Information: ',
    intro: `
			As a {trickster}, you lie when your loyalty is checked with {ladyOfLake} or {cleric},
			positioning yourself perfectly as a trusted member of the good side.
		`,
    generalTipsTitle: 'General Tips:',
    generalTipsCultivateTrustTitle: 'Cultivate a trustworthy persona:',
    generalTipsCultivateTrust: `
			Successfully fooling other players requires building credibility. Act consistently and help complete 
			quests to gain trust.
		`,
    generalTipsCreateConfusionTitle: 'Create confusion:',
    generalTipsCreateConfusion: `
			Sow seeds of doubt about other's roles subtly, drawing suspicion away from yourself and onto 
			actual members of the good side.
		`,
    generalTipsMonitorInfluenceTitle: 'Monitor your influence:',
    generalTipsMonitorInfluence: `
			Keep track of how others perceive you and adjust your strategy to maintain your disguise.
		`,
    strategicTipsTitle: 'Strategic Tips:',
    strategicTipsManipulateVotingTitle: 'Manipulate voting patterns:',
    strategicTipsManipulateVoting: `
			Your votes on proposals can send signals to observant players. Think carefully about when to support 
			or oppose missions.
		`,
    strategicTipsControlInformationFlowTitle: 'Control information flow:',
    strategicTipsControlInformationFlow: `
			As you gain trust, other players will likely share insights with you. Use this information to benefit 
			your team without revealing your source.
		`,
    strategicTipsPrepareDefenseTitle: 'Prepare a credible defense:',
    strategicTipsPrepareDefense: `
			If suspicion falls on you, be ready with plausible explanations for your actions that fit with your 
			constructed persona as a good player.
		`,
    conclusion: `
			Playing as the {trickster} allows you to weave a web of deceit. Embrace the complexities of your role and 
			you can shift the balance in favor of evil, manipulating key outcomes and leaving the forces of good puzzled 
			and paranoid. Strike a balance between overt actions and subtle manipulations to master the art of deception.
		`,
  },
  ru: {
    generalInformation: 'Общая информация: ',
    intro: `
		 Как {trickster} вы лжете, когда вашу верность проверяют с помощью {ladyOfLake} или {cleric},
		 что позволяет вам идеально занять позицию доверенного члена светлой стороны.
		`,
    generalTipsTitle: 'Общие советы:',
    generalTipsCultivateTrustTitle: 'Создайте доверительный образ:',
    generalTipsCultivateTrust: `
		 Успешный обман других игроков требует построения доверия. Действуйте последовательно и помогайте завершать 
		 задания, чтобы завоевать доверие.
		`,
    generalTipsCreateConfusionTitle: 'Создайте путаницу:',
    generalTipsCreateConfusion: `
		 Сейте сомнения в отношении ролей других, тем самым отвлекая подозрения от себя на настоящих членов светлой стороны.
		`,
    generalTipsMonitorInfluenceTitle: 'Следите за своим влиянием:',
    generalTipsMonitorInfluence: `
		 Наблюдайте, как вас воспринимают другие, и корректируйте свою стратегию, чтобы поддерживать свой маскарад.
		`,
    strategicTipsTitle: 'Стратегические советы:',
    strategicTipsManipulateVotingTitle: 'Манипулируйте голосованиями:',
    strategicTipsManipulateVoting: `
		 Ваши голоса по предложениям могут подавать сигналы наблюдательным игрокам. Тщательно обдумывайте, когда поддерживать 
		 или противостоять миссиям.
		`,
    strategicTipsControlInformationFlowTitle: 'Контролируйте поток информации:',
    strategicTipsControlInformationFlow: `
		 По мере укрепления доверия к вам другие игроки могут делиться с вами идеями. Используйте эту информацию, чтобы получить
		 преимущество без раскрытия источника.
		`,
    strategicTipsPrepareDefenseTitle: 'Готовьте правдоподобную защиту:',
    strategicTipsPrepareDefense: `
		 Если на вас падает подозрение, будьте готовы дать правдоподобные объяснения вашим действиям, которые укладываются в
		 созданный вами образ как добросовестного игрока.
		`,
    conclusion: `
		 Играя как {trickster}, вы можете плести сеть обмана. Примите сложности своей роли, и вы можете изменить баланс в пользу зла,
		 влияя на ключевые исходы и оставляя силы добра в растерянности и параноидальными. Найдите баланс между явными действиями и 
		 тонкими манипуляциями, чтобы овладеть искусством обмана.
		`,
  },
  'zh-CN': {
    generalInformation: '基本信息: ',
    intro: `
		 作为{trickster}，当你被{ladyOfLake}或{cleric}检查忠诚时，撒谎，
		 完美地将自己定位为被信任的正义方成员。
		`,
    generalTipsTitle: '一般提示:',
    generalTipsCultivateTrustTitle: '培养可信的人设:',
    generalTipsCultivateTrust: `
		 成功欺骗其他玩家需要建立信誉。行为一致并帮助完成任务以获取信任。
		`,
    generalTipsCreateConfusionTitle: '制造混乱:',
    generalTipsCreateConfusion: `
		 巧妙地在其他角色上播下怀疑的种子，转移注意力，避免真正的正义方成员受怀疑。
		`,
    generalTipsMonitorInfluenceTitle: '监控你的影响力:',
    generalTipsMonitorInfluence: `
		 跟踪其他人对你的看法，并调整策略以维持你的掩饰。
		`,
    strategicTipsTitle: '战略提示:',
    strategicTipsManipulateVotingTitle: '操控投票模式:',
    strategicTipsManipulateVoting: `
		 你在提案上的投票可能会向其他警觉的玩家发送信号。仔细考虑何时支持或反对任务。
		`,
    strategicTipsControlInformationFlowTitle: '控制信息流:',
    strategicTipsControlInformationFlow: `
		 随着对你的信任增加，其他玩家可能会与您共享见解。使用这些信息来提升团队的利益，同时不暴露来源。
		`,
    strategicTipsPrepareDefenseTitle: '准备一个可信的辩解:',
    strategicTipsPrepareDefense: `
		 如果怀疑针对你，准备好合理的解释来使你的行为看似符合你构建的角色。
		`,
    conclusion: `
		 作为{trickster}，你可以编织一个欺骗的网络。接受角色的复杂性，你可以转变局势，使之有利于邪恶，
		 操控关键结果，令正义方摸不着头脑，疑神疑鬼。在显性行动和微妙操作间找到平衡，掌控欺骗的艺术。
		`,
  },
  'zh-TW': {
    generalInformation: '基本資訊: ',
    intro: `
		 身為{trickster}，當你的忠誠受到{ladyOfLake}或{cleric}檢查時，你要撒謊，
		 使自己完美地成為被信任的正義方成員。
		`,
    generalTipsTitle: '一般提示:',
    generalTipsCultivateTrustTitle: '建立可信形象:',
    generalTipsCultivateTrust: `
		 成功地愚弄其他玩家需要建立信任。行為一致並協助完成任務以獲取信任。
		`,
    generalTipsCreateConfusionTitle: '製造混亂:',
    generalTipsCreateConfusion: `
		 以巧妙的方式在其他角色中播下懷疑的種子，把懷疑的焦點移離自己而指向真正的正義方成員。
		`,
    generalTipsMonitorInfluenceTitle: '監控影響力:',
    generalTipsMonitorInfluence: `
		 跟踪他人對你的看法，並調整策略以維持你的掩飾。
		`,
    strategicTipsTitle: '戰略提示:',
    strategicTipsManipulateVotingTitle: '操控投票模式:',
    strategicTipsManipulateVoting: `
		 你的投票行為能給予觀察敏銳的玩家以信號。仔細考慮何時支持或反對任務。
		`,
    strategicTipsControlInformationFlowTitle: '控制信息流:',
    strategicTipsControlInformationFlow: `
		 當你贏得信任時，其他玩家可能會與你分享見解。利用這些信息讓你的團隊受益，同時不透露來源。
		`,
    strategicTipsPrepareDefenseTitle: '準備可信的辯護:',
    strategicTipsPrepareDefense: `
		 如果你受到了懷疑，準備一些合理的解釋來為你的行為辯護，並將其鑲嵌於你作為好角色的假面之下。
		`,
    conclusion: `
		 作為{trickster}，你可以編織欺騙的網絡。接受角色的複雜性，你可以轉變局勢，以邪惡為營，操縱關鍵結果，
		 讓正義方感到混亂和困惑。在顯性的操作和細微的操作中找到平衡，以掌握欺騙的藝術。
		`,
  },
  es: {
    generalInformation: 'Información General: ',
    intro: `
		 Como {trickster}, mientes cuando tu lealtad es verificada por {ladyOfLake} o {cleric},
		 posicionándote perfectamente como un miembro confiable del lado bueno.
		`,
    generalTipsTitle: 'Consejos Generales:',
    generalTipsCultivateTrustTitle: 'Cultiva una personalidad confiable:',
    generalTipsCultivateTrust: `
		 Engañar con éxito a otros jugadores requiere construir credibilidad. Actúa consistentemente y ayuda a completar 
		 misiones para ganar confianza.
		`,
    generalTipsCreateConfusionTitle: 'Crea confusión:',
    generalTipsCreateConfusion: `
		 Siembra dudas sobre los roles de los demás sutilmente, desviando la sospecha de ti mismo hacia los verdaderos 
		 miembros del lado bueno.
		`,
    generalTipsMonitorInfluenceTitle: 'Monitorea tu influencia:',
    generalTipsMonitorInfluence: `
		 Observa cómo los demás te perciben y ajusta tu estrategia para mantener tu disfraz.
		`,
    strategicTipsTitle: 'Consejos Estratégicos:',
    strategicTipsManipulateVotingTitle: 'Manipula los patrones de votación:',
    strategicTipsManipulateVoting: `
		 Tus votos sobre propuestas pueden enviar señales a jugadores observadores. Piensa cuidadosamente cuándo apoyar 
		 u oponer misiones.
		`,
    strategicTipsControlInformationFlowTitle: 'Controla el flujo de información:',
    strategicTipsControlInformationFlow: `
		 A medida que ganas confianza, es probable que otros jugadores compartan información contigo. Usa esta información 
		 para beneficiar a tu equipo sin revelar tu fuente.
		`,
    strategicTipsPrepareDefenseTitle: 'Prepara una defensa creíble:',
    strategicTipsPrepareDefense: `
		 Si la sospecha recae sobre ti, prepárate con explicaciones plausibles para tus acciones que encajen con tu 
		 personaje construido como un buen jugador.
		`,
    conclusion: `
		 Jugar como {trickster} te permite tejer una red de engaño. Abraza las complejidades de tu rol y puedes cambiar 
		 el equilibrio a favor del mal, manipulando resultados clave y dejando a las fuerzas del bien perplejas y paranoicas. 
		 Encuentra el equilibrio entre acciones evidentes y manipulaciones sutiles para dominar el arte del engaño.
		`,
  },
};
