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
    if (!quote) quote = RustyTools.cfg.stringQuote;
    var expr = new RegExp(quote, 'g');
    return quote + ((str) ? str.toString() : '').replace(expr, '\\' + quote) + quote;
  },

  /*
   * toString - Convert the input parameters to strings.  .
   */
  toString: function(/*...*/) {
    var undef;

    var result = '';
    for (var i=0; i<arguments.length; i++) {
      try {
        var arg = arguments[i];
        if (undef == arg) {
          result = 'undefined';
        } else if (null == arg) {
          result = 'null';
        } else if ('function' == typeof arg) {
          result += this.toString(arg());
        } else if (Array.isArray(arg)) {
          for (var j=0; j<arg.length; j++) result += RustyTools.Str.toString(arg[j]);
        } else {
          result += arg.toString(10);
        }
      } catch (e) {RustyTools.logException(e);}
    }

    return result;
  },

  /*
   * multiReplace - replace the taga <#1/> or <#1>...</#1> etc with the supplied parameters.
   *                To allow for recursive substitution <-#1/> of <-#1>...</-#1> should be used
   *                inside the content, with one extra '-' added for each substitution level.
   *                Note: the supplied parameter can be a function; in which case it
   *                is passed the index, and the content.
   *
   *                If substObjs is an array, the substitution is done for each element in the
   *                array
   */
  multiReplace: function(str, substObjs, opt_keepSource) {
    var matches = {};
    var replaceArgs = arguments;
    var result = '';

    if (!Array.isArray(substObjs)) substObjs = [substObjs];
    for (var i=0; i<substObjs.length; i++) {
      substObj = substObjs[i];

      // Match <#n/> or <#m>...</#n>
      result += str.replace(/<#([^\/>]+)(?:\/>|>([\s\S]*)<\/#\1>)/g, 
        function(match, index, content) {
          var subst = substObj[index];
          if (subst != null) {
            if (content) {
              // Recursively call multireplace on the content
              // Remove one level of - from <-*n
              var adjContent = content.replace(/(<\/?-*?)-#([^\/>]+)/g, '$1#$2');
              // For any recursive calls opt_keepSource should be false or omitted.
              if (replaceArgs[index] instanceof Object) {
                matches[index] = this.multiReplace.call(this, adjContent, replaceArgs[index]);
              }
            } else if (!matches[index]) {
              matches[index] = RustyTools.Str.toString(subst);
              if (opt_keepSource) matches[index] += match;
            }
          }
          return (matches[index] == null) ? match : matches[index];
        });
    }

    return result;
  },

  /*
   * mulitReplaceCleanup - remove any remaining multiReplace tags
   */
  mulitReplaceCleanup: function(str) {
    return str.replace(/<(-*)#([^\/>]+)(?:\/>|>([\s\S]*)<\/\1#\2>)/g, '');
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
