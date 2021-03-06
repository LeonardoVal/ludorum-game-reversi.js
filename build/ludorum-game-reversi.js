(function (init) { "use strict";
			if (typeof define === 'function' && define.amd) {
				define(["creatartis-base","sermat","ludorum"], init); // AMD module.
			} else if (typeof exports === 'object' && module.exports) {
				module.exports = init(require("creatartis-base"),require("sermat"),require("ludorum")); // CommonJS module.
			} else {
				this["ludorum-game-reversi"] = init(this.base,this.Sermat,this.ludorum); // Browser.
			}
		}).call(this,/** Package wrapper and layout.
*/
function __init__(base, Sermat, ludorum) { "use strict";
// Import synonyms. ////////////////////////////////////////////////////////////////////////////////
	var declare = base.declare,
		obj = base.obj,
		copy = base.copy,
		raise = base.raise,
		raiseIf = base.raiseIf,
		Iterable = base.Iterable,
		iterable = base.iterable,
		Game = ludorum.Game,
		Checkerboard = ludorum.utils.Checkerboard,
		CheckerboardFromString = ludorum.utils.CheckerboardFromString,
		UserInterface = ludorum.players.UserInterface;

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
		__package__: 'ludorum-game-reversi',
		__name__: 'ludorum_game_reversi',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum],
		__SERMAT__: { include: [base, ludorum] }
	};


