import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const merlin: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    generalInformationTitle: 'General Information:',
    generalInformationText: `Assuming the role of {merlin} necessitates a masterful balancing act: one must possess intimate knowledge of all minions of evil (save for {mordred}, in classic gameplay) yet be unable to divulge this information outright. The true challenge lies in covertly shepherding the forces of good toward triumph, all while avoiding detection and a potential assassination by the forces of evil's assassin at the game's conclusion. More intricate still is the necessity to counteract the deceits of {morgana} and to garner the trust of {percival}. {morgana} vies to mimic your persona, leading the righteous astray, whereas {percival} endeavours to pierce through the pretense and uncover the verity.`,

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
      'It’s important to not appear too knowledgeable. Sometimes, making deliberate mistakes or staying silent can throw evil players off.',

    attentionAssassinTitle: 'Pay attention to the assassin: ',
    attentionAssassinText:
      'Remember, an assassin will try to identify {merlin} at the end of the game if good prevails. Being too obvious with your hints could lead to your downfall.',

    strategicTipsTitle: 'Strategic Tips:',
    strategizeSilenceTitle: 'Strategize your silence:',
    strategizeSilence:
      'Sometimes, the best way to conceal your role is by withholding comments, especially in the early stages of the game.',
    revealEvilsTitle: 'Reveal evil players gradually:',
    revealEvils: 'Guide your allies to the truth gradually, avoiding harsh accusations.',
    utilizeAmbiguityTitle: 'Utilize ambiguity:',
    utilizeAmbiguity: 'Make comments that could be interpreted in multiple ways, keeping the evil players guessing.',
    buildTrustTitle: 'Build trust:',
    buildTrust:
      'Apart from revealing evil, convincing other players of your allegiance to good is vital. Establishing trust can influence team decisions.',
    supportAlliesTitle: 'Support your allies:',
    supportAllies:
      "Sometimes it's more effective to back up correct suggestions from others than to constantly push your own ideas.",
    playingAsMerlin:
      'Playing as {merlin} is challenging yet highly rewarding. With careful strategy and tactful communication, you can lead the forces of good to victory while staying hidden from the dark clutches of the assassin. Good luck!',
  },
  ru: {
    generalInformationTitle: 'Общая информация:',
    generalInformationText: `Роль {merlin} требует мастерского баланса: вы обладаете полным знанием всех приспешников зла (кроме {mordred}, в классическом режиме игры), но не имеете возможности раскрыть эту информацию напрямую. Настоящее испытание заключается в том, чтобы тайно вести силы добра к победе, избегая при этом обнаружения и возможного убийства ассасином сил зла в конце игры. Ещё более сложной является необходимость противодействовать обманам {morgana} и завоевать доверие {percival}. {morgana} старается подражать вашей личности, вводя ваших союзников в заблуждение, тогда как {percival} стремится разгадать притворство и узнать истину.`,

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
      'Важно не казаться слишком осведомленным. Иногда совершение преднамеренных ошибок или молчание может сбить с толку злых игроков.',

    attentionAssassinTitle: 'Обратите внимание на ассасина: ',
    attentionAssassinText:
      'Помните, ассасин постарается выявить {merlin} в конце игры, если добрые одержат победу. Слишком очевидные подсказки могут привести к вашей гибели.',
    strategicTipsTitle: 'Стратегические советы:',
    strategizeSilenceTitle: 'Стратегическое молчание:',
    strategizeSilence:
      'Иногда лучший способ скрыть свою роль — воздержаться от комментариев, особенно на ранних стадиях игры.',
    revealEvilsTitle: 'Постепенно раскрывайте злых игроков:',
    revealEvils: 'Направляйте своих союзников к истине постепенно, избегая резких обвинений.',
    utilizeAmbiguityTitle: 'Используйте двусмысленность:',
    utilizeAmbiguity:
      'Делайте комментарии, которые можно интерпретировать по-разному, чтобы злые игроки остались в неведении.',
    buildTrustTitle: 'Создавайте доверие:',
    buildTrust:
      'Помимо раскрытия зла, важно убедить других игроков в вашей преданности добру. Установление доверия может повлиять на решения команды.',
    supportAlliesTitle: 'Поддерживайте союзников:',
    supportAllies:
      'Иногда более эффективно поддерживать правильные предложения других, чем постоянно продвигать свои собственные идеи.',
    playingAsMerlin:
      'Играть за {merlin} сложно, но очень интересно. С помощью осторожной стратегии и тактичной коммуникации вы можете привести силы добра к победе, оставаясь скрытым от тёмных лап убийцы. Удачи!',
  },
  'zh-CN': {
    generalInformationTitle: '一般信息：',
    generalInformationText: `担任{merlin}的角色需要精妙的平衡：必须对所有邪恶手下有深入了解（在经典游戏中，除{mordred}外），但无法直接透露这些信息。真正的挑战在于秘密地引导善良势力取得胜利，同时避免被邪恶势力的刺客在游戏结束时暗杀。更为复杂的是，需要对抗{morgana}的欺骗，并获得{percival}的信任。{morgana}模仿你的角色，误导正义之士，而{percival}努力揭穿伪装，找出真相。`,

    generalTipsTitle: '一般提示:',
    cautiousKnowledgeTitle: '对你的知识保持谨慎:',
    cautiousKnowledgeText: '虽然{merlin}知道谁是邪恶玩家，但直接揭示这一点可能会导致被暗杀。你的目标是暗中协助亚瑟方。',

    useHintsWiselyTitle: '明智地使用提示:',
    useHintsWiselyText: '掌握在不太明显的情况下给你的团队留下微妙提示的艺术对{merlin}至关重要。',

    carefulAccusationsTitle: '谨慎指控:',
    carefulAccusationsText: '过于准确或迅速地指控邪恶的手下可能会暴露你的身份。关键在于平衡。',

    maintainBalanceTitle: '保持游戏平衡:',
    maintainBalanceText: '重要的是不要显得太有知识。有时故意犯错或保持沉默可以扰乱邪恶玩家。',

    attentionAssassinTitle: '注意刺客:',
    attentionAssassinText: '记住，如果正义一方获胜，刺客会尝试识别{merlin}。过于明显的提示可能导致你的失败。',
    strategicTipsTitle: '策略建议：',
    strategizeSilenceTitle: '策略性保持沉默：',
    strategizeSilence: '有时，隐藏自己角色的最佳方式是在游戏初期保持沉默。',
    revealEvilsTitle: '逐步揭露邪恶玩家：',
    revealEvils: '逐步引导盟友接近真相，避免过于直接的指控。',
    utilizeAmbiguityTitle: '利用模糊性：',
    utilizeAmbiguity: '发表可以被多种方式解释的评论，让邪恶玩家摸不着头脑。',
    buildTrustTitle: '建立信任：',
    buildTrust: '除了揭露邪恶之外，说服其他玩家相信你对正义的忠诚也很重要。建立信任能够影响团队的决策。',
    supportAlliesTitle: '支持盟友：',
    supportAllies: '有时候，支持他人的正确建议比一直推销自己的主意更有效。',
    playingAsMerlin:
      '作为 {merlin} 游戏既具有挑战性又充满回报。通过小心的策略和巧妙的沟通，你可以在隐藏于刺客的眼皮底下带领正义的力量走向胜利。祝好运！',
  },
  'zh-TW': {
    generalInformationTitle: '一般信息：',
    generalInformationText: `擔任{merlin}的角色需要精妙的平衡：必須對所有邪惡手下有深入了解（在經典遊戲中，除{mordred}外），但無法直接透露這些信息。真正的挑戰在於秘密地引導善良勢力取得勝利，同時避免被邪惡勢力的刺客在遊戲結束時暗殺。更為複雜的是，需要對抗{morgana}的欺騙，並獲得{percival}的信任。{morgana} 模仿你的角色，誤導正義之士，而{percival}努力揭穿偽裝，找出真相。`,

    generalTipsTitle: '一般提示:',
    cautiousKnowledgeTitle: '對你的知識保持謹慎:',
    cautiousKnowledgeText: '雖然{merlin}知道誰是邪惡玩家，但直接揭示這一點可能會導致被暗殺。你的目標是暗中協助亞瑟方。',

    useHintsWiselyTitle: '明智地使用提示:',
    useHintsWiselyText: '掌握在不太明顯的情況下給你的團隊留下微妙提示的藝術對{merlin}至關重要。',

    carefulAccusationsTitle: '謹慎指控:',
    carefulAccusationsText: '過於準確或迅速地指控邪惡的手下可能會暴露你的身份。關鍵在於平衡。',

    maintainBalanceTitle: '保持遊戲平衡:',
    maintainBalanceText: '重要的是不要顯得太有知識。有時故意犯錯或保持沉默可以擾亂邪惡玩家。',

    attentionAssassinTitle: '注意刺客:',
    attentionAssassinText: '記住，如果正義一方獲勝，刺客會嘗試識別{merlin}。過於明顯的提示可能導致你的失敗。',
    strategicTipsTitle: '策略建議：',
    strategizeSilenceTitle: '策略性保持沉默：',
    strategizeSilence: '有時，隱藏自己角色的最佳方式是在遊戲初期保持沉默。',
    revealEvilsTitle: '逐步揭露邪惡玩家：',
    revealEvils: '逐步引導盟友接近真相，避免過於直接的指控。',
    utilizeAmbiguityTitle: '利用模糊性：',
    utilizeAmbiguity: '發表可以被多種方式解釋的評論，讓邪惡玩家摸不著頭緒。',
    buildTrustTitle: '建立信任：',
    buildTrust: '除了揭露邪惡之外，說服其他玩家相信你對正義的忠誠也很重要。建立信任能夠影響團隊的決策。',
    supportAlliesTitle: '支持盟友：',
    supportAllies: '有時候，支持他人的正確建議比一直推銷自己的主意更有效。',
    playingAsMerlin:
      '作為 {merlin} 遊玩既具有挑戰性又充滿回報。通過小心的策略和巧妙的溝通，你可以在隱藏於刺客的眼皮底下帶領正義的力量走向勝利。祝好運！',
  },
  es: {
    generalInformationTitle: 'Información General:',
    generalInformationText: `Asumir el rol de {merlin} requiere un acto de equilibrio magistral: uno debe poseer un conocimiento íntimo de todos los secuaces del mal (excepto {mordred}, en el juego clásico), pero no poder divulgar esta información directamente. El verdadero desafío radica en guiar encubiertamente a las fuerzas del bien hacia el triunfo, todo mientras se evita la detección y un posible asesinato por parte del asesino de las fuerzas del mal al final del juego. Más complicado aún es la necesidad de contrarrestar los engaños de {morgana} y de ganar la confianza de {percival}. {morgana} trata de imitar tu personalidad, llevando a los justos por el mal camino, mientras {percival} se esfuerza por atravesar la apariencia y descubrir la verdad.`,

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
      'Es importante no parecer demasiado informado. A veces, cometer errores deliberados o permanecer en silencio puede despistar a los jugadores del mal.',

    attentionAssassinTitle: 'Presta atención al asesino: ',
    attentionAssassinText:
      'Recuerda, un asesino intentará identificar a {merlin} al final del juego si prevalece el bien. Ser demasiado obvio con tus pistas podría llevar a tu caída.',

    strategicTipsTitle: 'Consejos Estratégicos:',
    strategizeSilenceTitle: 'Estrategia de silencio:',
    strategizeSilence:
      'A veces, la mejor manera de ocultar tu rol es abstenerte de hacer comentarios, especialmente en las primeras etapas del juego.',
    revealEvilsTitle: 'Revela a los jugadores del mal gradualmente:',
    revealEvils: 'Guía a tus aliados hacia la verdad de forma gradual, evitando acusaciones duras.',
    utilizeAmbiguityTitle: 'Utiliza la ambigüedad:',
    utilizeAmbiguity:
      'Haz comentarios que podrían interpretarse de múltiples maneras, manteniendo a los jugadores del mal en duda.',
    buildTrustTitle: 'Genera confianza:',
    buildTrust:
      'Además de revelar el mal, convencer a otros jugadores de tu lealtad al bien es vital. Establecer confianza puede influir en las decisiones del equipo.',
    supportAlliesTitle: 'Apoya a tus aliados:',
    supportAllies:
      'A veces, es más efectivo respaldar sugerencias correctas de otros que impulsar constantemente tus propias ideas.',
    playingAsMerlin:
      'Jugar como {merlin} es desafiante pero muy gratificante. Con una estrategia cuidadosa y una comunicación hábil, puedes llevar a las fuerzas del bien a la victoria mientras permaneces oculto de las oscuras garras del asesino. ¡Buena suerte!',
  },
};
