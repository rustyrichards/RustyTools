/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
* A JavaScript string to token array Translate
*
* A symbol tree is an array of strings, or other symbol trees
*
* With a front end and back end Translate it can be a compiler.
*/
/**
 * @param   punctuation		- An array of {op: OPERATOR, types: [TYPE]}
 * @param   tokenMatches	- Any other (non punctuation) token matches.
 */
RustyTools.Translate = function(punctuation /*, tokenMatches*/ ) {
	'use strict';

	// NOTE: 0 = invalid
	this.tokenTypes = [{types: RustyTools.Translate.types.invalid}];
	this.groupingOpeners = {};	// A hash matching the grouping pairs.
	this.groupingClosers = {};	// A hash matching the grouping pairs.

	this.whitespaceIndex = (this.lineBreakIndex = this.tokenTypes.length) + 1;
	// Don't test whitespace in "checkNextToken";
	this.tokenTypes.push({types: RustyTools.Translate.types.lineBreak},
		{types: RustyTools.Translate.types.whitespace});
	var regexStr = '(\\r\\n|\\n|\\r)|([ \\f\\t\\v\\u00A0\\u2028\\u2029]+)';

	for (var i=1; i<arguments.length; i++) {
		var arg = arguments[i];
		this.tokenTypes.push({types:arg.types, check: arg.check});
		regexStr += '|' + arguments[i].toRegExpStr();
	}

	if (!punctuation) punctuation = [];
	if (!Array.isArray(punctuation)) {
		throw new TypeError('RustyTools.Translate "punctuationAndOperators" was not an array');
	}
	punctuation = punctuation.sort(RustyTools.Translate.tokenOrder);

	var context = this;
	punctuation.forEach(function(element) {
		if (element.end) {
			context.groupingOpeners[element.op] = element.end;
			context.groupingClosers[element.end] = element.op;
		}

		context.tokenTypes.push(element);
	});

	// Escape the punctuation that is used by regexp, then convert the \n to the regexp or
	regexStr += '|(' + RustyTools.Str.regExpEscape(punctuation.map(
		function(element) {return element.op;}).join('\n')).
		replace(/\n/g, ')|(') + ')';

	this.tokenTypes.push({types: RustyTools.Translate.types.invalid});	// Invalid
	// Lastly match anything else - this match is invalid!
	regexStr += '|([\\s\\S])';

	this.tokenizer = new RegExp(regexStr, 'g');
	try {
		this.tokenizer.compile(regexStr, 'g');
	} catch (e) {}  // It is OK if compile does not work, the regex just runs slower.
};

RustyTools.Translate.Token = function(tokenTypes, checkType, typeNum, tokenStr,
		line, linePosition, charPosition) {
	'use strict';
	this.types;
	this.activeType;

	this.checkType = checkType;
	this.typeNum = typeNum;
	this.str = tokenStr;
	this.line = line;
	this.linePosition = linePosition;
	this.charPosition = charPosition;
	this.isTestable = -1 === tokenTypes.indexOf('-immaterial');

	this.setTypes(tokenTypes);
};

// So all the instances do not need to carry  default values
RustyTools.Translate.Token.prototype.error = false;
RustyTools.Translate.Token.prototype.unrecoverable = false;
RustyTools.Translate.Token.prototype.activeType = '';
RustyTools.Translate.Token.prototype.errorMessage = '';
// The symbol table is added to the token at the start amd at each block.
RustyTools.Translate.Token.prototype.symbolTable = '';

RustyTools.Translate.Token.prototype.setTypes = function(types) {
	this.activeType = this.types = types;
	if ('string' !== typeof this.types) {
		// If there is one sub-type use that, otherwis use the first type.
		// Where there are more than 2 types, the token't handle needs to set its
		// type according to the context.
		this.activeType = (2 == this.types.length) ? this.types[1] : this.types[0];
	}
},

RustyTools.Translate.Token.prototype.setError = function(opt_errorMessage) {
	'use strict';
	// Error overrides subtype.
	if (opt_errorMessage) {
		this.errorMessage = opt_errorMessage + '  line: ' + this.line +
				'  position: ' + this.linePosition;
	}
	this.error = true;
};

RustyTools.Translate.Token.prototype.clearError = function() {
	'use strict';
	this.errorMessage = '';
	this.error = false;
};

RustyTools.Translate.Token.prototype.getCombindedClass = function() {
	'use strict';

	var result = [].concat(this.activeType);
	if ('string' !== typeof this.types && 2 === this.types.length &&
			this.activeType !== this.types[0]) {
		// If it is this.types is type and sub-type use both.
		result.unshift(this.types[0])
 	}
	if (this.error) result.push('error');

	//Strip out the leading '-' for the CSS classes
	return result.join(' ').replace(/\B-/g, '');
};

