module.exports.routesSeo = {
  lobby: {
    path: '/',
    name: 'lobby',
    meta: {
      prerender: true,
      title: 'Play Avalon Online!',
      description:
        "Explore the legendary game of strategic deduction with 'Avalon: The Resistance' — free to play online. Learn the rules, join a spirited community.",
      keywords: ['Play'],
    },
  },
  about: {
    path: '/about/',
    name: 'about',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | About',
      description:
        "Dive into avalon-game.com: a comprehensive platform dedicated to 'Avalon: The Resistance'. Discover the story behind the game, its official rules, and how we bring together Avalon enthusiasts worldwide.",
      keywords: ['About', 'Information', 'Rules'],
    },
  },
  room: {
    path: '/room/:uuid/',
    props: true,
    name: 'room',
    meta: {
      title: 'Avalon: The Resistance | Game',
      skipSiteMap: true,
      description: "Rooms for online games in 'Avalon: The Resistance'",
      keywords: ['Game'],
    },
  },
  wiki: {
    path: '/wiki/',
    name: 'wiki',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Wiki',
      description:
        "Your go-to 'Avalon: The Resistance' Wiki resource. Find detailed guides on playing Avalon, rules explanation, and strategy tips.",
      keywords: ['Wiki', 'Rules', 'How to play'],
    },
  },
  rules: {
    path: '/wiki/rules/',
    name: 'rules',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Rules',
      description:
        "Master 'Avalon: The Resistance' with a complete guide to the official rulebook. From setting up the game to the intricate roles of each character, get all the knowledge for a winning strategy.",
      keywords: ['Wiki', 'Rules', 'How to play'],
    },
  },
  addons: {
    path: '/wiki/addons/',
    name: 'addons',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Addons for game',
      description:
        "Enhance 'Avalon: The Resistance' with exciting add-ons and extra cards. Learn how each addition can spice up your game sessions and bring new challenges to the table.",
      keywords: ['Addons', 'Module', 'Rules'],
      image: 'features/lady_of_lake.webp',
    },
  },
  lady: {
    path: '/wiki/addons/lady/',
    name: 'lady',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Lady of the Lake',
      description:
        "Rules for 'Lady of the Lake' card in 'Avalon: The Resistance'. Rules for 'Inquisitor Token' card in 'The Resistance'",
      keywords: ['Addons', 'Module', 'Lady of the Lake', 'Inquisitor Token', 'Rules'],
      image: 'features/lady_of_lake.webp',
    },
  },
  excalibur: {
    path: '/wiki/addons/excalibur/',
    name: 'excalibur',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Excalibur',
      description:
        "Rules for 'Excalibur' card in 'Avalon: The Resistance'. Rules for 'Sergeant' card in 'The Resistance'",
      keywords: ['Addons', 'Module', 'Excalibur', 'Sergeant', 'Rules'],
      image: 'features/excalibur.webp',
    },
  },
  roles: {
    path: '/wiki/roles/',
    name: 'roles',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Roles',
      description:
        "All available roles in the board game 'Avalon: The Resistance'. Rules for roles: Merlin, Percival, Morgana, Oberon, Mordred",
      keywords: ['Roles', 'Rules', 'Merlin', 'Percival', 'Morgana', 'Oberon', 'Mordred', 'Tips'],
    },
  },
  merlin: {
    path: '/wiki/roles/merlin/',
    name: 'merlin',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Merlin',
      description: "Rules and Tips for Merlin role in the board game 'Avalon: The Resistance'",
      keywords: ['Merlin', 'Role', 'Rules', 'Tips'],
      image: 'roles/merlin.webp',
    },
  },
  merlin_pure: {
    path: '/wiki/roles/merlin_pure/',
    name: 'merlin_pure',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Merlin Pure',
      description: "Rules and Tips for Merlin Pure role in the board game 'Avalon: The Resistance'",
      keywords: ['Merlin Pure', 'Role', 'Rules', 'Tips'],
      image: 'roles/merlin_pure.webp',
    },
  },
  lovers: {
    path: '/wiki/roles/lovers/',
    name: 'lovers',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Lovers (Tristan and Isolde)',
      description: "Rules and Tips for Lovers (Tristan and Isolde) roles in the board game 'Avalon: The Resistance'",
      keywords: ['Lovers', 'Tristan', 'Isolde', 'Role', 'Rules', 'Tips'],
      image: 'roles/tristan.webp',
    },
  },
  lancelots: {
    path: '/wiki/roles/lancelots/',
    name: 'lancelots',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Lancelots',
      description: "Rules and Tips for Lancelots roles in the board game 'Avalon: The Resistance'",
      keywords: ['Lancelots', 'Role', 'Rules', 'Tips'],
      image: 'roles/unknown_lancelot.webp',
    },
  },
  guinevere: {
    path: '/wiki/roles/guinevere/',
    name: 'guinevere',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Guinevere',
      description: "Rules and Tips for Guinevere role in the board game 'Avalon: The Resistance'",
      keywords: ['Guinevere', 'Role', 'Rules', 'Tips'],
      image: 'roles/guinevere.webp',
    },
  },
  percival: {
    path: '/wiki/roles/percival/',
    name: 'percival',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Percival',
      description: "Rules and Tips for Percival role in the board game 'Avalon: The Resistance'",
      keywords: ['Percival', 'Role', 'Rules', 'Tips'],
      image: 'roles/percival.webp',
    },
  },
  servant: {
    path: '/wiki/roles/servant/',
    name: 'servant',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Servant',
      description: "Rules and Tips for Servant role in the board game 'Avalon: The Resistance'",
      keywords: ['Servant', 'Role', 'Rules', 'Tips'],
      image: 'roles/servant.webp',
    },
  },
  troublemaker: {
    path: '/wiki/roles/troublemaker/',
    name: 'troublemaker',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Troublemaker',
      description: "Rules and Tips for Troublemaker role in the board game 'Avalon: The Resistance'",
      keywords: ['Troublemaker', 'Role', 'Rules', 'Tips'],
      image: 'roles/troublemaker.webp',
    },
  },
  mordred: {
    path: '/wiki/roles/mordred/',
    name: 'mordred',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Mordred',
      description: "Rules and Tips for Mordred role in the board game 'Avalon: The Resistance'",
      keywords: ['Mordred', 'Role', 'Rules', 'Tips'],
      image: 'roles/mordred.webp',
    },
  },
  trickster: {
    path: '/wiki/roles/trickster/',
    name: 'trickster',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Trickster',
      description: "Rules and Tips for Trickster role in the board game 'Avalon: The Resistance'",
      keywords: ['Trickster', 'Role', 'Rules', 'Tips'],
      image: 'roles/trickster.webp',
    },
  },
  oberon: {
    path: '/wiki/roles/oberon/',
    name: 'oberon',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Oberon',
      description: "Rules and Tips for Oberon role in the board game 'Avalon: The Resistance'",
      keywords: ['Oberon', 'Role', 'Rules', 'Tips'],
      image: 'roles/oberon.webp',
    },
  },
  morgana: {
    path: '/wiki/roles/morgana/',
    name: 'morgana',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Morgana',
      description: "Rules and Tips for Morgana role in the board game 'Avalon: The Resistance'",
      keywords: ['Morgana', 'Role', 'Rules', 'Tips'],
    },
    image: 'roles/morgana.webp',
  },
  minion: {
    path: '/wiki/roles/minion/',
    name: 'minion',
    meta: {
      prerender: true,
      title: 'Avalon: The Resistance | Minion of Mordred',
      description: "Rules and Tips for  Minion of Mordred role in the board game 'Avalon: The Resistance'",
      keywords: ['Minion of Mordred', 'Role', 'Rules', 'Tips'],
    },
    image: 'roles/minion.webp',
  },
  notFound: {
    path: '/404/',
    name: 'NotFound',
    meta: {
      title: 'Avalon: The Resistance | 404',
      skipSiteMap: true,
      description: 'Page not found =(',
    },
  },
};
