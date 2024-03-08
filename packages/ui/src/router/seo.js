module.exports.routesSeo = {
  lobby: {
    path: '/',
    name: 'lobby',
    meta: {
      title: 'Play Avalon Online!',
      description: "A free platform for playing the board game 'The Resistance: Avalon'",
    },
  },
  about: {
    path: '/about',
    name: 'about',
    meta: {
      prerender: true,
      title: 'Avalon Game About',
      description:
        "Information about the web platform avalon-game.com. The rules of the board game 'The Resistance: Avalon'.",
    },
  },
  room: {
    path: '/room/:uuid',
    props: true,
    name: 'room',
    meta: {
      title: 'Avalon Game Room',
      skipSiteMap: true,
      description: "Rooms for online games in 'The Resistance: Avalon'",
    },
  },
  wiki: {
    path: '/wiki',
    name: 'wiki',
    meta: {
      prerender: true,
      title: "Wiki 'The Resistance: Avalon'",
      description:
        "Wikipage for board game 'The Resistance: Avalon'. The basic rules of the board game 'The Resistance: Avalon'. How to play 'The Resistance: Avalon'?",
    },
  },
  addons: {
    path: '/wiki/addons',
    name: 'addons',
    meta: {
      prerender: true,
      title: "Addons for 'The Resistance: Avalon'",
      description:
        "Add-ons and additional cards for the game 'The Resistance: Avalon'. Rules for playing additional cards in a board game Avalon.",
    },
  },
  lady: {
    path: '/wiki/addons/lady',
    name: 'lady',
    meta: {
      prerender: true,
      title: 'Lady of the Lake - Avalon rules',
      description:
        "Rules for 'Lady of the Lake' card in 'The Resistance: Avalon'. Rules for 'Inquisitor Token' card in 'The Resistance'",
    },
  },
  excalibur: {
    path: '/wiki/addons/excalibur',
    name: 'excalibur',
    meta: {
      prerender: true,
      title: 'Excalibur - Avalon rules',
      description:
        "Rules for 'Excalibur' card in 'The Resistance: Avalon'. Rules for 'Sergeant' card in 'The Resistance'",
    },
  },
};
