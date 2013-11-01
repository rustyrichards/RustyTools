// © 2013 Russell W. Richards
// License: Not yet determined.

if (!RustyTools) RustyTools = {};


/**
 * Create a RustyTools.Events to be able to record and playback events.
 *
 * Use:
 *	EVENTS.wrap(eventCallBack, opt_context)
 * 	to wrap an event handler in the record and playback support
 *
 * Use:
 *	EVENTS.startRecording() and EVENTS.stopRecording()
 *	to start and stop the event rtecording.
 *
 * Use:
 *	EVENTS.playback() to playback the events.
 */
RustyTools.Events = function() {
	this.record;
};

// getXPathTo taken from:
// http://stackoverflow.com/questions/2631820/im-storing-click-coordinates-in-my-db-and-then-reloading-them-later-and-showing/2631931#2631931
// Answer by bobince
RustyTools.Events.prototype = {
	getXPathTo: function(element) {
		"use strict";
		var path = '';

		//loop don't recurse
		while (element) {
			if (element.id)
					return 'id("'+element.id+'")' + path;
			if (element===document.body)
					return element.tagName + path;

			var tagCount = 1;
			var parent = element.parentNode;
			var siblings = parent.childNodes;
			for (var i=0; i<siblings.length; i++) {
					var sibling = siblings[i];
					if (sibling === element) {
							path = '/' + element.tagName + '[' + tagCount + ']' + path;
							break;
					}
					// Only count the same tags
					if (element.tagName === sibling.tagName) tagCount++;
			}
			element = parent;
		}

		return '';	// This is an error a correct path will hit one of the 2 returns in the while.
	},

	evaluateToElement: function(path) {
		"use strict";
		return document.evaluate(path, document, null,
				self.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	},

	simpleXPathToElement: function(path) {
		"use strict";
		var pathSegments = path.split('/');
		var element = document;

		for (var i=0; element && i<pathSegments.length; i++) {
			var segment = pathSegments[i];

			var match = segment.match(/id\("([^"]+)"\)|([^\s\[]+)(?:\[([^\]]+)\])?/i);
			if (match[1]) {
				// This is an ID match
				element = element.getElementById(match[1]);
			} else if (match[2]) {
				// Tag and and maybe an index into those tages.
				// Use 1 as the index if !match[3]
				var next = null;

				var matchIndex = (match[3]) ? parseInt(match[3], 10) : 1;
				var tagCount = 0;
				var siblings = element.childNodes;
				for (var j=0; !next && j<siblings.length; j++) {
					var sibling = siblings[j];
					if (sibling.tagName === match[2]) {
						if (++tagCount === matchIndex) {
							next = sibling;
						}
					}
				}
				element = next;
			}
		}

		return element;
	},

	makeEventSave: function(callback, ev) {
		"use strict";
		// Copy the ev, in the ev all nodes/elements must be replaced
		// by the xpath.
		var clone = RustyTools.cloneOneLevel(ev);
		var keys = Object.keys(clone);
		for (var i=0; i<keys.length; i++) {
			var key = keys[i];
			try {
				if (clone[key] && clone[key].nodeType) {
					// NOTE: calculate the path from the origional element
					// or the  === test will fail!
					clone['__path:' + key] = this.getXPathTo(ev[key]);
					delete clone[key];
				}
			} catch(e) {}
		}
		clone.__callback = callback;
		return clone;
	},

	pathsToElements: function(obj) {
		"use strict";
		var clone = RustyTools.cloneOneLevel(obj);
		var keys = Object.keys(clone);
		for (var i=0; i<keys.length; i++) {
			var key = keys[i];
			try {
				if (-1 !== key.search(/^__path:/)) {
					clone[key.split(':')[1]] = this.pathToElement(clone[key]);
					delete clone[key];
				}
			} catch(e) {}
		}
		return clone;
	},

	eventPassThrough: function(callback, ev) {
		"use strict";
		if (this.record) this.record.push(this.makeEventSave(callback, ev));

		return callback(ev);
	},

	wrap: function(eventCallback, opt_context) {
		"use strict";
		if (opt_context) eventCallback = eventCallback.bind(opt_context);

		return this.eventPassThrough.bind(this, eventCallback);
	},

	startRecording: function() {
		"use strict";
		this.record = [];
		return this.record;
	},

	stopRecording: function() {
		"use strict";
		var recording = this.record;
		this.record = null;
		return recording;
	},

	playback: function(recording) {
		"use strict";
		if (recording && recording.length) {
			var event = recording[0];
			var callback = event.__callback;
			delete event.__callback;
			callback(this.pathsToElements(event));

			var rest = recording.slice(1);

			// These were async evnets, so make the call async.  Don't loop.
			if (rest.length) {
				setTimeout(this.playback.bind(this, rest), 0);
			}
		}
	}
};

// Use the xpath evaluate if it exists, othewise use the custom simpleXPathToElement.
RustyTools.Events.prototype.pathToElement =
		(self.document.evaluate && self.XPathResult) ?
		RustyTools.Events.prototype.evaluateToElement :
		RustyTools.Events.prototype.simpleXPathToElement;