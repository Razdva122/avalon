import type { TLanguage } from '@/i18n/interface';
import type { Dictionary } from '@avalon/types';

export const ladySea: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    seoIntro:
      "The {ladyOfSea} is this site's alternative to {ladyOfLake}. It gives more detail about evil players: a visible evil role instead of only an evil loyalty result.",
    seoRule1:
      'The player to the right of the first leader starts with the token. Use it before team selection for missions 3, 4 and 5, if reached, with no extra check after a rejected team.',
    seoRule2:
      'Choose another player who has never held this Lady. Read the private result, announce good or an evil role, then pass the token to the checked player. Yourself and previous holders are ineligible.',
    seoRule3:
      'A normally good player appears as good, without their exact role. A normally evil player reveals their role. A public statement may be false; it is not the private result everyone can verify.',
    seoLimit1:
      'Does Lady of the Sea reveal every role? No. {trickster} appears good. The good {troublemaker} appears as an evil role selected from the game, so an evil role result is not infallible.',
    seoLimit2:
      "Can both Ladies be enabled? The room settings make {ladyOfSea} and {ladyOfLake} alternatives. Choose one; the Sea version adds role information but retains the token's checking restrictions.",
    seoScenario1:
      'Checking {mordred} reveals Mordred, even though Merlin cannot see that role at the start. The holder may still announce a different result.',
    seoScenario2:
      'Checking {merlin} shows good, not Merlin. Do not treat the Sea token as a way to identify every good character.',
    seoHeading: 'Lady of the Sea in Avalon: rules and revealed roles',
  },
  ru: {
    seoIntro:
      '{ladyOfSea} — альтернативный вариант дополнения «{ladyOfLake}» на этом сайте. Она даёт больше сведений о злых игроках: показывает видимую злую роль, а не только результат «зло».',
    seoRule1:
      'Первым жетон получает игрок справа от первого лидера. Проверки проходят перед сбором команды на миссии 3, 4 и 5, если игра продолжается. Отклонение команды не добавляет проверку.',
    seoRule2:
      'Выберите другого игрока, ещё не владевшего этой Леди. Прочитайте тайный результат, объявите добро или злую роль и передайте жетон проверенному. Себя и прежних владельцев выбирать нельзя.',
    seoRule3:
      'Обычный добрый игрок виден как добро, без точной роли. У обычного злого игрока видна роль. Публичное объявление может быть ложным: остальные не получают сам тайный результат.',
    seoLimit1:
      'Раскрывает ли Леди Моря любую роль? Нет. {trickster} выглядит добрым. Добрый {troublemaker} показывается как выбранная из состава игры злая роль, поэтому такой результат не безошибочен.',
    seoLimit2:
      'Можно ли включить обеих Леди? В настройках комнаты {ladyOfSea} и {ladyOfLake} взаимоисключающие. Выберите одну: морская версия добавляет сведения о ролях, сохраняя ограничения проверки.',
    seoScenario1:
      'Если проверяемый — {mordred}, Леди показывает его роль, хотя Мерлин не видит его на старте. Владелец жетона всё равно может объявить другой результат.',
    seoScenario2:
      'Если проверяемый — {merlin}, результат будет «добро», а не «Мерлин». Морской жетон не позволяет узнавать точные роли всех добрых игроков.',
    seoHeading: 'Леди Моря в Авалоне: правила и раскрытие злых ролей',
  },
  es: {
    seoIntro:
      'La {ladyOfSea} es la alternativa del sitio a la {ladyOfLake}. Ofrece más información sobre el mal: muestra el personaje malvado visible en vez de indicar solo su lealtad.',
    seoRule1:
      'Empieza con la ficha quien está a la derecha del primer líder. Se usa antes de formar los equipos de las misiones 3, 4 y 5, si se alcanzan. Un equipo rechazado no añade otra consulta.',
    seoRule2:
      'Elige a otro jugador que nunca haya tenido esta Dama. Lee el resultado privado, anuncia bien o un personaje malvado y pasa la ficha al jugador consultado. No puedes elegirte ni elegir a portadores anteriores.',
    seoRule3:
      'Un jugador bueno normal aparece como bien, sin su personaje exacto. Un jugador malvado normal muestra su personaje. El anuncio público puede ser falso; los demás no ven el resultado privado.',
    seoLimit1:
      '¿Revela todos los personajes? No. {trickster} aparece como bien. {troublemaker}, que es bueno, aparece como un personaje malvado elegido entre los presentes. El resultado no es infalible.',
    seoLimit2:
      '¿Se pueden activar ambas Damas? Los ajustes de sala permiten elegir entre {ladyOfSea} y {ladyOfLake}, no ambas. La versión del Mar añade información de personajes y mantiene las restricciones de la ficha.',
    seoScenario1:
      'Consultar a {mordred} revela a Mordred, aunque Merlín no lo vea al inicio. El portador puede anunciar un resultado distinto.',
    seoScenario2:
      'Consultar a {merlin} muestra bien, no Merlín. La ficha no permite identificar a todos los personajes buenos.',
    seoHeading: 'Dama del Mar en Avalon: reglas y personajes revelados',
  },
  pt: {
    seoIntro:
      'A {ladyOfSea} é a alternativa do site à {ladyOfLake}. Ela dá mais detalhes sobre o mal: revela o personagem do mal visível em vez de mostrar apenas a lealdade.',
    seoRule1:
      'Quem está à direita do primeiro líder começa com a ficha. Use-a antes de formar as equipes das missões 3, 4 e 5, se ocorrerem. Rejeitar uma equipe não gera outra verificação.',
    seoRule2:
      'Escolha outro jogador que nunca tenha recebido esta Dama. Leia o resultado privado, anuncie bem ou um personagem do mal e passe a ficha ao jogador verificado. Você e os portadores anteriores não podem ser alvos.',
    seoRule3:
      'Um jogador comum do bem aparece como bem, sem o personagem exato. Um jogador comum do mal revela seu personagem. O anúncio público pode ser falso; os demais não veem o resultado privado.',
    seoLimit1:
      'A Dama do Mar revela todos os personagens? Não. {trickster} aparece como bem. O {troublemaker}, que é do bem, aparece como um personagem do mal escolhido entre os presentes. O resultado não é infalível.',
    seoLimit2:
      'É possível ativar as duas Damas? Os ajustes da sala permitem {ladyOfSea} ou {ladyOfLake}, não ambas. A versão do Mar acrescenta informação sobre personagens e mantém as restrições da ficha.',
    seoScenario1:
      'Verificar {mordred} revela Mordred, embora Merlin não o veja no início. O portador ainda pode anunciar outro resultado.',
    seoScenario2: 'Verificar {merlin} mostra bem, não Merlin. A ficha não identifica todos os personagens do bem.',
    seoHeading: 'Dama do Mar em Avalon: regras e personagens revelados',
  },
  'zh-CN': {
    seoIntro:
      '{ladyOfSea}是本站中{ladyOfLake}的替代选项。它提供更详细的坏人信息：显示可见的坏人角色，而不只是坏人阵营。',
    seoRule1:
      '首任队长右侧的玩家首先持有标记。若游戏进行到相应阶段，在第3、4、5次任务组队前使用。队伍被否决不会增加查验。',
    seoRule2:
      '选择另一位从未持有过这枚标记的玩家。私下查看结果，公开宣布好人或一个坏人角色，再把标记交给被查验者。不能选择自己或之前的持有者。',
    seoRule3:
      '一般好人只显示好人，不显示具体角色；一般坏人会显示角色。公开声明可以是谎言，其他玩家看不到私下的实际结果。',
    seoLimit1:
      '海中仙女会揭示所有角色吗？不会。{trickster}显示好人。好人{troublemaker}会显示为本局所选的一个坏人角色，因此坏人角色结果并非绝对可靠。',
    seoLimit2:
      '可以同时开启两位仙女吗？房间设置中{ladyOfSea}和{ladyOfLake}只能二选一。海中版本增加角色信息，但保留标记的查验限制。',
    seoScenario1: '查验{mordred}会显示莫德雷德，尽管梅林开局看不见他。持有者仍可公开宣布别的结果。',
    seoScenario2: '查验{merlin}只显示好人，不显示梅林。这个标记无法识别所有好人的具体角色。',
    seoHeading: '阿瓦隆海中仙女：查验规则与坏人角色信息',
  },
  'zh-TW': {
    seoIntro:
      '{ladyOfSea}是本站中{ladyOfLake}的替代選項。它提供更詳細的壞人資訊：顯示可見的壞人角色，而不只是壞人陣營。',
    seoRule1:
      '首任隊長右側的玩家首先持有標記。若遊戲進行到相應階段，在第3、4、5次任務組隊前使用。隊伍被否決不會增加查驗。',
    seoRule2:
      '選擇另一位從未持有過這枚標記的玩家。私下查看結果，公開宣布好人或一個壞人角色，再把標記交給被查驗者。不能選擇自己或之前的持有者。',
    seoRule3:
      '一般好人只顯示好人，不顯示具體角色；一般壞人會顯示角色。公開聲明可以是謊言，其他玩家看不到私下的實際結果。',
    seoLimit1:
      '海中仙女會揭示所有角色嗎？不會。{trickster}顯示好人。好人{troublemaker}會顯示為本局所選的一個壞人角色，因此壞人角色結果並非絕對可靠。',
    seoLimit2:
      '可以同時開啟兩位仙女嗎？房間設定中{ladyOfSea}和{ladyOfLake}只能二選一。海中版本增加角色資訊，但保留標記的查驗限制。',
    seoScenario1: '查驗{mordred}會顯示莫德雷德，儘管梅林開局看不見他。持有者仍可公開宣布別的結果。',
    seoScenario2: '查驗{merlin}只顯示好人，不顯示梅林。這個標記無法識別所有好人的具體角色。',
    seoHeading: '阿瓦隆海中仙女：查驗規則與壞人角色資訊',
  },
};
