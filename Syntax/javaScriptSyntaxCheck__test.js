/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

javaScriptSyntaxCheck.__test = function(t, r) {
	var tokens, errors, source, outStr;

	function parseTokens(source) {
		var tokens = editControl.tokenizeForEditor(source);
		editControl.parseForEditor(tokens);

		return tokens;
	};

	function getErrorTokens(tokens) {
		var errors = [];
		tokens.reduce(function(result, token) {
				if (token.error) result.push(token);
				return result;
			}, errors);

		return errors;
	};

	t.test([
		'editControl.__test \n' +
		'editControl.tokenizeForEditor',
		function(t,r) {
			// I wrote this test first, but really to test the parsing, there needs
			// to be an exaustive test for each state.

			// I will keep this test for the parseForEditor, and buildSpliceDifference
			// tests, but the exaustive state tests will be added below.
			source =
['				/* Comment on line one. */',
'				// Line comment on line two.',
'				function testFn(a, b) {',
'					var z = a - b;	// OK',
'					var z2 = arguments[0] + arguments[1];	// OK',
'					var ;	// \";\" empty var statement - error at the \";\".',
'					var = x;	// \"=\" before rValue',
'					var x + y = z;	// \"+\" before rValue',
'					qq = a * b;	// No var in front of q!',
'				}}	// too many \"}\";'].join('\n');
			tokens = editControl.tokenizeForEditor(source);
			var temp = editControl.parseForEditor(tokens);
			errors = [];
			tokens.reduce(function(result, token) {
				if (token.error) result.push(token);
				return result;
			}, errors);
			tokens.forEach(function(token) {
				if (token.isTestable) {
					r.logObjects(token.str + '\t\t' + ((token.state) ? (token.state.id || 'NONE') : 'UNDEFINED') + '\t\t' + token.getCombindedClass() + '\n');
				}
			})
			r.same(6, errors.length).same(';', errors[0].str).same('=', errors[1].str).
					same('+', errors[2].str).same('y', errors[3].str).
					same('qq', errors[4].str).same('}', errors[5].str);
		},

		'editControl.parseForEditor',
		function(t,r) {
			outStr = editControl.parseForEditor(tokens);
			r.logObjects(outStr);
			r.same(source, RustyTools.Str.markupToPlainText(outStr, true));
		},

		'editControl.buildSpliceDifference',
		function(t,r) {
			var source2 = source.replace(/Line comment (on line two)/, 'Replaced $1').
					replace(/qq \=/, 'z2 +=');
			var tokens2 = editControl.tokenizeForEditor(source2);
			var outStr2 = editControl.parseForEditor(tokens2);
			var revertSplice = editControl.buildSpliceDifference(tokens, tokens2);
			var reverted = editControl.parseForEditor(
					editControl.revertTokens(tokens2, revertSplice));
			// Check that the plain text of the outStr, and outStr2 are different.
			// Check that the revertTokens restores the old plain text.
			r.different(RustyTools.Str.markupToPlainText(outStr2, true),
				RustyTools.Str.markupToPlainText(outStr, true)).
				same(RustyTools.Str.markupToPlainText(reverted, true),
				RustyTools.Str.markupToPlainText(outStr, true));
		},

		'Grammar tests\n' +
		'statement',
		function(t,r) {
			// Valid in a statement, but no real actions.
			var test =
['			;;',
'			;,',
'			,,'].join('\n');
			var tokens = parseTokens(test);
			var errors = getErrorTokens(tokens);
			r.not(errors.length);
		},
		'statement {...}',
		function(t,r) {
			// Grouping the extra '}' should be an error.
			var test =
'				{ { } { { } } } }';
			var tokens = parseTokens(test);
			var counts = tokens.reduce(function(result, token) {
					if ('{' === token.str || '}' === token.str) result.push(token.groupingCount);
					return result;
				}, []);
			var countsShouldBe = [0, 1, 1, 1, 2, 2, 1, 0, -1];
			r.same(countsShouldBe, counts).is(tokens[tokens.length-1].error);
		},
		'statement do ... while',
		function(t,r) {
			// do ... while
			var test =
['				do ; while(self);							// OK',
'				do {} while (self);						// OK',
'				do {} } while ( self );				// bad'].join('\n');
			var tokens = parseTokens(test);
			var errors = getErrorTokens(tokens);
			r.same('}', errors[0].str).same(-1, errors[0].groupingCount);
		},
		'statement function',
		function(t,r) {
			// fuction
			var test =
['				function() {}',
'				function(a, b) {return a+b;};',
'				function fName() {return self;}'].join('\n');
			var tokens = parseTokens(test);
			var errors = getErrorTokens(tokens);
			r.not(errors.length);
		},
		'statement switch',
		function(t,r) {
			// fuction
			var test =
['				switch(self) {',
'					case \'a\':',
'						break;',
'					case 1:',
'						{};',
'           self;',
'						break;',
'					case \"xyzzy\":',
'					case \"plough\":',
'						{};',
'						break;',
'				}',
'				case'].join('\n');
			var tokens = parseTokens(test);
			var errors = getErrorTokens(tokens);
			r.same(1, errors.length);
		}
	]);
};


var tester = new RustyTools.Testing({name: "__test"});
tester.testAll();

var html = tester.buildDom(
	'<html>' +
	'<head>' +
		'<title>Testing Frame</title>' +
		'<style>' +
			'body {white-space:pre-wrap; tab-size:2;}' +
			'.testFrame  {border-width:5px; border-style:ridge; padding: 5px; margin-bottom: 5px;}' +
			'.excepted {border-color:#800;}' +
			'.failed {border-color:#F00;}' +
			'.passed {border-color:#080;}' +
			'.json {border-color:#AAA;}' +
			'.description {font-weight:bold;}' +
			'.test {margin-bottom: 1em;}' +
			'.log {margin-left: 2em; color: #446;}' +
			'.error {margin-left: 2em; color: #800;}' +
			'.exception {margin-left: 2em; color: #800;}' +
		'</style>' +
	'</head>' +
	'<body>' +
	'<repl:allResults><div class="testFrame <repl:resultType/>"><h1>' +
	'<repl:resultType/> - <repl:resultCount/></h1><repl:results>' +
		'<div class="description"><repl:description/></div>'+
		'<div class="test"><repl:test/>'+
			'<div class="log"><repl:log/></div>'+
			'<div class="error"><repl:error/></div>'+
			'<div class="exception"><repl:exception/></div>'+
		'</div>' +
	'</repl:results></div></repl:allResults>' +
	'</body>' +
	'</html>');

window.open('data:text/html;charset=utf-8,' + encodeURIComponent(html),
		'TestOutput');