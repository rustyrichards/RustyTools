window['RustyTools'] || (window['RustyTools'] = RustyTools = {});

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

/**
 * RustyTools.configure will overwrite any matching RustyTools members.
 * Use this for setting and extending configuration variables.
 */
RustyTools.configure = function(/* config object(s) */) {
  var callParams = Array.prototype.slice.call(arguments, 0);
  callParams.unshift(this.cfg);
  this.cfg = RustyTools.cloneOneLevel.apply(this, callParams);
  return this;
};


// Configure once RustyTools.configure is set. 
RustyTools.configure({stringQuote: '"'});

/*
 * RustyTools.wrapObject uses prototype inheritance to make a wrapper around
 * an existing object.  This allows the wrapping of objects so some members
 * can be overridden.
 */
RustyTools.wrapObject = function(obj) {
  function InheritWrapper() {};
  InheritWrapper.prototype = obj;
  return new InheritWrapper();
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
