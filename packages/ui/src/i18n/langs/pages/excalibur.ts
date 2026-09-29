import type { TLanguage } from '@/i18n/interface';
import type { Dictionary } from '@avalon/types';

export const excalibur: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoIntro:
      "{excalibur} changes one submitted mission card: Success becomes Fail, or Fail becomes Success. It does not change a player's role or their vote to approve the team.",
    seoRule1:
      'After selecting a team and before the approval vote, the leader gives the sword to a team member other than themselves. Everyone can see who holds it.',
    seoRule2:
      "After mission cards have been submitted, the holder can flip another team member's card or skip using the sword. The interface does not allow the holder to target themselves or anyone outside the mission.",
    seoRule3:
      "A new holder is chosen for each proposed team. The final mission result uses the cards after the flip and the mission's required number of Fails.",
    seoLimit1:
      "Who sees the flipped card? The use and target are public. During the game, the holder and target know the affected card's result; other players do not receive that private value.",
    seoLimit2:
      "Does Excalibur guarantee success? No: you pick a player before learning their card. A good player's Success can become Fail, and removing one Fail may leave enough Fails to lose the mission.",
    seoScenario1:
      "On a mission needing one Fail, there is exactly one Fail. Flipping that card to Success saves the mission; flipping a different player's Success adds a second Fail.",
    seoScenario2:
      'The fourth mission with 7–10 players needs two Fails. If two were submitted and one is flipped to Success, only one remains and the mission succeeds.',
    seoHeading: 'Excalibur in Avalon: rules, card flips and examples',
  },
  ru: {
    seoIntro:
      '{excalibur} меняет одну сыгранную карту миссии: успех на провал или провал на успех. Он не меняет роль игрока и голос за одобрение команды.',
    seoRule1:
      'После сбора команды, до голосования за неё, лидер передаёт меч участнику миссии, кроме себя. Все видят, кто получил Экскалибур.',
    seoRule2:
      'После сдачи карт миссии владелец может изменить карту другого участника команды или пропустить применение. Интерфейс не разрешает выбрать себя или игрока вне миссии.',
    seoRule3:
      'Для каждой предложенной команды меч назначается заново. Итог миссии определяется по картам после изменения с учётом требуемого числа провалов.',
    seoLimit1:
      'Кто видит изменённую карту? Применение меча и цель публичны. Во время игры владелец и цель знают результат затронутой карты; остальные не получают это тайное значение.',
    seoLimit2:
      'Гарантирует ли Экскалибур успех? Нет: цель выбирают до просмотра её карты. Успех доброго игрока может стать провалом, а после удаления одного провала других может хватить для поражения.',
    seoScenario1:
      'В миссии, где достаточно одного провала, сыгран ровно один провал. Его замена на успех спасает миссию; замена успеха другого игрока добавляет второй провал.',
    seoScenario2:
      'Для четвёртой миссии при 7–10 игроках нужны два провала. Если сыграны два и один заменён успехом, остаётся один провал и миссия проходит.',
    seoHeading: 'Экскалибур в Авалоне: правила и смена карты миссии',
  },
  es: {
    seoIntro:
      '{excalibur} invierte una carta de misión jugada: Éxito pasa a Fracaso y viceversa. No cambia el personaje ni el voto para aprobar el equipo.',
    seoRule1:
      'Tras elegir el equipo y antes de votarlo, el líder entrega la espada a otro miembro de la misión. Todos ven quién la recibe.',
    seoRule2:
      'Después de entregar las cartas de misión, el portador puede cambiar la de otro miembro del equipo o no usar la espada. La interfaz impide elegirse a sí mismo o elegir a alguien fuera de la misión.',
    seoRule3:
      'Se elige un portador para cada equipo propuesto. El resultado final usa las cartas tras el cambio y el número de Fracasos necesario para esa misión.',
    seoLimit1:
      '¿Quién ve la carta cambiada? El uso y el objetivo son públicos. Durante la partida, el portador y el objetivo conocen el resultado de la carta afectada; los demás no reciben ese valor privado.',
    seoLimit2:
      '¿Excalibur garantiza el éxito? No: eliges a un jugador antes de conocer su carta. El Éxito de un jugador bueno puede convertirse en Fracaso, y quitar un Fracaso puede no ser suficiente.',
    seoScenario1:
      'Una misión que necesita un Fracaso contiene exactamente uno. Cambiarlo a Éxito salva la misión; cambiar el Éxito de otra persona añade un segundo Fracaso.',
    seoScenario2:
      'La cuarta misión con 7–10 jugadores necesita dos Fracasos. Si se jugaron dos y uno pasa a Éxito, queda uno y la misión tiene éxito.',
    seoHeading: 'Excalibur en Avalon: reglas y cambio de carta de misión',
  },
  pt: {
    seoIntro:
      '{excalibur} inverte uma carta de missão jogada: Sucesso vira Fracasso e vice-versa. Não altera o personagem nem o voto de aprovação da equipe.',
    seoRule1:
      'Após escolher a equipe e antes da votação, o líder entrega a espada a outro participante da missão. Todos veem quem a recebeu.',
    seoRule2:
      'Depois que as cartas de missão são entregues, o portador pode inverter a carta de outro participante ou não usar a espada. A interface não permite escolher a si mesmo nem alguém fora da missão.',
    seoRule3:
      'Um portador é escolhido para cada equipe proposta. O resultado final considera as cartas após a troca e o número de Fracassos necessário para a missão.',
    seoLimit1:
      'Quem vê a carta alterada? O uso e o alvo são públicos. Durante a partida, o portador e o alvo conhecem o resultado da carta afetada; os demais não recebem esse valor privado.',
    seoLimit2:
      'Excalibur garante sucesso? Não: o alvo é escolhido antes de conhecer sua carta. O Sucesso de alguém do bem pode virar Fracasso, e remover um Fracasso pode não bastar.',
    seoScenario1:
      'Uma missão que exige um Fracasso tem exatamente um. Inverter essa carta para Sucesso salva a missão; inverter o Sucesso de outra pessoa acrescenta um segundo Fracasso.',
    seoScenario2:
      'A quarta missão com 7–10 jogadores exige dois Fracassos. Se dois foram jogados e um vira Sucesso, resta apenas um e a missão é bem-sucedida.',
    seoHeading: 'Excalibur em Avalon: regras e troca da carta de missão',
  },
  'zh-CN': {
    seoIntro:
      '{excalibur}会翻转一张已提交的任务牌：成功变失败，失败变成功。它不会改变角色，也不会改变赞成或反对队伍的投票。',
    seoRule1: '队伍选定后、表决前，队长把剑交给队内另一位玩家，不能给自己。所有人都知道谁持有剑。',
    seoRule2: '任务牌全部提交后，持有者可翻转队内另一人的牌，也可放弃使用。界面不允许选择自己或不在本次任务中的玩家。',
    seoRule3: '每次提出队伍都要重新指定持有者。最终任务结果根据翻转后的牌，以及该任务所需的失败牌数量计算。',
    seoLimit1:
      '谁能看到被翻转的牌？是否用剑及目标是公开的。游戏中持有者与目标知道该牌的结果，其他玩家不会获得这个私下信息。',
    seoLimit2:
      '神剑一定能救任务吗？不能：先选目标，再得知其牌。好人的成功可能变成失败；即使减少一张失败牌，剩余失败牌也可能足以让任务失败。',
    seoScenario1:
      '某任务只需一张失败牌就会失败，实际恰有一张。把它翻成成功可救任务；若翻了另一个人的成功牌，反而会增加第二张失败牌。',
    seoScenario2: '7–10人局的第4次任务需要两张失败牌。若原本有两张，其中一张变为成功后只剩一张，任务成功。',
    seoHeading: '阿瓦隆王者之剑 Excalibur：翻转任务牌规则',
  },
  'zh-TW': {
    seoIntro:
      '{excalibur}會翻轉一張已提交的任務牌：成功變失敗，失敗變成功。它不會改變角色，也不會改變贊成或反對隊伍的投票。',
    seoRule1: '隊伍選定後、表決前，隊長把劍交給隊內另一位玩家，不能給自己。所有人都知道誰持有劍。',
    seoRule2: '任務牌全部提交後，持有者可翻轉隊內另一人的牌，也可放棄使用。介面不允許選擇自己或不在本次任務中的玩家。',
    seoRule3: '每次提出隊伍都要重新指定持有者。最終任務結果根據翻轉後的牌，以及該任務所需的失敗牌數量計算。',
    seoLimit1:
      '誰能看到被翻轉的牌？是否用劍及目標是公開的。遊戲中持有者與目標知道該牌的結果，其他玩家不會獲得這個私下資訊。',
    seoLimit2:
      '神劍一定能救任務嗎？不能：先選目標，再得知其牌。好人的成功可能變成失敗；即使減少一張失敗牌，剩餘失敗牌也可能足以讓任務失敗。',
    seoScenario1:
      '某任務只需一張失敗牌就會失敗，實際恰有一張。把它翻成成功可救任務；若翻了另一個人的成功牌，反而會增加第二張失敗牌。',
    seoScenario2: '7–10人局的第4次任務需要兩張失敗牌。若原本有兩張，其中一張變為成功後只剩一張，任務成功。',
    seoHeading: '阿瓦隆王者之劍 Excalibur：翻轉任務牌規則',
  },
};
