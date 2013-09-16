// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Translate.NumberToken.__test = function(t, r) {
	// Decimal constructor
	var number = new RustyTools.Translate.NumberToken({decimal: '\\.', exp: '[eE]'});
	var expr = new RegExp(number.toRegExpStr());
	t.test([
			"RustyTools.Translate.NumberToken.__test\n" +
			"Translate.NumberToken({decimal: '\\.', exp: '[eE]'}); /* floating point */",
			function(t, r) {r.not(number.prefix);},
			function(t, r) {r.same(number.numerals, '[0-9]');},
			function(t, r) {r.same(number.nonZero, '[1-9]');},
			function(t, r) {r.same(number.decimal, '\\.');},
			function(t, r) {r.same(number.exp, '[eE]');},
			function(t, r) {r.same(number.expPrefix, '[+-]?');},
			function(t, r) {r.exactMatch(expr, '6.02e+23');},
			function(t, r) {r.exactMatch(expr, '6.02E23');},
			function(t, r) {r.exactMatch(expr, '1.1e-100');},
			function(t, r) {
					// 0 exponent - not a valid number!
					r.noMatch(expr, '1.1e0');},
			function(t, r) {
					//"A floating point number must have the decimal
					r.noMatch(expr, '01234546789');}
	]);

	// Default constructor
	number = new RustyTools.Translate.NumberToken();
	// don't care about numberInfo.expPrefix if !number.exp,
	expr = new RegExp(number.toRegExpStr());
	t.test([
			"Translate.NumberToken(); /* integer */",
			function(t, r) {r.not(number.prefix);},
			function(t, r) {r.same(number.numerals, '[0-9]');},
			function(t, r) {r.not(number.decimal);},
			function(t, r) {r.not(number.exp);},
			function(t, r) {r.exactMatch(expr, '12345467890');},
			function(t, r) {r.noMatch(expr, 'abcDEF');},
			function(t, r) {r.match(expr, '3.14', '3');},
			function(t, r) {r.noMatch(expr, '0x12ab');},
			function(t, r) {
					// The integer tokenizer matches octals too. Put the octal matcher first!
					r.exactMatch(expr, '01234567');}
	]);

	// Octal constructor
	number = new RustyTools.Translate.NumberToken({prefix: '0', numerals: '[0-7]'});
	// don't care about numberInfo.expFirstChar if !number.exp,
	expr = new RegExp(number.toRegExpStr());
	t.test([
			"Translate.NumberToken({prefix: '0', numerals: '[0-7]'}); /* octal */",
			function(t, r) {r.same(number.prefix, '0');},
			function(t, r) {r.same(number.numerals, '[0-7]');},
			function(t, r) {r.not(number.decimal);},
			function(t, r) {r.not(number.exp);},
			function(t, r) {r.noMatch(expr, '01234546789');},
			function(t, r) {r.noMatch(expr, 'abcDEF');},
			function(t, r) {r.match(expr, '8.076', '076');},
			function(t, r) {r.noMatch(expr, '0x12ab');},
			function(t, r) {r.exactMatch(expr, '00');},
			function(t, r) {r.exactMatch(expr, '01234567');}
	]);

	// Hex constructor
	number = new RustyTools.Translate.NumberToken({prefix: '0[xX]', numerals: '[0-9A-Fa-f]'});
	// don't care about numberInfo.expFirstChar if !number.exp,
	expr = new RegExp(number.toRegExpStr());
	t.test([
			"Translate.NumberToken({prefix: '0[xX]', numerals: '[0-9A-Fa-f]'}); /* Hex */",
			function(t, r) {r.same(number.prefix, '0[xX]');},
			function(t, r) {r.same(number.numerals, '[0-9A-Fa-f]');},
			function(t, r) {r.not(number.decimal);},
			function(t, r) {r.not(number.exp);},
			function(t, r) {r.noMatch(expr, '0x01234546789abcdefgh');},
			function(t, r) {r.exactMatch(expr, '0x01234546789abcdef');},
			function(t, r) {r.noMatch(expr, 'abcDEF');},
			function(t, r) {r.exactMatch(expr, '0X12AB');}
	]);
};

