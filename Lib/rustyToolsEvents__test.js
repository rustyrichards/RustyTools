// © 2013 Russell W. Richards
// License: Not yet determined.

// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Events.__test = function(t, r) {
	var testEl, path, events;

	// Top level RustyTools.Events methods
	t.test([
		'RustyTools.Events.__test\n' +
		'RustyTools.Events.getXPathTo',
		function(t, r) {
			events = new RustyTools.Events();
			testEl = document.getElementById('json').firstChild.firstChild;

			path = events.getXPathTo(testEl);
			r.same(path, 'id("json")/DIV[1]/DIV[1]');
		},
		'RustyTools.Events.evaluateToElement',
		function(t, r) {
			r.same(events.evaluateToElement(path), testEl);
		},
		'RustyTools.Events.simpleXPathToElement',
		function(t, r) {
			r.same(events.simpleXPathToElement(path), testEl);
		},
		'RustyTools.Events.pathToElement',
		function(t, r) {
			r.same(events.pathToElement(path), testEl);
		},
		'RustyTools.Events.makeEventSave and\n' +
		'RustyTools.Events.eventPassThrough',
		function(t, r) {
			var custom = new CustomEvent('CustomEvent', { 'destEl': testEl });

			var passedThrough = false;
			// Listen for the event.
			var wrappedEvent = events.wrap(
					function(ev) {
						passedThrough = ev.srcElement === testEl;
					});
			testEl.addEventListener('CustomEvent', wrappedEvent);
			// Dispatch the event.
			testEl.dispatchEvent(custom);

			testEl.removeEventListener('CustomEvent', wrappedEvent);

			r.is(passedThrough);
		},
		'RustyTools.Events.removeEventListeners\n' +
		'RustyTools.Events.startEventLogging\n'+
		'RustyTools.Events.endEventLogging and\n' +
		'RustyTools.Events.runLoggedEvents',
		function(t, r) {

			var custom = new CustomEvent('CustomEvent', { 'destEl': testEl });

			var eventCount = 0;
			// Listen for the event.
			var wrappedEvent = events.wrap(
			function(ev) {
				if (ev.srcElement === testEl) eventCount++;
			});
			testEl.addEventListener('CustomEvent', wrappedEvent);

			events.startRecording();
			// Dispatch the event.
			testEl.dispatchEvent(custom);

			var recording = events.stopRecording();

			r.logObjects(recording[0]);

			events.playback(recording);

			testEl.removeEventListener('CustomEvent', wrappedEvent);
			r.same(eventCount, 2).same(recording.length, 1);
		},
	]);
};

