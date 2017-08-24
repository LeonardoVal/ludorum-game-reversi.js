/** # Othello

Implementation of [Othello (aka Reversi)](http://en.wikipedia.org/wiki/Reversi) for Ludorum.
*/
var Othello = exports.Othello = declare(Game, {
	name: 'Othello',

	/** The constructor takes the `activePlayer` (`"Black"` by default) and a board (initial board
	by default). The board is represented by an array of two integers and a string:
	`[rows, columns, string]`. The string must have:

	+ `'W'` for every square occupied by a white piece.
	+ `'B'` for every square occupied by a black piece.
	+ `'.'` for every empty square.
	*/
	constructor: function Othello(activePlayer, board){
		Game.call(this, activePlayer);
		this.board = this.makeBoard.apply(this, board || []);
		if (!this.moves()) {
			var opponent = this.opponent();
			if (this.moves(opponent)) {
				this.activePlayers = [opponent];
			}
		}
	},

	/** `makeBoard(rows=8, columns=8, string)` is used to build the initial board.
	*/
	'dual makeBoard': function makeBoard(rows, columns, string){
		rows = isNaN(rows) ? 8 : +rows;
		columns = isNaN(columns) ? 8 : +columns;
		raiseIf(rows < 4 || columns < 4 || rows % 2 || columns % 2, "An Othello board must have even dimensions greater than 3.");
		if (typeof string === 'string') {
			return new CheckerboardFromString(rows, columns, string);
		} else {
			return new CheckerboardFromString(rows, columns)
				.__place__([rows / 2, columns / 2 - 1], "W")
				.__place__([rows / 2 - 1, columns / 2], "W")
				.__place__([rows / 2, columns / 2], "B")
				.__place__([rows / 2 - 1, columns / 2 - 1], "B");
		}
	},

	/** The game is played by two players: Black and White. Black moves first.
	*/
	players: ["Black", "White"],

	/** Much of the move calculations are based on the possible lines in the board. These are
	calculated and cached by the `lines(rows, cols)` function.
	*/
	lines: (function (cache) {
		return function lines(rows, cols) {
			var key = rows +'x'+ cols,
				result = cache[key];
			if (typeof result === 'undefined') {
				result = cache[key] = new Checkerboard(rows, cols).lines().map(function(line) {
					return line.toArray();
				}, function(line){
					return line.length > 2;
				}).toArray();
			}
			return result;
		};
	})({}),

	/** Another optimization in the move logic uses regular expressions to match patterns in the
	board. These are predefined as a _class_ member.
	*/
	__MOVE_REGEXPS__: {
		"Black": [/\.W+B/g, /BW+\./g],
		"White": [/\.B+W/g, /WB+\./g]
	},

	/** A move always places a piece in an empty square, if and only if by doing so one or more
	lines of the opponent's pieces get enclosed between pieces of the active player.
	*/
	moves: function moves(player){
		player = player || this.activePlayer();
		if (this.hasOwnProperty('__moves'+ player +'__')) {
			return this['__moves'+ player +'__'];
		}
		var board = this.board,
			coords = {},
			regexps = this.__MOVE_REGEXPS__[player];
		this.lines(board.height, board.width).forEach(function(line){
			regexps.forEach(function (regexp) {
				board.asString(line).replace(regexp, function(m, i){
					var coord = m.charAt(0) === "." ? line[i] : line[m.length - 1 + i];
					coords[coord] = coord;
					return m;
				});
			});
		});
		var _moves = [];
		for (var id in coords) {
			_moves.push(coords[id]);
		}
		_moves = _moves.length > 0 ? obj(player, _moves) : null;
		if (arguments.length < 1) {
			return this['__moves'+ player +'__'] = _moves; // Cache the result.
		}
		return _moves;
	},

	/** When the active player encloses one or more lines of opponent's pieces between two of its
	own, all those are turned into active player's pieces.
	*/
	next: function next(moves, haps, update) {
		raiseIf(haps, 'Haps are not required (given ', haps, ')!');
		var board = this.board.clone(),
			activePlayer = this.activePlayer(),
			piece, valid;
		if (!moves.hasOwnProperty(activePlayer) || !board.isValidCoord(moves[activePlayer])) {
			throw new Error("Invalid moves "+ JSON.stringify(moves) +"!");
		} else if (activePlayer == this.players[0]) {
			piece = "B";
			valid = /^W+B/;
		} else {
			piece = "W";
			valid = /^B+W/;
		}
		board.walks(moves[activePlayer], Checkerboard.DIRECTIONS.EVERY).forEach(function (walk){
			var match = valid.exec(board.asString(walk).substr(1));
			if (match){
				walk.toArray().slice(0, match[0].length).forEach(function(coord){
					board.__place__(coord, piece);
				});
			}
		});
		if (update) {
			this.constructor(this.opponent(), [board.height, board.width, board.string]);
			return this;
		} else {
			return new this.constructor(this.opponent(), [board.height, board.width, board.string]);
		}
	},

	/** A match ends when the active player cannot move. The winner is the one with more pieces of
	its color in the board at the end.
	*/
	result: function result() {
		if (this.moves()) {
			return null;
		} else {
			var weight = {"W": -1, "B": 1},
				res_b = iterable(this.board.string).map(function(m){
					return weight[m] || 0;
				}).sum();
			return this.zerosumResult(res_b, "Black");
		}
	},

	/** The actual score is calculated as the difference in piece count. This means that the maximum
	victory (maybe impossible) is to fill the board with pieces of only one colour.
	*/
	resultBounds: function resultBounds() {
		var squareCount = this.board.width * this.board.height;
		return [-squareCount, +squareCount];
	},

	// ## Utility methods ##########################################################################

	/** The game state serialization simply contains the constructor arguments.
	*/
	'static __SERMAT__': {
		identifier: 'Othello',
		serializer: function serialize_Othello(obj) {
			return [obj.activePlayer(), [obj.board.height, obj.board.width, obj.board.string]];
		}
	}
}); // declare Othello.

/** Adding Mancala to `ludorum.games`.
*/
ludorum.games.Othello = Othello;

/** Sermat serialization.
*/
Othello.__SERMAT__.identifier = exports.__package__ +'.'+ Othello.__SERMAT__.identifier;
exports.__SERMAT__.include.push(Othello);
Sermat.include(exports);
