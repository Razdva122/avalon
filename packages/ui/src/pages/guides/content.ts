export type GuideId = 'social_deduction_games_online' | 'games_like_secret_hitler' | 'avalon_vs_werewolf';

type Source = { label: string; url: string };
export type Guide = {
  slug: string;
  breadcrumb: string;
  title: string;
  lead: string;
  table: { caption: string; columns: string[]; rows: { title: string; cells: string[]; source?: Source }[] };
  sections: { title: string; paragraphs: string[]; source?: Source }[];
  preview?: boolean;
};

const secretHitlerRules = {
  label: 'Official Secret Hitler rules',
  url: 'https://www.secrethitler.com/assets/Secret_Hitler_Rules.pdf',
};
const secretHitlerOnline = { label: 'Secret Hitler.io', url: 'https://secrethitler.io/' };
const werewolfRules = {
  label: 'Ultimate Werewolf by Bézier Games',
  url: 'https://beziergames.com/products/ultimate-werewolf',
};
const oneNight = {
  label: 'One Night Ultimate Werewolf by Bézier Games',
  url: 'https://beziergames.com/products/one-night-ultimate-werewolf',
};
const browserWerewolf = { label: 'Werewolf on BoardGameJoin', url: 'https://boardgamejoin.com/en/games/werewolf/' };
const amongUs = { label: 'Among Us by Innersloth', url: 'https://www.innersloth.com/games/among-us/' };

