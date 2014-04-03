/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global RustyTools */

// Javascript parsing

// The javascript language is almost flat; the variables are not block scoped.
// These combinations mater inside andd outside of a function, a switch, and
// a do/while loop.  Instead of making a tree of the language.  These
// states are handled by testing context.functionStack, context.loopStack, and
// context.switchStack

// The Object Notation / JSON is only for JavaScript.
RustyTools.Translate.types.colon = ["-jsonSep", "-conditional"];

var javaScriptStates = new RustyTools.Translate.StateSet([
	// General statements
	null,
	{
		id: "statement",
		allowed: {
			"arguments": RustyTools.Translate.StateManager.flags.insideFunction,
			"-groupStart": 1,
			"break": RustyTools.Translate.StateManager.flags.insideSwitch,
			"case": RustyTools.Translate.StateManager.flags.insideSwitch,
			"do": 1, "for": 1,
			"function": 1, "if": 1,
			"switch" : 1, "try": 1,
			"var": 1, "while": 1,
			"-assignment": 1, "-alteration": 1,
			"-value": 1, "-variable": 1, "-global": 1,
			";": 1, ",": 1
		},
		pushIf: {
			"-groupStart": "statement", "case": "caseNeedsValue",
			"do": "doDefinition", "for": "forDefitition",
			"function": "functionDef", "if": "ifDefinition",
			"switch" : "switchDefinition", "try": "tryDefinition",
			"var": "varStatement", "while": "whileDefinition",
			"-assignment": "needsValue", "-alteration": "needsValue",
			"-value": "hasVar", "-variable": "hasVar", "-global": "hasVar"

		},
		restartIf: {";": true, ",": true},
		options: RustyTools.Translate.ganeralStatement,
		jump: 0	// loop forever in statement
	},
	null,

	// If we encounter a varibale in general statement push to hasVar
	{
		id: "hasVar",
		allowed: {
			"{": 1, "(": 1, ".": 1, "[": 1, "-assignment": 1,
			"-alteration": 1, ",": 1, ";": 1
		},
		pushIf: {
			"{": "statement", "(": "arg", ".": "memberAccess",
			"[": "oneArg", "-assignment": "needsValue", "-alteration": "needsValue"
		},
		popIf: {",": true, ";": true},
		options: RustyTools.Translate.hasVar
	},	// Can assign to the variable
	null,

	// Accessing an object"s members. (Array access is allowee here too.)
	{id: "memberAccess", options: RustyTools.Translate.anySymbolName},
	{
		id: "memberNext",
		allowed: {".": 1, "[": 1},
		bypassIfNot: {",": true, ";": true},
		restartIf: {".": true},
		pushif: {"[": "oneArg"}
	},
	null,

	// If we encounter an assignment in RustyTools.Translate.hasVar push to needsValue
	// NOTE: a "{" following an assignment goes into objectNotation (JSON)
	{
		id: "needsValue",
		allowed: {"{": 1, "(": 1,	"function": 1,
			"-global": 1, "-parameter": 1, "-value": 1, "-variable": 1,
			"-string": 1, "-number": 1},
		pushIf: {"{": "jsonName", "(": "statement",	"function": "functionDef"},
		options: RustyTools.Translate.needsRValue,	// Something to assign
	},
	{
		id: "valueStatement",
		allowed: {"(": 1, ".": 1, "[": 1},
		pushIf: {"(": "arg", ".": "memberAccess", "[": "oneArg"},
		bypassIfNot: {"(": true, ".": true, "[": true},
		options: RustyTools.Translate.ganeralStatement
	},
	null,	// pop when we have the value

	// Single general statements
	{
		id: "oneStatement",
		allowed: {
			"arguments": RustyTools.Translate.StateManager.flags.insideFunction,
			"-groupStart": 1,
			"case": RustyTools.Translate.StateManager.flags.insideSwitch,
			"do": 1, "for": 1,
			"function": 1, "if": 1,
			"switch" : 1, "try": 1,
			"var": 1, "while": 1,
			"-assignment": 1, "-alteration": 1,
			"-value": 1, "-variable": 1, "-global": 1,
			"{": 1, "(": 1, ";": 1, ",": 1
		},
		pushIf: {
			"-groupStart": "statement",
			"do": "doDefinition", "for": "forDefitition",
			"function": "functionDef", "if": "ifDefinition",
			"switch" : "switchDefinition", "try": "tryDefinition",
			"var": "varStatement", "while": "whileDefinition",
			"-assignment": "needsValue", "-alteration": "needsValue",
			"-value": "hasVar", "-variable": "hasVar", "-global": "hasVar",
			"{": "statement", "(": "statement"
		},
		restartIf: {",": true},
		popIf: {";": true},
		options: RustyTools.Translate.ganeralStatement
	},
	null,

	// Only a single argument. (Like in array access, io an if statement.)
	{
		id: "oneArg",
		allowed: {"{": 1, "(": 1,	"function": 1,
			"-global": 1, "-parameter": 1, "-value": 1, "-variable": 1,
			"-string": 1, "-number": 1},
		pushIf: {"{": "jsonName", "(": "statement",	"function": "functionDef"},
		options: RustyTools.Translate.needsRValue
	},
	{
		id: "oneArgHasValue", restartIf: {",": true},
		pushIf: {"[": "oneArg", "(": "arg", ".": "memberAccess"},
		allowed: {",": 1, "{": 1, "(": 1, ".": 1},	// The closing '}' or ']' will pop
		restartIf: {",": true},
		options: RustyTools.Translate.hasRValue	// Must be a comma or a state pop
	},	// Must be a comma or a state pop
	null,

	// Argument or argument list.
	{
		id: "arg",
		allowed: {"{": 1, "(": 1,	"function": 1,
			"-global": 1, "-parameter": 1, "-value": 1, "-variable": 1,
			"-string": 1, "-number": 1},
		pushIf: {"{": "jsonName", "(": "statement",	"function": "functionDef"},
		options: RustyTools.Translate.needsRValue},
	{
		id: "argHasValue",
		pushIf: {"[": "oneArg", "(": "arg", ".": "memberAccess"},
		allowed: {",": 1, "{": 1, "(": 1, ".": 1},	// The closing '}' will pop
		restartIf: {",": true},
		options: RustyTools.Translate.hasRValue	// Must be a comma or a state pop
	},
	null,

	// Function argument list.  These args define as parameters.
	{
		id: "functionParam",
		pushIf: {"{": "statement", "(": "statement"},
		options: RustyTools.Translate.paramDef},
	{
		id: "functionParamHasValue",
		allowed: {"{": 1, "(": 1, "[": 1, ",": 1},
		pushIf: {"{": "statement", "(": "statement", "[": "oneArg"},
		restartIf: {",": true},
		options: RustyTools.Translate.hasVar	// Must be a comma or a state pop
	},
	null,

	// Object notation statement
	{id: "jsonName", options:RustyTools.Translate.needsJsonName},
	{id: "jsonSep", allowed: {":": 1}},
	{
		id: "jsonStatement",
		pushIf: {"{": "jsonName", "(": "statement", "[": "jsonArray"},
		restartIf: {",": true},
		options: RustyTools.Translate.ganeralStatement
	},
	null,

	// jsonArray - like an argument list except it stays in Object Notation.
	{
		id: "jsonArray",
		allowed: {"{": 1, "[": 1,	"function": 1,
			"-global": 1, "-parameter": 1, "-value": 1, "-variable": 1,
			"-string": 1, "-number": 1},
		pushIf: {"{": "jsonName", "[": "jsonArray",	"function": "functionDef"},
		options: RustyTools.Translate.needsRValue
	},
	{
		id: "jsonArrayItem",
		pushIf: {"[": "oneArg", "(": "arg", ".": "memberAccess"},
		allowed: {",": 1, "{": 1, "(": 1, ".": 1},	// The closing '}' will pop
		restartIf: {",": true},
		options: RustyTools.Translate.hasRValue	// Must be a comma or a state pop
	},
	null,

	// A function may define a name or be anonymous. jumpIf: {"(", 1} steps to the next state
	{
		id: "functionDef",
		bypassIf: {"(": 1},
		options: RustyTools.Translate.varDef
	},
	{id: "functionBeforeArg", allowed: {"(": 1}, pushIf: {"(": "functionParam"}, scopeSymbols:true},
	{
		id: "functionBeforeBlock",
		allowed: {"{": 1},
		pushIf: {"{": "statement"},
		setFlag: RustyTools.Translate.StateManager.flags.insideFunction,
	},
	{pop: true, scopeSymbols: false},
	null,

	{id: "varStatement", options: RustyTools.Translate.varDef},
	{id: "varDefined", allowed: {",": 1, ";": 1, "-assignment": 1},
			restartIf: {",": true}, popIf: {";": true},
			pushIf: {"-assignment": "needsValue"}, options: RustyTools.Translate.hasNewVar},
	null,

	{id: "swtichNeedsArg", allowed: {"(": 1}, pushIf: {"(": "oneArg"}},
	{id: "switchBeforeBody", allowed: {"{": 1}, pushIf: {"{": "statement"}},
	null,

	// case statnment
	{
		id: "caseNeedsValue",
		allowed: {"{": 1, "(": 1,	"function": 1,
			"-global": 1, "-parameter": 1, "-value": 1, "-variable": 1,
			"-string": 1, "-number": 1},
		pushIf: {"{": "jsonName", "(": "statement",	"function": "functionDef"},
		options: RustyTools.Translate.needsRValue
	},
	{
		id: "caseHasValue",
		pushIf: {"[": "oneArg", "(": "arg", ".": "memberAccess"},
		allowed: {",": 1, "{": 1, "(": 1, ".": 1, ":": 1},
		restartIf: {",": true},
		popIf: {":": true},
		options: RustyTools.Translate.hasRValue	// Must be a comma or a state pop
	},
	null,

	// Conditional statement first half
	{
		id: "condNeedsFirst",
		allowed: {"{": 1, "(": 1,	"function": 1,
			"-global": 1, "-parameter": 1, "-value": 1, "-variable": 1,
			"-string": 1, "-number": 1},
		pushIf: {"{": "jsonName", "(": "statement",	"function": "functionDef"},
		options: RustyTools.Translate.needsRValue
	},
	{
		id: "condHasFirst",
		pushIf: {"[": "oneArg", "(": "arg", ".": "memberAccess", ":": "condNeedsSecond"},
		allowed: {",": 1, "{": 1, "(": 1, ".": 1, ":": 1},
		restartIf: {",": true}
	},
	// Trick to make the restart work - the ":" jumps to "condNeedsSecond"
	null,

	// Conditional statement second half
	{
		id: "condNeedsSecond",
		allowed: {"{": 1, "(": 1,	"function": 1,
			"-global": 1, "-parameter": 1, "-value": 1, "-variable": 1,
			"-string": 1, "-number": 1},
		pushIf: {"{": "jsonName", "(": "statement",	"function": "functionDef"},
		options: RustyTools.Translate.needsRValue
	},
	{
		id: "condHasSecond",
		pushIf: {"[": "oneArg", "(": "arg", ".": "memberAccess", ":": "condNeedsSecond"},
		allowed: {",": 1, "{": 1, "(": 1, ".": 1, ";": 1},
		restartIf: {",": true},
		popIf: {";": true}
	},
	null,

	// for statement
	{id: "forDefinition", allowed: {"(": 1}, pushIf: {"(": "inForStatement1"}},
	{id: "forBeforeBlock", pushIf: {"{": "statement"}, push: "oneStatement"},
	// If there is a block it will stack
	null,

	// do statement
	{id: "doDefinition", call: "oneStatement"},
	{id: "whileStatement", allowed: {"while": 1}},
	{id: "whileArg", allowed: {"(": 1}, pushIf: {"(": "oneArg"}},
	// If there is a block it will stack
	null,

	// for arguments
	{id: "inForStatement1", push: "oneStatement"},
	{id: "inForStatement2", push: "oneStatement"},
	{id: "inForStatement3", jump: "oneStatement"},	// Jump so the oneStatement pop will return to the caller.

	// if statement
	{id: "ifDefinition", allowed: {"(": 1}, pushIf: {"(": "oneArg"}},
	{id: "ifBeforeBlock", pushIf: {"{": "statement"}, push: "oneStatement"},
	{id: "ifAfterBlock", jumpIf: {"else": "elseDefinition"}, pop: true},
	null,

	// else statement
	{id: "elseDefinition", pushIf: {"{": "statement"}, push: "oneStatement"},
	{id: "ifAfterBlock", jumpIf: {"else": "elseDefinition"}, pop: true},
	null,

	// switch statement
	{id: "switchDefinition", allowed: {"(": 1}, pushIf: {"(": "oneArg"}},
	{
		id: "switchBeforeBlock",
		allowed: {"{": 1},
		pushIf: {"{": "statement"},
		setFlag: RustyTools.Translate.StateManager.flags.insideSwitch
	},
	null,

	// try statement
	{id: "tryDefinition", allowed: {"{": 1}, pushIf: {"{": "statement"}},
	{id: "tryAfterBlock", allowed: {"catch": 1, 'finally': 1}, jumpIf: {
		"catch": "catchDefinition", "finally": "finallyhDefinition"}},
	null,

	// catch statement
	{id: "catchDefinition", allowed: {"(": 1}, pushIf: {"(": "oneArg"}},
	{id: "catchBeforeBlock", allowed: {"{": 1}, pushIf: {"{": "statement"}},
	{id: "catchAfterBlock", jumpIf: {"finally": "finallyhDefinition"}, pop: true},
	null,

	// finally statement
	{id: "finallyDefinition", allowed: {"{": 1}, pushIf: {"{": "statement"}},
	null,

	// while statement
	{id: "whileDefinition", allowed: {"(": 1}, pushIf: {"(": "oneArg"}},
	{id: "whileBeforeBlock", pushIf: {"{": "statement"}, push: "oneStatement"},
	null
]);

