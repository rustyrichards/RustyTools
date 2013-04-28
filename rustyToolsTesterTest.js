RustyTools.__test = function(tester) {
  var RustyToolsTest = RustyTools.wrapObject(RustyTools);

  // Make a new object in RustyToolsTest;
  RustyToolsTest.cfg = {};
  // Add all the members from RustyTools.cfg
  RustyToolsTest.configure(RustyTools.cfg);

  // Top level RustyTools methods
  tester.test([
    'RustyTools.__test',
    'RustyTools.configure && addElements (configure calls addElements)',
    function(t) {
        RustyToolsTest.configure({x_test: "string",
        y_test: ['a', 'b', 3.3, false]});
        return t.same(RustyToolsTest.cfg.x_test, "string");
    },
    function(t) {return t.same(RustyToolsTest.cfg.y_test[0], 'a');},
    function(t) {return t.same(RustyToolsTest.cfg.y_test[3], false);},
    function(t) {return t.same(RustyToolsTest.cfg.templateMatchKey, '<-@-/?>');},
    function(t) {
      RustyToolsTest.configure({y_test: ['c', 'd']});
      return t.same(RustyToolsTest.cfg.y_test[0], 'c');
    },
    function(t) {return t.same(RustyToolsTest.cfg.y_test[2], 3.3);},

    'RustyTools.wrapObject',
    function(t) {
      // var RustyToolsTest = RustyTools.wrapObject(RustyTools);
      // The previous test altered RustyToolsTest.  Make sure RustyToolsTest
      // is modified, but RustyTools is not.
      return t.same(RustyTools.cfg.templateMatchKey, '<-@-/?>');
    },
    function(t) {return t.same(RustyToolsTest.cfg.templateMatchKey, '<-@-/?>');},
    function(t) {return t.not(RustyTools.cfg.x_test);},
    function(t) {return t.different(RustyTools.cfg.x_test, RustyToolsTest.cfg.x_test);},

    'RustyTools.entitize',
    function(t){
      var entitized = RustyTools.entitize('<a> & \r\n');
      return t.different(entitized,'<a> & \r\n') &&
          t.same(entitized, '&lt;a&gt;&nbsp;&amp;&nbsp;<br/>');
    },
    function(t){
      var entitized = RustyTools.entitize('<a> & \r\n', true);
      return t.same(entitized, '&lt;a&gt;&nbsp;&amp;&nbsp;\r\n');
    },

    'RustyTools.quote',
    function(t){
      var quoted = RustyTools.quote('"can\'t"', "'");
      return t.same(quoted, "'\"can\\\'t\"'");
    },
    'RustyTools.multiReplace',
    function(t) {
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
      return t.different(source, replaced) &&
          t.same(replaced, shouldbe);
    },
    function(t){
      var quoted = RustyTools.quote('"can\'t"', "'");
      return t.same(quoted, "'\"can\\\'t\"'");
    }
  ]);
};

RustyTools.Tester.__test = function(tester) {
  var expr = new RegExp('[1-9][0-9]*', 'g');
  // Top level RustyTools methods
  tester.test([
    'RustyTools.Tester.__test',
    'RegExp.prototype.find',
    function(t) {
      var result = expr.find('abc');
      return result && t.same(result.length, 0);
    },
    function(t) {
      var result = expr.find('123');
      return result && t.same(result.length, 1);
    },

    'String.prototype.templateReplace',
    function(t) {
      var result = '<div class="<-class-/>"></div>'.templateReplace(
          'class', 'test-class');
      return t.different('<div class="<-class-/>"></div>', result) &&
          t.same('<div class="test-class"></div>', result)
    },
    function(t) {
      var result = '<div><-content-/></div>'.templateReplace(
          'content', 'content 1<br/>', true);
      result = result.templateReplace(
          'content', 'content 2<br/>', true);
      result = result.templateCleanup();
      return t.different('<div class="<-class-/>"></div>', result) &&
          t.same('<div>content 1<br/>content 2<br/></div>', result)
    }
  ]);
};

(new RustyTools.Tester({name: "__test"})).testAll().
    buildDom(
        '<div class="testFrame <-type-/>"><h1><-type-/> - <-count-/></h1><-content-/></div>',
        '<div class="description"><-description-/></div>'+
        '<div class="test"><-test-/>'+
          '<div class="log"><-log-/></div>'+
          '<div class="error"><-error-/></div>'+
          '<div class="exception"><-exception-/></div>'+
        '</div>',
        document.getElementById('report')
);
