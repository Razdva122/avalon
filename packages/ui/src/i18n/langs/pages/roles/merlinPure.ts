import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const merlinPure: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoHeading: 'Merlin Pure in Avalon: Visible Roles & Exceptions',
    seoTeam: 'Good. Like {merlin}, you must help good win while surviving the final assassination.',
    seoAbility:
      '{merlinPure} sees the exact roles of the evil players visible to him, rather than only their evil allegiance. This is a platform variant of Merlin.',
    seoLimit:
      'Does Merlin Pure see every evil player? No. {mordred} and {wraith} remain hidden. More precise information does not make an unmarked player confirmed good.',
    seoScenario1:
      'Seeing {morgana} by role can help you understand her attempts to mislead {percival}. Do not reveal that private certainty in public.',
    seoScenario2:
      'If an apparently safe team fails, consider the hidden roles before accusing a player you already know to be good. Explain your reasoning through the mission history.',
    generalTipsTitle: 'General Tips:',
    tipDiscretionTitle: 'Exercise maximum discretion:',
    tipDiscretionText:
      'Your deep knowledge is both a gift and a curse. Be extremely cautious in sharing any information to avoid revealing your identity.',
    tipNuancedHintsTitle: 'Navigate with nuanced hints:',
    tipNuancedHintsText:
      'You must become adept at hinting your teammates towards the truth without being explicit, as the stakes of being identified are even higher for you.',
    tipAvoidAccusationsTitle: 'Avoid immediate direct accusations:',
    tipAvoidAccusationsText:
      'Given your comprehensive awareness, pointing out evil roles too precisely can quickly unmask you as {merlinPure}.',
  },
  ru: {
    seoHeading: 'Белый Мерлин в Авалоне: видимые роли и исключения',
    seoTeam: 'Добро. Как и {merlin}, вы помогаете добру победить и должны пережить финальное убийство.',
    seoAbility:
      '{merlinPure} видит точные роли доступных ему злых игроков, а не только их сторону. Это вариант Мерлина на платформе.',
    seoLimit:
      'Видит ли Белый Мерлин всех злых? Нет. {mordred} и {wraith} остаются скрыты. Более точная информация не делает непомеченного игрока подтверждённо добрым.',
    seoScenario1:
      'Зная, кто играет за роль {morgana}, легче понять её попытки запутать роль {percival}. Не выдавайте свою закрытую информацию публичной уверенностью.',
    seoScenario2:
      'Если предположительно безопасная команда провалила миссию, учтите скрытые роли. Обосновывайте выводы историей походов, а не раскрывайте свои знания.',
    generalTipsTitle: 'Общие советы:',
    tipDiscretionTitle: 'Проявляйте максимальную осмотрительность:',
    tipDiscretionText:
      'Ваши глубокие знания – это одновременно дар и проклятие. Будьте крайне осторожны при передаче информации, чтобы не раскрыть свою личность.',
    tipNuancedHintsTitle: 'Используйте тонкие намёки:',
    tipNuancedHintsText:
      'Вы должны научиться намекать своим товарищам на правду, оставаясь при этом неочевидным, ведь для вас ставки еще выше, если вас узнают.',
    tipAvoidAccusationsTitle: 'Избегайте прямых обвинений:',
    tipAvoidAccusationsText:
      'Учитывая вашу всеобъемлющую осведомлённость, слишком точное указание на злодейские роли может быстро выдать вас как {merlinPure}.',
  },
  'zh-TW': {
    seoHeading: '阿瓦隆終極梅林：可見角色與隱藏例外',
    seoTeam: '好人。和{merlin}一樣，你要幫助好人獲勝，並躲過最終刺殺。',
    seoAbility: '{merlinPure}能看到對他可見的壞人的具體角色，而不只是邪惡陣營。這是本站的梅林變體。',
    seoLimit: '終極梅林能看到所有壞人嗎？不能。{mordred}與{wraith}仍然隱藏。資訊更精確不代表未被標記的玩家一定是好人。',
    seoScenario1: '知道誰是{morgana}有助於理解她如何誤導{percival}，但不要在討論中暴露這份私有資訊。',
    seoScenario2: '看似安全的隊伍失敗後，應考慮隱藏角色。用任務歷史解釋推理，不要直接公開自己的特殊知識。',
    generalTipsTitle: '基本提示:',
    tipDiscretionTitle: '謹慎行事:',
    tipDiscretionText: '你深厚的知識既是天賦也是詛咒。務必小心分享任何資訊,避免暴露你的身份。',
    tipNuancedHintsTitle: '巧妙暗示:',
    tipNuancedHintsText: '你需要熟悉如何透過隱晦的暗示,引領隊友趨近真相,而不是直言不諱,因為對你來說被識破的風險更高。',
    tipAvoidAccusationsTitle: '避免直接指控:',
    tipAvoidAccusationsText: '由於你對局勢瞭若指掌,過於精確地指出邪惡角色可能會迅速暴露你作為{merlinPure}的身份。',
  },
  'zh-CN': {
    seoHeading: '阿瓦隆终极梅林：可见角色与隐藏例外',
    seoTeam: '好人。和{merlin}一样，你要帮助好人获胜，并躲过最终刺杀。',
    seoAbility: '{merlinPure}能看到对他可见的坏人的具体角色，而不只是邪恶阵营。这是本站的梅林变体。',
    seoLimit: '终极梅林能看到所有坏人吗？不能。{mordred}与{wraith}仍然隐藏。信息更精确不代表未被标记的玩家一定是好人。',
    seoScenario1: '知道谁是{morgana}有助于理解她如何误导{percival}，但不要在讨论中暴露这份私有信息。',
    seoScenario2: '看似安全的队伍失败后，应考虑隐藏角色。用任务历史解释推理，不要直接公开自己的特殊知识。',
    generalTipsTitle: '基本提示:',
    tipDiscretionTitle: '谨慎行事:',
    tipDiscretionText: '你深厚的知识既是天赋也是负担。务必谨慎分享任何信息,以免暴露你的身份。',
    tipNuancedHintsTitle: '巧妙暗示:',
    tipNuancedHintsText: '你必须擅长用含蓄的提示来引导队友找到真相,而不是直截了当,因为你被揭露的风险更高。',
    tipAvoidAccusationsTitle: '避免直接指控:',
    tipAvoidAccusationsText: '由于你掌握了全面的信息,过于精准地指出邪恶角色会迅速暴露你作为{merlinPure}的身份。',
  },
  es: {
    seoHeading: 'Merlín Puro en Avalon: roles visibles y excepciones',
    seoTeam: 'Bien. Como {merlin}, ayudas al bien a ganar y debes sobrevivir al asesinato final.',
    seoAbility:
      '{merlinPure} ve los roles exactos de los malvados visibles para él, en lugar de solo su bando. Es una variante de Merlín de esta plataforma.',
    seoLimit:
      '¿Ve a todos los malvados? No. {mordred} y {wraith} siguen ocultos. La información más precisa no confirma que un jugador no señalado sea bueno.',
    seoScenario1:
      'Reconocer a {morgana} te ayuda a entender cómo intenta engañar a {percival}. No reveles esa certeza privada en público.',
    seoScenario2:
      'Si falla un equipo aparentemente seguro, considera los roles ocultos. Explica tus deducciones mediante el historial de misiones, sin exponer tus conocimientos.',
    generalTipsTitle: 'Consejos Generales:',
    tipDiscretionTitle: 'Ejercita la máxima discreción:',
    tipDiscretionText:
      'Tu profundo conocimiento es a la vez un don y una maldición. Sé extremadamente cauteloso al compartir cualquier información para evitar revelar tu identidad.',
    tipNuancedHintsTitle: 'Utiliza sugerencias sutiles:',
    tipNuancedHintsText:
      'Debes ser capaz de insinuar a tus compañeros la verdad sin ser demasiado explícito, ya que las consecuencias de ser identificado son aún mayores para ti.',
    tipAvoidAccusationsTitle: 'Evita acusaciones directas inmediatas:',
    tipAvoidAccusationsText:
      'Dado tu amplio conocimiento, señalar roles malignos con demasiada precisión puede delatarte rápidamente como {merlinPure}.',
  },
  pt: {
    seoHeading: 'Merlin Puro em Avalon: papéis visíveis e exceções',
    seoTeam: 'Bem. Como {merlin}, você ajuda o bem a vencer e precisa sobreviver ao assassinato final.',
    seoAbility:
      '{merlinPure} vê os papéis exatos dos jogadores do mal visíveis para ele, em vez de apenas sua lealdade. É uma variante de Merlin desta plataforma.',
    seoLimit:
      'Ele vê todos os jogadores do mal? Não. {mordred} e {wraith} continuam ocultos. Informação mais precisa não confirma que um jogador não marcado seja bom.',
    seoScenario1:
      'Reconhecer {morgana} ajuda a entender suas tentativas de enganar {percival}. Não exponha essa certeza privada em público.',
    seoScenario2:
      'Se uma equipe aparentemente segura falhar, considere os papéis ocultos. Explique suas deduções pelo histórico de missões sem revelar seus conhecimentos.',
    generalTipsTitle: 'Dicas Gerais:',
    tipDiscretionTitle: 'Exerça máxima discrição:',
    tipDiscretionText:
      'Seu conhecimento profundo é tanto um presente quanto uma maldição. Seja extremamente cauteloso ao compartilhar qualquer informação para evitar revelar sua identidade.',
    tipNuancedHintsTitle: 'Navegue com dicas sutis:',
    tipNuancedHintsText:
      'Você deve se tornar hábil em dar dicas aos seus companheiros de equipe em direção à verdade sem ser explícito, já que os riscos de ser identificado são ainda maiores para você.',
    tipAvoidAccusationsTitle: 'Evite acusações diretas imediatas:',
    tipAvoidAccusationsText:
      'Dado seu conhecimento abrangente, apontar papéis do mal com muita precisão pode rapidamente desmascarar você como {merlinPure}.',
  },
};
