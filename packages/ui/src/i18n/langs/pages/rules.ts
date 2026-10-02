import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const rules: { [key in TLanguage]: Dictionary<string> } = {
  pt: {
    variantNote:
      'No jogo de tabuleiro original, cinco equipes rejeitadas consecutivamente para a mesma missão dão a vitória ao mal. Nesta plataforma, após quatro rejeições, a quinta equipe normalmente parte sem votação; as cartas de trama podem afetar sua aprovação. No original, o Assassino faz a escolha final; aqui, o assassinato é realizado pela equipe do mal. Antes de uma partida presencial, combinem as regras e os papéis.',
    variantTitle: 'Regras do jogo de tabuleiro e desta plataforma',
    roundExample:
      'O líder escolhe duas pessoas. Se pelo menos três dos cinco jogadores aprovarem a equipe, essas duas pessoas escolhem suas cartas em segredo. Dois Sucessos completam a missão; uma Falha faz a missão fracassar. O sucesso não prova que ambos sejam do bem: um jogador do mal também pode escolher Sucesso.',
    roundExampleTitle: 'Exemplo: primeira missão com cinco jogadores',
    quickStep4:
      'Revele o resultado da missão, passe a liderança e repita a formação da equipe. Após três missões bem-sucedidas, o mal ainda pode vencer ao identificar corretamente Merlin na fase de assassinato.',
    quickStep3:
      'Somente os integrantes da equipe escolhem cartas de missão em segredo. No jogo básico, o bem deve escolher Sucesso; o mal pode escolher Sucesso ou Falha. Em geral, uma Falha basta para a missão fracassar; a quarta missão com sete ou mais jogadores exige duas.',
    quickStep2:
      'O líder escolhe a equipe conforme a tabela de jogadores abaixo. Todos votam: é preciso mais da metade dos votos a favor. Um empate rejeita a equipe.',
    quickStep1:
      'Reúna de 5 a 10 jogadores, distribua os papéis em segredo e revele a cada pessoa as informações permitidas pelo seu papel. O bem precisa de três missões bem-sucedidas; o mal, de três missões fracassadas.',
    quickStartTitle: 'Como jogar Avalon: guia rápido',
    numberOfPlayers: 'Número de Jogadores',
    missionNumber: 'Missão {number}',
    countPlayers: '{count} Jogadores',
    servantTeam: 'Servos Leais de Arthur:',
    mordredTeam: 'Servos de Mordred:',
    expansions: 'Expansões:',
    note: 'Nota: ',
    title: 'Regras de Avalon: como jogar com 5–10 jogadores',
    gameObjective: 'Objetivo do Jogo',
    gameDescription:
      'Avalon: The Resistance é um jogo de tabuleiro estratégico onde os jogadores são encarregados de completar uma série de missões enquanto lidam com traidores ocultos conhecidos como Servos de Mordred. O jogo é ambientado no mundo lendário do Rei Arthur e os Cavaleiros da Távola Redonda.',
    gameplayRules: 'Regras de Jogo',
    teamProposalAndVoting: 'Proposta de Equipe e Votação',
    teamProposalDescription:
      'O jogador com o token de Líder propõe uma equipe de jogadores para a missão. O número de jogadores necessários para a equipe depende da missão atual e do número total de jogadores no jogo.',
    votingDescription:
      'Todos votam, inclusive o líder. É preciso mais da metade dos votos a favor; um empate rejeita a equipe. A liderança passa no sentido horário e outra equipe é proposta para a mesma missão. No original, cinco rejeições seguidas dão a vitória ao mal. Aqui, após quatro rejeições, a quinta equipe normalmente parte sem votação; as cartas de trama podem afetar a aprovação.',
    progressionOfPlayTitle: 'Progressão do Jogo',
    leaderTokenMove:
      'Após o resultado da missão ter sido determinado, o token de Líder move-se para o próximo jogador no sentido horário.',
    newRound:
      'Repita a formação de equipes e as missões até três sucessos ou três fracassos. São no máximo cinco missões; as restantes não são jogadas após atingir esse resultado.',
    playersUseSkills:
      'Os jogadores devem usar seus poderes de persuasão, dedução e blefe para influenciar a seleção da equipe, a votação e a discussão para promover a agenda do seu lado.',
    missionPhaseTitle: 'Fase da Missão',
    teamApproved:
      'Somente os membros da equipe aprovada escolhem cartas em segredo. No jogo básico, o bem deve jogar Sucesso { goodLoyaltyIcon }; o mal pode jogar Sucesso ou Falha { evilLoyaltyIcon }.',
    submitCardsToLeader:
      'Em uma partida presencial, o líder recolhe e embaralha as cartas dos membros da equipe antes de revelá-las, para ocultar quem jogou cada carta.',
    cardsRevealed:
      'Normalmente, uma Falha { evilLoyaltyIcon } faz a missão fracassar; sem nenhuma, ela tem sucesso { goodLoyaltyIcon }. A exceção é a quarta missão com 7–10 jogadores: são necessárias pelo menos duas Falhas, então apenas uma ainda permite o sucesso.',
    conclusionOfGameplayTitle: 'Conclusão do Jogo',
    gameplayEndsCondition:
      'Três missões fracassadas dão vitória imediata ao mal. Após três sucessos, começa o assassinato: no original, o Assassino indica um jogador do bem após conversar com sua equipe. Se for {merlin}, o mal vence; caso contrário, o bem vence. Aqui, a equipe do mal realiza o assassinato; papéis personalizados podem incluir outros alvos. Para vencer assassinando o Clérigo após três missões bem-sucedidas, o mal deve identificar dois jogadores em sequência: primeiro o Clérigo e depois outro jogador do bem, escolhendo tanto o jogador quanto seu papel exato na lista disponível. É preciso acertar ambos; um erro em qualquer etapa dá a vitória ao bem.',
    strategicDiscussion:
      'Através de discussão estratégica, observação cuidadosa e táticas inteligentes, cada lado deve fazer o seu melhor para alcançar seus objetivos sem revelar suas verdadeiras lealdades, fazendo com que cada rodada de Avalon: The Resistance se desenrole de maneira única e cheia de suspense.',
    assassinNote:
      'No original, o <b>Assassino</b> faz a escolha final após conversar com o mal. As configurações acima usam o assassinato pela equipe do mal desta plataforma. Para seguir as regras originais, inclua o Assassino entre os jogadores do mal.',
    objectiveArthur: 'Objetivo para os { goodLoyaltyIcon } Servos Leais de Arthur',
    objectiveMordred: 'Objetivo para os { evilLoyaltyIcon } Servos de Mordred',
    missionObjective:
      'Os Leais { servant } devem completar com sucesso três das cinco missões. Eles devem trabalhar juntos para propor equipes para cada missão e votar nas composições das equipes, sempre tentando manter os traidores fora das equipes para evitar que as missões falhem.',
    minionObjective:
      'Os {minion} tentam entrar nas equipes e fazer três missões fracassarem, enganando os {servant} nas discussões. Blefar é permitido, mas os jogadores não devem mostrar suas cartas de personagem durante a partida.',
    additionalObjectivesTitle: 'Objetivos Adicionais',
    additionalObjectivesDescription:
      '{merlin} vê os jogadores do mal na preparação, exceto papéis que ficam ocultos dele, como Mordred. Ele deve ajudar o bem sem revelar sua identidade: após três sucessos, o mal ainda pode vencer se o identificar.',
    twoFailsNote:
      'Em missões marcadas com um asterisco (*), duas cartas de Falha { evilLoyaltyIcon } são necessárias para que a missão falhe.',
    missionSizes: 'Tamanho da Equipe da Missão',
    excaliburHint:
      'Recomendamos adicionar {excalibur} a jogos para qualquer número de jogadores, mas apenas na companhia de jogadores experientes.',
    recommendTitle: 'Configuração de Papéis Recomendada',
    generalTipsTitle: 'Dicas Gerais',
    generalTipsText:
      'Avalon comporta <strong>5–10 jogadores</strong>. As configurações abaixo são sugestões para esta plataforma, incluindo papéis personalizados; não são a configuração obrigatória do jogo original.',
    newcomersAdvice:
      'No jogo básico original, use <strong>Merlin e o Assassino</strong> e complete o grupo com servos leais e servos de Mordred, mantendo a proporção correta entre bem e mal. Acrescente papéis opcionais quando todos entenderem as votações e missões.',
    recommendationAfterFirstGames:
      'Depois de aprender o básico, experimente estes papéis e variantes; Tristão e Isolda são papéis personalizados da plataforma:',
    offlineSetup: 'Configuração do jogo offline:',
    defaultSetup:
      'A configuração padrão inclui personagens como { merlin }, { percival } e { morgana }. No entanto, você tem a flexibilidade de personalizar o jogo selecionando os papéis que melhor se adequam ao seu grupo.',
    closeEyesExtendHand: 'Todos fechem os olhos e estendam a mão em forma de punho à sua frente.',
    except: 'exceto',
    seeAllAgentsOfEvil: 'abra seus olhos e olhe ao redor para que você conheça todos os agentes do Mal.',
    extendYourThumb: 'estenda seu polegar para o ar',
    extendYourThumbSo: 'estenda seu polegar para o ar para que',
    willKnowOfYou: 'saiba de você',
    closeEyes: 'feche os olhos',
    guinevereLookAround: 'abra seus olhos e olhe ao redor para que você conheça ambos os lancelots',
    allPlayersShouldHaveEyedClosed:
      'Todos os jogadores devem estar com os olhos fechados e as mãos em punho à sua frente',
    putYourThumbDown: 'abaixe seu polegar e reforme sua mão em punho',
    merlinOpenEyes: 'abra seus olhos para ver os agentes do mal',
    gameSetupNote:
      'Para fins de configuração do jogo, o termo "{minion}" refere-se a todos os agentes do Mal, a menos que indicado de outra forma',
    ordinaryMinion: 'Comum (sem papéis adicionais)',
    everyoneOpenEyes: 'Todos abram os olhos',
    percivalOpenEyes: 'abra seus olhos e veja',
    loversOpenEyes: 'abram seus olhos e olhem ao redor para conhecerem um ao outro',
    faqTitle: 'Perguntas frequentes sobre Avalon',
    faqPlayersQuestion: 'Quantas pessoas podem jogar Avalon?',
    faqPlayersAnswer:
      'De 5 a 10 pessoas. A proporção entre bem e mal é: 5 jogadores: 3/2; 6: 4/2; 7: 4/3; 8: 5/3; 9: 6/3; 10: 6/4. Os papéis especiais estão incluídos no total de cada lado.',
    faqTieQuestion: 'O que acontece quando a votação empata?',
    faqTieAnswer:
      'A equipe é rejeitada. É preciso mais da metade dos votos a favor: por exemplo, quatro de seis. O próximo líder propõe outra equipe para a mesma missão; rejeitar uma equipe não conta como missão fracassada.',
    faqMerlinQuestion: 'O bem vence assim que três missões têm sucesso?',
    faqMerlinAnswer:
      'Em uma partida normal com Merlin, é preciso sobreviver ao assassinato. No original, o Assassino tem uma tentativa de identificar Merlin. Se acertar, o mal vence; se errar, o bem vence. Nesta plataforma, a equipe do mal realiza essa etapa.',
  },
  en: {
    quickStartTitle: 'How to play Avalon: a quick start',
    quickStep1:
      'Set up 5–10 players, deal secret roles and reveal the information allowed by each role. Good wants three successful missions; evil wants three failed missions.',
    quickStep2:
      'The leader chooses a mission team using the player-count table below. Everyone votes: more than half must approve; a tie rejects the team.',
    quickStep3:
      'Only the selected team submits mission cards in secret. In the base game, good must choose Success; evil may choose Success or Fail. Most missions fail with one Fail card; mission four needs two Fails with seven or more players.',
    quickStep4:
      'Reveal only the mission result, pass leadership and repeat. After three successful missions, evil can still win by correctly identifying Merlin in the assassination phase.',
    roundExampleTitle: 'Example: the first mission with five players',
    roundExample:
      'The leader chooses two players. If three or more of the five players approve, those two submit mission cards. Two Success cards make the mission succeed; one Fail makes it fail. A successful mission does not prove both players are good: an evil player may choose Success.',
    variantTitle: 'Board-game rules and this platform',
    variantNote:
      'In the original board game, five consecutive rejected teams give evil the win. On this platform, the fifth team is normally sent without a vote after four rejections; Plot Cards can affect team approval. The original game assigns the final guess to the Assassin. Here, assassination is handled by the evil team. Agree on the rules and enabled roles before an offline game.',
    numberOfPlayers: 'Number of Players',
    missionNumber: 'Mission {number}',
    countPlayers: '{count} Players',
    servantTeam: 'Loyal Servants of Arthur:',
    mordredTeam: 'Minions of Mordred:',
    expansions: 'Expansions:',
    note: 'Note: ',
    title: 'Avalon Rules: How to Play The Resistance: Avalon',
    gameObjective: 'Game Objective',
    gameDescription:
      'The Resistance: Avalon is a social deduction board game for 5–10 players with secret good and evil roles. Players discuss a proposed mission team, vote to approve or reject it, then the chosen team submits mission cards in secret. This guide covers setup, voting, mission sizes and winning, with the differences between the original board game and this online platform explained above.',
    gameplayRules: 'Gameplay Rules',
    teamProposalAndVoting: 'Team Proposal and Voting',
    teamProposalDescription:
      'The player with the Leader token proposes a team of players for the mission. The number of players required for the team depends on the current mission and the total number of players in the game.',
    votingDescription:
      'Everyone, including the Leader, votes. More than half of all players must approve; a tie rejects the team. After rejection, leadership passes clockwise and a new team is proposed for the same mission. In the original board game, five consecutive rejections give evil the win. On this platform, the fifth team normally goes without a vote after four rejections; Plot Cards can affect approval.',
    progressionOfPlayTitle: 'Progression of Play',
    leaderTokenMove:
      'After the outcome of the mission has been determined, the Leader token moves to the next player in clockwise order.',
    newRound:
      'Repeat team selection and missions until three missions succeed or three fail. There are at most five missions; do not play the remaining missions once either side reaches three.',
    playersUseSkills:
      "Players must use their powers of persuasion, deduction, and bluffing to influence team selection, the vote, and discussion to further their side's agenda.",
    missionPhaseTitle: 'Mission Phase',
    teamApproved:
      'Only the approved team submits mission cards in secret. In the base game, good players must choose Success { goodLoyaltyIcon }; evil players may choose Success or Fail { evilLoyaltyIcon }.',
    submitCardsToLeader:
      'In a physical game, the Leader collects and shuffles the selected team members’ mission cards before revealing them, so nobody can identify who played each card.',
    cardsRevealed:
      'Normally, one Fail { evilLoyaltyIcon } makes the mission fail; otherwise it succeeds { goodLoyaltyIcon }. The exception is mission four with 7–10 players: it requires at least two Fails, so a single Fail still gives a successful mission.',
    conclusionOfGameplayTitle: 'Conclusion of Gameplay',
    gameplayEndsCondition:
      'Three failed missions immediately give evil the win. After three successful missions, stop questing and resolve the assassination: in the original game, the Assassin names one good player after discussion with the evil team. If that player is {merlin}, evil wins; otherwise good wins. On this platform, the evil team handles assassination, with other targets possible in custom role setups. To win by assassinating the Cleric after three successful missions, evil must identify two players in order: first the Cleric, then another good player, selecting both that player and their exact role from the available list. Both guesses must be correct; a wrong guess at either stage gives good the win.',
    strategicDiscussion:
      'Through strategic discussion, careful observation, and clever tactics, each side must do their best to achieve their objectives without revealing their true allegiances, making each round of Avalon: The Resistance play out uniquely and full of suspense.',
    assassinNote:
      'The original board game includes a separate <b>Assassin</b>, who makes the final Merlin guess after evil discusses it. The custom setups above use this platform’s evil-team assassination instead. For an original board-game setup, include the Assassin among the evil players.',
    objectiveArthur: 'Objective for the { goodLoyaltyIcon } Loyal Servants of Arthur',
    objectiveMordred: 'Objective for the { evilLoyaltyIcon } Minions of Mordred',
    missionObjective:
      'The Loyal { servant } must successfully complete three out of five missions. They must work together to propose teams for each mission and vote on team compositions, always trying to keep traitors off the teams to prevent missions from failing.',
    minionObjective:
      'The { minion } try to get onto mission teams and cause three failures while misleading the { servant } in discussion. Bluffing is allowed, but players must not show their character cards during play.',
    additionalObjectivesTitle: 'Additional Objectives',
    additionalObjectivesDescription:
      '{ merlin } sees evil players at setup, except for roles such as Mordred that remain hidden from him. He must help good without revealing his identity: after three successful missions, evil can still win by correctly identifying him.',
    twoFailsNote:
      'On missions marked with an asterisk (*), two Fail { evilLoyaltyIcon } cards are required for the mission to fail.',
    missionSizes: 'Mission Team Size',
    excaliburHint:
      'We recommend adding {excalibur} to games for any number of players, but only in the company of experienced players.',
    recommendTitle: 'Recommended Roles Setup',
    generalTipsTitle: 'General tips',
    generalTipsText:
      'Avalon supports <strong>5–10 players</strong>. The setups below are suggestions for this platform, including custom roles; they are not the original board game’s required setup.',
    newcomersAdvice:
      'For the original base game, use <strong>Merlin and the Assassin</strong>, then fill the remaining places with loyal servants and minions in the correct good/evil ratio. Add optional roles when everyone understands voting and missions.',
    recommendationAfterFirstGames:
      'Once the group knows the basics, consider these additional roles and variants; Tristan and Isolde are custom roles on this platform:',
    offlineSetup: 'Setting up an in-person game',
    defaultSetup:
      'This role-aware opening script starts with { merlin }, { percival } and { morgana } selected. Adjust the selection to match your group; it is a customizable script, not the original base-game setup.',
    closeEyesExtendHand: 'Everyone close your eyes and hold a closed fist in front of you.',
    except: 'except',
    seeAllAgentsOfEvil: 'open your eyes and look around so that you know all agents of Evil.',
    extendYourThumb: 'extend your thumb into the air',
    extendYourThumbSo: 'extend your thumb into the air so',
    willKnowOfYou: 'can see you',
    closeEyes: 'close your eyes',
    guinevereLookAround: 'open your eyes and look around so that you know both lancelots',
    allPlayersShouldHaveEyedClosed: 'All players have their eyes closed and hands in a fist in front of them',
    putYourThumbDown: 'put your thumb down and re-form your hand into a fist',
    merlinOpenEyes: 'open your eyes to see the agents of evil',
    gameSetupNote:
      'For the purposes of game setup, the term "{minion}" refers to all agents of Evil unless otherwise stated',
    ordinaryMinion: 'Ordinary (without additional roles)',
    everyoneOpenEyes: 'Everyone open your eyes',
    percivalOpenEyes: 'open your eyes and see',
    loversOpenEyes: 'open your eyes and look around to know each other',
    faqTitle: 'Avalon rules FAQ',
    faqPlayersQuestion: 'How many people can play Avalon?',
    faqPlayersAnswer:
      'Avalon plays with 5–10 people. Good/evil counts are: 5 players: 3/2; 6: 4/2; 7: 4/3; 8: 5/3; 9: 6/3; 10: 6/4. These counts include the special roles on each side.',
    faqTieQuestion: 'What happens when the team vote is tied?',
    faqTieAnswer:
      'The team is rejected. Approval needs more than half of all players, so a six-player game needs four approvals. The next leader proposes another team for the same mission; rejection itself is not a failed mission.',
    faqMerlinQuestion: 'Does good win as soon as three missions succeed?',
    faqMerlinAnswer:
      'In a standard game with Merlin, good must also survive the assassination. The Assassin gets one final guess at Merlin in the original board game. A correct guess gives evil the win; a wrong guess gives good the win. This platform lets the evil team handle that step.',
  },
  ru: {
    variantNote:
      'В оригинальной настольной игре пять отклонённых команд подряд при сборе одной миссии приносят победу злу. На платформе после четырёх отказов пятая команда обычно отправляется без голосования; карты интриг могут влиять на принятие команды. В оригинале последнее решение принимает Убийца, а здесь убийство выполняет команда зла. Перед офлайн-партией договоритесь о правилах и наборе ролей.',
    variantTitle: 'Настольные правила и особенности платформы',
    roundExample:
      'Лидер выбирает двух участников. Если хотя бы трое из пяти игроков одобряют команду, эти двое тайно выбирают карты миссии. Две карты успеха означают успех; одна карта провала — провал миссии. Успех не доказывает, что оба участника добрые: злой игрок тоже может выбрать успех.',
    roundExampleTitle: 'Пример: первая миссия в партии на пять игроков',
    quickStep4:
      'Объявите результат миссии, передайте лидерство и повторите сбор команды. После трёх успешных миссий зло ещё может победить, правильно определив Мерлина на этапе убийства.',
    quickStep3:
      'Только участники миссии тайно выбирают карты. В базовой игре добрые обязаны выбрать «Успех», а злые могут выбрать «Успех» или «Провал». Обычно достаточно одной карты провала; в четвёртой миссии при семи и более игроках нужны две.',
    quickStep2:
      'Лидер выбирает участников миссии по таблице ниже. Голосуют все: для принятия команды нужно больше половины голосов «за». При равенстве голосов команда отклоняется.',
    quickStep1:
      'Соберите 5–10 игроков, раздайте тайные роли и сообщите каждому информацию, положенную его роли. Добру нужны три успешные миссии, злу — три проваленные.',
    quickStartTitle: 'Как играть в Авалон: быстрый старт',
    numberOfPlayers: 'Количество игроков',
    missionNumber: 'Миссия {number}',
    countPlayers: '{count} игроков',
    servantTeam: 'Верные слуги Артура:',
    mordredTeam: 'Миньоны Мордреда:',
    expansions: 'Дополнения:',
    note: 'Примечание: ',
    title: 'Правила Авалона: как играть в компании от 5 до 10 человек',
    gameObjective: 'Цель игры',
    gameDescription:
      '«Сопротивление: Авалон» (The Resistance: Avalon) — настольная игра на социальную дедукцию для 5–10 человек с тайными ролями добра и зла. Лидер предлагает команду, все голосуют, а её участники тайно разыгрывают карты миссии. Ниже — правила игры в Авалон, таблица миссий и составы ролей; отличия онлайн-платформы от настольного оригинала указаны выше.',
    gameplayRules: 'Правила Игры',
    teamProposalAndVoting: 'Предложение Команды и Голосование',
    teamProposalDescription:
      'Игрок с жетоном лидера предлагает команду игроков для выполнения миссии. Количество игроков, необходимых для команды, зависит от текущей миссии и общего числа игроков в игре.',
    votingDescription:
      'Голосуют все, включая лидера. Нужно больше половины голосов за; ничья отклоняет команду. После отказа лидерство переходит по часовой стрелке, и новая команда собирается на ту же миссию. В настольном оригинале пять отказов подряд приносят победу злу. На платформе после четырёх отказов пятая команда обычно идёт без голосования; карты интриг могут влиять на её принятие.',
    progressionOfPlayTitle: 'Ход игры',
    leaderTokenMove:
      'После определения результата миссии жетон лидера передается следующему игроку по часовой стрелке.',
    newRound:
      'Повторяйте сбор команды и миссии до трёх успехов или трёх провалов. Всего возможно не более пяти миссий; оставшиеся после третьего результата не играются.',
    playersUseSkills:
      'Игроки должны использовать свои навыки убеждения, дедукции и блефа, чтобы повлиять на выбор команды, голосование и обсуждение в пользу своей стороны.',
    missionPhaseTitle: 'Фаза миссии',
    teamApproved:
      'Только участники принятой команды тайно выбирают карты миссии. В базовой игре добро обязано играть Успех { goodLoyaltyIcon }, а зло может выбрать Успех или Провал { evilLoyaltyIcon }.',
    submitCardsToLeader:
      'В настольной игре лидер собирает и перемешивает карты участников миссии перед раскрытием, чтобы нельзя было определить, кто какую карту сыграл.',
    cardsRevealed:
      'Обычно одна карта Провала { evilLoyaltyIcon } проваливает миссию; без неё миссия успешна { goodLoyaltyIcon }. Исключение — четвёртая миссия при 7–10 игроках: нужны хотя бы два провала, поэтому с одной картой Провала миссия всё ещё успешна.',
    conclusionOfGameplayTitle: 'Завершение игры',
    gameplayEndsCondition:
      'Три проваленные миссии сразу приносят победу злу. После трёх успешных миссий начинается убийство: в оригинале Убийца после обсуждения со злом называет одного доброго игрока. Если это {merlin}, побеждает зло; иначе — добро. На платформе убийство выполняет команда зла; пользовательские наборы ролей могут добавлять другие цели. Чтобы победить через убийство Клирика после трёх успешных миссий, зло должно последовательно угадать двух игроков: сначала Клирика, затем ещё одного мирного, выбрав и игрока, и его конкретную роль из доступного списка. Оба попадания обязательны; ошибка на любом этапе приносит победу добру.',
    strategicDiscussion:
      'Посредством стратегических обсуждений, внимательных наблюдений и хитроумных тактик каждая сторона должна делать всё возможное, чтобы достичь своих целей, не раскрывая свою истинную принадлежность, делая каждый раунд игры Avalon: The Resistance уникальным и полным напряжения.',
    assassinNote:
      'В настольном оригинале отдельный <b>Убийца</b> делает последний выбор после обсуждения с командой зла. Составы выше используют убийство командой зла по правилам платформы. Для игры по оригинальным правилам включите Убийцу в число злых игроков.',
    objectiveArthur: 'Цель для {goodLoyaltyIcon} Cлуг Артура',
    objectiveMordred: 'Цель для {evilLoyaltyIcon} Миньонов Мордреда',
    missionObjective:
      'Верные { servant } должны успешно завершить три из пяти миссий. Они должны работать вместе, чтобы предлагать команды для каждой миссии и голосовать за их состав, всегда стараясь исключить предателей из команд, чтобы предотвратить провал миссий.',
    minionObjective:
      '{ minion } стараются попадать в команды и провалить три миссии, вводя { servant } в заблуждение во время обсуждения. Блеф разрешён, но показывать карты ролей во время игры нельзя.',
    additionalObjectivesTitle: 'Дополнительные Задачи',
    additionalObjectivesDescription:
      '{ merlin } в начале видит злых игроков, кроме скрытых от него ролей, например Мордреда. Ему нужно помогать добру, не раскрывая себя: после трёх успешных миссий зло ещё может победить, правильно определив Мерлина.',
    twoFailsNote: 'Для провала миссии, отмеченной звездочкой (*), требуются две карты Провал { evilLoyaltyIcon }.',
    missionSizes: 'Размер команды на миссии',
    excaliburHint:
      'Мы рекомендуем добавлять {excalibur} в игры для любого количества игроков, но только в компании опытных игроков.',
    recommendTitle: 'Рекомендуемая Настройка Ролей',
    generalTipsTitle: 'Общие советы',
    generalTipsText:
      'Авалон рассчитан на <strong>5–10 игроков</strong>. Ниже приведены рекомендации для платформы, в том числе с авторскими ролями, а не обязательные составы настольного оригинала.',
    newcomersAdvice:
      'Для базовой настольной игры возьмите <strong>Мерлина и Убийцу</strong>, а остальные места заполните слугами Артура и приспешниками Мордреда с нужным соотношением добра и зла. Дополнительные роли вводите после освоения голосований и миссий.',
    recommendationAfterFirstGames:
      'Освоив основы, можно попробовать следующие роли и варианты; Тристан и Изольда — авторские роли платформы:',
    offlineSetup: 'Настройка игры в оффлайне:',
    defaultSetup:
      'Настройка по умолчанию включает персонажей, таких как { merlin }, { percival } и { morgana }. Однако у вас есть возможность настроить игру, выбрав роли, которые наилучшим образом подходят вашей группе.',
    closeEyesExtendHand: 'Все закройте глаза и протяните руку с кулаком перед собой.',
    except: 'кроме',
    seeAllAgentsOfEvil: 'откройте глаза и оглянитесь, чтобы узнать всех агентов Зла.',
    extendYourThumb: 'поднимите большой палец вверх',
    extendYourThumbSo: 'поднимите большой палец вверх чтобы',
    willKnowOfYou: 'узнал о вас',
    closeEyes: 'закройте глаза',
    guinevereLookAround: 'откройте глаза и оглянитесь, чтобы узнать обоих ланселотов.',
    allPlayersShouldHaveEyedClosed: 'Все игроки закрыли глаза и держат кулаки перед собой',
    putYourThumbDown: 'опустите большой палец и снова сожмите руку в кулак',
    merlinOpenEyes: 'откройте глаза, чтобы увидеть агентов зла',
    gameSetupNote: 'Для настройки игры, термин "{minion}" относится ко всем агентам Зла, если не указано иное',
    ordinaryMinion: 'Обычный (без дополнительных ролей)',
    everyoneOpenEyes: 'Все откройте глаза',
    percivalOpenEyes: 'откройте глаза и узнайте кто является',
    loversOpenEyes: 'откройте глаза и оглянитесь, чтобы узнать друг друга',
    faqTitle: 'Частые вопросы о правилах Авалона',
    faqPlayersQuestion: 'Сколько человек нужно для Авалона?',
    faqPlayersAnswer:
      'От 5 до 10. Соотношение добра и зла: 5 игроков — 3/2; 6 — 4/2; 7 — 4/3; 8 — 5/3; 9 — 6/3; 10 — 6/4. Особые роли входят в число игроков своей стороны.',
    faqTieQuestion: 'Что происходит при ничьей в голосовании?',
    faqTieAnswer:
      'Команда отклоняется. За неё должны проголосовать больше половины игроков: например, четверо из шести. Следующий лидер собирает команду на ту же миссию; отказ сам по себе не считается её провалом.',
    faqMerlinQuestion: 'Добро побеждает сразу после трёх успешных миссий?',
    faqMerlinAnswer:
      'В обычной игре с Мерлином нужно ещё пережить убийство. В настольном оригинале Убийца делает одну попытку угадать Мерлина: верный выбор приносит победу злу, ошибочный — добру. На платформе этот этап выполняет команда зла.',
  },
  'zh-CN': {
    variantNote:
      '原版桌游中，同一任务连续五次组队遭否决，坏人立即获胜。本站通常在四次否决后，让第五位队长直接派队，不再投票；阴谋卡可能影响队伍是否通过。原版由刺客做最后指认，本站则由邪恶阵营处理刺杀。线下游玩前，请先确认采用的规则及角色。',
    variantTitle: '桌游原版与本站玩法的区别',
    roundExample:
      '队长选出两名队员。五人中至少三人同意后，这两人秘密出任务牌。两张成功牌代表任务成功；只要一张失败牌，任务就失败。任务成功不代表两人都是好人，因为坏人也能出成功牌。',
    roundExampleTitle: '示例：五人局的第一次任务',
    quickStep4: '公布任务结果后更换队长，继续组队。三次任务成功后，坏人仍可在刺杀阶段正确指认梅林，反败为胜。',
    quickStep3:
      '只有任务队员秘密提交任务牌。基本规则中，好人只能出成功，坏人可以出成功或失败。通常一张失败牌就会使任务失败；七人以上的第四次任务需要两张失败牌。',
    quickStep2: '队长依下方人数表选择任务队员，所有玩家投票。超过半数同意才通过，平票视为否决。',
    quickStep1: '由 5–10 人游玩，秘密分配角色，并依角色能力查看起始信息。好人要让三次任务成功；坏人要让三次任务失败。',
    quickStartTitle: '阿瓦隆怎么玩？新手快速入门',
    numberOfPlayers: '玩家人数',
    missionNumber: '任务 {number}',
    countPlayers: '{count} 玩家',
    servantTeam: '忠诚的亚瑟随从:',
    mordredTeam: '莫德雷德的爪牙:',
    expansions: '扩展:',
    note: '注意: ',
    title: '阿瓦隆规则与玩法：5–10 人新手指南',
    gameObjective: '游戏目标',
    gameDescription:
      '阿瓦隆: 抵抗 是一款战略桌游，玩家需要在与隐藏的叛徒——莫德雷德的爪牙作斗争的同时完成一系列的任务。游戏设定在亚瑟王和圆桌骑士的传奇世界中。',
    gameplayRules: '游戏规则',
    teamProposalAndVoting: '团队提案和投票',
    teamProposalDescription:
      '拥有领袖标记的玩家提议一个玩家团队来执行任务。团队所需的玩家数量取决于当前任务和游戏中的玩家总数。',
    votingDescription:
      '所有玩家（包括队长）都要投票。超过半数同意才通过，平票视为否决。队长标记顺时针传给下一位玩家，重新为同一次任务组队。原版连续五次否决会让坏人获胜；本站通常在四次否决后直接派出第五支队伍，阴谋卡可能影响队伍是否通过。',
    progressionOfPlayTitle: '游戏进程',
    leaderTokenMove: '在确定任务结果后，领导者标记顺时针移动到下一位玩家。',
    newRound: '重复组队与执行任务，直到累计三次成功或三次失败。最多进行五次任务，达到上述条件后不再执行剩余任务。',
    playersUseSkills: '玩家必须运用他们的说服力、推理能力和虚张声势来影响团队选择、投票和讨论，以推进他们一方的目标。',
    missionPhaseTitle: '任务阶段',
    teamApproved:
      '只有通过组队投票的队员秘密出任务牌。基本规则中，好人只能出成功 { goodLoyaltyIcon }；坏人可以出成功或失败 { evilLoyaltyIcon }。',
    submitCardsToLeader: '实体桌游中，队长收齐任务队员出的牌，洗匀后再翻开，避免大家知道每张牌是谁出的。',
    cardsRevealed:
      '通常只要一张失败 { evilLoyaltyIcon } 牌，任务就失败；没有失败牌则成功 { goodLoyaltyIcon }。例外是 7–10 人局的第四次任务：至少两张失败牌才会失败，因此只有一张失败牌仍算成功。',
    conclusionOfGameplayTitle: '游戏结束',
    gameplayEndsCondition:
      '累计三次任务失败，坏人立即获胜。累计三次成功后停止任务，进入刺杀：原版由刺客与坏人讨论后，指认一名好人。如果对方是{merlin}，坏人获胜；猜错则好人获胜。本站由邪恶阵营处理刺杀，自定义角色配置也可能加入其他刺杀目标。 三次任务成功后，若坏人选择刺杀牧师，必须依次猜中两名玩家：先找出牧师，再从可选列表中选择另一名好人的具体角色，并指出持有该角色的玩家。两次都猜对，坏人才获胜；任一阶段猜错，好人获胜。',
    strategicDiscussion:
      '通过战略讨论、仔细观察和聪明的战术，每一方都必须尽力实现他们的目标，而不暴露他们的真实效忠，使每一轮《阿瓦隆：反抗组织》的游戏过程独特而充满悬念。',
    assassinNote:
      '原版由独立角色<b>刺客</b>与坏人讨论后做最后指认。上方配置采用本站由邪恶阵营处理刺杀的玩法；若按原版桌游规则游玩，请在坏人名额中安排刺客。',
    objectiveArthur: '{goodLoyaltyIcon} 亚瑟忠诚仆人的目标',
    objectiveMordred: '{evilLoyaltyIcon} 莫德雷德爪牙的目标',
    missionObjective:
      '忠诚的{ servant }必须成功完成五个任务中的三个。他们必须共同合作，为每个任务提议小组，并对小组构成进行投票，始终努力将叛徒排除在团队之外，以防止任务失败。',
    minionObjective:
      '{ minion }要设法加入任务队伍，让三次任务失败，并在讨论中误导{ servant }。可以说谎或假装其他角色，但游戏中不能展示角色牌。',
    additionalObjectivesTitle: '附加目标',
    additionalObjectivesDescription:
      '{ merlin }在开局时能看见坏人，但看不见莫德雷德等对他隐藏身份的角色。他必须帮助好人又不暴露自己，因为三次任务成功后，坏人仍可通过刺杀梅林获胜。',
    twoFailsNote: '在标有星号 (*) 的任务中，需要两张失败 { evilLoyaltyIcon } 卡才能导致任务失败。',
    missionSizes: '任务小组人数',
    excaliburHint: '我们建议将{excalibur}加入任意玩家数量的游戏中，但仅限于有经验玩家的陪伴下使用。',
    recommendTitle: '推荐角色设置',
    generalTipsTitle: '一般提示',
    generalTipsText:
      '阿瓦隆适合 <strong>5–10 人</strong>游玩。以下是本站的推荐配置，包含自定义角色，并非原版桌游的必要配置。',
    newcomersAdvice:
      '原版基本游戏使用<strong>梅林和刺客</strong>，其余名额按好坏人比例补入忠臣与爪牙。熟悉组队、投票和任务流程后，再逐步加入可选角色。',
    recommendationAfterFirstGames: '熟悉基本规则后，可以尝试以下角色与变体；特里斯坦和伊索尔德属于本站自定义角色：',
    offlineSetup: '离线游戏设置：',
    defaultSetup:
      '默认设置包括角色：{ merlin }、{ percival } 和 { morgana }。不过，您可以灵活定制游戏，选择最适合您团队的角色。',
    closeEyesExtendHand: '所有人闭上眼睛，并将手伸出形成拳头放在前面。',
    except: '除了',
    seeAllAgentsOfEvil: '睁开眼睛，环顾四周，以便认识所有的邪恶代理。',
    extendYourThumb: '将你的拇指翘起',
    extendYourThumbSo: '将你的拇指翘起以便',
    willKnowOfYou: '会知道你',
    closeEyes: '闭上眼睛',
    guinevereLookAround: '睁开眼睛，环顾四周，以便认识两个兰斯洛特。',
    allPlayersShouldHaveEyedClosed: '所有玩家都应该闭上眼睛，手握成拳头放在前面',
    putYourThumbDown: '放下拇指，重新将手握成拳头',
    merlinOpenEyes: '睁开眼睛，看到邪恶代理',
    gameSetupNote: '为了游戏设置，{minion}一词指的是所有的邪恶代理，除非另有说明',
    ordinaryMinion: '普通（没有额外角色）',
    everyoneOpenEyes: '所有人睁开眼睛',
    percivalOpenEyes: '睁开眼睛和看',
    loversOpenEyes: '睁开眼睛，环顾四周以认识彼此',
    faqTitle: '阿瓦隆规则常见问题',
    faqPlayersQuestion: '阿瓦隆几个人可以玩？好坏人怎么分？',
    faqPlayersAnswer:
      '适合 5–10 人。好人／坏人人数依次为：5 人局 3／2、6 人局 4／2、7 人局 4／3、8 人局 5／3、9 人局 6／3、10 人局 6／4。特殊角色也计入所属阵营的人数。',
    faqTieQuestion: '组队投票平票怎么办？',
    faqTieAnswer:
      '平票视为否决，必须超过半数同意才通过，例如六人局需要四票同意。下一位队长重新为同一次任务组队；否决队伍本身不算任务失败。',
    faqMerlinQuestion: '三次任务成功，好人就赢了吗？',
    faqMerlinAnswer:
      '一般有梅林的游戏还要进入刺杀阶段。原版由刺客最后猜一次谁是梅林：猜中则坏人获胜，猜错则好人获胜。本站由邪恶阵营处理这个阶段。',
  },
  'zh-TW': {
    quickStartTitle: '阿瓦隆怎麼玩？新手快速入門',
    quickStep1: '由 5–10 人遊玩，秘密分配角色，並依角色能力查看起始資訊。好人要讓三次任務成功；壞人要讓三次任務失敗。',
    quickStep2: '隊長依下方人數表選擇任務隊員，所有玩家投票。超過半數同意才通過，平票視為否決。',
    quickStep3:
      '只有任務隊員秘密提交任務牌。基本規則中，好人只能出成功，壞人可以出成功或失敗。通常一張失敗牌就會使任務失敗；七人以上的第四次任務需要兩張失敗牌。',
    quickStep4: '公布任務結果後更換隊長，繼續組隊。三次任務成功後，壞人仍可在刺殺階段正確指認梅林，反敗為勝。',
    roundExampleTitle: '範例：五人局的第一次任務',
    roundExample:
      '隊長選出兩名隊員。五人中至少三人同意後，這兩人秘密出任務牌。兩張成功牌代表任務成功；只要一張失敗牌，任務就失敗。任務成功不代表兩人都是好人，因為壞人也能出成功牌。',
    variantTitle: '桌遊原版與本站玩法的差異',
    variantNote:
      '原版桌遊中，同一任務連續五次組隊遭否決，壞人立即獲勝。本站通常在四次否決後，讓第五位隊長直接派隊，不再投票；陰謀卡可能影響隊伍是否通過。原版由刺客做最後指認，本站則由邪惡陣營處理刺殺。線下遊玩前，請先確認採用的規則及角色。',
    numberOfPlayers: '玩家人數',
    missionNumber: '任務 {number}',
    countPlayers: '{count} 人局',
    servantTeam: '忠誠的亞瑟隨從:',
    mordredTeam: '莫德雷德的爪牙:',
    expansions: '擴展:',
    note: '注意: ',
    title: '阿瓦隆規則與玩法：5–10 人新手指南',
    gameObjective: '遊戲目標',
    gameDescription:
      '阿瓦隆（The Resistance: Avalon）是一款適合 5–10 人的隱藏身分推理遊戲。每輪由隊長提名任務隊伍，全體玩家投票，再由獲准出任務的玩家秘密決定任務成敗。好人需要完成三次任務並保護梅林；壞人可讓三次任務失敗，或在好人完成三次任務後刺殺梅林獲勝。下方可直接查閱各人數的任務表與角色配置。',
    gameplayRules: '遊戲規則',
    teamProposalAndVoting: '組隊與投票',
    teamProposalDescription:
      '持有隊長標記的玩家提出任務隊伍，可以選自己，也可以不選。所需隊員人數由玩家總數和目前任務決定，請查閱下方任務表。',
    votingDescription:
      '所有玩家（包括隊長）都要投票。超過半數同意才通過，平票視為否決。遭否決後，隊長標記順時針傳給下一位玩家，重新為同一次任務組隊。原版連續五次否決會讓壞人獲勝；本站通常在四次否決後直接派出第五支隊伍，陰謀卡則可能影響隊伍是否通過。',
    progressionOfPlayTitle: '遊戲進程',
    leaderTokenMove: '任務結果公布後，隊長標記順時針傳給下一位玩家。',
    newRound: '重複組隊與執行任務，直到累計三次成功或三次失敗。最多進行五次任務，達成上述條件後就不再執行剩餘任務。',
    playersUseSkills: '觀察投票和任務結果，透過討論、推理與虛張聲勢判斷彼此的立場，幫助自己的陣營獲勝。',
    missionPhaseTitle: '任務階段',
    teamApproved:
      '只有通過組隊投票的隊員秘密出任務牌。基本規則中，好人只能出成功 { goodLoyaltyIcon }；壞人可以出成功或失敗 { evilLoyaltyIcon }。',
    submitCardsToLeader: '實體桌遊中，隊長收齊任務隊員出的牌，洗勻後再翻開，避免大家知道每張牌是誰出的。',
    cardsRevealed:
      '通常只要一張失敗 { evilLoyaltyIcon } 牌，任務就失敗；沒有失敗牌則成功 { goodLoyaltyIcon }。唯一的人數例外是 7–10 人局的第四次任務：至少兩張失敗牌才會失敗，因此只有一張失敗牌仍算成功。',
    conclusionOfGameplayTitle: '遊戲結束',
    gameplayEndsCondition:
      '累計三次任務失敗，壞人立即獲勝。累計三次成功後停止任務，進入刺殺：原版由刺客與壞人討論後，指認一名好人。如果對方是{merlin}，壞人獲勝；猜錯則好人獲勝。本站由邪惡陣營處理刺殺，自訂角色配置也可能加入其他刺殺目標。 三次任務成功後，若壞人選擇刺殺牧師，必須依序猜中兩名玩家：先找出牧師，再從可選清單中選擇另一名好人的具體角色，並指出持有該角色的玩家。兩次都猜對，壞人才獲勝；任一階段猜錯，好人獲勝。',
    strategicDiscussion:
      '任務成功不代表隊員全是好人。把組隊名單、投票紀錄與任務結果一起比較，並留意誰的說法前後不一致。',
    assassinNote:
      '原版由獨立角色<b>刺客</b>與壞人討論後做最後指認。上方配置採用本站由邪惡陣營處理刺殺的玩法；若要依照原版桌遊遊玩，請在壞人名額中安排刺客。',
    objectiveArthur: '{goodLoyaltyIcon} 亞瑟忠誠僕人的目標',
    objectiveMordred: '{evilLoyaltyIcon} 莫德雷德爪牙的目標',
    missionObjective:
      '{ servant }要讓三次任務成功，並保護梅林免於刺殺。討論和投票時，盡量選出可信任的隊伍，避免讓壞人混入任務。',
    minionObjective:
      '{ minion }要設法加入任務隊伍，讓三次任務失敗，並在討論中誤導{ servant }。可以說謊或假裝其他角色，但遊戲中不能展示角色牌。',
    additionalObjectivesTitle: '附加目標',
    additionalObjectivesDescription:
      '{ merlin }在開局時能看見壞人，但看不見莫德雷德等對他隱藏身分的角色。他必須幫助好人又不暴露自己，因為三次任務成功後，壞人仍可透過刺殺梅林獲勝。',
    twoFailsNote: '在標有星號 (*) 的任務中，需要兩張失敗 { evilLoyaltyIcon } 卡才能導致任務失敗。',
    missionSizes: '各人數的任務隊員表',
    excaliburHint: '我們建議將{excalibur}加入任意玩家數量的遊戲中，但僅限於有經驗玩家的陪伴下使用。',
    recommendTitle: '推薦角色配置',
    generalTipsTitle: '新手如何選擇角色',
    generalTipsText:
      '阿瓦隆適合 <strong>5–10 人</strong>遊玩。以下是本站的推薦配置，包含自訂角色，並非原版桌遊的必要配置。',
    newcomersAdvice:
      '原版基本遊戲使用<strong>梅林和刺客</strong>，其餘名額依好壞人比例補入忠臣與爪牙。熟悉組隊、投票及任務流程後，再逐步加入選用角色。',
    recommendationAfterFirstGames: '熟悉基本規則後，可以嘗試以下角色與變體；崔斯坦和伊索德屬於本站自訂角色：',
    offlineSetup: '實體桌遊的開局流程',
    defaultSetup:
      '下方開局口令預先勾選{ merlin }、{ percival }和{ morgana }。請依實際使用的角色調整；這是可自訂的口令，不代表原版的基本配置。',
    closeEyesExtendHand: '所有人閉上眼睛，並將手伸出形成拳頭放在前面。',
    except: '除了',
    seeAllAgentsOfEvil: '睜開眼睛，確認其他壞人。',
    extendYourThumb: '將你的拇指翹起',
    extendYourThumbSo: '將你的拇指翹起以便',
    willKnowOfYou: '看見你',
    closeEyes: '閉上眼睛',
    guinevereLookAround: '睜開眼睛，環顧四周，以便認識兩個蘭斯洛特。',
    allPlayersShouldHaveEyedClosed: '所有玩家都應該閉上眼睛，手握成拳頭放在前面',
    putYourThumbDown: '放下拇指，重新將手握成拳頭',
    merlinOpenEyes: '睜開眼睛，查看壞人',
    gameSetupNote: '除非另有說明，開局口令中的「{minion}」泛指所有邪惡陣營玩家。',
    ordinaryMinion: '普通（沒有額外角色）',
    everyoneOpenEyes: '所有人睜開眼睛',
    percivalOpenEyes: '睜開眼睛和看',
    loversOpenEyes: '睜開眼睛，環顧四周以認識彼此',
    faqTitle: '阿瓦隆規則常見問題',
    faqPlayersQuestion: '阿瓦隆幾個人可以玩？好壞人怎麼分？',
    faqPlayersAnswer:
      '適合 5–10 人。好人／壞人人數依序為：5 人局 3／2、6 人局 4／2、7 人局 4／3、8 人局 5／3、9 人局 6／3、10 人局 6／4。特殊角色也計入所屬陣營的人數。',
    faqTieQuestion: '組隊投票平票怎麼辦？',
    faqTieAnswer:
      '平票視為否決，必須超過半數同意才通過，例如六人局需要四票同意。下一位隊長重新為同一次任務組隊；否決隊伍本身不算任務失敗。',
    faqMerlinQuestion: '三次任務成功，好人就贏了嗎？',
    faqMerlinAnswer:
      '一般有梅林的遊戲還要進入刺殺階段。原版由刺客最後猜一次誰是梅林：猜中則壞人獲勝，猜錯則好人獲勝。本站由邪惡陣營處理這個階段。',
  },
  es: {
    variantNote:
      'En el juego de mesa original, cinco equipos rechazados consecutivamente para una misma misión dan la victoria al mal. En esta plataforma, tras cuatro rechazos, el quinto equipo normalmente sale sin votación; las cartas de trama pueden afectar a su aprobación. En el original, el Asesino realiza la acusación final; aquí, el asesinato lo gestiona el equipo del mal. Antes de jugar presencialmente, acordad las reglas y los roles.',
    variantTitle: 'Reglas del juego de mesa y de esta plataforma',
    roundExample:
      'El líder elige a dos personas. Si al menos tres de los cinco jugadores aprueban el equipo, esas dos personas eligen sus cartas en secreto. Dos Éxitos completan la misión; un Fracaso la hace fallar. Una misión exitosa no demuestra que ambos sean buenos: un jugador del mal también puede elegir Éxito.',
    roundExampleTitle: 'Ejemplo: primera misión con cinco jugadores',
    quickStep4:
      'Revela el resultado de la misión, pasa el liderazgo y repite la formación del equipo. Tras tres misiones exitosas, el mal aún puede ganar si identifica correctamente a Merlín en la fase de asesinato.',
    quickStep3:
      'Solo los miembros del equipo eligen cartas de misión en secreto. En el juego básico, el bien debe elegir Éxito; el mal puede elegir Éxito o Fracaso. Normalmente basta un Fracaso para fallar; la cuarta misión con siete o más jugadores requiere dos.',
    quickStep2:
      'El líder elige el equipo según la tabla de jugadores que aparece abajo. Todos votan: se necesita más de la mitad de los votos a favor. Un empate rechaza el equipo.',
    quickStep1:
      'Reúne a 5–10 jugadores, reparte los roles en secreto y revela a cada persona la información que le permite su rol. El bien necesita tres misiones exitosas; el mal, tres misiones fallidas.',
    quickStartTitle: 'Cómo jugar a Avalon: guía rápida',
    numberOfPlayers: 'Número de Jugadores',
    missionNumber: 'Misión {number}',
    countPlayers: '{count} Jugadores',
    servantTeam: 'Leales Sirvientes de Arturo:',
    mordredTeam: 'Secuaces de Mordred:',
    expansions: 'Expansiones:',
    note: 'Nota: ',
    title: 'Reglas de Avalon: cómo jugar con 5–10 jugadores',
    gameObjective: 'Objetivo del Juego',
    gameDescription:
      'La Resistencia: Avalon (The Resistance: Avalon) es un juego de mesa de deducción social para 5–10 personas con roles secretos del bien y del mal. El líder propone un equipo, todos votan y sus integrantes juegan cartas de misión en secreto. Esta guía explica cómo jugar, las votaciones, la tabla de misiones y las condiciones de victoria; las diferencias con esta plataforma aparecen arriba.',
    gameplayRules: 'Reglas del Juego',
    teamProposalAndVoting: 'Propuesta de Equipo y Votación',
    teamProposalDescription:
      'El jugador con el token de Líder propone un equipo de jugadores para la misión. El número de jugadores requeridos para el equipo depende de la misión actual y del número total de jugadores en el juego.',
    votingDescription:
      'Votan todos, incluido el líder. Hace falta más de la mitad de los votos a favor; un empate rechaza el equipo. El liderazgo pasa en sentido horario y se propone otro equipo para la misma misión. En el original, cinco rechazos consecutivos dan la victoria al mal. Aquí, tras cuatro rechazos, el quinto equipo normalmente sale sin votación; las cartas de trama pueden afectar a su aprobación.',
    progressionOfPlayTitle: 'Progresión del Juego',
    leaderTokenMove:
      'Después de determinar el resultado de la misión, el token de Líder se mueve al siguiente jugador en orden de las agujas del reloj.',
    newRound:
      'Repite la formación de equipos y las misiones hasta alcanzar tres éxitos o tres fracasos. Se juegan como máximo cinco misiones; las restantes no se juegan cuando se alcanza ese resultado.',
    playersUseSkills:
      'Los jugadores deben usar sus poderes de persuasión, deducción y engaño para influir en la selección del equipo, la votación y la discusión para promover la agenda de su lado.',
    missionPhaseTitle: 'Fase de Misión',
    teamApproved:
      'Solo los miembros del equipo aprobado eligen cartas en secreto. En el juego básico, el bien debe jugar Éxito { goodLoyaltyIcon }; el mal puede jugar Éxito o Fracaso { evilLoyaltyIcon }.',
    submitCardsToLeader:
      'En una partida presencial, el líder recoge y mezcla las cartas de los miembros del equipo antes de revelarlas, para ocultar quién jugó cada carta.',
    cardsRevealed:
      'Normalmente, un Fracaso { evilLoyaltyIcon } hace fallar la misión; sin ninguno, tiene éxito { goodLoyaltyIcon }. La excepción es la cuarta misión con 7–10 jugadores: hacen falta al menos dos Fracasos, así que uno solo no impide el éxito.',
    conclusionOfGameplayTitle: 'Conclusión del Juego',
    gameplayEndsCondition:
      'Tres misiones fallidas dan la victoria inmediata al mal. Tras tres éxitos, se pasa al asesinato: en el original, el Asesino nombra a un jugador del bien después de debatir con su equipo. Si es {merlin}, gana el mal; si no, gana el bien. Aquí lo gestiona el equipo del mal; los roles personalizados pueden añadir otros objetivos. Para ganar asesinando al Clérigo tras tres misiones exitosas, el mal debe identificar a dos jugadores en orden: primero al Clérigo y después a otro jugador del bien, eligiendo tanto al jugador como su rol exacto de la lista disponible. Debe acertar ambos; un error en cualquiera de las dos etapas da la victoria al bien.',
    strategicDiscussion:
      'A través de discusiones estratégicas, observaciones cuidadosas y tácticas inteligentes, cada bando debe hacer lo mejor para lograr sus objetivos sin revelar sus verdaderas lealtades, haciendo que cada ronda de Avalon: La Resistencia sea única y llena de suspense.',
    assassinNote:
      'En el juego original, el <b>Asesino</b> hace la elección final tras debatir con el mal. Las configuraciones anteriores usan el asesinato por el equipo del mal de esta plataforma. Para jugar según el original, incluye al Asesino entre los jugadores del mal.',
    objectiveArthur: 'Objetivo para los Leales Sirvientes de Arturo {goodLoyaltyIcon}',
    objectiveMordred: 'Objetivo para los Secuaces de Mordred {evilLoyaltyIcon}',
    missionObjective:
      'Los Leales {servant} deben completar con éxito tres de las cinco misiones. Deben trabajar juntos para proponer equipos para cada misión y votar sobre las composiciones de los equipos, siempre tratando de mantener a los traidores fuera de los equipos para evitar que las misiones fracasen.',
    minionObjective:
      'Los {minion} intentan entrar en los equipos y hacer fallar tres misiones, mientras engañan a los {servant} durante el debate. Se permite mentir, pero no mostrar las cartas de personaje durante la partida.',
    additionalObjectivesTitle: 'Objetivos Adicionales',
    additionalObjectivesDescription:
      '{merlin} ve a los jugadores del mal al preparar la partida, salvo roles que se ocultan de él, como Mordred. Debe ayudar al bien sin revelar su identidad: después de tres misiones exitosas, el mal aún puede ganar si lo identifica.',
    twoFailsNote:
      'En las misiones marcadas con un asterisco (*), se requieren dos cartas de Fracaso {evilLoyaltyIcon} para que la misión fracase.',
    missionSizes: 'Tamaño del Equipo de Misión',
    excaliburHint:
      'Recomendamos añadir {excalibur} a los juegos para cualquier número de jugadores, pero solo en compañía de jugadores experimentados.',
    recommendTitle: 'Configuración Recomendada de Roles',
    generalTipsTitle: 'Consejos Generales',
    generalTipsText:
      'Avalon admite <strong>5–10 jugadores</strong>. Las configuraciones siguientes son sugerencias para esta plataforma, con algunos roles personalizados; no son la configuración obligatoria del juego original.',
    newcomersAdvice:
      'En el juego básico original, usa <strong>Merlín y el Asesino</strong> y completa el grupo con sirvientes leales y secuaces, respetando la proporción del bien y del mal. Añade roles opcionales cuando todos dominen las votaciones y las misiones.',
    recommendationAfterFirstGames:
      'Una vez dominadas las reglas básicas, prueba estos roles y variantes; Tristán e Isolda son roles personalizados de la plataforma:',
    offlineSetup: 'Configuración del juego sin conexión:',
    defaultSetup:
      'La configuración predeterminada incluye personajes como {merlin}, {percival} y {morgana}. Sin embargo, tienes la flexibilidad de personalizar el juego seleccionando los roles que mejor se adapten a tu grupo.',
    closeEyesExtendHand: 'Todos cierren sus ojos y extiendan su mano en forma de puño frente a ustedes.',
    except: 'excepto',
    seeAllAgentsOfEvil: 'abre tus ojos y mira alrededor para que conozcas a todos los agentes del Mal.',
    extendYourThumb: 'extiende tu pulgar hacia arriba',
    extendYourThumbSo: 'extiende tu pulgar hacia arriba de manera que',
    willKnowOfYou: 'te conocerán',
    closeEyes: 'cierren sus ojos',
    guinevereLookAround: 'abre tus ojos y mira alrededor para que conozcas a ambos lancelots',
    allPlayersShouldHaveEyedClosed:
      'Todos los jugadores tienen los ojos cerrados y las manos en un puño frente a ellos',
    putYourThumbDown: 'baja tu pulgar y vuelve a formar tu mano en un puño',
    merlinOpenEyes: 'abre tus ojos para ver a los agentes del mal',
    gameSetupNote:
      'Para los propósitos de la configuración del juego, el término "{minion}" se refiere a todos los agentes del Mal, a menos que se indique lo contrario',
    ordinaryMinion: 'Ordinario (sin roles adicionales)',
    everyoneOpenEyes: 'Todos abran sus ojos',
    percivalOpenEyes: 'abre tus ojos y ve',
    loversOpenEyes: 'abre tus ojos y mira alrededor para conocerse mutuamente',
    faqTitle: 'Preguntas frecuentes sobre Avalon',
    faqPlayersQuestion: '¿Cuántas personas pueden jugar a Avalon?',
    faqPlayersAnswer:
      'De 5 a 10 personas. La proporción del bien y del mal es: 5 jugadores: 3/2; 6: 4/2; 7: 4/3; 8: 5/3; 9: 6/3; 10: 6/4. Los roles especiales se incluyen en el total de su bando.',
    faqTieQuestion: '¿Qué pasa si hay empate en la votación?',
    faqTieAnswer:
      'El equipo se rechaza. Se necesita más de la mitad de los votos a favor: por ejemplo, cuatro de seis. El siguiente líder propone otro equipo para la misma misión; rechazar un equipo no equivale a fallar una misión.',
    faqMerlinQuestion: '¿El bien gana al completar tres misiones?',
    faqMerlinAnswer:
      'En una partida normal con Merlín, aún debe sobrevivir al asesinato. En el original, el Asesino tiene un intento para identificar a Merlín. Si acierta, gana el mal; si falla, gana el bien. En esta plataforma, el equipo del mal gestiona ese paso.',
  },
};
