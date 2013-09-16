// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

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
			}};

			RustyTools.log("One", "Two");
			r.same(resultString, "One\nTwo\n");
		},

		'RustyTools.logException',
		function(t, r) {
			// RE-replace the console.log stub so that we have a new closure
			// to a new resultString variable.
			var resultString = '';
			self.console = {log: function() {
				for (var i=0; i<arguments.length; i++) {
					resultString += arguments[i].toString(10) + '\n';
				}
			}};

			try {
				throw { name: "TestException",
						message: "This exception was generated for testing."};
			} catch (e) {RustyTools.logException(e);}

			r.match(/^This exception was generated for testing\./, resultString,
					'This exception was generated for testing.');
		},

		'RustyTools.configure && RustyTools.cloneOneLevel (configure calls cloneOneLevel)',
		function(t, r) {
			RustyToolsTest.configure({xTest: "string",
			yTest: ['a', 'b', 3.3, false]});
			r.same(RustyToolsTest.cfg.xTest, "string");
		},
		function(t, r) {r.same(RustyToolsTest.cfg.yTest[0], 'a');},
		function(t, r) {r.same(RustyToolsTest.cfg.yTest[3], false);},
		function(t, r) {
			RustyToolsTest.configure({yTest: ['c', 'd']});
			// yTest: should now be ['a', 'b', 3.3, false, 'c, 'd]
			return r.same(RustyToolsTest.cfg.yTest[4], 'c');
		},
		function(t, r) {r.same(RustyToolsTest.cfg.yTest[2], 3.3);},

		'RustyTools.wrapObject',
		function(t, r) {
			r.not(RustyTools.cfg.xTest).different(RustyTools.cfg.xTest, RustyToolsTest.cfg.xTest);
		},

		'RustyTools.cloneOneLevel',
		function(t, r) {
			// Test the object merging
			var clone = RustyTools.cloneOneLevel({a: 1, c:3}, {b:2, d:'last'});

			var cloneKeys = Object.keys(clone).sort();

			r.same(clone.a, 1).same(clone.b, 2).same(clone.c, 3).
				same(clone.d, 'last').same(cloneKeys, ['a', 'b', 'c', 'd']);
		},

		function(t, r) {
			// Test that the clone is no longer the same as the source.
			var source = {a:'one', b:2.2};
			var clone = RustyTools.cloneOneLevel(source);

			// Changing a str or number in shource should not change clone.
			source.a = 'two';
			source.b = 3.14159;

			r.different(clone.a, source.a).different(clone.b, source.b).
				same(clone.a, 'one').same(clone.b, 2.2);
		},

		'RustyTools.constantWrapper',
		function(t, r) {
			// Make an constantWrapper, and check that it handles known and unknown keys.
			var source = {a:'one', b:2.2};
			var wrapper = RustyTools.constantWrapper(source);

			// Changing a str or number in shource should not change constantWrapper.
			source.b = "two";
			r.same(wrapper('a'), 'one').same(wrapper('b'), 2.2).not(wrapper('c'));
		},

		'RustyTools.constantWrapper - subclass',
		function(t, r) {
			// Make an constantWrapper, and check that it handles known and unknown keys.
			var source = {a:'one', b:2.2};
			var wrapper = RustyTools.constantWrapper(source);
			wrapper = wrapper.subclass({a:'1', c:'three'})

			// Changing a str or number in shource should not change constantWrapper.
			source.b = "two";
			r.same(wrapper('a'), 1).same(wrapper('b'), 2.2).same(wrapper('c'), 'three');
		},

		'RustyTools.simpleObjCopy',
		function(t, r) {
			// Only the numbers, booleans and strings should copy
			var source = {a: 1.1,
					b: true,
					c: 'test',
					d: {x: 1, y: 2},
					e: function(x) {return x;},
					f: true
			}
			var clone = RustyTools.simpleObjCopy(source);

			r.same(clone.a, source.a).same(clone.b, source.b).same(clone.c, source.c).
				not(clone.d).not(clone.e);
		},

		'RustyTools.isArrayLike',
		function(t, r) {
			r.not(RustyTools.isArrayLike(1.1)).					// number is not array like
				not(RustyTools.isArrayLike('test')).			// string explicitly excluded
				not(RustyTools.isArrayLike({length: 'foo'})).	// property length is not a number
				not(!RustyTools.isArrayLike(arguments)).		// arguments is array like
				not(!RustyTools.isArrayLike([]));				// empty array is array like
		},

		'RustyTools.getUri',
		function(t, r) {
			if (self.document) {
				var uri = RustyTools.getUri('RustyTools.__test');
				// Find this script and make sure the paths match.
				var scripts = self.document.getElementsByTagName('script');
				var scriptSrc = '';
				var i = scripts.length;
				while (scriptSrc !== uri && i--) scriptSrc = scripts[i].src;

				r.same(scriptSrc, uri);
			} else {
				// No window.document, can't run this test!
				r.not(!self.document);
			}
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

