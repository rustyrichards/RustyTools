RustyTools.load('RustyTools.Str', 'RustyTools.Tree');

RustyTools.configure({
  matchFail: '<#regex/>.find(<#source/>)\n\t==\n<#match/>\n\tnot\n<#shouldMatch/>',
  noMatchFail: '<#regex/>.find(<#source/>)\n\t==\n<#match/>',
  sameFail: '<#1/>\n \tis not\n<#2/>',
  differentFail: '<#1/>\n\tis\n<#2/>',
  notFail: '<#val/>\n\t is not falsy.',
});

// This can't inherit from RegExp it gives the exception:
//   TypeError: Method RegExp.prototype.exec called on incompatible receiver [object Object]
// So instead inject "find" to work like "exec", except an array is always returned.
RegExp.prototype.find = function(str) {
	"use strict";
  return this.exec(str) || [];
};

RustyTools.Testing = function(config) {
	"use strict";
  // The default config test all named "test"
  if (!RustyTools.cfg.testing) RustyTools.cfg.testing = {name: "test"};
  this.cfg = RustyTools.cloneOneLevel(RustyTools.cfg.testing, config);
};

// RustyTools.Testing.Record  is not a singleton.  These are created for each test.
RustyTools.Testing.Record = function(description, test) {
	"use strict";
  this.description = description;
  this.test = test;
};

RustyTools.Testing.Record.prototype.addError = function(str /* objects */) {
	"use strict";
  if (this.error) this.error += '\n';
  this.error = RustyTools.Str.mulitReplaceCleanup(RustyTools.Str.multiReplace(
      str, Array.prototype.slice.call(arguments, 1), true /*don't entitize here*/));
};

RustyTools.Testing.Record.prototype.addException = function(e) {
	"use strict";
  if (this.exception) this.exception += '\n' + e.toString();
  else this.exception = e.toString();
};

RustyTools.Testing.Record.prototype.logObjects = function() {
	"use strict";
  for (var i=0; i<arguments.length; i++) {
    var arg = arguments[i];
    if (!this.log) {
      this.log = '';
    } else {
      this.log += '\n';
    }

    if ('string' === typeof arg) {
      this.log += arg;
    } else {
      this.log += JSON.stringify(arg);
    }
  }
};

/**
 * invertFailed - invert the "failed" flag.  This just exist for testing the
 * test cases.  (Cause a "failed", then use invertFailed so it reports as success.)
 */
RustyTools.Testing.Record.prototype.invertFailed = function() {
	"use strict";
  this.failed = !this.failed;

  return this;  // For chaining the tests.
};

/**
 * Tester functions that will write into Record.
 */
RustyTools.Testing.Record.prototype.match = function(expr, str, opt_match) {
	"use strict";
  this.tested = true;
  var found = expr.find(str);
  // If opt_match is supplied make sure is is the same as the full find result.
  // If opt-match is not supplied just make sure that something was found.
  if ((opt_match) ? (opt_match !== found[0]) : !found.length) {
    this.addError(RustyTools.cfg.matchFail, {regex: expr.toString(),
        source: str, match: found[0],shouldMatch:opt_match});
    this.failed = true;
  }

  return this;  // For chaining the tests.
};

RustyTools.Testing.Record.prototype.exactMatch = function(expr, str) {
	"use strict";
  return this.match(expr, str, str);
  // Because match chains exactMatch chains
};

RustyTools.Testing.Record.prototype.noMatch = function(expr, str) {
	"use strict";
  this.tested = true;
  var found = expr.find(str);
  if (found.length) {
    this.addError(RustyTools.cfg.noMatchFail,  {regex: expr.toString(),
        source: str, match: found[0]});
    this.failed = true;
  }

  return this;  // For chaining the tests.
};

RustyTools.Testing.Record.prototype.same = function(a, b) {
	"use strict";
  this.tested = true;
  var different = false;
  if (a && ('string' !== typeof a) && a.length && (a.length === b.length)) {
    // a[i] != b[i]- want the type coercion here
    for (var i=0; !different && i<a.length; i++) different = a[i] != b[i];
    if (!different) a = b = true;
  }
  // a != b - want the type coercion here
  if (a != b) {
    this.addError(RustyTools.cfg.sameFail, {1: a, 2: b});
    this.failed = true;
  }

  return this;  // For chaining the tests.
};

RustyTools.Testing.Record.prototype.different = function(a, b) {
	"use strict";
  this.tested = true;

  var same = false;
  if (a && ('string' !== typeof a) && a.length && (a.length === b.length)) {
    same = true;
    // a[i] == b[i]- want the type coercion here
    for (var i=0; !same && i<a.length; i++) same = a[i] == b[i];
    if (!same) a = !( b = true);
  }
  // a == b - want the type coercion here
  if (a == b) {
    this.addError(RustyTools.cfg.differentFail, {1: a, 2: b}, true);
    this.failed = true;
  }

  return this;  // For chaining the tests.
};

