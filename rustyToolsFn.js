window['RustyTools'] || (window['RustyTools'] = RustyTools = {});

// Functional support
// Chain to the clobal object so RustyTools.Fn can be the context for function calls
RustyTools.Fn = RustyTools.wrapObject(self);

// Reduce implementation derived from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
if (RustyTools.cfg.test || 'function' !== typeof Array.prototype.reduce) {
  RustyTools.Fn._testableReduce = function(reduceRight, array, callback, opt_initialValue) {
    var undef;
    if (null === array || undef === array) {
      throw new TypeError('Array.prototype.reduce called on null or undefined');
    }
    if ('function' !== typeof callback) {
      throw new TypeError(callback + ' is not a function');
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
          value = callback(value, O[index], index, array);
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
}

if ('function' !== typeof Array.prototype.reduce) {
  Array.prototype.reduce = function(callback, opt_initialValue) {
    var params = Array.prototype.slice.call(arguments, 0);
    params.unshift(this);
    params.unshift(false);
    return RustyTools._testableReduce.apply(RustyRools, params);
  };

  Array.prototype.reduceRight = function(callback, opt_initialValue) {
    var params = Array.prototype.slice.call(arguments, 0);
    params.unshift(this);
    params.unshift(true);
    return RustyTools._testableReduce.apply(RustyRools, params);
  };
}

// Map implementation derived from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Map
// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.com/#x15.4.4.19
if (RustyTools.cfg.test || !Array.prototype.map) {
  RustyTools.Fn._testableMap = function(array, callback, opt_thisArg) {
  
    if (array == null) {
      throw new TypeError('Array.prototype.map called on null or undefined');
    }
  
    if (typeof callback !== "function") {
      throw new TypeError(callback + " is not a function");
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
      if (k in O) result[ k ] = callback.call(T, O[ k ], k, O);
    }
  
    return result;
  };
}

if (!Array.prototype.map) {
  Array.prototype.map = function(callback, opt_thisArg) {
    RustyTools._testableMap(this, callback, opt_thisArg);
  };
}

// Functional Javascript by Michael Fogus suggested
// Using a "trampoline" function to handle the JavaScript
// recusion limit (works as a replacement for tail recursion)
//
// To use trampoline, a recursive function should return the
// next function instead of calling its self.
// (Note this often means you must bind or return an array of
// the next function + parameters)
RustyTools.Fn.buildTrampoline = function(opt_contextObj) {
  if (!opt_contextObj) opt_contextObj = this;

  // return the trampoline bound to the desired context
  return function(fn /*, . ... */) {
    var params = Array.prototype.slice.call(arguments, 1);

    while (fn) {
      var result = fn.apply(opt_contextObj, params);
      fn = null;
      if ('function' == typeof result) {
        fn = result;
        result = params = null;
      } else if (Array.isArray && Array.isArray(result) &&
          ('function' == typeof result[0])) {
        fn = result[0];
        params = Array.prototype.slice.call(result, 1);
        result = null;
      }
    }

    return result;
  }
};

// Note:  RustyTools.Fn chains from self (the flobal object), so it works as the
//        context for RustyTools.Fn, and self/window.
RustyTools.Fn.trampoline = RustyTools.Fn.buildTrampoline(RustyTools.Fn);

// A perdicate function returns !falsy or falsy, but often we want to map that to
// other prepresentations (usually strings).
// (Properly the predicate should return true of false, but !falsy and falsy are good enought.)
RustyTools.Fn.predicateToValue = function(functionPredicate, trueValue, falseValue) {
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
  // Save the partial application args - they will be added after the
  // remainingCount arguments.
  var toApply =  Array.prototype.slice.call(arguments, 3);
  return function() {
    return fn.apply(opt_fnThisObj,
        // Make an array of the allowed passed arguments + the saved partial arguments.
        Array.prototype.slice.call(arguments, 0, desiredArgCount).
        concat(toApply));
  }
};

// Like in the C++ iterators all of the sort ordering can be done with a "less than" predicate.
// RustyTools.Fn.ordering produces a -1, 0, +1 ordering function from the "less than" prdicate.
RustyTools.Fn.ordering = function(fnLessThan, opt_fnThisObj) {
  // The generated ordering returns 0 of the arguments are equal, -1 if the first argument is less,
  // 1 if the second argument is less.  (Usefull for the Array.prototype.sort)
  var curriedLessThan = RustyTools.Fn.partialApplication(2, fnLessThan, opt_fnThisObj);

  return function(a, b) {
    if (curriedLessThan(a, b)) return -1;
    if (curriedLessThan(b, a)) return 1;

    return 0; // Not less or grater, must be the same.
  }
};

// Make a function that successively runs the passed in functions (like piping together filters.)
RustyTools.Fn.compose = function(/* function, ... */) {
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
  }
};

