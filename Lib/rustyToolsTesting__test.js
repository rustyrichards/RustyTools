/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/*jshint globalstrict: true, eqnull: true, curly: false, latedef: true, newcap: true, undef: true, unused: true, strict: true, browser: true, devel: true*/
/* global RustyTools, self */


// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Testing.__test = [
	'RustyTools.Testing.__test\n' +
	'RegExp.prototype.find',
	function(t) {
        // Given a RegExp with the added find
        var exp = /[1-9][0-9]*/;
        
        // When
        var match = exp.find('abc');
        
        // Then RustyTools.cfg.interval is set.
		t.assert(function(){return 0 == match.length;});
	},
	function(t) {
        // Given a RegExp with the added find
        var exp = /[1-9][0-9]*/;
        
        // When
        var match = exp.find('123');
        
        // Then RustyTools.cfg.interval is set.
		t.assert(function(){return 1 == match.length;});
	},

	'Failure tests.  Make sure each kind of failure reports correctly\n' +
	'RustyTools.Testing.Record.match failure',
	function(t) {
        // Given RustyTools.Testing
        
        // When a test fails
        t.assert(false);
        
        // Then invertPassed will make it pass; however, the color of the failed test output remains.
		t.invertPassed();
	},
];

function doTests() {
	var tester = new RustyTools.Testing();
	tester.configure({name: "__test"}).testAll();

	var testArray = {__test: [
		'Array of test functions.',
		function(t) {t.assert(true);},
		function(t) {t.assert(1);},
	]};

	if (self.document) {
		var afterReady = function() {
			tester.buildDom(
				'<repl:allResults><div class="testFrame <repl:resultType/>"><h1>' +
				'<repl:resultType/> - <repl:resultCount/></h1><repl:results>' +
					'<div class="<repl:0/>"><repl:1/></div>'+
				'</repl:results></div></repl:allResults>',
					self.document.getElementById('report')
			);
			self.document.getElementById('json').innerHTML = RustyTools.Str.entitize(
					tester.toJson(), true);
		};


		// Force testAllWhenAvailable to wait for the dynamically created span. (below)
		tester.testAllWhenAvailable('#placeholderSpan', 1000, afterReady, testArray);

		if (self.document) {}
		var el = self.document.createElement('span');
		el.id = 'placeholderSpan';
		self.document.body.appendChild(el);
	} else {
		// Not in a web page.
		tester.testAll(testArray);
		RustyTools.log(tester.toJson());
	}
}

function hasNeededTestObjects() {
	return RustyTools && RustyTools.Testing && RustyTools.__test && RustyTools.Testing.__test;
//    return RustyTools && RustyTools.Fn && RustyTools.Str && RustyTools.Testing && RustyTools.Tree &&
//			RustyTools.__test && RustyTools.Fn.__test && RustyTools.Str.__test && RustyTools.Testing.__test;
}

// When everything is loaded start the tests!
RustyTools.waitForCondition(hasNeededTestObjects, doTests);