RustyTools.Translate.SymbolToken.__test = function(t, r) {
	// Default constructor
	var symbol = new RustyTools.Translate.SymbolToken();
	var expr = new RegExp(symbol.toRegExpStr());
	t.test([
			"RustyTools.Translate.SymbolToken.__test\n" +
			"Translate.SymbolToken(); /* normal symbol */",
			function(t, r) {r.not(symbol.prefix);},
			function(t, r) {r.same(symbol.firstChar, '[A-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
			function(t, r) {r.same(symbol.chars, '[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
			function(t, r) {r.not(symbol.suffix);},
			function(t, r) {r.exactMatch(expr, 'variable');},
			function(t, r) {r.exactMatch(expr, '_123');},
			function(t, r) {r.match(expr, '124@_456:', '_456');}
	]);

	// Ruby member variable
	symbol = new RustyTools.Translate.SymbolToken({prefix: '@{1,2}'});
	expr = new RegExp(symbol.toRegExpStr());
	t.test([
			"Translate.SymbolToken({prefix: '@{1,2}'}); /* Ruby member or class variable */",
			function(t, r) {r.same(symbol.prefix, '@{1,2}');},
			function(t, r) {r.same(symbol.firstChar, '[A-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
			function(t, r) {r.same(symbol.chars, '[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
			function(t, r) {r.not(symbol.suffix);},
			function(t, r) {r.exactMatch(expr, '@memberVar');},
			function(t, r) {r.exactMatch(expr, '@@classVar');},
			function(t, r) {r.noMatch(expr, '_123');},
			function(t, r) {r.match(expr, '124@_456:', '@_456');}
	]);

	// Suffixed symbol
	symbol = new RustyTools.Translate.SymbolToken({suffix: ':', canNotFollowNumber: ''});
	expr = new RegExp(symbol.toRegExpStr());
	t.test([
			"Translate.SymbolToken({suffix: ':', canNotFollowNumber: ''}); /* Suffixed symbol, anything is allowed after the : */",
			function(t, r) {r.not(symbol.prefix);},
			function(t, r) {r.same(symbol.firstChar, '[A-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
			function(t, r) {r.same(symbol.chars, '[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
			function(t, r) {r.same(symbol.suffix, ':');},
			function(t, r) {r.exactMatch(expr, 'symbol:');},
			function(t, r) {r.match(expr, 'symbol:symbol2:', 'symbol:');},
			function(t, r) {r.noMatch(expr, '@@classVar');},
			function(t, r) {r.noMatch(expr, '_123');},
			function(t, r) {r.match(expr, '124@_456:', '_456:');}
	]);
};

RustyTools.Translate.LiteralToken.__test = function(t, r) {
	var symbol = new RustyTools.Translate.LiteralToken({prefix:'"', escape:'\\\\', suffix:'"'});
	var expr = new RegExp(symbol.toRegExpStr());
	t.test([
			"RustyTools.Translate.LiteralToken.__test\n" +
			"Translate.LiteralToken({prefix:'\"', escape:'\\\\', suffix:'\"'}); /* \" string with \\escape */",
			function(t, r) {r.same(symbol.prefix, '"');},
			function(t, r) {r.same(symbol.escape, '\\\\');},
			function(t, r) {r.same(symbol.suffix, '"');},
			function(t, r) {r.match(expr, 'xy"ab \\t\\v \\""cd', '"ab \\t\\v \\""');},
			function(t, r) {r.noMatch(expr, '"ab \\"');},
	]);
	symbol = new RustyTools.Translate.LiteralToken({prefix:"'", suffix:"'"});
	expr = new RegExp(symbol.toRegExpStr());
	t.test([
			"Translate.LiteralToken({prefix: \"'\", suffix: \"'\"}); /* ruby style '' strings */",
			function(t, r) {r.same(symbol.prefix, "'");},
			function(t, r) {r.not(symbol.escape);},
			function(t, r) {r.same(symbol.suffix, "'");},
			function(t, r) {r.match(expr, "'ab cd ef'", "'ab cd ef'");},
			function(t, r) {r.match(expr, "xy'ab cd ef'gh", "'ab cd ef'");},
			function(t, r) {r.match(expr, "empty ''string", "''");},
			function(t, r) {r.noMatch(expr, "xy'missing final quote");},
	]);
	symbol = new RustyTools.Translate.LiteralToken();
	expr = new RegExp(symbol.toRegExpStr());
	t.test([
			"Translate.LiteralToken(); /* // comment to end of line */",
			function(t, r) {r.same(symbol.prefix, '\\/\\/');},
			function(t, r) {r.not(symbol.escape);},
			function(t, r) {r.same(symbol.suffix, '(?=\\r\\n|\\n|\\r|$)');},
			function(t, r) {r.match(expr, 'abc // test = more', '// test = more');},
			function(t, r) {r.match(expr, 'abc // test = more\nend', '// test = more');},
	]);
	symbol = new RustyTools.Translate.LiteralToken({prefix:'<!--', suffix:'-->'});
	expr = new RegExp(symbol.toRegExpStr());
	t.test([
			"Translate.LiteralToken({prefix:'<!--', suffix:'-->''}); /* HTML comment */",
			function(t, r) {r.same(symbol.prefix, '<!--');},
			function(t, r) {r.not(symbol.escape);},
			function(t, r) {r.same(symbol.suffix, '-->');},
			function(t, r) {r.match(expr,
					'<html><head><!--<title>Commented out</title>--></head><body></body></html>',
					'<!--<title>Commented out</title>-->');},
			function(t, r) {r.match(expr, '<!---->', '<!---->');},
			function(t, r) {r.noMatch(expr, '<!--->');},
	]);
};

RustyTools.Translate.__test = function(t, r) {
	var translate = new RustyTools.Translate(['++', '+', '--', '-', '.', ',', '*', ';',
			'//', '/', '%', '!', '===', '=='],
			['=', '+=', '-=','*=', '/='],	// assignment
			['{', '}', '(', ')', '[', ']'], // grouping
			['blockComment',  new RustyTools.Translate.LiteralToken({prefix:'/\\*', suffix:'\\*/'}),
			'comment',  new RustyTools.Translate.LiteralToken(),
			'float', new RustyTools.Translate.NumberToken({decimal: '\\.', exp: '[eE]'}),
			'octal', new RustyTools.Translate.NumberToken({prefix: '0', numerals: '[0-7]'}),
			'hex', new RustyTools.Translate.NumberToken({prefix: '0[xX]', numerals: '[0-9A-Fa-f]'}),
			'dec', new RustyTools.Translate.NumberToken(),
			'symbol', new RustyTools.Translate.SymbolToken()]);

	t.test([
			"RustyTools.Translate.__test\n" +
			"Translate.extractTokens",
			function(t, r) {r.same(translate.tokenTypes.length, 13);},
			function(t, r) {r.different(translate.tokenizer, null);},
			function(t, r) {
					var tokens = translate.extractTokens(
								'/*\n' +
								'Block comment\n' +
								'*/\n' +
								'var x = function(one,two) {\n' +
								'  y = one;  // Start at one\n' +
								'  y += two;\n' +
								'  y += 3.14;\n' +
								'  y += 6.02e+23;\n' +
								'  y += 0xabcd;\n' +
								'  y += 0777;\n' +
								'  return y;\n' +
								'};'
					);

					r.logObjects(JSON.stringify(tokens));
					r.same(tokens.indexOf(0), -1);
			}

	]);
};
