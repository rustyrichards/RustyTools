// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Str.__test = function(t, r) {
	// .Fn level RustyTools methods
	t.test([
		'RustyTools.Str.__test\n' +
		'RustyTools.Str.entitize',
		function(t,r) {
			var entitized = RustyTools.Str.entitize('<a> & \r\n');
			r.different(entitized,'<a> & \r\n').
					same(entitized, '&lt;a&gt;&nbsp;&amp;&nbsp;<br/>');
		},
		function(t,r) {
			var entitized = RustyTools.Str.entitize('<a> & \r\n', true);
			r.same(entitized, '&lt;a&gt; &amp; \r\n');
		},

		'RustyTools.Str.quote',
		function(t,r) {
			var quoted = RustyTools.Str.quote('"can\'t"', "'");
			r.same(quoted, "'\"can\\\'t\"'");
		},

		'RustyTools.Str.toString',
		function(t,r) {
			var str = RustyTools.Str.toString(5);
			str += typeof str;
			r.same(str, '5string');
		},
		function(t,r) {
			var str = RustyTools.Str.toString(function(){return 2 + 3;});
			str += typeof str;
			r.same(str, '5string');
		},
		function(t,r) {
			var str = RustyTools.Str.toString('x', 'y', function(){return 'z';});
			str += typeof str;
			r.same(str, 'xyzstring');
		},
		function(t,r) {
			var str = RustyTools.Str.toString('A', ['B', function(){return 'C ';},
					5.1], ' ', 3.14159);
			r.same(str, 'ABC 5.1 3.14159');
		},

		'RustyTools.Str.multiReplace',
		function(t, r) {
			var source = 'Param1: <#1/>, Param12: <#12/>, Param2: <#2/>, Param3: <#3/>, ' +
					'Param4: <#4/>, Param5: <#5/>, Param6: <#6/>, Param7: <#7/>, Param8: <#8/>, '+
					'Param9: <#9/>, Param11: <#11/>, all except 10: ' +
					'<#1/>,<#2/>,<#3/>,<#4/>,<#5/>,<#6/>,<#7/>,<#8/>,<#9/>,<#11/>,<#12/>,<#13/>';
			var subst = {1: 'a', 2: 'b', 3: 3.3, 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'h',
					9: 'i', 10: 'j', 11: 'k', 12: function() {return 'l';}};
			var replaced1 = RustyTools.Str.multiReplace(source, subst);
			var shouldbe1 = 'Param1: a, Param12: l, Param2: b, Param3: 3.3, ' +
					'Param4: d, Param5: e, Param6: f, Param7: g, Param8: h, ' +
					'Param9: i, Param11: k, all except 10: ' +
					'a,b,3.3,d,e,f,g,h,i,k,l,<#13/>';
			var filtered = RustyTools.Str.mulitReplaceCleanup(replaced1);
			r.different(source, replaced1).same(replaced1, shouldbe1).
				same(filtered, shouldbe1.replace(/<[^>]*>/g, ''));
		},

		function(t, r) {
			var source = '<div class="widget" id="widget<+widgetNo/>">\n' +
					'<#widgetContent><img src="<-#imgSrc/>">\n</#widgetContent>' +
					'</div>';
			var subst = {widgetNo: 1, widgetContent: [
						{imgSrc: 'test1.png'},
						{imgSrc: 'test2.png'}
					]};
			var replaced = RustyTools.Str.multiReplace(source, subst);
			// No remaining <-# or <#, and it should have 2 img tags.
			r.noMatch(/<-*#/, replaced).match(/(<img src\="test[0-9]\.png">\s*){2}/g, replaced).
					// Make sure the widgetNo increased
					same(2, subst.widgetNo).logObjects(replaced);
		},

		function(t, r) {
			var source = '<div><#inner/></div>';
			var subst = {inner: '<div class="inner">inner text</div>'};
			var replaced1 = RustyTools.Str.multiReplace(source, subst, true);
			var replaced2 = RustyTools.Str.multiReplace(source, subst);
			// We have already checked the RustyTools.Str.Entitize
			r.same(replaced1, '<div><div class="inner">inner text</div></div>').
					different(replaced1, replaced2);
		},

		function(t, r) {
			var source = '<div class="widget" id="widget<+widgetNo/>">\n' +
				'<#inner>widgetNo keeps increasing: <+widgetNo/>\n</#inner>' +
				'</div>';
			var subst = {widgetNo: 1, inner: [{},{},{}]};
			var subst_unchanged = RustyTools.cloneOneLevel(subst);
			var replaced1 = RustyTools.Str.multiReplace(source, subst);
			var replaced2 = RustyTools.Str.multiReplace(source, subst_unchanged, false, true);
			// Make sure that useing opt_doNotChangeSubst yeilds the same result string, but
			// the numbers in subst_unchanged have not incremented.
			r.same(replaced1, replaced2).different(subst.widgetNo, 1).same(subst_unchanged.widgetNo, 1).
					logObjects(replaced1);
		},

		'RustyTools.Str.regExpEscape',
		function(t,r) {
			var testStr = '$()*+./?[\\]^{|}';
			var regex = new RegExp(RustyTools.Str.regExpEscape(testStr));
			r.match(regex, testStr);
		},

		'RustyTools.Str.getParamValues',
		function(t,r) {
			var testStr = '?a=testing&multi=one&multi=two&encoded=' + encodeURIComponent('?&=');
			var a = RustyTools.Str.getQueryValues(testStr, 'a');
			var multi = RustyTools.Str.getQueryValues(testStr, 'multi');
			var encoded = RustyTools.Str.getQueryValues(testStr, 'encoded');

			r.same(a, ['testing']).same(multi, ['one', 'two']).same(encoded, ['?&=']);
		},

		'RustyTools.Str.markupToPlainText',
		function(t,r) {
			var str = RustyTools.Str.markupToPlainText(
					'<a href="keep this">text in the anchor</a><br>' +
					'test<img src="keep this">text after the img<br>' +
					'<a href=#>discard the # link</a><br>' +
					'&lt;Testing &#34;RustyTools.Str.markupToPlainText&#34;&nbsp;&#36;&gt;'
			);

			r.same(str, 'keep this text in the anchor\n' +
					'test keep this text after the img\n' +
					'discard the # link\n' +
					'<Testing "RustyTools.Str.markupToPlainText"\u00A0$>');
		}
	]);
};
