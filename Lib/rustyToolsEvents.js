if (!RustyTools) RustyTools = {};

RustyTools.Events = {
	callbacks: {},

	eventLog: null,

	// getXPathTo taken from:
	// http://stackoverflow.com/questions/2631820/im-storing-click-coordinates-in-my-db-and-then-reloading-them-later-and-showing/2631931#2631931
	// Answer by bobince
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

	makeEventSave: function(callbackId, ev) {
		"use strict";
		// Copy the ev, in the ev all nodes/elements must be replaced
		// by the xpath.
		var clone = RustyTools.cloneOneLevel(ev);
		var keys = Object.keys(clone);
		for (var i=0; i<keys.length; i++) {
			var key = keys[i];
			try {
				if (clone[key].nodeType) {
					// NOTE: calculate the path from the origional element
					// or the  === test will fail!
					clone['__path:' + key] = this.getXPathTo(ev[key]);
					delete clone[key];
				}
			} catch(e) {}
		}
		clone.__callbackId = callbackId;
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

	eventPassThrough: function(callbackId, callback, ev) {
		"use strict";
		if (this.eventLog) this.eventLog.push(this.makeEventSave(callbackId, ev));

		return callback(ev);
	},

	addEventListener: function(element, type, callback, opt_useCapture) {
		"use strict";
		if ('string' === typeof element) element = document.getElementById(element);

		var callbackId = this.getXPathTo(element) + type + (opt_useCapture) ?
				'Capture' : 'Bubble' + callback.toString();

		this.callbacks[callbackId] = callback;
		var binding = this.eventPassThrough.bind(this, callbackId, callback);

		// NOTE: element.addEventListener allows for adding multiple listeners to
		// the same event!
		element.addEventListener(type, binding, opt_useCapture);

		return {"element": element, "type": type, "binding": binding,
				"useCapture": opt_useCapture, "id": callbackId};
	},

	addEventListeners: function(element, events) {
		"use strict";
		var unlisteners = []

		for (var i in events) {
			unlisteners.push(this.addEventListener(element, i, events[i]));
		}
		return unlisteners
	},

	removeEventListeners: function(listeners) {
		"use strict";

		// Could be a single listener.
		if (!listeners.length) listeners = [listeners];

		var index = listeners.length;
		while (index--) {
			var listenerInfo = listeners[index];
			listenerInfo['element'].removeEventListener(listenerInfo['type'],
					listenerInfo['binding'], listenerInfo['useCapture']);
			delete this.callbacks[listenerInfo['id']];
		}
	},

	startEventLogging: function() {
		"use strict";
		this.eventLog = [];
	},

	endEventLogging: function() {
		"use strict";
		var result = this.eventLog;
		this.eventLog = null;
		return result;
	},

	runLoggedEvents: function(events) {
		"use strict";
		for (var i=0; i<events.length; i++) {
			var event = events[i];

			try {
				this.callbacks[event.__callbackId](this.pathsToElements(event));
			} catch (e) {
				RustyTools.logException(e);
			}
		}
	}
};

// Use the xpath evaluate if it exists, othewise use the custom simpleXPathToElement.
RustyTools.Events.pathToElement = (self.document.evaluate && self.XPathResult) ?
		RustyTools.Events.evaluateToElement : RustyTools.Events.simpleXPathToElement;