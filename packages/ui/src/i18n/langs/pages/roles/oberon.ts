import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const oberon: { [key in TLanguage]: Dictionary<string> } = {
  vi: {
    generalInformation: 'Thông tin chung:',
    playingAsOberon:
      'Chơi {oberon} mang đến thử thách riêng: bạn là Tay sai phe Ác nhưng không biết danh tính các Tay sai khác, và họ cũng không biết bạn. Bạn phải phá kế hoạch phe Thiện trong khi chơi với thông tin hạn chế.',
    archetypes: 'Các biến thể:',
    archetypesDescription: '{oberon} có những biến thể cùng cơ chế cốt lõi là không bị người chơi khác nhận biết:',
    wraithArchetype: 'Bóng ma:',
    wraithDescription:
      '{wraith} là biến thể của {oberon}, còn bị ẩn khỏi {merlin}, nên hoàn toàn không bị cả hai phe nhận biết.',
    generalTips: 'Mẹo chung:',
    playingСonclusion:
      'Chơi {oberon} đòi hỏi sự xảo quyệt, thích nghi và khả năng đánh lừa. Tính khó đoán là tài sản có thể xoay chuyển ván chơi nếu dùng khôn ngoan. Hãy gây nhiễu, đánh lừa và mưu tính để phe Ác chiến thắng!',
    embraceMystery: 'Tận dụng sự bí ẩn:',
    useUnknownStatus: 'Dùng việc không ai biết bạn để tạo bối rối cho mọi người, cả phe Thiện lẫn Ác.',
    observeClosely: 'Quan sát kỹ:',
    payAttention: 'Chú ý hành vi và quyết định của người khác để thử suy ra danh tính các Tay sai đồng minh.',
    actIndependently: 'Hành động độc lập:',
    withoutCoordination:
      'Không được phối hợp trực tiếp từ các Tay sai khác, hãy thực hiện những nước đi bạn cho rằng có lợi cho phe Ác.',
    misleadSubtly: 'Khéo léo đánh lạc hướng:',
    makeStatements: 'Đưa ra lời nói và hành động gieo nghi ngờ trong phe Thiện mà không tiết lộ phe thật của mình.',
    takeRisks: 'Chấp nhận rủi ro:',
    needToMakeBoldMoves:
      'Bạn có thể cần nước đi táo bạo để giành lòng tin của một trong hai phe và phá kế hoạch phe Thiện.',
    strategicTips: 'Mẹo chiến thuật:',
    createUncertainty: 'Tạo sự thiếu chắc chắn:',
    aimToDestabilize: 'Luôn tìm cách làm lung lay lòng tin mà những người phe Thiện dành cho nhau.',
    beUnpredictable: 'Giữ mình khó đoán: ',
    varyGameplay: 'Thay đổi cách chơi để tránh khuôn mẫu có thể tiết lộ vai {oberon}.',
    listenForClues: 'Lắng nghe manh mối:',
    useToAdvantage: 'Đồng đội phe Ác có thể vô tình làm lộ mình; hãy tận dụng điều đó để phối hợp gián tiếp.',
    avoidDrawingAttention: 'Tránh thu hút sự chú ý:',
    focusOnKeyPlays:
      'Lối chơi quá năng nổ có thể gây nghi ngờ. Hãy tập trung vào các nước đi then chốt có thể xoay chuyển kết quả ván.',
    seoTeam: 'Ác. Bạn có cùng điều kiện chiến thắng với phe Ác dù không biết đồng đội là ai.',
    seoAbility:
      'Trong thiết lập cổ điển, {oberon} không thấy người phe Ác khác và họ cũng không thấy anh ta. {merlin} vẫn thấy Oberon là Ác.',
    seoLimit:
      'Oberon không phải {mordred}: Merlin nhìn thấy anh ta. Biến thể {wraith} riêng trên nền tảng còn ẩn khỏi Merlin; đó không phải khả năng Oberon tiêu chuẩn.',
    seoScenario1:
      'Nếu có thể có người phe Ác khác trong Nhiệm vụ, bạn không thể dựa vào thông tin chung lúc đầu để phối hợp. Cân nhắc rằng hai lá Thất bại có thể tiết lộ có hơn một người phe Ác tham gia.',
    seoScenario2:
      'Nếu chọn Thành công để tạo lòng tin, hãy nhớ bạn vẫn thuộc phe Ác. Dùng phiếu bầu và kết quả Nhiệm vụ về sau để suy ra đồng minh có thể có; các suy luận đó không phải thông tin vai đã được xác nhận.',
  },
  en: {
    generalInformation: 'General Information:',
    playingAsOberon:
      'Playing as {oberon} presents unique challenges as you are a Minion of Evil, but you do not know the identities of your fellow minions, and they do not know you. You are tasked with disrupting the forces of good while navigating the game with limited information.',
    archetypes: 'Archetypes:',
    archetypesDescription: '{oberon} has variants that share its core mechanic of being unknown to other players:',
    wraithArchetype: 'Wraith:',
    wraithDescription:
      'The {wraith} is an archetype of {oberon} that is also unknown to {merlin}, making it completely hidden from both sides.',
    generalTips: 'General Tips:',
    playingСonclusion:
      'Playing as {oberon} requires cunning, adaptability, and a flair for deception. Your unpredictability is an asset that, if used wisely, can turn the tides of the game. Confuse, deceive, and scheme your way to victory for evil!',
    embraceMystery: 'Embrace your mystery:',
    useUnknownStatus: 'Use your unknown status to create confusion among all players, both good and evil.',
    observeClosely: 'Observe closely:',
    payAttention:
      'Pay attention to the behavior and decisions of other players to try and deduce the identities of your fellow minions.',
    actIndependently: 'Act independently:',
    withoutCoordination:
      'Without direct coordination from other minions, make moves that you believe will benefit the evil side.',
    misleadSubtly: 'Mislead subtly:',
    makeStatements:
      'Make statements and take actions that sow doubt among the good players, without revealing your true allegiance.',
    takeRisks: 'Take risks:',
    needToMakeBoldMoves:
      'You may need to make bold moves to gain the trust of either side and disrupt the plans of the good players.',
    strategicTips: 'Strategic Tips:',
    createUncertainty: 'Create uncertainty:',
    aimToDestabilize: 'Always aim to destabilize the confidence that good players have in one another.',
    beUnpredictable: 'Be unpredictable: ',
    varyGameplay: 'Vary your gameplay to avoid any patterns that could reveal your role as {oberon}.',
    listenForClues: 'Listen for clues:',
    useToAdvantage:
      'Your fellow evil players may inadvertently reveal themselves; use this to your advantage to collaborate indirectly.',
    avoidDrawingAttention: 'Avoid drawing attention:',
    focusOnKeyPlays:
      "A too-active playstyle may draw suspicion. Instead, focus on making key plays that can tilt the game's outcome.",
    seoTeam: 'Evil. You share evil’s victory conditions even though you do not know your teammates.',
    seoAbility:
      'In the classic setup, {oberon} does not see the other evil players, and they do not see him. {merlin} still sees Oberon as evil.',
    seoLimit:
      'Oberon is not {mordred}: he is visible to Merlin. The separate {wraith} variant on this platform also hides from Merlin; that is not a standard Oberon ability.',
    seoScenario1:
      'If another evil player may be on your mission, you cannot rely on shared starting information to coordinate. Consider that two Fail cards can reveal that more than one evil player joined.',
    seoScenario2:
      'If you choose Success to earn trust, remember that you still belong to evil. Use later votes and mission results to infer possible allies; those inferences are not confirmed role information.',
  },
  ru: {
    generalInformation: 'Общая информация:',
    playingAsOberon:
      'Игра за {oberon} представляет уникальные вызовы, так как вы являетесь Миньоном Зла, но не знаете личностей своих соратников, и они не знают вас. Ваша задача — мешать силам добра, ориентируясь в игре с ограниченной информацией.',
    archetypes: 'Архетипы:',
    archetypesDescription:
      'У {oberon} есть варианты, которые разделяют его основной механизм быть неизвестным другим игрокам:',
    wraithArchetype: 'Призрак:',
    wraithDescription:
      '{wraith} является архетипом {oberon}, который также неизвестен {merlin}, что делает его полностью скрытым от обеих сторон.',
    generalTips: 'Общие советы:',
    playingСonclusion:
      'Игра за {oberon} требует хитрости, адаптивности и склонности к обману. Ваша непредсказуемость — это актив, который, если использовать разумно, может изменить ход игры. Запутайте, обманите и интригуйте, чтобы привести зло к победе!',
    embraceMystery: 'Примите свою загадочность:',
    useUnknownStatus:
      'Используйте свой неизвестный статус, чтобы создать путаницу среди всех игроков, как хороших, так и злых.',
    observeClosely: 'Внимательно наблюдайте:',
    payAttention:
      'Обращайте внимание на поведение и решения других игроков, чтобы попытаться выявить личности ваших соратников.',
    actIndependently: 'Действуйте независимо:',
    withoutCoordination:
      'Без прямой координации с другими миньонами предпринимать действия, которые, как вы считаете, принесут пользу злой стороне.',
    misleadSubtly: 'Тонко вводите в заблуждение:',
    makeStatements:
      'Делайте заявления и совершайте действия, которые сеют сомнения среди хороших игроков, не раскрывая свою истинную принадлежность.',
    takeRisks: 'Рискуйте:',
    needToMakeBoldMoves:
      'Возможно, вам придется делать смелые шаги, чтобы заслужить доверие любой из сторон и нарушить планы хороших игроков.',
    strategicTips: 'Стратегические советы:',
    createUncertainty: 'Создайте неуверенность:',
    aimToDestabilize: 'Всегда стремитесь дестабилизировать уверенность, которую хорошие игроки имеют друг в друге.',
    beUnpredictable: 'Будьте непредсказуемы: ',
    varyGameplay:
      'Разнообразьте свою игру, чтобы избежать любых шаблонов, которые могут раскрыть вашу роль как {oberon}.',
    listenForClues: 'Слушайте подсказки:',
    useToAdvantage:
      'Ваши соратники могут случайно раскрыть себя; используйте это в свою пользу, чтобы косвенно координироваться.',
    avoidDrawingAttention: 'Избегайте привлечения внимания:',
    focusOnKeyPlays:
      'Слишком активный стиль игры может вызвать подозрения. Вместо этого сосредоточьтесь на ключевых действиях, которые могут изменить исход игры.',
    seoTeam: 'Зло. Вы побеждаете вместе со злом, хотя не знаете своих союзников.',
    seoAbility:
      'В классическом составе {oberon} не видит других злых игроков, и они не видят его. При этом {merlin} видит Оберона как злого.',
    seoLimit:
      'Оберон — не {mordred}: Мерлин его видит. Отдельный вариант {wraith} на платформе скрыт и от Мерлина; это не обычная способность Оберона.',
    seoScenario1:
      'Если на миссии может быть другой злой игрок, вы не можете координироваться через общее стартовое знание. Учтите: две карты провала могут выдать присутствие нескольких злых участников.',
    seoScenario2:
      'Выбирая успех ради доверия, помните, что вы всё ещё на стороне зла. Ищите возможных союзников по голосованиям и результатам миссий, но не путайте догадки с подтверждёнными ролями.',
  },
  'zh-CN': {
    generalInformation: '一般信息：',
    playingAsOberon:
      '作为 {oberon} 进行游戏会带来独特的挑战，因为你是邪恶的爪牙，但你不知道其他爪牙的身份，他们也不知道你。你的任务是以有限的信息破坏善良势力。',
    archetypes: '原型：',
    archetypesDescription: '{oberon}有一些变体，它们共享其对其他玩家未知的核心机制：',
    wraithArchetype: '幽灵：',
    wraithDescription: '{wraith} 是{oberon}的一个原型，它对{merlin}也是未知的，使其完全对双方隐藏。',
    generalTips: '一般技巧:',
    playingСonclusion:
      '作为 {oberon} 进行游戏需要狡猾、适应性和骗局的技巧。你的不可预测性是一种资产，如果用得当，可以改变游戏的潮流。迷惑、欺骗和策划以为邪恶争取胜利！',
    embraceMystery: '接受你的神秘:',
    useUnknownStatus: '利用你的未知状态在所有玩家中造成混乱，无论是善良还是邪恶。',
    observeClosely: '仔细观察:',
    payAttention: '注意其他玩家的行为和决策，尝试推测你同伴的身份。',
    actIndependently: '独立行动:',
    withoutCoordination: '在没有其他爪牙直接配合的情况下，采取你认为会有利于邪恶方的行动。',
    misleadSubtly: '巧妙地误导:',
    makeStatements: '发表言论并采取行动，在善良玩家中产生怀疑，而不透露你的真实立场。',
    takeRisks: '承担风险:',
    needToMakeBoldMoves: '你可能需要采取大胆的行动来获得任一方的信任并破坏善良玩家的计划。',
    strategicTips: '战略技巧:',
    createUncertainty: '制造不确定性:',
    aimToDestabilize: '总是旨在破坏善良玩家之间的信任感。',
    beUnpredictable: '保持不可预测: ',
    varyGameplay: '改变你的游戏方式，以避免任何可能暴露你是 {oberon} 的模式。',
    listenForClues: '倾听线索:',
    useToAdvantage: '你的邪恶同伴可能会不小心暴露自己；利用这一点间接合作。',
    avoidDrawingAttention: '避免引起注意:',
    focusOnKeyPlays: '过于活跃的游戏风格可能会引起怀疑。相反，专注于改变游戏结果的关键游戏。',
    seoTeam: '坏人。即使不知道队友是谁，你仍与邪恶阵营共享胜利。',
    seoAbility: '经典配置中，{oberon}看不到其他坏人，其他坏人也看不到他。但{merlin}仍能看到奥伯伦是坏人。',
    seoLimit: '奥伯伦不是{mordred}：梅林能看到他。本站的独立变体{wraith}还会对梅林隐藏；这不是普通奥伯伦的能力。',
    seoScenario1: '任务中可能有另一名坏人时，你们没有共同的开局信息可供协调。两张失败牌可能暴露队伍中有多名坏人。',
    seoScenario2:
      '为了信任而出成功时，记住自己仍属于邪恶阵营。根据后续投票和任务结果推测队友，但不要把推测当成已确认的身份。',
  },
  'zh-TW': {
    generalInformation: '一般信息：',
    playingAsOberon:
      '作為 {oberon} 進行遊戲會帶來獨特的挑戰，因為你是邪惡的爪牙，但你不知道其他爪牙的身份，他們也不知道你。你的任務是以有限的信息破壞善良勢力。',
    archetypes: '原型：',
    archetypesDescription: '{oberon}有一些變體，它們共享其對其他玩家未知的核心機制：',
    wraithArchetype: '幽靈：',
    wraithDescription: '{wraith} 是{oberon}的一個原型，它對{merlin}也是未知的，使其完全對雙方隱藏。',
    generalTips: '一般技巧:',
    playingСonclusion:
      '作為 {oberon} 進行遊戲需要狡猾、適應性和騙局的技巧。你的不可預測性是一種資產，如果用得當，可以改變遊戲的潮流。迷惑、欺騙和策劃以為邪惡爭取勝利！',
    embraceMystery: '接受你的神秘:',
    useUnknownStatus: '利用你的未知狀態在所有玩家中造成混亂，無論是善良還是邪惡。',
    observeClosely: '仔細觀察:',
    payAttention: '注意其他玩家的行為和決策，嘗試推測你同伴的身份。',
    actIndependently: '獨立行動:',
    withoutCoordination: '在沒有其他爪牙直接配合的情況下，採取你認為會有利於邪惡方的行動。',
    misleadSubtly: '巧妙地誤導:',
    makeStatements: '發表言論並採取行動，在善良玩家中產生懷疑，而不透露你的真實立場。',
    takeRisks: '承擔風險:',
    needToMakeBoldMoves: '你可能需要採取大膽的行動來獲得任一方的信任並破壞善良玩家的計劃。',
    strategicTips: '戰略技巧:',
    createUncertainty: '製造不確定性:',
    aimToDestabilize: '總是旨在破壞善良玩家之間的信任感。',
    beUnpredictable: '保持不可預測: ',
    varyGameplay: '改變你的遊戲方式，以避免任何可能暴露你是 {oberon} 的模式。',
    listenForClues: '聆聽線索:',
    useToAdvantage: '你的邪惡同伴可能會不小心暴露自己；利用這一點間接合作。',
    avoidDrawingAttention: '避免引起注意:',
    focusOnKeyPlays: '過於活躍的遊戲風格可能會引起懷疑。相反，專注於改變遊戲結果的關鍵進行。',
    seoTeam: '壞人。即使不知道隊友是誰，你仍與邪惡陣營共享勝利。',
    seoAbility: '經典配置中，{oberon}看不到其他壞人，其他壞人也看不到他。但{merlin}仍能看到奧伯倫是壞人。',
    seoLimit: '奧伯倫不是{mordred}：梅林能看到他。本站的獨立變體{wraith}還會對梅林隱藏；這不是普通奧伯倫的能力。',
    seoScenario1: '任務中可能有另一名壞人時，你們沒有共同的開局資訊可供協調。兩張失敗牌可能暴露隊伍中有多名壞人。',
    seoScenario2:
      '為了信任而出成功時，記住自己仍屬於邪惡陣營。根據後續投票和任務結果推測隊友，但不要把推測當成已確認的身分。',
  },
  es: {
    generalInformation: 'Información general:',
    playingAsOberon:
      'Jugar como {oberon} presenta desafíos únicos ya que eres un esbirro del mal, pero no conoces las identidades de tus compañeros esbirros, y ellos no te conocen a ti. Tu tarea es interrumpir las fuerzas del bien mientras navegas por el juego con información limitada.',
    archetypes: 'Arquetipos:',
    archetypesDescription:
      '{oberon} tiene variantes que comparten su mecánica principal de ser desconocido para otros jugadores:',
    wraithArchetype: 'Espectro:',
    wraithDescription:
      'El {wraith} es un arquetipo de {oberon} que también es desconocido para {merlin}, lo que lo hace completamente oculto para ambos bandos.',
    generalTips: 'Consejos generales:',
    playingСonclusion:
      'Jugar como {oberon} requiere astucia, adaptabilidad y un toque para el engaño. Tu imprevisibilidad es un activo que, si se usa sabiamente, puede cambiar el curso del juego. Confunde, engaña y trama tu camino hacia la victoria para el mal!',
    embraceMystery: 'Abraza tu misterio:',
    useUnknownStatus:
      'Usa tu estado desconocido para crear confusión entre todos los jugadores, tanto buenos como malos.',
    observeClosely: 'Observa de cerca:',
    payAttention:
      'Presta atención al comportamiento y las decisiones de otros jugadores para intentar deducir las identidades de tus compañeros esbirros.',
    actIndependently: 'Actúa de manera independiente:',
    withoutCoordination:
      'Sin coordinación directa de otros esbirros, haz movimientos que creas que beneficiarán al lado del mal.',
    misleadSubtly: 'Engaña sutilmente:',
    makeStatements:
      'Haz declaraciones y toma acciones que siembren dudas entre los jugadores buenos, sin revelar tu verdadera lealtad.',
    takeRisks: 'Toma riesgos:',
    needToMakeBoldMoves:
      'Es posible que necesites hacer movimientos audaces para ganar la confianza de cualquiera de los lados y perturbar los planes de los jugadores buenos.',
    strategicTips: 'Consejos estratégicos:',
    createUncertainty: 'Crea incertidumbre:',
    aimToDestabilize: 'Siempre apunta a desestabilizar la confianza que los jugadores buenos tienen entre sí.',
    beUnpredictable: 'Sé impredecible: ',
    varyGameplay: 'Varía tu estilo de juego para evitar cualquier patrón que pueda revelar tu papel como {oberon}.',
    listenForClues: 'Escucha pistas:',
    useToAdvantage:
      'Tus compañeros jugadores malos pueden, sin querer, revelarse a sí mismos; utiliza esto a tu ventaja para colaborar indirectamente.',
    avoidDrawingAttention: 'Evita llamar la atención:',
    focusOnKeyPlays:
      'Un estilo de juego demasiado activo puede levantar sospechas. En su lugar, concéntrate en realizar jugadas clave que puedan cambiar el resultado del juego.',
    seoTeam: 'Mal. Compartes la victoria del mal aunque no conozcas a tus compañeros.',
    seoAbility:
      'En la configuración clásica, {oberon} no ve a los demás malvados y ellos no lo ven a él. {merlin} sí ve a Oberon como malvado.',
    seoLimit:
      'Oberon no es {mordred}: Merlín puede verlo. La variante {wraith} de esta plataforma también se oculta de Merlín; esa no es una habilidad del Oberon normal.',
    seoScenario1:
      'Si puede haber otro malvado en tu misión, no puedes contar con información inicial compartida para coordinarte. Dos cartas de Fracaso pueden revelar la presencia de varios malvados.',
    seoScenario2:
      'Si eliges Éxito para ganar confianza, recuerda que sigues siendo del mal. Deduce posibles aliados a partir de votos y resultados, sin confundir esas hipótesis con roles confirmados.',
  },
  pt: {
    generalInformation: 'Informações Gerais:',
    playingAsOberon:
      'Jogar como {oberon} apresenta desafios únicos, pois você é um Lacaio do Mal, mas não conhece as identidades de seus companheiros lacaios, e eles não conhecem você. Sua tarefa é perturbar as forças do bem enquanto navega pelo jogo com informações limitadas.',
    archetypes: 'Arquétipos:',
    archetypesDescription:
      '{oberon} tem variantes que compartilham seu mecanismo principal de ser desconhecido para outros jogadores:',
    wraithArchetype: 'Espectro:',
    wraithDescription:
      'O {wraith} é um arquétipo de {oberon} que também é desconhecido para {merlin}, tornando-o completamente oculto para ambos os lados.',
    generalTips: 'Dicas Gerais:',
    playingСonclusion:
      'Jogar como {oberon} requer astúcia, adaptabilidade e um talento para o engano. Sua imprevisibilidade é um trunfo que, se usado com sabedoria, pode mudar o rumo do jogo. Confunda, engane e planeje seu caminho para a vitória do mal!',
    embraceMystery: 'Abrace seu mistério:',
    useUnknownStatus:
      'Use seu status desconhecido para criar confusão entre todos os jogadores, tanto bons quanto maus.',
    observeClosely: 'Observe atentamente:',
    payAttention:
      'Preste atenção ao comportamento e às decisões de outros jogadores para tentar deduzir as identidades de seus companheiros lacaios.',
    actIndependently: 'Aja independentemente:',
    withoutCoordination:
      'Sem coordenação direta de outros lacaios, faça movimentos que você acredita que beneficiarão o lado do mal.',
    misleadSubtly: 'Engane sutilmente:',
    makeStatements:
      'Faça declarações e tome ações que semeiem dúvidas entre os jogadores do bem, sem revelar sua verdadeira lealdade.',
    takeRisks: 'Assuma riscos:',
    needToMakeBoldMoves:
      'Você pode precisar fazer movimentos ousados para ganhar a confiança de qualquer lado e perturbar os planos dos jogadores do bem.',
    strategicTips: 'Dicas Estratégicas:',
    createUncertainty: 'Crie incerteza:',
    aimToDestabilize: 'Sempre busque desestabilizar a confiança que os jogadores do bem têm uns nos outros.',
    beUnpredictable: 'Seja imprevisível: ',
    varyGameplay: 'Varie sua jogabilidade para evitar qualquer padrão que possa revelar seu papel como {oberon}.',
    listenForClues: 'Ouça pistas:',
    useToAdvantage:
      'Seus companheiros jogadores do mal podem inadvertidamente revelar-se; use isso a seu favor para colaborar indiretamente.',
    avoidDrawingAttention: 'Evite chamar atenção:',
    focusOnKeyPlays:
      'Um estilo de jogo muito ativo pode levantar suspeitas. Em vez disso, concentre-se em fazer jogadas-chave que possam influenciar o resultado do jogo.',
    seoTeam: 'Mal. Você compartilha a vitória do mal mesmo sem conhecer seus companheiros.',
    seoAbility:
      'Na configuração clássica, {oberon} não vê os outros jogadores do mal, e eles não o veem. {merlin} ainda vê Oberon como mau.',
    seoLimit:
      'Oberon não é {mordred}: Merlin consegue vê-lo. A variante {wraith} desta plataforma também se esconde de Merlin; isso não é uma habilidade do Oberon comum.',
    seoScenario1:
      'Se houver outro jogador do mal na missão, você não pode contar com informações iniciais compartilhadas para coordenar ações. Duas Falhas podem revelar a presença de vários jogadores do mal.',
    seoScenario2:
      'Se escolher Sucesso para ganhar confiança, lembre-se de que continua do mal. Use votos e resultados para deduzir possíveis aliados, sem tratar hipóteses como papéis confirmados.',
  },
};
