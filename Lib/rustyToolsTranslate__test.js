/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Translate.Token.__test = function(t, r) {
	// Decimal constructor
	var testableToken;
	var untestableToken;
	t.test([
			"RustyTools.Translate.Token.__test\n" +
			"Translate.",
			function(t, r) {
				untestableToken = new RustyTools.Translate.Token(["-strange-comment",
						"-immaterial"], 1, 99, "--special--",  1/* line */, 10 /* position */,
						10 /* charPosition */);
				testableToken = new RustyTools.Translate.Token("-symbol", 2, 99,
						"+",  1/* line */, 10 /* position */,
						10 /* charPosition */,  true /* testable */);
				r.different(untestableToken.types, testableToken.types).
						same(untestableToken.typeNum, testableToken.typeNum).
						different(untestableToken.str, testableToken.str);
			},
			function(t, r) {
				// Untestable tokens are for whitespace and comments.
				r.not(untestableToken.isTestable).different(untestableToken.isTestable,
						testableToken.isTestable);
			},
			function(t, r) {
				// Setting and clearing errors.
				r.not(testableToken.error);
				testableToken.setError("Fake error.");
				r.is(testableToken.error).different(untestableToken.error,
						testableToken.error);
				testableToken.clearError();
				r.not(testableToken.error).not(testableToken.errorMessage);
			},
			function(t, r) {
				// get...Type
				testableToken.activeType = "-addition";

				r.same('symbol addition', testableToken.getCombindedClass()).
						same('-addition', testableToken.getActiveType()).
						same('strange-comment', untestableToken.getCombindedClass()).
						same('-strange-comment', untestableToken.getActiveType());
			},
			function(t, r) {
				// isSame only the .type and .str matter to isSame.
				// (Note .error is not counted.)
				var newToken = new RustyTools.Translate.Token("-symbol", 2, 101,
						"+",  10/* line */, 100 /* position */,
						1000 /* charPosition */);

				// Same as testableToken different from untestableToken
				r.is(newToken.isSame(testableToken)).not(newToken.isSame(untestableToken));
			},
			function(t, r) {
				// noReparse and replace.
				var whiteToken = new RustyTools.Translate.Token(["whitespace",
						"-immaterial"], 1, 101,
						" ",  10/* line */, 100 /* position */,
						1000 /* charPosition */);
				var whiteToken2 = new RustyTools.Translate.Token(["comment",
						"-immaterial"], 1, 111,
						"/* test */",  11/* line */, 121 /* position */,
						1221 /* charPosition */);

				// whiteToken to whiteToken2 - no need to re-parse.
				// Replace whiteToken with whiteToken2, whiteToken's line does not change
				r.is(whiteToken.noReparse(whiteToken2));
				whiteToken.replace(whiteToken2);
				r.different('whitespace', whiteToken.type).same(10, whiteToken.line);

				// whiteToken to testableToken - need to replace
				r.not(whiteToken.noReparse(testableToken));
				whiteToken.replace(testableToken);
				r.different('whitespace', whiteToken.type).different(10, whiteToken.line);
			}
	]);
};

RustyTools.Translate.StateSet.__test = function(t, r) {
	var jsonSet;
	t.test([
			"RustyTools.Translate.StateSet.__test",
			function(t, r) {
				// NOTE: A real json parser would need to handl [...] too, but
				// that would need more states, then we need for this test.
				jsonSet = new RustyTools.Translate.StateSet([
					{id: 'jsonName', options:RustyTools.Translate.needsJsonName},
					{id: 'jsonSep', needs: [':']},
					{id: 'jsonStatement', pushIf: ['{', 'jsonName'],
							options: RustyTools.Translate.ganeralStatement, scopeSymbols:true},
					{restartIf: [','], needs: [',', '}'], scopeSymbols:false}
				]);

				// Make sure the null(s) are pushed to the begin and end.
				r.same(null, jsonSet.states[0]).same(null,
						jsonSet.states[jsonSet.states.length - 1]);

				// Make sure indexFomId and fromIndex work
				var state = jsonSet.fromIndex(jsonSet.indexFomId('jsonSep'));
				r.same([':'], state.needs);
			}
	]);
};