/** # Reversi

Implementation of [Reversi](http://en.wikipedia.org/wiki/Reversi) for Ludorum.
*/
var Reversi = exports.Reversi = declare(Game, {
	name: 'Reversi',

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
	},

	/** `makeBoard(rows=8, columns=8, string)` is used to build the initial board.
	*/
	'dual makeBoard': function makeBoard(rows, columns, string){ //FIXME
		rows = isNaN(rows) ? 8 : +rows;
		columns = isNaN(columns) ? 8 : +columns;
		raiseIf(rows < 4 || columns < 4 || rows % 2 || columns % 2,
			"An Reversi board must have even dimensions greater than 3.");
		if (typeof string === 'string') {
			return new CheckerboardFromString(rows, columns, string);
		} else {
			return new CheckerboardFromString(rows, columns);
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

	/** The board's center is defined by the coordinates of the middle four squares.
	*/
	'dual boardCenter': function boardCenter(board) {
		board = board || this.board;
		var w = board.width,
			h = board.height;
		return [[h/2, w/2-1], [h/2-1, w/2], [h/2, w/2], [h/2-1, w/2-1]];
	},

	/** A move always places a piece in an empty square. If there are empty square at the center of
	the board, the active player must place a piece in one of them. Else, a piece can be placed if
	and only if by doing so one or more lines of the opponent's pieces get enclosed between pieces
	of the active player.
	*/
	moves: function moves(player){
		player = player || this.activePlayer();
		if (this.hasOwnProperty('__moves'+ player +'__')) {
			return this['__moves'+ player +'__'];
		}
		var board = this.board,
			coords = {},
			regexps = this.__MOVE_REGEXPS__[player];
		var _moves = this.boardCenter().filter(function (coord) {
				return board.square(coord) === '.';
			});
		if (_moves.length < 1) {
			this.lines(board.height, board.width).forEach(function(line){
				regexps.forEach(function (regexp) {
					board.asString(line).replace(regexp, function(m, i){
						var coord = m.charAt(0) === "." ? line[i] : line[m.length - 1 + i];
						coords[coord] = coord;
						return m;
					});
				});
			});
			for (var id in coords) {
				_moves.push(coords[id]);
			}
		}
		_moves = _moves.length > 0 ? obj(player, _moves) : null;
		if (arguments.length < 1) {
			return this['__moves'+ player +'__'] = _moves; // Cache the result.
		}
		return _moves;
	},

	validMoves: function validMoves(moves) {
		var allMoves = this.moves();
		for (var player in allMoves) {
			if (!moves.hasOwnProperty(player)) {
				return false;
			}
			var validMove = allMoves[player].join('\n').indexOf(moves[player] +'') >= 0;
			if (!validMove) {
				return false;
			}
		}
		return true;
	},

	/** When the active player encloses one or more lines of opponent's pieces between two of its
	own, all those are turned into active player's pieces.
	*/
	next: function next(moves, haps, update) {
		raiseIf(haps, 'Haps are not required (given ', haps, ')!');
		if (!this.validMoves(moves)) {
			raise("Invalid moves "+ JSON.stringify(moves) +"!");
		}
		var board = this.board.clone(),
			activePlayer = this.activePlayer(),
			move = moves[activePlayer],
			piece, valid;
		if (activePlayer == this.players[0]) {
			piece = "B";
			valid = /^W+B/;
		} else {
			piece = "W";
			valid = /^B+W/;
		}
		if (this.boardCenter().join('\n').indexOf(move +'') >= 0) { // Place piece at center.
			board.__place__(move, piece);
		} else {
			board.walks(move, Checkerboard.DIRECTIONS.EVERY).forEach(function (walk){
				var match = valid.exec(board.asString(walk).substr(1));
				if (match){
					walk.toArray().slice(0, match[0].length).forEach(function(coord){
						board.__place__(coord, piece);
					});
				}
			});
		}
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
		identifier: exports.__package__ +'.Reversi',
		serializer: function serialize_Reversi(obj) {
			return [obj.activePlayer(), [obj.board.height, obj.board.width, obj.board.string]];
		}
	}
}); // declare Reversi.

/** Adding Reversi to `ludorum.games`.
*/
ludorum.games.Reversi = Reversi;

/** Sermat serialization.
*/
exports.__SERMAT__.include.push(Reversi);


/** # Othello

Implementation of the [Othello variant of Reversi](http://www.worldothello.org/?q=content/reversi-versus-othello)
for Ludorum.
*/
var Othello = exports.Othello = declare(Reversi, {
	name: 'Reversi',

	/** One main difference between Reversi and Othello is that is a player has no moves, the turn
	passes to the other player. A match ends only when both players cannot move.
	*/
	constructor: function Othello(activePlayer, board){
		Reversi.call(this, activePlayer, board);
		if (!this.moves()) {
			var opponent = this.opponent();
			if (this.moves(opponent)) {
				this.activePlayers = [opponent];
			}
		}
	},

	/** `makeBoard(rows=8, columns=8, string)` is used to build the initial board. The starting
	board of Othello is not empty, like Reversi. The four center squares are defined.
	*/
	'dual makeBoard': function makeBoard(rows, columns, string){
		rows = isNaN(rows) ? 8 : +rows;
		columns = isNaN(columns) ? 8 : +columns;
		raiseIf(rows < 4 || columns < 4 || rows % 2 || columns % 2,
			"An Othello board must have even dimensions greater than 3.");
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

	// ## Utility methods ##########################################################################

	/** The game state serialization simply contains the constructor arguments.
	*/
	'static __SERMAT__': {
		identifier: exports.__package__ +'.Othello',
		serializer: function serialize_Othello(obj) {
			return [obj.activePlayer(), [obj.board.height, obj.board.width, obj.board.string]];
		}
	}
}); // declare Othello.

/** Adding Othello to `ludorum.games`.
*/
ludorum.games.Othello = Othello;

/** Sermat serialization.
*/
exports.__SERMAT__.include.push(Othello);


/** # Heuristics for Mancala

`Othello.heuristics` is a bundle of helper functions to build heuristic evaluation functions for
this game.
*/
var heuristics = exports.heuristics = {
	/** `heuristicFromWeights(weights)` returns an heuristic function that may be used with any
	heuristic based player. Weights are normalized, so the result is in (-1,+1) (exclusively).
	*/
	heuristicFromWeights: function heuristicFromWeights(weights) {
		var weightCount = weights.length,
			weightSum = iterable(weights).map(Math.abs).sum(); // Used to normalize the sum.
		var heuristic = function __heuristic__(game, player) {
			var board = game.board;
			raiseIf(board.height * board.width !== weightCount, "Wrong amount of weights!");
			return board.weightedSum(weights, {
				'W': player.charAt(0) === 'W' ? 1 : -1,
				'B': player.charAt(0) === 'B' ? 1 : -1
			}) / weightSum;
		};
		heuristic.weights = weights;
		return heuristic;
	},

	/** `heuristicFromSymmetricWeights(weights)` is similar to `heuristicFromWeights()` but
	instead of demanding a weight for every square in the board, it uses only the upper left
	quadrant and builds the rest by symmetry. Hence only a quarter of the weights is required.
	*/
	heuristicFromSymmetricWeights: function heuristicFromSymmetricWeights(weights, rows, columns) {
		rows = isNaN(rows) ? 8 : rows | 0;
		columns = isNaN(columns) ? 8 : columns | 0;
		var width = Math.ceil(rows / 2);
		raiseIf(width * Math.ceil(columns / 2) > weights.length, "Not enough weights!");
		weights = Iterable.range(columns).map(function (column) {
			var i = column < columns / 2 ? column : columns - column - 1,
				left = i * width,
				right = (i + 1) * width;
			return weights.slice(left, right)
				.concat(weights.slice(left, right - rows % 2).reverse());
		}).flatten().toArray();
		return this.heuristicFromWeights(weights);
	},

	/** `pieceRatio(game, player)` is an heuristic criteria based on the difference of the piece
	counts of both players.
	*/
	pieceRatio: function pieceRatio(game, player) {
		var playerPieceCount = 0, opponentPieceCount = 0;
		iterable(game.board.string).forEach(function (sq) {
			if (sq !== '.') {
				if (sq === player.charAt(0)) {
					++playerPieceCount;
				} else {
					++opponentPieceCount;
				}
			}
		});
		return (playerPieceCount - opponentPieceCount) / (playerPieceCount + opponentPieceCount) || 0;
	},

	/** `mobilityRatio(game, player)` is an heuristic criteria based on the difference of the
	move counts of both players.
	*/
	mobilityRatio: function mobilityRatio(game, player) {
		var opponent = game.opponent(player),
			playerMoves = game.moves(player),
			opponentMoves = game.moves(opponent),
			playerMoveCount = playerMoves && playerMoves[player] && playerMoves[player].length || 0,
			opponentMoveCount = opponentMoves && opponentMoves[opponent] && opponentMoves[opponent].length || 0;
		return (playerMoveCount - opponentMoveCount) / (playerMoveCount + opponentMoveCount) || 0;
	}
};

/** The default heuristic combines piece and mobility ratios with weights that ponder corners and
borders but penalizes the squares next to the corners.
*/
heuristics.defaultHeuristic = ludorum.players.HeuristicPlayer.composite(
	heuristics.heuristicFromSymmetricWeights(
		[+9,-3,+3,+3, -3,-3,-1,-1, +3,-1,+1,+1, +3,-1,+1,+1]
	), 0.6,
	heuristics.pieceRatio, 0.2,
	heuristics.mobilityRatio, 0.2
);


// See __prologue__.js
	Sermat.include(exports);
	
	return exports;
}
);
//# sourceMappingURL=ludorum-game-reversi.js.map