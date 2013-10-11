// Javascript parsing

// The javascript language is almost flat; the variables are not block scoped.
// These combinations mater inside andd outside of a function, a switch, and
// a do/while loop.  Instead of making a tree of the language.  These
// states are handled by testing context.functionStack, context.loopStack, and
// context.switchStack

var JavaScriptStateManager = function(stateSet, stateFlagStr, opt_exitSymbol, opt_exitCount) {
	"use strict";
	RustyTools.Translate.StateManager.apply(this, Array.prototype.slice.call(arguments, 0));

	// Only "{...}" blocks can be Object notation.  But, function blocks, and
	// if, do, and while blocks can not be object notation.
	this.current.canBeJSON = false;
};
JavaScriptStateManager.prototype = Object.create(RustyTools.Translate.StateManager.prototype);

/**
 * setCanBeJSON - mainly for chaining.  The default for canBeJSON is false
 * for each block/new JavaScriptStateManager
 */
JavaScriptStateManager.prototype.setCanBeJSON = function(canBeJSON) {
	"use strict";
	this.current.canBeJSON = canBeJSON;

	return this;	// For chaining.
};

var javaScriptStates = new RustyTools.Translate.StateSet([
		// General statements
		null,
		{id: 'statement', pushIf: ['{', 'statement', '(', 'statement'],
				restartIf: [';', ','], options: RustyTools.Translate.ganeralStatement},
		null,
		// If we encounter a varibale in general statement push to hasVar
		{id: 'hasVar', pushIf: ['{', 'statement', '(', 'statement'], pushOnAssign: 'needsValue',
				restartIf: [','], popIf: [';'], options: RustyTools.Translate.hasVar},	// Can assign to the variable
		null,
		// If we encounter an assignment in RustyTools.Translate.hasVar push to needsValue
		{id: 'needsValue', pushIf: ['{', 'statement','(', 'statement'],
				options: RustyTools.Translate.needsRValue},	// Something to assign
		{id: 'valueStatment', pushIf: ['{', 'statement', '(', 'valueStatment'],
				popIf: [';', ','], options: RustyTools.Translate.ganeralStatement},
		null,	// pop when we have the value
		// Single general statements
		{id: 'oneStatement', pushIf: ['{', 'statement', '(',  'statement'],
				restartIf: [','], endif: [';'],
				options: RustyTools.Translate.ganeralStatement},
		null,
		// Argument or argument list.
		{id: 'arg', pushIf: ['{', 'statement', '(', 'statement'],
				options: RustyTools.Translate.needsRValue},
		{id: 'argHasValue', pushIf: ['{', 'statement', '(', 'statement'],
				restartIf: [','], options: RustyTools.Translate.hasRValue},	// Must be a comma or a state pop
		null,
		// Object notation statement
		{id: 'jsonName', options:RustyTools.Translate.needsJsonName},
		{id: 'jsonSep', needs: [':']},
		{id: 'jsonStatement', pushIf: ['{', 'statement', '(', 'statement'],
				restartIf: [','], options: RustyTools.Translate.ganeralStatement},
		null,
		{id: 'functionDef', optiions: RustyTools.Translate.varDef},
		{id: 'functionBeforeArg', needs: ['('], pushIf: ['(', 'arg'], scopeSymbols:true},
		{id: 'functionBeforeBlock', needs: ['{'], pushIf: ['{', 'statement']},
		{needs: ['}'], scopeSymbols: false},
		null,
		{id: 'varStatement', optiions: RustyTools.Translate.varDef},
		{id: 'varDefined', restartIf: [','], popIf: [';'],
				options: RustyTools.Translate.hasVar},
		null,
		{id: 'swtichNeedsArg', needs: ['('], pushIf: ['(', 'singleValueArg']},
		{id: 'switchBeforeBody', needs: ['{'], pushIf: ['{', 'statement']},
		null,
		{id: 'singleValueArg', popIf: [')'], restartIf: [','],
				options: RustyTools.Translate.needsRValue},
		{id: 'singleValueHasArg', needs: [')'], popIf: [')'], restartIf: ',',
				options: RustyTools.Translate.hasRValue},
		null,
		// case statnment
		{id: 'caseNeedsValue', options: RustyTools.Translate.needsRValue},
		{id: 'caseHasValue', needs: [':'], popIf: [':']},
		null,
		// Conditional statement first half
		{id: 'condNeedsFirst', pushIf: ['{', 'statement', '(', 'statement'],
				options: RustyTools.Translate.needsRValue},
		{id: 'condHasFirst', needs: [':'], pushIf: [':', 'condNeedsSecond'],
				restartIf: [',']},
		// Trick to make the restart work - the ':' jumps to 'condNeedsSecond'
		null,
		// Conditional statement second half
		{id: 'condNeedsSecond', pushIf: ['{', 'statement', '(', 'statement'],
						options: RustyTools.Translate.needsRValue},
		{id: 'condHasSecond', endif: [';'], restartIf: [',']},
		null,
		// for statement
		{id: 'forDefinition', needs: ['('], pushIf: ['(', 'inForStatement1']},
		{id: 'forBeforeBlock', pushIf: ['{', 'statement'],
				push: 'oneStatement'},
		// If there is a block it will stack
		null,
		// for arguments
		{id: 'inForStatement1', push: 'oneStatement'},
		{id: 'inForStatement2', push: 'oneStatement'},
		{id: 'inForStatement3', jump: 'arg'},	// Jump so the statement exit on the closing ')'
]);

