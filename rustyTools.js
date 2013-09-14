/**********
Note:   cloneOneLevel will reserence/alias the objects.  This is to prevent infinite recursion,
				but be carefull of mutating the objects!

				RustyTools.cloneOneLevel can not be in the object notation because it must be called - see below.
**********/
RustyTools = {
	cloneOneLevel: function(/* objects */) {
		"use strict";
		var result = {};
		for (var i=0; i<arguments.length; i++) {
			var toClone = arguments[i];
			if (toClone) {
				for (var key in toClone) {
					if (toClone.hasOwnProperty(key)) {
						var property = toClone[key];
						if (property instanceof Function) {
							// Alias function objects do not deep copy
							result[key] = property;
						} else if (property instanceof RegExp) {
							// Alias all RegExp
							result[key] = property;
						} else if (property instanceof Array) {
							// Array - append all the array values.
							if (!(result[key] instanceof Array)) result[key] = [];
							result[key] = result[key].concat(property);
						} else if (property instanceof Object) {
							// Object - for all items in config  replace those entries in result.
							if (!(result[key] instanceof Object)) result[key] = {};
							for (var j in property) {
								if (property.hasOwnProperty(j)) result[key][j] = property[j];
							}
						} else {
							result[key] = property;
						}
					}
				}
			}
		}
		return result;
	},

	// simpleObjCopy will copy only the numbers, booleans, and strings.
	simpleObjCopy: function(/* objects */) {
		"use strict";
		var result = {};
		for (var i=0; i<arguments.length; i++) {
			var toClone = arguments[i];
			if (toClone) {
				for (var key in toClone) {
					// No hasOwnProperty check.  This will copy base class members too.
					var type = typeof toClone[key];
					if (-1 !== ['number', 'boolean', 'string'].indexOf(type)) {
						result[key] = toClone[key];
					}
				}
			}
		}
		return result;
	},

	// constantWrapper - clone the inputs into constData in a closure that has
	// exclusive (private) access to constData, then reutrn an accessor to read
	// a data item from the constData.
	//
	// Based on:
	// http://stackoverflow.com/questions/130396/are-there-constants-in-javascript
	// (Burke's answer)
	constantWrapper: function(/* objects */) {
		"use strict";
		var constData = RustyTools.simpleObjCopy.apply(this,
				Array.prototype.slice.call(arguments, 0));

		return function(key) {return constData[key];};
	},

	log: function() {
		"use strict";
		// Use the implied "self" so that it can be overridden in testing.
		// Watch using "self" some system functions (e.g. setInterval) will
		// throw an exception if called on an overridden globabl object!
		if (self.console && self.console.log) {
			for (var i =0; i<arguments.length; i++) self.console.log(arguments[i]);
		}
	},

	logException: function(e) {
		"use strict";
		var errorStr = '';
		if (e.message) {
			errorStr = e.message;
		} else if (e.toString) {
			errorStr = e.toString();
		}
		if (e.fileName) errorStr += '  FileName: ' + e.fileName;
		if (e.lineNumber) errorStr += '  Line: ' + e.lineNumber;
		if (e.columnNumber) errorStr += '  Col: ' + e.columnNumber;

		RustyTools.log(errorStr);
	},

	/**
	 * RustyTools.configure will overwrite any matching RustyTools members.
	 * Use this for setting and extending configuration variables.
	 */
	configure: function(/* config object(s) */) {
		"use strict";
		var callParams = Array.prototype.slice.call(arguments, 0);
		callParams.unshift(this.cfg);
		this.cfg = RustyTools.cloneOneLevel.apply(this, callParams);
	},

	/*
	 * RustyTools.wrapObject uses prototype inheritance to make a wrapper around
	 * an existing object.  This allows the wrapping of objects so some members
	 * can be overridden.
	 */
	wrapObject: function(obj) {
		"use strict";
		function InheritWrapper() {};
		InheritWrapper.prototype = obj;
		return new InheritWrapper();
	},

	isEnabled: function(xpathOrJQuery) {
		"use strict";
		var enabled = false;
		var el;

		// NOTE: document.evaluate / xpath is not supported by I.E
		if (self.document && self.document.evaluate && -1 < xpathOrJQuery.search(/\//)) {
			var elements = self.document.evaluate(xpathOrJQuery, self.document, null,
					self.XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
			try {
				while ((el = elements.iterateNext()) && (enabled = !el.disabled));
			} catch (e) {}
		} else {
			var hasJQuery = false;
			try {
				hasJQuery = 'function' === typeof $;
			} catch (e) {}
			if (hasJQuery) {
				$(xpathOrJQuery).each(function(inedex, element){
					enabled = !element.disabled;
					return enabled;
				});
			} else if ('#' === xpathOrJQuery[0] && self.document) {
				el = self.document.getElementById(xpathOrJQuery.substr(1));
				enabled = el && !el.disabled;
			}
		}
		return enabled;
	},

	// See if object in indexable.
	isArrayLike: function(object) {
		"use strict";
		try {
		return 'string' !== typeof object && 'number' === typeof object.length;
		} catch (e) {
			// If there it no object.length then it is not not array like.
			return false;
		}
	},

	// Load any other one of the RustyTools...
	getUri: function(rustyToolsObjName) {
		"use strict";
		var fileName = rustyToolsObjName.replace(/\./g, '').replace(/^[A-Z]/g,
			function(match) {return match.toLowerCase();});
		return  RustyTools.cfg.rustyScriptPath + fileName + '.js';
	},

	// Convert the name (e.g. "RustyTools.Str") to the object it references.
	// This returns undefined if the object was not found.
	strToObj: function(rustyToolsObjName) {
		"use strict";
		var keys = rustyToolsObjName.split('.');
		var obj = self;
		for (var j=0; obj && j<keys.length; j++) {
			obj = obj[keys[j]];
		}

		return obj;
	},

	// Load any other one of the RustyTools...  Pass in the full object name
	// to the top level object you need (e.g. RustyTools.Fn.__test)
	//
	// Note: The script will load and complete as the DOM handles it.
	//       This does not try to take the place of ATM; it does nothing to
	//        control the time the execution of the script is started.
	load: function(/* rustyToolsObjName(s) */) {
		"use strict";
		var needsToLoad = false;
		for (var i=0; i<arguments.length; i++) {
			var obj = RustyTools.strToObj(arguments[i]);

			if (!obj && self.document) {
				var script = self.document.createElement('script');
				script.setAttribute("type","text/javascript");
				script.setAttribute("src", RustyTools.getUri(arguments[i]));
				self.document.getElementsByTagName("head")[0].appendChild(script);
				needsToLoad = true;
			}
		}
		return needsToLoad;
	},

	// Wait until fmCondition passes then call fnCallback.  This is usefull for
	// waiting until all modules are loaded, or for waiting until a DOM object is
	// available.
	//
	// Note:  the timer keeps running until fmCondition is met, so don't start a lot
	//        of these that may not finish.
	waitForCondition: function(fmCondition, fnCallback, opt_interval) {
		"use strict";
		var mustWait = false;
		if (fmCondition()) {
			fnCallback();
		} else {
			mustWait = true;
			var intervalTimer = setInterval(function() {
				if (fmCondition()) {
					clearInterval(intervalTimer);

					// There doesn't seem to be much point to run the timer and not have a callback,
					// but fnCallback == null is a valid input.
					if (fnCallback) fnCallback();
				}
			}, opt_interval || 50);
		}

		return mustWait;
	},

	// Wait for the RustyTools.load
	waitForLoad: function(rustyToolsObjName, fnCallback, opt_interval) {
		"use strict";
		var loading = RustyTools.load(rustyToolsObjName);
		if (loading) {
			RustyTools.waitForCondition(function() {
				// Return true if the rustyToolsObjName object eists.
				return !!RustyTools.strToObj(rustyToolsObjName);
			}, fnCallback, opt_interval);
		}
		// else RustyTools.load returns flas means already loaded.

		return loading;
	}
};


// Make and call an anonomyous function so the local variable will not
// pollute the namespace.
(function() {
		"use strict";
		// Get the path to this script file
		if (self.document) {
			var scripts = self.document.getElementsByTagName('script');
			var scriptDir = '';
			var i = scripts.length;
			while (!scriptDir && i--) {
				var path = scripts[i].src;
				if (-1 !== path.search(/RustyTools.js$/i)) {
					scriptDir = path.split('/').slice(0, -1).join('/')+'/';
				}
			}

			// Configure once RustyTools.configure is set.
			RustyTools.configure({stringQuote: '"', rustyScriptPath: scriptDir});
		}
}());

