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
      title: 'How to play avalon',
      description: "The basic rules of the board game 'The Resistance: Avalon'. How to play 'The Resistance: Avalon'?",
    },
  },
  lady: {
    path: '/wiki/addons/lady',
    name: 'lady',
    meta: {
      title: 'Lady of the Lake - Avalon rules',
      description:
        "Rules for 'Lady of the Lake' card in 'The Resistance: Avalon'. Rules for 'Inquisitor Token' card in 'The Resistance'",
    },
  },
  excalibur: {
    path: '/wiki/addons/excalibur',
    name: 'excalibur',
    meta: {
      title: 'Excalibur - Avalon rules',
      description:
        "Rules for 'Excalibur' card in 'The Resistance: Avalon'. Rules for 'Sergeant' card in 'The Resistance'",
    },
  },
};
