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
};
