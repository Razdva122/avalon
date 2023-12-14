import { User } from '@/user';
import { Game, gamesSettings } from '@/game';
import { GameTestHelper } from '@/game/test/helpers';

const users = [
	new User('1', 'Misha'), 
	new User('2', 'John'), 
	new User('3', 'Dima'),
	new User('4', 'Anna'), 
	new User('5', 'Alex'),
	new User('6', 'Ivan'),
	new User('7', 'Tom'), 
];

let game = new Game(users, {roles: {merlin: 1}});
let gameHelper = new GameTestHelper(game);

function generateNewGame() {
	game = new Game(users, {roles: {merlin: 1}});
	gameHelper = new GameTestHelper(game);
}

const settings = gamesSettings[users.length];

describe('Roles', () => {
	test('Game have merlin in players', () => {
		expect(game.players.some((player) => player.role.role === 'merlin')).toBe(true);
	});

	test('Game have valid amount of player in both teams', () => {
		const loyalty = game.players.reduce((acc, el) => {
			acc[el.role.loyalty] += 1;
			return acc;
		}, {evil: 0, good: 0});

		expect(loyalty).toEqual(settings.players);
	});
});

describe('Gameplay', () => {
	describe('3-1 goods win', () => {
		beforeAll(() => {
			generateNewGame();
		});

		describe('First round', () => {
			test('Select players', () => {
				gameHelper.selectPlayersOnMission();
	
				const selectedPlayers = game.players.filter((player) => player.features.isSelected === true);
	
				expect(selectedPlayers.length).toBe(settings.missions[0].players);
				expect(game.stage).toBe('selectTeam');
			});
	
			test('Sent players', () => {
				gameHelper.sentSelectedPlayers();
				const isAllPlayersSent = game.players.every((player) => player.features.isSelected === player.features.isSent);
	
				expect(isAllPlayersSent).toBeTruthy();
				expect(game.stage).toBe('votingForTeam');
			});
	
			test('Approve mission', () => {
				expect(game.missions[0].stage).toBe('active');
				gameHelper.makeVotes();
	
				expect(game.stage).toBe('onMission');
				expect(game.missions[0].stage).toBe('progress');
			});
	
			test('Success mission', () => {
				expect(game.missions[1].stage).toBe('inactive');
				gameHelper.makeActions();
	
				expect(game.stage).toBe('selectTeam');
				expect(game.missions[0].data.result).toBe('success');
				expect(game.missions[0].data.fails).toBe(0);
				expect(game.missions[0].stage).toBe('finished');
				expect(game.missions[1].stage).toBe('active');
			});
		});

		describe('Second round', () => {
			test('Select players', () => {
				expect(game.round).toBe(1);
				expect(game.turn).toBe(0);

				gameHelper.selectPlayersOnMission(1);
				const selectedPlayers = game.players.filter((player) => player.features.isSelected === true);
	
				expect(selectedPlayers.length).toBe(settings.missions[1].players);
				expect(game.stage).toBe('selectTeam');
			});

			test('Sent Players -> Approve Mission -> Fail mission', () => {
				gameHelper
					.sentSelectedPlayers()
					.makeVotes()
					.makeActions(1);
	
				expect(game.stage).toBe('selectTeam');
				expect(game.missions[1].data.result).toBe('fail');
				expect(game.missions[1].data.fails).toBe(1);
				expect(game.missions[1].stage).toBe('finished');
			});
		});

		describe('Third round', () => {
			test('Select Player -> Sent Players -> Approve Mission -> Fail mission', () => {
				gameHelper
					.selectPlayersOnMission()
					.sentSelectedPlayers()
					.makeVotes()
					.makeActions();
	
				expect(game.stage).toBe('selectTeam');
				expect(game.missions[2].data.result).toBe('success');
				expect(game.missions[2].data.fails).toBe(0);
				expect(game.missions[2].stage).toBe('finished');
			});
		});

		describe('Last round', () => {
			test('Select Player -> Sent Players -> Approve Mission -> Fail mission', () => {
				gameHelper
					.selectPlayersOnMission()
					.sentSelectedPlayers()
					.makeVotes()
					.makeActions();
	
				expect(game.stage).toBe('selectMerlin');
				expect(game.missions[3].data.result).toBe('success');
				expect(game.missions[3].data.fails).toBe(0);
				expect(game.missions[3].stage).toBe('finished');
			});

			test('Pick wrong merlin', () => {
				gameHelper.pickMerlin();

				expect(game.stage).toBe('end');
				expect(game.winner).toBe('good');
				expect(game.round).toBe(3);
			})

			test('Check history', () => {
				const expectedHistory = [
					'vote', 'mission', 
					'vote', 'mission', 
					'vote', 'mission', 
					'vote', 'mission', 
					'assassinate'
				];

				const isHistoryValid = game.history.every((el, index) => {
					return expectedHistory[index] === el.type && el.stage === 'finished';
				});

				expect(isHistoryValid).toBeTruthy();
			});
		})
	});

	describe('2-3 evil win', () => {
		beforeAll(() => {
			generateNewGame();
		});

		test('First mission: Fail mission', () => {
			gameHelper
				.selectPlayersOnMission(1)
				.sentSelectedPlayers()
				.makeVotes()
				.makeActions(1)

			expect(game.missions[0].data.result).toBe('fail');
			expect(game.missions[0].data.fails).toBe(1);
		});

		test('Second mission: Fail mission', () => {
			gameHelper
				.selectPlayersOnMission(1)
				.sentSelectedPlayers()
				.makeVotes()
				.makeActions(1)

			expect(game.missions[1].data.result).toBe('fail');
			expect(game.missions[1].data.fails).toBe(1);
		});

		test('Third mission: Success mission', () => {
			gameHelper
				.selectPlayersOnMission()
				.sentSelectedPlayers()
				.makeVotes()
				.makeActions()

			expect(game.missions[2].data.result).toBe('success');
			expect(game.missions[2].data.fails).toBe(0);
		});

		test('Fourth mission: 1 fail but mission still success', () => {
			gameHelper
				.selectPlayersOnMission(1)
				.sentSelectedPlayers()
				.makeVotes()
				.makeActions(1)

			expect(game.missions[3].data.result).toBe('success');
			expect(game.missions[3].data.fails).toBe(1);
		});

		test('Fifth mission: Fail mission', () => {
			gameHelper
				.selectPlayersOnMission(1)
				.sentSelectedPlayers()
				.makeVotes()
				.makeActions(1)

			expect(game.missions[4].data.result).toBe('fail');
			expect(game.missions[4].data.fails).toBe(1);
		});

		test('Game result', () => {
			expect(game.round).toBe(4);
			expect(game.history.length).toBe(10);
			expect(game.winner).toBe('evil');
			expect(game.stage).toBe('end');
		})
	});
});

describe('Features', () => {
	beforeEach(() => {
		generateNewGame();
	});

	test('Fifth vote should be forced', () => {
		gameHelper
			.selectPlayersOnMission()
			.sentSelectedPlayers()
			.makeVotes(game.players.length)
			.selectPlayersOnMission()
			.sentSelectedPlayers()
			.makeVotes(game.players.length)
			.selectPlayersOnMission()
			.sentSelectedPlayers()
			.makeVotes(game.players.length)
			.selectPlayersOnMission()
			.sentSelectedPlayers()
			.makeVotes(game.players.length)
			.selectPlayersOnMission()
			.sentSelectedPlayers();

		expect(game.stage).toBe('onMission');
		expect(game.vote.stage).toBe('finished');
		expect(game.vote.data.result).toBe('approve');
		expect(game.history.length).toBe(5);
	});
});



