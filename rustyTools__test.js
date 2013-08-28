RustyTools.__test = function(t, r) {
  var RustyToolsTest = RustyTools.wrapObject(RustyTools);

  // Make a new object in RustyToolsTest;
  RustyToolsTest.cfg = {};
  // Add all r.e members from RustyTools.cfg
  RustyToolsTest.configure(RustyTools.cfg);

  // Top level RustyTools methods
  t.test([
    'RustyTools.__test\n' +
    'RustyTools.configure && RustyTools.cloneOneLevel (configure calls cloneOneLevel)',
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
    function(t, r) {r.different(RustyTools.cfg.x_test, RustyToolsTest.cfg.x_test);}
  ]);
};