RustyTools.Translate.Token.prototype.getActiveType = function() {
	'use strict';

	return this.activeType;
};

RustyTools.Translate.Token.prototype.hasType = function(type) {
	'use strict';

	var found = this.activeType == type || this.types == type;
	if (!found && 'string' !== typeof this.types) {
		found = -1 !== this.types.indexOf(type);
	}

	return found;
};

RustyTools.Translate.Token.prototype.isSame = function(other) {
	'use strict';
	var isSame = this.types.length === other.types.length && this.str === other.str;
	// If the types objects are the same, there is no need to test each element.
	if (isSame && this.types !== other.types) {
		isSame = this.types.reduce(function(last, element, index) {
			return last && element === other.types[index];
		}, isSame);
	}
	return isSame;
};

// noReparse - Can this change without any need to re-parse?
RustyTools.Translate.Token.prototype.noReparse = function(other) {
	'use strict';
	return false === this.isTestable && false === other.isTestable;
};

RustyTools.Translate.Token.prototype.replace = function(other) {
	'use strict';
	if (!this.noReparse(other)) {
		for (var i in other) {
			var val = other[i];
			// If it is different and not a function, and not index copy it over.
			if ('function' !== typeof val && 'index' !== i && this[i] !== val) this[i] = val;
		}
	} else {
		// Only copy str and types.  All the others cause re-parsing.
		this.str = other.str;
		this.types = other.types;
		this.activeType = other.activeType;
		this.typeNum = other.typeNum;
	}
};

RustyTools.Translate.tokenOrder  = function(a, b) {
	'use strict';
	// longest first
	if (b.op.length < a.op.length) return -1;
	if (a.op.length < b.op.length) return 1;
	// reverseAsciibetical
	return (b.op < a.op) ? -1 : ((a.op < b.op) ? 1 : 0);
};

/**
 * extractTokens - tokenize the input string.
 *
 * @return  Array - This contains pairs of the numeric token type followed by
 *                  the token.
 */
RustyTools.Translate.prototype.extractTokens = function(input) {
	'use strict';
	var output = [], result, line = 1, linePos = 1, charPos = 0;
	while((result = this.tokenizer.exec(input)) != null) {
		for (var i=1; i<result.length; i++) {
			var tokenStr = result[i];
			if (tokenStr) {
				// 0 = invalid is a tokenizer error.
				var typeNum = (this.tokenTypes.length > i) ? i : 0;

				var typeInfo = this.tokenTypes[i];
				if (!typeInfo || !typeInfo.types || !typeInfo.types.length) { // No token name is also invalid
					typeNum = 0;
					typeInfo = this.tokenTypes[0];
				}

				// Make sure all line breaks are \n !
				tokenStr = tokenStr.replace(/\r\n|\r/g, '\n');

				var token = new RustyTools.Translate.Token(typeInfo.types,
						typeInfo.check, typeNum, tokenStr, line, linePos, charPos);
				if (!typeNum) {
					token.setError('Unknown token: "' + token.str + '"');
				}
				output.push(token);
				if (this.lineBreakIndex === typeNum) {
					line++;
					linePos = 1;
				} else {
					linePos += tokenStr.length;
				}
				charPos += tokenStr.length;
				break;
			}
		}
	}
	return output;
};

/**
 * getNextToken is for lookahead durring parsing.
 * (e.g. is the next non-space token an assignment, it a ':')
 */
RustyTools.Translate.prototype.getNextToken = function(tokens, index) {
	'use strict';
	// NOTE: no next token will return null.
	while (++index < tokens.length) {
		if (tokens[index].isTestable) return tokens[index];
	}

	return null;
};

