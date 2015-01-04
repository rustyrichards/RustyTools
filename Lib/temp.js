diff --git a/Lib/rustyToolsTranslate.js b/Lib/rustyToolsTranslate.js
index 543a9da..baa6521 100644
--- a/Lib/rustyToolsTranslate.js
+++ b/Lib/rustyToolsTranslate.js
@@ -22,41 +22,11 @@ RustyTools.Translate = function(punctuation /*, tokenMatches*/ ) {
 	this.groupingOpeners = {};	// A hash matching the grouping pairs.
 	this.groupingClosers = {};	// A hash matching the grouping pairs.
 
-	this.whitespaceIndex = (this.lineBreakIndex = this.tokenTypes.length) + 1;
-	// Don't test whitespace in "checkNextToken";
-	this.tokenTypes.push({types: RustyTools.Translate.types.lineBreak},
-		{types: RustyTools.Translate.types.whitespace});
-	var regexStr = '(\\r\\n|\\n|\\r)|([ \\f\\t\\v\\u00A0\\u2028\\u2029]+)';
-
-	for (var i=1; i<arguments.length; i++) {
-		var arg = arguments[i];
-		this.tokenTypes.push({types:arg.types, check: arg.check});
-		regexStr += '|' + arguments[i].toRegExpStr();
-	}
-
-	if (!punctuation) punctuation = [];
-	if (!Array.isArray(punctuation)) {
-		throw new TypeError('RustyTools.Translate "punctuationAndOperators" was not an array');
-	}
-	punctuation = punctuation.sort(RustyTools.Translate.tokenOrder);
-
-	var context = this;
-	punctuation.forEach(function(element) {
-		if (element.end) {
-			context.groupingOpeners[element.op] = element.end;
-			context.groupingClosers[element.end] = element.op;
-		}
-
-		context.tokenTypes.push(element);
-	});
-
-	// Escape the punctuation that is used by regexp, then convert the \n to the regexp or
-	regexStr += '|(' + RustyTools.Str.regExpEscape(punctuation.map(
-		function(element) {return element.op;}).join('\n')).
-		replace(/\n/g, ')|(') + ')';
+	var regexStr = this.initWhitespace();
+	regexStr += this.initPunctuation(punctuation);
 
-	this.tokenTypes.push({types: RustyTools.Translate.types.invalid});	// Invalid
 	// Lastly match anything else - this match is invalid!
+	this.tokenTypes.push({types: RustyTools.Translate.types.invalid});	// Invalid
 	regexStr += '|([\\s\\S])';
 
 	this.tokenizer = new RegExp(regexStr, 'g');
@@ -91,22 +61,22 @@ RustyTools.Translate.Token.prototype.errorMessage = '';
 RustyTools.Translate.Token.prototype.symbolTable = '';
 
 RustyTools.Translate.Token.prototype.setTypes = function(types) {
+	'use strict';
 	this.activeType = this.types = types;
 	if ('string' !== typeof this.types) {
 		// If there is one sub-type use that, otherwis use the first type.
-		// Where there are more than 2 types, the token't handle needs to set its
+		// Where there are more than 2 types, the token't handler needs to set its
 		// type according to the context.
-		this.activeType = (2 == this.types.length) ? this.types[1] : this.types[0];
+		this.activeType = (2 === this.types.length) ? this.types[1] : this.types[0];
 	}
 },
 
 RustyTools.Translate.Token.prototype.setError = function(opt_errorMessage) {
 	'use strict';
 	// Error overrides subtype.
-	if (opt_errorMessage) {
-		this.errorMessage = opt_errorMessage + '  line: ' + this.line +
-				'  position: ' + this.linePosition;
-	}
+	this.errorMessage = ((opt_errorMessage) ? opt_errorMessage : 'Unknown error')+
+			'  line: ' + this.line + '  position: ' + this.linePosition;
+
 	this.error = true;
 };
 
@@ -123,8 +93,8 @@ RustyTools.Translate.Token.prototype.getCombindedClass = function() {
 	if ('string' !== typeof this.types && 2 === this.types.length &&
 			this.activeType !== this.types[0]) {
 		// If it is this.types is type and sub-type use both.
-		result.unshift(this.types[0])
- 	}
+		result.unshift(this.types[0]);
+	}
 	if (this.error) result.push('error');
 
 	//Strip out the leading '-' for the CSS classes
@@ -140,7 +110,7 @@ RustyTools.Translate.Token.prototype.getActiveType = function() {
 RustyTools.Translate.Token.prototype.hasType = function(type) {
 	'use strict';
 
-	var found = this.activeType == type || this.types == type;
+	var found = this.activeType === type || this.types === type;
 	if (!found && 'string' !== typeof this.types) {
 		found = -1 !== this.types.indexOf(type);
 	}
@@ -171,8 +141,8 @@ RustyTools.Translate.Token.prototype.replace = function(other) {
 	if (!this.noReparse(other)) {
 		for (var i in other) {
 			var val = other[i];
-			// If it is different and not a function, and not index copy it over.
-			if ('function' !== typeof val && 'index' !== i && this[i] !== val) this[i] = val;
+			// If it is not from the base class, different,not a function, and not index copy it over.
+			if (other.hasOwnProperty(i) && 'function' !== typeof val && 'index' !== i && this[i] !== val) this[i] = val;
 		}
 	} else {
 		// Only copy str and types.  All the others cause re-parsing.
@@ -192,6 +162,56 @@ RustyTools.Translate.tokenOrder  = function(a, b) {
 	return (b.op < a.op) ? -1 : ((a.op < b.op) ? 1 : 0);
 };
 
+// initWhitespace broken out of the constructor to keep the constructor simple
+RustyTools.Translate.prototype.otherLineEnd = new RegExp('\r\n|\r', 'g');
+try {
+	RustyTools.Translate.prototype.otherLineEnd.compile('\r\n|\r', 'g');
+} catch (e) {}  // It is OK if compile does not work, the regex just runs slower.
+
+// initWhitespace broken out of the constructor to keep the constructor simple
+RustyTools.Translate.prototype.initWhitespace = function() {
+	'use strict';
+	this.whitespaceIndex = (this.lineBreakIndex = this.tokenTypes.length) + 1;
+	// Don't test whitespace in "checkNextToken";
+	this.tokenTypes.push({types: RustyTools.Translate.types.lineBreak},
+		{types: RustyTools.Translate.types.whitespace});
+	var regexStr = '(\\r\\n|\\n|\\r)|([ \\f\\t\\v\\u00A0\\u2028\\u2029]+)';
+
+	for (var i=1; i<arguments.length; i++) {
+		var arg = arguments[i];
+		this.tokenTypes.push({types:arg.types, check: arg.check});
+		regexStr += '|' + arguments[i].toRegExpStr();
+	}
+	return regexStr;
+};
+
+// initPunctuation broken out of the constructor to keep the constructor simple
+RustyTools.Translate.prototype.initPunctuation = function(punctuation) {
+	'use strict';
+	if (!punctuation) punctuation = [];
+	if (!Array.isArray(punctuation)) {
+		throw new TypeError('RustyTools.Translate "punctuationAndOperators" was not an array');
+	}
+
+	punctuation = punctuation.sort(RustyTools.Translate.tokenOrder);
+
+	var context = this;
+	punctuation.forEach(function(element) {
+		if (element.end) {
+			context.groupingOpeners[element.op] = element.end;
+			context.groupingClosers[element.end] = element.op;
+		}
+
+		context.tokenTypes.push(element);
+	});
+
+	// Escape the punctuation that is used by regexp, then convert the \n to the
+	// expression separator.  (The ')|(' would be escaped!)
+	return '|(' + RustyTools.Str.regExpEscape(punctuation.map(
+		function(element) {return element.op;}).join('\n')).
+		replace(/\n/g, ')|(') + ')';
+};
+
 /**
  * extractTokens - tokenize the input string.
  *
@@ -201,7 +221,8 @@ RustyTools.Translate.tokenOrder  = function(a, b) {
 RustyTools.Translate.prototype.extractTokens = function(input) {
 	'use strict';
 	var output = [], result, line = 1, linePos = 1, charPos = 0;
-	while((result = this.tokenizer.exec(input)) != null) {
+	// .replace - make sure all line breaks are \n !
+	while((result = this.tokenizer.exec(input.replace(this.otherLineEnd, '\n'))) != null) {
 		for (var i=1; i<result.length; i++) {
 			var tokenStr = result[i];
 			if (tokenStr) {
@@ -214,9 +235,6 @@ RustyTools.Translate.prototype.extractTokens = function(input) {
 					typeInfo = this.tokenTypes[0];
 				}
 
-				// Make sure all line breaks are \n !
-				tokenStr = tokenStr.replace(/\r\n|\r/g, '\n');
-
 				var token = new RustyTools.Translate.Token(typeInfo.types,
 						typeInfo.check, typeNum, tokenStr, line, linePos, charPos);
 				if (!typeNum) {
@@ -413,21 +431,25 @@ RustyTools.Translate.StateManager.flags = {
 };
 
 RustyTools.Translate.StateManager.prototype.addFlag = function(flag) {
+	'use strict';
 	if (this.current) this.current.bitflags = flag | this.current.bitflags;
 };
 
 RustyTools.Translate.StateManager.prototype.testAllowed = function(flag) {
+	'use strict';
 	return flag && (((this.current) ? this.current.bitflags :
 			RustyTools.Translate.StateManager.flags.always) & flag);
 };
 
 RustyTools.Translate.StateManager.prototype.getStateName = function() {
+	'use strict';
 	var name = '';
 	try {
 		name = this.current.state.name;
 	} catch (e) {};
 	return name;
-},
+};
+
 /**
  * jump - jump to a given state.
  */
@@ -447,6 +469,7 @@ RustyTools.Translate.StateManager.prototype.jump = function(state) {
 
 RustyTools.Translate.StateManager.prototype.handleStateChanged = function(
 		opt_skipCall) {
+	'use strict';
 	if (!opt_skipCall) {
 		try {
 			var toCall = this.current.state.call;
@@ -462,12 +485,13 @@ RustyTools.Translate.StateManager.prototype.handleStateChanged = function(
 	} catch (e) {}
 
 	// For chaining.
-	return this
+	return this;
 };
 
 
 
 RustyTools.Translate.StateManager.prototype.reset = function() {
+	'use strict';
 	this.groupingCounts = {};
 
 	var index = 0;
@@ -491,31 +515,28 @@ RustyTools.Translate.StateManager.prototype.push = function(state, token, opt_cl
 	return this.handleStateChanged();
 };
 
-RustyTools.Translate.StateManager.prototype.advance = function(opt_count,
-		opt_skipHandleCall) {
+// Like advance, but no pop on null or handling  the state change.
+// (This must be done during the pop.)
+RustyTools.Translate.StateManager.prototype.rawAdvance = function(opt_step) {
 	'use strict';
-	if (opt_count == null) opt_count = 1;
-
-	var step = 1;
-	if (0 > opt_count) {
-		step = -1;
-		opt_count = -opt_count;
-	}
-
-	while (opt_count--) {
-		if (1 === step && this.current && this.current.state &&
-				this.current.state.jump != null) {
-			this.jump(this.current.state.jump);
-		} else {
-			this.current.state = this.stateSet.states[(this.current.stateIndex +=
-					step)];
-		}
+	if (!opt_step) opt_step = 1;
+	if (1 === opt_step && this.current && this.current.state &&
+			this.current.state.jump != null) {
+		this.jump(this.current.state.jump);
+	} else {
+		this.current.state = this.stateSet.states[(this.current.stateIndex +=
+				opt_step)];
 	}
 
-	if (!this.current.state) this.pop_();
+	// For chaining
+	return this;
+};
 
+RustyTools.Translate.StateManager.prototype.advance = function(opt_count,
+		opt_skipHandleCall) {
+	'use strict';
 	// For handleStateChanged chains.
-	return this.handleStateChanged(opt_skipHandleCall);
+	return this.rawAdvance(opt_count).handleStateChanged(opt_skipHandleCall);
 };
 
 RustyTools.Translate.StateManager.prototype.retreat = function() {
@@ -604,6 +625,7 @@ RustyTools.Translate.StateManager.prototype.handleScope = function(token, symbol
 // checkToken validates the token in the given state accorting to the "check"
 // type.
 RustyTools.Translate.StateManager.prototype.checkToken = function(token) {
+	'use strict';
 	var str = token.str;
 	var options = this.getOptions();
 	switch (token.checkType) {
@@ -653,7 +675,32 @@ RustyTools.Translate.StateManager.prototype.checkToken = function(token) {
 	}
 
 	return token.error;
-}
+};
+
+RustyTools.Translate.StateManager.prototype.isEndBlock = function(token) {
+		// Pop if token.str is falsy or there is no this.current.state
+	return this.current.endBlock === token.str || !this.current.state;
+};
+
+RustyTools.Translate.StateManager.prototype.handleBypas = function(token) {
+	// The bypassIf or bypassIfNot may alter the current state.
+
+	// this.current.state.bypassIf needs to be handled before the
+	// rest or the state options are processed.
+	if (nextStateId = this.getId_(this.current.state.bypassIf,
+				token.str, token.activeType)) {
+		this.jump(nextStateId);
+	} else if (this.current.state.bypassIfNot &&
+			!this.current.state.bypassIfNot[token.str]) {
+		this.advance();
+	}
+
+	// Incase the bypassIf or bypassIfNot happened adjust the state.
+	token.state = (this.current) ? this.current.state : null;
+
+	// For chaining
+	return this;
+};
 
 RustyTools.Translate.StateManager.prototype.transitionOnToken = function(
 			parser, token, symbolTable, opt_closer) {
@@ -664,52 +711,29 @@ RustyTools.Translate.StateManager.prototype.transitionOnToken = function(
 	// of the state transition for the binary operators.
 	if (token.isTestable && !token.error && !parser.isUnaryOperator(token) &&
 			!parser.handleBinaryOperator(token, this)) {
-		var endBlockPop = this.current.endBlock === token.str || !this.current.state;
-
+		// Pop if token.str is falsy or there is no this.current.state
+		var endBlockPop = this.isEndBlock(token);
 		if (!endBlockPop) {
-			// The bypassIf or bypassIfNot may alter the current state.
-
-			// this.current.state.bypassIf needs to be handles before the
-			// rest or the state options are processed.
-			if (nextStateId = this.getId_(this.current.state.bypassIf,
-						token.str, activeType)) {
-				this.jump(nextStateId);
-			} else if (this.current.state.bypassIfNot &&
-					!this.current.state.bypassIfNot[token.str]) {
-				this.advance();
-			}
-
-			// Incase the bypassIf or bypassIfNot happened adjust the state.
-			token.state = (this.current) ? this.current.state : null;
-
-			endBlockPop = this.current.endBlock === token.str || !this.current.state;
-
+			endBlockPop = this.handleBypas(token).isEndBlock(token);
 			this.checkToken(token);
 		}
 
-
-
 		var isAllowedMatch = false;
 
 		// allowed does not apply if the this.current.endBlock causes the statement pop.
-		if (this.current.state && !endBlockPop) {
-			// Check if the token fails to match "allowed"
-			if (this.current.state.allowed) {
-				if (!token.error) {
-					isAllowedMatch = this.current.state.allowed[token.str] ||
-							this.current.state.allowed[token.activeType];
-					if (!this.testAllowed(isAllowedMatch)) {
-						token.setError('The token: "' + token.str +
-								'" in not allowed in state "' + this.getStateName() + '".');
-					}
-				}
+		if (!token.error && this.current.state && !endBlockPop &&
+				this.current.state.allowed) {
+			isAllowedMatch = this.current.state.allowed[token.str] ||
+					this.current.state.allowed[token.activeType];
+			if (!this.testAllowed(isAllowedMatch)) {
+				token.setError('The token: "' + token.str +
+						'" in not allowed in state "' + this.getStateName() + '".');
 			}
 		}
 
 		if (!token.error) {
 			if (this.current.state && this.current.state.scopeSymbols === false &&
-					!token.error && outSymbolTable.rustyToolsIsWrapped &&
-					outSymbolTable.rustyToolsIsWrapped()) {
+					!token.error && outSymbolTable.rustyToolsIsWrapped) {
 				// NOTE: pop only on success. The writer of the state table needs to be sure
 				// the state changed!.  (Otherwise this could fail to pop on manual state advance!)
 				outSymbolTable = Object.getPrototypeOf(outSymbolTable);
@@ -719,7 +743,6 @@ RustyTools.Translate.StateManager.prototype.transitionOnToken = function(
 			if (endBlockPop) {
 					this.pop_(token);
 			} else if (this.current.state) {
-				var nextStateId;
 				// State transitions do not apply to errored tokens.
 				var nextStateId;
 
@@ -731,8 +754,7 @@ RustyTools.Translate.StateManager.prototype.transitionOnToken = function(
 					// of push should return to the same state.  (E.g. unary or binary
 					// Operator takes one or two values and produces a value, a [..]
 					// takes an array value and produces a value.)
-					this.advance();
-					this.push(nextStateId, token, opt_closer);
+					this.rawAdvance().push(nextStateId, token, opt_closer);
 				} else if (this.current.state.restartIf &&
 						this.current.state.restartIf[token.str]) {
 					this.backupToStart_();
@@ -743,8 +765,7 @@ RustyTools.Translate.StateManager.prototype.transitionOnToken = function(
 						token.str, activeType))) {
 					this.jump(nextStateId);
 				} else if ((nextStateId = this.current.state.push)) {
-					this.advance();
-					this.push(nextStateId, token, opt_closer);
+					this.rawAdvance().push(nextStateId, token, opt_closer);
 				} else if (this.current.state.pop) {
 					this.pop_(token);
 				} else if (this.current.state.jump) {
