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

RustyTools.multiReplace = function(str) {
  replaceArgs = arguments;
  for (var i=1; i<arguments.length; i++) {
    str = str.replace('@' + i + '@', arguments[i].toString());
  }
  return str;
};
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

RustyTools.Tester = function(opt_config) {
  this.data = new RustyTools.Tester.Data();

  this.config = opt_config || RustyTools.cfg.testConfig;
};


RustyTools.Tester.Data = function() {
  this.reset();
};


RustyTools.Tester.Data.prototype.reset = function() {
  this.excepted = [];
  this.failed = [];
  this.passed = [];
};

RustyTools.Tester.Record = function(description, test) {
  this.description = description;
  this.test = test;
};

RustyTools.Tester.Record.prototype.setError = function(error) {
  this.error = error;
};

RustyTools.Tester.Record.prototype.setException = function(e) {
  this.exception = e.toString();
};

RustyTools.Tester.Record.prototype.logObjects = function() {
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
 * @return {boolean} True for success
 */
RustyTools.Tester.Record.prototype.match = function(expr, str, opt_match) {
  if (!opt_match) opt_match = str;

  var found = expr.find(str);
  if (opt_match != found[0]) {
    this.setError(RustyTools.multiReplace(RustyTools.cfg.matchFail, expr.toString(),
        RustyTools.quote(str), RustyTools.quote(found[0]), RustyTools.quote(opt_match)));
    return false;
  }
  return true;
};

RustyTools.Tester.Record.prototype.noMatch = function(expr, str) {
  var found = expr.find(str);
  if (found.length) {
    this.setError(RustyTools.multiReplace(RustyTools.cfg.noMatchFail,
        expr.toString(), RustyTools.quote(str), RustyTools.quote(found[0])));
    return false;
  }
  return true;
};

RustyTools.Tester.Record.prototype.same = function(a, b) {
  if (a != b) {
    this.setError(RustyTools.multiReplace(RustyTools.cfg.sameFail, a, b));
    return false;
  }
  return true;
};

RustyTools.Tester.Record.prototype.different = function(a, b) {
  if (a == b) {
    this.setError(RustyTools.multiReplace(RustyTools.cfg.differentFail, a, b));
    return false;
  }
  return true;
};

RustyTools.Tester.Record.prototype.not = function(a) {
  if (a) {
    this.setError(RustyTools.multiReplace(RustyTools.cfg.notFail, a));
    return false;
  }
  return true;
};


RustyTools.Tester.Record.prototype.buildDom = function(template, lastDescription) {
  return template.templateReplace('description',
      (lastDescription != this.description) ?
      RustyTools.entitize(this.description) : '').
      templateReplace('test', RustyTools.entitize(this.test)).
      templateReplace('log', RustyTools.entitize(this.log, true)).
      templateReplace('error', RustyTools.entitize(this.error)).
      templateReplace('exception', RustyTools.entitize(this.exception));
};

RustyTools.Tester.prototype.reset = function() {
  this.data.reset();
};

RustyTools.Tester.prototype.testOneFunction = function(testFunction) {
  // Run the testFunction - record any exception!
  try {
    testFunction(this);
  } catch (e) {
    // if test throws record the throw!
    var record = new RustyTools.Tester.Record(this.currentDescription,
        testFunction.toString());
    record.setException(e);
    this.data.excepted.push(record);
  }
};

RustyTools.Tester.prototype.recordTestResults = function(testItem) {
  if (testItem[this.config.name] &&
      'function' === typeof testItem[this.config.name]) {
    this.testOneFunction(testItem[this.config.name]);
  } else {
    var record = new RustyTools.Tester.Record(this.currentDescription,
        testItem.toString());
  	try {
  	  if (testItem(record)) {
    		this.data.passed.push(record);
  	  } else {
    		this.data.failed.push(record);
  	  }
  	} catch (e) {
      record.setException(e);
  	  this.data.excepted.push(record);
  	}
  }
  return this;
};

RustyTools.Tester.prototype.test = function(toTest) {
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
        if (toTest[this.config.name] &&
            'function' === typeof toTest[this.config.name]) {
          // Use the test method!
          this.testOneFunction(toTest[this.config.name]);
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

RustyTools.Tester.prototype.testAll = function(opt_root) {
  var root = opt_root || window;

  for (var key in root) {
    // To test this should be a constructor or an object.
    var obj = root[key];
    var type = typeof obj;
    if (obj && ('function' == type || 'object' == type) &&
        obj.hasOwnProperty(this.config.name)) {
      this.testOneFunction(obj[this.config.name]);
    }
  }

  return this;
};

RustyTools.Tester.prototype.toJson = function() {
  return JSON.stringify(this.data);
};

RustyTools.Tester.prototype.buildDom = function(outerTemplate, template, parentNode) {
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
      contentData = contentData.templateReplace('content', content);

  	  // Replace any unfilled substitutions
  	  contentData = contentData.templateCleanup();
    }
  }

  if (parentNode) parentNode.innerHTML = contentData;

  return contentData;
};

