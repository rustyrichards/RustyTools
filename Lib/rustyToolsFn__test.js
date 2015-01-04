/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint globalstrict: true, eqnull: true, curly: false, latedef: true, newcap: true, undef: true, unused: true, strict: true, browser: true, devel: true*/
/* global RustyTools */

// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Fn.__test = [
	'RustyTools.Fn.__test\n' +
	'RustyTools.Fn.map && RusyTools.Fn.predicateToValue',
	function(t) {
		var doubled = RustyTools.Fn._testableMap([2, 3, 4], function(x) {return x + x;});
		return t.same(doubled, [4, 6, 8]);
	},
	function(t) {
		var evenOrOdd = RustyTools.Fn.predicateToValue(function(x) {return x & 1;}, 'odd', 'even');
		var kinds = RustyTools.Fn._testableMap([2, 3, 4], evenOrOdd);
		return t.same(kinds, ['even', 'odd', 'even']);
	},
	function(t) {
		var sum = RustyTools.Fn._testableReduce(false, [2, 3, 4], function(x, y) {return x + y;});
		return t.same(sum, 9);
	},
	function(t) {
		var max = RustyTools.Fn._testableReduce(false, [2, 3, 11],
				RustyTools.Fn.partialApplication(2, Math.max));
		return t.same(max, 11);
	},
	function(t) {
		var testArray = [2, 3, 4];
		var left = RustyTools.Fn._testableReduce(false, testArray, function(x) {return x;});
		return t.same(left, 2);
	},
	function(t) {
		var testArray = [2, 3, 4];
		var right = RustyTools.Fn._testableReduce(true, testArray, function(x) {return x;});
		return t.same(right, 4);
	},

	'RustyTools.Fn.propertyWalk',
	function(t) {
		var t1 = {a: 'a', b: 2, c:{d: 4}};

		var loop = {a: 1, b:2};
		var loop2 = {x: 3, y: 4};
		loop.c = loop2;
		loop.z = loop;

		// Use an array for testing because the key order is implementation dependant.
		var flattenToArrows = function(result, key, value, keyPath) {
			if (!result) result = [];

			return result.concat(keyPath.join('->') + '-->' + value);
		};

		// Normalize the result order by sorting.
		var str = RustyTools.Fn.propertyWalk(t1, flattenToArrows).sort().join(' ');

		// The "visited" test will prevent loop2 from going back to loop!
		var str2 = RustyTools.Fn.propertyWalk(loop, flattenToArrows).sort().join(' ');

		return t.same(str, 'a-->a b-->2 c->d-->4').same(str2, 'a-->1 b-->2 c->x-->3 c->y-->4');
	},

	'RustyTools.Fn.buildTrampoline && RustyTools.Fn.trampoline',
	function(t) {
		function isOdd(x) {
			function isOddRecursive(x) {
				return isOdd(x-2);
			}

			// The Fibonacci sequence
			if (x<2) return 1 === x;
			return isOddRecursive.bind(null, x);
		}
		// Doing a 10000 isOdd skews the performance tests too badly.
		//var result = RustyTools.Fn.trampoline(isOdd, 10000);
		var result = RustyTools.Fn.trampoline(isOdd, 10);
		return t.not(result);
	},

	'RustyTools.Fn.partialApplication',
	function(t) {
		// Use partialApplication to make a function to parse base 2 numbers, and map that to an
		// an array os strings
		var parseBinary = RustyTools.Fn.partialApplication(1, parseInt, null, 2 /* base 2 */);
		var integers = RustyTools.Fn._testableMap(['01', '011', '0111'], parseBinary);
		return t.same(integers, [1, 3, 7]);
	},

	'RustyTools.Fn.ordering',
	function(t) {
		// Use RustyTools.Fn.ordering to sort odd numbers after even numbers
		var testArray = [3, 4, 1, 2, 5, 6];
		var sorted = testArray.sort(RustyTools.Fn.ordering(function(a, b) {
			var evenVsOdd = (a & 1) - (b & 1);
			return (evenVsOdd) ? (-1 === evenVsOdd) : (a < b);
		}));
		return t.same(sorted, [2, 4, 6, 1, 3, 5]);
	},

	'RustyTools.Fn.compose',
	function(t) {
		// Use RustyTools.Fn.ordering to sort odd numbers after even numbers
		var str = RustyTools.Fn.compose(function(x){ return x + 3;}, function(x) {
			return x + ' is ten.';
		})(7);
		return t.same(str, '10 is ten.');
	}
];


