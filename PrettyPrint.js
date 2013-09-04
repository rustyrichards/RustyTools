function passThrough(translator, tokens, index, symbolTable, context) {
		return tokens[index].str;
};

var printLanguageTree = {
	__passthrough: function(translator, tokens, index, symbolTable, context) {
		return tokens[index].str;
	},
	invaild: function(translator, tokens, index, symbolTable, context) {},
	lineBreak: function(translator, tokens, index, symbolTable, context) {
		var ret = tokens[index].str;
		for (var i=0; i<this.indentDepth; i++) ret += context.indentDepth;
		return ret;
	},
	token: function(translator, tokens, index, symbolTable, context) {
		return tokens[index].str;
	},
	open: this.__passthrough,
	close: this.__passthrough,
	openBlock: function(translator, tokens, index, symbolTable, context) {
		context.indentDepth++;
		return tokens[index].str;
	},
	closeBlock: function(translator, tokens, index, symbolTable, context) {
		if (context.indentDepth) --context.indentDepth;
		return tokens[index].str;
	},
	commentLine: this.__passthrough,
	commentBlock: this.__passthrough,
};

PrettyPrint = function(printConfig) {
	this.reformat = new Translator(['~', '!', '@', '#', '$', '%', '^', '&', '*',
			'-', '+', '=', ':', ';', '<', '>', ',', '.', '?', '/', '\\', '|'],
			['token', new SymbolToken(chars:
				'[^~\\!#\\$%\\^&\\*-\\+=:;<>,\\.\\?\\/\\\\|{(\\[\\])}\\s]'),
			'open', new SymbolToken(firstChar: ((undef != printConfig.open) ?
						printConfig.open : '[|('), chars: ''),
			'close', new SymbolToken(firstChar: ((undef != printConfig.close) ?
						printConfig.open : ']|)'), chars: ''),
			'openBlock', new SymbolToken(firstChar: ((undef != printConfig.open) ?
						printConfig.open : '{'), chars: ''),
			'closeBlock', new SymbolToken(firstChar: ((undef != printConfig.close) ?
						printConfig.open : '}'), chars: ''),
			'commentLine', new LiteralToken(prefix: ((undef != printConfig.commentLine) ?
						printConfig.open : '//')),
			'commentBlock', new LiteralToken(prefix: ((undef != printConfig.commentStart) ?
						printConfig.open : '/*'), suffix: ((undef != printConfig.commentEnd) ?
						printConfig.open : '*/')),
			], printLanguageTree, {indentDepth: 0, indentStr:
					(undef != printConfig.indentStr) ? printConfig.indentStr : '    '});
}