/**********
 Several of the state objects take token string  - id lists.  These are
 simply arrays that consist of:
	token_string, id_string[, token_string, id_string[...]]
 Because of the token string  - id pairs, the  id must not match
 a valid token string in the same token string  - id pair list!

A state object has the following (all optional) values:
	id:				The the id of the given state.  The StateSet can look up by id.
	allowed:		The token.str list.  The token must match one of these.
	pushIf:			A token string  - id list.  If the token str is matched, push to
							the state with the given id.
	restartIf:	A token.str list.  If one of the strs is matched - jump to the
							start of the state set.
	popIf:			A token.str list.  If one of the strs is matched - pop the state.
	jumpIf:			A token string  - id list.  If the token str is matched, switch to
							the state with the given id.
	push:				(Tested after pushIf) Push to a new state - for things like the
							for statement which have a controlled number of statements.
	pop: true		(Tested after popIf) Pop after handling this state.
	jump: true	(Tested after jumpIf) jump after handling this state.
	scopeSymbols:	true - wrap the symbol table to enter a scope
								false - unwrap the symbol table to exit the scope
								NOTE: must match the pushIf/push, or popIf/pop.

	call: 			For common sub-components.  When this state is reached immediately
							push to the given state.
	bypassIf:		This seems like jumpIf, but it happens before processing the
							state.  In general the processing is in the given state, but
							sometimes there are optional parts (like the function name).
							use bypassIf to seip over an optional token that is not given.
	bypassIfNot: For varaible modifiers ('.', '[', and function call) if the next
							token is not a modifier, the state should be skipped. (Probably
							applies to any optional modifiers.)
**********/
RustyTools.Translate.ganeralStatement = 1;
RustyTools.Translate.varDef = 2;								// an rvalue that may be a new symbol
RustyTools.Translate.paramDef = 3;								// an rvalue that may be a new symbol
RustyTools.Translate.hasVar = 4;
RustyTools.Translate.hasNewVar = 5;
RustyTools.Translate.needsRValue = 6;
RustyTools.Translate.hasRValue = 7;
RustyTools.Translate.needsJsonName = 8;

// RustyTools.Translate.check - translator auto testing types.  Some tokens
// will need to go on to the parser of testing (because the translator does
// not inspect context), but many can be handled ty the state table rules.
RustyTools.Translate.check = {
	followingAnyVariable: 1,			// Allowed after any variable.
	followingExistingVariable: 2,	// Not allowed in a variable deffinition.
	ifAllowed: 3,									// in the allowed member of the state.
	ifGroupMatched: 4,						// Allow the closer if it matches the last opener.
};

// RustyTools.Translate.typess - supports SyntaxCheck by making pre-defined
// token type arrays to prevent duplication
//
// NOTE:  1 value is the only type.
//				2 values is type and subtype
//				More than 2 values means multiple possibilities.  The handler must
//        decide which applies and change token.activeType if needed.
//				(use "" for the third type in the case of 2 possibilities.)

RustyTools.Translate.types = {
	// punctuation
	unary: ["-unary", "-unaryPrefix", "-unarySuffix"],
	unaryPrefix: ["-unary", "-unaryPrefix"],
	unarySuffix: ["-unary", "-unarySuffix"],
	binary: "-binary",
	binaryOrUnary: ["-binary", "-unaryPrefix", ""], // -unaryPrefix isn't a subtype
	separator: ["-separator"],
	memberAccess: "-memberAccess",
	conditional: ["-conditional"],
	end: "-statementEnd",
	assignment: "-assignment",
	alteration: ["-assignment", "-alteration"],

	groupStart: "-groupStart",
	groupEnd: "-groupEnd",
	arrayStart: "-arrayAccessStart",
	arrayEnd: "-arrayAccessEnd",

	// keywords
	keyword: "-keyword",
	valueKeyword: ["-keyword", "-value"],
	functionKeyword: ["-keyword", "-function"],
	prefixKeyword: ["-keyword", "-unaryPrefix"],
	suffixKeyword: ["-keyword", "-unarySuffix"],
	disallowedKeyword: ["-keyword", "-disallowed"],

	// Others
	invalid: '-invalid',
	symbol: '-symbol',
	string: '-string',
	float: ['-number', '-float'],
	int: ['-number', '-int'],
	regExp: ['-regExp', '-value'],
	comment: ['-comment','-immaterial'],
	lineBreak: ['-lineBreak', '-immaterial'],
	whitespace: ['-whitespace', '-immaterial']
};


/**
 * In a statefull language the language parser should own a StateSet
 * to handle all the possible states
 */
RustyTools.Translate.StateSet = function(states) {
	'use strict';
	this.states = states;
	// State must begin and end with null to make the backupToStart_ and
	// endsBlock work easily.
	if (this.states[0]) this.states.unshift(null);
	if (this.states[this.states.length-1]) this.states.push(null);

	this.idToIndex = {};	// A hash of name to state index

	var context = this;
	this.states.forEach(function(element, index) {
		if (element && element.id) context.idToIndex[element.id] = index;
	});
};

RustyTools.Translate.StateSet.prototype.fromIndex = function(index) {
	'use strict';
	return this.states[index];
};

RustyTools.Translate.StateSet.prototype.indexFomId = function(id) {
	'use strict';
	return this.idToIndex[id] || 0;
};

/**
 * stateManager handles transitions through the a state sequence.  Each push
 * of a parser in a statefull language should make a new StateManager.
 */
RustyTools.Translate.StateManager = function(stateSet, initialStateName,
		opt_StateEndBlock) {
	'use strict';
	this.stateSet = stateSet;

	this.groupingCounts = {};

	// stateManager remains unchanged, but this.current statcks and unstacks
	// down its prototype chain.  This way we don't need to handle passng the
	// stateManager out of the token handlers.
	this.current = {state: null, stateIndex: 0,
			endBlock: opt_StateEndBlock || '', bitflags: 1};

	this.jump(initialStateName);
};

