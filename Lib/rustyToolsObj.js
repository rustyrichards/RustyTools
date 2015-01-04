/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint eqnull: true, curly: false, latedef: true, newcap: true, undef: true, unused: true, strict: true, browser: true, devel: true*/
/* global self, RustyTools */   // self is the generic global it is "window" im aweb page, or the clobal in a web worker.
                    // js hint should know this!

Object.prototype.forEachOwnProperty = function(fn, opt_context, opt_initialValue) {
    "use strict";
    RustyTools.forEachOwnProperty(this, fn, opt_context, opt_initialValue);
    
    // For chaining
    return this;
};

/**********
Note:   addOneLevel and cloneOneLevel will reference/alias the objects.
                This is to prevent infinite recursion,
                but be carefull of mutating the objects!
        addOneLevel should be in rustyToolsObject.js but it is needed here and in other
                low level utilities. 
**********/
// addOneLevel - copies object members onto dest.
//
// Only clones the top level! This prevents infinite loops, but lower level
// objects are referenced/aliased.
Object.prototype.addOneLevel = function(/* objects */) {
    "use strict";
    function copyProperty(key, property, obj, dest) {
        dest[key] = property;
        return dest;
    }
    function addToDest(key, property, obj, dest) {
        if ((property instanceof Function) || (property instanceof RegExp)) {
            // Alias all RegExp and functions
            dest[key] = property;
        } else if (property instanceof Array) {
            // Array - append all the array values.
            if (!(dest[key] instanceof Array)) dest[key] = [];
            dest[key] = dest[key].concat(property);
        } else if (property instanceof Object) {
            // Object - for all items in config  replace those entries in dest.
            if (!(dest[key] instanceof Object)) dest[key] = Object.create(property);
            property.forEachOwnProperty(copyProperty, this, dest);
        } else {	// String, number, and all others
            // Alias lias these. No need to copy the strings.  Altering ovj will not alter
            // the string in dest.
            dest[key] = property;
        }
        return dest;
    }

    for (var i=0; i<arguments.length; i++) {
        var toClone = arguments[i];
        if ('object' !== typeof toClone) {
            throw new TypeError('RustyTools.addOneLevel called on a non-object.');
        }

        toClone.forEachOwnProperty(addToDest, this, this);
    }

    // For chaining
    return this;
};

// simplePropertyCopy will copy only the numbers, booleans, and strings.
Object.prototype.simplePropertyCopy = function(/* objects */) {
    "use strict";
    for (var i=0; i<arguments.length; i++) {
        var toClone = arguments[i];
        if (toClone) {
            if ('object' !== typeof toClone) {
                throw new TypeError('RustyTools.simpleObjCopy called on a non-object.');
            }

            for (var key in toClone) {
                // No hasOwnProperty check.  This will copy base class members too.
                var type = typeof toClone[key];
                if (-1 !== ['number', 'boolean', 'string'].indexOf(type)) {
                    this[key] = toClone[key];
                }
            }
        }
    }
    return this;
};

/*
 * wrapObject uses prototype inheritance to make a wrapper around
 * an existing object.  This allows the wrapping of objects so some members
 * can be overridden.
 */
Object.prototype.wrapObject = function() {
    "use strict";
    function RustyToolsWrap() {
        // obj instanceof RustyToolsWrap is unreliable because each
        // call of wrapObject changes RustyToolsWrap.  Instead put
        // a test function in the new wrapper.
        this.rustyToolsIsWrapped = function() {return true;};
    }
    RustyToolsWrap.prototype = this;

    return new RustyToolsWrap();
};

if (!RustyTools) RustyTools = {};
RustyTools.cloneOneLevel = function(/* objects */) {
    "use strict";
    var params = Array.prototype.slice.call(arguments, 0);
    // If possible make dest have the same prototype as the first object.
    var dest;
    try {
        // Same prototype as the first prarmeter
        dest =  Object.create(params[0]);
    } catch (e) {
        // Cound not use the prototype of the first parameter - use generic object.
        dest = {};
    }
    params.unshift(dest);

    return this.addOneLevel.apply(this, params);
};
