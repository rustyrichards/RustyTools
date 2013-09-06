window['RustyTools'] || (window['RustyTools'] = RustyTools = {});

/**********
Note:   cloneOneLevel will reserence/alias the objects.  This is to prevent infinite recursion,
				but be carefull of mutating the objects!

				RustyTools.cloneOneLevel can not be in the object notation because it must be called - see below.
**********/
RustyTools.cloneOneLevel = function(/* objects */) {
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
							if (property.hasOwnProperty(i)) result[key][j] = property[j];
						}
					} else {
						result[key] = property;
					}
				}
			}
		}
	}
	return result;
};

// simpleObjCopy will alias most objects; numbers will copy;
RustyTools.simpleObjCopy = function(/* objects */) {
	var result = {};
	for (var i=0; i<arguments.length; i++) {
		var toClone = arguments[i];
		if (toClone) {
			for (var key in toClone) {
				if (toClone.hasOwnProperty(key)) {
					result[key] = toClone[key];
				}
			}
		}
	}
	return result;
};

RustyTools.log = function() {
	// Use the implied "self" so that it can be overridden in testing.
	// Watch using "self" some system functions (e.g. setInterval) will
	// throw an exception if called on an overridden globabl object!
	if (self.console && self.console.log) {
		for (var i =0; i<arguments.length; i++) self.console.log(arguments[i]);
	}
}

RustyTools.logException = function(e) {
	var errorStr = '';
	if (e.message) {
		errorStr = e.message
	} else if (e.toString) {
		errorStr = e.toString();
	}
	if (e.fileName) errorStr += '  FileName: ' + e.fileName;
	if (e.lineNumber) errorStr += '  Line: ' + e.lineNumber;
	if (e.columnNumber) errorStr += '  Col: ' + e.columnNumber;

	RustyTools.log(errorStr);
};

/**
 * RustyTools.configure will overwrite any matching RustyTools members.
 * Use this for setting and extending configuration variables.
 */
RustyTools.configure = function(/* config object(s) */) {
	var callParams = Array.prototype.slice.call(arguments, 0);
	callParams.unshift(this.cfg);
	this.cfg = RustyTools.cloneOneLevel.apply(this, callParams);
};

{
	// Get the path to this script file
	var scripts = document.getElementsByTagName('script');
	var scriptDir = '';
	var i = scripts.length;
	while (!scriptDir && i--) {
		var path = scripts[i].src;
		if (-1 != path.search(/RustyTools.js$/i)) {
			scriptDir = path.split('/').slice(0, -1).join('/')+'/';
		}
	}

	// Configure once RustyTools.configure is set. 
	RustyTools.configure({stringQuote: '"', rustyScriptPath: scriptDir});
}

/*
 * RustyTools.wrapObject uses prototype inheritance to make a wrapper around
 * an existing object.  This allows the wrapping of objects so some members
 * can be overridden.
 */
RustyTools.wrapObject = function(obj) {
	function InheritWrapper() {};
	InheritWrapper.prototype = obj;
	return new InheritWrapper();
};

RustyTools.isEnabled = function(xpathOrJQuery) {
	var enabled = false;

	// NOTE: document.evaluate / xpath is not supported by I.E
	if (document.evaluate && -1 < xpathOrJQuery.search(/\//)) {
		var elements = document.evaluate(xpathOrJQuery, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null); 
		var el;
		try {
			 while ((el = elements.iterateNext()) && (enabled = !el.disabled));
		} catch (e) {}
	} else {
		var hasJquery = false;
		try {
			hasJQuery = 'function' == typeof $;
		} catch (e) {}
		if (hasJquery) {
			$(idOrJqueryPattern).each(function(inedex, element){enabled = !element.disabled; return enabled;});
		} else if ('#' == xpathOrJQuery[0]) {
			var el = document.getElementById(xpathOrJQuery.substr(1));
			enabled = el && !el.disabled;
		}
	}
	return enabled;
};

// See if object in indexable.
RustyTools.isArrayLike = function(object) {
  try {
	return 'string' != typeof object && 'number' === typeof object.length;
  } catch (e) {
  	// If there it no object.length then it is not not array like.
  	return false;
  }
};

// Load any other one of the RustyTools...
RustyTools.getUri = function(rustyToolsObjName) {
	var fileName = rustyToolsObjName.replace(/\./g, '');
	return  RustyTools.cfg.rustyScriptPath + fileName + '.js';
};

// Convert the name (e.g. "RustyTools.Str") to the object it references.
// This returns undefined if the object was not found.
RustyTools.strToObj = function(rustyToolsObjName) {
	var keys = rustyToolsObjName.split('.');
	var obj = self;
	for (var j=0; obj && j<keys.length; j++) {
		obj = obj[keys[j]];
	}

	return obj;
};

// Load any other one of the RustyTools...  Pass in the full object name
// to the top level object you need (e.g. RustyTools.Fn.__test)
//
// Note: The script will load and complete as the DOM handles it.
//       This does not try to take the place of ATM; it does nothing to 
//        control the time the execution of the script is started.
RustyTools.load = function(rustyToolsObjName /* ... */) {
	var needsToLoad = false;
	for (var i=0; i<arguments.length; i++) {
		var obj = RustyTools.strToObj(arguments[i]);

		if (!obj) {
			var script = document.createElement('script');
			script.setAttribute("type","text/javascript");
			script.setAttribute("src", RustyTools.getUri(arguments[i]));
			document.getElementsByTagName("head")[0].appendChild(script);
			needsToLoad = true;
		}
	}
	return needsToLoad;
};

// Wait until fmCondition passes then call fnCallback.  This is usefull for
// waiting until all modules are loaded, or for waiting until a DOM object is
// available.
//
// Note:  the timer keeps running until fmCondition is met, so don't start a lot
//        of these that may not finish.
RustyTools.waitForCondition = function(fmCondition, fnCallback, opt_interval) {
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
};

// Wait for the RustyTools.load
RustyTools.waitForLoad = function(rustyToolsObjName, fnCallback, opt_interval) {
	var loading = RustyTools.load(rustyToolsObjName);
	if (loading) {
		RustyTools.waitForCondition(function() {
			// Return true if the rustyToolsObjName object eists.
			return !!RustyTools.strToObj(rustyToolsObjName);
		}, fnCallback, opt_interval);
	}
	// else RustyTools.load returns flas means already loaded.

	return loading;
};