RustyTools.Translate.StateManager.__test = function(t, r) {
	var jsonSet;
	var jsonManager;
	var tokens;
	t.test([
			"RustyTools.Translate.StateManager.__test",
			function(t, r) {
				// NOTE: A real json parser would need to handl [...] too, but
				// that would need more states, then we need for this test.
				jsonSet = new RustyTools.Translate.StateSet([
					{id: 'jsonName', options:RustyTools.Translate.needsJsonName},
					{id: 'jsonSep', needs: [':']},
					{id: 'jsonStatement', pushIf: ['{', 'jsonName'],
							options: RustyTools.Translate.ganeralStatement, scopeSymbols:true},
					{restartIf: [','], needs: [',', '}'], scopeSymbols:false}
				]);

				jsonManager = new RustyTools.Translate.StateManager(jsonSet, 'jsonName');

				tokens = [
					new RustyTools.Translate.Token("string", 2, "name1", 1, 1, 1, true),
					new RustyTools.Translate.Token("punctuation", 1, ":", 1, 10, 10, true),
					new RustyTools.Translate.Token("number", 3, "1.1", 1, 20, 20, true),
					new RustyTools.Translate.Token("punctuation", 1, ",", 1, 30, 30, true),

					new RustyTools.Translate.Token("string", 2, "name2", 2, 1, 40, true),
					new RustyTools.Translate.Token("punctuation", 1, ":", 2, 10, 50, true),
					RustyTools.addOneLevel(
						new RustyTools.Translate.Token("grouping", 4, "{", 2, 20, 60, true),
						{groupingCount: 1, closer: '}'}
					),
					new RustyTools.Translate.Token("string", 2, "name3", 2, 1, 70, true),
					new RustyTools.Translate.Token("punctuation", 1, ":", 2, 10, 80, true),
					new RustyTools.Translate.Token("number", 3, "3.3", 1, 20, 90, true),
					new RustyTools.Translate.Token("punctuation", 1, ",", 1, 30, 100, true),

					new RustyTools.Translate.Token("string", 2, "name4", 2, 1, 110, true),
					new RustyTools.Translate.Token("punctuation", 1, ":", 2, 10, 120, true),
					new RustyTools.Translate.Token("number", 3, "4.4", 1, 20, 130, true),
					RustyTools.addOneLevel(
						new RustyTools.Translate.Token("grouping", 4, "}", 2, 20, 140, true),
						{groupingCount: 1}
					),
				];

				var symbolTable = {myProp: 'test'};	// Empty except for myProp
				var otherSymbolTable;
				// stateManager does not automatically advance on strings or numbers or
				// symbols.  Force that here,
				for (var i=0; i<tokens.length; i++) {
					var token = tokens[i];
					var newSymbolTable = jsonManager.handleScope(token, symbolTable);
					if (symbolTable !== newSymbolTable) {
						symbolTable = newSymbolTable;
						if (!otherSymbolTable) otherSymbolTable = newSymbolTable;
					}
					if ('string' === token.type || 'number' === token.type) {
						jsonManager.advance();
					} else {
						var newSymbolTable = jsonManager.transitionOnToken(token, symbolTable);
						if (symbolTable !== newSymbolTable) {
							symbolTable = newSymbolTable;
							if (!otherSymbolTable) otherSymbolTable = newSymbolTable;
						}
					}
				}

				// If the stateManager worked symbolTable should have wrapped and unwrapped.
				// otherSymbolTable will hold a reference to the wrapped symbol table.
				r.is(symbolTable.hasOwnProperty('myProp')).
					not(otherSymbolTable.hasOwnProperty('myProp'));

				// The end state should have no id
				r.not(jsonManager.current.state.id);
			}
	]);
};

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

// RustyTools.Translate.__test
// and  RustyTools.Translate
//
// Test these with the syntax/language file.
// This could make and test a fake grammar, but that doesn't do a lot to help
// grammar testers.
