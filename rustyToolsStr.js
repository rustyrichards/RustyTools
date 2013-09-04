window['RustyTools'] || (window['RustyTools'] = RustyTools = {});

RustyTools.Str = {
	// Use opt_skipWhitespace = true if you are using the CSS white-space rule to 
	// handle the whitespace.  (white-space:pre-wrap; to make it behave like a text file.)
	entitize: function(str, opt_skipWhitespace) {
		var str2 = ((str) ? str.toString() : '').replace(/&/g, '&amp;').
				replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&#34;').
				replace(/\$/g, '&#36;');
		if (!opt_skipWhitespace) str2 = str2.replace(/ /g, '&nbsp;').replace(/\r\n|\r|\n/g, '<br/>');
		return str2;
	},

	quote: function(str, quote) {
		if (!quote) quote = RustyTools.cfg.stringQuote;
		var expr = new RegExp(quote, 'g');
		return quote + ((str) ? str.toString() : '').replace(expr, '\\' + quote) + quote;
	},

	/*
	 * toString - Convert the input parameters to strings.  .
	 */
	toString: function(/*...*/) {
		var undef;

		var result = '';
		for (var i=0; i<arguments.length; i++) {
			try {
				var arg = arguments[i];
				if (undef == arg) {
					result = 'undefined';
				} else if (null == arg) {
					result = 'null';
				} else if ('function' == typeof arg) {
					result += this.toString(arg());
				} else if (Array.isArray(arg)) {
					for (var j=0; j<arg.length; j++) result += RustyTools.Str.toString(arg[j]);
				} else {
					result += arg.toString(10);
				}
			} catch (e) {RustyTools.logException(e);}
		}

		return result;
	},

	/*
	 * multiReplace - replace the taga <#id>...</#id>, <#id/>, or <+id/> etc with the supplied 
	 *                parameters. (The <+id should be numbers they will be pos incremented.)
	 *
	 *                To allow for recursive substitution <-#id>...</-#id>, <-#id/> and <-+id/>
	 *                should be used inside the content, with one extra '-' added for each
	 *                substitution level.
	 *                Note: the '-' is usually note needed.  Because the content is supstituted
	 *                before the non-content tags are supstituted!
	 *
	 *                Note: the supplied parameter can be a function; in which case it
	 *                is passed the index, and the content.
	 *
	 *                If substObjs is an array, the substitution is done for each element in the
	 *                array
	 *
	 *                You usually want the numbers in substObjs to keep increasing.  (This is usefull
	 *                for generating unique IDs)
	 *                If you need the numbers to start the same each time use 
	 *                  opt_doNotChangeSubst = true
	 */
	multiReplace: function(str, substObjs, opt_doNotChangeSubst) {
		var matches = {};
		var replaceArgs = arguments;
		var result = '';

		if (!Array.isArray(substObjs)) substObjs = [substObjs];
		for (var i=0; i<substObjs.length; i++) {
			// We need to keep the source numbers as the substitutions may change the number values.
			var substObj = substObjs[i];
			if (opt_doNotChangeSubst) substObj = RustyTools.simpleObjCopy(substObj);

			// Order of replacement matters.
			//  1) do the content matches
			//  2) do the <# matches
			//  3) do the <+ matches
			// This way any auto-incrementing numbers will happen accross the whole string.

			// Match <#id>...</#id>
			var context = this;
			var replaced = str.replace(/<#([^\/>]+)>([\s\S]*)<\/#\1>/g,
				function(match, index, content) {
					var substValue = substObj[index];
					if (substValue != null) {
						if (content) {
							// Recursively call multireplace on the content
							// Remove one level of - from <-*n
							var adjContent = content.replace(/(<\/?-*?)-([\+#])/g, '$1$2');
							// For any recursive calls opt_keepSource should be false or omitted.
							if (Array.isArray(substValue)) {
								matches[index] = '';
								for (var j=0; j<substValue.length; j++) {
									matches[index] += context.multiReplace(adjContent, substValue[j]);
								}
							} else if (substValue instanceof Object) {
								matches[index] = context.multiReplace(adjContent, substValue);
							}
						} else if (!matches[index]) {
							matches[index] = RustyTools.Str.toString(substValue);
						}
					}
					return (matches[index] == null) ? match : matches[index];
				});

			// Match <#id/> or <+id/>
			result += replaced.replace(/<(#|\+)([^\/>]+)\/>/g, 
				function(match, symbol, index, content) {
					var retVal = match;
					if (index in substObj) {
						if ('+' == symbol) {
							retVal = RustyTools.Str.toString(substObj[index]++);
						} else {
							retVal =  RustyTools.Str.toString(substObj[index]);
						}
					}
					return retVal;
				});
		}

		return (result) ? result : str;
	},

	/*
	 * mulitReplaceCleanup - remove any remaining multiReplace tags
	 */
	mulitReplaceCleanup: function(str) {
		return str.replace(/<(-*)(#|\+)([^\/>]+)(?:\/>|>([\s\S]*)<\/\1\2\3>)/g, '');
	},

	substitute: function(str, key, value) {
		var pos = str.search(key);

		if (-1 != pos) {
			return str.substr(0, pos) + value + 
					this.substitute(str.substr(pos + key.length), key, value);
		}
		return str;
	}
};