// SyntaxCheck - it does not produce the parse tree. It tests and sets the
// token subType or error
var javaScriptSyntaxCheck = {
	state: 0,								// Used for validation and state progression

	// Prefix with '-' to make the cloning easy
	keywords: {
		"-arguments": RustyTools.Translate.types.valueKeyword,
		"-break": RustyTools.Translate.types.keyword,
		"-case": RustyTools.Translate.types.keyword,
		"-catch": RustyTools.Translate.types.keyword,
		"-continue": RustyTools.Translate.types.keyword,
		"-debugger": RustyTools.Translate.types.keyword,
		"-default": RustyTools.Translate.types.keyword,
		"-delete": RustyTools.Translate.types.keyword,
		"-do": RustyTools.Translate.types.keyword,
		"-else": RustyTools.Translate.types.keyword,
		"-false": RustyTools.Translate.types.valueKeyword,
		"-finally": RustyTools.Translate.types.keyword,
		"-for": RustyTools.Translate.types.keyword,
		"-function": RustyTools.Translate.types.functionKeyword,
		"-if": RustyTools.Translate.types.keyword,
		"-in": RustyTools.Translate.types.keyword,
		"-instanceof": RustyTools.Translate.types.suffixKeyword,
		"-new": RustyTools.Translate.types.prefixKeyword,
		"-return": RustyTools.Translate.types.prefixKeyword,
		"-switch": RustyTools.Translate.types.keyword,
		"-this": RustyTools.Translate.types.valueKeyword,
		"-throw": RustyTools.Translate.types.prefixKeyword,
		"-true": RustyTools.Translate.types.valueKeyword,
		"-try": RustyTools.Translate.types.keyword,
		"-typeof": RustyTools.Translate.types.suffixKeyword,
		"-var": RustyTools.Translate.types.keyword,
		"-void": RustyTools.Translate.types.disallowedKeyword,
		"-while": RustyTools.Translate.types.keyword,
		"-with": RustyTools.Translate.types.disallowedKeyword,
		'-"use strict"':  RustyTools.Translate.types.keyword,
		"-'use strict'":  RustyTools.Translate.types.keyword
	},

	punctuation: [
		// Ick + and - can be binary or unary depending on context.
		{op: '+', types: RustyTools.Translate.types.binaryOrUnary},
		{op: '-', types: RustyTools.Translate.types.binaryOrUnary},

		// Unary
		{op: '++', types: RustyTools.Translate.types.unary},
		{op: '--', types: RustyTools.Translate.types.unary},
		{op: '!', types: RustyTools.Translate.types.unaryPrefix},

		//	Bitwise
		{op: '~', types: RustyTools.Translate.types.unaryPrefix},

		// Binary
		// 	Arithmetic
		{op: '*', types: RustyTools.Translate.types.binary},
		{op: '/', types: RustyTools.Translate.types.binary},
		{op: '%', types: RustyTools.Translate.types.binary},

		//	Comparison
		{op: '===', types: RustyTools.Translate.types.binary},
		{op: '!==', types: RustyTools.Translate.types.binary},
		{op: '==', types: RustyTools.Translate.types.binary},
		{op: '!=', types: RustyTools.Translate.types.binary},
		{op: '>=', types: RustyTools.Translate.types.binary},
		{op: '>', types: RustyTools.Translate.types.binary},
		{op: '<=', types: RustyTools.Translate.types.binary},
		{op: '<', types: RustyTools.Translate.types.binary},

		//	Logical
		{op: '&&', types: RustyTools.Translate.types.binary},
		{op: '||', types: RustyTools.Translate.types.binary},

		//	Bitwise
		{op: '&', types: RustyTools.Translate.types.binary},
		{op: '|', types: RustyTools.Translate.types.binary},
		{op: '^', types: RustyTools.Translate.types.binary},
		{op: '<<', types: RustyTools.Translate.types.binary},
		{op: '>>>', types: RustyTools.Translate.types.binary},
		{op: '>>', types: RustyTools.Translate.types.binary},

		// Special
		{op: ',', types: RustyTools.Translate.types.separator,
				check: RustyTools.Translate.check.ifAllowed},
		{op: '.', types: RustyTools.Translate.types.memberAccess,
				check: RustyTools.Translate.check.ifAllowed},

		{op: '?', types: RustyTools.Translate.types.conditional,
				check: RustyTools.Translate.check.ifAllowed},
		{op: ':', types: RustyTools.Translate.types.colon,
				check: RustyTools.Translate.check.ifAllowed},
		{op: ';', types: RustyTools.Translate.types.end,
				check: RustyTools.Translate.check.ifAllowed},


		// Assignment
		{op: '=', types: RustyTools.Translate.types.assignment,
				check: RustyTools.Translate.check.ifAllowed},
		{op: '*=', types: RustyTools.Translate.types.alteration,
				check: RustyTools.Translate.check.ifAllowed},
		{op: '/=', types: RustyTools.Translate.types.alteration,
				check: RustyTools.Translate.check.ifAllowed},
		{op: '%=', types: RustyTools.Translate.types.alteration,
				check: RustyTools.Translate.check.ifAllowed},
		{op: '+=', types: RustyTools.Translate.types.alteration,
				check: RustyTools.Translate.check.ifAllowed},
		{op: '-=', types: RustyTools.Translate.types.alteration,
				check: RustyTools.Translate.check.ifAllowed},
		{op: '<<=', types: RustyTools.Translate.types.alteration,
				check: RustyTools.Translate.check.ifAllowed},
		{op: '>>>=', types: RustyTools.Translate.types.alteration,
				check: RustyTools.Translate.check.ifAllowed},
		{op: '>>=', types: RustyTools.Translate.types.alteration,
				check: RustyTools.Translate.check.ifAllowed},
		{op: '&=', types: RustyTools.Translate.types.alteration,
				check: RustyTools.Translate.check.ifAllowed},
		{op: '^=', types: RustyTools.Translate.types.alteration,
				check: RustyTools.Translate.check.ifAllowed},
		{op: '|=', types: RustyTools.Translate.types.alteration,
				check: RustyTools.Translate.check.ifAllowed},

		// Grouping
		{op: '{', types: RustyTools.Translate.types.groupStart, end: '}',
				check: RustyTools.Translate.check.ifAllowed},
		{op: '(', types: RustyTools.Translate.types.groupStart, end: ')',
				check: RustyTools.Translate.check.ifAllowed},
		{op: '}', types: RustyTools.Translate.types.groupEnd,
				check: RustyTools.Translate.check.ifGroupMatched},
		{op: ')', types: RustyTools.Translate.types.groupEnd,
				check: RustyTools.Translate.check.ifGroupMatched},
		// Grouping - array
		{op: '[', types: RustyTools.Translate.types.arrayStart, end: ']',
				check: RustyTools.Translate.check.ifAllowed},
		{op: ']', types: RustyTools.Translate.types.arrayEnd, start: '[',
				check: RustyTools.Translate.check.ifGroupMatched},
	],

	lValueError: 'The <repl:getActiveType/>  "<repl:str/>" is not allowed in the var or function declaration.',
	rValueError: 'The <repl:getActiveType/>  "<repl:str/>" is not allowed  where a value is required.',

	// Start in the general statement, not in a block.
	stateManager: new RustyTools.Translate.StateManager(javaScriptStates, 'statement'),

	statementResetAllowed: function(str, token) {
		"use strict";
		var reset = this.StateManager.resetIfPossible();
		if (!reset) token.setError('The reset token: "' + str + '" is not alowed in this context.');

		return reset;
	},

	makeCurrentSymbolTable: function() {
		"use strict";
		// Ack! for in  does not really work on self or window!
		// (Lots of the keys are not enumerable.)
		var symbolTable = RustyTools.cloneOneLevel(this.keywords);
		try {
			Object.getOwnPropertyNames(self).forEach(function(value) {
				// Make a hash of all the top level symbols! Prefix with "__" so that
				// symbold do not collide with Object.prototype properties.
				symbolTable["-" + value] = '-global';
			});
			symbolTable['-self'] = '-global';
		} catch (e) {
			// Unable to use getOwnPropertyNames - try for ... in.  It will probably
			// be incomplete :-(
			for (var i in self) {
				// Make a hash of all the top level symbols! Prefix with "__" so that
				// symbold do not collide with Object.prototype properties.
				symbolTable["-" + i]  = '-global';
			}
		}

		return symbolTable;
	},

	makeTranslator: function() {
		"use strict";
		return new RustyTools.Translate(this.punctuation,
				// comments
				new RustyTools.Translate.LiteralToken({prefix: "/\\*", suffix: "\\*/"}),
				new RustyTools.Translate.LiteralToken(),
				// "use strict" is a special key word, it would notmally match as a string token.
				new RustyTools.Translate.RegExpToken('("use strict")', RustyTools.Translate.types.keyword),
				new RustyTools.Translate.RegExpToken("('use strict')", RustyTools.Translate.types.keyword),
				new RustyTools.Translate.LiteralToken({prefix: "'", escape: '\\\\',
						suffix: "'", types: RustyTools.Translate.types.string}),
				new RustyTools.Translate.LiteralToken({prefix: '"', escape: '\\\\',
						suffix: '"', types: RustyTools.Translate.types.string}),
				// In javascript there is just one number type
				new RustyTools.Translate.NumberToken({decimal: '\\.', exp: '[eE]', types: '-number'}),
				new RustyTools.Translate.NumberToken({prefix: '0', numerals: '[0-7]', types: '-number'}),
				new RustyTools.Translate.NumberToken({prefix: '0[xX]', numerals: '[0-9A-Fa-f]', types: '-number'}),
				new RustyTools.Translate.NumberToken({types: '-number'}),
				new RustyTools.Translate.LiteralToken({prefix: '/', escape: '\\\\',
						suffix: '/', types: RustyTools.Translate.types.regExp}),
				new RustyTools.Translate.SymbolToken());
	},

	// Token handling
	start: function(tokens) {
		"use strict";
		return {"tokens": tokens};
	},

	end: function(context) {
		"use strict";
		return context.tokens;
	},

	/**
	 * Javascript only scopes for each function, so the test for in a function is
	 * just a test to see if the RustyTools.Translate.StateManage is wrapped.
	 */
	isInFunction: function(symbolTable) {
		"use strict";
		return symbolTable.rustyToolsIsWrapped();
	},

	tryNext: function(current, types) {
		"use strict";
		var next;
		if ('string' !== typeof types) {
			var index = types.indexOf(current) + 1;
			if (index < types.length) {
				next = this[types[index]];
			}
		}

		return next;
	},

	adjustKeyword: function(token) {
		"use strict";
		var match = this.keywords['-' + token.str];
		if (match) {
			token.types = match;
			if ('string' !== typeof match) {
				token.activeType = match[1];
			}
		}
	},

	isValue: function(token, inFrontOfToken) {
		"use strict";
		// token == falsy means not a value.
		if (!token) return false;

		if (token.types === RustyTools.Translate.types.symbol) this.adjustKeyword(token);

		var isValue = token.types === RustyTools.Translate.types.symbol;
		if (!isValue) {
			if ('string' !== typeof token.types) {
				isValue = (-1 !== token.types.indexOf("-value") ||
				-1 !== token.types.indexOf("-variable") ||
				-1 !== token.types.indexOf("-function")) &&
				-1 === token.types.indexOf("-disallowed");
			}
			// Allow the start of end of an expression, or the end of a function.
			if (!isValue) isValue = (inFrontOfToken) ? '(' : ')' === token.str;

			// A closing ] is also a value.
			if (!isValue && !inFrontOfToken) isValue = ']' === token.str;
		}
		return isValue;
	},

	isUnaryOperator: function(token) {
		return token && !token.error && ("-unaryPrefix" === token.activeType ||
				"-unarySuffix" === token.activeType);
	},

	handleBinaryOperator: function(token, stateManager) {
		if (!token.error && ("-binary" === token.activeType)) {
			stateManager.advance().push("needsValue");
			return true;
		}
		return false;
	},

	// Invalid token - just make an error message.
	"-invalid": function(context, str, token) {
		"use strict";
		token.setError('Unknowm token: "' + str + '"');
		return;
	},

	"-unarySuffix": function(context, str, token, stateManager, symbolTable,
			previousToken) {
		"use strict";

		if (this.isValue(previousToken, true)) {
			// This token is OK.  Set the subtype.
			if (token.types !== RustyTools.Translate.types.unarySuffix &&
					token.types[0] !== RustyTools.Translate.types.unarySuffix) {
				token.activeType = RustyTools.Translate.types.unarySuffix;
			}

			// This symbol may have had other types or options
			token.check = RustyTools.Translate.check.unaryOperator;
		} else {
			token.callNextType("-unarySuffix");
		}
		return;
	},

	"-unaryPrefix": function(context, str, token, stateManager, symbolTable,
			previousToken, nextToken) {
		"use strict";
		if (this.isValue(nextToken, false)) {
			// This token is OK.  Set the subtype.
			if (token.types !== RustyTools.Translate.types.unaryPrefix &&
					token.types[0] !== RustyTools.Translate.types.unaryPrefix) {
				token.activeType = RustyTools.Translate.types.unaryPrefix;
			}

			// This symbol may have had other types or options
			token.check = RustyTools.Translate.check.unaryOperator;
		} else {
			token.callNextType("-unaryPrefix");
		}
		return;
	},

	"-binary": function(context, str, token, stateManager, symbolTable,
			previousToken, nextToken) {
		"use strict";
		if (this.isValue(previousToken, false) && this.isValue(nextToken, false)) {
			// This token is OK.  Set the subtype.
			if (stateManager.getOptions() === RustyTools.Translate.hasNewVar) {
				token.setError('Can not use the binary operator "' + str +
						'" on a newly defined variable.');
			} else if (token.types !== RustyTools.Translate.types.binary) {
				token.activeType = RustyTools.Translate.types.binary;
			}

			// This symbol may have had other types or options
			token.check = RustyTools.Translate.check.binaryOperator;
		} else {
			token.callNextType("-binary");
		}
		return;
	},

	"-memberAccess": function(context, str, token, stateManager, symbolTable,
			previousToken) {
		"use strict";
		if (!this.isValue(previousToken, false)) {
			var name = (previousToken) ? previousToken.str : 'NO TOKEN';
			token.setError('Unable to access a member of "' + name + '".');
		}
	},

	// "-assignment" : function(context, str, token, stateManager) {
	// 	"use strict";
	// 	var options = stateManager.getOptions();
	// 	if (RustyTools.Translate.hasVar !== options) {
	// 		token.setError('The assignment "' + str + '" is not allowed here.');
	// 	}
	// },

	// "-alteration" : function(context, str, token, stateManager) {
	// 	"use strict";
	// 	var options = stateManager.getOptions();
	// 	if (RustyTools.Translate.hasVar !== options ||
	// 			"hasVar" !== stateManager.getStateName()) {
	// 		token.setError('The assignment "' + str + '" is not allowed here.');
	// 	}
	// },

	"-symbol": function(context, str, token, stateManager, symbolTable, previousToken, nextToken) {
		"use strict";
		var prefixedStr = '-' + str, keywordTypes;

		// Check members and JSON first.  They do not conflict with keywords, or variables.
		if (previousToken && '{' === previousToken.str && nextToken &&
				':' === nextToken.str) {
			// This is the start of objectNotation
			if ('jsonName' !== stateManager.getStateName()) {
				stateManager.jump('jsonName').markState();
			}
		}

		if ('jsonName' === stateManager.getStateName()) {
			token.activeType = '-menber';
		} else if (previousToken && '.' === previousToken.str) {
			token.activeType = '-menber';
		} else if ((keywordTypes = this.keywords[prefixedStr])) {
			token.setTypes(keywordTypes);
		} else if (RustyTools.Translate.varDef === stateManager.getOptions()) {
			// A variable definition - add into the symbol table.
			symbolTable[prefixedStr] = token.activeType =
					(this.isInFunction(symbolTable)) ? '-variable' : '-global';
		} else if (RustyTools.Translate.paramDef === stateManager.getOptions()) {
			// A variable definition - add into the symbol table.
			symbolTable[prefixedStr] = token.activeType = '-parameter';
		} else {
			// Read the sub-type from the symbol table.  Error if there is no sub-type.
			if (!(token.activeType = symbolTable[prefixedStr])) {
				token.setError('When in strict mode the variable "' + str +
						'" must be declared before it is used.');
				token.activeType = '';
			}
		}

		// A variable in RustyTools.Translate.ganeralStatement pushes to "hasVar"
		if (!token.err && RustyTools.Translate.ganeralStatement ===
				stateManager.getOptions() &&
				// Make sure the symbol is a variable, global, or value keyword.
				-1 !== ['-global', '-parameter', '-value', '-variable'].indexOf(token.activeType)) {
			stateManager.push("hasVar");
		}
	},

	"-string": function(context, str, token, stateManager, symbolTable, previousToken, nextToken) {
		"use strict";

		// A string can be an object notation name
		if (previousToken && '{' === previousToken.str && nextToken &&
				':' === nextToken.str) {
			// This is the start of objectNotation
			if ('jsonName' !== stateManager.getStateName()) {
				stateManager.jump('jsonName').markState();
			}
		}
	}
};
