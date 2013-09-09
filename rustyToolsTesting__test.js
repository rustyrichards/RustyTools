// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Testing.__test = function(t, r) {
	var expr = new RegExp('[1-9][0-9]*', 'g');
	// .Tester level RustyTools methods
	t.test([
		'RustyTools.Testing.__test\n' +
		'RegExp.prototype.find',
		function(t, r) {
			var result = expr.find('abc');
			r.not(!result).same(result.length, 0);
		},
		function(t, r) {
			var result = expr.find('123');
			r.not(!result).same(result.length, 1);
		},

		'Failure tests.  Make sure each kind of failure reports correctly\n' +
		'RustyTools.Testing.Record.match failure',
		function(t, r) {
			// Fail match to report the error.
			r.match(/^[\s\S]*$/, 'abc', 'bc').invertFailed();
		},
		'RustyTools.Testing.Record.exactMatch failure',
		function(t, r) {
			// Fail exactMatch to report the error.
			r.exactMatch(/^[a-z]*/, 'abc1').invertFailed();
		},
		'RustyTools.Testing.Record.noMatch failure',
		function(t, r) {
			// Fail noMatch to report the error.
			r.noMatch(/[a-z]+/i, 'abc').invertFailed();
		},
		'RustyTools.Testing.Record.same failure',
		function(t, r) {
			// Fail same to report the error.
			r.same('abc', 'def').invertFailed();
		},
		'RustyTools.Testing.Record.different failure',
		function(t, r) {
			// Fail different to report the error.
			r.different('abc', 'abc').invertFailed();
		},
		'RustyTools.Testing.Record.not failure',
		function(t, r) {
			// Fail not to report the error.
			r.not(true).invertFailed();
		}
	]);
};

function doTests() {
	var tester = new RustyTools.Testing({name: "__test"});
	tester.testAll();

	var testArray = {__test: [
		'Array of test functions.',
		function(t, r) {r.same(1-1, 0);},
		function(t, r) {r.same(1+0, 1);},
		function(t, r) {r.same(1+1, 2);}
	]};

	if (self.document) {
		var afterReady = function() {
			tester.buildDom(
				'<#allResults><div class="testFrame <#resultType/>"><h1>' +
				'<#resultType/> - <#resultCount/></h1><#results>' +
					'<div class="description"><#description/></div>'+
					'<div class="test"><#test/>'+
						'<div class="log"><#log/></div>'+
						'<div class="error"><#error/></div>'+
						'<div class="exception"><#exception/></div>'+
					'</div>' +
				'</#results></div></#allResults>',
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
};

function hasNeededTestObjects() {
	return RustyTools && RustyTools.Fn && RustyTools.Str && RustyTools.Testing && RustyTools.Tree &&
			RustyTools.__test && RustyTools.Fn.__test && RustyTools.Str.__test && RustyTools.Testing.__test;
}

// When everything is loaded start the tests!
RustyTools.waitForCondition(hasNeededTestObjects, doTests);
