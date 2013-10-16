/**
* A JavaScript string to token array Translate
*
* A symbol tree is an array of strings, or other symbol trees
*
* With a front end and back end Translate it can be a compiler.
*/
/**
 * @param   punctuationAndOperators - an array strings of the operators and punctuation.
 * @param   assignment - an array of assignment strings.
 * @param   grouping - an array strings of group open and close.  (The depth
 *          of opening will be tracked.)
 * @param   commentMatch - an array of description followed by SymbolToken,
 *          NumberToken, LiteralToken or RegExpToken.
 * @param   tokenMatch - an array of description followed by SymbolToken,
 *          NumberToken, LiteralToken or RegExpToken.
 *
 * NOTE:    commentMatch and tokenMatch are the same kinds of arrays.
 *          The big difference it that the comment token types are recorded in
 *          spacingTokenTypes.  "checkNextToken" will skip the comments,
 *          whitespae, and line ends.
 */
RustyTools.Translate = function(punctuationAndOperators, unaryOperatotrs,
	binaryOperators, assignment, grouping,
		commentMatch, tokenMatch) {
	"use strict";

	// NOTE: 0 = invalid
	// this.tokenTypes pairs of name, testable (boolean)
	this.tokenTypes = ['invalid', true];

	if (!punctuationAndOperators) punctuationAndOperators = [];
	if (!Array.isArray(punctuationAndOperators)) {
		throw new TypeError('RustyTools.Translate "punctuationAndOperators" was not an array');
	}

	this.grouping = grouping || [];
	if (!Array.isArray(this.grouping)) {
		throw new TypeError('RustyTools.Translate "grouping" was not an array');
	}

	if (!assignment) assignment = [];
	if (!Array.isArray(assignment)) {
		throw new TypeError('RustyTools.Translate "assignment" was not an array');
	}

	// All the punctuation must be sorted together.  (We can't take the
	// + before +=, but we also can't take = before === or ==) So these must
	// all be parsed out with the same regex, and then separated.
	//
	// Convert the punctuationAndOperators into a regexp to crack the input
	// string into punctuation tokenMatch.
	var punct = punctuationAndOperators.concat(unaryOperatotrs,
			binaryOperators, assignment, this.grouping).
			sort(RustyTools.Translate.tokenOrder).join('\n');
	// Escape the punctuation that is used by regexp, then convert the \n to the regexp or
	punct = RustyTools.Str.regExpEscape(punct).replace(/\n/g, '|');

	var regexStr = '';

	for (var i=0; i<commentMatch.length; i++) {
		// Don't test comments in "checkNextToken";
		this.tokenTypes.push(commentMatch[i++], false);
		if (regexStr.length) regexStr += '|';
		regexStr += commentMatch[i].toRegExpStr();
	}
	for (i=0; i<tokenMatch.length; i++) {
		this.tokenTypes.push(tokenMatch[i++], true);
		if (regexStr.length) regexStr += '|';
		regexStr += tokenMatch[i].toRegExpStr();
	}

	this.lineBreakIndex = this.tokenTypes.length >>> 1;
	this.whitespaceIndex = this.lineBreakIndex + 1;
	// Don't test whitespace in "checkNextToken";
	this.tokenTypes.push('lineBreak', false, 'whitespace', false);
	regexStr += '|(\\r\\n|\\n)|([ \\f\\t\\v\\u00A0\\u2028\\u2029]+)';


	this.punctuationIndex = this.tokenTypes.length >>> 1;
	this.tokenTypes.push('punctuation', true);
	regexStr += '|(' + punct + ')';

	this.tokenTypes.push('', false);	// Invalid
	// Lastly match anything else - this match is invalid!
	regexStr += '|([\\s\\S])';

	// Put the assignment and groupig after the end of real matches
	this.tokenTypes.push('uniary', true);
	this.tokenTypes.push('binary', true);
	this.tokenTypes.push('assignment', true);
	this.tokenTypes.push('grouping', true);

	// Make the converter from general punction to its types
	this.punctToIndex = {};	// Punctuation to its type  index
	var context = this;
	var toIndex = function(index, punct) {
		context.punctToIndex[punct] = index;
		return index;
	};
	punctuationAndOperators.reduce(toIndex, this.punctuationIndex);
	unaryOperatotrs.reduce(toIndex, this.punctuationIndex+2);
	binaryOperators.reduce(toIndex, this.punctuationIndex+3);
	assignment.reduce(toIndex, this.punctuationIndex+4);
	grouping.reduce(toIndex, this.punctuationIndex+5);

	this.tokenizer = new RegExp(regexStr, 'g');
	try {
		this.tokenizer.compile(regexStr, 'g');
	} catch (e) {}  // It is OK if compile does not work, the regex just runs slower.
};

