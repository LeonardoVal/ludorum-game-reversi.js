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
