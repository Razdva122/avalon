export const trapperGuide = {
  ru: {
    heading: 'Ловец в Авалоне: правила дополнения',
    intro:
      'Ловец добавляет в каждый поход лишнего участника и даёт лидеру право исключить одну сыгранную карту. Это дополнение, а не отдельная роль: решение принимает текущий лидер похода. Здесь описаны правила нашей онлайн-версии Авалона.',
    order: 'Порядок действий',
    step1:
      'Соберите команду на одного участника больше обычного. Например, вместо трёх игроков в поход отправятся четверо. Голосование за состав проходит как обычно.',
    step2: 'Все участники похода сдают карты успеха или провала по обычным правилам своих ролей.',
    step3: 'Если включён {excalibur}, сначала его владелец применяет меч или пропускает действие.',
    step4:
      'Лидер выбирает одного участника похода и нажимает «Исключить карту». До подтверждения Ловец не раскрывает значение карты. После подтверждения выбор окончательный, а лидер тайно видит её текущее значение.',
    step5:
      'Исключённая карта не участвует в подсчёте. Затем действует {witch}, если она есть в игре, и определяется итог похода. Обычное число провалов для поражения сохраняется.',
    limits: 'Доступность и выбор карты',
    limitText:
      'Дополнение доступно для 8–10 игроков. Ловца и {plotCards} одновременно включить нельзя. Исключить нужно ровно одну карту участника текущего похода: можно выбрать свою карту, карту владельца меча или карту, которую изменил {excalibur}. Игрок остаётся участником похода; исключается только его карта.',
    swordTitle: 'Как сочетается с Экскалибуром',
    swordText:
      'Ловец действует после меча. Если {excalibur} превратил успех в провал, лидер увидит провал; при исключении этой карты он не попадёт в итог. Исключение карты владельца меча не отменяет уже выполненную смену другой карты.',
    visibilityTitle: 'Кто что видит',
    visibilityText:
      'Все видят, чью карту исключили. Во время партии её значение доступно только лидеру этого похода в отдельном окне и истории. После завершения игры оно раскрывается в истории. В таблице голосов остаются ✓ за участие и ⊘ за исключённую карту; её значение в таблице не показывается даже после игры.',
    timer: 'Если время выбора истекло, игра случайно исключает одну допустимую карту.',
    examples: 'Примеры подсчёта',
    example1:
      'Поход требует одного провала. Четверо игроков сдали три успеха и один провал. Лидер исключил провал: остаются три успеха, и поход успешен.',
    example2: 'В том же составе лидер исключил успех: среди оставшихся карт есть провал, поэтому поход провален.',
    example3:
      'Четвёртый поход требует двух провалов. Если из двух провалов исключить один, останется только один провал: без других эффектов поход успешен. Ловец не меняет порог в два провала.',
  },
  en: {
    heading: 'Trapper in Avalon: expansion rules',
    intro:
      'Trapper sends one extra participant on every mission and lets the leader exclude one played card. It is an expansion, not a separate role: the current mission leader makes the decision. These are the rules of our online version of Avalon.',
    order: 'Order of play',
    step1:
      'Choose one more team member than usual. For example, a three-player mission sends four players. Vote on the team as usual.',
    step2: 'Every mission participant plays Success or Fail according to their role’s normal rules.',
    step3: 'If {excalibur} is enabled, its holder first uses the sword or skips it.',
    step4:
      'The leader selects a mission participant and confirms “Exclude card”. Trapper does not reveal the card before confirmation. The choice is final; the leader then privately sees its current value.',
    step5:
      'Do not count the excluded card. Resolve the {witch}, if present, then determine the mission result. The normal number of failures required stays the same.',
    limits: 'Availability and eligible cards',
    limitText:
      'Available for 8–10 players and incompatible with {plotCards}. Exclude exactly one card from the current mission. The leader may choose their own card, the sword holder’s card or a card changed by {excalibur}. The player remains a mission participant; only their card is excluded.',
    swordTitle: 'Interaction with Excalibur',
    swordText:
      'Trapper resolves after the sword. If {excalibur} changed Success to Fail, the leader sees Fail; excluding that card removes it from the result. Excluding the sword holder’s card does not undo a flip they already made to another card.',
    visibilityTitle: 'Who sees what',
    visibilityText:
      'Everyone sees whose card was excluded. During play, only that mission’s leader sees its value in a private dialog and history. After the game, history reveals it to everyone. The vote table keeps ✓ for participation and ⊘ for exclusion; it never shows the card’s value, even after the game.',
    timer: 'If the selection timer runs out, the game randomly excludes one eligible card.',
    examples: 'Counting examples',
    example1:
      'A mission needs one Fail to fail. Four players play three Success cards and one Fail. The leader excludes Fail: three Success cards remain, so the mission succeeds.',
    example2: 'With the same cards, excluding Success leaves a Fail, so the mission fails.',
    example3:
      'The fourth mission needs two Fails. Excluding one of two Fails leaves just one: without other effects, the mission succeeds. Trapper does not change the two-Fail threshold.',
  },
  es: {
    heading: 'Trampero en Avalon: reglas de la expansión',
    intro:
      'El Trampero añade un participante a cada misión y permite al líder excluir una carta jugada. Es una expansión, no un rol: decide el líder de esa misión. Estas son las reglas de nuestra versión online de Avalon.',
    order: 'Orden de juego',
    step1:
      'Elige un miembro más de lo habitual: una misión de tres jugadores lleva cuatro. Se vota el equipo como siempre.',
    step2: 'Todos los participantes juegan Éxito o Fracaso según las reglas habituales de sus roles.',
    step3: 'Si {excalibur} está activo, su portador primero usa la espada o pasa.',
    step4:
      'El líder elige a un participante y confirma «Excluir carta». El Trampero no revela la carta antes de confirmar. La elección es definitiva; después el líder ve en secreto su valor actual.',
    step5:
      'La carta excluida no se cuenta. Se resuelve la {witch}, si está presente, y después el resultado de la misión. El número habitual de Fracasos necesario no cambia.',
    limits: 'Disponibilidad y cartas válidas',
    limitText:
      'Disponible para 8–10 jugadores e incompatible con las {plotCards}. Se excluye exactamente una carta de la misión actual. Se puede elegir la propia, la del portador de {excalibur} o una modificada por la espada. El jugador sigue participando; solo se excluye su carta.',
    swordTitle: 'Interacción con Excalibur',
    swordText:
      'El Trampero actúa después de la espada. Si {excalibur} cambió Éxito a Fracaso, el líder ve Fracaso; al excluir esa carta, no cuenta. Excluir la carta del portador no deshace un cambio que ya hizo a otra carta.',
    visibilityTitle: 'Quién ve cada dato',
    visibilityText:
      'Todos ven de quién se excluyó la carta. Durante la partida, solo el líder de esa misión ve su valor en una ventana privada y en el historial. Al terminar se revela en el historial. La tabla conserva ✓ por participar y ⊘ por exclusión; nunca muestra el valor, tampoco al terminar.',
    timer: 'Si se agota el tiempo, el juego excluye al azar una carta válida.',
    examples: 'Ejemplos de recuento',
    example1:
      'Basta un Fracaso para perder la misión. Cuatro jugadores juegan tres Éxitos y un Fracaso. El líder excluye el Fracaso: quedan tres Éxitos y la misión tiene éxito.',
    example2: 'Con esas mismas cartas, excluir un Éxito deja un Fracaso y la misión fracasa.',
    example3:
      'La cuarta misión requiere dos Fracasos. Excluir uno de los dos deja solo uno: sin otros efectos, la misión tiene éxito. El umbral sigue siendo dos.',
  },
  pt: {
    heading: 'Armadilheiro em Avalon: regras da expansão',
    intro:
      'O Armadilheiro acrescenta um participante a cada missão e permite ao líder excluir uma carta jogada. É uma expansão, não um papel: quem decide é o líder da missão. Estas são as regras da nossa versão online de Avalon.',
    order: 'Ordem das ações',
    step1:
      'Escolha um membro a mais que o normal: uma missão de três jogadores leva quatro. A votação da equipe ocorre normalmente.',
    step2: 'Todos os participantes jogam Sucesso ou Fracasso conforme as regras normais dos seus papéis.',
    step3: 'Com {excalibur} ativada, o portador primeiro usa a espada ou passa.',
    step4:
      'O líder escolhe um participante e confirma «Excluir carta». O Armadilheiro não revela a carta antes da confirmação. A escolha é definitiva; só então o líder vê seu valor atual em segredo.',
    step5:
      'Não conte a carta excluída. Resolva a {witch}, se houver, e então determine o resultado da missão. O número normal de Fracassos necessário permanece igual.',
    limits: 'Disponibilidade e cartas válidas',
    limitText:
      'Disponível para 8–10 jogadores e incompatível com {plotCards}. Exclua exatamente uma carta da missão atual. Pode ser a própria carta, a do portador de {excalibur} ou uma alterada pela espada. O jogador continua na missão; só a carta é excluída.',
    swordTitle: 'Interação com Excalibur',
    swordText:
      'O Armadilheiro age depois da espada. Se {excalibur} mudou Sucesso para Fracasso, o líder vê Fracasso; excluir essa carta a remove da contagem. Excluir a carta do portador não desfaz uma troca já feita em outra carta.',
    visibilityTitle: 'Quem vê o quê',
    visibilityText:
      'Todos veem de quem foi a carta excluída. Durante a partida, só o líder daquela missão vê seu valor na janela privada e no histórico. Ao terminar, o histórico o revela a todos. A tabela mantém ✓ pela participação e ⊘ pela exclusão; nunca mostra o valor, nem após a partida.',
    timer: 'Se o tempo acabar, o jogo exclui aleatoriamente uma carta válida.',
    examples: 'Exemplos de contagem',
    example1:
      'Uma missão falha com um Fracasso. Quatro jogadores jogam três Sucessos e um Fracasso. O líder exclui o Fracasso: restam três Sucessos, e a missão tem sucesso.',
    example2: 'Com as mesmas cartas, excluir um Sucesso deixa um Fracasso, e a missão falha.',
    example3:
      'A quarta missão exige dois Fracassos. Excluir um dos dois deixa apenas um: sem outros efeitos, a missão tem sucesso. O limite continua sendo dois.',
  },
  vi: {
    heading: 'Người đặt bẫy trong Avalon: luật bản mở rộng',
    intro:
      'Người đặt bẫy thêm một thành viên vào mỗi nhiệm vụ và cho đội trưởng loại một lá bài đã đánh. Đây là bản mở rộng, không phải vai trò riêng: đội trưởng nhiệm vụ hiện tại quyết định. Đây là luật phiên bản Avalon trực tuyến của chúng tôi.',
    order: 'Thứ tự hành động',
    step1:
      'Chọn nhiều hơn bình thường một thành viên: nhiệm vụ ba người sẽ có bốn người. Biểu quyết đội như thường lệ.',
    step2: 'Mọi thành viên nhiệm vụ đánh Thành công hoặc Thất bại theo luật vai trò của mình.',
    step3: 'Nếu bật {excalibur}, người giữ kiếm dùng kiếm hoặc bỏ qua trước.',
    step4:
      'Đội trưởng chọn một thành viên nhiệm vụ rồi xác nhận «Loại lá bài». Người đặt bẫy không tiết lộ bài trước khi xác nhận. Lựa chọn là cuối cùng; sau đó đội trưởng mới bí mật xem giá trị hiện tại.',
    step5:
      'Không tính lá bài bị loại. Xử lý {witch} nếu có, rồi xác định kết quả nhiệm vụ. Số bài Thất bại cần thiết vẫn như thường lệ.',
    limits: 'Điều kiện và bài được chọn',
    limitText:
      'Dành cho 8–10 người chơi, không dùng cùng {plotCards}. Phải loại đúng một lá bài của nhiệm vụ hiện tại. Có thể chọn bài của mình, người giữ kiếm hoặc bài đã bị {excalibur} đổi. Người chơi vẫn tham gia nhiệm vụ; chỉ lá bài bị loại.',
    swordTitle: 'Kết hợp với Excalibur',
    swordText:
      'Người đặt bẫy hành động sau kiếm. Nếu {excalibur} đổi Thành công thành Thất bại, đội trưởng thấy Thất bại; loại bài đó sẽ bỏ nó khỏi kết quả. Loại bài người giữ kiếm không hủy lần đổi đã thực hiện trên bài khác.',
    visibilityTitle: 'Ai thấy thông tin nào',
    visibilityText:
      'Mọi người biết bài của ai bị loại. Trong ván, chỉ đội trưởng nhiệm vụ đó thấy giá trị ở cửa sổ riêng và lịch sử. Khi kết thúc, lịch sử tiết lộ cho mọi người. Bảng biểu quyết giữ ✓ cho tham gia và ⊘ cho bài bị loại; không bao giờ hiện giá trị bài, kể cả sau ván.',
    timer: 'Nếu hết giờ chọn, trò chơi ngẫu nhiên loại một lá bài hợp lệ.',
    examples: 'Ví dụ tính kết quả',
    example1:
      'Nhiệm vụ thất bại với một bài Thất bại. Bốn người đánh ba Thành công và một Thất bại. Đội trưởng loại Thất bại: còn ba Thành công, nhiệm vụ thành công.',
    example2: 'Với cùng các lá bài, loại một Thành công sẽ để lại Thất bại, nên nhiệm vụ thất bại.',
    example3:
      'Nhiệm vụ thứ tư cần hai bài Thất bại. Loại một trong hai chỉ còn một: nếu không có hiệu ứng khác, nhiệm vụ thành công. Ngưỡng vẫn là hai.',
  },
  'zh-CN': {
    heading: '阿瓦隆捕手：扩展规则',
    intro:
      '捕手让每次任务多派一人，并允许队长排除一张已打出的任务牌。这是扩展而非独立角色，由当前任务队长做决定。本页介绍本站在线版阿瓦隆的规则。',
    order: '行动顺序',
    step1: '比通常多选一名队员，例如三人任务派四人。照常对队伍进行投票。',
    step2: '所有任务队员按各自角色的通常规则打出成功或失败。',
    step3: '若启用{excalibur}，持剑者先使用剑或跳过。',
    step4:
      '队长选择一名任务队员并确认“排除任务牌”。捕手不会在确认前揭示牌面。确认后无法更改，队长随后私下看到该牌当前的结果。',
    step5: '排除的牌不参与计数。若有{witch}，接着结算其行动，再确定任务结果。失败所需的失败牌数量保持不变。',
    limits: '人数与可选任务牌',
    limitText:
      '仅限8–10人局，不能与{plotCards}同时启用。必须排除当前任务的一张牌。可以选择自己的牌、持剑者的牌或被{excalibur}改变的牌。玩家仍是任务队员，只排除其任务牌。',
    swordTitle: '与王者之剑的互动',
    swordText:
      '捕手在剑之后行动。如果剑把成功改为失败，队长看到的就是失败；排除后该牌不计入结果。排除持剑者的牌，不会撤销其已对另一张牌进行的翻转。',
    visibilityTitle: '信息可见范围',
    visibilityText:
      '所有人都知道谁的牌被排除。游戏中只有该任务的队长能在私人弹窗和历史中看到牌面。游戏结束后历史向所有人公开牌面。投票表用✓表示参与、⊘表示牌被排除；即使游戏结束也不显示牌面。',
    timer: '选择时间耗尽时，游戏随机排除一张符合条件的牌。',
    examples: '计数示例',
    example1: '任务只需一张失败就会失败。四人打出三张成功和一张失败。队长排除失败后剩三张成功，任务成功。',
    example2: '同样的牌，若排除一张成功，剩余牌中仍有失败，任务失败。',
    example3: '第四次任务需要两张失败。若两张失败中排除一张，就只剩一张；没有其他效果时任务成功。所需门槛仍为两张。',
  },
  'zh-TW': {
    heading: '阿瓦隆捕手：擴充規則',
    intro:
      '捕手讓每次任務多派一人，並允許隊長排除一張已打出的任務牌。這是擴充而非獨立角色，由當前任務隊長做決定。本頁介紹本站線上版阿瓦隆的規則。',
    order: '行動順序',
    step1: '比通常多選一名隊員，例如三人任務派四人。照常對隊伍進行投票。',
    step2: '所有任務隊員按各自角色的通常規則打出成功或失敗。',
    step3: '若啟用{excalibur}，持劍者先使用劍或跳過。',
    step4:
      '隊長選擇一名任務隊員並確認「排除任務牌」。捕手不會在確認前揭示牌面。確認後無法更改，隊長隨後私下看到該牌目前的結果。',
    step5: '排除的牌不參與計數。若有{witch}，接著結算其行動，再確定任務結果。失敗所需的失敗牌數量保持不變。',
    limits: '人數與可選任務牌',
    limitText:
      '僅限8–10人局，不能與{plotCards}同時啟用。必須排除目前任務的一張牌。可以選擇自己的牌、持劍者的牌或被{excalibur}改變的牌。玩家仍是任務隊員，只排除其任務牌。',
    swordTitle: '與王者之劍的互動',
    swordText:
      '捕手在劍之後行動。如果劍把成功改為失敗，隊長看到的就是失敗；排除後該牌不計入結果。排除持劍者的牌，不會撤銷其已對另一張牌進行的翻轉。',
    visibilityTitle: '資訊可見範圍',
    visibilityText:
      '所有人都知道誰的牌被排除。遊戲中只有該任務的隊長能在私人彈窗和歷史中看到牌面。遊戲結束後歷史向所有人公開牌面。投票表用✓表示參與、⊘表示牌被排除；即使遊戲結束也不顯示牌面。',
    timer: '選擇時間耗盡時，遊戲隨機排除一張符合條件的牌。',
    examples: '計數範例',
    example1: '任務只需一張失敗就會失敗。四人打出三張成功和一張失敗。隊長排除失敗後剩三張成功，任務成功。',
    example2: '同樣的牌，若排除一張成功，剩餘牌中仍有失敗，任務失敗。',
    example3: '第四次任務需要兩張失敗。若兩張失敗中排除一張，就只剩一張；沒有其他效果時任務成功。所需門檻仍為兩張。',
  },
};
