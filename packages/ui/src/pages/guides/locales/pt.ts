import type { GuideId, Guide, GuideCopy } from '../content';

const secretHitlerRules = {
  label: 'Regras oficiais de Secret Hitler',
  url: 'https://www.secrethitler.com/assets/Secret_Hitler_Rules.pdf',
};
const secretHitlerOnline = { label: 'Secret Hitler.io', url: 'https://secrethitler.io/' };
const werewolfRules = {
  label: 'Ultimate Werewolf da Bézier Games',
  url: 'https://beziergames.com/products/ultimate-werewolf',
};
const oneNight = {
  label: 'One Night Ultimate Werewolf da Bézier Games',
  url: 'https://beziergames.com/products/one-night-ultimate-werewolf',
};
const browserWerewolf = {
  label: 'Werewolf (Lobisomem) no BoardGameJoin',
  url: 'https://boardgamejoin.com/en/games/werewolf/',
};
const amongUs = { label: 'Among Us da Innersloth', url: 'https://www.innersloth.com/games/among-us/' };

export const guides: Record<GuideId, Guide> = {
  social_deduction_games_online: {
    slug: 'social-deduction-games-online',
    breadcrumb: 'Jogos de dedução social online',
    title: 'Jogos de dedução social online para jogar com amigos',
    lead: 'Compare dedução social online: Avalon, Secret Hitler e Lobisomem no navegador; Among Us precisa de instalação. Escolha Avalon para missões sem eliminação precoce.',
    preview: true,
    table: {
      caption: 'Escolha um jogo para a próxima sessão do seu grupo',
      columns: ['Jogo e tamanho do grupo', 'Escolha se você busca', 'Diferença prática'],
      rows: [
        {
          title: 'Avalon · 5–10 pessoas, ou sozinho / com amigos e bots',
          cells: [
            'Discussão, votações públicas e sabotagem secreta de missões.',
            'Partidas comuns gratuitas para 5–10 pessoas com conta. Jogue sozinho ou convide amigos e deixe os bots preencherem os lugares vazios; escolha o tamanho da mesa e o modo disponíveis na configuração. Ninguém é eliminado durante as missões.',
          ],
        },
        {
          title: 'Secret Hitler · 5–10',
          cells: [
            'Eleger governos e discutir o que aconteceu com as cartas de política.',
            'É possível jogar no navegador em Secret Hitler.io, que oferece contas e opções de partidas privadas. As execuções podem eliminar jogadores.',
          ],
          source: secretHitlerOnline,
        },
        {
          title: 'Lobisomem (Werewolf) · 4–30 no BoardGameJoin',
          cells: [
            'O ciclo clássico de dia e noite com acusações e papéis especiais.',
            'Esta versão para navegador comporta grupos de 5–10 jogadores. Ela resolve ações noturnas e votações, enquanto o anfitrião avança as fases; os jogadores podem ser eliminados.',
          ],
          source: browserWerewolf,
        },
        {
          title: 'Among Us · 4–15',
          cells: [
            'Movimentar-se, concluir tarefas e construir álibis.',
            'É um jogo que precisa ser instalado, em vez de uma opção para navegador. Confira as plataformas e configurações de chat de todos antes da sessão.',
          ],
          source: amongUs,
        },
      ],
    },
    sections: [
      {
        title: 'Avalon ou Secret Hitler: missões ou políticas',
        paragraphs: [
          'Escolha Avalon se seu grupo gosta de reavaliar as mesmas decisões de confiança. Todos votam na equipe proposta, mas apenas essa equipe entrega cartas de missão em segredo. Uma missão que falha concentra a suspeita em seus membros; uma missão bem-sucedida ainda pode incluir um jogador do Mal que decidiu não sabotar.',
          'Escolha Secret Hitler se seu grupo gosta de relatos contraditórios sobre uma troca privada de cartas. Um Presidente e um Chanceler selecionam uma política entre as cartas compradas, então tanto o resultado quanto suas explicações importam. O baralho de políticas acrescenta uma incerteza que as cartas de missão do Avalon básico não têm.',
        ],
        source: secretHitlerRules,
      },
      {
        title: 'Lobisomem ou Among Us: ações noturnas ou movimento',
        paragraphs: [
          'Lobisomem clássico e Máfia giram em torno de eliminar suspeitos e interpretar ações noturnas. Para um grupo a distância, use uma versão que gerencie as regras escolhidas ou combinem quem será o moderador. A opção do BoardGameJoin citada acima automatiza ações ocultas, mas o anfitrião ainda avança as fases da partida.',
          'Among Us acrescenta ação entre as discussões: os Tripulantes realizam tarefas enquanto os Impostores sabotam e matam. As reuniões transformam o que as pessoas viram em uma acusação. É uma boa opção para amigos que querem algo para fazer entre debates, enquanto Avalon mantém o grupo concentrado na decisão compartilhada sobre a missão.',
        ],
        source: amongUs,
      },
      {
        title: 'Quais jogos mantêm todos participando',
        paragraphs: [
          'Avalon mantém todos os jogadores na discussão e em cada votação de equipe ao longo das missões. Ficar de fora de uma missão é temporário: você ainda vota, observa o resultado e pode ser escolhido na próxima vez. O assassinato é uma decisão no fim da partida, e não uma sequência de jogadores que deixam de participar pelo restante da sessão.',
          'Não considere toda versão de Lobisomem um jogo com eliminação durante a partida. One Night Ultimate Werewolf é um jogo distinto para 3–10 jogadores, com uma noite, uma discussão e sem eliminação precoce. O aplicativo de navegador da editora serve como auxílio de narração; sozinho, ele não é uma sala completa para partidas multijogador a distância.',
        ],
        source: oneNight,
      },
      {
        title: 'Como organizar uma partida online com amigos',
        paragraphs: [
          'Conte quem realmente vai participar, escolha um idioma em comum e decidam como vão conversar antes de enviar o link do jogo. Para jogar Avalon aqui, cada amigo precisa de sua própria conta e dispositivo. Comece com papéis conhecidos e deixe papéis opcionais e expansões para uma partida posterior.',
          'Se menos de cinco pessoas estiverem prontas, você pode jogar sozinho ou convidar amigos e deixar os bots preencherem os lugares vazios. Para uma partida comum entre pessoas, combinem outro horário ou procurem mais jogadores. Os murais de jogadores e grupos ajudam as pessoas a entrar em contato; eles não preenchem uma sala automaticamente nem prometem uma partida imediata.',
        ],
      },
      {
        title: 'Aprenda Avalon com bots antes da sessão com seu grupo',
        paragraphs: [
          'Você não precisa reunir um grupo completo para experimentar a dinâmica das missões. Jogar sozinho com bots permite propor equipes, votar e ver os resultados das missões; o modo guiado Primeira partida ajuda você a aprender. Ou convide amigos e deixe os bots preencherem os lugares vazios, escolhendo o tamanho da mesa e o modo na configuração.',
          'Use uma partida com bots para aprender como a informação de Merlin e o assassinato final se encaixam nas missões, depois ensine essas decisões ao seu grupo de pessoas. A configuração de IA no lobby mostra quais modos e tamanhos de mesa estão disponíveis no momento.',
        ],
      },
      {
        title: 'Jogar no navegador não é o mesmo que passar um celular',
        paragraphs: [
          'Alguns jogos de papéis ocultos usam uma página para distribuir os papéis em um único celular, numa reunião presencial. Para amigos a distância, confira se cada pessoa consegue entrar na mesma sala pelo próprio dispositivo. Avalon aqui funciona no navegador; Among Us precisa ser instalado em uma plataforma compatível.',
          'As partidas comuns de Avalon com 5–10 pessoas são gratuitas, e todos precisam de uma conta. Para jogar sozinho ou com amigos e bots, consulte a configuração antes de combinar a sessão: ela mostra a disponibilidade e os tamanhos que exigem Premium. Os bots discutem em inglês, russo e chinês tradicional; uma interface em português não significa que os bots conversem em português.',
        ],
      },
    ],
  },
  games_like_secret_hitler: {
    slug: 'games-like-secret-hitler',
    breadcrumb: 'Jogos parecidos com Secret Hitler',
    title: 'Jogos parecidos com Secret Hitler: o que muda em Avalon',
    lead: 'Avalon é uma alternativa a Secret Hitler para 5–10 pessoas: troca políticas por missões. Mantém papéis ocultos e votações em grupo, sem eliminação precoce.',
    table: {
      caption: 'Secret Hitler e Avalon: as decisões que mudam',
      columns: ['Decisão', 'Secret Hitler', 'Avalon'],
      rows: [
        {
          title: 'O que você aprova',
          cells: [
            'Um Presidente e um candidato a Chanceler.',
            'Uma equipe cujo tamanho depende da missão e do número de jogadores.',
          ],
        },
        {
          title: 'Ação oculta',
          cells: [
            'A dupla eleita compra e descarta políticas.',
            'Cada jogador selecionado entrega uma carta de missão em segredo.',
          ],
        },
        {
          title: 'O que pode explicar um resultado ruim?',
          cells: [
            'As políticas escolhidas e as cartas disponíveis na compra.',
            'No jogo básico, pelo menos um membro do Mal na equipe que escolhe Falha.',
          ],
        },
        {
          title: 'Participação',
          cells: [
            'As execuções podem eliminar jogadores antes de a partida terminar.',
            'Todos continuam discutindo e votando ao longo das missões.',
          ],
        },
        {
          title: 'Final especial',
          cells: [
            'Eleger Hitler como Chanceler após três políticas Fascistas pode encerrar a partida.',
            'Após três missões bem-sucedidas, o Mal ainda pode vencer identificando Merlin.',
          ],
        },
      ],
    },
    sections: [
      {
        title: 'Da votação de um governo à escolha de uma equipe',
        paragraphs: [
          'Os dois jogos exigem que uma maioria aprove uma proposta, e um empate a rejeita. Prestar atenção em quem apoiou quem continua sendo útil. Em Avalon, pergunte por que alguém apoia a equipe inteira, em vez de tratar seu líder como a única pessoa sob suspeita.',
          'Em Secret Hitler, as políticas compradas podem deixar até ocupantes leais dos cargos sem uma política Liberal para aprovar. Avalon básico não tem um baralho de políticas compartilhado: os membros do Bem na missão devem escolher Sucesso, enquanto os membros do Mal podem escolher Sucesso ou Falha. Portanto, uma Falha revela algo sobre a equipe, embora não identifique a pessoa que jogou a carta.',
        ],
        source: secretHitlerRules,
      },
      {
        title: 'Por que uma missão bem-sucedida não prova inocência',
        paragraphs: [
          'Suponha que Alice e Bruno vão à primeira missão em uma partida de cinco jogadores. Três votos a favor bastam para enviá-los. Se a missão falhar, pelo menos um deles é do Mal na configuração básica. Se for bem-sucedida, qualquer um dos dois ainda pode ser do Mal e ter escolhido Sucesso para ganhar confiança.',
          'Compare seus votos e propostas de equipe posteriores com esse resultado. Repetir uma equipe bem-sucedida é uma decisão a discutir, não uma regra que confirme que esses jogadores são do Bem. Na quarta missão com sete ou mais jogadores, são necessárias duas cartas de Falha; uma única Falha pode aparecer em um resultado bem-sucedido.',
        ],
      },
      {
        title: 'Merlin inverte o problema das identidades ocultas',
        paragraphs: [
          'Em Secret Hitler, a identidade de um jogador específico do lado fascista é central para uma condição de vitória por eleição. Avalon dá a um jogador do Bem, Merlin, informações sobre o Mal na preparação da partida. Merlin precisa guiar o Bem sem deixar esse conhecimento evidente, porque três missões bem-sucedidas ainda dão ao Mal uma chance de assassinato.',
          'Evite trazer a ideia de que “jogadores do Bem devem revelar tudo” para qualquer situação. Uma explicação confiante pode ajudar a vencer uma missão e também ajudar o Mal a identificar Merlin. O guia de papéis explica quem Merlin vê e quais papéis opcionais alteram essa informação.',
        ],
      },
      {
        title: 'Quando escolher Avalon como alternativa a Secret Hitler',
        paragraphs: [
          'Experimente Avalon se seu grupo quer equipes de vários tamanhos, evidências das missões e participação contínua. Continue com Secret Hitler se a incerteza das políticas e os poderes executivos forem o que seus amigos mais gostam. Ambos têm versões para navegador; o acesso pelo navegador, por si só, não é motivo para mudar.',
          'Para uma partida comum de Avalon entre pessoas aqui, reúna 5–10 jogadores, peça que todos entrem em suas contas e mantenha os papéis opcionais e as expansões simples. Você também pode aprender com bots primeiro. Leia as diferenças da plataforma abaixo antes de presumir que as regras de propostas rejeitadas ou de assassinato funcionam exatamente como no jogo de tabuleiro físico.',
        ],
        source: { label: 'Regras e versão para navegador de Secret Hitler.io', url: 'https://secrethitler.io/rules' },
      },
      {
        title: 'Experimente a mudança primeiro com bots',
        paragraphs: [
          'Se seus amigos de Secret Hitler ainda não estiverem online, experimente Avalon sozinho com bots. O modo guiado Primeira partida ajuda você a aprender a votação de equipe e as cartas de missão sem organizar um grupo completo. Observe como uma missão bem-sucedida pode gerar confiança sem provar que alguém é do Bem.',
          'As partidas com bots também permitem conhecer Merlin e o assassinato final antes de ensiná-los aos seus amigos. Você pode, como alternativa, convidar amigos e deixar os bots preencherem os lugares vazios. Escolha o tamanho da mesa e o modo na configuração; ela mostra a disponibilidade atual e identifica os tamanhos que exigem Premium.',
        ],
      },
      {
        title: 'Uma alternativa a Secret Hitler para testar sem baixar um aplicativo',
        paragraphs: [
          'Você pode experimentar Avalon aqui no navegador, com cada amigo em seu dispositivo e sua conta. Uma sala comum precisa de 5–10 pessoas. Compartilhar o link ajuda o grupo a entrar, mas não procura jogadores nem preenche os lugares automaticamente.',
          'Antes de trocar o jogo da turma, decidam entre uma partida gratuita com pessoas e uma partida para aprender sozinho ou com amigos e bots. Jogar com IA mostra a disponibilidade e os tamanhos que exigem Premium; confira também se todos conseguem acompanhar a discussão em inglês, russo ou chinês tradicional.',
        ],
      },
    ],
  },
  avalon_vs_werewolf: {
    slug: 'avalon-vs-werewolf',
    breadcrumb: 'Avalon vs Lobisomem',
    title: 'Avalon vs Lobisomem: sem eliminação precoce',
    lead: 'Avalon é uma alternativa a Lobisomem, o jogo de cartas, para 5–10 pessoas. Troca as ações noturnas por missões e mantém todos discutindo e votando, sem eliminação precoce.',
    table: {
      caption: 'Lobisomem clássico ou Máfia comparados com Avalon básico',
      columns: ['Parte do jogo', 'Lobisomem clássico / Máfia', 'Avalon'],
      rows: [
        {
          title: 'Decisão do grupo',
          cells: ['Votar para eliminar um suspeito.', 'Aprovar ou rejeitar a equipe de missão proposta.'],
        },
        {
          title: 'Ação oculta',
          cells: [
            'Ações noturnas como ataques e investigações; os detalhes dependem das regras.',
            'Os jogadores selecionados entregam cartas de missão de Sucesso ou Falha.',
          ],
        },
        {
          title: 'Quando suspeitam de você',
          cells: [
            'A eliminação pode encerrar sua participação ativa.',
            'Você continua na discussão e em cada votação de equipe.',
          ],
        },
        {
          title: 'Evidências ao longo da partida',
          cells: [
            'Discussão, votos, resultados noturnos e informações dos papéis.',
            'Propostas de equipe, votos públicos de aprovação e resultados das missões.',
          ],
        },
        {
          title: 'Moderação',
          cells: [
            'Uma partida clássica presencial geralmente tem um moderador; ferramentas online podem gerenciar as ações.',
            'Esta plataforma gerencia papéis secretos, votações e resultados das missões.',
          ],
        },
      ],
    },
    sections: [
      {
        title: 'Votação de equipe ou eliminação de jogadores',
        paragraphs: [
          'Em Lobisomem clássico, a aldeia discute suspeitos durante o dia e o inimigo oculto age à noite. Os jogadores eliminados geralmente deixam de participar da discussão ativa e das votações. Máfia tem muitas regras locais, então combinem a versão em vez de presumir que todos os papéis e condições de vitória são iguais.',
          'Em Avalon, deixar alguém fora de uma equipe não o elimina da partida. Essa pessoa pode questionar a proposta, votar nela e se tornar o próximo líder. Até um jogador de quem todos desconfiam pode influenciar o resultado, o que muda a maneira como o grupo precisa lidar com a suspeita.',
        ],
        source: werewolfRules,
      },
      {
        title: 'O que uma missão que falha revela em Avalon',
        paragraphs: [
          'Em vez de parar em “Alice parece ser do Mal”, pergunte qual equipe você aprovaria e por quê. Em uma partida de cinco jogadores, a primeira missão precisa de duas pessoas, e pelo menos três dos cinco jogadores devem aprová-la. Só a dupla selecionada escolhe cartas de missão; todos podem avaliar o resultado.',
          'Uma Falha em uma missão do jogo básico significa que pelo menos um de seus membros é do Mal. Ela não revela quem sabotou. Um Sucesso não comprova que os dois membros são do Bem, porque o Mal pode escolher Sucesso. Continue comparando as equipes propostas e os votos de cada pessoa, em vez de transformar um resultado em certeza.',
        ],
      },
      {
        title: 'Merlin não é um Vidente que investiga a cada noite',
        paragraphs: [
          'O Vidente de Lobisomem clássico obtém informações por meio de ações noturnas. Merlin em Avalon recebe informações na preparação da partida, com exceções para papéis como Mordred. Não há investigação noturna repetida em Avalon básico. O desafio de Merlin é ajudar o Bem sem ser identificado.',
          'Após três missões que falham, o Mal vence. Após três missões bem-sucedidas, o Mal ainda tem uma tentativa de assassinato contra Merlin. Essa é a decisão final da partida, e não uma eliminação precoce seguida de mais rodadas sem o alvo.',
        ],
      },
      {
        title: 'A comparação com One Night Ultimate Werewolf é diferente',
        paragraphs: [
          'One Night Ultimate Werewolf já evita a eliminação precoce e não precisa de moderador. Ele abrange uma noite e a discussão seguinte, em vez do ciclo repetido de dia e noite de Lobisomem clássico. Se seu grupo já joga One Night, Avalon oferece uma sequência de votações de equipe e resultados de missão; manter todos envolvidos não é exclusividade de Avalon.',
        ],
        source: oneNight,
      },
      {
        title: 'Quando trocar Lobisomem ou Máfia por Avalon',
        paragraphs: [
          'Escolha uma partida comum de Avalon entre pessoas para discussão contínua, um grupo fixo de 5–10 jogadores e várias oportunidades de testar equipes. As partidas com bots de Avalon também permitem experimentar as mesmas decisões de missão sozinho ou com amigos. Escolha Lobisomem clássico ou Máfia se seu grupo gosta de poderes noturnos, de eliminar suspeitos e de um número de participantes que muda ao longo da partida. Também existem versões online de Lobisomem, incluindo a opção para navegador com link aqui.',
          'Para mudar de jogo, ensine primeiro a votação de equipe e as cartas de missão, depois explique Merlin e o assassinato. Use as tabelas de número de jogadores e papéis nas nossas regras, em vez de trazer o equilíbrio de papéis de Máfia para Avalon.',
        ],
        source: browserWerewolf,
      },
      {
        title: 'Aprenda a votar equipes com bots antes de convidar sua aldeia',
        paragraphs: [
          'Experimente Sozinho ou o modo guiado Primeira partida para trocar a conhecida votação de eliminação por uma votação de equipe de missão. Os bots preenchem a mesa, enquanto você participa da discussão e toma suas próprias decisões de jogo. Observe que ficar de fora de uma missão ainda permite votar e acompanhar o resultado.',
          'Use essa partida para entender as informações iniciais de Merlin e a decisão de assassinato, depois leve o aprendizado ao seu grupo de Lobisomem ou Máfia. Ou convide amigos e deixe os bots preencherem os lugares vazios. Escolha o tamanho da mesa, o modo e um dos idiomas de discussão compatíveis na configuração, que mostra a disponibilidade atual.',
        ],
      },
      {
        title: 'Como experimentar Avalon online com sua turma de Cidade Dorme',
        paragraphs: [
          'Se você conhece Lobisomem ou Máfia como Cidade Dorme, com um narrador e um celular para distribuir os papéis, a primeira diferença prática é que aqui cada jogador precisa de uma conta e do próprio dispositivo. Avalon gerencia os papéis secretos, os votos e as missões no navegador; a discussão continua por conta de vocês.',
          'Para uma partida comum gratuita, reúna 5–10 pessoas. Se parte da turma ainda não chegou, experimente sozinho ou com amigos e bots antes de marcar a sessão do grupo completo. Confira na configuração a disponibilidade, os tamanhos que exigem Premium e os idiomas de discussão compatíveis: inglês, russo e chinês tradicional.',
        ],
      },
    ],
  },
};