// These bit flags can be set when states push.  This allows for determining
// when certain statements are active.  (Like inside a switch or function.)
RustyTools.Translate.StateManager.flags = {
	always: 1,
	insideFunction: 2,
	insideSwitch: 4
};

RustyTools.Translate.StateManager.prototype.addFlag = function(flag) {
	if (this.current) this.current.bitflags = flag | this.current.bitflags;
};

RustyTools.Translate.StateManager.prototype.testAllowed = function(flag) {
	return flag && (((this.current) ? this.current.bitflags :
			RustyTools.Translate.StateManager.flags.always) & flag);
};

RustyTools.Translate.StateManager.prototype.getStateName = function() {
	var name = '';
	try {
		name = this.current.state.name;
	} catch (e) {};
	return name;
},
/**
 * jump - jump to a given state.
 */
RustyTools.Translate.StateManager.prototype.jump = function(state) {
	'use strict';
	if ('number' === typeof state) {
		this.current.stateIndex += state;
	} else {
		this.current.stateIndex = this.stateSet.indexFomId(state);
	}

	this.current.state = this.stateSet.fromIndex(this.current.stateIndex);

	// For handleStateChanged chains.
	return this.handleStateChanged();
};

RustyTools.Translate.StateManager.prototype.handleStateChanged = function(
		opt_skipCall) {
	if (!opt_skipCall) {
		try {
			var toCall = this.current.state.call;
			if (toCall) {
				this.advance(1, true);
				this.push(toCall);
			}
		} catch (e) {}
	}

	try {
		if (this.current.state.setFlag) this.addFlag(this.current.state.setFlag);
	} catch (e) {}

	// For chaining.
	return this
};



RustyTools.Translate.StateManager.prototype.reset = function() {
	this.groupingCounts = {};

	var index = 0;
	while (!this.stateSet.states[index]) index++;
	this.current.stateIndex = index;
	this.jump(0);
};

RustyTools.Translate.StateManager.prototype.push = function(state, token, opt_closer) {
	'use strict';
	this.current = RustyTools.wrapObject(this.current);
	this.jump(state);

	if (opt_closer) {
		this.current.endBlock = opt_closer;
	} else {
		this.current.endBlock = '';
	}

	// For handleStateChanged chains.
	return this.handleStateChanged();
};

RustyTools.Translate.StateManager.prototype.advance = function(opt_count,
		opt_skipHandleCall) {
	'use strict';
	if (opt_count == null) opt_count = 1;

	var step = 1;
	if (0 > opt_count) {
		step = -1;
		opt_count = -opt_count;
	}

	while (opt_count--) {
		if (1 === step && this.current && this.current.state &&
				this.current.state.jump != null) {
			this.jump(this.current.state.jump);
		} else {
			this.current.state = this.stateSet.states[(this.current.stateIndex +=
					step)];
		}
	}

	if (!this.current.state) this.pop_();

	// For handleStateChanged chains.
	return this.handleStateChanged(opt_skipHandleCall);
};

RustyTools.Translate.StateManager.prototype.retreat = function() {
	'use strict';
	return this.advance(-1);
};

RustyTools.Translate.StateManager.prototype.backupToStart_ = function() {
	'use strict';
	// Back up to a null or to before 0.
	while (this.stateSet.states[--this.current.stateIndex]);

	// Advance one to find the start state. Return true if the state is found.
	this.current.state = this.stateSet.states[++this.current.stateIndex];

	// For handleStateChanged chains.
	return this.handleStateChanged();
};

RustyTools.Translate.StateManager.prototype.advanceToEnd_ = function() {
	'use strict';
	// Back up to a null or to before 0.
	while (this.stateSet.states[++this.current.stateIndex]);

	this.current.state = this.stateSet.states[this.current.stateIndex];

	// For handleStateChanged chains.
	return this.handleStateChanged();
};

RustyTools.Translate.StateManager.prototype.pop_ = function(/*token*/) {
	'use strict';

	var lastIndex = (this.current) ? (this.current.stateIndex || 1) : 1;
	// "push" chained the prototype, so "pop" unchains.
	// Only pop the wrapped prototypes.
	this.current.state = null;
	while (!this.current.state && this.current.rustyToolsIsWrapped &&
			this.current.rustyToolsIsWrapped()) {
		this.current = Object.getPrototypeOf(this.current);

		// The state may auto-pop
		if (this.current.state && this.current.state.pop) this.current.state = null;
	}

	if (!this.current.state) {
		this.current.stateIndex = lastIndex;
		this.backupToStart_();
	}

	// No need to tansition on the new sate.  The advance before push makes
	// sure that the popped state is for the next token.

	// For handleStateChanged chains.
	return this.handleStateChanged();
};

