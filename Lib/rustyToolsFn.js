// © 2013 Russell W. Richards
// License: Not yet determined.

// Functional support
// Chain to the global object so RustyTools.Fn can be the context for function calls
RustyTools.Fn = RustyTools.wrapObject(self);

// Reduce implementation derived from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
if (RustyTools.cfg.test || 'function' !== typeof Array.prototype.reduce) {
	RustyTools.Fn._testableReduce = function(reduceRight, array, fnCallback, opt_initialValue) {
		"use strict";
		if (null === array || undefined === array) {
			throw new TypeError('RustyTools.Fn._testableReduce or Array.prototype.reduce called on null or undefined');
		}
		if ('function' !== typeof fnCallback) {
			throw new TypeError(fnCallback + ' is not a function');
		}
		var value,
				length = array.length >>> 0,
				isValueSet = false,
				index = (reduceRight) ? length : -1,
				O = array;
		// If it is an array - great!  If it is array like convert it.
		if (!(O instanceof Array)) O = Array.prototype.slice.call(array, 0);
		if (3 < arguments.length) {
			value = opt_initialValue;
			isValueSet = true;
		}
		while ((reduceRight) ? index-- : (++index < length)) {
			if (O.hasOwnProperty(index)) {
				if (isValueSet) {
					value = fnCallback(value, O[index], index, array);
				} else {
					value = O[index];
					isValueSet = true;
				}
			}
		}
		if (!isValueSet) {
			throw new TypeError('Reduce of empty array with no initial value');
		}
		return value;
	};
} else {
	RustyTools.Fn._testableReduce = function(reduceRight, array, fnCallback, opt_initialValue) {
		"use strict";
		if (reduceRight) return array.reduceRight(fnCallback, opt_initialValue);
		return array.reduce(fnCallback, opt_initialValue);
	};
}

if ('function' !== typeof Array.prototype.reduce) {
	Array.prototype.reduce = function(/* fnCallback, opt_initialValue */) {
		"use strict";
		var params = Array.prototype.slice.call(arguments, 0);
		params.unshift(this);
		params.unshift(false);
		return RustyTools._testableReduce.apply(RustyTools, params);
	};

	Array.prototype.reduceRight = function(/* fnCallback, opt_initialValue */) {
		"use strict";
		var params = Array.prototype.slice.call(arguments, 0);
		params.unshift(this);
		params.unshift(true);
		return RustyTools._testableReduce.apply(RustyTools, params);
	};
}

// Map implementation derived from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Map
// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.com/#x15.4.4.19
if (RustyTools.cfg.test || !Array.prototype.map) {
	RustyTools.Fn._testableMap = function(array, fnCallback, opt_thisArg) {
		"use strict";

		if (!array) {
			throw new TypeError('RustyTools.Fn._testableMap or Array.prototype.map called on null or undefined');
		}

		if (typeof fnCallback !== "function") {
			throw new TypeError(fnCallback + " is not a function");
		}

		var O = array;
		// If it is an array - great!  If it is array like convert it.
		if (!(O instanceof Array)) O = Array.prototype.slice.call(array, 0);

		// k be ToUint32(lenValue).
		var k = O.length >>> 0;

		var T = opt_thisArg || null;

		var result = new Array(k);

		// Work from right to make the while slightly faster.
		while(k--) {
			if (k in O) result[ k ] = fnCallback.call(T, O[ k ], k, O);
		}

		return result;
	};
} else {
	RustyTools.Fn._testableMap = function(array, fnCallback, opt_thisArg) {
		"use strict";
		return array.map(fnCallback, opt_thisArg);
	};
}

if (!Array.prototype.map) {
	Array.prototype.map = function(fnCallback, opt_thisArg) {
		"use strict";
		RustyTools._testableMap(this, fnCallback, opt_thisArg);
	};
}

// The recurive implementation of propertyWalk
RustyTools.Fn.propertyWalk_ = function(result, visited, keyPath, object,
		fnCallback, thisArg, opt_fnPropertyWanted) {
	"use strict";
	// RustyTools.Fn.propertyWalk does the parameter validation!

	// Prevent recursive loops
	if (-1 === visited.indexOf(object)) {
		visited.push(object);

		for (var key in object) {
			var value = object[key];
			if (object.hasOwnProperty(key) && (!opt_fnPropertyWanted ||
					opt_fnPropertyWanted.call(thisArg, key, value))) {
				keyPath.push(key);
				if (!RustyTools.isArrayLike(value) && 'object' === typeof value) {
					// For child objects recurse.
					result = this.propertyWalk_(result, visited, keyPath, value,
							fnCallback, thisArg, opt_fnPropertyWanted);
				} else {
					// For arrays or simple values fnCallback must handle the value
					result = fnCallback.call(thisArg, result, key, value, keyPath);
				}
				keyPath.pop();
			}
		}
	}

	return result;
};


