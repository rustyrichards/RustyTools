NumberToken.__test = function(tester) {
  var results = [];

  // Decimal constructor
  var number = new NumberToken({decimal: '\\.', exp: '[eE]'});
  var expr = new RegExp(number.toRegExpStr());
  tester.test([
      "NumberToken({decimal: '\\.', exp: '[eE]'}); /* floating point */",
      function(t){return t.not(number.prefix);},
      function(t){return t.same(number.numerals, '[0-9]');},
      function(t){return t.same(number.nonZero, '[1-9]');},
      function(t){return t.same(number.decimal, '\\.');},
      function(t){return t.same(number.exp, '[eE]');},
      function(t){return t.same(number.expPrefix, '[+-]?');},
      function(t){return t.match(expr, '6.02e+23');},
      function(t){return t.match(expr, '6.02E23');},
      function(t){return t.match(expr, '1.1e-100');},
      function(t){
          // 0 exponent - not a valid number!
          return t.noMatch(expr, '1.1e0');},
      function(t){
          //"A floating point number must have the decimal
          return t.noMatch(expr, '01234546789');}
  ]);

  // Default constructor
  number = new NumberToken();
  // don't care about numberInfo.expPrefix if !number.exp,
  expr = new RegExp(number.toRegExpStr());
  tester.test([
      'NumberToken(); /* integer */',
      function(t){return t.not(number.prefix);},
      function(t){return t.same(number.numerals, '[0-9]');},
      function(t){return t.not(number.decimal);},
      function(t){return t.not(number.exp);},
      function(t){return t.match(expr, '12345467890');},
      function(t){return t.noMatch(expr, 'abcDEF');},
      function(t){return t.match(expr, '3.14', '3');},
      function(t){return t.noMatch(expr, '0x12ab');},
      function(t){
          // The integer tokenizer matches octals too. Put the octal matcher first!
          return t.match(expr, '01234567');}
  ]);

  // Octal constructor
  number = new NumberToken({prefix: '0', numerals: '[0-7]'});
  // don't care about numberInfo.expFirstChar if !number.exp,
  expr = new RegExp(number.toRegExpStr());
  tester.test([
      "NumberToken({prefix: '0', numerals: '[0-7]'}); /* octal */",
      function(t){return t.same(number.prefix, '0');},
      function(t){return t.same(number.numerals, '[0-7]');},
      function(t){return t.not(number.decimal);},
      function(t){return t.not(number.exp);},
      function(t){return t.noMatch(expr, '01234546789');},
      function(t){return t.noMatch(expr, 'abcDEF');},
      function(t){return t.match(expr, '8.076', '076');},
      function(t){return t.noMatch(expr, '0x12ab');},
      function(t){return t.match(expr, '00');},
      function(t){return t.match(expr, '01234567');}
  ]);

  // Hex constructor
  number = new NumberToken({prefix: '0[xX]', numerals: '[0-9A-Fa-f]'});
  // don't care about numberInfo.expFirstChar if !number.exp,
  expr = new RegExp(number.toRegExpStr());
  tester.test([
      "NumberToken({prefix: '0[xX]', numerals: '[0-9A-Fa-f]'}); /* Hex */",
      function(t){return t.same(number.prefix, '0[xX]');},
      function(t){return t.same(number.numerals, '[0-9A-Fa-f]');},
      function(t){return t.not(number.decimal);},
      function(t){return t.not(number.exp);},
      function(t){return t.noMatch(expr, '0x01234546789abcdefgh');},
      function(t){return t.match(expr, '0x01234546789abcdef');},
      function(t){return t.noMatch(expr, 'abcDEF');},
      function(t){return t.match(expr, '0X12AB');}
  ]);
};

