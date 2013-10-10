function RustyToolsWrap() {};

RustyTools = {
	/**********
	Note:   addOneLevel and cloneOneLevel will referene/alias the objects.
					This is to prevent infinite recursion,
					but be carefull of mutating the objects!
	**********/
	// addOneLevel - copies object members onto dest.
	//
	// Only clones the top level! This prevents infinite loops, but lower level
	// objects are referenced/aliased.
	addOneLevel: function(dest /* objects */) {
		"use strict";
		for (var i=1; i<arguments.length; i++) {
			var toClone = arguments[i];
			if ('object' !== typeof toClone) {
				throw new TypeError('RustyTools.addOneLevel called on a non-object.');
			}

			if (toClone) {
				for (var key in toClone) {
					if (toClone.hasOwnProperty(key)) {
						var property = toClone[key];
						if (property instanceof Function) {
							// Alias function objects do not deep copy
							dest[key] = property;
						} else if (property instanceof RegExp) {
							// Alias all RegExp
							dest[key] = property;
						} else if (property instanceof Array) {
							// Array - append all the array values.
							if (!(dest[key] instanceof Array)) dest[key] = [];
							dest[key] = dest[key].concat(property);
						} else if (property instanceof Object) {
							// Object - for all items in config  replace those entries in dest.
							if (!(dest[key] instanceof Object)) dest[key] = {};
							for (var j in property) {
								if (property.hasOwnProperty(j)) dest[key][j] = property[j];
							}
						} else {
							dest[key] = property;
						}
					}
				}
			}
		}
		return dest;
	},

	createDomElement: function(templateObj, opt_document) {
		var element = (opt_document || document).createElement(templateObj.tag);
		RustyTools.addOneLevel(element, templateObj);
		return element;
	},

	cloneOneLevel: function(/* objects */) {
		"use strict";
		var params = Array.prototype.slice.call(arguments, 0);
		params.unshift({});

		return this.addOneLevel.apply(this, params);
	},

	// simpleObjCopy will copy only the numbers, booleans, and strings.
	simpleObjCopy: function(/* objects */) {
		"use strict";
		var result = {};
		for (var i=0; i<arguments.length; i++) {
			var toClone = arguments[i];
			if (toClone) {
				if ('object' !== typeof toClone) {
					throw new TypeError('RustyTools.simpleObjCopy called on a non-object.');
				}

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

		var wrapper = function(key) {return constData[key];};

		// A function is an object, so it can have properties/methods too.
		// subclass will add (optionally) more constants.
		wrapper.subclass = function(/* objects */) {
			var params = Array.prototype.slice.call(arguments, 0);
			params.unshift(constData);
			return RustyTools.constantWrapper.apply(RustyTools, params);
		}
		return wrapper;
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
		callParams.unshift((this.cfg) ? this.cfg : {});
		this.cfg = RustyTools.addOneLevel.apply(this, callParams);
	},

	/*
	 * RustyTools.wrapObject uses prototype inheritance to make a wrapper around
	 * an existing object.  This allows the wrapping of objects so some members
	 * can be overridden.
	 */
	wrapObject: function(obj) {
		"use strict";
		function RustyToolsWrap() {
			// obj instanceof RustyToolsWrap is unreliable because each
			// call of wrapObject changes RustyToolsWrap.  Instead put
			// a test function in the new wrapper.
			this.rustyToolsIsWrapped = function() {return true;}
		};
		RustyToolsWrap.prototype = obj;

		return new RustyToolsWrap();
	},

	isEnabled: function(xpathOrCSSQuery) {
		"use strict";
		var enabled;	// undefined - false but not === false
		var el;

		// NOTE: document.evaluate / xpath is not supported by I.E.!
		if (self.document && self.document.evaluate && -1 < xpathOrCSSQuery.search(/\//)) {
			var elements = self.document.evaluate(xpathOrCSSQuery, self.document, null,
					self.XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
			try {
				while ((el = elements.iterateNext()) && (enabled = !el.disabled));
			} catch (e) {}
		} else {
			if ('function' === typeof document.querySelectorAll) {
				// NOTE: querySelectorAll returns a NodeList that is array like, but not
				// actually an array.
				var nodeList = document.querySelectorAll(xpathOrCSSQuery);
				var index = nodeList.length;
				enabled = !!nodeList.length;
				while ((false !== enabled) && index--) {
					enabled = !nodeList[index].disabled;
				}
			} else if ('#' === xpathOrCSSQuery[0] && self.document) {
				el = self.document.getElementById(xpathOrCSSQuery.substr(1));
				enabled = el && !el.disabled;
			}
		}
		return !!enabled;
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

	// Convert the name (e.g. "RustyTools.Str") to the object->member it references.
	// This returns undefined if the pats is not found.
	pathToMember: function(rustyToolsObjName, opt_root) {
		"use strict";
		var keys = rustyToolsObjName.split('.');
		var member = opt_root || self;
		for (var j=0; member && j<keys.length; j++) {
			member = member[keys[j]];
		}

		return member;
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
			var obj = RustyTools.pathToMember(arguments[i]);

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
				return !!RustyTools.pathToMember(rustyToolsObjName);
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

