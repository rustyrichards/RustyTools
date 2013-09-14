/**
* A JavaScript string to token array Translate
*
* A symbol tree is an array of strings, or other symbol trees
*
* With a front end and back end Translate it can be a compiler.
*/
/**
 * @param   punctuationAndOperators - an array strings of the operators and punctuation.
 * @param   grouping - an array strings of group open and close.  (The depth
 *					of opening will be tracked.)
 * @param   tokens - an array of description followed by Symbol, Number ot literal.
 * @param   languageTreeRoot - the root of the parsing tree.
 * @param   symbolTable - optional the pre-defined symbols.
 */
RustyTools.Translate = function(punctuationAndOperators, grouping, tokens,
		languageTreeRoot, symbolTable) {
	"use strict";
	// Convert the punctuationAndOperators into a regexp to crack the input
	// string into punctuation tokens.
	var punct = punctuationAndOperators.sort(RustyTools.Translate.reverseAsciibetical).join('\n');
	// Escape the punctuation that is used by regexp, then convert the \n to the regexp or
	punct = RustyTools.Str.regExpEscape(punct).replace(/\n/g, '|');

	this.grouping = grouping || [];
	var groups = RustyTools.Str.regExpEscape(this.grouping.join('\n')).
			replace(/\n/g, '|');

	// NOTE: 0 = invalid, 1 = lineBreak, 2 = whitespace
	this.tokenTypes = ['invalid'];
	this.tokenTypes.push('lineBreak', 'whitespace');
	var regexStr = '(\\r\\n|\\n)|([ \\f\\n\\r\\t\\v\\u00A0\\u2028\\u2029])';

	for (var i=0; i<tokens.length; i++) {
		this.tokenTypes.push(tokens[i++]);
		regexStr += '|' + tokens[i].toRegExpStr();
	}

	this.tokenTypes.push('punctuation');
	regexStr += '|(' + punct + ')';

	if (groups) {
		this.tokenTypes.push('grouping');
		regexStr += '|(' + groups + ')';
	}

	// Lastly match anything else - this match is invalid!
	regexStr += '|([\\s\\S])';


	this.tokenizer = new RegExp(regexStr, 'g');

	this.languageTree = languageTreeRoot;
	this.initialSymbolTable = symbolTable || {};
};

 // NOTE: indixes - 0 = invalid, 1 = lineBreak, 2 = whitespace
 RustyTools.Translate.TokenTypes = [
	"invalid",
	"lineBreak",
	"whitespace"
];

RustyTools.Translate.Token = function(tokenType, token, line, position) {
	"use strict";
	this.tokenType = tokenType;
	this.str = token;
	this.line = line;
	this.position = position;
};

RustyTools.Translate.reverseAsciibetical  = function(a, b) {
	"use strict";
	return (b < a) ? -1 : b = a ? 0 : 1;
};

/**
 * extractTokens - tokenize the input string.
 *
 * @return  Array - This contains pairs of the numeric token type followed by
 *                  the token.
 */
RustyTools.Translate.prototype.extractTokens = function(input) {
	"use strict";
	var output = [];
	var result;
	var line = 1;
	var pos = 1;
	while((result = this.tokenizer.exec(input)) !== null) {
		for (var i=1; i<result.length; i++) {
			if (result[i]) {
				// 0 = invalid is a tokenizer error.
				var tokenType = (this.tokenTypes.length > i) ? i : 0;
				output.push(tokenType);
				output.push(new RustyTools.Translate.Token(this.tokenType(tokenType),
						result[i], line, pos));
				if (1 === tokenType) {
					// lineBreak
					line++;
					pos = 1;
				} else {
					pos += result[i].length;
				}
				break;
			}
		}
	}
	return output;
};

RustyTools.Translate.prototype.showError = function(message, index, tokens) {
	"use strict";
	RustyTools.log(message);
	RustyTools.log("Line: " + tokens[index].line + "  position: " +
			tokens[index].position);
};

/**
 * Interface for "converted"
 *  unrecoverable:  boolean - optional  Set .unrecoverable true if the
 *			Translate must exit.
 *  output:  any (usualy a string or a token) - optional  If .output is set it
 *			will concatinate to the array or output.
 *	lanuguageTree:  a language tree (obeject) - optional.  If lanuguageTree is
 *			set will push on the new language tree state.
 *	stack:  boolean - optional  (true= push, false = pop) Stack the
				languageTree and sumbolTable.
 */