export const guides: Record<GuideId, Guide> = {
  social_deduction_games_online: {
    slug: 'social-deduction-games-online',
    breadcrumb: 'Social deduction games',
    title: 'Social deduction games: four choices for friends',
    lead: 'Choose Avalon for mission votes without early elimination, Secret Hitler for policy cards, or Werewolf for night roles. These social deduction games have browser options for 5–10 friends; Among Us adds movement and needs an installed game.',
    preview: true,
    table: {
      caption: 'Choose a game for your next group session',
      columns: ['Game and group size', 'Choose it for', 'Practical difference'],
      rows: [
        {
          title: 'Avalon · 5–10 humans, or solo / with friends and bots',
          cells: [
            'Discussion, public votes and secret mission sabotage.',
            'Free ordinary human games for 5–10 account holders. Play solo or invite friends and let bots fill empty seats; choose the available table size and mode in setup. Nobody is eliminated during missions.',
          ],
        },
        {
          title: 'Secret Hitler · 5–10',
          cells: [
            'Electing governments and debating what happened to policy cards.',
            'Browser play exists on Secret Hitler.io, which has accounts and private-game options. Executions can remove players.',
          ],
          source: secretHitlerOnline,
        },
        {
          title: 'Werewolf · 4–30 on BoardGameJoin',
          cells: [
            'The classic day/night loop with accusations and special roles.',
            'This browser implementation includes 5–10-player groups. It resolves night actions and votes, while the host advances phases; players can be eliminated.',
          ],
          source: browserWerewolf,
        },
        {
          title: 'Among Us · 4–15',
          cells: [
            'Moving around, completing tasks and building alibis.',
            'An installed game rather than a browser option. Check everyone’s platform and chat settings before the session.',
          ],
          source: amongUs,
        },
      ],
    },
    sections: [
      {
        title: 'Which social deduction game is best for your group?',
        paragraphs: [
          'Choose Avalon if your group enjoys revisiting the same trust decisions. Everyone votes on a proposed team, but only that team submits secret mission cards. A failed mission narrows suspicion to its members; a successful mission can still contain an evil player who chose not to sabotage.',
          'Choose Secret Hitler if your group likes conflicting accounts of a private card exchange. A President and Chancellor select a policy from a draw, so the outcome and their explanations both matter. The policy deck adds uncertainty that Avalon’s base mission cards do not have.',
        ],
        source: secretHitlerRules,
      },
      {
        title: 'Choose Werewolf for night actions, Among Us for movement',
        paragraphs: [
          'Classic Werewolf and Mafia revolve around removing suspects and interpreting night actions. For a remote group, use an implementation that manages your chosen rules, or agree who will moderate. The BoardGameJoin option above automates hidden actions, but the host still moves the game between phases.',
          'Among Us adds action between discussions: Crewmates carry out tasks while Impostors sabotage and kill. Meetings turn what people saw into an accusation. It suits friends who want something to do between debates, while Avalon keeps the group focused on the shared mission decision.',
        ],
        source: amongUs,
      },
      {
        title: 'Which games avoid early player elimination?',
        paragraphs: [
          'Avalon keeps every player in the discussion and every team vote throughout the missions. Being left off a mission is temporary: you still vote, observe the result and can be selected next time. The assassination is an endgame decision, not a sequence of players sitting out the rest of the session.',
          'Do not treat every Werewolf game as an elimination game. One Night Ultimate Werewolf is a distinct 3–10-player game with one night, one discussion and no early elimination. Its publisher’s browser app is a narration aid; it is not, by itself, a complete remote multiplayer room.',
        ],
        source: oneNight,
      },
      {
        title: 'How to organize an online game with friends',
        paragraphs: [
          'Count who is actually joining, choose a common language, and decide how you will talk before sending a game link. For Avalon here, each friend needs their own account and device. Start with familiar roles and leave optional roles and expansions for a later game.',
          'If fewer than five people are ready, you can play solo or invite friends and let bots fill the empty seats. For an ordinary human game, arrange another time or recruit players. The player and group boards help people contact each other; they do not fill a room automatically or promise an immediate match.',
        ],
      },
      {
        title: 'Can you learn Avalon alone with bots?',
        paragraphs: [
          'You do not need to assemble a full group to try the mission loop. Solo bot play lets you propose teams, vote and see mission results; the guided First game helps you learn. Or invite friends and let bots fill the empty seats, choosing the table size and mode in setup.',
          'Use a bot game to learn how Merlin’s information and the final assassination fit around the missions, then teach those decisions to your human group. The lobby’s AI setup shows which modes and table sizes are currently available.',
        ],
      },
      {
        title: 'Browser games without downloads: what do you need?',
        paragraphs: [
          'For Avalon here, each player opens the room in a browser on their own phone, tablet or computer; no app installation is needed. An ordinary human game is free for 5–10 account holders. Share the room link and keep private role information on separate screens. Among Us remains the installed option in this comparison.',
          'If your friends are not all ready, you can try Avalon solo or invite friends and let bots fill empty seats. Bot play also needs an account. Check setup for available modes, discussion languages and table sizes, including sizes that require Premium; free ordinary human games do not mean all AI options are free or always available.',
        ],
      },
    ],
  },
  games_like_secret_hitler: {
    slug: 'games-like-secret-hitler',
    breadcrumb: 'Games like Secret Hitler',
    title: 'Games like Secret Hitler: try Avalon',
    lead: 'Looking for games like Secret Hitler? Avalon keeps hidden teams and majority votes for 5–10 friends, replacing policy draws with mission cards. Everyone stays involved through the missions, and you can play in a browser.',
    table: {
      caption: 'Secret Hitler and Avalon: the decisions that change',
      columns: ['Decision', 'Secret Hitler', 'Avalon'],
      rows: [
        {
          title: 'What you approve',
          cells: [
            'A President and nominated Chancellor.',
            'A mission team whose size depends on the mission and player count.',
          ],
        },
        {
          title: 'Hidden action',
          cells: [
            'The elected pair draws and discards policies.',
            'Each selected player submits a mission card in secret.',
          ],
        },
        {
          title: 'What can explain a bad result?',
          cells: [
            'Policy choices and the available draw.',
            'In the base game, at least one evil team member choosing Fail.',
          ],
        },
        {
          title: 'Participation',
          cells: [
            'Executions can remove players before the game ends.',
            'Everyone continues discussing and voting throughout the missions.',
          ],
        },
        {
          title: 'Special endgame',
          cells: [
            'Electing Hitler as Chancellor after three Fascist policies can end the game.',
            'After three successful missions, evil can still win by identifying Merlin.',
          ],
        },
      ],
    },
    sections: [
      {
        title: 'How do votes and hidden cards differ?',
        paragraphs: [
          'Both games ask a majority to approve a proposal, and a tied vote rejects it. Paying attention to who backed whom remains useful. In Avalon, ask why someone supports the whole team rather than treating its leader as the only person on trial.',
          'Secret Hitler’s policy draw can leave even loyal officeholders without a Liberal policy to enact. Base Avalon has no shared policy deck: good mission members must choose Success, while evil members may choose Success or Fail. A Fail therefore tells you something about the team, though it does not identify the individual who played it.',
        ],
        source: secretHitlerRules,
      },
      {
        title: 'Does a successful mission prove players are good?',
        paragraphs: [
          'Suppose Alice and Ben go on the first mission in a five-player game. Three approvals are enough to send them. If the mission fails, at least one of them is evil in the base setup. If it succeeds, either could still be evil and have chosen Success to earn trust.',
          'Compare their later votes and proposed teams with that result. Reusing a successful team is a decision to discuss, not a rule that those players are confirmed good. For mission four with seven or more players, two Fail cards are needed; one Fail can appear in a successful result.',
        ],
      },
      {
        title: 'Merlin and Hitler: why revealing a role matters differently',
        paragraphs: [
          'Secret Hitler makes a particular evil player’s identity central to an election win condition. Avalon gives a good player, Merlin, information about evil at setup. Merlin must guide the good team without making that knowledge obvious, because three successful missions still leave evil an assassination chance.',
          'Avoid importing a blanket “good players should reveal everything” habit. A confident explanation may help win a mission while also helping evil identify Merlin. The role guide explains what Merlin sees and which optional roles change that information.',
        ],
      },
      {
        title: 'When is Avalon a good Secret Hitler alternative?',
        paragraphs: [
          'Try Avalon if your group wants several team sizes, mission evidence, and continuous participation. Stay with Secret Hitler when policy uncertainty and executive powers are the part your friends most enjoy. Both have browser implementations; browser access alone is not the reason to switch.',
          'For an ordinary human Avalon game here, gather 5–10 people, ask everyone to sign in, and keep optional roles and expansions simple. You can also learn with bots first. Read the platform differences below before assuming the rejected-proposal or assassination rules work exactly like the physical board game.',
        ],
        source: { label: 'Secret Hitler.io rules and browser implementation', url: 'https://secrethitler.io/rules' },
      },
      {
        title: 'Learn mission voting with bots before switching',
        paragraphs: [
          'If your Secret Hitler friends are not online yet, try Avalon solo with bots. The guided First game helps you learn the team vote and mission cards without organizing a full group. Watch how a successful mission can build trust without proving someone good.',
          'Bot games also let you see Merlin and the assassination endgame before teaching them to your friends. You can invite friends and let bots fill the empty seats instead. Choose the table size and mode in setup; it shows current availability and labels sizes that require Premium.',
        ],
      },
      {
        title: 'Can you play this Secret Hitler alternative in a browser?',
        paragraphs: [
          'Yes. Avalon here runs in a browser without an app download. For a free ordinary human game, gather 5–10 people, have everyone sign in on their own device, then create a room and share its link. Browser access does not make the games identical: Avalon has missions and Merlin instead of the policy deck and government powers.',
          'You do not need a full human group to learn the difference. Choose Solo or First game in the AI setup, or choose With friends so bots can fill empty seats. An account is required; review current availability and the table sizes marked Premium before starting. AI access has separate conditions from free ordinary human rooms.',
        ],
      },
    ],
  },
  avalon_vs_werewolf: {
    slug: 'avalon-vs-werewolf',
    breadcrumb: 'Avalon vs Werewolf',
    title: 'Games like Werewolf and Mafia: how Avalon compares',
    lead: 'For games like the hidden-role party games Werewolf and Mafia, try Avalon: 5–10 friends vote on mission teams instead of eliminating suspects. Everyone participates throughout the missions. One Night Werewolf is a separate alternative without early elimination.',
    table: {
      caption: 'Classic Werewolf or Mafia compared with base Avalon',
      columns: ['Part of the game', 'Classic Werewolf / Mafia', 'Avalon'],
      rows: [
        {
          title: 'Group decision',
          cells: ['Vote to eliminate a suspect.', 'Approve or reject a proposed mission team.'],
        },
        {
          title: 'Hidden action',
          cells: [
            'Night actions such as attacks and investigations; details depend on the ruleset.',
            'Selected players submit Success or Fail mission cards.',
          ],
        },
        {
          title: 'After you are suspected',
          cells: [
            'Elimination can end your active participation.',
            'You remain in the discussion and every team vote.',
          ],
        },
        {
          title: 'Evidence over time',
          cells: [
            'Discussion, votes, night outcomes and role information.',
            'Team proposals, public approval votes and mission results.',
          ],
        },
        {
          title: 'Moderation',
          cells: [
            'A physical classic game generally has a moderator; online tools can manage actions.',
            'This platform handles secret roles, votes and mission results.',
          ],
        },
      ],
    },
    sections: [
      {
        title: 'Elimination vs mission voting: does everyone keep playing?',
        paragraphs: [
          'In classic Werewolf, the village discusses suspects during the day and the hidden enemy acts at night. Eliminated players generally stop taking part in the active discussion and votes. Mafia has many local rules, so agree on the version rather than assuming all roles and win conditions match.',
          'In Avalon, leaving someone off a team does not remove them from the game. They can challenge the proposal, vote on it, and become the next leader. Even a player everyone distrusts can influence the outcome, which changes how the group must deal with suspicion.',
        ],
        source: werewolfRules,
      },
      {
        title: 'What replaces the vote to eliminate a suspect?',
        paragraphs: [
          'Instead of stopping at “Alice sounds evil,” ask which team you would approve and why. In a five-player game the first mission needs two people, and at least three of all five players must approve. Only the selected pair chooses mission cards; everyone gets to assess the result.',
          'A Fail in a base-game mission means at least one of its members is evil. It does not reveal who sabotaged it. A Success does not clear both members, because evil can choose Success. Keep comparing each person’s proposed teams and votes rather than turning one result into certainty.',
        ],
      },
      {
        title: 'Merlin is not a Seer who investigates each night',
        paragraphs: [
          'The classic Werewolf Seer learns information through night actions. Avalon’s Merlin gets information at setup, with exceptions for roles such as Mordred. There is no repeating night investigation in base Avalon. Merlin’s challenge is to help good without being identified.',
          'After three failed missions, evil wins. After three successful missions, evil still gets an assassination attempt against Merlin. That is the final decision of the game, not early elimination followed by more rounds without the target.',
        ],
      },
      {
        title: 'Does One Night Werewolf also avoid early elimination?',
        paragraphs: [
          'One Night Ultimate Werewolf already avoids early elimination and does not need a moderator. It covers one night and the following discussion, rather than the repeated day/night cycle of classic Werewolf. If your group already plays One Night, Avalon offers a sequence of mission votes and results, not an exclusive claim to keeping everyone involved.',
        ],
        source: oneNight,
      },
      {
        title: 'When to choose Avalon, Werewolf or Mafia',
        paragraphs: [
          'Choose ordinary human Avalon for continuous discussion, a fixed 5–10-player group, and several chances to test teams. Avalon’s bot games also let you try the same mission decisions solo or with friends. Choose classic Werewolf or Mafia if night powers, eliminating suspects and a changing player count are what your group enjoys. Online Werewolf implementations exist too, including the browser option linked here.',
          'To switch, teach the team vote and mission cards first, then explain Merlin and assassination. Use the player-count and role tables in our rules rather than carrying your Mafia role balance over to Avalon.',
        ],
        source: browserWerewolf,
      },
      {
        title: 'Practice Avalon with bots before inviting your Mafia group',
        paragraphs: [
          'Try Solo or the guided First game to replace the familiar elimination vote with a mission-team vote. Bots fill the table, while you make your own discussion and board decisions. Notice that being left off a mission still lets you vote and observe its result.',
          'Use that game to understand Merlin’s setup information and the assassination decision, then bring the lesson to your Werewolf or Mafia group. Or invite friends and let bots fill the empty seats. Choose the table size, mode and supported discussion language in setup, which shows current availability.',
        ],
      },
      {
        title: 'Can you try a no-elimination alternative online without a download?',
        paragraphs: [
          'Avalon here runs in your browser and handles secret roles, team votes and mission results. You do not need an app or a separate person to resolve those actions. For an ordinary human room, 5–10 players each need an account and their own device; those games are free. Agree on text or voice discussion before sharing the room link.',
          'If you want to test mission voting before organizing your Mafia group, play solo with bots or invite friends and fill empty seats with bots. AI setup shows the currently available modes, supported discussion languages and table sizes that need Premium. Bot play requires an account and has its own availability; check the AI table sizes separately from the human game’s 5–10-player range.',
        ],
      },
    ],
  },
};

