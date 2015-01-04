/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint globalstrict: true, eqnull: true, curly: false, latedef: true, newcap: true, undef: true, unused: true, strict: true, browser: true, devel: true*/
/* global RustyTools */


// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Events.__test = [
	'RustyTools.Events.__test\n' +
	'RustyTools.Events.getXPathTo',
	function(t) {
		t.symbols.set('events', new RustyTools.Events());
		t.symbols.set('testEl', document.getElementById('json').firstChild.firstChild);

		t.symbols.set('path', t.symbols.get('events').getXPathTo(t.symbols.get('testEl')));
		t.same(t.symbols.get('path'), 'id("json")/DIV[1]/DIV[1]');
	},
	'RustyTools.Events.evaluateToElement',
	function(t) {
		t.same(t.symbols.get('events').evaluateToElement(t.symbols.get('path')), t.symbols.get('testEl'));
	},
	'RustyTools.Events.simpleXPathToElement',
	function(t) {
		t.same(t.symbols.get('events').simpleXPathToElement(t.symbols.get('path')), t.symbols.get('testEl'));
	},
	'RustyTools.Events.pathToElement',
	function(t) {
		t.same(t.symbols.get('events').pathToElement(t.symbols.get('path')), t.symbols.get('testEl'));
	},
	'RustyTools.Events.makeEventSave and\n' +
	'RustyTools.Events.eventPassThrough',
	function(t) {
		var custom = new CustomEvent('CustomEvent', { 'destEl': t.symbols.get('testEl') });

		var passedThrough = false;
		// Listen for the event.
		var wrappedEvent = t.symbols.get('events').wrap(
				function(ev) {
					passedThrough = ev.srcElement === t.symbols.get('testEl');
				});
		t.symbols.get('testEl').addEventListener('CustomEvent', wrappedEvent);
		// Dispatch the event.
		t.symbols.get('testEl').dispatchEvent(custom);

		t.symbols.get('testEl').removeEventListener('CustomEvent', wrappedEvent);

		t.is(passedThrough);
	},
	'RustyTools.Events.removeEventListeners\n' +
	'RustyTools.Events.startEventLogging\n'+
	'RustyTools.Events.endEventLogging and\n' +
	'RustyTools.Events.runLoggedEvents',
	function(t) {
		debugger;
		var custom = new CustomEvent('CustomEvent', { 'destEl': t.symbols.get('testEl') });

		var eventCount = 0;
		// Listen for the event.
		var wrappedEvent = t.symbols.get('events').wrap(
		function(ev) {
			if (ev.srcElement === t.symbols.get('testEl')) eventCount++;
		});
		t.symbols.get('testEl').addEventListener('CustomEvent', wrappedEvent);

		t.symbols.get('events').startRecording();
		// Dispatch the event.
		t.symbols.get('testEl').dispatchEvent(custom);

		var recording = t.symbols.get('events').stopRecording();

		t.logObjects(recording[0]);

		t.symbols.get('events').playback(recording);

		t.symbols.get('testEl').removeEventListener('CustomEvent', wrappedEvent);
		t.same(eventCount, 2).same(recording.length, 1);
	},
	'RustyTools.Events - cleanup',
	function(t) {
		t.symbols.clear('testEl').clear('path');
	}
];
