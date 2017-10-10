/** Gruntfile for [ludorum-game-connect4.js](http://github.com/LeonardoVal/ludorum-game-connect4.js).
*/
module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});

	require('creatartis-grunt').config(grunt, {
		sourceNames: ['__prologue__', 'Reversi',  'Othello', 'heuristics', '__epilogue__'],
		deps: [
			{ id: 'creatartis-base', name: 'base' },
			{ id: 'sermat', name: 'Sermat',
		 		path: 'node_modules/sermat/build/sermat-umd-min.js' },
			{ id: 'ludorum' },
			{ id: 'playtester', dev: true, module: false,
		 		path: 'node_modules/ludorum/build/playtester-common.js' }
		],
		targets: {
			build_umd: {
				fileName: 'build/ludorum-game-reversi',
				wrapper: 'umd'
			},
			build_raw: {
				fileName: 'build/ludorum-game-reversi-raw',
				wrapper: 'raw'
			}
		}
	});

	grunt.registerTask('default', ['build']);
};
