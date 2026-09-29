import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const lancelots: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoHeading: 'Lancelot in Avalon: Switching Sides & Mission Rules',
    seoTeam: 'One starts good and one evil. Each wins with their current side; a switch changes both allegiances.',
    seoAbility:
      'Here, a card is drawn before missions 3, 4 and 5 if play reaches them. The shuffled deck has two Switch cards and three blanks. Switch changes both sides; blank changes neither.',
    seoLimit:
      'Can Evil Lancelot play Success? On this platform, no: the currently evil Lancelot must play Fail and the currently good one must play Success. Neither learns the other’s identity or evil teammates at setup. Board-game Lancelot variants differ.',
    seoScenario1:
      'A Switch before mission 3 makes the previously good Lancelot evil, so that player must now play Fail. Earlier Success cards do not confirm current loyalty.',
    seoScenario2:
      '{guinevere} knows both Lancelots without their sides. {merlin} sees the starting evil Lancelot only as evil; that marker does not update after a switch. Players shown the specific Lancelot role, including {merlinPure} and the other evil players who see it, receive updated allegiance information.',
    generalTipsTitle: 'General Tips:',
    embraceUnpredictabilityTitle: 'Embrace unpredictability:',
    embraceUnpredictabilityDescription:
      'As a Lancelot, the unpredictability is your element. Use the potential of switching sides in your favor.',
    dualityOfRolesTitle: 'Duality of roles:',
    dualityOfRolesDescription:
      'Remember your initial role but adapt swiftly if the card of loyalty change is drawn. Your new role needs to be played convincingly to avoid suspicion.',
    observeAndAdaptTitle: 'Observe and adapt:',
    observeAndAdaptDescription:
      "Both Lancelots must closely monitor the game's narrative to effectively realign their strategies following any change in loyalty.",
  },
  ru: {
    seoHeading: 'Ланселоты в Авалоне: смена сторон и правила миссий',
    seoTeam:
      'Один начинает за добро, другой — за зло. Каждый побеждает со своей текущей стороной; при смене лояльности стороны меняются у обоих.',
    seoAbility:
      'На платформе карту тянут перед миссиями 3, 4 и 5, если игра до них доходит. В перемешанной колоде две карты смены и три пустые. Смена переворачивает обе стороны, пустая карта ничего не меняет.',
    seoLimit:
      'Может ли тёмный Ланселот дать успех? На платформе — нет: текущий тёмный обязан дать провал, светлый — успех. На старте Ланселоты не знают друг друга и злых союзников. В настольных вариантах правила могут отличаться.',
    seoScenario1:
      'Смена перед третьей миссией делает бывшего светлого Ланселота тёмным: теперь он обязан дать провал. Прежние успехи не подтверждают текущую лояльность.',
    seoScenario2:
      '{guinevere} знает обоих Ланселотов без их сторон. {merlin} видит стартового тёмного Ланселота только как злого; эта отметка после смены не обновляется. Те, кому показана конкретная роль Ланселота, включая роль {merlinPure} и видящих его злых союзников, получают обновлённую сторону.',
    generalTipsTitle: 'Общие советы:',
    embraceUnpredictabilityTitle: 'Примите непредсказуемость:',
    embraceUnpredictabilityDescription:
      'Как Ланселот, непредсказуемость — это ваш элемент. Используйте потенциал смены сторон в свою пользу.',
    dualityOfRolesTitle: 'Двойственность ролей:',
    dualityOfRolesDescription:
      'Помните свою начальную роль, но быстро адаптируйтесь, если вытянута карта смены лояльности. Новую роль следует играть убедительно, чтобы избежать подозрений.',
    observeAndAdaptTitle: 'Наблюдайте и адаптируйтесь:',
    observeAndAdaptDescription:
      'Оба Ланселота должны внимательно следить за ходом игры, чтобы эффективно корректировать свою стратегию после любой смены лояльности.',
  },
  'zh-CN': {
    seoHeading: '阿瓦隆兰斯洛特：换边规则与任务玩法',
    seoTeam: '一名初始为好人，一名初始为坏人。各自随当前阵营获胜；转换时两人的阵营同时交换。',
    seoAbility:
      '本站在第3、4、5次任务开始前各抽一张牌，前提是游戏进行到该阶段。洗混的五张牌含两张转换和三张空白。转换牌交换两人阵营，空白牌不改变阵营。',
    seoLimit:
      '邪恶兰斯洛特能出成功吗？本站不能：当前坏人必须出失败，当前好人必须出成功。两人开局不知道对方或坏人队友是谁。实体桌游的不同变体规则可能不同。',
    seoScenario1: '第3次任务前抽到转换，原本的好兰斯洛特变成坏人，必须出失败。以前出过成功不能证明现在是好人。',
    seoScenario2:
      '{guinevere}知道两名兰斯洛特但不知道阵营。{merlin}只看到初始邪恶兰斯洛特是坏人，转换后该标记不会更新。能看到具体兰斯洛特角色的玩家，包括{merlinPure}及能认出他的其他坏人，会收到更新后的阵营信息。',
    generalTipsTitle: '一般提示：',
    embraceUnpredictabilityTitle: '接受不可预测性：',
    embraceUnpredictabilityDescription: '作为兰斯洛特，不可预测性是你的元素。利用可能的换边来为自己谋利。',
    dualityOfRolesTitle: '角色的二重性：',
    dualityOfRolesDescription:
      '记住你的初始角色，但如果抽到了忠诚变化的卡片，请迅速适应。你的新角色需要扮演得逼真，以避免怀疑。',
    observeAndAdaptTitle: '观察和适应：',
    observeAndAdaptDescription: '两位兰斯洛特都必须密切关注游戏的叙述，以在忠诚度改变后有效调整他们的策略。',
  },
  'zh-TW': {
    seoHeading: '阿瓦隆蘭斯洛特：換邊規則與任務玩法',
    seoTeam: '一名初始為好人，一名初始為壞人。各自隨目前陣營獲勝；轉換時兩人的陣營同時交換。',
    seoAbility:
      '本站在第3、4、5次任務開始前各抽一張牌，前提是遊戲進行到該階段。洗混的五張牌含兩張轉換和三張空白。轉換牌交換兩人陣營，空白牌不改變陣營。',
    seoLimit:
      '邪惡蘭斯洛特能出成功嗎？本站不能：目前的壞人必須出失敗，好人必須出成功。兩人開局不知道對方或壞人隊友是誰。實體桌遊的不同變體規則可能不同。',
    seoScenario1: '第3次任務前抽到轉換，原本的好蘭斯洛特變成壞人，必須出失敗。以前出過成功不能證明現在是好人。',
    seoScenario2:
      '{guinevere}知道兩名蘭斯洛特但不知道陣營。{merlin}只看到初始邪惡蘭斯洛特是壞人，轉換後該標記不會更新。能看到具體蘭斯洛特角色的玩家，包括{merlinPure}及能認出他的其他壞人，會收到更新後的陣營資訊。',
    generalTipsTitle: '一般提示：',
    embraceUnpredictabilityTitle: '接受不可預測性：',
    embraceUnpredictabilityDescription: '作為蘭斯洛特，不可預測性是你的元素。利用可能的換邊來為自己謀利。',
    dualityOfRolesTitle: '角色的二重性：',
    dualityOfRolesDescription:
      '記住你的初始角色，但如果抽到了忠誠變化的卡片，請迅速適應。你的新角色需要扮演得逼真，以避免懷疑。',
    observeAndAdaptTitle: '觀察和適應：',
    observeAndAdaptDescription: '兩位蘭斯洛特都必須密切關注遊戲的敘述，以在忠誠度改變後有效調整他們的策略。',
  },
  es: {
    seoHeading: 'Lancelot en Avalon: cambios de bando y misiones',
    seoTeam:
      'Uno empieza en el bien y otro en el mal. Cada uno gana con su bando actual; un cambio invierte ambas lealtades.',
    seoAbility:
      'Aquí se roba una carta antes de las misiones 3, 4 y 5, si se llega a ellas. El mazo mezclado tiene dos cambios y tres cartas en blanco. Un cambio invierte ambos bandos; una carta en blanco no los altera.',
    seoLimit:
      '¿Puede el Lancelot malo jugar Éxito? Aquí no: el Lancelot actualmente malo debe jugar Fracaso y el bueno, Éxito. Al inicio ninguno conoce al otro ni a los demás malvados. Las variantes del juego de mesa difieren.',
    seoScenario1:
      'Un cambio antes de la misión 3 convierte al anterior Lancelot bueno en malo: ahora debe jugar Fracaso. Los éxitos anteriores no confirman su lealtad actual.',
    seoScenario2:
      '{guinevere} conoce a ambos Lancelots sin sus bandos. {merlin} solo ve al Lancelot inicialmente malo como malvado; esa marca no se actualiza al cambiar. Quienes ven el rol específico de Lancelot, incluidos {merlinPure} y los demás malvados que lo reconocen, reciben la lealtad actualizada.',
    generalTipsTitle: 'Consejos Generales:',
    embraceUnpredictabilityTitle: 'Abraza la imprevisibilidad:',
    embraceUnpredictabilityDescription:
      'Como un Lancelot, la imprevisibilidad es tu elemento. Usa el potencial de cambiar de bando a tu favor.',
    dualityOfRolesTitle: 'Dualidad de roles:',
    dualityOfRolesDescription:
      'Recuerda tu rol inicial pero adáptate rápidamente si se roba una carta de cambio de lealtad. Tu nuevo rol debe ser jugado de manera convincente para evitar sospechas.',
    observeAndAdaptTitle: 'Observa y adapta:',
    observeAndAdaptDescription:
      'Ambos Lancelots deben monitorear de cerca la narrativa del juego para realinear efectivamente sus estrategias tras cualquier cambio de lealtad.',
  },
  pt: {
    seoHeading: 'Lancelot em Avalon: troca de lado e regras das missões',
    seoTeam: 'Um começa no bem e outro no mal. Cada um vence com seu lado atual; uma troca inverte as duas lealdades.',
    seoAbility:
      'Aqui, uma carta é comprada antes das missões 3, 4 e 5, se a partida chegar a elas. O baralho embaralhado tem duas trocas e três cartas em branco. A troca inverte ambos os lados; a carta em branco não muda nada.',
    seoLimit:
      'O Lancelot mau pode jogar Sucesso? Aqui não: quem está mau deve jogar Falha, e quem está bom, Sucesso. No início, nenhum conhece o outro ou os demais jogadores do mal. As variantes de mesa diferem.',
    seoScenario1:
      'Uma troca antes da missão 3 torna mau o Lancelot que era bom: agora ele deve jogar Falha. Sucessos anteriores não confirmam a lealdade atual.',
    seoScenario2:
      '{guinevere} conhece os dois Lancelots sem seus lados. {merlin} vê o Lancelot inicialmente mau apenas como mau; essa marca não muda após uma troca. Quem vê o papel específico de Lancelot, incluindo {merlinPure} e os demais maus que o reconhecem, recebe a lealdade atualizada.',
    generalTipsTitle: 'Dicas Gerais:',
    embraceUnpredictabilityTitle: 'Abrace a imprevisibilidade:',
    embraceUnpredictabilityDescription:
      'Como um Lancelot, a imprevisibilidade é seu elemento. Use o potencial de trocar de lado a seu favor.',
    dualityOfRolesTitle: 'Dualidade de papéis:',
    dualityOfRolesDescription:
      'Lembre-se do seu papel inicial, mas adapte-se rapidamente se a carta de mudança de lealdade for sacada. Seu novo papel precisa ser interpretado de forma convincente para evitar suspeitas.',
    observeAndAdaptTitle: 'Observe e adapte-se:',
    observeAndAdaptDescription:
      'Ambos os Lancelots devem monitorar de perto a narrativa do jogo para realinhar efetivamente suas estratégias após qualquer mudança de lealdade.',
  },
};
