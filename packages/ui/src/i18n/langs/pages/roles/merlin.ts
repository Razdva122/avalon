import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const merlin: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    factsTitle: 'Merlin in Avalon: abilities at a glance',
    teamLabel: 'Team',
    teamValue: 'Good — help three missions succeed and survive the assassination.',
    seesLabel: 'Who Merlin sees',
    seesValue:
      'In the classic role set, Merlin sees the evil players, including {morgana} and {oberon}, but not {mordred}. Merlin learns their evil loyalty, not their exact role names.',
    hiddenLabel: 'Who Merlin cannot identify',
    hiddenValue:
      '{mordred} is hidden from Merlin. A player who is not revealed as evil is therefore not guaranteed to be good.',
    percivalLabel: 'Merlin and Percival',
    percivalValue:
      '{percival} sees Merlin and {morgana} as two candidates, without knowing which is which. Merlin does not learn who Percival is.',
    lossLabel: 'How Merlin loses',
    lossValue:
      'Three failed missions give evil the win. After three successful missions, a correct assassination of Merlin also gives evil the win.',
    generalInformationTitle: 'General Information:',
    generalInformationText: `Playing {merlin} means helping good choose safe teams without making your private information obvious. Explain your votes using the discussion and mission history. The Assassin can use your certainty to identify you, so a winning mission record is only part of your goal.`,

    generalTipsTitle: 'General Tips:',
    cautiousKnowledgeTitle: 'Be cautious with your knowledge: ',
    cautiousKnowledgeText:
      'While {merlin} knows who the evil players are, revealing this directly can risk being assassinated. Your goal is to aid the Arthurian side subtly.',

    useHintsWiselyTitle: 'Use hints wisely: ',
    useHintsWiselyText:
      'Mastering the art of dropping subtle hints to your team without being too obvious is crucial for {merlin}.',

    carefulAccusationsTitle: 'Be careful with accusations: ',
    carefulAccusationsText: 'Accusing minions of evil too accurately or quickly can reveal your role. Balance is key.',

    maintainBalanceTitle: 'Maintain balance in your gameplay: ',
    maintainBalanceText:
      'Keep your explanations grounded in evidence everyone can discuss. You do not need to deliberately sabotage good decisions to hide your role.',

    attentionAssassinTitle: 'Pay attention to the assassin: ',
    attentionAssassinText:
      'Remember, an assassin will try to identify {merlin} at the end of the game if good prevails. Being too obvious with your hints could lead to your downfall.',

    strategicTipsTitle: 'Merlin strategy: common situations',
    strategizeSilenceTitle: 'A known evil player is proposed:',
    strategizeSilence:
      'Question the proposed team using public evidence, such as a failed mission or an inconsistent explanation. Naming every evil player immediately can expose your role.',
    revealEvilsTitle: 'A mission succeeds with an evil player:',
    revealEvils:
      'Do not treat that team as confirmed good. Evil can play Success to earn trust; compare later teams and votes before endorsing the same lineup.',
    utilizeAmbiguityTitle: 'Mordred is in the game:',
    utilizeAmbiguity:
      'Remember that a player you did not see as evil may still be Mordred. Use mission results to evaluate those players instead of assuming they are safe.',
    buildTrustTitle: 'Percival is looking for Merlin:',
    buildTrust:
      'Keep your explanations consistent with your votes. Do not openly identify yourself to win an argument: that also gives the Assassin information.',
    supportAlliesTitle: 'Good is close to its third success:',
    supportAllies:
      'Support a safe team without claiming credit for every correct decision. The assassination still matters after the mission succeeds.',
    playingAsMerlin:
      'Playing as {merlin} is challenging yet highly rewarding. With careful strategy and tactful communication, you can lead the forces of good to victory while staying hidden from the dark clutches of the assassin. Good luck!',
  },
  ru: {
    lossValue:
      'Три проваленные миссии приносят победу злу. После трёх успешных миссий правильное убийство Мерлина также приносит победу злу.',
    lossLabel: 'Когда Мерлин проигрывает',
    percivalValue:
      '{percival} видит Мерлина и {morgana} как двух кандидатов, не зная, кто из них кто. Сам Мерлин не узнаёт, кто играет за Персиваля.',
    percivalLabel: 'Мерлин и Персиваль',
    hiddenValue: '{mordred} скрыт от Мерлина. Поэтому игрок, который не показан как злой, не обязательно добрый.',
    hiddenLabel: 'Кого Мерлин не может определить',
    seesValue:
      'В классическом наборе ролей Мерлин видит злых игроков, включая {morgana} и {oberon}, но не {mordred}. Он узнаёт их принадлежность ко злу, а не точные названия ролей.',
    seesLabel: 'Кого видит Мерлин',
    teamValue: 'Добро — помогите выполнить три миссии и переживите покушение.',
    teamLabel: 'Команда',
    factsTitle: 'Мерлин в Авалоне: способности коротко',
    generalInformationTitle: 'Общая информация:',
    generalInformationText:
      'Играя за {merlin}, помогайте добру выбирать безопасные команды, не выдавая свои тайные знания. Объясняйте голосования через обсуждение и историю миссий. Убийца может распознать вас по чрезмерной уверенности, поэтому успешные миссии — лишь часть вашей цели.',

    generalTipsTitle: 'Общие советы:',
    cautiousKnowledgeTitle: 'Будьте осторожны со своими знаниями: ',
    cautiousKnowledgeText:
      'Хотя {merlin} знает, кто злые игроки, открытое раскрытие этой информации может привести к убийству. Ваша цель — тайно помогать светлой стороне.',

    useHintsWiselyTitle: 'Используйте подсказки с умом: ',
    useHintsWiselyText:
      'Мастерство в искусстве передачи тонких намеков вашей команде, не будучи слишком очевидным, имеет решающее значение для {merlin}.',

    carefulAccusationsTitle: 'Будьте осторожны с обвинениями: ',
    carefulAccusationsText:
      'Точное или быстрое обвинение приспешников зла может раскрыть вашу роль. Важно сохранять баланс.',

    maintainBalanceTitle: 'Сохраняйте баланс в своей игре: ',
    maintainBalanceText:
      'Обосновывайте решения фактами, доступными всем. Чтобы скрыть роль, не нужно намеренно мешать правильным решениям команды.',

    attentionAssassinTitle: 'Обратите внимание на ассасина: ',
    attentionAssassinText:
      'Помните, ассасин постарается выявить {merlin} в конце игры, если добрые одержат победу. Слишком очевидные подсказки могут привести к вашей гибели.',
    strategicTipsTitle: 'Стратегия Мерлина: игровые ситуации',
    strategizeSilenceTitle: 'В команду предлагают известного вам злого игрока:',
    strategizeSilence:
      'Обсудите команду, опираясь на общие сведения: проваленную миссию или противоречивые объяснения. Если сразу назвать всех злых игроков, можно выдать свою роль.',
    revealEvilsTitle: 'Миссия со злым игроком оказалась успешной:',
    revealEvils:
      'Не считайте такую команду доказанно доброй. Зло может выбрать успех ради доверия; сравните следующие составы и голосования, прежде чем поддерживать ту же команду.',
    utilizeAmbiguityTitle: 'В партии есть Мордред:',
    utilizeAmbiguity:
      'Игрок, которого вы не увидели среди злых, всё ещё может быть Мордредом. Оценивайте таких игроков по результатам миссий, а не считайте их автоматически безопасными.',
    buildTrustTitle: 'Персиваль пытается найти Мерлина:',
    buildTrust:
      'Следите, чтобы объяснения соответствовали вашим голосам. Не раскрывайте роль ради победы в споре: эту информацию получит и Убийца.',
    supportAlliesTitle: 'Добро близко к третьей успешной миссии:',
    supportAllies:
      'Поддержите безопасную команду, не приписывая себе каждое верное решение. После успеха миссии ещё предстоит пережить покушение.',
    playingAsMerlin:
      'Играть за {merlin} сложно, но очень интересно. С помощью осторожной стратегии и тактичной коммуникации вы можете привести силы добра к победе, оставаясь скрытым от тёмных лап убийцы. Удачи!',
  },
  'zh-CN': {
    lossValue: '三次任务失败，邪恶阵营获胜。三次任务成功后，如果梅林被正确指认并刺杀，邪恶阵营同样获胜。',
    lossLabel: '梅林如何落败',
    percivalValue: '{percival}会看到梅林和{morgana}两名候选人，但不知道谁是谁。梅林并不知道谁是派西维尔。',
    percivalLabel: '梅林与派西维尔',
    hiddenValue: '{mordred}不会被梅林看到。因此，没有被显示为邪恶的玩家不一定是好人。',
    hiddenLabel: '梅林无法确定谁的身份',
    seesValue:
      '在经典角色配置中，梅林能看到邪恶玩家，包括{morgana}和{oberon}，但看不到{mordred}。梅林知道他们属于邪恶阵营，不知道各自的具体角色。',
    seesLabel: '梅林能看到谁',
    teamValue: '好人：帮助三次任务成功，并躲过刺杀。',
    teamLabel: '阵营',
    factsTitle: '阿瓦隆梅林：能力速览',
    generalInformationTitle: '一般信息：',
    generalInformationText:
      '扮演{merlin}时，要帮助好人选出安全的队伍，同时避免暴露自己的秘密信息。用公开讨论和任务记录解释投票。刺客可能从你过于肯定的态度中认出你，因此完成任务只是目标的一部分。',

    generalTipsTitle: '一般提示:',
    cautiousKnowledgeTitle: '对你的知识保持谨慎:',
    cautiousKnowledgeText: '虽然{merlin}知道谁是邪恶玩家，但直接揭示这一点可能会导致被暗杀。你的目标是暗中协助亚瑟方。',

    useHintsWiselyTitle: '明智地使用提示:',
    useHintsWiselyText: '掌握在不太明显的情况下给你的团队留下微妙提示的艺术对{merlin}至关重要。',

    carefulAccusationsTitle: '谨慎指控:',
    carefulAccusationsText: '过于准确或迅速地指控邪恶的手下可能会暴露你的身份。关键在于平衡。',

    maintainBalanceTitle: '保持游戏平衡:',
    maintainBalanceText: '用所有人都能讨论的证据解释决定。不必为了隐藏身份而故意破坏正确的团队决策。',

    attentionAssassinTitle: '注意刺客:',
    attentionAssassinText: '记住，如果正义一方获胜，刺客会尝试识别{merlin}。过于明显的提示可能导致你的失败。',
    strategicTipsTitle: '梅林策略：常见场景',
    strategizeSilenceTitle: '有人提议把你已知的坏人派上任务：',
    strategizeSilence: '用公开信息质疑队伍，例如失败的任务或前后矛盾的解释。立刻点出所有坏人可能暴露你的身份。',
    revealEvilsTitle: '有坏人参与的任务成功了：',
    revealEvils: '不要因此认定整队都是好人。坏人也能出成功来获取信任；再次支持同一队伍前，比较后续组队与投票。',
    utilizeAmbiguityTitle: '本局包含莫德雷德：',
    utilizeAmbiguity: '没有被你看到的玩家仍可能是莫德雷德。应根据任务结果判断这些玩家，而不是直接认为他们安全。',
    buildTrustTitle: '派西维尔正在寻找梅林：',
    buildTrust: '让解释与投票保持一致。不要为了赢得争论而公开身份，这也会给刺客提供信息。',
    supportAlliesTitle: '好人即将取得第三次任务成功：',
    supportAllies: '支持安全的队伍，但不要把每次正确判断都归功于自己。任务成功后，刺杀阶段仍然重要。',
    playingAsMerlin:
      '作为 {merlin} 游戏既具有挑战性又充满回报。通过小心的策略和巧妙的沟通，你可以在隐藏于刺客的眼皮底下带领正义的力量走向胜利。祝好运！',
  },
  'zh-TW': {
    lossValue: '三次任務失敗，邪惡陣營獲勝。三次任務成功後，如果梅林被正確指認並刺殺，邪惡陣營同樣獲勝。',
    lossLabel: '梅林如何落敗',
    percivalValue: '{percival}會看到梅林和{morgana}兩名候選人，但不知道誰是誰。梅林並不知道誰是派西維爾。',
    percivalLabel: '梅林與派西維爾',
    hiddenValue: '{mordred}不會被梅林看到。因此，沒有被顯示為邪惡的玩家不一定是好人。',
    hiddenLabel: '梅林無法確定誰的身分',
    seesValue:
      '在經典角色配置中，梅林能看到邪惡玩家，包括{morgana}和{oberon}，但看不到{mordred}。梅林知道他們屬於邪惡陣營，不知道各自的具體角色。',
    seesLabel: '梅林能看到誰',
    teamValue: '好人：幫助三次任務成功，並躲過刺殺。',
    teamLabel: '陣營',
    factsTitle: '阿瓦隆梅林：能力速覽',
    generalInformationTitle: '一般信息：',
    generalInformationText:
      '扮演{merlin}時，要幫助好人選出安全的隊伍，同時避免暴露自己的秘密資訊。用公開討論和任務紀錄解釋投票。刺客可能從你過於肯定的態度中認出你，因此完成任務只是目標的一部分。',

    generalTipsTitle: '一般提示:',
    cautiousKnowledgeTitle: '對你的知識保持謹慎:',
    cautiousKnowledgeText: '雖然{merlin}知道誰是邪惡玩家，但直接揭示這一點可能會導致被暗殺。你的目標是暗中協助亞瑟方。',

    useHintsWiselyTitle: '明智地使用提示:',
    useHintsWiselyText: '掌握在不太明顯的情況下給你的團隊留下微妙提示的藝術對{merlin}至關重要。',

    carefulAccusationsTitle: '謹慎指控:',
    carefulAccusationsText: '過於準確或迅速地指控邪惡的手下可能會暴露你的身份。關鍵在於平衡。',

    maintainBalanceTitle: '保持遊戲平衡:',
    maintainBalanceText: '用所有人都能討論的證據解釋決定。不必為了隱藏身分而故意破壞正確的團隊決策。',

    attentionAssassinTitle: '注意刺客:',
    attentionAssassinText: '記住，如果正義一方獲勝，刺客會嘗試識別{merlin}。過於明顯的提示可能導致你的失敗。',
    strategicTipsTitle: '梅林策略：常見情境',
    strategizeSilenceTitle: '有人提議把你已知的壞人派上任務：',
    strategizeSilence: '用公開資訊質疑隊伍，例如失敗的任務或前後矛盾的解釋。立刻點出所有壞人可能暴露你的身分。',
    revealEvilsTitle: '有壞人參與的任務成功了：',
    revealEvils: '不要因此認定整隊都是好人。壞人也能出成功來取得信任；再次支持同一隊伍前，比較後續組隊與投票。',
    utilizeAmbiguityTitle: '本局包含莫德雷德：',
    utilizeAmbiguity: '沒有被你看到的玩家仍可能是莫德雷德。應根據任務結果判斷這些玩家，而不是直接認為他們安全。',
    buildTrustTitle: '派西維爾正在尋找梅林：',
    buildTrust: '讓解釋與投票保持一致。不要為了贏得爭論而公開身分，這也會給刺客提供資訊。',
    supportAlliesTitle: '好人即將取得第三次任務成功：',
    supportAllies: '支持安全的隊伍，但不要把每次正確判斷都歸功於自己。任務成功後，刺殺階段仍然重要。',
    playingAsMerlin:
      '作為 {merlin} 遊玩既具有挑戰性又充滿回報。通過小心的策略和巧妙的溝通，你可以在隱藏於刺客的眼皮底下帶領正義的力量走向勝利。祝好運！',
  },
  es: {
    lossValue:
      'Tres misiones fallidas dan la victoria al mal. Tras tres misiones exitosas, identificar y asesinar correctamente a Merlín también da la victoria al mal.',
    lossLabel: 'Cómo pierde Merlín',
    percivalValue:
      '{percival} ve a Merlín y a {morgana} como dos candidatos, sin saber cuál es cuál. Merlín no sabe quién es Percival.',
    percivalLabel: 'Merlín y Percival',
    hiddenValue:
      '{mordred} permanece oculto para Merlín. Por eso, un jugador que no aparece como malvado no es necesariamente bueno.',
    hiddenLabel: 'A quién no puede identificar Merlín',
    seesValue:
      'Con los roles clásicos, Merlín ve a los jugadores del mal, incluidos {morgana} y {oberon}, pero no a {mordred}. Conoce su lealtad al mal, no el nombre exacto de sus roles.',
    seesLabel: 'A quién ve Merlín',
    teamValue: 'Bien: ayuda a completar tres misiones y sobrevive al asesinato.',
    teamLabel: 'Equipo',
    factsTitle: 'Merlín en Avalon: resumen de habilidades',
    generalInformationTitle: 'Información General:',
    generalInformationText:
      'Jugar como {merlin} consiste en ayudar al bien a elegir equipos seguros sin revelar tu información privada. Explica tus votos mediante la discusión y el historial de misiones. El Asesino puede reconocerte por tu seguridad, así que completar misiones es solo una parte de tu objetivo.',

    generalTipsTitle: 'Consejos Generales:',
    cautiousKnowledgeTitle: 'Sé cauteloso con tu conocimiento: ',
    cautiousKnowledgeText:
      'Aunque {merlin} sabe quiénes son los jugadores del mal, revelar esto directamente puede arriesgarse a ser asesinado. Tu objetivo es ayudar al lado Artúrico de manera sutil.',

    useHintsWiselyTitle: 'Usa pistas sabiamente: ',
    useHintsWiselyText:
      'Dominar el arte de dejar pistas sutiles a tu equipo sin ser demasiado obvio es crucial para {merlin}.',

    carefulAccusationsTitle: 'Ten cuidado con las acusaciones: ',
    carefulAccusationsText:
      'Acusar a los secuaces del mal con demasiada precisión o rapidez puede revelar tu rol. El equilibrio es clave.',

    maintainBalanceTitle: 'Mantén el equilibrio en tu juego: ',
    maintainBalanceText:
      'Basa tus explicaciones en pruebas que todos puedan discutir. No necesitas perjudicar deliberadamente las buenas decisiones para ocultar tu rol.',

    attentionAssassinTitle: 'Presta atención al asesino: ',
    attentionAssassinText:
      'Recuerda, un asesino intentará identificar a {merlin} al final del juego si prevalece el bien. Ser demasiado obvio con tus pistas podría llevar a tu caída.',

    strategicTipsTitle: 'Estrategia de Merlín: situaciones habituales',
    strategizeSilenceTitle: 'Proponen a un jugador que sabes que es del mal:',
    strategizeSilence:
      'Cuestiona el equipo con pruebas públicas, como una misión fallida o una explicación contradictoria. Nombrar de inmediato a todos los malvados puede revelar tu rol.',
    revealEvilsTitle: 'Una misión tiene éxito con un jugador del mal:',
    revealEvils:
      'No des por demostrado que todo el equipo sea bueno. El mal puede elegir Éxito para ganarse la confianza; compara los siguientes equipos y votos antes de apoyar la misma formación.',
    utilizeAmbiguityTitle: 'Mordred está en la partida:',
    utilizeAmbiguity:
      'Un jugador que no viste como malvado aún puede ser Mordred. Evalúa a esas personas mediante los resultados de las misiones, en lugar de asumir que son seguras.',
    buildTrustTitle: 'Percival está buscando a Merlín:',
    buildTrust:
      'Mantén tus explicaciones coherentes con tus votos. No reveles tu identidad para ganar una discusión: también darías información al Asesino.',
    supportAlliesTitle: 'El bien está cerca de su tercer éxito:',
    supportAllies:
      'Apoya un equipo seguro sin atribuirte todas las decisiones correctas. El asesinato sigue siendo importante después del éxito de la misión.',
    playingAsMerlin:
      'Jugar como {merlin} es desafiante pero muy gratificante. Con una estrategia cuidadosa y una comunicación hábil, puedes llevar a las fuerzas del bien a la victoria mientras permaneces oculto de las oscuras garras del asesino. ¡Buena suerte!',
  },
  pt: {
    lossValue:
      'Três missões fracassadas dão a vitória ao mal. Após três missões bem-sucedidas, identificar e assassinar Merlin corretamente também dá a vitória ao mal.',
    lossLabel: 'Como Merlin perde',
    percivalValue:
      '{percival} vê Merlin e {morgana} como dois candidatos, sem saber quem é quem. Merlin não descobre quem é Percival.',
    percivalLabel: 'Merlin e Percival',
    hiddenValue:
      '{mordred} fica oculto para Merlin. Portanto, um jogador que não aparece como mau não é necessariamente do bem.',
    hiddenLabel: 'Quem Merlin não consegue identificar',
    seesValue:
      'Com os papéis clássicos, Merlin vê os jogadores do mal, incluindo {morgana} e {oberon}, mas não {mordred}. Ele conhece a lealdade deles ao mal, não os nomes exatos dos papéis.',
    seesLabel: 'Quem Merlin vê',
    teamValue: 'Bem: ajude três missões a terem sucesso e sobreviva ao assassinato.',
    teamLabel: 'Equipe',
    factsTitle: 'Merlin em Avalon: resumo das habilidades',
    generalInformationTitle: 'Informações Gerais:',
    generalInformationText:
      'Jogar como {merlin} significa ajudar o bem a escolher equipes seguras sem revelar suas informações privadas. Explique seus votos com base na discussão e no histórico das missões. O Assassino pode reconhecer você pela sua certeza; por isso, completar missões é apenas parte do objetivo.',

    generalTipsTitle: 'Dicas Gerais:',
    cautiousKnowledgeTitle: 'Seja cauteloso com seu conhecimento: ',
    cautiousKnowledgeText:
      'Embora {merlin} saiba quem são os jogadores do mal, revelar isso diretamente pode resultar em ser assassinado. Seu objetivo é ajudar o lado de Arthur sutilmente.',

    useHintsWiselyTitle: 'Use dicas com sabedoria: ',
    useHintsWiselyText:
      'Dominar a arte de dar dicas sutis para sua equipe sem ser muito óbvio é crucial para {merlin}.',

    carefulAccusationsTitle: 'Seja cuidadoso com acusações: ',
    carefulAccusationsText:
      'Acusar lacaios do mal com muita precisão ou rapidez pode revelar seu papel. O equilíbrio é fundamental.',

    maintainBalanceTitle: 'Mantenha equilíbrio em seu jogo: ',
    maintainBalanceText:
      'Baseie suas explicações em evidências que todos possam discutir. Não é necessário prejudicar boas decisões de propósito para esconder seu papel.',

    attentionAssassinTitle: 'Preste atenção ao assassino: ',
    attentionAssassinText:
      'Lembre-se, um assassino tentará identificar {merlin} no final do jogo se o bem prevalecer. Ser muito óbvio com suas dicas pode levar à sua queda.',

    strategicTipsTitle: 'Estratégia de Merlin: situações comuns',
    strategizeSilenceTitle: 'Propõem um jogador que você sabe ser do mal:',
    strategizeSilence:
      'Questione a equipe usando evidências públicas, como uma missão fracassada ou uma explicação contraditória. Nomear todos os jogadores do mal imediatamente pode revelar seu papel.',
    revealEvilsTitle: 'Uma missão tem sucesso com um jogador do mal:',
    revealEvils:
      'Não considere comprovado que toda a equipe é do bem. O mal pode escolher Sucesso para ganhar confiança; compare as próximas equipes e votações antes de apoiar a mesma formação.',
    utilizeAmbiguityTitle: 'Mordred está na partida:',
    utilizeAmbiguity:
      'Um jogador que você não viu como mau ainda pode ser Mordred. Avalie essas pessoas pelos resultados das missões, em vez de presumir que são seguras.',
    buildTrustTitle: 'Percival está procurando Merlin:',
    buildTrust:
      'Mantenha suas explicações coerentes com seus votos. Não revele sua identidade para vencer uma discussão: isso também informa o Assassino.',
    supportAlliesTitle: 'O bem está perto do terceiro sucesso:',
    supportAllies:
      'Apoie uma equipe segura sem levar o crédito por todas as decisões corretas. O assassinato continua importante depois do sucesso da missão.',
    playingAsMerlin:
      'Jogar como {merlin} é desafiador, mas muito gratificante. Com estratégia cuidadosa e comunicação tática, você pode levar as forças do bem à vitória enquanto permanece escondido das garras sombrias do assassino. Boa sorte!',
  },
};
