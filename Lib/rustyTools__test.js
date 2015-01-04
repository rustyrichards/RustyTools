/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/*jshint globalstrict: true, eqnull: true, curly: false, latedef: true, newcap: true, undef: true, unused: true, strict: true, browser: true, devel: true*/
/* global RustyTools, self */   // self is the generic global it is "window" im aweb page, or the clobal in a web worker.
                                // js hint should know this!


// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.__test = [
	'RustyTools  pre-test initialization and stubs',
	function(t) {
		t.symbols['RustyTools.cfg'] =  RustyTools.cfg  || null;
		t.symbols['self.console'] =  self ? self.console : null;
		t.symbols['console.log'] =  '';

        // Stub out self.clonsole.log to wtite to t.symbols['console.log']
        if (!self) self = {};
		self.console = {log: function() {
			for (var i=0; i<arguments.length; i++) {
				t.symbols['console.log'] += arguments[i].toString(10) + '\n';
			}
		}};
        
        t.suppressTest(); // Initialization is not a test
    },
    
	'RustyTools.cfg',
	function(t) {
        // Given RustyTools && RustyTools.cfg
        
        // When RustyTools is constructed.
        
        // Then RustyTools.cfg.interval is set.
		t.assert(function(){return 'number' == typeof RustyTools.cfg.interval;});
	},  

	'RustyTools.disallow',
	function(t) {
        // Given RustyTools && RustyTools.disallow
        
        // When RustyTools.disallow is called it alway returns false
        
        // Then RustyTools.cfg.interval is set.
		t.assert(function(){return false == RustyTools.disallow();});
	},  

	'RustyTools.log',
	function(t) {
        // Given RustyTools && RustyTools.log && console.log is stubbed
        // to write to t.symbols['console.log']
        t.symbols['console.log'] = '';

        // When
		RustyTools.log("One", "Two");
        
        // Then
		t.assert(function(){return t.symbols['console.log']  == 'One\nTwo\n';});
	}, 

	'RustyTools.logError',
	function(t) {
        // Given RustyTools && RustyTools.log  && RustyTools.logException && console.log is stubbed
        // to write to t.symbols['console.log']
        t.symbols['console.log'] = '';

		// When
        try {
			throw { name: "TestException",
					message: "This exception was generated for testing."};
		} catch (e) {RustyTools.logError(e);}

        // Then
        t.assert(function(){return 'This exception was generated for testing' == t.symbols['console.log'].split('.')[0];});
	},

	'RustyTools.log - works on exceptions too',
	function(t) {
        // Given RustyTools && RustyTools.log  && RustyTools.logException && console.log is stubbed
        // to write to t.symbols['console.log']
        t.symbols['console.log'] = '';

		// When
        try {
            var err = new Error();
            err.name = "TestException2";
            err.message = "This exception was also generated for testing.";
            throw err;
		} catch (e) {RustyTools.log(e);}

        // Then
        t.assert(function(){return 'This exception was also generated for testing' == t.symbols['console.log'].split('.')[0];});
	},

	'RustyTools.configure',
	function(t) {
        // Given RustyTools && RustyTools.configure

        // When
        RustyTools.configure({a:1, b:2, c:{}}, {x:'test', y:[1,2,3]});
        
        // Then RustyTools.cfg -> .a .b and .x should be set.  .c and .y should not
        // .interval should still be set
        t.assert(function(){return RustyTools.cfg.a == 1 && RustyTools.cfg.b == 2 && RustyTools.cfg.x == 'test';}).
                assert(function(){return null == RustyTools.cfg.c && null == RustyTools.cfg.y;}).
                assert(function(){return 'number' == typeof RustyTools.cfg.interval;});
	},

	'RustyTools.isArrayLike',
	function(t) {
        // Given RustyTools && RustyTools.isArrayLike

        // When used to test objects
        var argsCopy = arguments;
        
        // Then
        t.assert(function(){return RustyTools.isArrayLike(argsCopy);}).
                assert(function(){return RustyTools.isArrayLike([1,2]);}).
                assert(function(){return !RustyTools.isArrayLike('test');});
	},

	'RustyTools.pathToMember',
	function(t) {
        // Given RustyTools && RustyTools.pathToMember
        
        // When
        var member = RustyTools.pathToMember("RustyTools.cfg.rustyToolsScriptPath");
        
        // Then
        t.assert(function(){return 'string' == typeof member;});
	},

	'RustyTools.getUri',
	function(t) {
        // Given RustyTools && RustyTools.getUri

        // When used to test objects
        var realUrl = RustyTools.getUri("RustyTools.obj");
        var fakeUrl = RustyTools.getUri("One.two.Three", "https://fake.com/");
        
        // Then
        t.assert(function(){return realUrl.replace(/^.*\//, '') === 'rustyToolsObj.js';}).
                assert(function(){return fakeUrl === 'https://fake.com/oneTwoThree.js';});
	},

	'RustyTools.load - load RustyTools.Empty',
	function(t) {
        // Given RustyTools && RustyTools.load
        
        // When RustyTools.Empty is loaded
		var loading  = RustyTools.load("RustyTools.Empty",
			function() {
				// This was an asyncronous callback, so run .test to test and show the results.
				t.test([
					'RustyTools.load callback',
					function(t) {
                        // Given the load of RustyTools.Empty has finished
                        
                        // When the load is complete
                        
                        // Then
                        t.assert(function(){return 'object' == typeof RustyTools.Empty;});
					}
				]);
			});

		// Then loading should be true until the load is completed.
		t.assert(function(){return loading;});
	},
    
	'RustyTools.loadInOrder',
	function(t) {
        // Given RustyTools && RustyTools.loadInOrder
        
        // When
        var loadCount = 0;
		RustyTools.loadInOrder(function() {
				// This was an asyncronous callback, so run .test to test and show the results.
				t.test([
					'RustyTools.loadOrder callback',
					function(t) {
                        // Given the load of RustyTools.Empty has finished
                        
                        // When
                        t.message("loadInOrder count:  " + ++loadCount);
                        
                        // Then the RustyTools.loadOrder looks like 1, 2 ... loasCount
                        t.assert(function() {
                            var matched = true;
                            for (var index = 0; index < loadCount; index++) {
                                matched = matched || index + 1 == RustyTools.loadOrder[index];
                            }
                            return matched;
                        });
					}
				]);
			}, "RustyTools.loadOrder1", "RustyTools.loadOrder2", "RustyTools.loadOrder3");

		// Then this test ends before loading starts
		t.assert(function(){return 0 === loadCount;});
	},
    
    'RustyTools.waitForCondition',
    function(t) {
        // Given RustyTools && RustyTools.load
        
        // When
        var ready = false;
        RustyTools.waitForCondition(function() {return ready;},
                function() {
                    // This was an asyncronous callback, so run .test to test and show the results.
                    t.test([
                        'RustyTools.waitForCondition callback',
                        function(t) {
                            // Given RustyTools.waitForCondition is complete

                            // When ready is true

                            // Then
                            t.assert(function(){return true === ready;});
                        }
                    ]);
        });

        self.setTimeout(function() {ready = true;}, 200);
		t.assert(function(){return false === ready;});
	},

	'RustyTools  post-test cleanup',
	function(t) {
		RustyTools.cfg = t.symbols['RustyTools.cfg'];
		self.console = t.symbols['self.console'];
        
        delete RustyTools.loadOrder;

        t.suppressTest(); // Initialization is not a test
    },
];
