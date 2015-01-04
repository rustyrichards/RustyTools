/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint globalstrict: true, eqnull: true, curly: false, latedef: true, newcap: true, undef: true, unused: true, strict: true, browser: true, devel: true*/
/* global RustyTools */

// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Str.__test = [
	'RustyTools.Str.__test\n' +
	'RustyTools.Str.entitize',
	function(t) {
		var entitized = RustyTools.Str.entitize('<a> & \t\n');
		t.different(entitized,'<a> & \t\n').
				same(entitized, '&lt;a&gt;&nbsp;&amp;&nbsp;<br/>');
	},
	function(t) {
		var entitized = RustyTools.Str.entitize('<a> & \t\n', true);
		t.same(entitized, '&lt;a&gt; &amp; \t\n');
	},

	'RustyTools.Str.quote',
	function(t) {
		var quoted = RustyTools.Str.quote('"can\'t"', "'");
		t.same(quoted, "'\"can\\\'t\"'");
	},

	'RustyTools.Str.toString',
	function(t) {
		var str = RustyTools.Str.toString(5);
		str += typeof str;
		t.same(str, '5string');
	},
	function(t) {
		var str = RustyTools.Str.toString(function(){return 2 + 3;});
		str += typeof str;
		t.same(str, '5string');
	},
	function(t) {
		var str = RustyTools.Str.toString('x', 'y', function(){return 'z';});
		str += typeof str;
		t.same(str, 'xyzstring');
	},
	function(t) {
		var str = RustyTools.Str.toString('A', ['B', function(){return 'C ';},
				5.1], ' ', 3.14159);
		t.same(str, 'ABC 5.1 3.14159');
	},

	'RustyTools.Str.removeClasses',
	function(t) {
		var source = 'test toRemove2 other';
		var output = RustyTools.Str.removeClasses(source, 'toRemove1',
				'toRemove2', 'toRemove3');

		t.different(source, output).same(output, 'test other');
	},

	'RustyTools.Str.addClasses',
	function(t) {
		var source = 'test toAdd2 other';
		var output = RustyTools.Str.addClasses(source, 'toAdd1', 'toAdd2', 'toAdd3');

		t.different(source, output).same(output, 'test other toAdd1 toAdd2 toAdd3');
	},

	'RustyTools.Str.toggleClasses',
	function(t) {
		var source = 'test toToggle2 other';
		var output = RustyTools.Str.toggleClasses(source, 'toToggle1', 'toToggle2',
				'toToggle3');

		t.different(source, output).same(output, 'test other toToggle1 toToggle3');
	},

	'RustyTools.Str.strMultiReplace',
	function(t) {
		var source = '- a: <repl:0/>, c: <repl:2/>, b: <repl:1/>, c: <repl:2/> -';
		var subst = ['a0', 'b0', 'c0', 'a1', 'b1', 'c1', 'a2', 'b2', 'c2'];
		var replaced1 = RustyTools.Str.strMultiReplace(source, subst);
		var shouldbe1 = '- a: a0, c: c0, b: b0, c: c0 -- a: a1, c: c1, b: b1, c: c1 -' +
				'- a: a2, c: c2, b: b2, c: c2 -';
		var filtered = RustyTools.Str.mulitReplaceCleanup(replaced1);
		t.different(source, replaced1).same(replaced1, shouldbe1).
			same(filtered, shouldbe1.replace(/<[^>]*>/g, ''));
	},


	'RustyTools.Str.multiReplace',
	function(t) {
		var source = 'Param1: <repl:1/>, Param12: <repl:12/>, Param2: <repl:2/>, Param3: <repl:3/>, ' +
				'Param4: <repl:4/>, Param5: <repl:5/>, Param6: <repl:6/>, Param7: <repl:7/>, Param8: <repl:8/>, '+
				'Param9: <repl:9/>, Param11: <repl:11/>, all except 10: ' +
				'<repl:1/>,<repl:2/>,<repl:3/>,<repl:4/>,<repl:5/>,<repl:6/>,<repl:7/>,<repl:8/>,<repl:9/>,<repl:11/>,<repl:12/>,<repl:13/>';
		var subst = {1: 'a', 2: 'b', 3: 3.3, 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'h',
				9: 'i', 10: 'j', 11: 'k', 12: function() {return 'l';}};
		var replaced1 = RustyTools.Str.multiReplace(source, subst);
		var shouldbe1 = 'Param1: a, Param12: l, Param2: b, Param3: 3.3, ' +
				'Param4: d, Param5: e, Param6: f, Param7: g, Param8: h, ' +
				'Param9: i, Param11: k, all except 10: ' +
				'a,b,3.3,d,e,f,g,h,i,k,l,<repl:13/>';
		var filtered = RustyTools.Str.mulitReplaceCleanup(replaced1);
		t.different(source, replaced1).same(replaced1, shouldbe1).
			same(filtered, shouldbe1.replace(/<[^>]*>/g, ''));
	},

	function(t) {
		var source = '<div class="widget" id="widget<inc:widgetNo/>">\n' +
				'<repl:widgetContent><img src="<-repl:imgSrc/>">\n</repl:widgetContent>' +
				'</div>';
		var subst = {widgetNo: 1, widgetContent: [
					{imgSrc: 'test1.png'},
					{imgSrc: 'test2.png'}
				]};
		var replaced = RustyTools.Str.multiReplace(source, subst);
		// No remaining <-repl: or <repl:, and it should have 2 img tags.
		t.noMatch(/<-*repl:/, replaced).match(/(<img src\="test[0-9]\.png">\s*){2}/g, replaced).
				// Make sure the widgetNo increased
				same(2, subst.widgetNo).logObjects(replaced);
	},

	function(t) {
		var source = '<div><repl:inner/></div>';
		var subst = {inner: '<div class="inner">inner text</div>'};
		var replaced1 = RustyTools.Str.multiReplace(source, subst, 0);
		var replaced2 = RustyTools.Str.multiReplace(source, subst);
		// We have already checked the RustyTools.Str.Entitize
		t.same(replaced1, '<div><div class="inner">inner text</div></div>').
				different(replaced1, replaced2);
	},

	function(t) {
		var source = '<div class="widget" id="widget<inc:widgetNo/>">\n' +
			'<repl:inner>widgetNo keeps increasing: <inc:widgetNo/>\n</repl:inner>' +
			'</div>';
		var subst = {widgetNo: 1, inner: [{},{},{}]};
		var subst_unchanged = RustyTools.cloneOneLevel(subst);
		var replaced1 = RustyTools.Str.multiReplace(source, subst);
		var replaced2 = RustyTools.Str.multiReplace(source, subst_unchanged,
				RustyTools.Str.multiReplaceDefaultFlags ||
				RustyTools.Str.multiReplaceFlags.preserveNumbers);
		// Make sure that useing opt_doNotChangeSubst yeilds the same result string, but
		// the numbers in subst_unchanged have not incremented.
		t.same(replaced1, replaced2).different(subst.widgetNo, 1).same(subst_unchanged.widgetNo, 1).
				logObjects(replaced1);
	},

	'RustyTools.Str.regExpEscape',
	function(t) {
		var testStr = '$()*+./?[\\]^{|}';
		var regex = new RegExp(RustyTools.Str.regExpEscape(testStr));
		t.match(regex, testStr);
	},

	'RustyTools.Str.getParamValues',
	function(t) {
		var testStr = '?a=testing&multi=one&multi=two&encoded=' + encodeURIComponent('?&=');
		var a = RustyTools.Str.getQueryValues('a', testStr);
		var multi = RustyTools.Str.getQueryValues('multi', testStr);
		var encoded = RustyTools.Str.getQueryValues('encoded', testStr);

		t.same(a, ['testing']).same(multi, ['one', 'two']).same(encoded, ['?&=']);
	},

	'RustyTools.Str.markupToPlainText',
	function(t) {
		var str = RustyTools.Str.markupToPlainText(
				'<a href="keep this">text in the anchor</a><br>' +
				'test<img src="keep this">text after the img<br>' +
				'<a href=#>discard the # link</a><br>' +
				'&lt;Testing &#34;RustyTools.Str.markupToPlainText&#34;&nbsp;&#36;&gt;'
		);

		t.same(str, 'keep this text in the anchor\n' +
				'test keep this text after the img\n' +
				'discard the # link\n' +
				'<Testing "RustyTools.Str.markupToPlainText"\u00A0$>');
	}
];
