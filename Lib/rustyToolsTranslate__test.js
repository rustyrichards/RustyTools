/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Translate.Token.__test = [
	"RustyTools.Translate.Token.__test\n" +
	"Translate.",
	function(t) {
		t.symbols.set('untestableToken', new RustyTools.Translate.Token(["-strange-comment",
				"-immaterial"], 1, 99, "--special--",  1/* line */, 10 /* position */,
				10 /* charPosition */));
		t.symbols.set('testableToken', new RustyTools.Translate.Token("-symbol",
				2, 99, "+",  1/* line */, 10 /* position */,
				10 /* charPosition */,  true /* testable */));
		t.different(t.symbols.get('untestableToken').types, t.symbols.get('testableToken').types).
				same(t.symbols.get('untestableToken').typeNum, t.symbols.get('testableToken').typeNum).
				different(t.symbols.get('untestableToken').str, t.symbols.get('testableToken').str);
	},
	function(t) {
		// Untestable tokens are for whitespace and comments.
		t.not(t.symbols.get('untestableToken').isTestable).different(t.symbols.get('untestableToken').isTestable,
				t.symbols.get('testableToken').isTestable);
	},
	function(t) {
		// Setting and clearing errors.
		t.not(t.symbols.get('testableToken').error);
		t.symbols.get('testableToken').setError("Fake error.");
		t.is(t.symbols.get('testableToken').error).different(t.symbols.get('untestableToken').error,
				t.symbols.get('testableToken').error);
		t.symbols.get('testableToken').clearError();
		t.not(t.symbols.get('testableToken').error).not(t.symbols.get('testableToken').errorMessage);
	},
	function(t) {
		// get...Type
		t.symbols.get('testableToken').activeType = "-addition";

		t.same('symbol addition', t.symbols.get('testableToken').getCombindedClass()).
				same('-addition', t.symbols.get('testableToken').getActiveType()).
				same('strange-comment', t.symbols.get('untestableToken').getCombindedClass()).
				same('-strange-comment', t.symbols.get('untestableToken').getActiveType());
	},
	function(t) {
		// isSame only the .type and .str matter to isSame.
		// (Note .error is not counted.)
		var newToken = new RustyTools.Translate.Token("-symbol", 2, 101,
				"+",  10/* line */, 100 /* position */,
				1000 /* charPosition */);

		// Same as t.symbols.get('testableToken') different from t.symbols.get('untestableToken')
		t.is(newToken.isSame(t.symbols.get('testableToken'))).not(newToken.isSame(t.symbols.get('untestableToken')));
	},
	function(t) {
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
		t.is(whiteToken.noReparse(whiteToken2));
		whiteToken.replace(whiteToken2);
		t.different('whitespace', whiteToken.type).same(10, whiteToken.line);

		// whiteToken to t.symbols.get('testableToken') - need to replace
		t.not(whiteToken.noReparse(t.symbols.get('testableToken')));
		whiteToken.replace(t.symbols.get('testableToken'));
		t.different('whitespace', whiteToken.type).different(10, whiteToken.line);
	},
	"RustyTools.Translate.Token. cleanup" +
	function(t) {
		t.symbols.clear('testableToken').clear('untestableToken');
	}
];

RustyTools.Translate.StateSet.__test = [
	"RustyTools.Translate.StateSet.__test",
	function(t) {
		// NOTE: A real json parser would need to handl [...] too, but
		// that would need more states, then we need for this test.
		var jsonSet = new RustyTools.Translate.StateSet([
			{id: 'jsonName', options:RustyTools.Translate.needsJsonName},
			{id: 'jsonSep', needs: [':']},
			{id: 'jsonStatement', pushIf: ['{', 'jsonName'],
					options: RustyTools.Translate.ganeralStatement, scopeSymbols:true},
			{restartIf: [','], needs: [',', '}'], scopeSymbols:false}
		]);

		// Make sure the null(s) are pushed to the begin and end.
		t.same(null, jsonSet.states[0]).same(null,
				jsonSet.states[jsonSet.states.length - 1]);

		// Make sure indexFomId and fromIndex work
		var state = jsonSet.fromIndex(jsonSet.indexFomId('jsonSep'));
		t.same([':'], state.needs);
	}
];

