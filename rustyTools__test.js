RustyTools.__test = function(t, r) {
  var RustyToolsTest = RustyTools.wrapObject(RustyTools);

  // Make a new object in RustyToolsTest;
  RustyToolsTest.cfg = {};
  // Add all r.e members from RustyTools.cfg
  RustyToolsTest.configure(RustyTools.cfg);

  // Top level RustyTools methods
  t.test([
    'RustyTools.__test\n' +
    'RustyTools.log',
    function(t, r) {
      // Stub out console.log so we can see the results
      var resultString = '';
      self.console = {log: function() {
        for (var i=0; i<arguments.length; i++) {
          resultString += arguments[i].toString(10) + '\n';
        }
      }}

      RustyTools.log("One", "Two");
      r.same(resultString, "One\nTwo\n");
    },

    'RustyTools.logException',
    function(t, r) {
      // RE-replace the console.log stup so that we have a new closure
      // to a new resultString.
      var resultString = '';
      self.console = {log: function() {
        for (var i=0; i<arguments.length; i++) {
          resultString += arguments[i].toString(10) + '\n';
        }
      }}

      try {
        throw { name: "TestException", 
            message: "This exception was generated for testing."};
      } catch (e) {RustyTools.logException(e);}
      
      r.match(/^This exception was generated for testing\./, resultString,
          'This exception was generated for testing.');
    },

    'RustyTools.configure && RustyTools.cloneOneLevel (configure calls cloneOneLevel)',
    function(t, r) {
      RustyToolsTest.configure({x_test: "string",
      y_test: ['a', 'b', 3.3, false]});
      r.same(RustyToolsTest.cfg.x_test, "string");
    },
    function(t, r) {r.same(RustyToolsTest.cfg.y_test[0], 'a');},
    function(t, r) {r.same(RustyToolsTest.cfg.y_test[3], false);},
    function(t, r) {
      RustyToolsTest.configure({y_test: ['c', 'd']});
      // y_test: should now be ['a', 'b', 3.3, false, 'c, 'd]
      return r.same(RustyToolsTest.cfg.y_test[4], 'c');
    },
    function(t, r) {r.same(RustyToolsTest.cfg.y_test[2], 3.3);},

    'RustyTools.wrapObject',
    function(t, r) {
      r.not(RustyTools.cfg.x_test).different(RustyTools.cfg.x_test, RustyToolsTest.cfg.x_test);
    },

    'RustyTools.RustyTools.getUri',
    function(t, r) {
      var uri = RustyTools.getUri('RustyTools.__test');
      // Find this script and make sure the paths match.
      var scripts = document.getElementsByTagName('script');
      var scriptSrc = '';
      var i = scripts.length;
      while (scriptSrc != uri && i--) scriptSrc = scripts[i].src;

      r.same(scriptSrc, uri);
    },

    'RustyTools.getUri, RustyTools.load, RustyTools.waitForCondition tested with RustyTools.waitForLoad',
    function(t, r) {
      var loading  = RustyTools.waitForLoad("RustyTools.Empty",
        function() {
          // This was an asyncronous callback, so run .test to test and show the results.
          t.test([
            'RustyTools.waitForLoad callback',
            function(t, r) {
              // RustyTools.Empty should have loaded.
              // Check this by looking for a false return from RustyTools.load
              r.not(RustyTools.load("RustyTools.Empty"));
            }
          ]); 
        });

      // Loading should be true.
      r.not(!loading);
    },

    'RustyTools.isEnabled',
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
      // NOTE:  This will fail if jquery, or some other $ implementatuion is not loaded.
      // search by class.
      r.not(!RustyTools.isEnabled('.report-style'));
    }
  ]);
};

