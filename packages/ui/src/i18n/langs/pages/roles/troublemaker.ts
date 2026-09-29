import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const troublemaker: { [key in TLanguage]: Dictionary<string> } = {
  pt: {
    seoHeading: 'Encrenqueiro em Avalon: bom com verificação de mal',
    seoTeam: 'Bem. {troublemaker} vence com o bem apesar de aparecer como mau nas verificações.',
    seoAbility:
      'Aqui, as verificações de {ladyOfLake}, {cleric} e da habilidade de {witch} mostram o Encrenqueiro como mau.',
    seoLimit:
      'Precisa mentir ou jogar Falha? Não. O resultado enganoso é automático; você pode falar a verdade e deve jogar Sucesso. Essa habilidade não faz {merlin} ver você como mau.',
    seoScenario1:
      'Se uma verificação indicar mal, explique a possibilidade do Encrenqueiro quando habilitado. A afirmação não é prova: um mau pode dizer o mesmo.',
    seoScenario2:
      'Apoie sua defesa nos votos e no histórico das equipes. Compare com {trickster}, um mau cuja verificação indica bem.',
    generalTips: 'Dicas Gerais:',
    generalTipsRevealTitle: 'Revele estrategicamente',
    generalTipsRevealDesc:
      'Se sua falsa lealdade for exposta ou provavelmente questionada, revele calmamente seu verdadeiro papel como {troublemaker} para manter a confiança dentro da sua equipe.',
    generalTipsCounteractTitle: 'Neutralize personificações malignas',
    generalTipsCounteractDesc:
      'Se um jogador do mal afirmar ser o {troublemaker}, desafie rapidamente sua declaração e esclareça a situação para evitar confusão.',
  },
  en: {
    seoHeading: 'Troublemaker in Avalon: Good Role, Evil Check',
    seoTeam: 'Good. {troublemaker} wins with good despite appearing evil in loyalty checks.',
    seoAbility:
      'On this platform, checks by {ladyOfLake}, {cleric} and the ability of {witch} show the Troublemaker as evil.',
    seoLimit:
      'Must the player lie or play Fail? No. The misleading result is automatic; you may tell the truth and must play Success on missions. {merlin} does not see you as evil through this ability.',
    seoScenario1:
      'If a loyalty check says evil, explain that Troublemaker is possible when enabled. The claim alone is not proof: an evil player can make the same claim.',
    seoScenario2:
      'Support your defence with team history and votes. Compare this role with {trickster}, an evil player whose check result appears good.',
    generalTips: 'General Tips:',
    generalTipsRevealTitle: 'Reveal strategically',
    generalTipsRevealDesc:
      'If your false alignment is exposed or likely to be questioned, calmly reveal your true role as the {troublemaker} to maintain trust within your team.',
    generalTipsCounteractTitle: 'Counteract evil impersonations',
    generalTipsCounteractDesc:
      'Should an evil player claim to be the {troublemaker}, quickly challenge their statement and clarify the situation to prevent confusion.',
  },
  ru: {
    seoHeading: 'Траблмейкер в Авалоне: добро с проверкой «зло»',
    seoTeam: 'Добро. {troublemaker} побеждает с добром, хотя проверки показывают зло.',
    seoAbility: 'На платформе проверки {ladyOfLake}, {cleric} и способность роли {witch} показывают Траблмейкера злым.',
    seoLimit:
      'Нужно ли врать или давать провал? Нет. Ложный результат автоматический; сам игрок может говорить правду и обязан давать успех. Для роли {merlin} эта способность не делает вас злым.',
    seoScenario1:
      'Если проверка показала зло, объясните возможность Траблмейкера, когда он включён. Одного заявления недостаточно: злой игрок может сказать то же самое.',
    seoScenario2:
      'Подкрепляйте защиту голосами и историей команд. Сравните с ролью {trickster}: это злой игрок, чья проверка показывает добро.',
    generalTips: 'Общие советы:',
    generalTipsRevealTitle: 'Раскрывайте стратегически',
    generalTipsRevealDesc:
      'Если ваше ложное стремление к добру раскрыто или может быть подвергнуто сомнению, спокойно раскройте свою истинную роль как {troublemaker}, чтобы сохранить доверие вашей команды.',
    generalTipsCounteractTitle: 'Противодействуйте злым выкрутасам',
    generalTipsCounteractDesc:
      'Если злой игрок заявляет, что он {troublemaker}, быстро оспаривайте его заявление и проясняйте ситуацию, чтобы предотвратить путаницу.',
  },
  'zh-CN': {
    seoHeading: '阿瓦隆麻烦友：好人为何被查成坏人',
    seoTeam: '好人。{troublemaker}虽然被查为坏人，仍随好人获胜。',
    seoAbility: '本站{ladyOfLake}、{cleric}及{witch}能力提供的查验，会将麻烦友显示为坏人。',
    seoLimit:
      '玩家必须说谎或出失败吗？不用。错误的查验结果由能力自动产生；玩家可以说真话，任务必须出成功。这项能力不会让{merlin}把你看成坏人。',
    seoScenario1: '被查为坏人时，如果本局启用麻烦友，可以解释这种可能。但单凭声称角色不能证明清白，坏人也能这样说。',
    seoScenario2: '用投票和组队记录支持自己的解释。可对比{trickster}：他是真坏人，查验却显示好人。',
    generalTips: '一般提示：',
    generalTipsRevealTitle: '战略性揭示',
    generalTipsRevealDesc:
      '如果您的虚假对善的对立被揭露或可能受到质疑，请冷静地揭示您作为{troublemaker}的真实角色，以保持团队的信任。',
    generalTipsCounteractTitle: '对抗邪恶的冒充',
    generalTipsCounteractDesc: '如果一个邪恶玩家声称自己是{troublemaker}，请迅速挑战他们的声明并澄清情况，以防止混淆。',
  },
  'zh-TW': {
    seoHeading: '阿瓦隆麻煩友：好人為何被查成壞人',
    seoTeam: '好人。{troublemaker}雖然被查為壞人，仍隨好人獲勝。',
    seoAbility: '本站{ladyOfLake}、{cleric}及{witch}能力提供的查驗，會將麻煩友顯示為壞人。',
    seoLimit:
      '玩家必須說謊或出失敗嗎？不用。錯誤的查驗結果由能力自動產生；玩家可以說真話，任務必須出成功。這項能力不會讓{merlin}把你看成壞人。',
    seoScenario1: '被查為壞人時，如果本局啟用麻煩友，可以解釋這種可能。但單憑聲稱角色不能證明清白，壞人也能這樣說。',
    seoScenario2: '用投票和組隊紀錄支持自己的解釋。可對比{trickster}：他是真壞人，查驗卻顯示好人。',
    generalTips: '一般提示：',
    generalTipsRevealTitle: '戰略性揭示',
    generalTipsRevealDesc:
      '如果您的虛假對善的對立被揭露或可能受到質疑，請冷靜地揭示您作為{troublemaker}的真實角色，以保持團隊的信任。',
    generalTipsCounteractTitle: '對抗邪惡的冒充',
    generalTipsCounteractDesc: '如果一個邪惡玩家聲稱自己是{troublemaker}，請迅速挑戰他們的聲明並澄清情況，以防止混淆。',
  },
  es: {
    seoHeading: 'Problematizador en Avalon: rol bueno, comprobación mala',
    seoTeam: 'Bien. {troublemaker} gana con el bien aunque las comprobaciones indiquen mal.',
    seoAbility:
      'Aquí las comprobaciones de {ladyOfLake}, {cleric} y la habilidad de {witch} muestran al Problematizador como malvado.',
    seoLimit:
      '¿Debe mentir o jugar Fracaso? No. El resultado engañoso es automático; puedes decir la verdad y debes jugar Éxito. Esta habilidad no hace que {merlin} te vea como malvado.',
    seoScenario1:
      'Si una comprobación indica mal, explica que el Problematizador es posible cuando está incluido. Afirmarlo no lo demuestra: un malvado puede decir lo mismo.',
    seoScenario2:
      'Apoya tu defensa con votos e historial de equipos. Compáralo con {trickster}, un malvado cuya comprobación indica bien.',
    generalTips: 'Consejos Generales:',
    generalTipsRevealTitle: 'Revela estratégicamente',
    generalTipsRevealDesc:
      'Si se expone tu alineación falsa o es probable que se cuestione, revela calmadamente tu verdadero rol como el {troublemaker} para mantener la confianza dentro de tu equipo.',
    generalTipsCounteractTitle: 'Contrarresta las personificaciones malignas',
    generalTipsCounteractDesc:
      'Si un jugador maligno afirma ser el {troublemaker}, desafía rápidamente su declaración y aclara la situación para evitar confusiones.',
  },
};
