/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint globalstrict: true, eqnull: true, curly: false, latedef: true, newcap: true, undef: true, unused: true, strict: true, browser: true, devel: true*/
/* global RustyTools */

// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.SymbolTable.__test = [
	'RustyTools.SymbolTable.__test\n' +
	'RustyTools.SymbolTable (Constructor)',
	function(t) {
		var newSymbols = new RustyTools.SymbolTable();

		// Should have 0 depth, should not be able to "get" an Object method
		t.same(0, newSymbols.depth()).not(newSymbols.get('hasOwnProperty'));
	},
	function(t) {
		t.symbols.set('jsSymbols', new RustyTools.SymbolTable(window, '-global'));

		// Should have 0 depth, should be able to find Array, but not object members like "hasOwnProperty"
		t.same(0, t.symbols.get('jsSymbols').depth()).
				is(t.symbols.get('jsSymbols').get('Array')).
				not(t.symbols.get('jsSymbols').get('hasOwnProperty'));
	},

	'RustyTools.SymbolTable.set and push',
	function(t) {
		// Make a new  'xTestx' as a '-variable'.  Change 'Array' to '-cow'
		t.symbols.get('jsSymbols').push().set('xTestx', '-variable').set('Array', '-cow');

		// Should have 1 depth, should see the set t.symbols.get('jsSymbols')
		t.same(1, t.symbols.get('jsSymbols').depth()).
				same('-variable', t.symbols.get('jsSymbols').get('xTestx')).
				same('-cow', t.symbols.get('jsSymbols').get('Array')).
				// The global level should be unchanged.
				not(t.symbols.get('jsSymbols').getGlobal('xTestx')).
				same('-global', t.symbols.get('jsSymbols').getGlobal('Array'));
	},
	'RustyTools.SymbolTable.clear',
	function(t) {
		// Clear both levels of 'Array'
		t.symbols.get('jsSymbols').clear('Array').clearGlobal('Array');

		// 'Array' should be null
		t.not(t.symbols.get('jsSymbols').get('Array')).
				not(t.symbols.get('jsSymbols').getGlobal('Array'));
	},
	'RustyTools.SymbolTable.pop',
	function(t) {
		// Back to the root.  Change 'Array', Should not pop beyond the root.
		t.symbols.get('jsSymbols').pop().set('Array', '-pig').pop().pop();

		// Should have 0 depth,, should see the set t.symbols.get('jsSymbols')
		t.same(0, t.symbols.get('jsSymbols').depth()).
				same('-pig', t.symbols.get('jsSymbols').get('Array'));
	},
	'RustyTools.SymbolTable - cleanup',
	function(t) {
		// Back to the root.  Change 'Array', Should not pop beyond the root.
		t.symbols.clear('jsSymbols');
	},
];
