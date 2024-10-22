import type { TLanguage } from '@/helpers/i18n/interface';
import { Dictionary } from '@avalon/types';

export const lancelots: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    generalInformationTitle: 'General Information:',
    introduction:
      'Lancelots presents a dynamic challenge in the realm of Avalon. As two players starting on opposite sides, the {goodLancelot} aligns with the forces of good, while the {evilLancelot} conspires with the minions of Mordred.',
    loyaltyTides:
      "However, the tides of loyalty may turn as the game progresses. {merlin} can see the {evilLancelot} among the ranks of Mordred's followers, and the minions of Mordred recognize the presence of an {evilLancelot}.",
    goodAndEvilRecognition: 'On the other hand, the {evilLancelot} does not know his allies.',
    guinevereKnowledge:
      'If {guinevere} is present in the game, she knows both Lancelots but does not know their loyalty.',
    gameplayKeyConcept:
      "Key to the Lancelots' gameplay is the deck of loyalty change. After the second mission, a card is drawn.",
    loyaltyChangeMechanism:
      "If a <span class='material-icons icon-swap'>swap_horiz</span><b>loyalty change</b> card is revealed, the Lancelots switch allegiances along with all corresponding changes (such as the ability to fail a mission, or being subject to the Lady of Lake card).",
    deckComposition:
      "Whereas, if the card drawn is <span class='material-icons icon-swap'>close</span><b>blank</b>, no change occurs. The deck contains <b>five cards</b>, of which two prompt <span class='material-icons icon-swap'>swap_horiz</span><b>loyalty change</b>, and three are <span class='material-icons icon-swap'>close</span><b>blank</b>.",
    loyaltyShiftDescription:
      'Importantly, a shift in loyalty does not alter how other players perceive you, {merlin} and the minions of Mordred will continue to see the originally {evilLancelot} as their initial role.',
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
    subtlePlaysTitle: 'Subtle plays:',
    subtlePlaysDescription:
      'Whether undermining a quest subtly as evil or bolstering one as good, the art of disguise is crucial. Go unnoticed in your actions to preserve your new allegiance.',
    strategicTipsTitle: 'Strategic Tips:',
    merlinsPerceptionTitle: "Merlin's perception:",
    merlinsPerceptionDescription:
      'If you are the {evilLancelot} and become good, remember that {merlin} still perceives you as part of evil. Use this to your advantage.',
    balanceTheScalesTitle: 'Balance the scales:',
    balanceTheScalesDescription:
      'Play an active role in votes and quest propositions to exert influence subtly, tipping the scales in favor of your current side.',
    maintainYourCoverTitle: 'Maintain your cover:',
    maintainYourCoverDescription:
      'If you switch to the evil side, be mindful not to abruptly change your behavior. Gradual shifts are less conspicuous.',
    servingAsLancelotDescription:
      'Serving as a Lancelot, you hold a powerful dual identity that can dramatically shift the course of the game in Avalon. With the potential for changing loyalties, your role invites a strategic depth unlike any other. Tread cautiously, for the balance of good and evil rests upon your armored shoulders.',
  },
  ru: {
    generalInformationTitle: 'Общая информация:',
    introduction:
      'Ланселоты представляют собой динамичную роль в мире Авалона. Будучи двумя игроками, начинающими на противоположных сторонах, {goodLancelot} присоединяется к силам света, в то время как {evilLancelot} к силам тьмы.',
    loyaltyTides:
      'Однако лояльность может измениться по мере развития игры. {merlin} может видеть {evilLancelot} среди последователей Мордреда, и слуги Мордреда знают кто среди них является {evilLancelot}.',
    goodAndEvilRecognition: 'С другой стороны, {evilLancelot} не знает своих союзников.',
    guinevereKnowledge:
      'Если {guinevere} присутствует в игре, она знает обоих Ланселотов, но не знает, кому они преданы.',
    gameplayKeyConcept:
      'Ключевым элементом игры Ланселотов является колода смены лояльности. После второй миссии вытягивается карта.',
    loyaltyChangeMechanism:
      "Если открывается карта <span class='material-icons icon-swap'>swap_horiz</span><b>смена лояльности</b>, Ланселоты меняют стороны со всеми соответствующими изменениями (например, возможность провалить миссию или быть подверженным влиянию карты Леди Озера).",
    deckComposition:
      "Если вытянута <span class='material-icons icon-swap'>close</span><b>пустая</b> карта, изменения не происходит. Колода содержит <b>пять карт</b>, из которых две вызывают <span class='material-icons icon-swap'>swap_horiz</span><b>смену лояльности</b>, а три — <span class='material-icons icon-swap'>close</span><b>пустые</b>.",
    loyaltyShiftDescription:
      'Важно, что изменение лояльности не изменяет то, как другие игроки воспринимают вас. {merlin} и приспешники Мордреда будут по-прежнему считать изначально {evilLancelot} своей начальной ролью.',
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
    subtlePlaysTitle: 'Тонкие игры:',
    subtlePlaysDescription:
      'Искусство маскировки крайне важно, как при провале похода в роли зла, так и при его поддержке в роли добра. Оставайтесь незамеченными в своих действиях, чтобы сохранить новую приверженность.',
    strategicTipsTitle: 'Стратегические советы:',
    merlinsPerceptionTitle: 'Восприятие Мерлина:',
    merlinsPerceptionDescription:
      'Если вы {evilLancelot} и становитесь добрым, помните, что {merlin} все еще считает вас частью зла. Используйте это в своих интересах.',
    balanceTheScalesTitle: 'Балансирование весов:',
    balanceTheScalesDescription:
      'Активно участвуйте в голосованиях и предложениях квестов, чтобы незаметно влиять на ситуацию, склоняя весы в пользу вашей нынешней стороны.',
    maintainYourCoverTitle: 'Сохраните прикрытие:',
    maintainYourCoverDescription:
      'Если вы переходите на сторону зла, следите за тем, чтобы не резко менять свое поведение. Постепенные изменения менее заметны.',
    servingAsLancelotDescription:
      'Будучи Ланселотом, вы обладаете мощной способностью сменить лояльность, которая может кардинально изменить ход игры в Авалоне. С возможностью смены лояльности, ваша роль предполагает стратегическую глубину, не похожую на другие. Будьте осторожны, ведь баланс добра и зла лежит на ваших бронированных плечах.',
  },
  zh_CN: {
    generalInformationTitle: '一般信息：',
    introduction:
      '兰斯洛特在阿瓦隆的领域中提出了一个动态的挑战。作为两个从对立面开始的玩家，{goodLancelot} 与善的一方结盟，而 {evilLancelot} 与莫德雷德的爪牙密谋。',
    loyaltyTides:
      '然而，随着游戏的进行，忠诚可能会改变。{merlin} 可以看到莫德雷德追随者中的 {evilLancelot}，而莫德雷德的爪牙认出 {evilLancelot} 的存在。',
    goodAndEvilRecognition: '另一方面，{evilLancelot} 不知道他的盟友。',
    guinevereKnowledge: '如果游戏中有 {guinevere}，她知道两个兰斯洛特，但不知道他们的忠诚度。',
    gameplayKeyConcept: '兰斯洛特游戏的关键是忠诚度变化的牌堆。在第二次任务后抽取一张卡。',
    loyaltyChangeMechanism:
      "如果显示 <span class='material-icons icon-swap'>swap_horiz</span><b>忠诚变化</b> 卡片，兰斯洛特将切换阵营，并随之进行所有相应的变化（例如完成或失败任务，或被 湖中仙女 卡影响）。",
    deckComposition:
      "而如果抽出的卡是 <span class='material-icons icon-swap'>close</span><b>空白</b>，则不发生变化。牌堆包含 <b>五张卡片</b>，其中两张促使 <span class='material-icons icon-swap'>swap_horiz</span><b>忠诚变化</b>，三张为空白。",
    loyaltyShiftDescription:
      '重要的是，忠诚度的变化不会改变其他玩家对你的看法。{merlin} 和莫德雷德的爪牙将继续将最初的 {evilLancelot} 视为他们的初始角色。',
    generalTipsTitle: '一般提示：',
    embraceUnpredictabilityTitle: '接受不可预测性：',
    embraceUnpredictabilityDescription: '作为兰斯洛特，不可预测性是你的元素。利用可能的换边来为自己谋利。',
    dualityOfRolesTitle: '角色的二重性：',
    dualityOfRolesDescription:
      '记住你的初始角色，但如果抽到了忠诚变化的卡片，请迅速适应。你的新角色需要扮演得逼真，以避免怀疑。',
    observeAndAdaptTitle: '观察和适应：',
    observeAndAdaptDescription: '两位兰斯洛特都必须密切关注游戏的叙述，以在忠诚度改变后有效调整他们的策略。',
    subtlePlaysTitle: '微妙的玩法：',
    subtlePlaysDescription:
      '无论是以邪恶的方式隐秘干扰任务，还是以善良的方式支持任务，伪装艺术是至关重要的。使你的行动不被察觉，以保留你的新忠诚。',
    strategicTipsTitle: '战略提示：',
    merlinsPerceptionTitle: '梅林的感知：',
    merlinsPerceptionDescription:
      '如果你是 {evilLancelot} 并且成为好的一方，请记住 {merlin} 仍然认为你是邪恶的一部分。利用这一点来获取优势。',
    balanceTheScalesTitle: '平衡天平：',
    balanceTheScalesDescription: '在投票和任务提议中扮演积极角色，施加微妙的影响，使天平倾向于您当前的一方。',
    maintainYourCoverTitle: '保持你的伪装：',
    maintainYourCoverDescription: '如果你转到邪恶一方，注意不要突然改变你的行为。逐渐的转变不那么显眼。',
    servingAsLancelotDescription:
      '作为兰斯洛特，你拥有强大的双重身份，可以显著改变阿瓦隆中的游戏进程。随着忠诚的潜在变化，你的角色提供了独特的战略深度。谨慎行事，因为善与恶的平衡掌握在你的装甲肩膀上。',
  },
  zh_TW: {
    generalInformationTitle: '一般信息：',
    introduction:
      '蘭斯洛特在阿瓦隆的領域中提出了一個動態的挑戰。作為兩個從對立面開始的玩家，{goodLancelot} 與善的一方結盟，而 {evilLancelot} 與莫德雷德的爪牙密謀。',
    loyaltyTides:
      '然而，隨著遊戲的進行，忠誠可能會改變。{merlin} 可以看到莫德雷德追隨者中的 {evilLancelot}，而莫德雷德的爪牙認出 {evilLancelot} 的存在。',
    goodAndEvilRecognition: '另一方面，{evilLancelot} 不知道他的盟友。',
    guinevereKnowledge: '如果遊戲中有 {guinevere}，她知道兩個蘭斯洛特，但不知道他們的忠誠度。',
    gameplayKeyConcept: '蘭斯洛特遊戲的關鍵是忠誠度變化的牌堆。在第二次任務後抽取一張卡。',
    loyaltyChangeMechanism:
      "如果顯示 <span class='material-icons icon-swap'>swap_horiz</span><b>忠誠變化</b> 卡片，蘭斯洛特將切換陣營，並隨之進行所有相應的變化（例如完成或失敗任務，或被 湖中仙女 卡影響）。",
    deckComposition:
      "而如果抽出的卡是 <span class='material-icons icon-swap'>close</span><b>空白</b>，則不發生變化。牌堆包含 <b>五張卡片</b>，其中兩張促使 <span class='material-icons icon-swap'>swap_horiz</span><b>忠誠變化</b>，三張為空白。",
    loyaltyShiftDescription:
      '重要的是，忠誠度的變化不會改變其他玩家對你的看法。{merlin} 和莫德雷德的爪牙將繼續將最初的 {evilLancelot} 視為他們的初始角色。',
    generalTipsTitle: '一般提示：',
    embraceUnpredictabilityTitle: '接受不可預測性：',
    embraceUnpredictabilityDescription: '作為蘭斯洛特，不可預測性是你的元素。利用可能的換邊來為自己謀利。',
    dualityOfRolesTitle: '角色的二重性：',
    dualityOfRolesDescription:
      '記住你的初始角色，但如果抽到了忠誠變化的卡片，請迅速適應。你的新角色需要扮演得逼真，以避免懷疑。',
    observeAndAdaptTitle: '觀察和適應：',
    observeAndAdaptDescription: '兩位蘭斯洛特都必須密切關注遊戲的敘述，以在忠誠度改變後有效調整他們的策略。',
    subtlePlaysTitle: '微妙的玩法：',
    subtlePlaysDescription:
      '無論是以邪惡的方式隱秘干擾任務，還是以善良的方式支持任務，偽裝藝術是至關重要的。使你的行動不被察覺，以保留你的新忠誠。',
    strategicTipsTitle: '戰略提示：',
    merlinsPerceptionTitle: '梅林的感知：',
    merlinsPerceptionDescription:
      '如果你是 {evilLancelot} 並且成為好的一方，請記住 {merlin} 仍然認為你是邪惡的一部分。利用這一點來獲取優勢。',
    balanceTheScalesTitle: '平衡天平：',
    balanceTheScalesDescription: '在投票和任務提議中扮演積極角色，施加微妙的影響，使天平傾向於您當前的一方。',
    maintainYourCoverTitle: '保持你的偽裝：',
    maintainYourCoverDescription: '如果你轉到邪惡一方，注意不要突然改變你的行為。逐漸的轉變不那麼顯眼。',
    servingAsLancelotDescription:
      '作為蘭斯洛特，你擁有強大的雙重身份，可以顯著改變阿瓦隆中的遊戲進程。隨著忠誠的潛在變化，你的角色提供了獨特的戰略深度。謹慎行事，因為善與惡的平衡掌握在你的裝甲肩膀上。',
  },
};
