RustyTools.Ui = {
	// Strings to use with multiReplace to create components.
	menu: { sumbStr: '<ul class="menu">'+
					'<#menu>'+
						'<li class="drop-menu"><a href="#"><#menuName/></a>'+
							'<ul id="menu-<#menuName/>">'+
								'<#subMenu>'+
									'<li><a href="#<#id/>"><#content/></a></li>'+
								'</#subMenu>'+
							'</ul>'+
						'</li>'+
					'</#menu>'+
				'</ul>',
				// readjustRegEx If the content is a tag - remove the <a..> wrapper.
				readjustRegEx: /<a href="#">(<)|(>)<\/a>/g,
				readjustReplace: '$1$2'
	},

	checkItem: '<label><input type="checkbox" <#1/>/><#2/></label>',

	radioItem: '<label><input type="radio" name="<#1/>" value="<#2/>"/>' +
			'<span class="<#2/>"><#3/></span></label>',

	numberInputItem: '<label><#1/><input id="<#2/>" type="number" ' +
			'min="<#2/>" max="<#4/>" value="<#5/>" step="<#6/>"/></input>',

	lineNumber: '<div class="line-number" contenteditable="false" ' +
		'onselectStart="RustyTools.disallow();" ' +
		'onmousedown="RustyTools.disallow();"><#1/></div>',

	replace: function(template /* args */) {
		// Match <#id/> or <+id/>
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
