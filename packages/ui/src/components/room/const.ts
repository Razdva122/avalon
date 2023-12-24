export const stages = {
  initialization: 'The game is being initialized...',
  selectTeam: 'The leader chooses the team.',
  votingForTeam: 'The round table votes for the selected team.',
  onMission: 'The selected team is on a mission.',
  selectMerlin: "Mordred's minions are trying to figure out Merlin.",
  end: 'The game is over.',
  created: 'The game has been created, we are waiting for the players to connect',
  locked: 'The game is locked, we are waiting for the start of the game',
  started: 'The game has started',
} as const;