RustyTools.Translate.prototype.tokenTypeName_ = function(index) {
	"use strict";
	var type = (this.tokenTypes.length > (index<<1)) ? (index<<1) : 0;
	return this.tokenTypes[type];
};

RustyTools.Translate.prototype.tokenIndex_ = function(typeName) {
	"use strict";
	return this.tokenTypes.indexOf(typeName);
};

RustyTools.Translate.prototype.tokenTypeIsTestable_ = function(index) {
	"use strict";
	var type = (this.tokenTypes.length > (index<<1)) ? (index<<1) : 0;
	return this.tokenTypes[++type];
};

RustyTools.Translate.Token = function(tokenType, typeNum, tokenStr, line,
		linePosition, charPosition, isTestable) {
	"use strict";
	this.type = tokenType;
	this.typeNum = typeNum;
	this.str = tokenStr;
	this.line = line;
	this.linePosition = linePosition;
	this.charPosition = charPosition;
	this.isTestable = isTestable;
};

// So all the instances do not need to carry  default values
RustyTools.Translate.Token.prototype.error = false;
RustyTools.Translate.Token.prototype.unrecoverable = false;
RustyTools.Translate.Token.prototype.subType = '';
RustyTools.Translate.Token.prototype.errorMessage = '';
// The symbol table is added to the token at the start amd at each block.
RustyTools.Translate.Token.prototype.symbolTable = '';

RustyTools.Translate.Token.prototype.setError = function(opt_errorMessage) {
	"use strict";
	// Error overrides subtype.
	if (opt_errorMessage) {
		this.errorMessage = opt_errorMessage + '  line: ' + this.line +
				'  position: ' + this.linePosition;
	}
	this.error = true;
};

RustyTools.Translate.Token.prototype.clearError = function() {
	"use strict";
	this.errorMessage = '';
	this.error = false;
};

RustyTools.Translate.Token.prototype.getCombinedType = function() {
	"use strict";

	var result = this.type;
	if (this.subType) result += ' ' + this.subType;
	if (this.error) result += ' error';
	return result;
};

RustyTools.Translate.Token.prototype.getSubTypeOrType = function() {
	"use strict";

	return this.subType || this.type;
};

RustyTools.Translate.Token.prototype.isSame = function(other) {
	"use strict";
	return this.type === other.type && this.str === other.str;
};

// noReparse - Can this change without any need to re-parse?
RustyTools.Translate.Token.prototype.noReparse = function(other) {
	"use strict";
	return false === this.isTestable && false === other.isTestable;
};

RustyTools.Translate.Token.prototype.replace = function(other) {
	"use strict";
	if (!this.noReparse(other)) {
		for (var i in other) {
			var val = other[i];
			// If it is different and not a function, and not index copy it over.
			if ('function' !== typeof val && 'index' !== i && this[i] !== val) this[i] = val;
		}
	} else {
		// Only copy str and types.  All the others cause re-parsing.
		this.str = other.str;
		this.type = other.type;
		this.typeNum = other.typeNum;
	}
};

