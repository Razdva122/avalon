import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const guinevere: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoHeading: 'Guinevere in Avalon: Lancelots & Assassination',
    seoTeam: 'Good. On this platform, {guinevere} is also a possible assassination target.',
    seoAbility:
      'Guinevere knows which two players are the Lancelots. Both are shown without their good or evil allegiance.',
    seoLimit:
      'Does she know which Lancelot is good? No. Knowing the pair does not reveal their current sides, and a loyalty switch can change earlier conclusions.',
    seoScenario1:
      'When one Lancelot joins a failed mission, compare the whole team before deciding that this Lancelot is evil.',
    seoScenario2:
      'After a switch, reassess earlier reads. Avoid publicly naming both Lancelots without considering whether that would expose you to assassination.',
    credits: "credits to: {'@'}Robrun",
    generalTipsTitle: 'General Tips:',
    cautiousKnowledgeTitle: 'Be cautious with your knowledge:',
    cautiousKnowledgeText:
      '{guinevere} must use her awareness to subtly guide her allies towards victory without revealing her role.',
    useHintsTitle: 'Use hints wisely:',
    useHintsText: 'The ability to give subtle hints to your team without being too overt is crucial for {guinevere}.',
    balanceGameplayTitle: 'Maintain balance in your gameplay:',
    balanceGameplayText:
      "Sometimes, it's important not to appear too knowledgeable. Deliberate mistakes or silence can misdirect the forces of evil.",
  },
  ru: {
    seoHeading: 'Гвиневра в Авалоне: Ланселоты и риск убийства',
    seoTeam: 'Добро. На платформе {guinevere} также может стать целью финального убийства.',
    seoAbility: 'Гвиневра знает двух игроков с ролями Ланселотов. Их принадлежность к добру или злу ей не показана.',
    seoLimit:
      'Знает ли она светлого Ланселота? Нет. Знание пары не раскрывает текущие стороны, а смена лояльности может изменить прежние выводы.',
    seoScenario1:
      'Если один Ланселот участвовал в проваленной миссии, оцените весь состав, прежде чем считать именно его злым.',
    seoScenario2:
      'После смены сторон пересмотрите прежние догадки. Прежде чем публично назвать обоих Ланселотов, оцените риск выдать себя под убийство.',
    credits: "благодарности: {'@'}Robrun",
    generalTipsTitle: 'Общие советы:',
    cautiousKnowledgeTitle: 'Будьте осторожны со своими знаниями:',
    cautiousKnowledgeText:
      '{guinevere} должна использовать свою осведомлённость, чтобы незаметно направлять своих союзников к победе, не выдавая свою роль.',
    useHintsTitle: 'Используйте подсказки разумно:',
    useHintsText:
      'Способность давать команде тонкие подсказки, не будучи слишком откровенной, имеет решающее значение для {guinevere}.',
    balanceGameplayTitle: 'Соблюдайте баланс в игре:',
    balanceGameplayText:
      'Иногда важно не казаться слишком осведомлённым. Намеренные ошибки или молчание могут запутать силы зла.',
  },
  'zh-CN': {
    seoHeading: '阿瓦隆女皇：兰斯洛特信息与刺杀规则',
    seoTeam: '好人。本站的{guinevere}也可以成为刺杀目标。',
    seoAbility: '女皇知道哪两名玩家是兰斯洛特，但看不到谁是好人、谁是坏人。',
    seoLimit: '女皇知道正义兰斯洛特是谁吗？不知道。认出两人不等于知道当前阵营，阵营转换也可能改变先前的判断。',
    seoScenario1: '一名兰斯洛特参加失败任务时，要分析整个队伍，不能直接认定是他出失败。',
    seoScenario2: '阵营转换后重新评估先前判断。公开指出两名兰斯洛特前，先考虑是否会暴露自己并遭到刺杀。',
    credits: "鸣谢:{'@'}Robrun",
    generalTipsTitle: '基本提示:',
    cautiousKnowledgeTitle: '谨慎对待你的知识:',
    cautiousKnowledgeText: '{guinevere}必须利用她的洞察力,巧妙地引导盟友走向胜利,同时不暴露自己的角色。',
    useHintsTitle: '巧妙使用提示:',
    useHintsText: '为团队提供细腻提示而不过于直白,对于{guinevere}来说至关重要。',
    balanceGameplayTitle: '保持游戏平衡:',
    balanceGameplayText: '有时候,看起来过于博学并不理想。有意的失误或沉默可能会引导邪恶势力走向错误方向。',
  },
  'zh-TW': {
    seoHeading: '阿瓦隆女皇：蘭斯洛特資訊與刺殺規則',
    seoTeam: '好人。本站的{guinevere}也可以成為刺殺目標。',
    seoAbility: '女皇知道哪兩名玩家是蘭斯洛特，但看不到誰是好人、誰是壞人。',
    seoLimit: '女皇知道正義蘭斯洛特是誰嗎？不知道。認出兩人不等於知道目前陣營，陣營轉換也可能改變先前的判斷。',
    seoScenario1: '一名蘭斯洛特參加失敗任務時，要分析整個隊伍，不能直接認定是他出失敗。',
    seoScenario2: '陣營轉換後重新評估先前判斷。公開指出兩名蘭斯洛特前，先考慮是否會暴露自己並遭到刺殺。',
    credits: "鳴謝:{'@'}Robrun",
    generalTipsTitle: '基本提示:',
    cautiousKnowledgeTitle: '謹慎對待你的知識:',
    cautiousKnowledgeText: '{guinevere}必須運用她的覺察,巧妙地引導盟友邁向勝利,同時不暴露自己的身分。',
    useHintsTitle: '明智運用提示:',
    useHintsText: '在不過於明顯的情況下給予隊伍細微提示的能力對{guinevere}至關重要。',
    balanceGameplayTitle: '保持遊戲平衡:',
    balanceGameplayText: '有時候,看起來過於博識並不理想。有意的錯誤或沉默可能誤導邪惡勢力。',
  },
  es: {
    seoHeading: 'Ginebra en Avalon: Lancelots y asesinato',
    seoTeam: 'Bien. En esta plataforma, {guinevere} también puede ser objetivo de asesinato.',
    seoAbility: 'Ginebra sabe qué dos jugadores son los Lancelots. No ve cuál pertenece al bien y cuál al mal.',
    seoLimit:
      '¿Sabe cuál es el Lancelot bueno? No. Conocer a la pareja no revela sus bandos actuales, y un cambio de lealtad puede alterar las deducciones anteriores.',
    seoScenario1:
      'Si un Lancelot participa en una misión fallida, analiza a todo el equipo antes de atribuirle el Fracaso.',
    seoScenario2:
      'Tras un cambio de bandos, revisa tus deducciones. Nombrar públicamente a ambos Lancelots puede exponerte al asesinato.',
    credits: "créditos a: {'@'}Robrun",
    generalTipsTitle: 'Consejos Generales:',
    cautiousKnowledgeTitle: 'Ten cuidado con tu conocimiento:',
    cautiousKnowledgeText:
      '{guinevere} debe utilizar su conocimiento para guiar sutilmente a sus aliados hacia la victoria sin revelar su rol.',
    useHintsTitle: 'Usa las pistas sabiamente:',
    useHintsText:
      'La capacidad de dar sugerencias sutiles a tu equipo sin ser demasiado evidente es crucial para {guinevere}.',
    balanceGameplayTitle: 'Mantén el equilibrio en tu juego:',
    balanceGameplayText:
      'A veces, es importante no parecer demasiado omnisciente. Errores deliberados o el silencio pueden desviar la atención de las fuerzas del mal.',
  },
  pt: {
    seoHeading: 'Guinevere em Avalon: Lancelots e assassinato',
    seoTeam: 'Bem. Nesta plataforma, {guinevere} também pode ser alvo de assassinato.',
    seoAbility: 'Guinevere sabe quais dois jogadores são os Lancelots. Não vê qual está do lado do bem ou do mal.',
    seoLimit:
      'Ela sabe qual Lancelot é bom? Não. Conhecer a dupla não revela os lados atuais, e uma troca de lealdade pode mudar as deduções anteriores.',
    seoScenario1:
      'Se um Lancelot participar de uma missão fracassada, analise toda a equipe antes de atribuir a Falha a ele.',
    seoScenario2:
      'Após uma troca, reveja suas deduções. Nomear os dois Lancelots publicamente pode expor você ao assassinato.',
    credits: "créditos para: {'@'}Robrun",
    generalTipsTitle: 'Dicas Gerais:',
    cautiousKnowledgeTitle: 'Seja cautelosa com seu conhecimento:',
    cautiousKnowledgeText:
      '{guinevere} deve usar sua percepção para sutilmente guiar seus aliados em direção à vitória sem revelar seu papel.',
    useHintsTitle: 'Use dicas com sabedoria:',
    useHintsText: 'A capacidade de dar dicas sutis à sua equipe sem ser muito óbvia é crucial para {guinevere}.',
    balanceGameplayTitle: 'Mantenha equilíbrio em sua jogabilidade:',
    balanceGameplayText:
      'Às vezes, é importante não parecer muito conhecedora. Erros deliberados ou silêncio podem desorientar as forças do mal.',
  },
};
