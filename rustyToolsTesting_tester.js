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

    'String.prototype.templateReplace & String.prototype.templateCleanup',
    function(t, r) {
      var result = '<div class="<-class-/>"></div>'.templateReplace(
          'class', 'test-class');
      r.different('<div class="<-class-/>"></div>', result) &&
          r.same('<div class="test-class"></div>', result)
    },
    function(t, r) {
      var result = '<div><-content-/></div>'.templateReplace(
          'content', 'content 1<br/>', r.ue);
      result = result.templateReplace(
          'content', 'content 2<br/>', r.ue);
      result = result.templateCleanup();
      r.different('<div class="<-class-/>"></div>', result) &&
          r.same('<div>content 1<br/>content 2<br/></div>', result)
    }
  ]);
};

{
  var tester = new RustyTools.Testing({name: "__test"});
  tester.testAll();

  var testArray = {__test: [
    'Array of test functions.',
    function(t, r) {r.same(1-1, 0);},
    function(t, r) {r.same(1+0, 1);},
    function(t, r) {r.same(1+1, 2);}
  ]};

  var afterReady = tester.buildDom.bind(tester, 
          '<div class="testFrame <-type-/>"><h1><-type-/> - <-count-/></h1><-content-/></div>',
          '<div class="description"><-description-/></div>'+
          '<div class="test"><-test-/>'+
            '<div class="log"><-log-/></div>'+
            '<div class="error"><-error-/></div>'+
            '<div class="exception"><-exception-/></div>'+
          '</div>',
          document.getElementById('report')
  );

  // Force testAllWhenAvailable to wait for the dynamically created span. (below)
  tester.testAllWhenAvailable('#placeholderSpan', 1000, afterReady, testArray);

  var el = document.createElement('span');
  el.id = 'placeholderSpan'
  document.body.appendChild(el);

}