// Find the ID or offset for a given token or type
RustyTools.Translate.StateManager.prototype.getId_ = function(ids,
		tokenStr, tokenType) {
	'use strict';
	var id;
	try {
		id = ids[tokenStr];
		if (!id && tokenType) id = ids[tokenType];
	} catch(e) {}

	return id;
};

RustyTools.Translate.StateManager.prototype.handleScope = function(token, symbolTable) {
	'use strict';
	var outSymbolTable = symbolTable;

	if (this.current && this.current.state && this.current.state.scopeSymbols) {
		// Enter the scope/push if the pushIf or push matches
		if (this.getId_(this.current.state.pushIf, token.str, token.activeType) ||
				this.current.state.push) {
			outSymbolTable = RustyTools.wrapObject(symbolTable);
		}
	}

	return outSymbolTable;
};

// checkToken validates the token in the given state accorting to the "check"
// type.
RustyTools.Translate.StateManager.prototype.checkToken = function(token) {
	var str = token.str;
	var options = this.getOptions();
	switch (token.checkType) {
		// Allowed after any variable.
		case RustyTools.Translate.check.followingAnyVariable:
			if (RustyTools.Translate.hasVar !== options &&
					RustyTools.Translate.hasNewVar !== options) {
				token.setError('"' + str +'" is not following a variable in state "' +
							this.getStateName() + '"');
			}
			break;
		// Not allowed in a variable deffinition.
		//case RustyTools.Translate.check.followingExistingVariable:
		//	if (RustyTools.Translate.hasVar !== options) {
		//		token.setError('"' + str +'" is not following a defined variable in state "' +
		//					this.getStateName() + '"');
		//	}
		//	break;
		// in the allowed member of the state.
		case RustyTools.Translate.check.ifAllowed:
			try {
				if ((!this.current.state.allowed ||
						!this.current.state.allowed[str] &&
						!this.current.state.allowed[token.activeType]) &&
						(!this.current.state.bypassIf ||
						!this.current.state.bypassIf[str] &&
						!this.current.state.bypassIf[token.activeType])) {
					token.setError('"' + str +'" is not allowed in state "' +
							this.getStateName() + '"');
				}
			} catch (e) {
				token.setError('this is in an invalid state.');
			}
			break;
		// Allow the closer if it matches the last opener.
		case RustyTools.Translate.check.ifGroupMatched:
			try {
				if (str !== this.current.endBlock) {
					token.setError('"' + str +'" does not match the grouping end "' +
							(this.current.endBlock || '') + '" in state "' +
							this.getStateName() + '"');
				}
			} catch (e) {
				token.setError('this is in an invalid state.');
			}
			break;
	}

	return token.error;
}

