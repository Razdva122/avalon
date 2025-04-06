import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const ladySea: { [key in TLanguage]: Dictionary<string> } = {
  pt: {
    intro:
      '{ladyOfSea} é um análogo da expansão {ladyOfLake}, com a seguinte exceção: ao verificar um jogador da equipe do mal, você vê o papel dele, não apenas sua lealdade. Ao verificar um jogador da equipe do bem, tudo permanece o mesmo que com a {ladyOfLake}.',
    title: 'Regras e dicas para a "Dama do Mar":',
    howToUseTitle: 'Como usar: ',
    howToUseContent:
      ' Ao verificar jogadores, o portador da Dama tem a opção de anunciar uma equipe do bem ou um papel específico do mal',
    complicationTitle: 'Complicação para a equipe do mal: ',
    complicationContent:
      'Torna-se mais difícil para os jogadores do mal mentir sobre seu papel, pois eles devem não apenas nomear seu lado, mas também escolher um papel, o que dá à equipe do bem a oportunidade de descobrir a mentira.',
    additionalInformationTitle: 'Informação adicional para a equipe do mal: ',
    additionalInformationContent: 'Usar a Dama permite que a equipe do mal entenda o papel de seus aliados.',
    rolesTitle: 'Interação com papéis: ',
    rolesContent:
      'Ao verificar o {troublemaker}, você verá um papel aleatório do mal disponível no jogo. Ao verificar o {trickster}, você simplesmente verá a equipe do bem.',
  },
  en: {
    intro:
      '{ladyOfSea} is an analogue of the {ladyOfLake} expansion, with the following exception: when checking a player of the evil team, you see their role, not just their loyalty. When checking a player of the good team, everything remains the same as with the {ladyOfLake}.',
    title: 'Rules and hints for "Lady of sea":',
    howToUseTitle: 'How to use: ',
    howToUseContent:
      ' When checking players, the holder of the Lady is given the option to announce either a good team or a specific evil role',
    complicationTitle: 'Complication for the evil team: ',
    complicationContent:
      'It becomes more difficult for evil players to lie about their role, as they must not only name their side but also choose a role, which gives the good team the opportunity to uncover the lie.',
    additionalInformationTitle: 'Additional information for the evil team: ',
    additionalInformationContent: 'Using the Lady allows the evil team to understand the role of their allies.',
    rolesTitle: 'Interaction with roles: ',
    rolesContent:
      'When checking the {troublemaker}, you will see a random evil role available in the game. When checking the {trickster}, you will simply see the good team.',
  },
  ru: {
    intro:
      '{ladyOfSea} - это аналог дополнения {ladyOfLake}, но с одним исключением: при проверке игрока из команды зла вы увидите его роль, а не только лояльность. При проверке игрока из команды добра всё остаётся, как в {ladyOfLake}.',
    title: 'Правила и подсказки для "Леди Моря":',
    howToUseTitle: 'Как использовать: ',
    howToUseContent:
      'При проверке игроков у владельца Леди появляется возможность объявить либо команду добра, либо конкретную роль зла.',
    complicationTitle: 'Усложнение для команды зла: ',
    complicationContent:
      'Злым игрокам становится труднее лгать о своей роли, так как они должны не только назвать свою сторону, но и выбрать роль, что даёт команде добра возможность разгадать ложь.',
    additionalInformationTitle: 'Дополнительная информация для команды зла: ',
    additionalInformationContent: 'Использование Леди позволяет команде зла понять роль своих союзников.',
    rolesTitle: 'Взаимодействие с ролями: ',
    rolesContent:
      'При проверке {troublemaker} вы увидите случайную роль зла, доступную в этой игре. При проверке {trickster} вы просто увидите добрую команду.',
  },
  'zh-CN': {
    intro:
      '{ladyOfSea} 是 {ladyOfLake} 扩展的类似版本，但有一个例外：在检查邪恶团队的玩家时，你会看到他们的角色，而不仅仅是忠诚度。在检查善良团队的玩家时，一切保持与 {ladyOfLake} 相同。',
    title: '关于“海中女士”的规则和提示：',
    howToUseTitle: '如何使用：',
    howToUseContent: '在检查看玩家时，海中女士的持有者可以选择宣布是善良团队或特定的邪恶角色。',
    complicationTitle: '对邪恶团队的复杂性：',
    complicationContent:
      '邪恶玩家更难撒谎，因为他们不仅需要说明自己的立场，还需要选择角色，这给了善良团队揭穿谎言的机会。',
    additionalInformationTitle: '有关邪恶团队的额外信息：',
    additionalInformationContent: '使用海中女士可以让邪恶团队了解他们盟友的角色。',
    rolesTitle: '与角色的互动：',
    rolesContent:
      '在检查 {troublemaker} 时，你会看到游戏中可用的随机邪恶角色。检查 {trickster} 时，你只会看到善良团队。',
  },
  'zh-TW': {
    intro:
      '{ladyOfSea} 是 {ladyOfLake} 擴展的類似版本，但有一個例外：在檢查邪惡團隊的玩家時，你會看到他們的角色，而不僅僅是忠誠度。在檢查善良團隊的玩家時，一切保持與 {ladyOfLake} 相同。',
    title: '關於“海中女士”的規則和提示：',
    howToUseTitle: '如何使用：',
    howToUseContent: '在檢查玩家時，海中女士的持有者可以選擇宣佈是善良團隊或特定的邪惡角色。',
    complicationTitle: '對邪惡團隊的複雜性：',
    complicationContent:
      '邪惡玩家更難撒謊，因為他們不僅需要說明自己的立場，還需要選擇角色，這給善良團隊揭穿謊言的機會。',
    additionalInformationTitle: '有關邪惡團隊的額外信息：',
    additionalInformationContent: '使用海中女士可以讓邪惡團隊了解他們盟友的角色。',
    rolesTitle: '與角色的互動：',
    rolesContent:
      '在檢查 {troublemaker} 時，您會看到遊戲中可用的隨機邪惡角色。檢查 {trickster} 時，您只會看到善良團隊。',
  },
  es: {
    intro:
      '{ladyOfSea} es un análogo de la expansión {ladyOfLake}, con la siguiente excepción: cuando se revisa a un jugador del equipo malvado, ves su rol, no solo su lealtad. Al revisar a un jugador del equipo bueno, todo permanece igual que con {ladyOfLake}.',
    title: 'Reglas y consejos para "Dama del Mar":',
    howToUseTitle: 'Cómo usar: ',
    howToUseContent:
      'Al revisar jugadores, al poseedor de la Dama se le da la opción de anunciar ya sea un equipo bueno o un rol específico del equipo malvado.',
    complicationTitle: 'Complicación para el equipo malvado: ',
    complicationContent:
      'Se vuelve más difícil para los jugadores malvados mentir sobre su rol, ya que deben no solo nombrar su lado, sino también elegir un rol, lo que le da al equipo bueno la oportunidad de descubrir la mentira.',
    additionalInformationTitle: 'Información adicional para el equipo malvado: ',
    additionalInformationContent: 'Usar la Dama permite al equipo malvado entender el rol de sus aliados.',
    rolesTitle: 'Interacción con roles: ',
    rolesContent:
      'Al revisar al {troublemaker}, verás un rol malvado aleatorio disponible en el juego. Al revisar al {trickster}, simplemente verás al equipo bueno.',
  },
};
