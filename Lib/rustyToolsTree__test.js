/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Tree.__test = function(t, r) {
	// .Tree test cases
	var testObj = {a:{b:{c:{d:1.1}}}, u:{v:2.2, w:{x:3.3, y:{}}}};
	t.test([
		'RustyTools.Tree.__test \n' +
		'RustyTools.Tree.findMatchingDescendants',
		function(t,r) {
			// Find all object decendants
			var matchedDescendants = RustyTools.Tree.findMatchingDescendants(
				testObj, function(property) {
					return 'object' === typeof property;
				}, function(parent) {
					var result = [];
					for (var i in parent) {
						if (parent.hasOwnProperty(i)) result.push(parent[i]);
					}
					return result;
				});

			// allDescendants should have testOBj, a, b, c, u, w, and y.
			// It should not have d, v, and x
			t.different(-1, matchedDescendants.indexOf(testObj)).
					different(-1, matchedDescendants.indexOf(testObj.a)).
					different(-1, matchedDescendants.indexOf(testObj.a.b)).
					different(-1, matchedDescendants.indexOf(testObj.a.b.c)).
					different(-1, matchedDescendants.indexOf(testObj.u)).
					different(-1, matchedDescendants.indexOf(testObj.u.w)).
					different(-1, matchedDescendants.indexOf(testObj.u.w.y)).
					// same -1 means not found
					same(-1, matchedDescendants.indexOf(testObj.a.b.c.d)).
					same(-1, matchedDescendants.indexOf(testObj.u.v)).
					same(-1, matchedDescendants.indexOf(testObj.u.w.x)).
					logObjects(matchedDescendants);
		},
		'RustyTools.Tree.findAllMatches',
		function(t,r) {
			// Find all numbers in testObj
			var allNumbers = RustyTools.Tree.findAllMatches(
				testObj, function(property) {
					return 'number' === typeof property;
				}, function(parent) {
					var result = [];
					for (var i in parent) {
						if (parent.hasOwnProperty(i)) result.push(parent[i]);
					}
					return result;
				});

			// allNumbers should have testOBj, 1.1, 2.2 and 3.3 only.
			t.different(-1, allNumbers.indexOf(1.1)).
					different(-1, allNumbers.indexOf(2.2)).
					different(-1, allNumbers.indexOf(3.3)).
					same(3, allNumbers.length).
					logObjects(allNumbers);
		},
		'RustyTools.Tree.findAllMatches find all nodes in the current document',
		function(t,r) {
			if (self.document) {
				// Find all numbers in testObj
				var allElements = RustyTools.Tree.findAllMatches(self.document,
					function(node) {
						return !!node.tagName;	// text nodes don't have a tagName.
					}, function(parent) {
						return Array.prototype.slice.call(parent.childNodes, 0);
					});

				var forJson = allElements.map(function(node) {
					return {tagName: node.tagName, id: node.id};
				});

				// allElements better have a body.
				t.not(0 === allElements.length).
					different(-1, allElements.indexOf(self.document.body)).
					logObjects(forJson);
				} else {
					// Need a web page to run this test.
					t.is(self.document);
				}
		},
	]);
};
