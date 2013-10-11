// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

javaScriptSyntaxCheck.__test = function(t, r) {
	var tokens, errors, source, outStr;

	t.test([
		'editControl.__test \n' +
		'editControl.tokenizeForEditor',
		function(t,r) {
			source = '/* Comment on line one. */\n' +
				'// Line comment on line two.\n' +
				'function testFn(a, b) {\n' +
				'	var z = a - b;	// OK\n' +
				'	var z2 = arguments[0] + arguments[1];	// OK\n' +
				'	var ;	// ";" empty var statement - error at the ";".\n' +
				'	var = x;	// "=" before rValue\n' +
				'	var x + y = z;	// "+" before rValue\n' +
				'	qq = a * b;	// No var in front of q!\n' +
				'}}	// too many "}"\n';
			tokens = editControl.tokenizeForEditor(source);
			var temp = editControl.parseForEditor(tokens);
			errors = [];
			tokens.reduce(function(result, token) {
				if (token.error) result.push(token);
				return result;
			}, errors);
			r.same(6, errors.length).same(';', errors[0].str).same('=', errors[1].str).
					same('+', errors[2].str).same('y', errors[3].str).
					same('qq', errors[4].str).same('}', errors[5].str);
		},

		'editControl.tokenizeForEditor',
		function(t,r) {
			outStr = editControl.parseForEditor(tokens);
			r.logObjects(outStr);
			r.same(source, RustyTools.Str.markupToPlainText(outStr));
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
			r.different(RustyTools.Str.markupToPlainText(outStr2),
				RustyTools.Str.markupToPlainText(outStr)).
				same(RustyTools.Str.markupToPlainText(reverted),
				RustyTools.Str.markupToPlainText(outStr));
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
	'<#allResults><div class="testFrame <#resultType/>"><h1>' +
	'<#resultType/> - <#resultCount/></h1><#results>' +
		'<div class="description"><#description/></div>'+
		'<div class="test"><#test/>'+
			'<div class="log"><#log/></div>'+
			'<div class="error"><#error/></div>'+
			'<div class="exception"><#exception/></div>'+
		'</div>' +
	'</#results></div></#allResults>' +
	'</body>' +
	'</html>');

window.open('data:text/html;charset=utf-8,' + encodeURIComponent(html),
		'TestOutput');