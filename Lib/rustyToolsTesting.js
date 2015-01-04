/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint    eqnull: true, curly: false, latedef: true, newcap: true, undef: true, unused: true, strict: true, browser: true, devel: true*/
/* global RustyTools, self */


'object' === typeof self.RustyTools || (RustyTools = {});

// This can't inherit from RegExp it gives the exception:
//   TypeError: Method RegExp.prototype.exec called on incompatible receiver [object Object]
// So instead inject "find" to work like "exec", except an array is always returned.
RegExp.prototype.find = function(str) {
	"use strict";
	return this.exec(str) || [];
};

// Usage create aRustyTools.Testing or call clear call test with an objectr or list of objects
// to test.  When the test is done the members "excepted", "failed", and "passed"
RustyTools.Testing = function(opt_symbols, opt_importAs) {
	"use strict";

	this.cfg = {
		name: 'test',
		matchFail: '<repl:1/>.find(<repl:2/>)\n\t==\n<repl:3/>\n\tnot\n<repl:4/>',
		matchCompleteFail: '<repl:1/>.find(<repl:2/>)\n\t[]',
		noMatchFail: '<repl:1/>.find(<repl:2/>)\n\t==\n<repl:3/>',
		sameFail: '<repl:1/>\n \tis not\n<repl:2/>',
		differentFail: '<repl:1/>\n\tis\n<repl:2/>',
		notFail: '<repl:val/>\n\t is not falsy.',
		isFail: '<repl:val/>\n\t is not truthy.',
	};
    
	this.clear(opt_symbols, opt_importAs);
};

RustyTools.Testing.flags = {
    title: "title",
    success: "success",
    information: "info",
    error: "fail",
    warning: "warn",
    exception: "exception",
};

RustyTools.Testing.Data = function() {
	"use strict";

	this.excepted = [];
	this.failed = [];
	this.passed = [];
};

RustyTools.Testing.prototype.configure = function(/* objs */) {
	"use strict";
    if (!this.cfg) this.cfg = {};
    this.cfg.addOneLevel(Array.prototype.slice.call(arguments));

	// for chaining
	return this;
};

RustyTools.Testing.prototype.clear = function(opt_symbols, opt_importAs) {
	"use strict";
	this.testPassed = true;
	this.testSuppressed = false;
	this.currentTest = null;
	this.titleString = '';

	this.data = new RustyTools.Testing.Data();

	// Note:  The smybols will not be saved by toJson
	this.symbols = new RustyTools.SymbolTable(opt_symbols, opt_importAs);

	// for chaining
	return this;
};

RustyTools.Testing.prototype.beforeTest_ = function() {
	"use strict";
	this.testPassed = true;
	this.currentTest = [RustyTools.Testing.flags.title, this.titleString || ''];

	// for chaining
	return this;
};

RustyTools.Testing.prototype.afterTest_ = function() {
	"use strict";
	var dest = (this.testPassed || this.testSuppressed) ? this.data.passed : this.data.failed;
	// Put a null between each report.
	if (dest.length) dest.push(null);

	if (this.testPassed) {
        this.data.passed = dest.concat(this.currentTest);
    } else {
        this.data.failed = dest.concat(this.currentTest);
	}
    dest.push(null);

	this.currentTest = null;

	// for chaining
	return this;
};

RustyTools.Testing.prototype.exceptedTest_ = function(testFn, e) {
	"use strict";
	// Put a null between each report.
	if (this.data.excepted.length) this.data.excepted.push(null);
    
    this.currentTest.push(RustyTools.Testing.flags.information, testFn ? testFn.toString() : '',
            RustyTools.Testing.flags.exception, e.message);

	this.data.excepted = this.data.excepted.concat(this.currentTest);
	this.currentTest = null;

	// for chaining
	return this;
};

RustyTools.Testing.prototype.test = function(tests) {
	"use strict";
	if (!tests.reduce) tests = [tests];
	tests.reduce(function(context, testFn) {
		if ('string' === typeof testFn) {
			// Here it is a title not a function.
			context.titleString = testFn;
		} else {
			context.beforeTest_();
			try {
				testFn(context);
				context.afterTest_();
			} catch (e) {
				context.exceptedTest_(testFn, e);
			}
		}

		return context;
	}, this);

	// for chaining
	return this;
}

/**
 * invertPassed - invert the "failed" flag.  This just exist for testing the
 * test cases.  (Cause a "failed", then use invertFailed so it reports as success.)
 */
RustyTools.Testing.prototype.invertPassed = function() {
	"use strict";
	this.testPassed = !this.testPassed;

	// for chaining
	return this;
};

