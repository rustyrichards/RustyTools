/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


// SymbolTable Tree support

/*
Symbol table types - Just use the string because that makes it constant
Using RustyTools.constantWrapper would make it harder to optomize the lookups:
	'-function'
	'-global'
	'-parameter'
	'-value'
	'-variable'
*/

// opt_otherSymbolTable - Import from opt_otherSymbolTable to the root.
// opt_importAs - a shortcut for javascript
//      - new RustyTools.SymbolTable(self, '-global'l)
//			will load the JavaScript global symbols from the main self object.
RustyTools.SymbolTable = function(opt_otherSymbolTable, opt_importAs) {
	"use strict";
	var context = this.current = this.root = {};

	if (opt_otherSymbolTable) {
		try {
			Object.getOwnPropertyNames(opt_otherSymbolTable).forEach(function(key) {
				if (opt_importAs) {
					context['-' + key] = opt_importAs;
				} else if (-1 != key.search(/^-/)) {
					context[key] = opt_otherSymbolTable[key];
				}
			});
		} catch (e) {
			// Unable to use getOwnPropertyNames - try for ... in.  It will probably
			// be incomplete if opt_otherSymbolTable is the global object
			for (var key in self) {
				if (opt_importAs && opt_otherSymbolTable.hasOwnProperty(key)) {
					context['-' + key] = opt_importAs;
				} else if (-1 != key.search(/^-/)) {
					context[key] = opt_otherSymbolTable[key];
				}
			}
		}
	}
};

RustyTools.SymbolTable.prototype.set = function(key, value) {
	this.current['-' + key] = value;

	// For chaining
	return this;
};

RustyTools.SymbolTable.prototype.get = function(key) {
	return this.current['-' + key];
};

RustyTools.SymbolTable.prototype.setGlobal = function(key, value) {
	this.root['-' + key] = value;

	// For chaining
	return this;
};

RustyTools.SymbolTable.prototype.getGlobal = function(key) {
	return this.root['-' + key];
};

RustyTools.SymbolTable.prototype.push = function() {
	this.current = RustyTools.wrapObject(this.current);

	// For chaining
	return this;
};

RustyTools.SymbolTable.prototype.pop = function() {
	if (this.current !== this.root) {
		this.current = Object.getPrototypeOf(this.current);
	}

	// For chaining
	return this;
};

// depth is not fast, but it should not be needed much.
RustyTools.SymbolTable.prototype.depth = function() {
	var depth = 0;
	var runner = this.current;
	while (runner && runner != this.root) {
		depth++;
		runner = Object.getPrototypeOf(runner);
	}

	return depth;
};