SymbolToken.__test = function(tester) {
  // Default constructor
  var symbol = new SymbolToken();
  var expr = new RegExp(symbol.toRegExpStr());
  tester.test([
      "SymbolToken(); /* normal symbol */",
      function(t){return t.not(symbol.prefix);},
      function(t){return t.same(symbol.firstChar, '[A-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
      function(t){return t.same(symbol.chars, '[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
      function(t){return t.not(symbol.suffix);},
      function(t){return t.match(expr, 'variable');},
      function(t){return t.match(expr, '_123');},
      function(t){return t.match(expr, '124@_456:', '_456');}
  ]);

  // Ruby member variable
  symbol = new SymbolToken({prefix: '@{1,2}'});
  expr = new RegExp(symbol.toRegExpStr());
  tester.test([
      "SymbolToken({prefix: '@{1,2}'}); /* Ruby member or class variable */",
      function(t){return t.same(symbol.prefix, '@{1,2}');},
      function(t){return t.same(symbol.firstChar, '[A-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
      function(t){return t.same(symbol.chars, '[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
      function(t){return t.not(symbol.suffix);},
      function(t){return t.match(expr, '@memberVar');},
      function(t){return t.match(expr, '@@classVar');},
      function(t){return t.noMatch(expr, '_123');},
      function(t){return t.match(expr, '124@_456:', '@_456');}
  ]);

  // Suffixed symbol
  symbol = new SymbolToken({suffix: ':', canNotFollowNumber: ''});
  expr = new RegExp(symbol.toRegExpStr());
  tester.test([
      "SymbolToken({suffix: ':', canNotFollowNumber: ''}); /* Suffixed symbol, anything is allowed after the : */",
      function(t){return t.not(symbol.prefix);},
      function(t){return t.same(symbol.firstChar, '[A-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
      function(t){return t.same(symbol.chars, '[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
      function(t){return t.same(symbol.suffix, ':');},
      function(t){return t.match(expr, 'symbol:');},
      function(t){return t.match(expr, 'symbol:symbol2:', 'symbol:');},
      function(t){return t.noMatch(expr, '@@classVar');},
      function(t){return t.noMatch(expr, '_123');},
      function(t){return t.match(expr, '124@_456:', '_456:');}
  ]);
};

LiteralToken.__test = function(tester) {
  var symbol = new LiteralToken({prefix:'\\"', escape:'\\\\', suffix:'\\"'});
  var expr = new RegExp(symbol.toRegExpStr());
  tester.test([
      "LiteralToken({prefix:'\\\"', escape:'\\\\', suffix:'\\\"'}); /* \" string with \\escape */",
      function(t){return t.same(symbol.prefix, '\\"');},
      function(t){return t.same(symbol.escape, '\\\\');},
      function(t){return t.same(symbol.suffix, '\\"');},
      function(t){return t.match(expr, 'xy"ab \\t\\v \\""cd', '"ab \\t\\v \\""');},
      function(t){return t.noMatch(expr, '"ab \n"');},
  ]);
  symbol = new LiteralToken({prefix:"\\'", suffix:"\\'"});
  expr = new RegExp(symbol.toRegExpStr());
  tester.test([
      "LiteralToken({prefix:\"'\", suffix:\"'\"}); /* ruby style '' strings */",
      function(t){return t.same(symbol.prefix, "\\'");},
      function(t){return t.not(symbol.escape);},
      function(t){return t.same(symbol.suffix, "\\'");},
      function(t){return t.match(expr, "'ab cd ef'", "'ab cd ef'");},
      function(t){return t.match(expr, "xy'ab cd ef'gh", "'ab cd ef'");},
      function(t){return t.match(expr, "empty ''string", "''");},
      function(t){return t.noMatch(expr, "xy'missing final quote");},
  ]);
  symbol = new LiteralToken();
  expr = new RegExp(symbol.toRegExpStr());
  tester.test([
      "LiteralToken(); /* // comment to end of line */",
      function(t){return t.same(symbol.prefix, '\\/\\/');},
      function(t){return t.not(symbol.escape);},
      function(t){return t.same(symbol.suffix, '(?=\\r\\n|\\n|\\r|$)');},
      function(t){return t.match(expr, 'abc // test = more', '// test = more');},
      function(t){return t.match(expr, 'abc // test = more\nend', '// test = more');},
  ]);
  symbol = new LiteralToken({prefix:'<!--', suffix:'-->'});
  expr = new RegExp(symbol.toRegExpStr());
  tester.test([
      "LiteralToken({prefix:'<!--', suffix:'-->''}); /* HTML comment */",
      function(t){return t.same(symbol.prefix, '<!--');},
      function(t){return t.not(symbol.escape);},
      function(t){return t.same(symbol.suffix, '-->');},
      function(t){return t.match(expr,
          '<html><head><!--<title>Commented out</title>--></head><body></body></html>',
          '<!--<title>Commented out</title>-->');},
      function(t){return t.match(expr, '<!---->', '<!---->');},
      function(t){return t.noMatch(expr, '<!--->');},
  ]);
};

Translator.__test = function(tester) {
  var translator = new Translator(['++', '+', '--', '-', '.', ',', '*', ';',
      '//', '/', '(', ')', '{', '}', '%', '!', '===', '==', '=', '+=', '-=',
      '*=', '/='],
      ['float', new NumberToken({decimal: '\\.', exp: '[eE]'}),
      'octal', new NumberToken({prefix: '0', numerals: '[0-7]'}),
      'hex', new NumberToken({prefix: '0[xX]', numerals: '[0-9A-Fa-f]'}),
      'dec', new NumberToken(),
      'symbol', new SymbolToken()], {}, {});

  tester.test([
      "Translator constructor",
      function(t) {return t.same(translator.tokenTypes.length, 9);},
      function(t) {return t.different(translator.tokenizer, null);},
      function(t) {
          var tokens = translator.extractTokens(
                'var x = function(one,two) {\n' +
                '  y = one;\n' +
                '  y += two;\n' +
                '  y += 3.14;\n' +
                '  y += 6.02e+23;\n' +
                '  y += 0xabcd;\n' +
                '  y += 0777;\n' +
                '  return y;\n' +
                '};'
          );

          t.logObjects(JSON.stringify(tokens));
          return t.same(tokens.indexOf(0), -1);
      }

  ]);
};

(new RustyTools.Tester({name: "__test"})).testAll().
    buildDom(
        '<div class="testFrame <-type-/>"><h1><-type-/> - <-count-/></h1><-content-/></div>',
        '<div class="description"><-description-/></div>'+
        '<div class="test"><-test-/>'+
          '<div class="log"><-log-/></div>'+
          '<div class="error"><-error-/></div>'+
          '<div class="exception"><-exception-/></div>'+
        '</div>',
        document.getElementById('report')
);