// Kind of like map it is often useefull to walk all the peoperties in an object/hash.
// The type produced is up to fnCallback.  (propertyWalk could summ all numbers!)
// and produce a new object.  (The new object can be a string.)
// fnCallback will receive:
//		result - the output so far.  The return from fnCallback will replace result.
//		key - the string name of the property.
//		value - the value of the property.
//    keyPath - an array of all the keys from ancestor objects.  (key will be the
//				last value in the array.)
RustyTools.Fn.propertyWalk = function(object, fnCallback, opt_fnPropertyWanted, opt_thisArg) {
	"use strict";
	if (object == null) {
		throw new TypeError('RustyTools.Fn.propertyWalk called on null or undefined');
	}

	if (opt_fnPropertyWanted && typeof opt_fnPropertyWanted !== "function") {
		throw new TypeError(opt_fnPropertyWanted + " is not a function");
	}

	if (typeof fnCallback !== "function") {
		throw new TypeError(fnCallback + " is not a function");
	}

	if (typeof object !== "object") {
		throw new TypeError(object + " is not an object");
	}

	var result;	// Result starts with "undefined".

	return this.propertyWalk_(result, [], [], object, fnCallback,
			opt_thisArg || null, opt_fnPropertyWanted);
};


// Functional Javascript by Michael Fogus suggested
// Using a "trampoline" function to handle the JavaScript
// recusion limit (works as a replacement for tail recursion)
//
// To use trampoline, a recursive function should return the
// next function instead of calling its self.
// (Note this often means you must bind or return an array of
// the next function + parameters)
RustyTools.Fn.buildTrampoline = function(opt_contextObj) {
	"use strict";
	if (!opt_contextObj) opt_contextObj = this;

	// return the trampoline bound to the desired context
	return function(fn /*, . ... */) {
		var result;
		var params = Array.prototype.slice.call(arguments, 1);

		while (fn) {
			result = fn.apply(opt_contextObj, params);
			fn = null;
			if ('function' === typeof result) {
				fn = result;
				result = null;
				params = [];
			} else if (Array.isArray && Array.isArray(result) &&
					('function' === typeof result[0])) {
				fn = result[0];
				params = Array.prototype.slice.call(result, 1);
				result = null;
			}
		}

		return result;
	};
};

// Note:  RustyTools.Fn chains from self (the flobal object), so it works as the
//        context for RustyTools.Fn, and self/window.
RustyTools.Fn.trampoline = RustyTools.Fn.buildTrampoline(RustyTools.Fn);

// A perdicate function returns !falsy or falsy, but often we want to map that to
// other prepresentations (usually strings).
// (Properly the predicate should return true of false, but !falsy and falsy are good enought.)
RustyTools.Fn.predicateToValue = function(functionPredicate, trueValue, falseValue) {
	"use strict";
	return function() {
		var params = Array.prototype.slice.call(arguments, 0);
		if (functionPredicate.apply(null, params)) return trueValue;
		return falseValue;
	};
};

// The javascript "bind" works well for setting the object and left most parameters.
// But often the right most paramters are the issue.
//  var parseIntBase2 = RustyTools.Fn.partialApplication(1, parseInt, null, 2 /*base */);
//  var integers = [some binary string array].map(parseIntBase2);
// or
//  var maxOf2 = RustyTools.Fn.partialApplication(2, Math.max); // Must look at only "value" and "current" the index and array would mess up the max.
//  var max = [some number array].reduce(maxOf2);
RustyTools.Fn.partialApplication = function(desiredArgCount, fn, opt_fnThisObj /* ... */) {
	"use strict";
	// Save the partial application args - they will be added after the
	// remainingCount arguments.
	var toApply =  Array.prototype.slice.call(arguments, 3);
	return function() {
		return fn.apply(opt_fnThisObj,
				// Make an array of the allowed passed arguments + the saved partial arguments.
				Array.prototype.slice.call(arguments, 0, desiredArgCount).
				concat(toApply));
	};
};

// Like in the C++ iterators all of the sort ordering can be done with a "less than" predicate.
// RustyTools.Fn.ordering produces a -1, 0, +1 ordering function from the "less than" prdicate.
RustyTools.Fn.ordering = function(fnLessThan, opt_fnThisObj) {
	"use strict";
	// The generated ordering returns 0 of the arguments are equal, -1 if the first argument is less,
	// 1 if the second argument is less.  (Usefull for the Array.prototype.sort)
	var curriedLessThan = RustyTools.Fn.partialApplication(2, fnLessThan, opt_fnThisObj);

	return function(a, b) {
		if (curriedLessThan(a, b)) return -1;
		if (curriedLessThan(b, a)) return 1;

		return 0; // Not less or grater, must be the same.
	};
};

// Make a function that successively runs the passed in functions (like piping together filters.)
RustyTools.Fn.compose = function(/* function, ... */) {
	"use strict";
	var toApply =  Array.prototype.slice.call(arguments, 0);

	// The returned function will take an arbitrary number of paramters, and it will keep sending
	// the output of one function to the input of the next.
	return function(/* ... */) {
		var results =  Array.prototype.slice.call(arguments, 0);
		for (var i=0; i<toApply.length; i++) {
			if (Array.isArray(results)) results = toApply[i].apply(null, results);
			else results = toApply[i].call(null, results);
		}

		return results;
	};
};