RustyTools.Translate.StateManager.__test = [
	"RustyTools.Translate.StateManager.__test",
	function(t) {
		// NOTE: A real json parser would need to handl [...] too, but
		// that would need more states, then we need for this test.
		var jsonSet = new RustyTools.Translate.StateSet([
			{id: 'jsonName', options:RustyTools.Translate.needsJsonName},
			{id: 'jsonSep', needs: [':']},
			{id: 'jsonStatement', pushIf: ['{', 'jsonName'],
					options: RustyTools.Translate.ganeralStatement, scopeSymbols:true},
			{restartIf: [','], needs: [',', '}'], scopeSymbols:false}
		]);

		var jsonManager = new RustyTools.Translate.StateManager(jsonSet, 'jsonName');

		var tokens = [
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
		t.is(symbolTable.hasOwnProperty('myProp')).
			not(otherSymbolTable.hasOwnProperty('myProp'));

		// The end state should have no id
		t.not(jsonManager.current.state.id);
	}
];


RustyTools.Translate.NumberToken.__test = [
	"RustyTools.Translate.NumberToken.__test setup" +
	"Translate.NumberToken({decimal: '\\.', exp: '[eE]'}); /* floating point */",
	function(t) {
		var number = new RustyTools.Translate.NumberToken({decimal: '\\.', exp: '[eE]'});
		t.symbols.set('number', number);
		t.symbols.set('expr', new RegExp(number.toRegExpStr()));
	},
	"Translate.NumberToken - floating point tests",
	function(t) {t.not(t.symbols.get('number').prefix);},
	function(t) {t.same(t.symbols.get('number').numerals, '[0-9]');},
	function(t) {t.same(t.symbols.get('number').nonZero, '[1-9]');},
	function(t) {t.same(t.symbols.get('number').decimal, '\\.');},
	function(t) {t.same(t.symbols.get('number').exp, '[eE]');},
	function(t) {t.same(t.symbols.get('number').expPrefix, '[+-]?');},
	function(t) {t.exactMatch(t.symbols.get('expr'), '6.02e+23');},
	function(t) {t.exactMatch(t.symbols.get('expr'), '6.02E23');},
	function(t) {t.exactMatch(t.symbols.get('expr'), '1.1e-100');},
	function(t) {
			// 0 exponent - not a valid number!
			t.noMatch(t.symbols.get('expr'), '1.1e0');},
	function(t) {
			//"A floating point number must have the decimal
			t.noMatch(t.symbols.get('expr'), '01234546789');},

	"RustyTools.Translate.NumberToken.__test setup" +
	"Translate.NumberToken(); /* integer */",
	function(t) {
		var number = new RustyTools.Translate.NumberToken();
		t.symbols.set('number', number);
		t.symbols.set('expr', new RegExp(number.toRegExpStr()));
	},
	"Translate.NumberToken - integer tests",
	function(t) {t.not(t.symbols.get('number').prefix);},
	function(t) {t.same(t.symbols.get('number').numerals, '[0-9]');},
	function(t) {t.not(t.symbols.get('number').decimal);},
	function(t) {t.not(t.symbols.get('number').exp);},
	function(t) {t.exactMatch(t.symbols.get('expr'), '12345467890');},
	function(t) {t.noMatch(t.symbols.get('expr'), 'abcDEF');},
	function(t) {t.match(t.symbols.get('expr'), '3.14', '3');},
	function(t) {t.noMatch(t.symbols.get('expr'), '0x12ab');},
	function(t) {
			// The integer tokenizer matches octals too. Put the octal matcher first!
			t.exactMatch(t.symbols.get('expr'), '01234567');},

	"RustyTools.Translate.NumberToken.__test setup" +
	"Translate.NumberToken({prefix: '0', numerals: '[0-7]'}); /* octal */",
	function(t) {
		var number = new RustyTools.Translate.NumberToken({prefix: '0', numerals: '[0-7]'});
		t.symbols.set('number', number);
		t.symbols.set('expr', new RegExp(number.toRegExpStr()));
	},
	"Translate.NumberToken - octal tests",
	function(t) {t.same(t.symbols.get('number').prefix, '0');},
	function(t) {t.same(t.symbols.get('number').numerals, '[0-7]');},
	function(t) {t.not(t.symbols.get('number').decimal);},
	function(t) {t.not(t.symbols.get('number').exp);},
	function(t) {t.noMatch(t.symbols.get('expr'), '01234546789');},
	function(t) {t.noMatch(t.symbols.get('expr'), 'abcDEF');},
	function(t) {t.match(t.symbols.get('expr'), '8.076', '076');},
	function(t) {t.noMatch(t.symbols.get('expr'), '0x12ab');},
	function(t) {t.exactMatch(t.symbols.get('expr'), '00');},
	function(t) {t.exactMatch(t.symbols.get('expr'), '01234567');},

	"RustyTools.Translate.NumberToken.__test setup" +
	"Translate.NumberToken({prefix: '0[xX]', numerals: '[0-9A-Fa-f]'}); /* Hex */",
	function(t) {
		var number =  new RustyTools.Translate.NumberToken({prefix: '0[xX]', numerals: '[0-9A-Fa-f]'});
		t.symbols.set('number', number);
		t.symbols.set('expr', new RegExp(number.toRegExpStr()));
	},
	"Translate.NumberToken - hex tests",
	function(t) {t.same(t.symbols.get('number').prefix, '0[xX]');},
	function(t) {t.same(t.symbols.get('number').numerals, '[0-9A-Fa-f]');},
	function(t) {t.not(t.symbols.get('number').decimal);},
	function(t) {t.not(t.symbols.get('number').exp);},
	function(t) {t.noMatch(t.symbols.get('expr'), '0x01234546789abcdefgh');},
	function(t) {t.exactMatch(t.symbols.get('expr'), '0x01234546789abcdef');},
	function(t) {t.noMatch(t.symbols.get('expr'), 'abcDEF');},
	function(t) {t.exactMatch(t.symbols.get('expr'), '0X12AB');},

	"Translate.NumberToken - cleanup",
	function(t) {t.symbols.clear('number').clear('expr');},
];


RustyTools.Translate.SymbolToken.__test = [
	"RustyTools.Translate.SymbolToken.__test setup\n" +
	"Translate.SymbolToken(); /* normal symbol */",
	function(t) {
		var symbol =  new RustyTools.Translate.SymbolToken();
		t.symbols.set('symbol', symbol);
		t.symbols.set('expr', new RegExp(symbol.toRegExpStr()));
	},
	"Translate.SymbolToken - normal symbol tests",
	function(t) {t.not(t.symbols.get('symbol').prefix);},
	function(t) {t.same(t.symbols.get('symbol').firstChar, '[A-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
	function(t) {t.same(t.symbols.get('symbol').chars, '[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
	function(t) {t.not(t.symbols.get('symbol').suffix);},
	function(t) {t.exactMatch(t.symbols.get('expr'), 'variable');},
	function(t) {t.exactMatch(t.symbols.get('expr'), '_123');},
	function(t) {t.match(t.symbols.get('expr'), '124@_456:', '_456');},

	"RustyTools.Translate.SymbolToken.__test setup\n" +
	"Translate.SymbolToken({prefix: '@{1,2}'}); /* Ruby member or class variable */",
	function(t) {
		var symbol = new RustyTools.Translate.SymbolToken({prefix: '@{1,2}'});
		t.symbols.set('symbol',  symbol);
		t.symbols.set('expr', new RegExp(symbol.toRegExpStr()));
	},
	"Translate.SymbolToken - ruby member or class tests",
	function(t) {t.same(t.symbols.get('symbol').prefix, '@{1,2}');},
	function(t) {t.same(t.symbols.get('symbol').firstChar, '[A-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
	function(t) {t.same(t.symbols.get('symbol').chars, '[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
	function(t) {t.not(t.symbols.get('symbol').suffix);},
	function(t) {t.exactMatch(t.symbols.get('expr'), '@memberVar');},
	function(t) {t.exactMatch(t.symbols.get('expr'), '@@classVar');},
	function(t) {t.noMatch(t.symbols.get('expr'), '_123');},
	function(t) {t.match(t.symbols.get('expr'), '124@_456:', '@_456');},

	"RustyTools.Translate.SymbolToken.__test setup\n" +
	"Translate.SymbolToken({suffix: ':', canNotFollowNumber: ''}); /* Suffixed symbol, anything is allowed after the : */",
	function(t) {
		var symbol = new RustyTools.Translate.SymbolToken({suffix: ':', canNotFollowNumber: ''});
		t.symbols.set('symbol',  symbol);
		t.symbols.set('expr', new RegExp(symbol.toRegExpStr()));
	},
	"Translate.SymbolToken - suffix tests",
	function(t) {t.not(t.symbols.get('symbol').prefix);},
	function(t) {t.same(t.symbols.get('symbol').firstChar, '[A-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
	function(t) {t.same(t.symbols.get('symbol').chars, '[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]');},
	function(t) {t.same(t.symbols.get('symbol').suffix, ':');},
	function(t) {t.exactMatch(t.symbols.get('expr'), 'symbol:');},
	function(t) {t.match(t.symbols.get('expr'), 'symbol:symbol2:', 'symbol:');},
	function(t) {t.noMatch(t.symbols.get('expr'), '@@classVar');},
	function(t) {t.noMatch(t.symbols.get('expr'), '_123');},
	function(t) {t.match(t.symbols.get('expr'), '124@_456:', '_456:');},

	"Translate.SymbolToken - cleanup",
	function(t) {t.symbols.clear('number').clear('expr');},
];

RustyTools.Translate.LiteralToken.__test = [
	"RustyTools.Translate.LiteralToken.__test setup\n" +
	"Translate.LiteralToken({prefix:'\"', escape:'\\\\', suffix:'\"'}); /* \" string with \\escape */",
	function(t) {
		var symbol = new RustyTools.Translate.LiteralToken({prefix:'"', escape:'\\\\', suffix:'"'});
		t.symbols.set('symbol',  symbol);
		t.symbols.set('expr', new RegExp(symbol.toRegExpStr()));
	},
	"Translate.LiteralToken - \" string with \\escape tests",
	function(t) {t.same(t.symbols.get('symbol').prefix, '"');},
	function(t) {t.same(t.symbols.get('symbol').escape, '\\\\');},
	function(t) {t.same(t.symbols.get('symbol').suffix, '"');},
	function(t) {t.match(t.symbols.get('expr'), 'xy"ab \\t\\v \\""cd', '"ab \\t\\v \\""');},
	function(t) {t.noMatch(t.symbols.get('expr'), '"ab \\"');},

	"RustyTools.Translate.LiteralToken.__test setup\n" +
	"Translate.LiteralToken({prefix: \"'\", suffix: \"'\"}); /* ruby style '' strings */",
	function(t) {
		var symbol = new RustyTools.Translate.LiteralToken({prefix:"'", suffix:"'"});
		t.symbols.set('symbol',  symbol);
		t.symbols.set('expr', new RegExp(symbol.toRegExpStr()));
	},
	"Translate.LiteralToken - ruby style string tests",
	function(t) {t.same(t.symbols.get('symbol').prefix, "'");},
	function(t) {t.not(t.symbols.get('symbol').escape);},
	function(t) {t.same(t.symbols.get('symbol').suffix, "'");},
	function(t) {t.match(t.symbols.get('expr'), "'ab cd ef'", "'ab cd ef'");},
	function(t) {t.match(t.symbols.get('expr'), "xy'ab cd ef'gh", "'ab cd ef'");},
	function(t) {t.match(t.symbols.get('expr'), "empty ''string", "''");},
	function(t) {t.noMatch(t.symbols.get('expr'), "xy'missing final quote");},

	"RustyTools.Translate.LiteralToken.__test setup\n" +
	"Translate.LiteralToken(); /* // comment to end of line */",
	function(t) {
		var symbol = new RustyTools.Translate.LiteralToken();
		t.symbols.set('symbol',  symbol);
		t.symbols.set('expr', new RegExp(symbol.toRegExpStr()));
	},
	"Translate.LiteralToken - comment to end of line tests",
	function(t) {t.same(t.symbols.get('expr').prefix, '\\/\\/');},
	function(t) {t.not(t.symbols.get('expr').escape);},
	function(t) {t.same(t.symbols.get('expr').suffix, '(?=\\t\\n|\\n|\\t|$)');},
	function(t) {t.match(t.symbols.get('expr'), 'abc // test = more', '// test = more');},
	function(t) {t.match(t.symbols.get('expr'), 'abc // test = more\nend', '// test = more');},

	"RustyTools.Translate.LiteralToken.__test setup\n" +
	"Translate.LiteralToken({prefix:'<!--', suffix:'-->''}); /* HTML comment */",
	function(t) {
		var symbol = new RustyTools.Translate.LiteralToken({prefix:'<!--', suffix:'-->'});
		t.symbols.set('symbol',  symbol);
		t.symbols.set('expr', new RegExp(symbol.toRegExpStr()));
	},
	"Translate.LiteralToken - <!-- ... --> tests",
	function(t) {t.same(t.symbols.get('expr').prefix, '<!--');},
	function(t) {t.not(t.symbols.get('expr').escape);},
	function(t) {t.same(t.symbols.get('expr').suffix, '-->');},
	function(t) {t.match(t.symbols.get('expr'),
			'<html><head><!--<title>Commented out</title>--></head><body></body></html>',
			'<!--<title>Commented out</title>-->');},
	function(t) {t.match(t.symbols.get('expr'), '<!---->', '<!---->');},
	function(t) {t.noMatch(t.symbols.get('expr'), '<!--->');},

	"Translate.LiteralToken - cleanup",
	function(t) {t.symbols.clear('number').clear('expr');},
];

// RustyTools.Translate.__test
// and  RustyTools.Translate
//
// Test these with the syntax/language file.
// This could make and test a fake grammar, but that doesn't do a lot to help
// grammar testers.
