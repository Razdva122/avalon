module.exports.routesSeo = {
  lobby: {
    path: '/',
    name: 'lobby',
    meta: {
      title: 'Play Avalon Online!',
      description: "A free platform for playing the board game 'The Resistance: Avalon'",
      keywords: ['Play'],
    },
  },
  about: {
    path: '/about',
    name: 'about',
    meta: {
      prerender: true,
      title: 'The Resistance: Avalon | About',
      description:
        "Information about the web platform avalon-game.com. The rules of the board game 'The Resistance: Avalon'.",
      keywords: ['About', 'Information', 'Rules'],
    },
  },
  room: {
    path: '/room/:uuid',
    props: true,
    name: 'room',
    meta: {
      title: 'The Resistance: Avalon | Game',
      skipSiteMap: true,
      description: "Rooms for online games in 'The Resistance: Avalon'",
      keywords: ['Game'],
    },
  },
  wiki: {
    path: '/wiki',
    name: 'wiki',
    meta: {
      prerender: true,
      title: 'The Resistance: Avalon | Wiki',
      description:
        "Wikipage for board game 'The Resistance: Avalon'. The basic rules of the board game 'The Resistance: Avalon'. How to play 'The Resistance: Avalon'?",
      keywords: ['Wiki', 'Rules', 'How to play'],
    },
  },
  addons: {
    path: '/wiki/addons',
    name: 'addons',
    meta: {
      prerender: true,
      title: 'The Resistance: Avalon | Addons for game',
      description:
        "Add-ons and additional cards for the game 'The Resistance: Avalon'. Rules for playing additional cards in a board game Avalon.",
      keywords: ['Addons', 'Module', 'Rules'],
    },
  },
  lady: {
    path: '/wiki/addons/lady',
    name: 'lady',
    meta: {
      prerender: true,
      title: 'The Resistance: Avalon | Lady of the Lake',
      description:
        "Rules for 'Lady of the Lake' card in 'The Resistance: Avalon'. Rules for 'Inquisitor Token' card in 'The Resistance'",
      keywords: ['Addons', 'Module', 'Lady of the Lake', 'Inquisitor Token', 'Rules'],
    },
  },
  excalibur: {
    path: '/wiki/addons/excalibur',
    name: 'excalibur',
    meta: {
      prerender: true,
      title: 'The Resistance: Avalon | Excalibur',
      description:
        "Rules for 'Excalibur' card in 'The Resistance: Avalon'. Rules for 'Sergeant' card in 'The Resistance'",
      keywords: ['Addons', 'Module', 'Excalibur', 'Sergeant', 'Rules'],
    },
  },
  roles: {
    path: '/wiki/roles',
    name: 'roles',
    meta: {
      prerender: true,
      title: 'The Resistance: Avalon | Roles',
      description:
        "All available roles in the board game 'The Resistance: Avalon'. Rules for roles: Merlin, Percival, Morgana, Oberon, Mordred",
      keywords: ['Roles', 'Rules', 'Merlin', 'Percival', 'Morgana', 'Oberon', 'Mordred', 'Tips'],
    },
  },
  merlin: {
    path: '/wiki/roles/merlin',
    name: 'merlin',
    meta: {
      prerender: true,
      title: 'The Resistance: Avalon | Merlin',
      description: "Rules and Tips for Merlin role in the board game 'The Resistance: Avalon'",
      keywords: ['Merlin', 'Role', 'Rules', 'Tips'],
    },
  },
  percival: {
    path: '/wiki/roles/percival',
    name: 'percival',
    meta: {
      prerender: true,
      title: 'The Resistance: Avalon | Percival',
      description: "Rules and Tips for Percival role in the board game 'The Resistance: Avalon'",
      keywords: ['Percival', 'Role', 'Rules', 'Tips'],
    },
  },
  servant: {
    path: '/wiki/roles/servant',
    name: 'servant',
    meta: {
      prerender: true,
      title: 'The Resistance: Avalon | Servant',
      description: "Rules and Tips for Servant role in the board game 'The Resistance: Avalon'",
      keywords: ['Servant', 'Role', 'Rules', 'Tips'],
    },
  },
  morgana: {
    path: '/wiki/roles/morgana',
    name: 'morgana',
    meta: {
      prerender: true,
      title: 'The Resistance: Avalon | Morgana',
      description: "Rules and Tips for Morgana role in the board game 'The Resistance: Avalon'",
      keywords: ['Morgana', 'Role', 'Rules', 'Tips'],
    },
  },
  minion: {
    path: '/wiki/roles/minion',
    name: 'minion',
    meta: {
      prerender: true,
      title: 'The Resistance: Avalon | Minion of Mordred',
      description: "Rules and Tips for  Minion of Mordred role in the board game 'The Resistance: Avalon'",
      keywords: ['Minion of Mordred', 'Role', 'Rules', 'Tips'],
    },
  },
  notFound: {
    path: '/404',
    name: 'NotFound',
    meta: {
      title: 'The Resistance: Avalon | 404',
      skipSiteMap: true,
      description: 'Page not found =(',
    },
  },
};