RustyTools.Testing.prototype.suppressTest = function() {
	"use strict";
	this.testSuppressed = true;
    
    this.currentTest.push(RustyTools.Testing.flags.warning, "Test suppressed.");

	// for chaining
	return this;
};

RustyTools.Testing.prototype.message = function(message, opt_type) {
	"use strict";
    if (!opt_type) opt_type = RustyTools.Testing.flags.information;
    this.currentTest.push(opt_type, message);
}

RustyTools.Testing.prototype.assert = function(a) {
	"use strict";
    
    var output = RustyTools.Str.entitize(a.toString(), true);
    var success = true;
    if ('function' === typeof a) {
        // strip the function parts.
        output = RustyTools.Str.entitize(a.toString().replace(
            /function\s*\([^\)]*\)\s*{(?:\s*return)?\s*([\s\S]*)\s*}s*$/, '$1'),
            true);
        success = a();
    } else if ('string' === typeof a) {
        success = eval(a);
    } else {
        success = a;
    }
    
    this.currentTest.push(success ? RustyTools.Testing.flags.success : RustyTools.Testing.flags.error, output);
	if (!success) this.testPassed = success;

    // for chaining
	return this;
};



RustyTools.Testing.prototype.testInternal_ = function(checkTopLevel, obj) {
	"use strict";
	if (checkTopLevel && obj[this.cfg.name]) {
		this.test(obj[this.cfg.name]);
		this.testInternal_(false, obj);
	} else {
		RustyTools.forEachOwnProperty(obj, function(key, property, obj) {
			if (property && property[this.cfg.name]) {
				this.test(property[this.cfg.name]);
				this.testInternal_(false, property);
			}
		}, this);
	}

	// for chaining
	return this;
};

// testAll will crawl down all testable children of its arguments or
// self if it has no arguments.
//
// NOTE: This recursion will only follow testable objects.
//        x.test, -> x.y.test, x.y.z.test works.
//        x.test == undefined -> x.y.text does not work.
RustyTools.Testing.prototype.testAll = function() {
	"use strict";
	var toTest = (arguments.length) ? arguments : [self];

	for (var i=0; i<toTest.length; i++) this.testInternal_.call(this, true, toTest[i]);

	// for chaining
	return this;
};

// Test once testFn has passed.
// NOTE: use callAfterTestFn instead of chaining because testAllWhenPassed may not finish
// on the first call!
RustyTools.Testing.prototype.testAllWhenPassed = function(fnTest, retryDelay, fnCallAfterTest /* testAll args */) {
	"use strict";
	var context = this;
	var params = [];
	if ((arguments.length > 4)  || (!(arguments[3] instanceof Array))) {
		params = Array.prototype.slice.call(arguments, 3);
	} if (arguments.length > 3) {
		params = [arguments[3]];
	}

	RustyTools.waitForCondition(fnTest, function() {
		context.testAll.apply(context, params);
		if (fnCallAfterTest) fnCallAfterTest();
	}, retryDelay);
};

// Test once testFn has passed
// NOTE: use fnCallAfterTest instead of chaining because testAllWhenPassed may not finish
// no the first call!
RustyTools.Testing.prototype.testAllWhenAvailable = function(xpathOrJQuery /* retryDelay, fnCallAfterTest */) {
	"use strict";
	var params = Array.prototype.slice.call(arguments, 1);
	params.unshift(function(){return document.isEnabled(xpathOrJQuery);});

	this.testAllWhenPassed.apply(this, params);
};

RustyTools.Testing.prototype.toJson = function() {
	"use strict";
	return JSON.stringify(this.data);
};

RustyTools.Testing.prototype.buildDom = function(template, opt_parentNode) {
	"use strict";

	// Use propertyWalk to make an array of objects for the data items.
	var reports = RustyTools.Fn.propertyWalk(this.data, function(result, key, value) {
		if (!result) result = [];
        var count = value.length ? 1 : 0;   // No null separators could be 0 or 1 item.
        var pos = value.length;
        while (pos--) if (null === value[pos]) count++;
		return result.concat({resultType: key, resultCount: count, results: value});
	}, function(key, value) { return RustyTools.isArrayLike(value) && value.length;});

	// Wrap the array of objects in an object for the multireplace.
	var contentData = RustyTools.Str.mulitReplaceCleanup(RustyTools.Str.multiReplace(
		template, {allResults: reports}));

	if (opt_parentNode) opt_parentNode.innerHTML = contentData;

	return contentData;
};
