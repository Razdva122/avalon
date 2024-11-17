import type { TLanguage } from '@/helpers/i18n/interface';
import { Dictionary } from '@avalon/types';

export const percival: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    generalInformation: 'General Information: ',
    percivalRole:
      "Percival's role is to protect and correctly identify {merlin} to prevent {merlin}’s assassination by the Minions of Mordred. Percival sees {merlin} and {morgana} at the beginning of the game but must discern which is which without revealing their identities to others.",
    generalTips: 'General Tips: ',
    understandYourRole: 'Understand Your Role: ',
    youAreProtector:
      "Knowing that you are one of {merlin}'s primary protectors, your main goal is to obscure {merlin}’s identity.",
    payAttentionToBehavior: 'Pay Attention to Behavior: ',
    observeBehaviors:
      'Observe the behaviors and suggestions of the two players identified as {merlin} and {morgana}. Try to deduce who the real {merlin} is based on how they guide the team.',
    beSubtle: 'Be Subtle: ',
    beCarefulWithDefense:
      'When defending or following the advice of who you believe is {merlin}, be subtle. Direct defense of {merlin} can lead to {morgana} and the minions of Mordred identifying and later assassinating {merlin}.',
    strategicTips: 'Strategic Tips: ',
    createAmbiguity: 'Create Ambiguity: ',
    actingUnsure:
      "Sometimes, acting unsure or casting doubt can help protect {merlin}'s identity. If evil players are unsure who {merlin} is, it’s harder for them to win the game by assassinating {merlin}.",
    communicateThroughVotes: 'Communicate Through Votes: ',
    votingPatterns:
      'Voting patterns can be a subtle way to communicate. Percival can show agreement or disagreement with {merlin}’s suspected choices through voting, without openly discussing it.',
    guideQuietly: 'Guide Quietly: ',
    subtlyGuide:
      'Percival often knows who the good players are. Guide them towards the right decisions subtly without exposing {merlin} or yourself.',
    protectMerlinToTheEnd: 'Protect Merlin to the End: ',
    takingSuspicion:
      "In the end game, be ready to take suspicion upon yourself to protect {merlin}'s identity, especially if you have established yourself as a trusted good player.",
    playingAsPercival:
      'Playing as Percival in Avalon offers a unique challenge and requires a combination of subtlety, discernment, and strategic misdirection. Your role is crucial in protecting {merlin} and ensuring the success of the forces of good. Be vigilant, be strategic, and above all, protect {merlin} at all costs.',
  },
  ru: {
    generalInformation: 'Общая информация: ',
    percivalRole:
      'Роль Персиваля заключается в защите и правильном определении {merlin}, чтобы предотвратить убийство {merlin} миньонами Мордреда. В начале игры Персиваль видит {merlin} и {morgana}, но должен различить, кто из них кто, не раскрывая их личности другим.',
    generalTips: 'Общие советы: ',
    understandYourRole: 'Поймите свою роль: ',
    youAreProtector:
      'Зная, что вы один из главных защитников {merlin}, ваша основная задача - скрыть личность {merlin}.',
    payAttentionToBehavior: 'Обратите внимание на поведение: ',
    observeBehaviors:
      'Наблюдайте за поведением и предложениями двух игроков, обозначенных как {merlin} и {morgana}. Попробуйте определить, кто из них настоящий {merlin}, основываясь на том, как они ведут команду.',
    beSubtle: 'Будьте осторожны: ',
    beCarefulWithDefense:
      'Когда защищаете или следуете советам того, кого считаете {merlin}, будьте осторожны. Прямая защита {merlin} может привести к тому, что {morgana} и миньоны Мордреда смогут его идентифицировать и позже убить.',
    strategicTips: 'Стратегические советы: ',
    createAmbiguity: 'Создайте неясность: ',
    actingUnsure:
      'Иногда демонстрация неуверенности или сомнений может помочь защитить личность {merlin}. Если злые игроки не уверены, кто из является {merlin}, им сложнее выиграть игру убийством.',
    communicateThroughVotes: 'Общайтесь через голосование: ',
    votingPatterns:
      'Шаблоны голосования могут быть тонким способом общения. Персиваль может показать согласие или несогласие с предполагаемыми выборами {merlin} через голосование, не обсуждая это открыто.',
    guideQuietly: 'Направляйте тихо: ',
    subtlyGuide:
      'Персиваль часто знает, кто хорошие игроки. Направляйте их к правильным решениям ненавязчиво, не раскрывая {merlin} или себя.',
    protectMerlinToTheEnd: 'Защитите Мерлина до конца: ',
    takingSuspicion:
      'В конце игры будьте готовы взять подозрения на себя, чтобы защитить личность {merlin}, особенно если вы уже зарекомендовали себя как надежный хороший игрок.',
    playingAsPercival:
      'Игра в роли Персиваля в Avalon предлагает уникальную задачу и требует комбинации скрытности, проницательности и стратегического отвлечения. Ваша роль чрезвычайно важна для защиты {merlin} и обеспечения успеха сил добра. Будьте бдительны, стратегичны и, прежде всего, защищайте {merlin} любой ценой.',
  },
  'zh-CN': {
    generalInformation: '基本信息：',
    percivalRole:
      '派西维尔的角色是保护并正确识别{merlin}，以防止{merlin}被莫德雷德的爪牙刺杀。派西维尔在游戏开始时会看到{merlin}和{morgana}，但必须辨别谁是谁而不暴露他们的身份。',
    generalTips: '一般提示：',
    understandYourRole: '理解你的角色：',
    youAreProtector: '知道你是{merlin}的主要保护者之一，你的主要目标是隐藏{merlin}的身份。',
    payAttentionToBehavior: '注意行为：',
    observeBehaviors:
      '观察被标识为{merlin}和{morgana}的两名玩家的行为和建议。尝试根据他们如何指导团队来推断谁是真正的{merlin}。',
    beSubtle: '保持低调：',
    beCarefulWithDefense:
      '在为你相信是{merlin}的人辩护或接受其建议时，请保持低调。直接保护{merlin}可能会导致{morgana}和莫德雷德的爪牙识别并随后刺杀{merlin}。',
    strategicTips: '战略提示：',
    createAmbiguity: '制造模糊：',
    actingUnsure:
      '有时，表现得不确定或怀疑可以帮助保护{merlin}的身份。如果邪恶的玩家不确定谁是{merlin}，他们就更难通过刺杀{merlin}来赢得游戏。',
    communicateThroughVotes: '通过投票沟通：',
    votingPatterns:
      '投票模式可以是细微的沟通方式。派西维尔可以通过投票显示对{merlin}怀疑选择的同意或不同意，而无需公开讨论。',
    guideQuietly: '悄悄指引：',
    subtlyGuide: '派西维尔通常知道谁是好玩家。细微地引导他们做出正确的决定，而不暴露{merlin}或你自己。',
    protectMerlinToTheEnd: '保护梅林到底：',
    takingSuspicion:
      '在游戏的最后阶段，要准备好承担怀疑，以保护{merlin}的身份，尤其是当你已经确立自己是一个值得信赖的好人时。',
    playingAsPercival:
      '在Avalon中扮演派西维尔是一个独特的挑战，需要结合细微技巧、洞察力和战略误导。你的角色对于保护{merlin}并确保正义力量的胜利至关重要。保持警惕，制定策略，最重要的是，务必不惜一切代价保护{merlin}。',
  },
  'zh-TW': {
    generalInformation: '基本資訊：',
    percivalRole:
      '派西維爾的角色是保護並正確識別{merlin}，以防止{merlin}被莫德雷德的爪牙刺殺。派西維爾在遊戲開始時會看到{merlin}和{morgana}，但必須辨別誰是誰而不透露他們的身份。',
    generalTips: '一般提示：',
    understandYourRole: '瞭解你的角色：',
    youAreProtector: '知道你是{merlin}的主要保護者之一，你的主要目標是隱藏{merlin}的身份。',
    payAttentionToBehavior: '注意行為：',
    observeBehaviors:
      '觀察被標記為{merlin}和{morgana}的兩位玩家的行為和建議。嘗試根據他們如何指導團隊來推測誰是真正的{merlin}。',
    beSubtle: '保持低調：',
    beCarefulWithDefense:
      '在為你認為是{merlin}的人辯護或接受其建議時，請保持低調。直接保護{merlin}可能會導致{morgana}和莫德雷德的爪牙識別並隨後刺殺{merlin}。',
    strategicTips: '戰略提示：',
    createAmbiguity: '製造模糊：',
    actingUnsure:
      '有時，表現得不確定或懷疑可以幫助保護{merlin}的身份。如果邪惡的玩家不確定誰是{merlin}，他們就更難通過刺殺{merlin}來贏得遊戲。',
    communicateThroughVotes: '通過投票溝通：',
    votingPatterns:
      '投票模式可以是細微的溝通方式。派西維爾可以通過投票顯示對{merlin}懷疑選擇的同意或不同意，而不必公開討論。',
    guideQuietly: '悄悄指導：',
    subtlyGuide: '派西維爾通常知道誰是好玩家。細微地引導他們做出正確的決定，而不暴露{merlin}或你自己。',
    protectMerlinToTheEnd: '保護梅林到底：',
    takingSuspicion:
      '在遊戲的最後階段，要準備好承擔懷疑，以保護{merlin}的身份，尤其是當你已經確立自己是值得信任的好人時。',
    playingAsPercival:
      '在Avalon中扮演派西維爾是一個獨特的挑戰，需要結合細微技巧、洞察力和戰略誤導。你的角色對於保護{merlin}並確保正義力量的勝利至關重要。保持警惕，制定策略，最重要的是，務必不惜一切代價保護{merlin}。',
  },
};