RustyTools.Translate.StateManager.prototype.transitionOnToken = function(
			parser, token, symbolTable, opt_closer) {
	'use strict';
	var outSymbolTable = symbolTable;

	// Unary tokens do not change the state,  handleBinaryOperator does all of
	// of the state transition for the binary operators.
	if (token.isTestable && !token.error && !parser.isUnaryOperator(token) &&
			!parser.handleBinaryOperator(token, this)) {
		var endBlockPop = this.current.endBlock === token.str || !this.current.state;

		if (!endBlockPop) {
			// The bypassIf or bypassIfNot may alter the current state.

			// this.current.state.bypassIf needs to be handles before the
			// rest or the state options are processed.
			if (nextStateId = this.getId_(this.current.state.bypassIf,
						token.str, activeType)) {
				this.jump(nextStateId);
			} else if (this.current.state.bypassIfNot &&
					!this.current.state.bypassIfNot[token.str]) {
				this.advance();
			}

			// Incase the bypassIf or bypassIfNot happened adjust the state.
			token.state = (this.current) ? this.current.state : null;

			endBlockPop = this.current.endBlock === token.str || !this.current.state;

			this.checkToken(token);
		}



		var isAllowedMatch = false;

		// allowed does not apply if the this.current.endBlock causes the statement pop.
		if (this.current.state && !endBlockPop) {
			// Check if the token fails to match "allowed"
			if (this.current.state.allowed) {
				if (!token.error) {
					isAllowedMatch = this.current.state.allowed[token.str] ||
							this.current.state.allowed[token.activeType];
					if (!this.testAllowed(isAllowedMatch)) {
						token.setError('The token: "' + token.str +
								'" in not allowed in state "' + this.getStateName() + '".');
					}
				}
			}
		}

		if (!token.error) {
			if (this.current.state && this.current.state.scopeSymbols === false &&
					!token.error && outSymbolTable.rustyToolsIsWrapped &&
					outSymbolTable.rustyToolsIsWrapped()) {
				// NOTE: pop only on success. The writer of the state table needs to be sure
				// the state changed!.  (Otherwise this could fail to pop on manual state advance!)
				outSymbolTable = Object.getPrototypeOf(outSymbolTable);
			}

			// Note: an empty current.state also pops!
			if (endBlockPop) {
					this.pop_(token);
			} else if (this.current.state) {
				var nextStateId;
				// State transitions do not apply to errored tokens.
				var nextStateId;

				var activeType = token.getActiveType();
				if ((nextStateId = this.getId_(this.current.state.pushIf, token.str,
					activeType))) {
					// transitionOnToken does an advance before each push so that the
					// pop will return to the next statement.  Most manual calling of
					// of push should return to the same state.  (E.g. unary or binary
					// Operator takes one or two values and produces a value, a [..]
					// takes an array value and produces a value.)
					this.advance();
					this.push(nextStateId, token, opt_closer);
				} else if (this.current.state.restartIf &&
						this.current.state.restartIf[token.str]) {
					this.backupToStart_();
				} else if (this.current.state.popIf &&
						this.current.state.popIf[token.str]) {
					this.pop_(token);
				} else if ((nextStateId = this.getId_(this.current.state.jumpIf,
						token.str, activeType))) {
					this.jump(nextStateId);
				} else if ((nextStateId = this.current.state.push)) {
					this.advance();
					this.push(nextStateId, token, opt_closer);
				} else if (this.current.state.pop) {
					this.pop_(token);
				} else if (this.current.state.jump) {
					this.jump(this.current.state.jump);
				} else if (this.getOptions() === RustyTools.Translate.needsRValue &&
						(token.hasType('-symbol') || token.hasType('-string') ||
						token.hasType('-number'))) {
					// Value found - advance.
					this.advance();
				} else if (-1 < isAllowedMatch) {
					this.advance();
				} else if (this.getOptions() === RustyTools.Translate.varDef &&
						token.hasType('-symbol')) {
					// Must be a variable!
					this.advance();
				} else if (this.getOptions() === RustyTools.Translate.paramDef &&
						(token.hasType('-symbol') || token.hasType('-string') ||
						token.hasType('-number'))) {
					// Value found - advance.
				}
			}
		}
	}

	// If a "-statementEnd" token is errored, and the statement pops without a
	// matching grouping.  Do the pop. This is not pertect; but it prevents a lot
	// of cascading errors.
	if (token.error && "-statementEnd" === token.activeType && this.current &&
			!this.current.endBlock) {
		this.pop_(token);
	}

	return outSymbolTable;
};

/**
 * isOneOf - Return true if any of the names match.
 */
RustyTools.Translate.StateManager.prototype.isOneOf = function(/* state strings*/) {
	'use strict';
	var matched = false;
	var index = arguments.length;
	while(this.current && this.current.state && !matched && index--) {
		matched = this.current.state.id=== arguments[index];
	}

	return matched;
};

/**
 * foundValue - called for tokens that can be lValues, or rValues.
 */
RustyTools.Translate.StateManager.prototype.foundValue = function(token,
		canBeLValue, canBeRValue, lValueError, rValueError) {
	'use strict';

	var options = this.getOptions();
	if (!canBeLValue && options === RustyTools.Translate.varDef) {
		token.setError(RustyTools.Str.multiReplace(lValueError, token));
	} else if (!canBeRValue && (options === RustyTools.Translate.needsRValue ||
			options === RustyTools.Translate.needsJsonName)) {
		token.setError(RustyTools.Str.multiReplace(rValueError, token));
	}

	if (!token.error && (options === RustyTools.Translate.varDef ||
			options === RustyTools.Translate.needsRValue ||
			options === RustyTools.Translate.needsJsonName)) {
		this.advance();
	}

	return !token.error;
};

/**
 * getOptions - should not need RustyTools.Translate.restartAllowed it
 * is handled in resetIfPossible
 */
RustyTools.Translate.StateManager.prototype.getOptions = function(/* state strings*/) {
	'use strict';
	return (this.current.state) ? this.current.state.options : 0;
};

/**
 * getEndStr - for checking the block end string.
 */
RustyTools.Translate.StateManager.prototype.getEndStr = function() {
	'use strict';
	return (this.state) ? this.state.blockOrEndStr : '';
};

/**
 * Set the current state for the later testing.
 */
RustyTools.Translate.StateManager.prototype.markState = function() {
	'use strict';
	this.lastIndex = this.current.stateIndex || 0;
};

/**
 * isMarkedState - check to see if that managere is still in the marked state.
 */
