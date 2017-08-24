/** # Heuristics for Mancala

`Othello.heuristics` is a bundle of helper functions to build heuristic evaluation functions for
this game.
*/
Othello.heuristics = {
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
Othello.heuristics.defaultHeuristic = ludorum.players.HeuristicPlayer.composite(
	Othello.heuristics.heuristicFromSymmetricWeights(
		[+9,-3,+3,+3, -3,-3,-1,-1, +3,-1,+1,+1, +3,-1,+1,+1]
	), 0.6,
	Othello.heuristics.pieceRatio, 0.2,
	Othello.heuristics.mobilityRatio, 0.2
);
