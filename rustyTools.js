window['RustyTools'] || (RustyTools = {
  cfg: {stringQuote: '"'},
  /**
   * RustyTools.configure will overwrite any matching RustyTools members.
   * Use this for setting and extending configuration variables.
   */
  configure: function(configObj) {
    if (configObj) RustyTools.addElements(this.cfg, configObj);
    return this;
  }
});

RustyTools.addElements = function(dest, config) {
  for (var key in config) {
    var element = config[key];
    if (element instanceof Function) {
      // Alias function objects do not deep copy
      dest[key] = element;
    } else if (element instanceof RegExp) {
      // Alias all RegExp
      dest[key] = element;
    } else if (element instanceof Array) {
      // Array - for all elements in config replace those entries in dest.
      if (!(dest[key] instanceof Array)) dest[key] = [];
      RustyTools.addElements(dest[key], element);
    } else if (element instanceof Object) {
      // Object - for all items in config  replace those entries in dest.
      if (!(dest[key] instanceof Object)) dest[key] = {};
      RustyTools.addElements(dest[key], element);
    } else {
      dest[key] = element;
    }
  }

  return dest;
};

/**
 * RustyTools.wrapObject uses prototype inheritance to make a wrapper around
 * an existing object.  This allows the wrapping of objects so some members
 * can be overridden.
 */
RustyTools.wrapObject = function(obj) {
  function InheritWrapper() {};
  InheritWrapper.prototype = obj;
  return new InheritWrapper();
};

RustyTools.entitize = function(str, opt_skipLineBreak) {
  var str2 = ((str) ? str.toString() : '').replace(/&/g, '&amp;').
      replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&#34;').
      replace(/ /g, '&nbsp;');
  if (!opt_skipLineBreak) str2 = str2.replace(/\r\n|\r|\n/g, '<br/>');
  return str2;
};

RustyTools.quote = function(str, quote) {
  if (!quote) quote = RustyTools.stringQuote;
  var expr = new RegExp(quote, 'g');
  return quote + ((str) ? str.toString() : '').replace(expr, '\\' + quote) + quote;
};

RustyTools.multiReplace = function(str) {
  var matches = [];
  var replaceArgs = arguments;
  str = str.replace(/@([1-9][0-9]*)@/g, function(match, indexStr) {
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
              converted = converted.toString(10);
            } catch (e) {
              converted = 'falsy';
            }
        }
        matches[index] = converted;
      }
    }
    return matches[index];
  });

  return str;
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

