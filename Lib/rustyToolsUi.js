/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


RustyTools.Ui = {
	// Strings to use with multiReplace to create components.
	menu: { sumbStr: '<ul class="menu">'+
					'<repl:menu>'+
						'<li class="drop-menu"><a href="#"><repl:menuName/></a>'+
							'<ul id="menu-<repl:menuName/>">'+
								'<repl:subMenu>'+
									'<li><a href="#<repl:id/>"><repl:content/></a></li>'+
								'</repl:subMenu>'+
							'</ul>'+
						'</li>'+
					'</repl:menu>'+
				'</ul>',
				// readjustRegEx If the content is a tag - remove the <a..> wrapper.
				readjustRegEx: /<a href="#">(<)|(>)<\/a>/g,
				readjustReplace: '$1$2'
	},

	checkItem: '<label><input type="checkbox" <repl:1/>/><repl:2/></label>',

	radioItem: '<label><input type="radio" name="<repl:1/>" value="<repl:2/>"/>' +
			'<span class="<repl:2/>"><repl:3/></span></label>',

	numberInputItem: '<label><repl:1/><input id="<repl:2/>" type="number" ' +
			'min="<repl:2/>" max="<repl:4/>" value="<repl:5/>" step="<repl:6/>"/></input>',

	lineNumber: '<div class="line-number" contenteditable="false" ' +
		'onselectStart="RustyTools.disallow();" ' +
		'onmousedown="RustyTools.disallow();"><repl:1/></div>',

	replace: function(template /* args */) {
		"use strict";
		// Match <repl:id/> or <inc:id/>
		var params = Array.prototype.slice.call(arguments, 0);
		return template.replace(/<(#|\+)([0-9]+)\/>/g,
			function(match, symbol, key) {
				// 0 is the template, 1 is the first of the var-args
				var index = parseInt(key, 10);
				var retVal = match;
				if ('+' === symbol) {
					retVal = RustyTools.Str.toString(params[index]++);
				} else {
					retVal =  RustyTools.Str.toString(params[index]);
				}
				return retVal;
			});
	},

	makeComponent: function(template, replaceObj, opt_hostElement) {
		"use strict";
		var str;
		try {
			// Call multiReplace and mulitReplaceCleanup to fill in the template.
			str = RustyTools.Str.mulitReplaceCleanup(RustyTools.Str.multiReplace(
					template.sumbStr, replaceObj, 'none'));
			// Use readjustRegEx to make any post substitution changes.
			if (template.readjustRegEx) {
				str = str.replace(template.readjustRegEx, template.readjustReplace || '');
			}
			// Use readjustRegEx to make any post substitution changes.
			if (template.readjustFn) {
				str = template.readjustFn(str, replaceObj);
			}
			if (opt_hostElement) opt_hostElement.innerHTML = str;
		} catch (e) {
			RustyTools.logException(e);
		}

		return (opt_hostElement) ? opt_hostElement : str;
	}
};