export const copy = {
  home: 'Home',
  breadcrumbLabel: 'Breadcrumb',
  tocTitle: 'In this article',
  comparisonLabel: 'Compare the games',
  setupLabel: 'Game access and getting started',
  aiAccessNote: 'Account required. Check setup for languages, modes and Premium access.',
  setupTitle: 'Playing Avalon here: friends or bots',
  humanTitle: 'Ordinary games with human friends',
  playersLabel: 'Players',
  humanPlayers: '5–10 humans, each on their own device.',
  accessLabel: 'Access',
  humanAccess: 'Free browser games. Every player needs an account.',
  discussionLabel: 'Discussion',
  humanDiscussion: 'Text chat and optional voice chat (beta).',
  findingGroupLabel: 'Finding a group',
  findingGroup: 'Arrange a session with friends or use the player and group boards.',
  boardsNote: 'The boards help you coordinate; they do not guarantee immediate matchmaking.',
  aiTitle: 'Try alone or with friends and bots',
  aiIntro:
    'Play solo or invite friends, and let bots fill the empty seats. Choose the table size and mode in setup. New to Avalon? Try the guided First game.',
  aiAvailability:
    'You need an account. Bot discussions are available in English, Russian, Traditional Chinese, Spanish and Vietnamese. Choose your mode in setup; it shows current availability and labels table sizes that require Premium.',
  startLabel: 'Start playing Avalon',
  aiCta: 'Try a game with bots',
  lobbyCta: 'Open Avalon lobby',
  findGroupCta: 'Find a group',
  rulesCta: 'Learn Avalon rules and mission voting',
  sourceLabel: 'Source',
  variantTitle: 'Two rules to check before your first game',
  proposalVariant:
    'In the original Avalon board game, five rejected teams in a row give evil the win. Here, after four rejected proposals, the fifth team normally goes on the mission without a vote; Plot Cards can affect approval.',
  assassinationVariant:
    'The original game assigns the final Merlin guess to the Assassin after evil discusses it. In ordinary human rooms here, the evil team handles assassination. Bot games also include an evil council before their assassination decision. Optional and custom roles can change available targets, so check the room’s setup.',
  fullRulesCta: 'Read Avalon rules, mission sizes and role setups',
  previewAlt: 'Avalon game board with eight player seats and mission results',
  previewCaption: 'An Avalon board showing mission results, from the site’s existing gameplay preview.',
  nextTitle: 'Start with bots or bring your friends',
  nextAi:
    'Want to learn before inviting a full group? Open Play with AI in the lobby, review the available modes and choose Solo or the guided First game. To invite friends, choose With friends and share the prepared room’s link so they can join before you start.',
  nextHuman:
    'Ask 5–10 friends to create accounts, agree on a language and how you will talk, then open the lobby and create a room. Share its link with your group. New to Avalon? Teach the team vote and mission cards before adding optional roles.',
  arrangeLabel: 'Play or arrange an Avalon game',
  browseGroupsCta: 'Browse Avalon groups',
  findPlayersCta: 'Find Avalon players',
  merlinCta: 'Learn who Merlin sees and how assassination works',
  relatedLabel: 'More social deduction guides',
  relatedTitle: 'Compare Avalon with other social deduction games',
  ownership:
    'Game names belong to their respective owners. This comparison does not imply their endorsement of this platform.',
};
export type GuideCopy = typeof copy;
export type GuideLocale = { guides: Record<GuideId, Guide>; copy: GuideCopy };
