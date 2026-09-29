import type { TLanguage } from '@/i18n/interface';
import type { Dictionary } from '@avalon/types';

export const lady: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoIntro:
      "The {ladyOfLake} is an optional Avalon expansion for privately checking a player's displayed loyalty. It is a token passed between players, not a character role. These rules describe play on this site.",
    seoRule1:
      'The first holder is the player to the right of the first leader. Checks take place before team selection for missions 3, 4 and 5, if the game reaches them; rejected teams do not create extra checks.',
    seoRule2:
      'Choose another player who has never held this Lady. Only the holder receives the check result: good or evil, not the exact character. Announce a result to the table, then pass the token to the checked player.',
    seoRule3:
      'You cannot check yourself or any previous holder, including the starting holder. The checked player becomes the next holder; this does not mean they must be trusted.',
    seoLimit1:
      "Can you lie about the Lady's result? Yes. The private result and the holder's public claim are different things. Compare the claim with votes and mission results.",
    seoLimit2:
      'Does the Lady reveal Mordred? {mordred} appears evil despite being hidden from Merlin. {trickster} appears good and {troublemaker} appears evil. Unlike {ladyOfSea}, this Lady does not name an evil role.',
    seoScenario1:
      'After mission 2, Alice checks Bob and passes him the token. Before mission 4, Bob must choose someone who has not held it; he cannot check Alice back.',
    seoScenario2:
      'A good result does not prove someone is {merlin}: many good roles have that result, and {trickster} also appears good.',
    seoHeading: 'Lady of the Lake in Avalon: rules and loyalty checks',
  },
  ru: {
    seoIntro:
      '{ladyOfLake} — дополнение Авалона для тайной проверки отображаемой лояльности игрока. Это передаваемый жетон, а не отдельная роль. Ниже описаны правила игры на этом сайте.',
    seoRule1:
      'Первый владелец — игрок справа от первого лидера. Проверки проходят перед сбором команды на миссии 3, 4 и 5, если игра до них дошла. Отклонённая команда не даёт дополнительной проверки.',
    seoRule2:
      'Выберите другого игрока, который ещё не владел этой Леди. Только владелец узнаёт результат: добро или зло, без точной роли. Затем он объявляет результат столу и передаёт жетон проверенному игроку.',
    seoRule3:
      'Нельзя проверять себя и любого прежнего владельца, включая первого. Проверенный игрок получает право следующей проверки, но это само по себе не делает его надёжным союзником.',
    seoLimit1:
      'Можно ли лгать о результате Леди? Да. Тайный результат и публичное заявление владельца — разные вещи. Сопоставляйте слова с голосованиями и исходами миссий.',
    seoLimit2:
      'Видит ли Леди Мордреда? {mordred} определяется как зло, хотя скрыт от Мерлина. {trickster} выглядит добрым, а {troublemaker} — злым. Точную злую роль может показать {ladyOfSea}; Леди Озера её не называет.',
    seoScenario1:
      'После миссии 2 Анна проверяет Бориса и передаёт ему жетон. Перед миссией 4 Борис должен выбрать того, кто ещё не владел Леди: проверить Анну в ответ нельзя.',
    seoScenario2:
      'Результат «добро» не доказывает, что игрок — {merlin}: так выглядят многие добрые роли, а также {trickster}.',
    seoHeading: 'Леди Озера в Авалоне: правила и проверка лояльности',
  },
  es: {
    seoIntro:
      'La {ladyOfLake} es una expansión opcional de Avalon para consultar en privado la lealtad mostrada de un jugador. Es una ficha que cambia de manos, no un personaje. Estas reglas describen la versión del sitio.',
    seoRule1:
      'La recibe primero quien está a la derecha del primer líder. Se usa antes de formar los equipos de las misiones 3, 4 y 5, si la partida llega a ellas. Rechazar un equipo no genera otra consulta.',
    seoRule2:
      'Elige a otro jugador que nunca haya tenido esta Dama. Solo el portador ve el resultado: bien o mal, sin el personaje exacto. Anuncia un resultado y entrega la ficha al jugador consultado.',
    seoRule3:
      'No puedes consultarte a ti mismo ni a ningún portador anterior, incluido el inicial. El jugador consultado será el siguiente portador; eso no demuestra que sea de confianza.',
    seoLimit1:
      '¿Se puede mentir sobre el resultado? Sí. La información privada y lo que anuncia el portador son cosas distintas. Contrasta sus palabras con votos y resultados de misiones.',
    seoLimit2:
      '¿La Dama detecta a Mordred? {mordred} aparece como mal aunque Merlín no lo vea. {trickster} aparece como bien y {troublemaker} como mal. A diferencia de la {ladyOfSea}, no identifica el personaje malvado.',
    seoScenario1:
      'Tras la misión 2, Ana consulta a Bruno y le entrega la ficha. Antes de la misión 4, Bruno debe elegir a alguien que no la haya tenido: no puede consultar a Ana.',
    seoScenario2:
      'Un resultado de bien no identifica a {merlin}: muchas funciones buenas muestran ese resultado, y también {trickster}.',
    seoHeading: 'Dama del Lago en Avalon: reglas y lealtad',
  },
  pt: {
    seoIntro:
      'A {ladyOfLake} é uma expansão opcional de Avalon para verificar em segredo a lealdade exibida de um jogador. É uma ficha que muda de mãos, não um personagem. Estas regras descrevem a versão do site.',
    seoRule1:
      'O primeiro portador é quem está à direita do primeiro líder. As verificações ocorrem antes de formar as equipes das missões 3, 4 e 5, se a partida chegar até elas. Equipes rejeitadas não geram verificações extras.',
    seoRule2:
      'Escolha outro jogador que nunca tenha recebido esta Dama. Só o portador vê o resultado: bem ou mal, sem o personagem exato. Anuncie um resultado e passe a ficha ao jogador verificado.',
    seoRule3:
      'Não é permitido verificar a si mesmo nem qualquer portador anterior, incluindo o inicial. Quem foi verificado recebe a próxima verificação; isso não prova que seja confiável.',
    seoLimit1:
      'É possível mentir sobre o resultado? Sim. O resultado privado e o anúncio do portador são coisas diferentes. Compare o anúncio com votos e resultados das missões.',
    seoLimit2:
      'A Dama detecta Mordred? {mordred} aparece como mal, embora Merlin não o veja. {trickster} aparece como bem e {troublemaker} como mal. Ao contrário da {ladyOfSea}, esta Dama não identifica o personagem do mal.',
    seoScenario1:
      'Após a missão 2, Ana verifica Bruno e passa a ficha a ele. Antes da missão 4, Bruno deve escolher alguém que nunca a recebeu: não pode verificar Ana de volta.',
    seoScenario2:
      'Um resultado de bem não identifica {merlin}: vários personagens do bem têm esse resultado, assim como {trickster}.',
    seoHeading: 'Dama do Lago em Avalon: regras e lealdade',
  },
  'zh-CN': {
    seoIntro:
      '{ladyOfLake}也常被称为湖中女神，是阿瓦隆中用于私下查验玩家显示阵营的扩展。它是会传递的标记，不是独立角色。以下介绍本站的玩法。',
    seoRule1:
      '首任队长右侧的玩家首先持有标记。若游戏仍在进行，分别在第3、4、5次任务组队前查验。队伍被否决不会增加查验次数。',
    seoRule2:
      '选择另一位从未持有过这枚标记的玩家。只有持有者看到查验结果：好人或坏人，不是具体角色。随后公开宣布一个结果，并把标记交给被查验者。',
    seoRule3: '不能查验自己或任何之前的持有者，包括最初持有者。被查验者获得下次查验权，但这并不证明其值得信任。',
    seoLimit1: '可以谎报湖中仙女的结果吗？可以。私下看到的结果与公开说法是两回事，应结合投票和任务结果判断。',
    seoLimit2:
      '湖中仙女能查到莫德雷德吗？{mordred}虽然不被梅林看见，查验仍显示坏人。{trickster}显示好人，{troublemaker}显示坏人。与{ladyOfSea}不同，它不显示具体的坏人角色。',
    seoScenario1: '任务2结束后，甲查验乙并交出标记。任务4组队前，乙必须选择从未持有过标记的人，不能回查甲。',
    seoScenario2: '查验显示好人不代表对方就是{merlin}：许多好人角色都显示好人，{trickster}也一样。',
    seoHeading: '阿瓦隆湖中仙女（湖中女神）：查验规则与传递顺序',
  },
  'zh-TW': {
    seoIntro:
      '{ladyOfLake}也常被稱為湖中女神，是阿瓦隆中用於私下查驗玩家顯示陣營的擴充。它是會傳遞的標記，不是獨立角色。以下介紹本站的玩法。',
    seoRule1:
      '首任隊長右側的玩家首先持有標記。若遊戲仍在進行，分別在第3、4、5次任務組隊前查驗。隊伍被否決不會增加查驗次數。',
    seoRule2:
      '選擇另一位從未持有過這枚標記的玩家。只有持有者看到查驗結果：好人或壞人，不是具體角色。隨後公開宣布一個結果，並把標記交給被查驗者。',
    seoRule3: '不能查驗自己或任何之前的持有者，包括最初持有者。被查驗者獲得下次查驗權，但這並不證明其值得信任。',
    seoLimit1: '可以謊報湖中仙女的結果嗎？可以。私下看到的結果與公開說法是兩回事，應結合投票和任務結果判斷。',
    seoLimit2:
      '湖中仙女能查到莫德雷德嗎？{mordred}雖然不被梅林看見，查驗仍顯示壞人。{trickster}顯示好人，{troublemaker}顯示壞人。與{ladyOfSea}不同，它不顯示具體的壞人角色。',
    seoScenario1: '任務2結束後，甲查驗乙並交出標記。任務4組隊前，乙必須選擇從未持有過標記的人，不能回查甲。',
    seoScenario2: '查驗顯示好人不代表對方就是{merlin}：許多好人角色都顯示好人，{trickster}也一樣。',
    seoHeading: '阿瓦隆湖中仙女（湖中女神）：查驗規則與傳遞順序',
  },
};