export const copy: GuideCopy = {
  tocTitle: 'Neste artigo',
  comparisonLabel: 'Comparação de jogos',
  setupLabel: 'Condições e início da partida',
  aiAccessNote: 'É preciso ter uma conta. Idiomas, modos e Premium são indicados na configuração.',
  home: 'Início',
  breadcrumbLabel: 'Caminho de navegação',
  setupTitle: 'Jogar Avalon aqui: amigos ou bots',
  humanTitle: 'Partidas comuns com amigos humanos',
  playersLabel: 'Jogadores',
  humanPlayers: '5–10 pessoas, cada uma em seu próprio dispositivo.',
  accessLabel: 'Acesso',
  humanAccess: 'Partidas gratuitas no navegador. Cada jogador precisa de uma conta.',
  discussionLabel: 'Discussão',
  humanDiscussion: 'Chat de texto e chat de voz opcional (beta).',
  findingGroupLabel: 'Encontrar um grupo',
  findingGroup: 'Organize uma sessão com amigos ou use os murais de jogadores e grupos.',
  boardsNote: 'Os murais ajudam na organização; eles não garantem encontrar uma partida imediatamente.',
  aiTitle: 'Experimente sozinho ou com amigos e bots',
  aiIntro:
    'Jogue sozinho ou convide amigos e deixe os bots preencherem os lugares vazios. Escolha o tamanho da mesa e o modo na configuração. É sua primeira vez em Avalon? Experimente o modo guiado Primeira partida.',
  aiAvailability:
    'Você precisa de uma conta. As discussões com bots estão disponíveis em inglês, russo e chinês tradicional. Escolha seu modo na configuração; ela mostra a disponibilidade atual e identifica os tamanhos de mesa que exigem Premium.',
  startLabel: 'Comece a jogar Avalon',
  aiCta: 'Experimente uma partida com bots',
  lobbyCta: 'Abra o lobby de Avalon',
  findGroupCta: 'Encontre um grupo',
  rulesCta: 'Aprenda as regras',
  sourceLabel: 'Fonte',
  variantTitle: 'Duas regras para conferir antes da primeira partida',
  proposalVariant:
    'No jogo de tabuleiro original de Avalon, cinco equipes rejeitadas seguidas dão a vitória ao Mal. Aqui, após quatro propostas rejeitadas, a quinta equipe normalmente vai à missão sem votação; as Cartas de Enredo podem afetar a aprovação.',
  assassinationVariant:
    'No jogo original, o Assassino faz a escolha final de quem é Merlin depois de o Mal discutir. Nas salas comuns entre pessoas desta plataforma, a equipe do Mal cuida do assassinato. As partidas com bots também incluem um conselho do Mal antes da decisão de assassinato. Papéis opcionais e personalizados podem alterar os alvos disponíveis, então confira a configuração da sala.',
  fullRulesCta: 'Leia as regras completas e as tabelas de número de jogadores',
  previewAlt: 'Tabuleiro de Avalon com oito lugares para jogadores e resultados das missões',
  previewCaption: 'Um tabuleiro de Avalon com resultados das missões, extraído da prévia de jogo existente no site.',
  nextTitle: 'Comece com bots ou traga seus amigos',
  nextAi:
    'Quer aprender antes de convidar um grupo completo? Abra Jogar com IA no lobby, confira os modos disponíveis e escolha Sozinho ou o modo guiado Primeira partida. Para convidar amigos, escolha Com amigos e compartilhe o link da sala preparada para que eles entrem antes de você começar.',
  nextHuman:
    'Peça a 5–10 amigos que criem contas, combinem um idioma e como vão conversar, depois abra o lobby e crie uma sala. Compartilhe o link com seu grupo. É a primeira vez de vocês em Avalon? Ensine a votação de equipe e as cartas de missão antes de adicionar papéis opcionais.',
  arrangeLabel: 'Jogue ou organize uma partida de Avalon',
  browseGroupsCta: 'Explore os grupos',
  findPlayersCta: 'Encontre jogadores',
  merlinCta: 'Entenda Merlin',
  relatedLabel: 'Mais guias de dedução social',
  relatedTitle: 'Continue comparando',
  ownership:
    'Os nomes dos jogos pertencem aos seus respectivos proprietários. Esta comparação não implica que eles apoiem esta plataforma.',
};
