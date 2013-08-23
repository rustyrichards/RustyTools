window['RustyTools'] || (RustyTools = {});

/**********
Note:   cloneOneLevel will reserence/alias the objects.  This is to prevent infinite recursion,
        but be carefull of mutating the objects!

        RustyTools.cloneOneLevel can not be in the object notation because it must be called - see below.
**********/

RustyTools.cloneOneLevel = function(/* config objects */) {
  var result = {};
  for (var i=0; i<arguments.length; i++) {
    var toClone = arguments[i];
    if (toClone) {
      for (var key in toClone) {
        if (toClone.hasOwnProperty(key)) {
          var property = toClone[key];
          if (property instanceof Function) {
            // Alias function objects do not deep copy
            result[key] = property;
          } else if (property instanceof RegExp) {
            // Alias all RegExp
            result[key] = property;
          } else if (property instanceof Array) {
            // Array - append all the array values.
            if (!(result[key] instanceof Array)) result[key] = [];
            result[key] = result[key].concat(property);
          } else if (property instanceof Object) {
            // Object - for all items in config  replace those entries in result.
            if (!(result[key] instanceof Object)) result[key] = {};
            for (var j in property) {
              if (property.hasOwnProperty(i)) result[key][j] = property[j];
            }
          } else {
            result[key] = property;
          }
        }
      }
    }
  }
  return result;
};

RustyTools.cfg =  RustyTools.cloneOneLevel({stringQuote: '"'}, RustyTools.cfg);

/**
 * RustyTools.configure will overwrite any matching RustyTools members.
 * Use this for setting and extending configuration variables.
 */
RustyTools.configure = function(/* config object(s) */) {
  var callParams = Array.prototype.slice.call(arguments, 0);
  callParams.unshift(this.cfg);
  this.cfg = RustyTools.cloneOneLevel.apply(null, callParams);
  return this;
};

/*
 * RustyTools.wrapObject uses prototype inheritance to make a wrapper around
 * an existing object.  This allows the wrapping of objects so some members
 * can be overridden.
 */
RustyTools.wrapObject = function(obj) {
  function InheritWrapper() {};
  InheritWrapper.prototype = obj;
  return new InheritWrapper();
},

RustyTools.entitize = function(str, opt_skipLineBreak) {
  var str2 = ((str) ? str.toString() : '').replace(/&/g, '&amp;').
      replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&#34;').
      replace(/ /g, '&nbsp;');
  if (!opt_skipLineBreak) str2 = str2.replace(/\r\n|\r|\n/g, '<br/>');
  return str2;
},

RustyTools.quote = function(str, quote) {
  if (!quote) quote = RustyTools.stringQuote;
  var expr = new RegExp(quote, 'g');
  return quote + ((str) ? str.toString() : '').replace(expr, '\\' + quote) + quote;
};

/*
 * multiReplace - replace @1@, @2@, @3@, etc with the supplied parameters.
 *                Note: the supplied parameter can be a function; in whihc case it
 *                is passed the match and index.
 */
RustyTools.multiReplace = function(str /*, ...*/) {
  var matches = [];
  var replaceArgs = arguments;
  var result = str.replace(/@([1-9][0-9]*)@/g, function(match, indexStr) {
    var index = parseInt(indexStr, 10);
    if (0<index && index<replaceArgs.length) {
      if (!matches[index]) {
        var converted = replaceArgs[index];
        var undef;
        switch (converted) {
          case undef:
            converted = 'undefined';
            break;
          case null:
            converted = 'null';
            break;
          default:
            try {
              if ('function' == typeof converted) {
                converted = converted(match, index);
              } else {
                converted = converted.toString(10);
              }
            } catch (e) {
              converted = 'falsy';
            }
        }
        matches[index] = converted;
      }
    }
    return matches[index];
  });

  return result;
};

RustyTools.isEnabled = function(xpathOrJQuery) {
  var enabled = false;

  // NOTE: document.evaluate / xpath is not supported by I.E
  if (document.evaluate && -1 < xpathOrJQuery.search(/\//)) {
    var elements = document.evaluate(xpathOrJQuery, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null); 
    var el;
    try {
       while ((el = elements.iterateNext()) && (enabled = !el.disabled));
    } catch (e) {}
  } else {
    var hasJquery = false;
    try {
      hasJQuery = 'function' == typeof $;
    } catch (e) {}
    if (hasJquery) {
      $(idOrJqueryPattern).each(function(inedex, element){enabled = !element.disabled; return enabled;});
    } else if ('#' == xpathOrJQuery[0]) {
      var el = document.getElementById(xpathOrJQuery.substr(1));
      enabled = el && !el.disabled;
    }
  }
  return enabled;
};

// Functional support
// Reduce implementation from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
if (RustyTools.test || 'function' !== typeof Array.prototype.reduce) {
	RustyTools._testableReduce = function(reduceRight, array, callback, opt_initialValue) {
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

// Map implementation from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Map
// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.com/#x15.4.4.19
if (RustyTools.test || !Array.prototype.map) {
	RustyTools._testableMap = function(array, callback, opt_thisArg) {
	
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

RustyTools.predicateToValue = function(functionPredicate, trueValue, falseValue) {
  return function() {
    var params = Array.prototype.slice.call(arguments, 0);
    if (functionPredicate.apply(null, params)) return trueValue;
    return falseValue;
  };
};

// cury2 usefull for reduce where the math operation should only take
// thew first 2 parameters..
RustyTools.cury2 = function(fn, opt_thisObj) {
	return function(a, b) {
		return fn.apply(opt_thisObj, Array.prototype.slice.call(arguments, 0, 2));
	}
}
