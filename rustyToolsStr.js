window['RustyTools'] || (window['RustyTools'] = RustyTools = {});

RustyTools.Str = {
  entitize: function(str, opt_skipLineBreak) {
    var str2 = ((str) ? str.toString() : '').replace(/&/g, '&amp;').
        replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&#34;').
        replace(/ /g, '&nbsp;');
    if (!opt_skipLineBreak) str2 = str2.replace(/\r\n|\r|\n/g, '<br/>');
    return str2;
  },

  quote: function(str, quote) {
    if (!quote) quote = RustyTools.stringQuote;
    var expr = new RegExp(quote, 'g');
    return quote + ((str) ? str.toString() : '').replace(expr, '\\' + quote) + quote;
  },

  /*
   * toString - Convert the input parameters to strings.  .
   */
  toString: function(/*...*/) {
    var result = '';
    for (var i=0; i<arguments.length; i++) {
      var arg = arguments[i];
      if ('function' == typeof arg) {
        result += this.toString(arg());
      } else if (Array.isArray(arg)) {
        for (var j=0; j<arg.length; j++) result += this.toString(arg[j]);
      } else {
        result += arg.toString(10);
      }
    }

    return result;
  },

  /*
   * multiReplace - replace @1@, @2@, @3@, etc with the supplied parameters.
   *                Note: the supplied parameter can be a function; in whihc case it
   *                is passed the match and index.
   */
  multiReplace: function(str /*, ...*/) {
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
  },

  substitute: function(str, key, value) {
    var pos = str.search(key);

    if (-1 != pos) {
      return str.substr(0, pos) + value + 
          this.substitute(str.substr(pos + key.length), key, value);
    }
    return str;
  },

  /*
   * replaceByObj - in Str replace each key with the value.
   */
  replaceByObj: function(str /*obj , ...*/) {
    var result = str;
    for (var i=1; i<arguments.length; i++) {
      var arg = arguments[i];

      str.search("W3Schools");
      var regex 
      for (var key in arg) {
        if (arg.hasOwnProperty(key)) {
          result = this.substitute(result, key, arg[key]);
        }
      }
    }

    return result;
  }
};

