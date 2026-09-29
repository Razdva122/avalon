import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const servant: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoHeading: 'Loyal Servant of Arthur in Avalon: Rules & Strategy',
    seoTeam:
      'Good. The {servant}, or Loyal Servant of Arthur, helps good complete three successful missions and survive any enabled assassination.',
    seoAbility:
      'A Servant has no secret information about other roles at setup. Use team proposals, votes and mission results to identify trustworthy players.',
    seoLimit:
      'Can a Loyal Servant play Fail? No. Good players must play Success. A successful mission still does not prove everyone was good: most evil roles may also choose Success.',
    seoScenario1:
      'When a mission fails, compare its members with earlier teams. Avoid claiming certainty about which player failed without enough evidence.',
    seoScenario2:
      'If someone seems unusually well informed, consider whether publicly calling them {merlin} would help evil. Discuss the team choice instead.',
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
  },
  ru: {
    seoHeading: 'Сервант в Авалоне: верный слуга Артура и его правила',
    seoTeam:
      'Добро. {servant}, или верный слуга Артура, помогает выполнить три миссии и пережить включённое в состав финальное убийство.',
    seoAbility:
      'Сервант не получает тайной информации о чужих ролях на старте. Ищите надёжных игроков по составам команд, голосованиям и результатам миссий.',
    seoLimit:
      'Может ли верный слуга Артура дать провал? Нет, добрые обязаны дать успех. Но успешная миссия не доказывает доброту всей команды: большинство злых тоже могут дать успех.',
    seoScenario1:
      'После провала сравните участников с предыдущими составами. Не выдавайте догадку о виновнике за достоверное знание.',
    seoScenario2:
      'Если кто-то необычно хорошо осведомлён, подумайте, поможет ли злу публичное предположение, что это {merlin}. Обсуждайте предложенную команду.',
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
  },
  'zh-CN': {
    seoHeading: '阿瓦隆仆人：亚瑟王忠臣的规则与策略',
    seoTeam: '好人。{servant}是亚瑟王的忠实仆人，帮助完成三次成功任务，并让好人躲过本局启用的刺杀。',
    seoAbility: '仆人开局不获得其他角色的秘密信息。根据队伍提案、投票和任务结果寻找可信玩家。',
    seoLimit: '忠臣能出失败吗？不能，好人必须出成功。但任务成功不证明全员好人，因为大多数坏人也能选择成功。',
    seoScenario1: '任务失败后，将队员与之前的队伍进行比较。证据不足时，不要声称已确定是谁出的失败。',
    seoScenario2: '如果某人显得特别知情，公开说他是{merlin}可能帮助坏人。讨论队伍选择本身，而不是揭露身份。',
    strategicTipsTitle: '策略提示:',
    tipActiveObservationTitle: '积极观察:',
    tipActiveObservationText: '密切关注其他玩家的行为和举止。观察他们如何投票或对团队提议发表评论,可以提供重要线索。',
    tipCommunicationTitle: '沟通:',
    tipCommunicationText:
      '与其他玩家进行有效沟通,但要谨慎,避免向"邪恶"透露有价值的信息。参与对话、提问,并表达你对某些玩家的疑虑或信任。',
    tipVotingStrategyTitle: '投票策略:',
    tipVotingStrategyText:
      '利用你的投票来表达对团队组成的信任或不信任。反对团队提议的投票可能会引发更多讨论,并帮助揭露可疑迹象。',
  },
  'zh-TW': {
    seoHeading: '阿瓦隆僕人：亞瑟王忠臣的規則與策略',
    seoTeam: '好人。{servant}是亞瑟王的忠實僕人，幫助完成三次成功任務，並讓好人躲過本局啟用的刺殺。',
    seoAbility: '僕人開局不獲得其他角色的秘密資訊。根據隊伍提案、投票和任務結果尋找可信玩家。',
    seoLimit: '忠臣能出失敗嗎？不能，好人必須出成功。但任務成功不證明全員好人，因為大多數壞人也能選擇成功。',
    seoScenario1: '任務失敗後，將隊員與之前的隊伍進行比較。證據不足時，不要聲稱已確定是誰出的失敗。',
    seoScenario2: '如果某人顯得特別知情，公開說他是{merlin}可能幫助壞人。討論隊伍選擇本身，而不是揭露身分。',
    strategicTipsTitle: '策略提示:',
    tipActiveObservationTitle: '積極觀察:',
    tipActiveObservationText: '密切關注其他玩家的行動與舉止。玩家如何投票或對隊伍建議發表評論可能會透露關鍵線索。',
    tipCommunicationTitle: '溝通:',
    tipCommunicationText:
      '與其他玩家進行有效溝通,但要謹慎,避免向"邪惡"透露有價值的信息。參與對話、提問,並表達你對某些玩家的疑慮或信任。',
    tipVotingStrategyTitle: '投票策略:',
    tipVotingStrategyText:
      '利用你的投票來表達對隊伍組成的信任或不信任。對隊伍建議投反對票能激發更多討論,並幫助揭示可疑情況。',
  },
  es: {
    seoHeading: 'Siervo Leal de Arturo en Avalon: reglas y estrategia',
    seoTeam:
      'Bien. El {servant}, o Siervo Leal de Arturo, ayuda a completar tres misiones y superar cualquier asesinato habilitado.',
    seoAbility:
      'No recibe información secreta sobre otros roles al inicio. Usa propuestas de equipos, votos y resultados para encontrar jugadores fiables.',
    seoLimit:
      '¿Puede jugar Fracaso? No: los buenos deben jugar Éxito. Una misión exitosa no prueba que todos sean buenos, porque la mayoría de los malvados también pueden jugar Éxito.',
    seoScenario1:
      'Después de un Fracaso, compara el equipo con los anteriores. No presentes como certeza una acusación sin pruebas suficientes.',
    seoScenario2:
      'Si alguien parece tener mucha información, piensa si llamarlo {merlin} públicamente ayudaría al mal. Habla del equipo propuesto.',
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
  },
  pt: {
    seoHeading: 'Servo Leal de Arthur em Avalon: regras e estratégia',
    seoTeam:
      'Bem. O {servant}, ou Servo Leal de Arthur, ajuda a completar três missões e sobreviver a qualquer assassinato habilitado.',
    seoAbility:
      'O Servo não recebe informações secretas sobre outros papéis no início. Use propostas de equipes, votos e resultados para encontrar jogadores confiáveis.',
    seoLimit:
      'Pode jogar Falha? Não: os bons devem jogar Sucesso. Uma missão bem-sucedida não prova que todos sejam bons, pois a maioria dos maus também pode jogar Sucesso.',
    seoScenario1:
      'Após uma Falha, compare a equipe com as anteriores. Não apresente como certeza uma acusação sem evidência suficiente.',
    seoScenario2:
      'Se alguém parecer muito bem informado, pense se chamá-lo de {merlin} em público ajudaria o mal. Discuta a equipe proposta.',
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
  },
};
