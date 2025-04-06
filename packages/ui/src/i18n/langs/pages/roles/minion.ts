import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const minion: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    generalTipsTitle: 'General Tips:',
    tipRoleTitle: 'Role:',
    tipRoleText:
      "You are part of the 'Evil' team, with the main objective to thwart the 'Good' team's missions or ensure your presence on successful ones.",
    tipKnowledgeTitle: 'Knowledge:',
    tipKnowledgeText:
      "At the beginning of the game, you know who your fellow 'Evil' allies are, except for roles hidden from you by game rules.",
    tipObjectiveTitle: 'Objective:',
    tipObjectiveText:
      "Your ultimate goal is to cause three out of five missions to fail or to sow enough distrust among the 'Good' team to lead your evil team to victory.",
    strategicTipsTitle: 'Strategic Tips:',
    tipDiscreetCollaborationTitle: 'Discreet Collaboration:',
    tipDiscreetCollaborationText:
      "Work closely with your 'Evil' teammates in secret. Plan how to approach each mission and who will take the risk of causing a mission to fail.",
    tipDeceptionTitle: 'Deception:',
    tipDeceptionText:
      "Perfect the art of deception. Blending in as one of the 'Good' can help you influence their decisions and protect your identity.",
    tipPublicDemeanorTitle: 'Public Demeanor:',
    tipPublicDemeanorText:
      'Be mindful of your public actions and words. Try to avoid suspicion by not being too defensive or too aggressive.',
    tipUndermineTrustTitle: 'Undermine Trust:',
    tipUndermineTrustText:
      "Subtly question the actions and decisions of the 'Good' players to create an atmosphere of distrust and confusion.",
    tipSuspectManagementTitle: 'Suspect Management:',
    tipSuspectManagementText:
      'If suspicion falls on you, cleverly redirect it without bringing too much attention to yourself. Use logical arguments to defend yourself but avoid being too convincing as to not raise further suspicion.',
    tipStrategicSacrificeTitle: 'Strategic Sacrifice:',
    tipStrategicSacrificeText:
      "It may be beneficial to sacrifice an 'Evil' team member to gain the trust of the 'Good' team, particularly if it can lead to an 'Evil' majority on critical missions.",
    conclusionText:
      "As a {minion}, your success depends on your ability to deceive and manipulate the 'Good' team while coordinating with your 'Evil' allies. Your cunning and discretion are key instruments in overthrowing the forces of good and ensuring victory for {mordred}.",
  },
  ru: {
    generalTipsTitle: 'Общие советы:',
    tipRoleTitle: 'Роль:',
    tipRoleText:
      'Вы — часть команды «Злодеев», чья основная задача — провалить миссии команды «Добрых» или обеспечить своё участие в успешных миссиях.',
    tipKnowledgeTitle: 'Знания:',
    tipKnowledgeText:
      'В начале игры вы знаете, кто ваши союзники из команды «Злодеев», за исключением тех ролей, которые по правилам скрыты от вас.',
    tipObjectiveTitle: 'Цель:',
    tipObjectiveText:
      'Ваша конечная цель — добиться провала трёх из пяти миссий или посеять достаточное недоверие среди «Добрых», чтобы привести вашу команду к победе.',
    strategicTipsTitle: 'Стратегические советы:',
    tipDiscreetCollaborationTitle: 'Деликатное сотрудничество:',
    tipDiscreetCollaborationText:
      'Тайно работайте в тесном сотрудничестве с союзниками из команды «Злодеев». Планируйте, как действовать на каждой миссии, и определяйте, кто возьмёт на себя риск провала миссии.',
    tipDeceptionTitle: 'Обман:',
    tipDeceptionText:
      'Отточите искусство обмана. Притворившись членом «Добрых», вы сможете влиять на их решения и скрывать свою истинную личность.',
    tipPublicDemeanorTitle: 'Публичное поведение:',
    tipPublicDemeanorText:
      'Следите за своими публичными действиями и речью. Старайтесь не вызывать подозрений, не будучи слишком оборонительным или агрессивным.',
    tipUndermineTrustTitle: 'Подрывайте доверие:',
    tipUndermineTrustText:
      'Тонко подвергайте сомнению действия и решения игроков «Добрых», создавая атмосферу недоверия и путаницы.',
    tipSuspectManagementTitle: 'Управление подозрениями:',
    tipSuspectManagementText:
      'Если на вас падают подозрения, умело перенаправьте их, не привлекая лишнего внимания. Используйте логичные аргументы для защиты, но не будьте чрезмерно убедительны, чтобы не вызвать новых подозрений.',
    tipStrategicSacrificeTitle: 'Стратегическая жертва:',
    tipStrategicSacrificeText:
      'Иногда выгодно пожертвовать членом команды «Злодеев», чтобы завоевать доверие «Добрых», особенно если это может привести к преимущественному числу злодеев на ключевых миссиях.',
    conclusionText:
      'Как {minion}, ваш успех зависит от умения обманывать и манипулировать командой «Добрых», одновременно координируясь с союзниками из команды «Злодеев». Ваша хитрость и осмотрительность — ключевые инструменты для свержения сил добра и достижения победы для {mordred}.',
  },
  'zh-CN': {
    generalTipsTitle: '基本提示:',
    tipRoleTitle: '角色:',
    tipRoleText: '你是"邪恶"团队的一员,主要目标是阻挠"正义"团队的任务,或确保你参与那些成功的任务。',
    tipKnowledgeTitle: '知识:',
    tipKnowledgeText: '在游戏开始时,你知道你的"邪恶"盟友是谁,但那些根据游戏规则而隐藏的角色除外。',
    tipObjectiveTitle: '目标:',
    tipObjectiveText:
      '你的终极目标是让五次任务中有三次失败,或在"正义"团队中制造足够的不信任,从而帮助你的邪恶团队获胜。',
    strategicTipsTitle: '策略提示:',
    tipDiscreetCollaborationTitle: '谨慎合作:',
    tipDiscreetCollaborationText: '与你的"邪恶"队友密切合作,秘密策划如何执行每一项任务,以及谁将冒险使任务失败。',
    tipDeceptionTitle: '欺骗:',
    tipDeceptionText: '精通欺骗的艺术。伪装成"正义"一员可以帮助你影响对方决策并保护你的身份。',
    tipPublicDemeanorTitle: '公共形象:',
    tipPublicDemeanorText: '注意你的公开言行。尽量避免过分防备或过于激进,以免引起他人怀疑。',
    tipUndermineTrustTitle: '破坏信任:',
    tipUndermineTrustText: '巧妙地质疑"正义"玩家的行为和决策,营造出一种不信任与混乱的氛围。',
    tipSuspectManagementTitle: '疑点处理:',
    tipSuspectManagementText:
      '如果有人对你产生怀疑,请巧妙地转移注意力,避免让自己过于引人注目。使用逻辑为自己辩护,但不要过于有说服力,以免激起更多怀疑。',
    tipStrategicSacrificeTitle: '策略性牺牲:',
    tipStrategicSacrificeText:
      '有时牺牲一位"邪恶"队友以赢得"正义"团队的信任是有利的,尤其是在这能使"邪恶"在关键任务中占据多数时。',
    conclusionText:
      '作为{minion},你的成功取决于你欺骗和操纵"正义"团队的能力,同时与你的"邪恶"盟友协同作战。你的狡猾与谨慎是推翻正义力量、确保{mordred}胜利的关键。',
  },
  'zh-TW': {
    generalTipsTitle: '基本提示:',
    tipRoleTitle: '角色:',
    tipRoleText: '你是"邪惡"團隊的一員,主要目標是阻撓"正義"團隊的任務,或確保你參與那些成功的任務。',
    tipKnowledgeTitle: '知識:',
    tipKnowledgeText: '在遊戲開始時,你知道你的"邪惡"盟友是誰,但根據規則隱藏的角色除外。',
    tipObjectiveTitle: '目標:',
    tipObjectiveText: '你的最終目標是讓五次任務中有三次失敗,或在"正義"團隊中播下足夠的不信任,以幫助你的邪惡團隊獲勝。',
    strategicTipsTitle: '策略提示:',
    tipDiscreetCollaborationTitle: '謹慎合作:',
    tipDiscreetCollaborationText: '與你的"邪惡"隊友密切合作,秘密策劃如何執行每一項任務,以及誰將冒險使任務失敗。',
    tipDeceptionTitle: '欺騙:',
    tipDeceptionText: '精通欺騙的藝術。假扮成"正義"一員能幫助你影響他們的決策並保護你的身份。',
    tipPublicDemeanorTitle: '公開形象:',
    tipPublicDemeanorText: '注意你的公開言行。避免過分防備或過於激進,以免引起他人懷疑。',
    tipUndermineTrustTitle: '破壞信任:',
    tipUndermineTrustText: '巧妙地質疑"正義"玩家的行動和決策,營造一種不信任與混亂的氛圍。',
    tipSuspectManagementTitle: '疑點處理:',
    tipSuspectManagementText:
      '若有懷疑指向你,請巧妙地轉移注意力,避免過於引人注目。運用邏輯為自己辯護,但不要過於強烈,以免引發新一輪懷疑。',
    tipStrategicSacrificeTitle: '策略性犧牲:',
    tipStrategicSacrificeText:
      '有時犧牲一位"邪惡"隊友以贏得"正義"團隊的信任是明智的,尤其是在這能在關鍵任務中使"邪惡"佔多數時。',
    conclusionText:
      '作為{minion},你的成功取決於你欺騙和操縱"正義"團隊的能力,同時與你的"邪惡"盟友協同作戰。你的狡猾與謹慎是推翻正義力量、確保{mordred}勝利的關鍵。',
  },
  es: {
    generalTipsTitle: 'Consejos Generales:',
    tipRoleTitle: 'Rol:',
    tipRoleText:
      "Formas parte del equipo 'Malvado', cuyo objetivo principal es frustrar las misiones del equipo 'Bueno' o asegurarte de participar en las que resultan exitosas.",
    tipKnowledgeTitle: 'Conocimiento:',
    tipKnowledgeText:
      "Al comienzo del juego, sabes quiénes son tus aliados del equipo 'Malvado', excepto aquellos roles que las reglas del juego ocultan.",
    tipObjectiveTitle: 'Objetivo:',
    tipObjectiveText:
      "Tu meta definitiva es lograr que tres de las cinco misiones fracasen o sembrar la desconfianza suficiente entre los 'Buenos' para llevar a tu equipo malvado a la victoria.",
    strategicTipsTitle: 'Consejos Estratégicos:',
    tipDiscreetCollaborationTitle: 'Colaboración discreta:',
    tipDiscreetCollaborationText:
      "Trabaja en estrecha colaboración con tus compañeros 'Malvados' en secreto. Planifica cómo abordar cada misión y quién asumirá el riesgo de hacer que una misión fracase.",
    tipDeceptionTitle: 'Engaño:',
    tipDeceptionText:
      "Perfecciona el arte del engaño. Hacerse pasar por uno de los 'Buenos' puede ayudarte a influir en sus decisiones y proteger tu identidad.",
    tipPublicDemeanorTitle: 'Comportamiento público:',
    tipPublicDemeanorText:
      'Cuida tus actos y palabras en público. Trata de evitar generar sospechas, sin ser ni demasiado defensivo ni excesivamente agresivo.',
    tipUndermineTrustTitle: 'Debilita la confianza:',
    tipUndermineTrustText:
      "Cuestiona sutilmente las acciones y decisiones de los jugadores 'Buenos' para crear un ambiente de desconfianza y confusión.",
    tipSuspectManagementTitle: 'Gestión de sospechas:',
    tipSuspectManagementText:
      'Si las sospechas recaen sobre ti, redirígelas hábilmente sin llamar demasiado la atención. Emplea argumentos lógicos para defenderte, pero evita ser demasiado convincente para no aumentar las sospechas.',
    tipStrategicSacrificeTitle: 'Sacrificio estratégico:',
    tipStrategicSacrificeText:
      "Puede ser beneficioso sacrificar a un miembro del equipo 'Malvado' para ganarte la confianza del equipo 'Bueno', especialmente si esto puede conducir a una mayoría malvada en misiones críticas.",
    conclusionText:
      "Como {minion}, tu éxito depende de tu habilidad para engañar y manipular al equipo 'Bueno' mientras coordinas con tus aliados 'Malvados'. Tu astucia y discreción son herramientas clave para derrocar a las fuerzas del bien y asegurar la victoria para {mordred}.",
  },
  pt: {
    generalTipsTitle: 'Dicas Gerais:',
    tipRoleTitle: 'Função:',
    tipRoleText:
      "Você faz parte da equipe do 'Mal', com o objetivo principal de frustrar as missões da equipe do 'Bem' ou garantir sua presença nas missões bem-sucedidas.",
    tipKnowledgeTitle: 'Conhecimento:',
    tipKnowledgeText:
      "No início do jogo, você sabe quem são seus aliados do 'Mal', exceto os papéis ocultos de você pelas regras do jogo.",
    tipObjectiveTitle: 'Objetivo:',
    tipObjectiveText:
      "Seu objetivo final é fazer com que três das cinco missões falhem ou semear desconfiança suficiente entre a equipe do 'Bem' para levar sua equipe do mal à vitória.",
    strategicTipsTitle: 'Dicas Estratégicas:',
    tipDiscreetCollaborationTitle: 'Colaboração Discreta:',
    tipDiscreetCollaborationText:
      "Trabalhe em estreita colaboração com seus companheiros do 'Mal' em segredo. Planeje como abordar cada missão e quem assumirá o risco de fazer uma missão falhar.",
    tipDeceptionTitle: 'Engano:',
    tipDeceptionText:
      "Aperfeiçoe a arte do engano. Misturar-se como um dos membros do 'Bem' pode ajudá-lo a influenciar suas decisões e proteger sua identidade.",
    tipPublicDemeanorTitle: 'Comportamento Público:',
    tipPublicDemeanorText:
      'Esteja atento às suas ações e palavras públicas. Tente evitar suspeitas não sendo muito defensivo ou muito agressivo.',
    tipUndermineTrustTitle: 'Minar a Confiança:',
    tipUndermineTrustText:
      "Questione sutilmente as ações e decisões dos jogadores do 'Bem' para criar uma atmosfera de desconfiança e confusão.",
    tipSuspectManagementTitle: 'Gerenciamento de Suspeitas:',
    tipSuspectManagementText:
      'Se a suspeita recair sobre você, redirecione-a habilmente sem chamar muita atenção para si mesmo. Use argumentos lógicos para se defender, mas evite ser muito convincente para não levantar mais suspeitas.',
    tipStrategicSacrificeTitle: 'Sacrifício Estratégico:',
    tipStrategicSacrificeText:
      "Pode ser benéfico sacrificar um membro da equipe do 'Mal' para ganhar a confiança da equipe do 'Bem', particularmente se isso puder levar a uma maioria do 'Mal' em missões críticas.",
    conclusionText:
      "Como um {minion}, seu sucesso depende da sua capacidade de enganar e manipular a equipe do 'Bem' enquanto coordena com seus aliados do 'Mal'. Sua astúcia e discrição são instrumentos-chave para derrubar as forças do bem e garantir a vitória para {mordred}.",
  },
};