RustyTools.Translate.StateManager.prototype.isMarkedState = function() {
	'use strict';
	return this.lastIndex === this.current.stateIndex;
};

// parse_	Run the parser and build the symbol table.
//				Note:  parser + stateManager do the actual parsing, this just runs
//				the tokens and states.
//
// NOTE: This does not track the variable bindings.
RustyTools.Translate.prototype.parse_ = function(tokens, parser,
		stateManager, symbolTable,  opt_outputHandler, opt_fileName) {
	'use strict';
	var index = 0, nextToken, previousToken, token, opener;

	stateManager.reset();

	var context = parser.start(tokens);

	// Put the initial symbol table in the first token.
	if (tokens.length) tokens[0].symbolTable = RustyTools.wrapObject(symbolTable);

	while (index < tokens.length) {
		if (token && token.isTestable) previousToken = token;
		token = tokens[index];
		var str = token.str;

		stateManager.markState();

		// Count the depth on the grouping tokens
		if (this.groupingOpeners[str]) {
			if (!stateManager.groupingCounts[str]) stateManager.groupingCounts[str] = 0;
			token.groupingCount = stateManager.groupingCounts[str]++;
		} else if ((opener = this.groupingClosers[str])) {
			if (stateManager.groupingCounts[opener]) {
				token.groupingCount = --stateManager.groupingCounts[opener];
			} else {
				token.groupingCount = -1;
			}
		}

		// Put the index into the token to make the object handling simpler.
		token.index = index;

		// Put the state into the token for diagnostic purposes.
		token.state = stateManager.current.state;

		var stateName = stateManager.getStateName();

		// Usually 2 tokens are sufficient.  If the handler needs more it can
		// call getNextToken.
		nextToken = this.getNextToken(tokens, index);

		// Adjust the symbol table scope if needed.
		symbolTable = stateManager.handleScope(token, symbolTable);

		// Call the handler for the diven token type.
		// In a syntax highlighter, the token type call could color the token,
		// The later per-token str cal could determine the validity of the token.

		// This section is for any custom processing on the token.
		// It is valid to have no parser handlers hare.  The state manager
		// should work without the parser changing states.
		//
		// NOTE: -symbol should always be called.  The state transition does not
		// care about undefined symbols. or outof place statements.
		//
		// NOTE: the operator types should also be called.  The state transition
		// table does change states on an operator.  (In C like languages the
		// surrounding tokens must be checked to see if the operator is valid.)
		//
		var calls = [parser.anyToken, parser[token.activeType], parser['__' + str],
				parser['__' + stateName]];

		for (var i=0; i<calls.length; i++) {
			var fn = calls[i];
			if (fn && 'function' === typeof fn) {
				try {
					fn.call(parser, context, str, token, stateManager, symbolTable,
							previousToken, nextToken, tokens, this);
				} catch(e) {}
			}
		}

		// Processing the token may have changed the state manually. If it did
		// skip the transitionOnToken call.  Always do transitionOnToken for a
		// null state!  - Need to pop to a good state.
		//
		// Note: immaterial - !isTestable tokens (comments and whitespace)
		// do not transition.
		if (!stateManager.current.state || stateManager.isMarkedState()) {
			symbolTable = stateManager.transitionOnToken(parser, token, symbolTable,
					this.groupingOpeners[str]);
		}

		if (token.unrecoverable) {
			throw new SyntaxError(
				'Fatal error at token: "' + tokens[index].str + '"  line: ' +
				token.line + '  position: ' + token.linePosition,
				opt_fileName || "unknown", index);
		}

		index++;
	}

	return parser.end(context);
};

/**
 * parseTokens is lower level than parse. Use this when you want to keep the
 * token array.
 * Note:				parser + stateManager do the actual parsing, this just
 *							runs the tokens and states.
 *
 * NOTE: This does not track the variable bindings.
 */
RustyTools.Translate.prototype.parseTokens = function(tokens, parser,
		stateManager, symbolTable, opt_fileName) {
	'use strict';
	return this.parse_(tokens, parser, stateManager, symbolTable,
			opt_fileName);
};

/**
 * parser is lower level than parse. Use parseTokens when you want to keep the
 *				source tokens
 * Note:  parser + stateManager do the actual parsing, this just runs the
 *				tokens and states.
 *
 * NOTE: This does not track the variable bindings.
 */
RustyTools.Translate.prototype.parse = function(src, parser,
		stateManager, symbolTable, opt_fileName) {
	'use strict';
	var tokens = this.extractTokens(src);
	return this.parseTokens(tokens, parser, stateManager, symbolTable,
			opt_fileName);
};