RustyTools.Translate.prototype.translate_ = function(tokens, languageTree,
		symbolTable, context, opt_fileName) {
	"use strict";
	var languageStack = [];
	var symbolStack = [];
	var output = [];
	var index = 0;
	while (index < tokens.length) {
		index++;	// Skip the numeric values hera.
		var token = tokens[index];
		var type = token.tokenType;
		var str = token.str;

		// Count the depth on the grouping tokens
		if ('grouping' === type) {
			var groupingIndex = this.grouping.indexOf(str);
			if (-1 < groupingIndex) {
				if (groupingIndex & 1) {
					// A closer
					groupingIndex >>= 1;
					// Too many closers will generate a -1 token.groupingCount, but the
					// this.groupingCounts must pin at 0
					if (0 > (token.groupingCount = --context.groupingCounts[groupingIndex])) {
						context.groupingCounts[groupingIndex] = 0;
					}
				} else {
					// An opener
					token.groupingCount = context.groupingCounts[groupingIndex >> 1]++;
				}
			}
		}

		// Put the index into the token to make the object handling simpler.
		token.index = index;

		// Call the handler for the diven token type.
		// In a syntax highlighter, the token type call could color the token,
		// The later per-token str cal could determine the validity of the token.
		var converted;
		try {
			converted = languageTree[type].call(languageTree, str, token,
					context, symbolTable, tokens, this);
		} catch(e) {
			converted = {};
		}

		// Coud check to see that 'function' == typeof languageTree[str]
		// but this needs a try ... catch anyway, so skip the extra step.
		//
		// If it exists call a handler for the given token string.
		if (languageTree.hasOwnProperty(str)) {
			try {
				converted = languageTree[str].call(languageTree, converted,	str, token,
					context, symbolTable, tokens, this);
			} catch (e) {}
		}

		// Handle the output in "converted"
		if (converted.unrecoverable) throw new SyntaxError(
				'Fatal error at token: "' + tokens[index].str + '"',
				opt_fileName || "unknown", index);

		if (converted.output) output.push(converted.output);

		if ('stack' in converted) {
			if (converted.stack) {
				languageStack.push(languageTree);
				languageTree = converted.stack;

				symbolStack.push(symbolTable);
				symbolTable = RustyTools.cloneOneLevel(symbolTable);
			} else {
				if (languageStack.length) languageTree = languageStack.pop();
				if (symbolStack.length) symbolTable = symbolStack.pop();
			}
		}

		if (converted.lanuguageTree) languageTree = converted.lanuguageTree;
		index++;
	}

	return output;
};

/**
 * translateTokens lower level than translate.  Sometimes
 */
RustyTools.Translate.prototype.translateTokens = function(tokens, opt_contextObject, opt_fileName) {
	"use strict";
	if (!opt_contextObject) opt_contextObject = {};

	// Build the this.groupingCounts array
	var len = this.grouping.length >> 1;
	opt_contextObject.groupingCounts = new Array(len);
	while (len--) opt_contextObject.groupingCounts[len] = 0;

	var symbolTable = RustyTools.cloneOneLevel(this.initialSymbolTable);

	return this.translate_(tokens, this.languageTree, symbolTable,
			opt_contextObject, opt_fileName);
};

/**
 * translate takes in the source sting, tokenizes it, and then
 * uses translate_ to produce the output
 */
RustyTools.Translate.prototype.translate = function(src, opt_contextObject, opt_fileName) {
	"use strict";
	var tokens = this.extractTokens(src);
	return this.translateTokens(tokens, opt_contextObject, opt_fileName);
};

/**
 * tokenType - Convert the token numeric type to its string.  0 is always the
 *             error 'invalid'
 *
 * @return  string
 */
RustyTools.Translate.prototype.tokenType = function(typeIndex) {
	"use strict";
	if (0 > typeIndex || this.tokenTypes.length <= typeIndex) typeIndex = 0;
	return this.tokenTypes[typeIndex];
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
	var regExStr = this.prefix + '(';
	if ((this.escape)) {
		regExStr += '(?:(?:' + this.escape + ')?.)*?)';
	} else {
		regExStr += '.*?)';
	}
	return regExStr + this.suffix;
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
