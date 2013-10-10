// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Events.__test = function(t, r) {
	var testEl, path;

	// Top level RustyTools.Events methods
	t.test([
		'RustyTools.Events.__test\n' +
		'RustyTools.Events.getXPathTo',
		function(t, r) {
			testEl = document.getElementById('json').firstChild.firstChild;

			path = RustyTools.Events.getXPathTo(testEl);
			r.same(path, 'id("json")/DIV[1]/DIV[1]');
		},
		'RustyTools.Events.evaluateToElement',
		function(t, r) {
			r.same(RustyTools.Events.evaluateToElement(path), testEl);
		},
		'RustyTools.Events.simpleXPathToElement',
		function(t, r) {
			r.same(RustyTools.Events.simpleXPathToElement(path), testEl);
		},
		'RustyTools.Events.pathToElement',
		function(t, r) {
			r.same(RustyTools.Events.pathToElement(path), testEl);
		},
		'RustyTools.Events.makeEventSave\n' +
		'RustyTools.Events.eventPassThrough and\n'+
		'RustyTools.Events.addEventListener',
		function(t, r) {

			var event = new CustomEvent('CustomEvent', { 'destEl': testEl });

			var passedThrough = false;
			// Listen for the event.
			var toUnlisten = RustyTools.Events.addEventListener(testEl, 'CustomEvent',
					function(ev) {
						passedThrough = ev.srcElement === testEl;
					});
			// Dispatch the event.
			testEl.dispatchEvent(event);

			RustyTools.Events.removeEventListener(toUnlisten);

			r.is(passedThrough);
		},
		'RustyTools.Events.removeEventListener\n' +
		'RustyTools.Events.startEventLogging\n'+
		'RustyTools.Events.endEventLogging and\n' +
		'RustyTools.Events.runLoggedEvents',
		function(t, r) {

			var event = new CustomEvent('CustomEvent', { 'destEl': testEl });

			var eventCount = 0;
			// Listen for the event.
			var toUnlisten = RustyTools.Events.addEventListener(testEl, 'CustomEvent',
			function(ev) {
				if (ev.srcElement === testEl) eventCount++;
			});

			RustyTools.Events.startEventLogging();
			// Dispatch the event.
			testEl.dispatchEvent(event);

			var events = RustyTools.Events.endEventLogging();

			r.logObjects(events[0]);

			RustyTools.Events.runLoggedEvents(events);

			RustyTools.Events.removeEventListener(toUnlisten);
			r.same(eventCount, 2).same(events.length, 1);
		},
	]);
};

