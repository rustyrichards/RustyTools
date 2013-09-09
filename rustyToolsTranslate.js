/**
* A JavaScript string to token array translator
*
* A symbol tree is an array of strings, or other symbol trees
*
* With a front end and back end translator it can be a compiler.
*/
RustyTools.NumberToken = function(numberInfo) {
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

RustyTools.NumberToken.prototype.toRegExpStr = function() {
	"use strict";
	return '(' + this.prefix + this.numerals + '+' +
			((this.decimal) ? ('(?:' + this.decimal + this.numerals + '*)') : '') +
			((this.exp) ? ('(?:(?:' + this.exp + this.expPrefix + this.nonZero +
								this.numerals + '*)|(?!' + this.exp + '))' ) : '') +
			((this.canNotFollowNumber) ? '(?!' + this.canNotFollowNumber + ')' : '') +
			')';
};

RustyTools.SymbolToken = function(symbolInfo) {
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

RustyTools.SymbolToken.prototype.toRegExpStr = function() {
	"use strict";
	return '(' + this.prefix + this.firstChar + ((this.chars) ? (this.chars +
			((this.firstChar) ? '*' : '+')) :
			'') + this.suffix + ')';
};

/**
 * LiteralToken - comments, quoted strings, and things like cdata
 */
RustyTools.LiteralToken = function(symbolInfo) {
	"use strict";
	if (!symbolInfo) symbolInfo = {};
	this.prefix = (undefined !== symbolInfo.prefix) ? symbolInfo.prefix : '\\/\\/';
	this.escape = (undefined !== symbolInfo.escape) ? symbolInfo.escape : '';
	this.suffix = (undefined !== symbolInfo.suffix) ? symbolInfo.suffix : '(?=\\r\\n|\\n|\\r|$)';
};

RustyTools.LiteralToken.prototype.toRegExpStr = function() {
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
 * @param   punctuationAndOperators - an array strings of the operators and punctuation.
 * @param   tokens - an array of description followed by Symbol or Number.
 * @param   languageTreeRoot - the root of the parsing tree.
 * @param   symbolTable - optional the pre-defined symbols.
 */
RustyTools.Translator = function(punctuationAndOperators, tokens, languageTreeRoot, symbolTable) {
	"use strict";
	// Convert the punctuationAndOperators into a regexp to crack the input
	// string into punctuation tokens.
	var punct = punctuationAndOperators.sort(RustyTools.Translator.reverseAsciibetical).join('\n');
	// Escape the punctuation that is used by regexp, then convert the \n to the regexp or
	punct = RustyTools.Str.regExpEscape(punct).replace(/\n/g, '|');

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

	// Lastly match anything else - this match is invalid!
	regexStr += '|([\\s\\S])';


	this.tokenizer = new RegExp(regexStr, 'g');

	this.languageTree = languageTreeRoot;
	this.initialSymbolTable = symbolTable || {};
};

 // NOTE: indixes - 0 = invalid, 1 = lineBreak, 2 = whitespace
 RustyTools.Translator.TokenTypes = [
	"invalid",
	"lineBreak",
	"whitespace"
];

RustyTools.Translator.Token = function(tokenType, token, line, position) {
	"use strict";
	this.tokenType = tokenType;
	this.str = token;
	this.line = line;
	this.position = position;
};

RustyTools.Translator.reverseAsciibetical  = function(a, b) {
	"use strict";
	return (b < a) ? -1 : b = a ? 0 : 1;
};

/**
 * extractTokens - tokenize the input string.
 *
 * @return  Array - This contains pairs of the numeric token type followed by
 *                  the token.
 */
RustyTools.Translator.prototype.extractTokens = function(input) {
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
				output.push(new RustyTools.Translator.Token(this.tokenType(tokenType),
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

RustyTools.Translator.prototype.showError = function(message, index, tokens) {
	"use strict";
	RustyTools.log(message);
	RustyTools.log("Line: " + tokens[index].line + "  position: " +
			tokens[index].position);
};

RustyTools.Translator.prototype.translate_ = function(tokens, languageTree,
		symbolTable, context) {
	"use strict";
	var output = [];
	var index = 0;
	var moreTokens = tokens.length + 2;
	while (index <= moreTokens) {
		var type = tokens[index++];

		try {
			var next = languageTree[type](this, tokens, index, symbolTable, context);

			if (-1 === next) {
				// -1 does a pop.
				return output;
			} else if ('object' === typeof(next)) {
				// Move into the next state
				output.concat(this.translate_(tokens, next, symbolTable, context));
			} else if ('string' === typeof(next)) {
				output.push(next);
			}
		} catch (e) {
			this.showError("Exception in parser:  " + e.toString(), index-1, tokens);
		}

		index++;
	}

	return output;
};

/**
 * translate takes in the source sting, tokenizes it, and then
 * uses translate_ to produce the output
 */
RustyTools.Translator.prototype.translate = function(src, contextObject) {
	"use strict";
	if (!contextObject) contextObject = {};

	var symbolTable = this.clone(this.initialSymbolTable);
	var tokens = this.extractTokens(src);

	var errorLocation = tokens.indexOf(0);
	if (-1 !== errorLocation) {
		this.showError("Unknown token", errorLocation, tokens);
		return [];
	} else {
		return this.translate_(tokens, this.languageTree, symbolTable, contextObject);
	}
};

/**
 * tokenType - Convert the token numeric type to its string.  0 is always the
 *             error 'invalid'
 *
 * @return  string
 */
RustyTools.Translator.prototype.tokenType = function(typeIndex) {
	"use strict";
	if (0 > typeIndex || this.tokenTypes.length <= typeIndex) typeIndex = 0;
	return this.tokenTypes[typeIndex];
};