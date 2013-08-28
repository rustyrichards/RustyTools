window['RustyTools'] || (window['RustyTools'] = RustyTools = {});

RustyTools.configure({
  templateMatchKey: '<-@-/?>',
  templateAppendKey: '<-@-/>',
  templateMatchAllExpr: /<-[^-\/>]*-\/?>/g,
  multiReplaceExpr: /@(\d+)/g,
  testConfig: {name: 'test'},
  matchFail: '@1@.find(@2@)\n    ==\n@3@\n    not\n@4@',
  noMatchFail: '@1@.find(@2@)\n    ==\n@3@',
  sameFail: '@1@\n    is not\n@2@',
  differentFail: '@1@\n    is \n@2@',
  notFail: '@1@\n    is not falsy.',
});

// This can't inherit from RegExp it gives the exception:
//   TypeError: Method RegExp.prototype.exec called on incompatible receiver [object Object]
// So instead inject "find" to work like "exec", except an array is always returned.
RegExp.prototype.find = function(str) {
  return this.exec(str) || [];
};

// Inject template support into String so the normal string constructors will
// work on the test template strings.
String.prototype.templateReplace = function(key, replacement, opt_leaveKey) {
  var exp = new RegExp(RustyTools.cfg.templateMatchKey.replace(/@/, key), 'g');

  return this.replace(exp, replacement + ((opt_leaveKey) ?
      (RustyTools.cfg.templateAppendKey.replace(/@/, key)) : ''));
};

String.prototype.templateCleanup = function() {
  return this.replace(RustyTools.cfg.templateMatchAllExpr, '');
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
 * Tester functions that will write into Record.
 */
RustyTools.Testing.Record.prototype.match = function(expr, str, opt_match) {
  this.tested = true;
  if (!opt_match) opt_match = str;

  var found = expr.find(str);
  if (opt_match != found[0]) {
    this.addError(RustyTools.Str.multiReplace(RustyTools.cfg.matchFail, expr.toString(),
        RustyTools.quote(str), RustyTools.quote(found[0]), RustyTools.quote(opt_match)));
    this.failed = true;
  }
};

RustyTools.Testing.Record.prototype.noMatch = function(expr, str) {
  this.tested = true;
  var found = expr.find(str);
  if (found.length) {
    this.addError(RustyTools.Str.multiReplace(RustyTools.cfg.noMatchFail,
        expr.toString(), RustyTools.quote(str), RustyTools.quote(found[0])));
    this.failed = true;
  }
};

RustyTools.Testing.Record.prototype.same = function(a, b) {
  this.tested = true;
  var different = false;
  if (a && !(a instanceof String) && a.length && (a.length == b.length)) {
    for (var i=0; !different && i<a.length; i++) different = a[i] != b[i];
    if (!different) a = b = true;
  }
  if (a != b) {
    this.addError(RustyTools.Str.multiReplace(RustyTools.cfg.sameFail, a, b));
    this.failed = true;
  }
};

RustyTools.Testing.Record.prototype.different = function(a, b) {
  this.tested = true;

  var same = false;
  if (a && !(a instanceof String) && a.length && (a.length == b.length)) {
    same = true;
    for (var i=0; !same && i<a.length; i++) same = a[i] == b[i];
    if (!same) a = !( b = true);
  }
  if (a == b) {
    this.addError(RustyTools.Str.multiReplace(RustyTools.cfg.differentFail, a, b));
    this.failed = true;
  }
};

RustyTools.Testing.Record.prototype.not = function(a) {
  this.tested = true;
  if (a) {
    this.addError(RustyTools.Str.multiReplace(RustyTools.cfg.notFail, a));
    return false;
  }
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

RustyTools.Testing.prototype.test = function(toTest) {
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
            this.test(toTest[key]);
          }
        }
    }
  }
  return this;
};

