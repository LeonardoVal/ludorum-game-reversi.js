require(['creatartis-base', 'sermat', 'ludorum', 'ludorum-game-reversi', 'playtester'],
function (base, Sermat, ludorum, ludorum_game_reversi, PlayTesterApp) {
	window.base = base;
	window.Sermat = Sermat;
	window.ludorum = ludorum;
	window.ludorum_game_reversi = ludorum_game_reversi;

	var BasicHTMLInterface = ludorum.players.UserInterface.BasicHTMLInterface;

	/** Custom HTML interface for Othello.
	*/
	var OthelloHTMLInterface = base.declare(BasicHTMLInterface, {
		constructor: function OthelloHTMLInterface() {
			BasicHTMLInterface.call(this, {
				document: document,
				container: document.getElementById('board')
			});
		},

		/** Each of the board's squares looks are customized via CSS.
		*/
		classNames: {
			'B': "ludorum-square-Black",
			'W': "ludorum-square-White",
			'.': "ludorum-square-empty"
		},

		display: function display(game) {
			this.container.innerHTML = ''; // empty the board's DOM.
			var ui = this,
				moves = game.moves(),
				activePlayer = game.activePlayer(),
				board = game.board,
				classNames = this.classNames;
			moves = moves && moves[activePlayer].map(JSON.stringify);
			board.renderAsHTMLTable(ui.document, ui.container, function (data) {
				data.className = classNames[data.square];
				data.innerHTML = '&nbsp;';
				var move = JSON.stringify(data.coord);
				if (moves && moves.indexOf(move) >= 0) {
					data.move = data.coord;
					data.activePlayer = activePlayer;
					data.className = "ludorum-square-move";
					data.onclick = ui.perform.bind(ui, data.move, activePlayer);
				}
			});
			return ui;
		}
	});

	/** PlayTesterApp initialization.
	*/
	base.global.APP = new PlayTesterApp(
		//new ludorum_game_reversi.Othello(),
		new ludorum_game_reversi.Reversi(),
		new OthelloHTMLInterface(),
		{ bar: document.getElementsByTagName('footer')[0] },
		[ludorum_game_reversi]
	);
	APP.playerUI("You")
		.playerRandom()
		.playerMonteCarlo("", true, 10)
		.playerMonteCarlo("", true, 100)
		.playerUCT("", true, 10)
		.playerUCT("", true, 100)
		.playerAlfaBeta("", true, 3, 'ludorum_game_reversi.heuristics.defaultHeuristic')
		.selects(['player0', 'player1'])
		.button('resetButton', document.getElementById('reset'), APP.reset.bind(APP))
		.reset();
}); // require().
