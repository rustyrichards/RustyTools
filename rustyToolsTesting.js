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
  return this.exec(str) || [];
};

RustyTools.Testing = function(config) {
  // The default config test all named "test"
  if (!RustyTools.cfg.testing) RustyTools.cfg.testing = {name: "test"};
  this.cfg = RustyTools.cloneOneLevel(RustyTools.cfg.testing, config);
};

// RustyTools.Testing.Record  is not a singleton.  These are created for each test.
RustyTools.Testing.Record = function(description, test) {
  this.description = description;
  this.test = test;
};

RustyTools.Testing.Record.prototype.addError = function(error) {
  if (this.error) this.error += '\n' + error;
  else this.error = error;
};

RustyTools.Testing.Record.prototype.addException = function(e) {
  if (this.exception) this.exception += '\n' + e.toString();
  else this.exception = e.toString();
};

RustyTools.Testing.Record.prototype.logObjects = function() {
  for (var i=0; i<arguments.length; i++) {
    var arg = arguments[i];
    if (!this.log) {
      this.log = '';
    } else {
      this.log += '\n';
    }

    if ('string' == typeof arg) {
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
  this.failed = !this.failed;

  return this;  // For chaining the tests.
};

/**
 * Tester functions that will write into Record.
 */
RustyTools.Testing.Record.prototype.match = function(expr, str, opt_match) {
  this.tested = true;
  var found = expr.find(str);
  // If opt_match is supplied make sure is is the same as the full find result.
  // If opt-match is not supplied just make sure that something was found.
  if ((opt_match) ? (opt_match != found[0]) : !found.length) {
    this.addError(RustyTools.Str.multiReplace(RustyTools.cfg.matchFail, {regex: expr.toString(),
        source: RustyTools.Str.quote(str), match: RustyTools.Str.quote(found[0]), 
        shouldMatch: RustyTools.Str.quote(opt_match)}));
    this.failed = true;
  }

  return this;  // For chaining the tests.
};

RustyTools.Testing.Record.prototype.exactMatch = function(expr, str) {
  return this.match(expr, str, str);
  // Because match chains exactMatch chains
};

RustyTools.Testing.Record.prototype.noMatch = function(expr, str) {
  this.tested = true;
  var found = expr.find(str);
  if (found.length) {
    this.addError(RustyTools.Str.multiReplace(RustyTools.cfg.noMatchFail,
        {regex: expr.toString(), source: RustyTools.Str.quote(str), 
          match: RustyTools.Str.quote(found[0])}));
    this.failed = true;
  }

  return this;  // For chaining the tests.
};

RustyTools.Testing.Record.prototype.same = function(a, b) {
  this.tested = true;
  var different = false;
  if (a && ('string' != typeof a) && a.length && (a.length == b.length)) {
    for (var i=0; !different && i<a.length; i++) different = a[i] != b[i];
    if (!different) a = b = true;
  }
  if (a != b) {
    this.addError(RustyTools.Str.multiReplace(RustyTools.cfg.sameFail, {1: a, 2: b}));
    this.failed = true;
  }

  return this;  // For chaining the tests.
};
  
RustyTools.Testing.Record.prototype.different = function(a, b) {
  this.tested = true;

  var same = false;
  if (a && ('string' != typeof a) && a.length && (a.length == b.length)) {
    same = true;
    for (var i=0; !same && i<a.length; i++) same = a[i] == b[i];
    if (!same) a = !( b = true);
  }
  if (a == b) {
    this.addError(RustyTools.Str.multiReplace(RustyTools.cfg.differentFail, {1: a, 2: b}));
    this.failed = true;
  }

  return this;  // For chaining the tests.
};

RustyTools.Testing.Record.prototype.not = function(a) {
  this.tested = true;
  if (a) {
    this.addError(RustyTools.Str.multiReplace(RustyTools.cfg.notFail, {val: a}));
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
    this.excepted = [];
    this.failed = [];
    this.passed = [];
  }
};

RustyTools.Testing.prototype.reset =function() {
  this.data.reset();
};

RustyTools.Testing.prototype.recordTestResults = function(testItem) {
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
  // Backup "self" so it can be stubbed for testing
  if (opt_recursiveCall) {
    var oldSelf = self;
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
  return (obj && obj.hasOwnProperty && obj.hasOwnProperty(this.cfg.name) &&
        (('function' == typeof obj[this.cfg.name]) ||
        Array.isArray(obj[this.cfg.name])));
};

RustyTools.Testing.prototype.testAllInternal_ = function(parentObj) {
  var objsToTest = RustyTools.Tree.findMatchingDescendants(parentObj, this.isTestable.bind(this),
      function(obj) {
        var childObjects = [];
        for (var i in obj) {
          if (obj.hasOwnProperty(i)) childObjects.push(obj[i]);
        }
        return childObjects;
      });

  for (index=0; index<objsToTest.length; index++) {
    this.test(objsToTest[index][this.cfg.name]);
  }

  return this;
};

// testAll will crawl down all testable children of its arguments or
// window if it has no arguments.
//
// NOTE: This recursion will only follow testable objects.
//        x.test, -> x.y.test, x.y.z.test works.
//        x.test == undefined -> x.y.text does not work.
RustyTools.Testing.prototype.testAll = function() {
  var toTest = (arguments.length) ? arguments : [window];

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
RustyTools.Testing.prototype.testAllWhenAvailable = function(xpathOrJQuery, retryDelay, fnCallAfterTest) {
  var params = Array.prototype.slice.call(arguments, 1);
  params.unshift(function(){return RustyTools.isEnabled(xpathOrJQuery);});

  this.testAllWhenPassed.apply(this, params);
};

RustyTools.Testing.prototype.toJson = function() {
  return JSON.stringify(this.data);
};

RustyTools.Testing.prototype.buildDom = function(outerTemplate, template, parentNode) {
  var contentData = '';

  var reports = ['excepted', 'failed', 'passed'];
  for (var i=0; i<reports.length; i++) {
    var lastDescription = '';

    var items = this.data[reports[i]];
    if (items.length) {
      var contentStr = '';
      for (var j=0; j<items.length; j++) {
        contentStr += items[j].buildDom(template, lastDescription);
        lastDescription = items[j].description;
      }

      contetnStr = RustyTools.Str.multiReplace(template, items);
      // Fill in the content.
      // Replace any unfilled substitutions
      contentData += RustyTools.Str.mulitReplaceCleanup(RustyTools.Str.multiReplace(
          outerTemplate, {type: reports[i], count: items.length.toString(10), content: contentStr}));
    }
  }

  if (parentNode) parentNode.innerHTML = contentData;

  return contentData;
};

RustyTools.Testing.Record.prototype.buildDom = function(template, lastDescription) {
  return RustyTools.Str.multiReplace(template, {description:
      ((lastDescription != this.description) ?
      RustyTools.Str.entitize(this.description, true) : ''),
      test: RustyTools.Str.entitize(this.test, true),
      log: RustyTools.Str.entitize(this.log, true),
      error: RustyTools.Str.entitize(this.error, true),
      exception: RustyTools.Str.entitize(this.exception, true)
  });
};

