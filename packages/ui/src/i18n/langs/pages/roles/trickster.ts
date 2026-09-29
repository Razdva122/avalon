import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const trickster: { [key in TLanguage]: Dictionary<string> } = {
  pt: {
    seoHeading: 'Trapaceiro em Avalon: falsa lealdade e Merlin',
    seoTeam: 'Mal. Uma verificação que indica bem não muda seu lado real.',
    seoAbility:
      'Aqui, {trickster} parece bom nas verificações de lealdade de {ladyOfLake}, {cleric} e na verificação concedida por {witch}.',
    seoLimit:
      'Ele se esconde de Merlin? Não: {merlin} o vê como mau. {troublemaker} tem o efeito contrário: é bom, mas sua lealdade verificada aparece como má.',
    seoScenario1:
      'Uma verificação boa pode apoiar seu blefe, mas não prova que uma missão fracassada não tinha jogadores do mal.',
    seoScenario2:
      'Se os argumentos de Merlin contradisserem uma verificação boa, não reaja expondo conhecimento privado: os outros não sabem se o Trapaceiro explica a contradição.',
    generalTipsTitle: 'Dicas Gerais:',
    generalTipsCultivateTrustTitle: 'Cultive uma persona confiável:',
    generalTipsCultivateTrust: `
			Enganar outros jogadores com sucesso requer construir credibilidade. Aja de forma consistente e ajude a completar
			missões para ganhar confiança.
		`,
    generalTipsCreateConfusionTitle: 'Crie confusão:',
    generalTipsCreateConfusion: `
			Semeie dúvidas sobre os papéis dos outros sutilmente, desviando a suspeita de si mesmo e direcionando-a
			para membros reais do lado do bem.
		`,
    generalTipsMonitorInfluenceTitle: 'Monitore sua influência:',
    generalTipsMonitorInfluence: `
			Acompanhe como os outros o percebem e ajuste sua estratégia para manter seu disfarce.
		`,
  },
  en: {
    seoHeading: 'Trickster in Avalon: False Loyalty & Merlin',
    seoTeam: 'Evil. A good result from a loyalty check does not change your actual team.',
    seoAbility:
      'On this platform, {trickster} appears good to loyalty checks, including {ladyOfLake}, {cleric} and the check granted by {witch}.',
    seoLimit:
      'Is the Trickster hidden from Merlin? No. {merlin} still sees this role as evil. {troublemaker} has the opposite effect: a good player whose checked loyalty appears evil.',
    seoScenario1:
      'A good check result can support your bluff, but it is not proof that no evil player was on a failed mission.',
    seoScenario2:
      'If Merlin’s public reasoning contradicts a good check result, avoid reacting with private certainty: other players do not know whether Trickster is the explanation.',
    generalTipsTitle: 'General Tips:',
    generalTipsCultivateTrustTitle: 'Cultivate a trustworthy persona:',
    generalTipsCultivateTrust: `
			Successfully fooling other players requires building credibility. Act consistently and help complete 
			quests to gain trust.
		`,
    generalTipsCreateConfusionTitle: 'Create confusion:',
    generalTipsCreateConfusion: `
			Sow seeds of doubt about other's roles subtly, drawing suspicion away from yourself and onto 
			actual members of the good side.
		`,
    generalTipsMonitorInfluenceTitle: 'Monitor your influence:',
    generalTipsMonitorInfluence: `
			Keep track of how others perceive you and adjust your strategy to maintain your disguise.
		`,
  },
  ru: {
    seoHeading: 'Трикстер в Авалоне: ложная лояльность и Мерлин',
    seoTeam: 'Зло. Добрый результат проверки не меняет вашу настоящую сторону.',
    seoAbility:
      'На платформе {trickster} выглядит добрым при проверках лояльности: {ladyOfLake}, {cleric} и проверке, которую даёт {witch}.',
    seoLimit:
      'Скрыт ли Трикстер от Мерлина? Нет, {merlin} видит его злым. {troublemaker} работает наоборот: добрый игрок с результатом проверки «зло».',
    seoScenario1: 'Добрая проверка может поддержать ваш блеф, но не доказывает отсутствие злых в проваленной миссии.',
    seoScenario2:
      'Если рассуждения Мерлина противоречат доброй проверке, не выдавайте реакцией тайные знания: остальные не знают, объясняется ли это Трикстером.',
    generalTipsTitle: 'Общие советы:',
    generalTipsCultivateTrustTitle: 'Создайте доверительный образ:',
    generalTipsCultivateTrust: `
		 Успешный обман других игроков требует построения доверия. Действуйте последовательно и помогайте завершать 
		 задания, чтобы завоевать доверие.
		`,
    generalTipsCreateConfusionTitle: 'Создайте путаницу:',
    generalTipsCreateConfusion: `
		 Сейте сомнения в отношении ролей других, тем самым отвлекая подозрения от себя на настоящих членов светлой стороны.
		`,
    generalTipsMonitorInfluenceTitle: 'Следите за своим влиянием:',
    generalTipsMonitorInfluence: `
		 Наблюдайте, как вас воспринимают другие, и корректируйте свою стратегию, чтобы поддерживать свой маскарад.
		`,
  },
  'zh-CN': {
    seoHeading: '阿瓦隆骗子：假阵营查验与梅林视野',
    seoTeam: '坏人。查验显示好人不会改变你的真实阵营。',
    seoAbility: '本站{trickster}在阵营查验中显示为好人，包括{ladyOfLake}、{cleric}及{witch}提供的查验。',
    seoLimit: '骗子能躲过梅林吗？不能，{merlin}仍看到他是坏人。{troublemaker}正好相反：本身是好人，查验却显示坏人。',
    seoScenario1: '好人查验结果可以支持你的伪装，但不证明失败任务中没有坏人。',
    seoScenario2: '如果梅林的公开推理与好人查验结果冲突，不要用反应暴露私有信息：其他人不知道是否由骗子造成。',
    generalTipsTitle: '一般提示:',
    generalTipsCultivateTrustTitle: '培养可信的人设:',
    generalTipsCultivateTrust: `
		 成功欺骗其他玩家需要建立信誉。行为一致并帮助完成任务以获取信任。
		`,
    generalTipsCreateConfusionTitle: '制造混乱:',
    generalTipsCreateConfusion: `
		 巧妙地在其他角色上播下怀疑的种子，转移注意力，避免真正的正义方成员受怀疑。
		`,
    generalTipsMonitorInfluenceTitle: '监控你的影响力:',
    generalTipsMonitorInfluence: `
		 跟踪其他人对你的看法，并调整策略以维持你的掩饰。
		`,
  },
  'zh-TW': {
    seoHeading: '阿瓦隆騙子：假陣營查驗與梅林視野',
    seoTeam: '壞人。查驗顯示好人不會改變你的真實陣營。',
    seoAbility: '本站{trickster}在陣營查驗中顯示為好人，包括{ladyOfLake}、{cleric}及{witch}提供的查驗。',
    seoLimit: '騙子能躲過梅林嗎？不能，{merlin}仍看到他是壞人。{troublemaker}正好相反：本身是好人，查驗卻顯示壞人。',
    seoScenario1: '好人查驗結果可以支持你的偽裝，但不證明失敗任務中沒有壞人。',
    seoScenario2: '如果梅林的公開推理與好人查驗結果衝突，不要用反應暴露私有資訊：其他人不知道是否由騙子造成。',
    generalTipsTitle: '一般提示:',
    generalTipsCultivateTrustTitle: '建立可信形象:',
    generalTipsCultivateTrust: `
		 成功地愚弄其他玩家需要建立信任。行為一致並協助完成任務以獲取信任。
		`,
    generalTipsCreateConfusionTitle: '製造混亂:',
    generalTipsCreateConfusion: `
		 以巧妙的方式在其他角色中播下懷疑的種子，把懷疑的焦點移離自己而指向真正的正義方成員。
		`,
    generalTipsMonitorInfluenceTitle: '監控影響力:',
    generalTipsMonitorInfluence: `
		 跟踪他人對你的看法，並調整策略以維持你的掩飾。
		`,
  },
  es: {
    seoHeading: 'Tramposo en Avalon: falsa lealtad y Merlín',
    seoTeam: 'Mal. Una comprobación que indique bien no cambia tu bando real.',
    seoAbility:
      'Aquí, {trickster} aparece como bueno ante comprobaciones de lealtad: {ladyOfLake}, {cleric} y la comprobación otorgada por {witch}.',
    seoLimit:
      '¿Se oculta de Merlín? No: {merlin} lo ve como malvado. {troublemaker} funciona al revés: es bueno pero su lealtad comprobada aparece como mala.',
    seoScenario1:
      'Un resultado bueno puede apoyar tu engaño, pero no demuestra que una misión fallida careciera de jugadores malvados.',
    seoScenario2:
      'Si los argumentos de Merlín contradicen una comprobación buena, no reacciones revelando información privada: los demás no saben si el Tramposo explica la contradicción.',
    generalTipsTitle: 'Consejos Generales:',
    generalTipsCultivateTrustTitle: 'Cultiva una personalidad confiable:',
    generalTipsCultivateTrust: `
		 Engañar con éxito a otros jugadores requiere construir credibilidad. Actúa consistentemente y ayuda a completar 
		 misiones para ganar confianza.
		`,
    generalTipsCreateConfusionTitle: 'Crea confusión:',
    generalTipsCreateConfusion: `
		 Siembra dudas sobre los roles de los demás sutilmente, desviando la sospecha de ti mismo hacia los verdaderos 
		 miembros del lado bueno.
		`,
    generalTipsMonitorInfluenceTitle: 'Monitorea tu influencia:',
    generalTipsMonitorInfluence: `
		 Observa cómo los demás te perciben y ajusta tu estrategia para mantener tu disfraz.
		`,
  },
};
