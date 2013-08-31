RustyTools.Testing.__test = function(t, r) {
  var expr = new RegExp('[1-9][0-9]*', 'g');
  // .Tester level RustyTools methods
  t.test([
    'RustyTools.Testing.__test\n' +
    'RegExp.prototype.find',
    function(t, r) {
      var result = expr.find('abc');
      result && r.same(result.length, 0);
    },
    function(t, r) {
      var result = expr.find('123');
      result && r.same(result.length, 1);
    },

    'Failure tests.  Make sure each kind of failure reports correctly\n' +
    'RustyTools.Testing.Record.match failure',
    function(t, r) {
      // Fail match to report the error.
      r.match(/^[\s\S]*$/, 'abc', 'bc');
    },
    'RustyTools.Testing.Record.noMatch failure',
    function(t, r) {
      // Fail noMatch to report the error.
      r.noMatch(/[a-z]+/i, 'abc');
    },
    'RustyTools.Testing.Record.same failure',
    function(t, r) {
      // Fail same to report the error.
      r.same('abc', 'def');
    },
    'RustyTools.Testing.Record.different failure',
    function(t, r) {
      // Fail different to report the error.
      r.different('abc', 'abc');
    },
    'RustyTools.Testing.Record.not failure',
    function(t, r) {
      // Fail not to report the error.
      r.not(true);
    }
  ]);
};

function doTests() {
  var tester = new RustyTools.Testing({name: "__test"});
  tester.testAll();

  var testArray = {__test: [
    'Array of test functions.',
    function(t, r) {r.same(1-1, 0);},
    function(t, r) {r.same(1+0, 1);},
    function(t, r) {r.same(1+1, 2);}
  ]};

  var afterReady = tester.buildDom.bind(tester, 
          '<div class="testFrame <#type/>"><h1><#type/> - <#count/></h1><#content/></div>',
          '<div class="description"><#description/></div>'+
          '<div class="test"><#test/>'+
            '<div class="log"><#log/></div>'+
            '<div class="error"><#error/></div>'+
            '<div class="exception"><#exception/></div>'+
          '</div>',
          document.getElementById('report')
  );

  // Force testAllWhenAvailable to wait for the dynamically created span. (below)
  tester.testAllWhenAvailable('#placeholderSpan', 1000, afterReady, testArray);

  var el = document.createElement('span');
  el.id = 'placeholderSpan'
  document.body.appendChild(el);

};

function hasNeededTestObjects() {
  return RustyTools && RustyTools.Fn && RustyTools.Str && RustyTools.Testing && RustyTools.Tree &&
      RustyTools.__test && RustyTools.Fn.__test && RustyTools.Str.__test && RustyTools.Testing.__test;
}

RustyTools.waitForCondition(hasNeededTestObjects, doTests);
