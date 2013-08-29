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
    function(t, r) {r.different(RustyTools.cfg.x_test, RustyToolsTest.cfg.x_test);},

    'RustyTools.getUri,  RustyTools.load && RustyTools.waitForCondition',
    function(t, r) {
      var needsToLoad = RustyTools.load("RustyTools.Empty");
      if (needsToLoad) {
        RustyTools.waitForCondition(function(){
          return !!RustyTools.Empty;
        }, function() {
          // Should not need to load again!
          // This was an asyncronous callback, so run .test to test and show the results.
          t.test([
            'RustyTools.getUri,  RustyTools.load && RustyTools.waitForCondition',
            function(t, r) {r.not(RustyTools.load("RustyTools.Empty"));}
          ]); 
        });
      } else {
        // Already loaded
        r.not(!(RustyToolsTest.Empty));
      }
    },

    'RustyTools.RustyTools.isEnabled',
    function(t, r) {
      // Checking the id=report should always work
      r.not(!RustyTools.isEnabled('#report'));
    },
    function(t, r) {
      // This will fail in I.E.  I.E. does not have the xpath "evaluate"

      // Xpath to the first div.  
      r.not(!RustyTools.isEnabled('//div'));
    },
    function(t, r) {
      // search by class. This will fail if jquery, or some other $ implementatuion is not loaded.
      r.not(!RustyTools.isEnabled('.report-style'));
    },
  ]);
};