RustyTools.Translate.NumberToken = function(numberInfo) {
	'use strict';
	if (!numberInfo) numberInfo = {};
	this.prefix = (undefined !== numberInfo.prefix) ? numberInfo.prefix : '';
	this.numerals = (undefined !== numberInfo.numerals) ? numberInfo.numerals : '[0-9]';
	this.nonZero = this.numerals.replace(/0/g, '1');
	this.decimal = numberInfo.decimal;    // '\\.' for decimals undefined or nil means no decimal
	this.exp = numberInfo.exp;            // '[eE]' for decimals undefined or nil means no decimal
	this.expPrefix = (undefined !== numberInfo.expPrefix) ? numberInfo.expPrefix : '[+-]?';
	this.types = (numberInfo.types) ? numberInfo.types : (this.decimal) ?
		RustyTools.Translate.types.float : RustyTools.Translate.types.int;

	// I don't know any language that allows a symbol right after a number, so
	// I do not have a real-life test case.
	// \u2028 & \u2029 are whitespace!
	this.canNotFollowNumber = (undefined !== numberInfo.canNotFollowNumber) ?
			numberInfo.canNotFollowNumber :
			'[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]';
};

RustyTools.Translate.NumberToken.prototype.toRegExpStr = function() {
	'use strict';
	return '(' + this.prefix + this.numerals + '+' +
			((this.decimal) ? ('(?:' + this.decimal + this.numerals + '*)') : '') +
			((this.exp) ? ('(?:(?:' + this.exp + this.expPrefix + this.nonZero +
								this.numerals + '*)|(?!' + this.exp + '))' ) : '') +
			((this.canNotFollowNumber) ? '(?!' + this.canNotFollowNumber + ')' : '') +
			')';
};

RustyTools.Translate.SymbolToken = function(symbolInfo) {
	'use strict';
	if (!symbolInfo) symbolInfo = {};
	this.prefix = (undefined !== symbolInfo.prefix) ? symbolInfo.prefix : '';
	// \u2028 & \u2029 are whitespace!
	this.firstChar = (undefined !== symbolInfo.firstChar) ? symbolInfo.firstChar :
			'[A-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]';
	this.chars = (undefined !== symbolInfo.chars) ? symbolInfo.chars :
			'[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]';
	this.suffix = (undefined !== symbolInfo.suffix) ? symbolInfo.suffix : '';

	this.types = (symbolInfo.types) ? symbolInfo.types: RustyTools.Translate.types.symbol;
};

RustyTools.Translate.SymbolToken.prototype.toRegExpStr = function() {
	'use strict';
	return '(' + this.prefix + this.firstChar + ((this.chars) ? (this.chars +
			((this.firstChar) ? '*' : '+')) :
			'') + this.suffix + ')';
};

/**
 *.Translate.LiteralToken - comments, quoted strings, and things like cdata
 */
RustyTools.Translate.LiteralToken = function(symbolInfo) {
	'use strict';
	if (!symbolInfo) symbolInfo = {};
	this.prefix = (undefined !== symbolInfo.prefix) ? symbolInfo.prefix : '\\/\\/';
	this.escape = (undefined !== symbolInfo.escape) ? symbolInfo.escape : '';
	this.suffix = (undefined !== symbolInfo.suffix) ? symbolInfo.suffix : '(?=\\r\\n|\\n|\\r|$)';

	// Override for strings, cdata or any other non comment!
	this.types = (symbolInfo.types) ? symbolInfo.types : RustyTools.Translate.types.comment;
};

RustyTools.Translate.LiteralToken.prototype.toRegExpStr = function() {
	'use strict';
	var regExStr = '(' + this.prefix;

	if (1 === this.suffix.length && 1 >= this.escape.length) {
		// Single char suffix - the easy way
		if ((this.escape)) {
			// The escape really should be just 1 character!
			regExStr += '(?:' + this.escape +
					'[\\s\\S]|[^' + this.escape + this.suffix + '])*';
		} else {
			regExStr += '[^' + this.suffix + ']*';
		}
	} else {
		// Multi-character suffix or multi-character escape.
		// (Multi-character escape?  Should work, but it seems like a really bad idea.)
		if ((this.escape)) {
			regExStr += '(?:' + this.escape +
					'[\\s\\S]|(?!' + this.escape + '|' + this.suffix + ')[\\s\\S])*';
		} else {
			regExStr += '(?:(?!' + this.suffix + ')[\\s\\S])*';
		}
	}

	return regExStr + this.suffix + ')';
};

/**
 *.Translate.RegExpToken - When better tuning is needed.
 */
RustyTools.Translate.RegExpToken = function(regExStr, types) {
	'use strict';
	this.regExStr = regExStr;

	this.types = types || '';
};

RustyTools.Translate.RegExpToken.prototype.toRegExpStr = function() {
	'use strict';
	return this.regExStr;
};


