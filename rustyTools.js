window['RustyTools'] || (RustyTools = {
  cfg: {stringQuote: '"'}
});

RustyTools.configure_ = function(dest, config) {
  for (var key in config) {
    if (config[key] instanceof Array) {
      if (!(dest[key] instanceof Object)) dest[key] = [];
      RustyTools.configure_(dest[key], config[key]);
    } else if (config[key] instanceof Object) {
      // Handle Object
      if (!(dest[key] instanceof Object)) dest[key] = {};
      RustyTools.configure_(dest[key], config[key]);
    } else {
      dest[key] = config[key];
    }
  }

  return dest;
};

// RustyTools.configure will overwrite any matching RustyTools members.
// Use this for setting configuration variables.
RustyTools.configure = function(configObj) {
  if (configObj) {
    RustyTools.configure_(RustyTools.cfg, configObj);
  }
  return RustyTools;
};

RustyTools.entitize = function(str, opt_skipLineBreak) {
  var str2 = ((str) ? str.toString() : '').replace(/&/g, '&amp;').
      replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&#34;').
      replace(/ /g, '&nbsp;');
  if (!opt_skipLineBreak) str2 = str2.replace(/\n/g, '<br/>');
  return str2;
};

RustyTools.quote = function(str, quote) {
  if (!quote) quote = RustyTools.stringQuote;
  var expr = new RegExp(quote, 'g');
  return quote + ((str) ? str.toString() : '').replace(expr, '\\'+quote) + quote;
};