// SyntaxCheck - it does not produce the parse tree. It tests and sets the
// token subType or error
var javaScriptSyntaxCheck = {
	state: 0,								// Used for validation and state progression

	// Prefix with '__' to make the cloning easy
	keywords: {"__arguments": 'valueKeyword', "__break": 'keyword', "__case": 'keyword',
			"__catch": 'keyword', "__continue": 'keyword', "__debugger": 'keyword',
			"__default": 'keyword', "__delete": 'keyword', "__do": 'keyword',
			"__else": 'keyword', "__false": 'valueKeyword', "__finally": 'keyword',
			"__for": 'keyword', "__function": 'valueKeyword', "__if": 'keyword',
			"__in": 'keyword', "__instanceof": 'valueKeyword', "__new": 'valueKeyword',
			"__return": 'keyword', "__switch": 'keyword', "__this": 'valueKeyword',
			"__throw": 'keyword', "__true": 'valueKeyword', "__try": 'keyword',
			"__typeof": 'valueKeyword', "__var": 'keyword',
			"__void": 'deniedKeyword', "__while": 'keyword', "__with": 'deniedKeyword',
			'__"use strict"':  'keyword'},

	punctuation: [
		'+', '-',		// Ick + and _ can be binary or unary dependsind on context.
		',', '.', // Special punctuation
		':', // Special punctuation goofy but ? ... : works as a unary postifx ? that allows the binary :
		';' // Statement end
	],

	unaryOperators: [
		'++', '--',			// Arithmetic punctuation
		'!',	// Logical punctuation
		'?' // Special punctuation goofy but ? ... : works as a unary postifx ? that allows the binary :
	],

	binaryOperators: [
		'*', '/', '%',	// Arithmetic punctuation
		'===', '!==', '==', '!=', '>=', '>', '<=', '<',	// Comparison punctuation
		'&&', '||', 	// Logical punctuation
		'&', '|', '^', '~', '<<', '>>>', '>>', //	Bitwise punctuation
	],

	assignmentOperators: [
		'*=', '/=', '%=', '+=', '-=', '<<=', '>>=', '>>>=', '&=', '^=', '|=', '='	// Assignment punctuation
	],

	groupSymbols: ['{', '}', '(', ')', '[', ']'],	// Matching open and close tags.

	lValueError: 'The <#getSubTypeOrType/>  "<#str/>" is not allowed in the var or function declaration.',
	rValueError: 'The <#getSubTypeOrType/>  "<#str/>" is not allowed  where a value is required.',

	// Start in the general statement, not in a block.
	stateManager: new JavaScriptStateManager(javaScriptStates, 'statement'),

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
				symbolTable["__" + value] = 'global';
			});
			symbolTable['__self'] = 'global';
		} catch (e) {
			// Unable to use getOwnPropertyNames - try for ... in.  It will probably
			// be incomplete :-(
			for (var i in self) {
				// Make a hash of all the top level symbols! Prefix with "__" so that
				// symbold do not collide with Object.prototype properties.
				symbolTable["__" + i]  = 'global';
			}
		}

		return symbolTable;
	},

	makeTranslator: function() {
		"use strict";
		return new RustyTools.Translate(this.punctuation, this.unaryOperators,
				this.binaryOperators, this.assignmentOperators, this.groupSymbols,
				[// comments
				'comment',  new RustyTools.Translate.LiteralToken({prefix: "/\\*", suffix: "\\*/"}),
				'comment',  new RustyTools.Translate.LiteralToken()
				], [// "use strict" is a special key word, it would notmally match as a string token.
				'symbol', new RustyTools.Translate.RegExpToken('("use strict")'),
				'string', new RustyTools.Translate.LiteralToken({prefix: "'", escape: '\\\\', suffix: "'"}),
				'string', new RustyTools.Translate.LiteralToken({prefix: '"', escape: '\\\\', suffix: '"'}),
				'number', new RustyTools.Translate.NumberToken({decimal: '\\.', exp: '[eE]'}),
				'number', new RustyTools.Translate.NumberToken({prefix: '0', numerals: '[0-7]'}),
				'number', new RustyTools.Translate.NumberToken({prefix: '0[xX]', numerals: '[0-9A-Fa-f]'}),
				'number', new RustyTools.Translate.NumberToken(),
				'symbol', new RustyTools.Translate.SymbolToken()]);
	},

	// Token handling
	start: function(tokens) {
		"use strict";
		return {"tokens": tokens};
	},

	end: function(context) {
		"use strict";
		return context["tokens"];
	},

	anyToken: function(context, str, token, stateManager) {
		"use strict";
		switch (stateManager.getOptions()) {
			case RustyTools.Translate.varDef:
				if (token.isTestable && 'symbol' !== token.type) {
					// All testable non-symbol tokens are errors where a var declaration is needed.
					token.setError(RustyTools.Str.multiReplace(token,
							'The <#getSubTypeOrType/> token: "<#str/> is not ' +
							'allowed in a var or function declaration.'));
				}
				break;
			// Many kinds of tokens can be lValues!
		}
	},

	// Invalid token - just make an error message.
	__invalid: function(context, str, token) {
		"use strict";
		token.setError('Unknowm token: "' + str + '"');
		return;
	},

	// Line break does not need to convet.
	// Whitespace does not need to convert.
	// Comment does not need to convert.

	// __punctuation is handled in individual token handlers.
	'__+': function(context, str, token, stateManager, symbolTable,
			previousToken, nextToken) {
		"use strict";
		var options = stateManager.getOptions();
		if (options === RustyTools.Translate.varDef ||
				options === RustyTools.Translate.hasVar) {
			token.setError('The operator "+" is not allowed in a var or function declaration.');
		} else if (previousToken && previousToken.needTwoValues(nextToken, true)) {
			// A valid binary +
			token.clearError();
			token.subType = 'binary';
			stateManager.push('needsValue');
		} else if (nextToken && nextToken.possibleValue()) {
			// A valid unary +  (Note: does not apply to strings.)
			token.clearError();
			token.subType = 'unary';
			stateManager.push('needsValue');
		} else {
			token.setError('Token "+" is not allowed in this context.')
		}
	},

	'__-': function(context, str, token, stateManager, symbolTable,
			previousToken, nextToken) {
		"use strict";
		// Unlike the  + there is no string -
		var options = stateManager.getOptions();
		if (options === RustyTools.Translate.varDef ||
				options === RustyTools.Translate.hasVar) {
			token.setError('The operator "+" is not allowed in a var or function declaration.');
		} else if (previousToken && previousToken.needTwoValues(nextToken)) {
			// A valid binary -
			token.clearError();
			token.subType = 'binary';
			stateManager.push('needsValue');
		} else if (nextToken && nextToken.possibleValue()) {
			// A valid unary -  (Note: does not apply to strings.)
			token.clearError();
			token.subType = 'unary';
			stateManager.push('needsValue');
		} else {
			token.setError('Token "-" is not allowed in this context.')
		}
	},

	'__.': function(context, str, token, stateManager, symbolTable, previousToken,
			nextToken) {
		"use strict";
		// .  - Access a member.
		if (previousToken && 'symbol' === previousToken.type) {
			// The . was used for member access!
			token.clearError();
			if (nextToken) nextToken.subType = 'member';
		}
	},

	'__,': function(context, str, token, stateManager, symbolTable, nextToken) {
		"use strict";

		// Treat a comma before the close of a block as an error.
		var commaAtEndOfBlock = 'block' === nextToken.type &&
				// An even position in groupSymbols is a closer.
				(1 & this.groupSymbols.indexOf(nextToken.str));

		if (commaAtEndOfBlock) token.setError('Do not use "," at the end of a block.');

		return;
	},

	'__:': function(context, str, token, stateManager) {
		"use strict";
		if (!stateManager.current.canBeJSON) {
			if (!stateManager.isOneOf('jsonSep', 'caseHasValue')) {
				token.setError('Token ":" is not allowed in this context.');
			}
		} else {
			stateManager.jump('jsonStatement');
		}

		return;
	},

	'__;': function(context, str, token, stateManager) {
		"use strict";
		var state = (stateManager.current) ? stateManager.current.state : {};
		if ((!state.endIf || -1 === state.endIf.indexOf[str]) &&
				(!state.restartIf || -1 === state.restartIf.indexOf[str]) &&
				(!state.popIf || -1 === state.popIf.indexOf[str])) {
			token.setError('The statement cannot end here.');
		}

		return;
	},


	'__unary': function(context, str, token, stateManager, symbolTable,
			previousToken, nextToken) {
		"use strict";
		// Most unarys can only be prefix operators!  ++ and __ must override.
		var options = stateManager.getOptions();
		if (options === RustyTools.Translate.varDef ||
				options === RustyTools.Translate.hasVar) {
			token.setError('The unary operator "' + str +
					'" is not allowed in a var or function declaration.');
		} else if (!nextToken.possibleValue()) {
			token.setError('Can not perfrom the operation "' + str + '" on "' +
				(nextToken) ? nextToken.str : nextToken + '".')
		}
	},

	'__++': function(context, str, token, stateManager, symbolTable,
			previousToken, nextToken) {
		"use strict";
		var options = stateManager.getOptions();
		if (options === RustyTools.Translate.varDef ||
				options === RustyTools.Translate.hasVar) {
			token.setError('The unary operator "' + str +
					'" is not allowed in a var or function declaration.');
		} else if (!previousToken || !previousToken.needOneValue(nextToken)) {
			token.setError('Cannot perform the operation "' + (previousToken) ?
					previousToken.str : previousToken + str + '" or "' + str +
					(nextToken) ? nextToken.str : nextToken + '".');
		}
	},

	'__--': this['__++'],

	'__?': function(context, str, token, stateManager, symbolTable, previousToken) {
		"use strict";
		var options = stateManager.getOptions();
		if (options === RustyTools.Translate.varDef ||
				options === RustyTools.Translate.hasVar) {
			token.setError('The conditional operator "' + str +
					'" is not allowed in a var or function declaration.');
		} else if (previousToken && ')' === previousToken.str) {
			// A valid ?
			token.clearError();
			token.subType = 'conditional';
			stateManager.advance();	// The ? has been handled.
			stateManager.push('condNeedsFirst');
		} else {
			token.setError('Token "-" is not allowed in this context.')
		}
	},

	'__binary': function(context, str, token, stateManager, symbolTable,
			previousToken, nextToken) {
		"use strict";
		var options = stateManager.getOptions();
		if (options === RustyTools.Translate.varDef ||
				options === RustyTools.Translate.hasVar) {
			token.setError('The conditional operator "' + str +
					'" is not allowed in a var or function declaration.');
		} else if (previousToken && previousToken.needTwoValues(nextToken)) {
			token.clearError();
			stateManager.push('needsValue');
		} else {
			token.setError('Cannot perform the operation "' + (previousToken) ?
					previousToken.str : previousToken + ' ' + str + ' ' +
					(nextToken) ? nextToken.str : nextToken + '".');
		}
	},

	__assignment: function(context, str, token, stateManager) {
		"use strict";
		// assignment is allowes right after 'varDefined'
		var options = stateManager.getOptions();
		if (options !== RustyTools.Translate.varDef &&
				(options === RustyTools.Translate.hasVar ||
				token.subtype === 'variableMatched')) {
			stateManager.push('needsValue', token);
		} else {
			token.setError('The assignment "' + str + '" is not allowed in this context.');
		}
		return;
	},

	__grouping: function(context, str, token, stateManager) {
		"use strict";

		if (token.groupingCount < 0) {
			token.setError('Missing opener for "' + str + '".');
		} else if (stateManager.isOneOf('varStatement', 'varDefined')) {
			token.setError('Token: "' + str + '" is not allowed where a varaible name is needed.');
		} else {
			stateManager.blockAllowed(token);
		}

		return;
	},

	'__(': function(context, str, token, stateManager) {
		"use strict";
		// A function may have no name, just go to functionBeforeArg
		if (stateManager.isOneOf('functionDef')) {
			token.clearError();
			stateManager.jump('functionBeforeArg');
			stateManager.markState();	// Count this as the origional state.
		}

		return;
	},

	'__{': function(context, str, token, stateManager, symbolTable) {
		"use strict";
		if (stateManager.isOneOf('functionBeforeBlock')) {
			symbolTable.isInFunction = true;
		}

		return;
	},

	'__[': function(context, str, token, stateManager, symbolTable, previousToken) {
		"use strict";

		// Allowed if "[" follows a variable or function call.
		// ')' === token.str is not exaustive - it will let some non-array
		// expressions through.
		if (previousToken && ('symbol' === previousToken.type || ')' ===
				previousToken.str)) {
			if (token.error)  token.clearError();
			stateManager.push('arg', token);
		}
		return;
	},

	'__]': function(context, str, token) {
		"use strict";
		return;
	},

	__number: function(context, str, token, stateManager) {
		"use strict";

		// Numbers can serve as an rvalue, but not an lvalue
		if (!token.error) stateManager.foundValue(token, false, true,
				this.lValueError, this.rValueError);

		return;
	},

	__symbol: function(context, str, token, stateManager, symbolTable,
			previousToken, nextToken) {
		"use strict";
		if (!token.error) {
			// Cramming arbitrary names into an object can hide Object.prototype
			// methods. (E.g. hiding hasOwnProperty will crash Translator!)
			// Prefix with '__'
			var prefixedStr = '__' + str;

			if (nextToken && ':' === nextToken.str) {
				// If we are in an object definition this means the symbol is a member
				token.subType = 'member';
				stateManager.jump('jsonName');
			}

			// Member can also be set by look-ahead on the '.'
			if ('member' !== token.subType)  {
				// Check for states the will cause the addition of new
				// items to the symbol table.
				var stateName = (stateManager.state) ? stateManager.state.name : '';
				if (stateManager.isOneOf('arg')) {
						symbolTable[prefixedStr] = 'argument';
				} else if (stateManager.isOneOf('functionDef')) {
					stateManager.advance();
					symbolTable[prefixedStr] = 'function';
				} else if (stateManager.isOneOf('varStatement')) {
					stateManager.advance();
					symbolTable[prefixedStr] = (symbolTable.isInFunction) ? 'variable' : 'global';
				}
				// Color the tokens
				token.subType = symbolTable[prefixedStr] || 'unknown';

				if (symbolTable[prefixedStr]) {
					// Keywords that can be rvalues must be handled in their own handler
					if ('keyword' !== token.subType) {
						// 'valueKeyword' and 'constant' cannot be lValues.
						stateManager.foundValue(token, -1 === ['valueKeyword', 'constant'].
								indexOf(token.subtype), true, this.lValueError, this.rValueError);
					}
				} else {
					token.setError('When in strict mode the variable "' + str +
							'" must be declared before it is used.');
				}
			}
		}

		return;
	},

	"__arguments": function(context, str, token, stateManager, symbolTable) {
		"use strict";

		// arguments can be a rValue.
		token.clearError();

		// arguments is a special if it is inside a function.  Otherwise it is
		// an error.
		if (symbolTable.isInFunction) {
			// Inside the function body
			token.subType = "valueKeyword";
			// Can't write to arguments.
			stateManager.foundValue(token, false, true,
					this.lValueError, this.rValueError);
		} else {
			// Not allowed here!
			token.setError('The token: "' + str +
					'" is only defined inside a fuction.');
		}
	},

	"__for": function(context, str, token, stateManager) {
		"use strict";
		if (!token.err)	stateManager.push('forDefinition', token);
	},

	"__function": function(context, str, token, stateManager) {
		"use strict";
		if (!token.err)	{
			// Function can serve as an rvalue, but not an lvalue
			stateManager.foundValue(token, false, true,
					this.lValueError, this.rValueError);
			stateManager.push('functionDef', token);
		}
	},

	"__var": function(context, str, token, stateManager) {
		"use strict";
		if (!token.err) stateManager.push('varStatement', token);
	},

	"__switch": function(context, str, token, stateManager) {
		"use strict";
		if (!token.err)	stateManager.push('swtichNeedsArg', token);
	},

	"__string": function(context, str, token, stateManager, symbolTable, nextToken) {
		"use strict";
		if (':' === nextToken.str && stateManager.current.canBeJSON) {
			// If we are in an object definition this means the symbol is a member
			token.subType = 'member';
			stateManager.jump('jsonName');
		}

		// Strings can serve as an rvalue, but not an lvalue
		stateManager.foundValue(token, false, true, this.lValueError, this.rValueError);
	}
};
