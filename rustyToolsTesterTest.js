RustyTools.__test = function(t, r) {
  var RustyToolsTest = RustyTools.wrapObject(RustyTools);

  // Make a new object in RustyToolsTest;
  RustyToolsTest.cfg = {};
  // Add all r.e members from RustyTools.cfg
  RustyToolsTest.configure(RustyTools.cfg);

  // r.p level RustyTools methods
  t.test([
    'RustyTools.__test\n' +
    'RustyTools.configure && addElements (configure calls addElements)',
    function(t, r) {
        RustyToolsTest.configure({x_test: "string",
        y_test: ['a', 'b', 3.3, false]});
        r.same(RustyToolsTest.cfg.x_test, "string");
    },
    function(t, r) {r.same(RustyToolsTest.cfg.y_test[0], 'a');},
    function(t, r) {r.same(RustyToolsTest.cfg.y_test[3], false);},
    function(t, r) {r.same(RustyToolsTest.cfg.templateMatchKey, '<-@-/?>');},
    function(t, r) {
      RustyToolsTest.configure({y_test: ['c', 'd']});
      // y_test: should now be ['a', 'b', 3.3, false, 'c, 'd]
      return r.same(RustyToolsTest.cfg.y_test[4], 'c');
    },
    function(t, r) {r.same(RustyToolsTest.cfg.y_test[2], 3.3);},

    'RustyTools.wrapObject',
    function(t, r) {
      // var RustyToolsTest = RustyTools.wrapObject(RustyTools);
      // r.e previous r.st altered RustyToolsTest.  Make sure RustyToolsTest
      // is modified, but RustyTools is not.
      r.same(RustyTools.cfg.templateMatchKey, '<-@-/?>');
    },
    function(t, r) {r.same(RustyToolsTest.cfg.templateMatchKey, '<-@-/?>');},
    function(t, r) {r.not(RustyTools.cfg.x_test);},
    function(t, r) {r.different(RustyTools.cfg.x_test, RustyToolsTest.cfg.x_test);},

    'RustyTools.entitize',
    function(t,r) {
      var entitized = RustyTools.entitize('<a> & \r\n');
      r.different(entitized,'<a> & \r\n') &&
          r.same(entitized, '&lt;a&gt;&nbsp;&amp;&nbsp;<br/>');
    },
    function(t,r) {
      var entitized = RustyTools.entitize('<a> & \r\n', true);
      r.same(entitized, '&lt;a&gt;&nbsp;&amp;&nbsp;\r\n');
    },

    'RustyTools.quote',
    function(t,r) {
      var quoted = RustyTools.quote('"can\'t"', "'");
      r.same(quoted, "'\"can\\\'t\"'");
    },
    'RustyTools.multiReplace',
    function(t, r) {
      var source = 'Param1: @1@, Param12: @12@, Param2: @2@, Param3: @3@, ' +
          'Param4: @4@, Param5: @5@, Param6: @6@, Param7: @7@, Param8: @8@, '+
          'Param9: @9@, Param11: @11@, all except 10: ' +
          '@1@,@2@,@3@,@4@,@5@,@6@,@7@,@8@,@9@,@11@,@12@';
      var replaced = RustyTools.multiReplace(source, 'a', 'b', 'c', 'd', 'e',
          'f', 'g', 'h', 'i', 'j', 'k', 'l');
      var shouldbe = 'Param1: a, Param12: l, Param2: b, Param3: c, ' +
          'Param4: d, Param5: e, Param6: f, Param7: g, Param8: h, ' +
          'Param9: i, Param11: k, all except 10: ' +
          'a,b,c,d,e,f,g,h,i,k,l';
      r.different(source, replaced) &&
          r.same(replaced, shouldbe);
    },
    function(t,r) {
      var quoted = RustyTools.quote('"can\'t"', "'");
      r.same(quoted, "'\"can\\\'t\"'");
    }
  ]);
};

RustyTools.Tester.__test = function(t, r) {
  var expr = new RegExp('[1-9][0-9]*', 'g');
  // r.p level RustyTools methods
  t.test([
    'RustyTools.Tester.__test\n' +
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
  var testArray = {__test: [
    'Array of test functions.',
    function(t, r) {r.same(1-1, 0);},
    function(t, r) {r.same(1+0, 1);},
    function(t, r) {r.same(1+1, 2);}
  ]};

  var tester = new RustyTools.Tester({name: "__test"});
  tester.testAll();

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

  tester.testAllWhenAvailable('//body//span', 1000, afterReady, testArray);

  var el = document.createElement('span');
  document.body.appendChild(el);

}