RustyTools.Testing.prototype.isTestable = function(obj) {
  return (obj && obj.hasOwnProperty && obj.hasOwnProperty(this.cfg.name) &&
        (('function' == typeof obj[this.cfg.name]) ||
        Array.isArray(obj[this.cfg.name])));
};

RustyTools.Testing.prototype.testAllInternal_ = function(parentObj) {
  var objsToTest = [];
  var lastOttLength = 0;
  // parentObj may be testable, or maybe its children are testable.
  if (this.isTestable(parentObj)) {
    objsToTest.push(parentObj);
  }

  // Walk the tree of testable objects. Don't recures inteate;
  // JavaScript has a limited stack.
  //
  // Iteration method:
  //  Save the last end of the testable array.
  //  For each of the new testable items check one level down to see if it has testable items.
  do {
    var index = lastOttLength;
    lastOttLength = objsToTest.length;
    var toCheck = (lastOttLength) ? objsToTest : [parentObj];
    while (index < toCheck.length) {
      obj = toCheck[index];
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          var testObj = obj[key];
          if (this.isTestable(testObj)) {
            if (-1 == objsToTest.indexOf(testObj))
            objsToTest.push(testObj);
          }
        }
      }
      index++;
    }
  } while (lastOttLength < objsToTest.length);

  // All of the objects in objsToTest have been pre-verified.
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

  var trampoline = RustyTools.Fn.buildTrampoline(this);

  // Each individuual call to this.testAllInternal_ takes in a new empty "visited".
  // so in testAll(A, B, A) A would be testee twice.  (There are cases where this is wanted.  
  // It may be needed to be sure B does not alter A)  However, as it runs each test the 
  // "visited" vector is used to check for repeats.
  for (var i=0; i<toTest.length; i++) this.testAllInternal_(toTest[i]);
  return this;
};

// Test once testFn has passed.
// NOTE: use callAfterTestFn instead of chaining because testAllWhenPassed may not finish
// no the first call!
RustyTools.Testing.prototype.testAllWhenPassed = function(testFn, retryDelay, callAfterTestFn) {
  if (testFn()) {
    if ((arguments.length > 4)  || (!(arguments[3] instanceof Array))) {
      this.testAll.apply(this, Array.prototype.slice.call(arguments, 3));
    } if (arguments.length > 3) {
      // In the setTimeout bind, the remaining paramters became an array when the bind was called. 
      this.testAll.apply(this, arguments[3]);
    }

    if (callAfterTestFn) callAfterTestFn();
  } else if (retryDelay) {
    setTimeout(this.testAllWhenPassed.bind(this, testFn, retryDelay, callAfterTestFn, 
        Array.prototype.slice.call(arguments, 3)), retryDelay);
  }
};

// Test once testFn has passed
// NOTE: use callAfterTestFn instead of chaining because testAllWhenPassed may not finish
// no the first call!
RustyTools.Testing.prototype.testAllWhenAvailable = function(xpathOrJQuery, retryDelay, callAfterTestFn) {
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
      contentData += outerTemplate.templateReplace('type', reports[i]).
          templateReplace('count', items.length.toString(10));

      var content = '';
      for (var j=0; j<items.length; j++) {
        content += items[j].buildDom(template, lastDescription);
        lastDescription = items[j].description;
      }
      // Fill in the content.
      contentData = contentData.templateReplace('content', content).
          // Replace any unfilled substitutions
          templateCleanup();
    }
  }

  if (parentNode) parentNode.innerHTML = contentData;

  return contentData;
};

RustyTools.Testing.Record.prototype.buildDom = function(template, lastDescription) {
  return template.templateReplace('description',
      (lastDescription != this.description) ?
      RustyTools.Str.entitize(this.description) : '').
      templateReplace('test', RustyTools.Str.entitize(this.test)).
      templateReplace('log', RustyTools.Str.entitize(this.log, true)).
      templateReplace('error', RustyTools.Str.entitize(this.error)).
      templateReplace('exception', RustyTools.Str.entitize(this.exception));
};

