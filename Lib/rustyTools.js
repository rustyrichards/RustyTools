/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint eqnull: true, curly: false, latedef: true, newcap: true, undef: true, unused: true, strict: true, browser: true, devel: true*/
/* global self */   // self is the generic global it is "window" im aweb page, or the clobal in a web worker.
                    // js hint should know this!


/**
 * RustyTools is just a collection of methods configuted by RustyTools.cfg.
 */
var RustyTools = {
    cfg: {
        interval: 50,
        rustyToolsScriptPath: Array.prototype.slice.call(document.
                getElementsByTagName('script')).pop().    // Find the most recient script
                src.replace(/\?.*/, '').replace(/\/[^\/]*$/, '/'),  // remove any ?query replace the last / and on with /
    },

    // forEachOwnProperty is re-wrapped as an Object prototype member in rustyToolsObj.js,
    // forEachOwnProperty was needed in cases where rustyToolsObj.js should not be required.
    forEachOwnProperty: function(obj, fn, opt_context, opt_initialValue) {
        "use strict";
        if (fn) {
            if (!opt_context) opt_context = self;
            try {
                obj.getOwnPropertyNames().forEach(function(key) {
                    opt_initialValue = fn.call(opt_context, key, obj[key], obj, opt_initialValue);
                });
            } catch (e) {
                // Unable to use getOwnPropertyNames - try for ... in.  It will
                // probably be incomplete if toClone is the global object
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        opt_initialValue = fn.call(opt_context, key, obj[key], obj, opt_initialValue);
                    }
                }
            }
        }

        // For chaining
        return this;
    },
    
    /**
	 * Deny a dom event.
	 */
	disallow: function() {"use strict"; return false;},

	logError: function(e) {
		"use strict";
        if (self.console && self.console.log) {
            var errorStr = '';
            if (e.message) {
                errorStr = e.message;
            } else if (e.toString) {
                errorStr = e.toString();
            }
            if (e.fileName) errorStr += '  FileName: ' + e.fileName;
            if (e.lineNumber) errorStr += '  Line: ' + e.lineNumber;
            if (e.columnNumber) errorStr += '  Col: ' + e.columnNumber;

            self.console.log(errorStr);
		}
	},

	log: function() {
		"use strict";
		// Use the implied "self" so that it can be overridden in testing.
		// Watch using "self" some system functions (e.g. setInterval) will
		// throw an exception if called on an overridden globabl object!
		if (self.console && self.console.log) {
			for (var i =0; i<arguments.length; i++) {
                if (arguments[i] instanceof Error) {
                    RustyTools.logError(arguments[i]);
                } else {
                    self.console.log(arguments[i]);
                }
            }
		}
	},

	/**
	 * RustyTools.configure will overwrite any matching RustyTools members.
	 * Use this for setting and extending configuration variables.
	 */
	configure: function(/* config object(s) */) {
        "use strict";
        if (!this.cfg) this.cfg = {};
        
        var copyProperties = function(key, value) {
            if (-1 !== ['number', 'boolean', 'string'].indexOf(typeof value)) {
                this.cfg[key] = value;
            }
        }

        for (var i=0; i<arguments.length; i++) {
            RustyTools.forEachOwnProperty(arguments[i], copyProperties, this);
        }
        // for chaining
        return this;
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

	// Convert the name (e.g. "RustyTools.Str") to the object->member it references.
	// This returns undefined if the member is not found.
	pathToMember: function(rustyToolsObjName, opt_root) {
		"use strict";
		var keys = rustyToolsObjName.split('.');
		var member = opt_root || self;
		for (var j=0; member && j<keys.length; j++) {
			member = member[keys[j]];
		}

		return member;
	},

	// Load any other one of the RustyTools...
	getUri: function(rustyToolsObjName, opt_path) {
		"use strict";
        function makeLower(match) { return match.toLowerCase(); }
        function dotToCamel(match, sub1) { return sub1.toUpperCase(); }
		var fileName = rustyToolsObjName.replace(/\.([a-z])/g, dotToCamel).
                replace(/\./g, '').replace(/^[A-Z]/g, makeLower);
		return  (opt_path || RustyTools.cfg.rustyToolsScriptPath || '') + fileName + '.js';
	},

	// Load any other one of the RustyTools...  Pass in the full object name
	// to the top level object you need (e.g. RustyTools.Fn.__test)
	//
	// Note: The script will load and complete as the DOM handles it.
	//       This does not try to take the place of ATM; it does nothing to
	//        control the time the execution of the script is started.
	load: function(rustyToolsObjName, opt_successCallback) {
		"use strict";
		var script;
		var obj = RustyTools.pathToMember(rustyToolsObjName);

		if (!obj && self.document) {
			script = self.document.createElement('script');
			script.type = "text/javascript";
			script.src = RustyTools.getUri(rustyToolsObjName);
			if (opt_successCallback) {
				if (script.readyState) {
					// IE  - use the readyState crap.
					script.onreadystatechange = function() {
						if (script.readyState === "loaded" ||
								script.readyState === "complete"){
							script.onreadystatechange = null;
							opt_successCallback();
						}
					};
				} else {
					script.onload = opt_successCallback;
				}
			}
			document.getElementsByTagName("head")[0].appendChild(script);
		}
		return script;
	},

	// Wait for the RustyTools.load
    // Ues null for callback if none is required.
	loadInOrder: function(callback, rustyToolsObjName /* moreRustyToolsObjName(s) */) {
		"use strict";
		var nextLoad = callback;
		if (arguments.length > 2) {
			var context = this;
			var nextArgs = Array.prototype.slice.call(arguments, 2);
            nextArgs.unshift(callback);
			nextLoad = function() {
                if (callback) callback();
				context.loadInOrder.apply(context, nextArgs);
			};
		}

		return this.load(rustyToolsObjName, nextLoad);
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
			}, opt_interval || this.cfg.interval);
		}

		return mustWait;
	},
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