RustyTools.Testing.Record.prototype.not = function(a) {
	"use strict";
  this.tested = true;
  if (a) {
    this.addError(RustyTools.cfg.notFail, {val: a});
    this.failed = true;
  }

  return this;  // For chaining the tests.
};


// Only one data object for each RustyTools.Testing
RustyTools.Testing.prototype.data = {
  excepted : [],
  failed: [],
  passed: [],

  reset: function() {
    "use strict";
    this.excepted = [];
    this.failed = [];
    this.passed = [];
  }
};

RustyTools.Testing.prototype.reset =function() {
	"use strict";
  this.data.reset();
};

RustyTools.Testing.prototype.recordTestResults = function(testItem) {
	"use strict";
  if (testItem[this.cfg.name] &&
      'function' === typeof testItem[this.cfg.name]) {
    testItem = testItem[this.cfg.name];
  }
  var record = new RustyTools.Testing.Record(this.currentDescription,
      testItem.toString());
  try {
    testItem(this, record);
    if (record.tested) {
      delete record.tested;
      if (!record.failed) {
        this.data.passed.push(record);
      } else {
        delete record.failed;
        this.data.failed.push(record);
      }
    }
  } catch (e) {
    record.addException(e);
    this.data.excepted.push(record);
  }
  return this;
};

RustyTools.Testing.prototype.test = function(toTest, opt_recursiveCall) {
	"use strict";
  // Backup "self" so it can be stubbed for testing
  var oldSelf;
  if (opt_recursiveCall) {
    oldSelf = self;
    self = RustyTools.wrapObject(self);
  }

  if (toTest) {
    var type = typeof toTest;
    switch (type) {
      case 'string':
        // If it is a string just set the description.
        this.currentDescription = toTest;
        break;
      case 'function':
        // One function - test it.
        this.recordTestResults(toTest);
        break;
      case 'object':
        if (toTest[this.cfg.name] &&
            'function' === typeof toTest[this.cfg.name]) {
          // Use the test method!
          this.testOneFunction(toTest[this.cfg.name]);
        } else {
          // A hash or an array; either way test all its members.
          for (var key in toTest) {
            this.test(toTest[key], true);
          }
        }
    }
  }

  if (opt_recursiveCall) {
    // Restore the old "self"
    self = oldSelf;
  }

  return this;
};

RustyTools.Testing.prototype.isTestable = function(obj) {
	"use strict";
  return (obj && obj.hasOwnProperty && obj.hasOwnProperty(this.cfg.name) &&
        (('function' === typeof obj[this.cfg.name]) ||
        Array.isArray(obj[this.cfg.name])));
};

RustyTools.Testing.prototype.testAllInternal_ = function(parentObj) {
	"use strict";
  var objsToTest = RustyTools.Tree.findMatchingDescendants(parentObj, this.isTestable.bind(this),
      function(obj) {
        var childObjects = [];
        for (var i in obj) {
          if (obj.hasOwnProperty(i)) childObjects.push(obj[i]);
        }
        return childObjects;
      });

  for (var index=0; index<objsToTest.length; index++) {
    this.test(objsToTest[index][this.cfg.name]);
  }

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

  // Each individuual call to this.testAllInternal_ takes in a new empty "visited".
  // so in testAll(A, B, A) A would be testee twice.  (There are cases where this is wanted.
  // It may be needed to be sure B does not alter A)  However, as it runs each test the
  // "visited" vector is used to check for repeats.
  for (var i=0; i<toTest.length; i++) this.testAllInternal_(toTest[i]);
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
  params.unshift(function(){return RustyTools.isEnabled(xpathOrJQuery);});

  this.testAllWhenPassed.apply(this, params);
};

RustyTools.Testing.prototype.toJson = function() {
	"use strict";
  return JSON.stringify(this.data);
};

RustyTools.Testing.prototype.buildDom = function(template, parentNode) {
  "use strict";

  // Use propertyWalk to make an array of objects for the data items.
  var reports = RustyTools.Fn.propertyWalk(this.data, function(result, key, value) {
    if (!result) result = [];
    return result.concat({resultType: key, resultCount: value.length, results: value});
  }, function(key, value) { return RustyTools.isArrayLike(value) && value.length;});

  // Wrap the array of objects in an object for the multireplace.
  var contentData = RustyTools.Str.mulitReplaceCleanup(RustyTools.Str.multiReplace(
    template, {allResults: reports}));

  if (parentNode) parentNode.innerHTML = contentData;

  return contentData;
};
