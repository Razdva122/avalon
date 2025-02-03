import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const morgana: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    generalInformation: 'General Information: ',
    playingAsMorgana:
      'Playing as {morgana} revolves around deception, specifically making yourself seem like {merlin} to confuse the forces of good. You should aim to bewilder {percival} not only through your actions but also by paying close attention to how {merlin} might be guiding the good forces. Blending in as Merlin could lead {percival} astray, giving the forces of evil an upper hand.',
    generalTips: 'General Tips: ',
    masterArtOfDeceptionTitle: 'Master the art of deception: ',
    masterArtOfDeceptionDescription:
      'Use your actions and words to mimic the role of {merlin}, leading the good players away from the truth.',
    createConfusionTitle: 'Create confusion among good players: ',
    createConfusionDescription: 'Strategic disinformation can sow doubt and hinder their decision-making.',
    coordinateEvilPlayersTitle: 'Coordinate with evil players discreetly: ',
    coordinateEvilPlayersDescription:
      'Work together with your evil teammates, but do so cautiously to avoid raising suspicion.',
    stayComposedTitle: 'Stay composed: ',
    stayComposedDescription:
      "Even if suspicion falls on you, keeping a calm and collected demeanor can help dissuade others from believing they've correctly identified you.",
    adaptStrategyTitle: 'Adapt your strategy: ',
    adaptStrategyDescription:
      "Be reactive to the game's progression and ready to change tactics to keep the forces of good guessing.",
    strategicTips: 'Strategic Tips: ',
    emphasizePlausibleDeniabilityTitle: 'Emphasize plausible deniability: ',
    emphasizePlausibleDeniabilityDescription:
      'Make statements that help your case without committing too strongly to any particular course that could expose you.',
    divertAttentionTitle: 'Divert attention gracefully: ',
    divertAttentionDescription:
      'If you feel the focus is turning towards you, deftly redirect the conversation or suspicion elsewhere.',
    imitateMerlinsConcernTitle: "Imitate Merlin's concern: ",
    imitateMerlinsConcernDescription:
      'Show apparent concern for the success of the good team while discreetly guiding them towards failure.',
    questionOthersTitle: 'Question others: ',
    questionOthersDescription:
      'Ask strategic questions that make others reveal more about their roles and strategies, which you can then use to your advantage.',
    fakeTrustworthinessTitle: 'Fake trustworthiness: ',
    fakeTrustworthinessDescription:
      'Building a facade of trustworthiness can empower your misleading suggestions, making them more likely to be followed.',
    thrivingAsMorgana:
      "Thriving as {morgana} requires a fine balance between assertiveness and subtlety. Your ability to manipulate the narrative and influence both evil and good players significantly affects your team's chance of victory. Embrace the challenge and enjoy manoeuvring through Avalon's shadowy waters.",
  },
  ru: {
    generalInformation: 'Общая информация: ',
    playingAsMorgana:
      'Играя за {morgana}, вы должны строить обман, в частности, создавая видимость, что вы {merlin}, чтобы запутать силы добра. Вы должны стремиться сбить с толку {percival} не только своими действиями, но и тщательно следя за тем, как {merlin} может направлять силы добра. Притворяясь Мерлином, вы можете ввести в заблуждение {percival}, что даст команде зла преимущество.',
    generalTips: 'Общие советы: ',
    masterArtOfDeceptionTitle: 'Освойте искусство обмана: ',
    masterArtOfDeceptionDescription:
      'Используйте свои действия и слова, чтобы подражать роли {merlin}, отвлекая добрых игроков от истины.',
    createConfusionTitle: 'Создайте путаницу среди добрых игроков: ',
    createConfusionDescription: 'Стратегическая дезинформация может посеять сомнение и затруднить их принятие решений.',
    coordinateEvilPlayersTitle: 'Тайно координируйтесь со злым игроками: ',
    coordinateEvilPlayersDescription:
      'Работайте вместе с вашими злыми соратниками, но делайте это осторожно, чтобы избежать подозрений.',
    stayComposedTitle: 'Сохраняйте спокойствие: ',
    stayComposedDescription:
      'Даже если подозрения падают на вас, удержание спокойного и собранного поведения может помочь отговорить других от веры в то, что они верно вас идентифицировали.',
    adaptStrategyTitle: 'Адаптируйте стратегию: ',
    adaptStrategyDescription:
      'Будьте готовы реагировать на развитие игры и изменять тактику, чтобы держать силы добра в неведении.',
    strategicTips: 'Стратегические советы: ',
    emphasizePlausibleDeniabilityTitle: 'Акцентируйте правдоподобное отрицание: ',
    emphasizePlausibleDeniabilityDescription:
      'Делайте заявления, которые помогают вашему делу, но не слишком активно привязывайтесь к какому-либо курсу, который может раскрыть вас.',
    divertAttentionTitle: 'Умело отвлекайте внимание: ',
    divertAttentionDescription:
      'Если вы чувствуете, что внимание переключается на вас, умело перенаправьте разговор или подозрения в другое русло.',
    imitateMerlinsConcernTitle: 'Подражайте Мерлину: ',
    imitateMerlinsConcernDescription:
      'Притворяйтесь что ведете добрую команды к успеху, в то время как тайно направляете их к провалу.',
    questionOthersTitle: 'Задавайте вопросы другим: ',
    questionOthersDescription:
      'Задавайте стратегические вопросы, заставляющие других раскрывать больше о своих ролях и стратегиях, которые затем можно использовать в своих интересах.',
    fakeTrustworthinessTitle: 'Проявляйте доверие: ',
    fakeTrustworthinessDescription: 'Старайтесь выглядеть надежным, чтобы люди верили вашим словам.',
    thrivingAsMorgana:
      'Находясь в роли {morgana}, важно найти баланс между напористостью и утонченностью. Ваша способность манипулировать нарративом и влиять как на злые, так и на добрые силы значительно влияет на шансы вашей команды на победу. Примите вызов и наслаждайтесь маневрированием в тенистых водах Авалона.',
  },
  'zh-CN': {
    generalInformation: '基本信息：',
    playingAsMorgana:
      '扮演 {morgana} 的角色时，你需要进行欺骗，特别是让自己看起来像 {merlin} ，以迷惑善良的力量。你的目标是通过自己的行动迷惑 {percival}，同时密切注意 {merlin} 如何可能引导善良的力量。伪装成梅林可能会误导 {percival}，从而给邪恶势力带来优势。',
    generalTips: '一般提示：',
    masterArtOfDeceptionTitle: '掌握欺骗的艺术：',
    masterArtOfDeceptionDescription: '利用你的行动和言语模仿 {merlin} 的角色，引导善良玩家远离真相。',
    createConfusionTitle: '在善良玩家中制造混乱：',
    createConfusionDescription: '战略性地传播错误信息可以引发怀疑，并阻碍他们的决策。',
    coordinateEvilPlayersTitle: '秘密配合邪恶玩家：',
    coordinateEvilPlayersDescription: '与邪恶的队友合作，但请谨慎行事，以避免引起怀疑。',
    stayComposedTitle: '保持冷静：',
    stayComposedDescription: '即使怀疑落在你身上，保持冷静和镇定可以帮助打消他人对正确识别你的信任。',
    adaptStrategyTitle: '调整你的策略：',
    adaptStrategyDescription: '准备根据游戏进展做出反应，随时改变战术，以使善良的力量保持猜测。',
    strategicTips: '战略提示：',
    emphasizePlausibleDeniabilityTitle: '强调合理的否认：',
    emphasizePlausibleDeniabilityDescription: '做出有利于你的声明，但不要太过于坚定地投入到任何可能暴露你的路线。',
    divertAttentionTitle: '巧妙地转移注意力：',
    divertAttentionDescription: '如果你感觉注意力转移到你身上，巧妙地把谈话或怀疑转移到其他地方。',
    imitateMerlinsConcernTitle: '模仿梅林的关心：',
    imitateMerlinsConcernDescription: '表面上关心善良团队的成功，同时秘密地引导他们走向失败。',
    questionOthersTitle: '质疑他人：',
    questionOthersDescription: '提出战略性的问题，让他人更多地暴露他们的角色和策略，然后你可以以此为自己的优势。',
    fakeTrustworthinessTitle: '表现出信任感：',
    fakeTrustworthinessDescription: '努力看起来可靠，让他人相信你的话。',
    thrivingAsMorgana:
      '成功扮演 {morgana} 角色需要在果断和微妙之间找到平衡。你操控叙事和影响邪恶与善良玩家的能力会显著影响你团队的胜算。接受挑战，并享受在阿瓦隆的阴影中穿梭的乐趣。',
  },
  'zh-TW': {
    generalInformation: '基本資訊：',
    playingAsMorgana:
      '扮演 {morgana} 的角色時，你需要進行欺騙，特別是讓自己看起來像 {merlin} ，以迷惑善良的力量。你的目標是通過自己的行動迷惑 {percival}，同時密切注意 {merlin} 如何可能引導善良的力量。偽裝成梅林可能會誤導 {percival}，從而給邪惡勢力帶來優勢。',
    generalTips: '一般提示：',
    masterArtOfDeceptionTitle: '掌握欺騙的藝術：',
    masterArtOfDeceptionDescription: '利用你的行動和言語模仿 {merlin} 的角色，引導善良玩家遠離真相。',
    createConfusionTitle: '在善良玩家中製造混亂：',
    createConfusionDescription: '策略性地傳播錯誤資訊可以引發懷疑，並阻礙他們的決策。',
    coordinateEvilPlayersTitle: '秘密配合邪惡玩家：',
    coordinateEvilPlayersDescription: '與邪惡的隊友合作，但請謹慎行事，以避免引起懷疑。',
    stayComposedTitle: '保持冷靜：',
    stayComposedDescription: '即使懷疑落在你身上，保持冷靜和鎮定可以幫助打消他人對正確識別你的信任。',
    adaptStrategyTitle: '調整你的策略：',
    adaptStrategyDescription: '準備根據遊戲進展做出反應，隨時改變戰術，以使善良的力量保持猜測。',
    strategicTips: '戰略提示：',
    emphasizePlausibleDeniabilityTitle: '強調合理的否認：',
    emphasizePlausibleDeniabilityDescription: '做出有利於你的聲明，但不要太過於堅定地投入到任何可能暴露你的路線。',
    divertAttentionTitle: '巧妙地轉移注意力：',
    divertAttentionDescription: '如果你感覺注意力轉移到你身上，巧妙地把談話或懷疑轉移到其他地方。',
    imitateMerlinsConcernTitle: '模仿梅林的關心：',
    imitateMerlinsConcernDescription: '表面上關心善良團隊的成功，同時秘密地引導他們走向失敗。',
    questionOthersTitle: '質疑他人：',
    questionOthersDescription: '提出策略性的问题，讓他人更多地暴露他們的角色和策略，然後你可以以此為自己的優勢。',
    fakeTrustworthinessTitle: '展現值得信賴：',
    fakeTrustworthinessDescription: '努力看起來可靠，讓他人相信你的话。',
    thrivingAsMorgana:
      '成功扮演 {morgana} 角色需要在果斷和微妙之間找到平衡。你操控敘事和影響邪惡與善良玩家的能力會顯著影響你團隊的勝算。接受挑戰，並享受在阿瓦隆的陰影中穿梭的樂趣。',
  },
  es: {
    generalInformation: 'Información General: ',
    playingAsMorgana:
      'Jugar como {morgana} gira en torno al engaño, específicamente haciéndote parecer {merlin} para confundir a las fuerzas del bien. Debes apuntar a desconcertar a {percival} no solo a través de tus acciones, sino también prestando mucha atención a cómo {merlin} podría estar guiando a las fuerzas del bien. Mezclándote como Merlín podrías desviar a {percival}, dando a las fuerzas del mal una ventaja.',
    generalTips: 'Consejos Generales: ',
    masterArtOfDeceptionTitle: 'Domina el arte del engaño: ',
    masterArtOfDeceptionDescription:
      'Usa tus acciones y palabras para imitar el rol de {merlin}, alejando a los jugadores buenos de la verdad.',
    createConfusionTitle: 'Crea confusión entre los jugadores buenos: ',
    createConfusionDescription:
      'La desinformación estratégica puede sembrar dudas y obstaculizar su toma de decisiones.',
    coordinateEvilPlayersTitle: 'Coordínate discretamente con los jugadores del mal: ',
    coordinateEvilPlayersDescription:
      'Trabaja junto con tus compañeros de equipo malvados, pero hazlo con cautela para evitar levantar sospechas.',
    stayComposedTitle: 'Mantente compuesto: ',
    stayComposedDescription:
      'Incluso si la sospecha recae sobre ti, mantener una actitud calmada y tranquila puede ayudar a disuadir a otros de creer que te han identificado correctamente.',
    adaptStrategyTitle: 'Adapta tu estrategia: ',
    adaptStrategyDescription:
      'Sé reactivo a la progresión del juego y está preparado para cambiar tácticas para mantener a las fuerzas del bien adivinando.',
    strategicTips: 'Consejos Estratégicos: ',
    emphasizePlausibleDeniabilityTitle: 'Enfatiza la negación plausible: ',
    emphasizePlausibleDeniabilityDescription:
      'Haz declaraciones que respalden tu caso sin comprometerte demasiado a cualquier curso que pueda exponerte.',
    divertAttentionTitle: 'Desvía la atención con gracia: ',
    divertAttentionDescription:
      'Si sientes que el enfoque se está dirigiendo hacia ti, redirige hábilmente la conversación o la sospecha hacia otro lugar.',
    imitateMerlinsConcernTitle: 'Imita la preocupación de Merlín: ',
    imitateMerlinsConcernDescription:
      'Muestra una aparente preocupación por el éxito del equipo bueno mientras los guías discretamente hacia el fracaso.',
    questionOthersTitle: 'Cuestiona a otros: ',
    questionOthersDescription:
      'Haz preguntas estratégicas que hagan que otros revelen más sobre sus roles y estrategias, lo cual puedes usar a tu favor.',
    fakeTrustworthinessTitle: 'Finge ser digno de confianza: ',
    fakeTrustworthinessDescription:
      'Construir una fachada de confianza puede potenciar tus sugerencias engañosas, haciéndolas más propensas a ser seguidas.',
    thrivingAsMorgana:
      'Prosperar como {morgana} requiere un fino equilibrio entre la asertividad y la sutileza. Tu capacidad para manipular la narrativa e influir tanto en los jugadores del mal como en los buenos afecta significativamente las posibilidades de victoria de tu equipo. Acepta el desafío y disfruta de maniobrar a través de las aguas sombrías de Avalon.',
  },
};
