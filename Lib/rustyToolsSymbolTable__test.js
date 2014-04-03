/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.SymbolTable.__test = function(t, r) {
	var symbols;
	// .Fn level RustyTools methods
	t.test([
		'RustyTools.SymbolTable.__test\n' +
		'RustyTools.SymbolTable (Constructor)',
		function(t,r) {
			var newSymbols = new RustyTools.SymbolTable();

			// Should have 0 depth, should not be able to "get" an Object method
			r.same(0, newSymbols.depth()).not(newSymbols.get('hasOwnProperty'));
		},
		function(t,r) {
			symbols = new RustyTools.SymbolTable(window, '-global');

			// Should have 0 depth, should be able to find Array, but not object members like "hasOwnProperty"
			r.same(0, symbols.depth()).is(symbols.get('Array')).not(symbols.get('hasOwnProperty'));
		},

		'RustyTools.SymbolTable.set and push',
		function(t,r) {
			// Make a new  'xTestx' as a '-variable'.  Change 'Array' to '-cow'
			symbols.push().set('xTestx', '-variable').set('Array', '-cow');

			// Should have 1 depth, should see the set symbols
			r.same(1, symbols.depth()).same('-variable', symbols.get('xTestx')).
				same('-cow', symbols.get('Array')).
				// The global level should be unchanged.
				not(symbols.getGlobal('xTestx')).
				same('-global', symbols.getGlobal('Array'))
		},
		function(t,r) {
			// Back to the root.  Change 'Array', Should not pop beyond the root.
			symbols.pop().set('Array', '-pig').pop().pop();

			// Should have 0 depth,, should see the set symbols
			r.same(0, symbols.depth()).same('-pig', symbols.get('Array'));
		},
	]);
};
