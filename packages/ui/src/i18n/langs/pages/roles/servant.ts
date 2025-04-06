import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const servant: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    generalTipsTitle: 'General Tips:',
    tipRoleTitle: 'Role:',
    tipRoleText:
      "You belong to the 'Good' team and your task is to assist in successfully completing three out of five missions.",
    tipKnowledgeTitle: 'Knowledge:',
    tipKnowledgeText:
      "At the game's start, you have no information about which players are on your side and which are against you.",
    tipObjectiveTitle: 'Objective:',
    tipObjectiveText:
      "Your ultimate goal is to ensure the victory of 'Good' by helping to choose trustworthy participants for missions and preventing the 'Evil' from successfully completing missions.",
    strategicTipsTitle: 'Strategic Tips:',
    tipActiveObservationTitle: 'Active Observation:',
    tipActiveObservationText:
      'Pay close attention to the actions and behavior of other players. How someone votes or comments on team proposals can give vital clues.',
    tipCommunicationTitle: 'Communication:',
    tipCommunicationText:
      "Communicate effectively with other players but do so cautiously to not disclose valuable information to 'Evil'. Engage in dialogues, ask questions, and express your doubts or confidence regarding certain players.",
    tipVotingStrategyTitle: 'Voting Strategy:',
    tipVotingStrategyText:
      "Use your vote as a tool to express trust or distrust towards a team's composition. Voting against a team proposal can stimulate further discussion and help reveal suspicious patterns.",
    tipBalancedActivityTitle: 'Balanced Activity:',
    tipBalancedActivityText:
      "Find a balance between participating actively in discussions and observing. Being too active can make you a target for 'Evil', whereas being too passive can allow 'Evil' to dictate the game's flow.",
    tipFormAlliancesTitle: 'Form Alliances:',
    tipFormAlliancesText:
      'Gradually form alliances with players you are confident are allies. Mutual support and information exchange are key to identifying and opposing evil characters.',
    tipUseExclusionsTitle: 'Use Exclusions:',
    tipUseExclusionsText:
      'Try to build your reasoning on excluding unreliable players from missions, progressively narrowing down the circle of suspects.',
    conclusionText:
      "Playing as a {servant}, remember the importance of teamwork and collective strategy. Your job is not just to help pick the right teams for missions but also to protect the reputation of 'Good' players, easing the path towards victory.",
  },
  ru: {
    generalTipsTitle: 'Общие советы:',
    tipRoleTitle: 'Роль:',
    tipRoleText: 'Вы принадлежите к команде «Добрых», и ваша задача — помогать успешно выполнить три из пяти миссий.',
    tipKnowledgeTitle: 'Знания:',
    tipKnowledgeText: 'В начале игры у вас нет информации о том, кто ваш союзник, а кто против.',
    tipObjectiveTitle: 'Цель:',
    tipObjectiveText:
      'Ваша конечная цель — обеспечить победу «Добрых», помогая выбирать надежных участников миссий и препятствуя успешному выполнению миссий командой «Злодеев».',
    strategicTipsTitle: 'Стратегические советы:',
    tipActiveObservationTitle: 'Активное наблюдение:',
    tipActiveObservationText:
      'Внимательно следите за действиями и поведением других игроков. То, как кто-то голосует или комментирует предложения команд, может дать важные подсказки.',
    tipCommunicationTitle: 'Коммуникация:',
    tipCommunicationText:
      'Эффективно общайтесь с другими игроками, но делайте это осторожно, чтобы не раскрыть ценные сведения «Злодеям». Вступайте в диалоги, задавайте вопросы, выражайте свои сомнения или уверенность в отношении определённых игроков.',
    tipVotingStrategyTitle: 'Голосовая стратегия:',
    tipVotingStrategyText:
      'Используйте свой голос как инструмент для выражения доверия или недоверия к составу команды. Голосование против предложения по команде может стимулировать дальнейшее обсуждение и помочь выявить подозрительные схемы.',
    tipBalancedActivityTitle: 'Сбалансированная активность:',
    tipBalancedActivityText:
      'Найдите баланс между активным участием в обсуждениях и наблюдением. Чрезмерная активность может сделать вас мишенью для «Злодеев», тогда как чрезмерная пассивность позволит «Злодеям» диктовать ход игры.',
    tipFormAlliancesTitle: 'Формирование альянсов:',
    tipFormAlliancesText:
      'Постепенно формируйте альянсы с игроками, в отношении которых вы уверены, что они ваши союзники. Взаимная поддержка и обмен информацией — ключ к выявлению и противодействию злодейским персонажам.',
    tipUseExclusionsTitle: 'Использование исключений:',
    tipUseExclusionsText:
      'Старайтесь строить свои рассуждения на исключении ненадёжных игроков из участия в миссиях, постепенно сужая круг подозреваемых.',
    conclusionText:
      'Играя за {servant}, помните о важности командной работы и коллективной стратегии. Ваша работа — не только помогать выбирать правильные команды для миссий, но и защищать репутацию игроков «Добрых», облегчая путь к победе.',
  },
  'zh-CN': {
    generalTipsTitle: '基本提示:',
    tipRoleTitle: '角色:',
    tipRoleText: '你属于"善良"阵营,你的任务是协助成功完成五次任务中的三次。',
    tipKnowledgeTitle: '信息:',
    tipKnowledgeText: '在游戏开始时,你不清楚哪些玩家是你的盟友,哪些玩家处于对立面。',
    tipObjectiveTitle: '目标:',
    tipObjectiveText: '你的最终目标是通过协助挑选可信赖的任务参与者并阻止"邪恶"阵营成功完成任务,从而确保"善良"的胜利。',
    strategicTipsTitle: '策略提示:',
    tipActiveObservationTitle: '积极观察:',
    tipActiveObservationText: '密切关注其他玩家的行为和举止。观察他们如何投票或对团队提议发表评论,可以提供重要线索。',
    tipCommunicationTitle: '沟通:',
    tipCommunicationText:
      '与其他玩家进行有效沟通,但要谨慎,避免向"邪恶"透露有价值的信息。参与对话、提问,并表达你对某些玩家的疑虑或信任。',
    tipVotingStrategyTitle: '投票策略:',
    tipVotingStrategyText:
      '利用你的投票来表达对团队组成的信任或不信任。反对团队提议的投票可能会引发更多讨论,并帮助揭露可疑迹象。',
    tipBalancedActivityTitle: '平衡参与:',
    tipBalancedActivityText:
      '在积极参与讨论和保持观察之间找到平衡。过于活跃可能让你成为"邪恶"的目标,而过于被动则可能让"邪恶"主导游戏进程。',
    tipFormAlliancesTitle: '结盟:',
    tipFormAlliancesText: '逐步与那些你确信是盟友的玩家结成联盟。互相支持和信息交流是识别并对抗邪恶角色的关键。',
    tipUseExclusionsTitle: '利用排除法:',
    tipUseExclusionsText: '尝试通过排除不可靠的玩家来构建你的推理,逐步缩小嫌疑人的范围。',
    conclusionText:
      '作为{servant},请记住团队合作和集体策略的重要性。你的任务不仅仅是协助挑选适当的任务团队,还要维护"善良"玩家的声誉,为胜利铺平道路。',
  },
  'zh-TW': {
    generalTipsTitle: '基本提示:',
    tipRoleTitle: '角色:',
    tipRoleText: '你屬於"善良"陣營,你的任務是協助成功完成五次任務中的三次。',
    tipKnowledgeTitle: '資訊:',
    tipKnowledgeText: '在遊戲開始時,你並不清楚哪些玩家站在你這邊,哪些玩家是對立的。',
    tipObjectiveTitle: '目標:',
    tipObjectiveText: '你的最終目標是通過協助挑選可信賴的任務成員並阻止"邪惡"陣營成功完成任務,以確保"善良"的勝利。',
    strategicTipsTitle: '策略提示:',
    tipActiveObservationTitle: '積極觀察:',
    tipActiveObservationText: '密切關注其他玩家的行動與舉止。玩家如何投票或對隊伍建議發表評論可能會透露關鍵線索。',
    tipCommunicationTitle: '溝通:',
    tipCommunicationText:
      '與其他玩家進行有效溝通,但要謹慎,避免向"邪惡"透露有價值的信息。參與對話、提問,並表達你對某些玩家的疑慮或信任。',
    tipVotingStrategyTitle: '投票策略:',
    tipVotingStrategyText:
      '利用你的投票來表達對隊伍組成的信任或不信任。對隊伍建議投反對票能激發更多討論,並幫助揭示可疑情況。',
    tipBalancedActivityTitle: '平衡參與:',
    tipBalancedActivityText:
      '在積極發言與靜觀其變之間取得平衡。過於活躍可能使你成為"邪惡"的目標,而過度被動則可能讓"邪惡"主導遊戲進程。',
    tipFormAlliancesTitle: '結盟:',
    tipFormAlliancesText: '逐步與你確信是盟友的玩家結成聯盟。互相支持及資訊共享是識別並對抗邪惡角色的關鍵。',
    tipUseExclusionsTitle: '利用排除法:',
    tipUseExclusionsText: '試著透過排除不可靠的玩家來構建你的推理,逐步縮小嫌疑人的範圍。',
    conclusionText:
      '作為{servant},請記住團隊合作和集體策略的重要性。你的任務不僅在於協助挑選適合的任務隊伍,還要保護"善良"玩家的聲譽,為勝利鋪平道路。',
  },
  es: {
    generalTipsTitle: 'Consejos Generales:',
    tipRoleTitle: 'Rol:',
    tipRoleText:
      "Perteneces al equipo de los 'Buenos', y tu tarea es ayudar a completar con éxito tres de las cinco misiones.",
    tipKnowledgeTitle: 'Conocimiento:',
    tipKnowledgeText:
      'Al inicio del juego, no tienes información sobre qué jugadores están de tu lado y cuáles están en contra.',
    tipObjectiveTitle: 'Objetivo:',
    tipObjectiveText:
      "Tu objetivo final es asegurar la victoria de los 'Buenos' ayudando a elegir participantes confiables para las misiones y evitando que los 'Malvados' completen sus misiones con éxito.",
    strategicTipsTitle: 'Consejos Estratégicos:',
    tipActiveObservationTitle: 'Observación Activa:',
    tipActiveObservationText:
      'Presta mucha atención a las acciones y comportamientos de los demás jugadores. La manera en que votan o comentan las propuestas de equipo puede ofrecer pistas vitales.',
    tipCommunicationTitle: 'Comunicación:',
    tipCommunicationText:
      "Comunícate eficazmente con los demás jugadores, pero con cautela para no revelar información valiosa a los 'Malvados'. Participa en diálogos, haz preguntas y expresa tus dudas o niveles de confianza respecto a ciertos jugadores.",
    tipVotingStrategyTitle: 'Estrategia de Votación:',
    tipVotingStrategyText:
      'Utiliza tu voto como herramienta para expresar confianza o desconfianza en la composición del equipo. Votar en contra de una propuesta puede estimular más discusión y ayudar a revelar comportamientos sospechosos.',
    tipBalancedActivityTitle: 'Actividad Equilibrada:',
    tipBalancedActivityText:
      "Encuentra un equilibrio entre participar activamente en las discusiones y observar. Ser demasiado activo puede convertirte en blanco de los 'Malvados', mientras que ser pasivo podría permitir que ellos dicten el curso del juego.",
    tipFormAlliancesTitle: 'Forma Alianzas:',
    tipFormAlliancesText:
      'Gradualmente, forma alianzas con jugadores en los que confíes y consideres aliados. El apoyo mutuo y el intercambio de información son clave para identificar y oponerse a los personajes malvados.',
    tipUseExclusionsTitle: 'Usa Exclusiones:',
    tipUseExclusionsText:
      'Intenta construir tu razonamiento excluyendo a los jugadores poco confiables de las misiones, reduciendo progresivamente el círculo de sospechosos.',
    conclusionText:
      "Como {servant}, recuerda la importancia del trabajo en equipo y de una estrategia colectiva. Tu tarea no es solo ayudar a elegir los equipos adecuados para las misiones, sino también proteger la reputación de los 'Buenos' y allanar el camino hacia la victoria.",
  },
  pt: {
    generalTipsTitle: 'Dicas Gerais:',
    tipRoleTitle: 'Função:',
    tipRoleText:
      "Você pertence à equipe do 'Bem' e sua tarefa é ajudar a completar com sucesso três das cinco missões.",
    tipKnowledgeTitle: 'Conhecimento:',
    tipKnowledgeText:
      'No início do jogo, você não tem informações sobre quais jogadores estão do seu lado e quais estão contra você.',
    tipObjectiveTitle: 'Objetivo:',
    tipObjectiveText:
      "Seu objetivo final é garantir a vitória da equipe do 'Bem', ajudando a escolher participantes confiáveis para as missões e impedindo que a equipe do 'Mal' complete as missões com sucesso.",
    strategicTipsTitle: 'Dicas Estratégicas:',
    tipActiveObservationTitle: 'Observação Ativa:',
    tipActiveObservationText:
      'Preste muita atenção às ações e ao comportamento dos outros jogadores. Como alguém vota ou comenta sobre as propostas de equipe pode fornecer pistas vitais.',
    tipCommunicationTitle: 'Comunicação:',
    tipCommunicationText:
      "Comunique-se efetivamente com outros jogadores, mas faça isso com cautela para não revelar informações valiosas ao 'Mal'. Participe de diálogos, faça perguntas e expresse suas dúvidas ou confiança em relação a certos jogadores.",
    tipVotingStrategyTitle: 'Estratégia de Votação:',
    tipVotingStrategyText:
      'Use seu voto como uma ferramenta para expressar confiança ou desconfiança em relação à composição de uma equipe. Votar contra uma proposta de equipe pode estimular mais discussão e ajudar a revelar padrões suspeitos.',
    tipBalancedActivityTitle: 'Atividade Equilibrada:',
    tipBalancedActivityText:
      "Encontre um equilíbrio entre participar ativamente das discussões e observar. Ser muito ativo pode torná-lo um alvo para o 'Mal', enquanto ser muito passivo pode permitir que o 'Mal' dite o fluxo do jogo.",
    tipFormAlliancesTitle: 'Forme Alianças:',
    tipFormAlliancesText:
      'Forme gradualmente alianças com jogadores que você tem certeza que são aliados. O apoio mútuo e a troca de informações são fundamentais para identificar e se opor aos personagens do mal.',
    tipUseExclusionsTitle: 'Use Exclusões:',
    tipUseExclusionsText:
      'Tente construir seu raciocínio excluindo jogadores não confiáveis das missões, reduzindo progressivamente o círculo de suspeitos.',
    conclusionText:
      "Jogando como {servant}, lembre-se da importância do trabalho em equipe e da estratégia coletiva. Seu trabalho não é apenas ajudar a escolher as equipes certas para as missões, mas também proteger a reputação dos jogadores do 'Bem', facilitando o caminho para a vitória.",
  },
};