RustyTools.Translate.Token.prototype.possibleValue = function(opt_allowStrings) {
	return (-1 != ['symbol', 'number'].indexOf(this.type) ||
			(opt_allowStrings && 'string' === this.type)) || ')' === this.str ||
			']' === this.str;
},

RustyTools.Translate.Token.prototype.needTwoValues = function(afterToken, opt_allowStrings) {
	return this.possibleValue(opt_allowStrings) && afterToken &&
			afterToken.possibleValue(opt_allowStrings);
};

RustyTools.Translate.Token.prototype.needOneValue = function(afterToken, opt_allowStrings) {
	return this.possibleValue(opt_allowStrings) || (afterToken &&
			afterToken.possibleValue(opt_allowStrings));
};


RustyTools.Translate.tokenOrder  = function(a, b) {
	"use strict";
	// longest first
	if (b.length < a.length) return -1;
	if (a.length < b.length) return 1;
	// reverseAsciibetical
	return (b < a) ? -1 : ((a < b) ? 1 : 0);
};

/**
 * extractTokens - tokenize the input string.
 *
 * @return  Array - This contains pairs of the numeric token type followed by
 *                  the token.
 */
RustyTools.Translate.prototype.extractTokens = function(input) {
	"use strict";
	var output = [], result, line = 1, linePos = 1, charPos = 0;
	while((result = this.tokenizer.exec(input)) != null) {
		for (var i=1; i<result.length; i++) {
			var tokenStr = result[i];
			if (tokenStr) {
				// 0 = invalid is a tokenizer error.
				var typeNum = (this.tokenTypes.length > (i<<1)) ? i : 0;
				if (typeNum === this.punctuationIndex) {
					typeNum = this.punctToIndex[tokenStr];
				}
				var tokenName = this.tokenTypeName_(typeNum);
				if (!tokenName) { // No token name is also invalid
					typeNum = 0;
					tokenName = this.tokenTypes[0];
				}

				// Make sure all line breaks are \n !
				tokenStr = tokenStr.replace(/\r\n|\r/g, '\n');

				var token = new RustyTools.Translate.Token(
						tokenName, typeNum, tokenStr, line, linePos, charPos,
						this.tokenTypeIsTestable_(i));
				if (!typeNum) token.setError('Unknown token: "' + token.str + '"');
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
	"use strict";
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
	id:				  The the id of the given state.  The StateSet can look up by id.
	needs:			The token.str list.  The token must match one of these.
	pushIf:			A token string  - id list.  If the token str is matched, push to
							the state with the given id.
	pushOnAssign:	An assignment will push to the given state.  (Could be done
							with a pushIf, but often all assignments go to the same state.)
	restartIf:	A token.str list.  If one of the strs is matched - jump to the
							start of the state set.
	popIf:			A token.str list.  If one of the strs is matched - pop the state.
	jumpIf:			A token string  - id list.  If the token str is matched, push to
							the state with the given id.
	push:				(Tested after pushIf) Push to a new state - for things like the
							for statement which have a controlled number of statements.
	pop: true		(Tested after popIf) Pop after handling this state.
	jump: true	(Tested after jumpIf) jump after handling this state.
	scopeSymbols:	true - wrap the symbol table to enter a scope
								false - unwrap the symbol table to exit the scope
								NOTE: must match the pushIf/push, or popIf/pop.
**********/
RustyTools.Translate.ganeralStatement = 1;
RustyTools.Translate.varDef = 2;								// an rvalue that may be a new symbol
RustyTools.Translate.hasVar = 3;
RustyTools.Translate.needsRValue = 4;
RustyTools.Translate.hasRValue = 5;
RustyTools.Translate.needsJsonName = 6;

/**
 * In a statefull language the language parser should own a StateSet
 * to handle all the possible states
 */
RustyTools.Translate.StateSet = function(states) {
	"use strict";
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
	return this.states[index];
};

RustyTools.Translate.StateSet.prototype.indexFomId = function(id) {
	return this.idToIndex[id] || 0;
};

/**
 * stateManager handles transitions through the a state sequence.  Each push
 * of a parser in a statefull language should make a new StateManager.
 */
RustyTools.Translate.StateManager = function(stateSet, initialStateName,
		opt_StateEndBlock, opt_endBlockCount) {
	"use strict";
	this.stateSet = stateSet;

	this.groupingCounts = [];

	// stateManager remains unchanges, but this.current statcks and unstacks
	// down its prototype chain.  This way we don't need to handle passng the
	// stateManager out of the token handlers.
	this.current = {state: null, stateIndex: 0,
			endBlock: opt_StateEndBlock || '',
			endCount: (opt_endBlockCount == null) ? 1000000 : opt_endBlockCount}

	this.current.endBlock = opt_StateEndBlock || '';
	// One million - should not ba able to stack blocks that deep
	this.current.endCount = (opt_endBlockCount == null) ? 1000000 : opt_endBlockCount;

	this.jump(initialStateName);
};

/**
 * jump - jump to a given state.
 */
RustyTools.Translate.StateManager.prototype.jump = function(stateName) {
	"use strict";
	this.current.stateIndex = this.stateSet.indexFomId(stateName);
	this.current.state = this.stateSet.fromIndex(this.current.stateIndex);

	// For chaining.
	return this;
};

RustyTools.Translate.StateManager.prototype.push = function(stateName, token) {
	"use strict";
	this.current = RustyTools.wrapObject(this.current);
	this.jump(stateName);

	if (token.type === 'grouping' && token.closer) {
		this.current.endBlock = token.closer;
		this.current.endCount = token.groupingCount;
	} else {
		this.current.endBlock = '';
		this.current.endCount = 1000000;
	}

	// For chaining.
	return this;
};

RustyTools.Translate.StateManager.prototype.advance = function() {
	"use strict";
	this.current.state = this.stateSet.states[++this.current.stateIndex];

	// For chaining.
	return this;
};

RustyTools.Translate.StateManager.prototype.retreat = function() {
	"use strict";
	this.current.state = this.stateSet.states[--this.current.stateIndex];

	// For chaining.
	return this;
};

RustyTools.Translate.StateManager.prototype.backupToStart_ = function() {
	"use strict";
	// Back up to a null or to before 0.
	while (this.stateSet.states[--this.current.stateIndex]);

	// Advance one to find the start state. Return true if the state is found.
	this.current.state = this.stateSet.states[++this.current.stateIndex];

	// For chaining.
	return this;
};

RustyTools.Translate.StateManager.prototype.advanceToEnd_ = function() {
	"use strict";
	// Back up to a null or to before 0.
	while (this.stateSet.states[++this.current.stateIndex]);

	this.current.state = this.stateSet.states[this.current.stateIndex];

	// For chaining.
	return this;
};

RustyTools.Translate.StateManager.prototype.pop_ = function(token) {
	"use strict";

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

	// For chaining
	return this;
};

RustyTools.Translate.StateManager.prototype.handleScope = function(token, symbolTable) {
	"use strict";
	var outSymbolTable = symbolTable;

	if (this.current && this.current.state && this.current.state.scopeSymbols) {
		// Enter the scope/push if the pushIf matches an even index, or push
		if ((this.current.state.pushIf && !(1 & this.current.state.pushIf.indexOf(
				token.str))) || this.current.state.push) {
			outSymbolTable = RustyTools.wrapObject(symbolTable);
		}
	}

	return outSymbolTable;
};

/**********
 idIndex_  For the token string  - id  of:
 	token_string, id_string[, token_string, id_string[...]]
**********/
RustyTools.Translate.StateManager.prototype.getId_ = function(tokenStrAndIds, tokenStr) {
	var index = (tokenStrAndIds || []).indexOf(tokenStr);

	// If token str is found on an even index - return  next index (the id of the pair).
	return (1 & index) ? null /* not found */ : tokenStrAndIds[index + 1];
};

RustyTools.Translate.StateManager.prototype.transitionOnToken = function(token, symbolTable) {
	"use strict";
	var outSymbolTable = symbolTable;

	var endBlockPop = (this.current.endBlock === token.str && this.current.endCount >=
				(this.current.blockCount || 0)) || !this.current.state;

	var needsMatchIndex = -1;

	// needs does not apply if the this.current.endBlock causes the statement pop.
	if (this.current.state && !endBlockPop) {
		// Check if the token fails to match "needs"
		if (this.current.state.needs) {
			var index;
			if (!token.error && token.isTestable) {
				var needsMatchIndex = this.current.state.needs.indexOf(token.str);
				if (-1 == needsMatchIndex) {
					token.setError('The token: "' + token.str + '" was found where "' +
							this.current.state.needs + '" is required.')
				}
			}
		}
	}

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
		// State transitions do not apply to errored tokens.
		var nextStateId;
		if (!token.error) {
			if (this.current.state.pushIf && (nextStateId =
					this.getId_(this.current.state.pushIf, token.str))) {
				// transitionOnToken does an advance before each push so that the
				// pop will return to the next statement.  Most manual calling of
				// of push should return to the same state.  (E.g. unary or binary
				// Operator takes one or two values and produces a value, a [..]
				// takes an array value and produces a value.)
				this.advance();
				this.push(nextStateId, token);
			} else if (this.current.state.pushOnAssign && token.type === 'assignment') {
				// No advacne on the assignment push.  E.g.  hasVar pushes needsLvalue,
				// then pops to hasVar
				this.push(this.current.state.pushOnAssign, token);
			} else if (this.current.state.restartIf && -1 !==
					this.current.state.restartIf.indexOf(token.str)) {
				this.backupToStart_();
			} else if (this.current.state.popIf && -1 !==
					this.current.state.popIf.indexOf(token.str)) {
				this.pop_(token);
			} else if (this.current.state.jumpIf && (nextStateId =
					this.getId_(this.current.state.jumpIf, token.str))) {
				this.jump(nextStateId);
			} else if (this.current.state.push) {
				this.advance();
				this.push(this.current.state.push, token);
			} else if (this.current.state.pop) {
				this.pop_(token);
			} else if (this.current.state.jump) {
				this.jump(this.current.state.jump);
			} else if (-1 < needsMatchIndex) {
				this.advance();
			}
		}
	}

	return outSymbolTable;
};

/**
 * blocAllowed - Return true if the block opener or closer is allowed.
 */
RustyTools.Translate.StateManager.prototype.blockAllowed = function(token) {
	"use strict";
	var allowed = false;

  if (this.current.state) {
		if (token.closer && (!this.current.state.pushIf ||
				// pushIf - must match an even index.
				(1 & this.current.state.pushIf.indexOf(token.str)))) {
			token.setError('The block "' + token.str + '" is not allowed in this context.')
		} else {
			allowed = true;
		}
	} else {
		token.setError('The block "' + token.str + '" is not allowed in in the end state.')
	}

	return allowed;
};

/**
 * isOneOf - Return true if any of the names match.
 */
RustyTools.Translate.StateManager.prototype.isOneOf = function(/* state strings*/) {
	"use strict";
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
	"use strict";

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
	"use strict";
	return (this.current.state) ? this.current.state.options : 0;
};

/**
 * getEndStr - for checking the block end string.
 */
RustyTools.Translate.StateManager.prototype.getEndStr = function() {
	"use strict";
	return (this.state) ? this.state.blockOrEndStr : '';
};

/**
 * Set the current state for the later testing.
 */
RustyTools.Translate.StateManager.prototype.markState = function() {
	this.lastIndex = this.current.stateIndex || 0;
};

/**
 * isMarkedState - check to see if that managere is still in the marked state.
 */
RustyTools.Translate.StateManager.prototype.isMarkedState = function() {
	return this.lastIndex === this.current.stateIndex;
};


// parse_	Run the parser and build the symbol table.
//				Note:  parser + stateManager do the actual parsing, this just runs
//				the tokens and states.
//
// NOTE: This does not track the variable bindings.
RustyTools.Translate.prototype.parse_ = function(tokens, parser,
		stateManager, symbolTable,  opt_outputHandler, opt_fileName) {
	"use strict";
	var languageStack = [], index = 0, nextToken, previousToken, token;

	var context = parser.start(tokens);

	// Put the initial symbol table in the first token.
	if (tokens.length) tokens[0].symbolTable = RustyTools.wrapObject(symbolTable);

	while (index < tokens.length) {
		if (token && token.isTestable) previousToken = token;
		token = tokens[index];
		var type = token.type;
		var str = token.str;

		stateManager.markState();

		// Count the depth on the grouping tokens
		if ('grouping' === type) {
			var groupingIndex = this.grouping.indexOf(str);
			if (-1 < groupingIndex) {
				if (groupingIndex & 1) {
					// A closer
					groupingIndex >>= 1;
					// Too many closers will generate a -1 token.groupingCount, but the
					// this.groupingCounts must pin at 0
					if (0 > (token.groupingCount = --stateManager.groupingCounts[groupingIndex])) {
						stateManager.groupingCounts[groupingIndex] = 0;
					}
				} else {
					// An opener
					token.groupingCount = stateManager.groupingCounts[groupingIndex >> 1]++;
					token.closer = this.grouping[groupingIndex + 1];
				}
			}
		}

		// Put the index into the token to make the object handling simpler.
		token.index = index;

		// Put the state itno the token for diagnostic purposes.
		token.state = stateManager.current.state;

		var stateName = (token.state) ? (token.state.id || '') : '';

		// Usually 2 tokens are sufficient.  If the handler needs more it can
		// call getNExtToken.
		var nextToken = this.getNextToken(tokens, index);

		// Adjust the symbol table scope if needed.
		symbolTable = stateManager.handleScope(token, symbolTable);

		// Call the handler for the diven token type.
		// In a syntax highlighter, the token type call could color the token,
		// The later per-token str cal could determine the validity of the token.

		var next;

		// Call the parser on anyToken, type, str, and stateName

		var calls = [parser.anyToken, parser['__' + type], parser['__' + str],
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

		// Processing the token may have changed the state manually. If it did don't
		// call the default transitionOnToken.  Alway do transitionOnToken for a
		// null state!  - Need to pop to a good state.
		if (!stateManager.current.state || (token.isTestable &&
				stateManager.isMarkedState())) {
			symbolTable = stateManager.transitionOnToken(token, symbolTable);
		}

		if (token.unrecoverable) {
			throw new SyntaxError(
				'Fatal error at token: "' + tokens[index].str + '"  line: ' +
				token.line + '  position: ' + token.linePosition,
				opt_fileName || "unknown", index);
		}

		// If next is not null or undefined it is either a language tree push or pop.
		if (next && 'object' === typeof next) {
			if (next.parser) {
				languageStack.push(parser);
				parser = next.parser;
			} else if (next.popNode) {
				if (languageStack.length) parser = languageStack.pop();
			}
		}

		index++;
	}

	return parser.end(context);
};

/**
 * parseTokens 	is lower level than parse. Use this when you want to keep the
 *							token array.
 * Note:  			parser + stateManager do the actual parsing, this just
 *							runs the tokens and states.
 *
 * NOTE: This does not track the variable bindings.
 */
RustyTools.Translate.prototype.parseTokens = function(tokens, parser,
		stateManager, symbolTable, opt_fileName) {
	"use strict";
	// Build the this.groupingCounts array
	var len = this.grouping.length >> 1;
	stateManager.groupingCounts = new Array(len);
	while (len--) stateManager.groupingCounts[len] = 0;

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
	"use strict";
	var tokens = this.extractTokens(src);
	return this.parseTokens(tokens, parser, stateManager, symbolTable,
			opt_fileName);
};

RustyTools.Translate.NumberToken = function(numberInfo) {
	"use strict";
	if (!numberInfo) numberInfo = {};
	this.prefix = (undefined !== numberInfo.prefix) ? numberInfo.prefix : '';
	this.numerals = (undefined !== numberInfo.numerals) ? numberInfo.numerals : '[0-9]';
	this.nonZero = this.numerals.replace(/0/g, '1');
	this.decimal = numberInfo.decimal;    // '\\.' for decimals undefined or nil means no decimal
	this.exp = numberInfo.exp;            // '[eE]' for decimals undefined or nil means no decimal
	this.expPrefix = (undefined !== numberInfo.expPrefix) ? numberInfo.expPrefix : '[+-]?';

	// I don't know any language that allows a symbol right after a number, so
	// I do not have a real-life test case.
	// \u2028 & \u2029 are whitespace!
	this.canNotFollowNumber = (undefined !== numberInfo.canNotFollowNumber) ?
			numberInfo.canNotFollowNumber :
			'[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]';
};

RustyTools.Translate.NumberToken.prototype.toRegExpStr = function() {
	"use strict";
	return '(' + this.prefix + this.numerals + '+' +
			((this.decimal) ? ('(?:' + this.decimal + this.numerals + '*)') : '') +
			((this.exp) ? ('(?:(?:' + this.exp + this.expPrefix + this.nonZero +
								this.numerals + '*)|(?!' + this.exp + '))' ) : '') +
			((this.canNotFollowNumber) ? '(?!' + this.canNotFollowNumber + ')' : '') +
			')';
};

RustyTools.Translate.SymbolToken = function(symbolInfo) {
	"use strict";
	if (!symbolInfo) symbolInfo = {};
	this.prefix = (undefined !== symbolInfo.prefix) ? symbolInfo.prefix : '';
	// \u2028 & \u2029 are whitespace!
	this.firstChar = (undefined !== symbolInfo.firstChar) ? symbolInfo.firstChar :
			'[A-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]';
	this.chars = (undefined !== symbolInfo.chars) ? symbolInfo.chars :
			'[\\dA-Z_a-z\\u0080-\\u2027\\u202a-\\uffff]';
	this.suffix = (undefined !== symbolInfo.suffix) ? symbolInfo.suffix : '';
};

RustyTools.Translate.SymbolToken.prototype.toRegExpStr = function() {
	"use strict";
	return '(' + this.prefix + this.firstChar + ((this.chars) ? (this.chars +
			((this.firstChar) ? '*' : '+')) :
			'') + this.suffix + ')';
};

/**
 *.Translate.LiteralToken - comments, quoted strings, and things like cdata
 */
RustyTools.Translate.LiteralToken = function(symbolInfo) {
	"use strict";
	if (!symbolInfo) symbolInfo = {};
	this.prefix = (undefined !== symbolInfo.prefix) ? symbolInfo.prefix : '\\/\\/';
	this.escape = (undefined !== symbolInfo.escape) ? symbolInfo.escape : '';
	this.suffix = (undefined !== symbolInfo.suffix) ? symbolInfo.suffix : '(?=\\r\\n|\\n|\\r|$)';
};

RustyTools.Translate.LiteralToken.prototype.toRegExpStr = function() {
	"use strict";
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
RustyTools.Translate.RegExpToken = function(regExStr) {
	"use strict";
	this.regExStr = regExStr;
};

RustyTools.Translate.RegExpToken.prototype.toRegExpStr = function() {
	"use strict";
	return this.regExStr;
};


