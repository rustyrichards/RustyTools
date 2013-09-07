window['RustyTools'] || (window['RustyTools'] = RustyTools = {});

RustyTools.Str = {
	// htmlEntities - see:  http://www.w3.org/TR/html4/sgml/entities.html
	htmlEntities: {
		// 24.2 Character entity references for ISO 8859-1 characters
		nbsp: 160,
		iexcl: 161,
		cent: 162,
		pound: 163,
		curren: 164,
		yen: 165,
		brvbar: 166,
		sect: 167,
		uml: 168,
		copy: 169,
		ordf: 170,
		laquo: 171,
		not: 172,
		shy: 173,
		reg: 174,
		macr: 175,
		deg: 176,
		plusmn: 177,
		sup2: 178,
		sup3: 179,
		acute: 180,
		micro: 181,
		para: 182,
		middot: 183,
		cedil: 184,
		sup1   : 185,
		ordm: 186,
		raquo: 187,
		frac14 : 188,
		frac12 : 189,
		frac34 : 190,
		iquest: 191,
		Agrave: 192,
		Aacute: 193,
		Acirc: 194,
		Atilde: 195,
		Auml: 196,
		Aring: 197,
		AElig: 198,
		Ccedil: 199,
		Egrave: 200,
		Eacute: 201,
		Ecirc: 202,
		Euml: 203,
		Igrave: 204,
		Iacute: 205,
		Icirc: 206,
		Iuml: 207,
		ETH: 208,
		Ntilde: 209,
		Ograve: 210,
		Oacute: 211,
		Ocirc: 212,
		Otilde: 213,
		Ouml: 214,
		times: 215,
		Oslash: 216,
		Ugrave: 217,
		Uacute: 218,
		Ucirc: 219,
		Uuml: 220,
		Yacute: 221,
		THORN: 222,
		szlig: 223,
		agrave: 224,
		aacute: 225,
		acirc: 226,
		atilde: 227,
		auml: 228,
		aring: 229,
		aelig: 230,
		ccedil: 231,
		egrave: 232,
		eacute: 233,
		ecirc: 234,
		euml: 235,
		igrave: 236,
		iacute: 237,
		icirc: 238,
		iuml: 239,
		eth: 240,
		ntilde: 241,
		ograve: 242,
		oacute: 243,
		ocirc: 244,
		otilde: 245,
		ouml: 246,
		divide: 247,
		oslash: 248,
		ugrave: 249,
		uacute: 250,
		ucirc: 251,
		uuml: 252,
		yacute: 253,
		thorn: 254,
		yuml: 255,
		// 24.3 Character entity references for symbols, mathematical symbols, and Greek letters
		fnof: 402,
		Alpha: 913,
		Beta: 914,
		Gamma: 915,
		Delta: 916,
		Epsilon: 917,
		Zeta: 918,
		Eta: 919,
		Theta: 920,
		Iota: 921,
		Kappa: 922,
		Lambda: 923,
		Mu: 924,
		Nu: 925,
		Xi: 926,
		Omicron: 927,
		Pi: 928,
		Rho: 929,
		Sigma: 931,
		Tau: 932,
		Upsilon: 933,
		Phi: 934,
		Chi: 935,
		Psi: 936,
		Omega: 937,
		alpha: 945,
		beta: 946,
		gamma: 947,
		delta: 948,
		epsilon: 949,
		zeta: 950,
		eta: 951,
		theta: 952,
		iota: 953,
		kappa: 954,
		lambda: 955,
		mu: 956,
		nu: 957,
		xi: 958,
		omicron: 959,
		pi: 960,
		rho: 961,
		sigmaf: 962,
		sigma: 963,
		tau: 964,
		upsilon: 965,
		phi: 966,
		chi: 967,
		psi: 968,
		omega: 969,
		thetasym: 977,
		upsih: 978,
		piv: 982,
		bull: 8226,
		hellip: 8230,
		prime: 8242,
		Prime: 8243,
		oline: 8254,
		frasl: 8260,
		weierp: 8472,
		image: 8465,
		real: 8476,
		trade: 8482,
		alefsym: 8501,
		larr: 8592,
		uarr: 8593,
		rarr: 8594,
		darr: 8595,
		harr: 8596,
		crarr: 8629,
		lArr: 8656,
		uArr: 8657,
		rArr: 8658,
		dArr: 8659,
		hArr: 8660,
		forall: 8704,
		part: 8706,
		exist: 8707,
		empty: 8709,
		nabla: 8711,
		isin: 8712,
		notin: 8713,
		ni: 8715,
		prod: 8719,
		sum: 8721,
		minus: 8722,
		lowast: 8727,
		radic: 8730,
		prop: 8733,
		infin: 8734,
		ang: 8736,
		and: 8743,
		or: 8744,
		cap: 8745,
		cup: 8746,
		int: 8747,
		there4   : 8756,
		sim: 8764,
		cong: 8773,
		asymp: 8776,
		ne: 8800,
		equiv: 8801,
		le: 8804,
		ge: 8805,
		sub: 8834,
		sup: 8835,
		nsub: 8836,
		sube: 8838,
		supe: 8839,
		oplus: 8853,
		otimes: 8855,
		perp: 8869,
		sdot: 8901,
		lceil: 8968,
		rceil: 8969,
		lfloor: 8970,
		rfloor: 8971,
		lang: 9001,
		rang: 9002,
		loz: 9674,
		spades: 9824,
		clubs: 9827,
		hearts: 9829,
		diams: 9830,
		// 24.4 Character entity references for markup-significant and internationalization characters
		quot: 34,
		amp: 38,
		lt: 60,
		gt: 62,
		OElig: 338,
		oelig: 339,
		Scaron: 352,
		scaron: 353,
		Yuml: 376,
		circ: 710,
		tilde: 732,
		ensp: 8194,
		emsp: 8195,
		thinsp: 8201,
		zwnj: 8204,
		zwj: 8205,
		lrm: 8206,
		rlm: 8207,
		ndash: 8211,
		mdash: 8212,
		lsquo: 8216,
		rsquo: 8217,
		sbquo: 8218,
		ldquo: 8220,
		rdquo: 8221,
		bdquo: 8222,
		dagger: 8224,
		Dagger: 8225,
		permil: 8240,
		lsaquo: 8249,
		rsaquo: 8250,
		euro: 8364,
	},

	// Use opt_skipWhitespace = true if you are using the CSS white-space rule to 
	// handle the whitespace.  (white-space:pre-wrap; to make it behave like a text file.)
	entitize: function(str, opt_skipWhitespace) {
		var str2 = ((str) ? str.toString() : '').replace(/&/g, '&amp;').
				replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&#34;').
				replace(/\$/g, '&#36;');
		if (!opt_skipWhitespace) str2 = str2.replace(/ /g, '&nbsp;').replace(/\r\n|\r|\n/g, '<br/>');
		return str2;
	},

	quote: function(str, quote) {
		if (!quote) quote = RustyTools.cfg.stringQuote;
		var expr = new RegExp(quote, 'g');
		return quote + ((str) ? str.toString() : '').replace(expr, '\\' + quote) + quote;
	},

	/*
	 * toString - Convert the input parameters to strings.  .
	 */
	toString: function(/*...*/) {
		var undef;

		var result = '';
		for (var i=0; i<arguments.length; i++) {
			try {
				var arg = arguments[i];
				if (undef == arg) {
					result = 'undefined';
				} else if (null == arg) {
					result = 'null';
				} else if ('function' == typeof arg) {
					result += this.toString(arg());
				} else if (Array.isArray(arg)) {
					for (var j=0; j<arg.length; j++) result += RustyTools.Str.toString(arg[j]);
				} else {
					result += arg.toString(10);
				}
			} catch (e) {RustyTools.logException(e);}
		}

		return result;
	},

	/*
	 * multiReplace - replace the taga <#id>...</#id>, <#id/>, or <+id/> etc with the supplied 
	 *                parameters. (The <+id should be numbers they will be pos incremented.)
	 *
	 *                To allow for recursive substitution <-#id>...</-#id>, <-#id/> and <-+id/>
	 *                should be used inside the content, with one extra '-' added for each
	 *                substitution level.
	 *                Note: the '-' is usually note needed.  Because the content is supstituted
	 *                before the non-content tags are supstituted!
	 *
	 *                Note: the supplied parameter can be a function; in which case it
	 *                is passed the index, and the content.
	 *
	 *                If substObjs is an array, the substitution is done for each element in the
	 *                array
	 *
	 *                You usually want the numbers in substObjs to keep increasing.  (This is usefull
	 *                for generating unique IDs)
	 *                If you need the numbers to start the same each time use 
	 *                  opt_doNotChangeSubst = true
	 */
	multiReplace: function(str, substObjs, opt_doNotChangeSubst) {
		var matches = {};
		var replaceArgs = arguments;
		var result = '';

		if (!Array.isArray(substObjs)) substObjs = [substObjs];
		for (var i=0; i<substObjs.length; i++) {
			// We need to keep the source numbers as the substitutions may change the number values.
			var substObj = substObjs[i];
			if (opt_doNotChangeSubst) substObj = RustyTools.simpleObjCopy(substObj);

			// Order of replacement matters.
			//  1) do the content matches
			//  2) do the <# matches
			//  3) do the <+ matches
			// This way any auto-incrementing numbers will happen accross the whole string.

			// Match <#id>...</#id>
			var context = this;
			var replaced = str.replace(/<#([^\/>]+)>([\s\S]*)<\/#\1>/g,
				function(match, index, content) {
					var substValue = substObj[index];
					if (substValue != null) {
						if (content) {
							// Recursively call multireplace on the content
							// Remove one level of - from <-*n
							var adjContent = content.replace(/(<\/?-*?)-([\+#])/g, '$1$2');
							// For any recursive calls opt_keepSource should be false or omitted.
							if (Array.isArray(substValue)) {
								matches[index] = '';
								for (var j=0; j<substValue.length; j++) {
									matches[index] += context.multiReplace(adjContent, substValue[j]);
								}
							} else if (substValue instanceof Object) {
								matches[index] = context.multiReplace(adjContent, substValue);
							}
						} else if (!matches[index]) {
							matches[index] = RustyTools.Str.toString(substValue);
						}
					}
					return (matches[index] == null) ? match : matches[index];
				});

			// Match <#id/> or <+id/>
			result += replaced.replace(/<(#|\+)([^\/>]+)\/>/g, 
				function(match, symbol, index, content) {
					var retVal = match;
					if (index in substObj) {
						if ('+' == symbol) {
							retVal = RustyTools.Str.toString(substObj[index]++);
						} else {
							retVal =  RustyTools.Str.toString(substObj[index]);
						}
					}
					return retVal;
				});
		}

		return (result) ? result : str;
	},

	/*
	 * mulitReplaceCleanup - remove any remaining multiReplace tags
	 */
	mulitReplaceCleanup: function(str) {
		return str.replace(/<(-*)(#|\+)([^\/>]+)(?:\/>|>([\s\S]*)<\/\1\2\3>)/g, '');
	},

	substitute: function(str, key, value) {
		var pos = str.search(key);

		if (-1 != pos) {
			return str.substr(0, pos) + value + 
					this.substitute(str.substr(pos + key.length), key, value);
		}
		return str;
	},

	regExpEscape: function(str) {
		return str.replace(/(\$|\(|\)|\*|\+|\.|\/|\?|\[|\\|\]|\^|\{|\||\})/g, '\\$1');
	},

	getQueryValues: function(str, key) {
		var expr = new RegExp( '(?:\\?|&)' + RustyTools.Str.regExpEscape(key) + '=([^&]*)', 'g');

		var result = [];
		var matches
		while (matches = expr.exec(str)) {
			if (i < matches.length) result = result.concat(matches.slice(1));
		}

		if (result.length) result = result.map(decodeURIComponent);

		return result;
	},

	toPlainText: function(str) {
		var context = this;
		// Save the src from images.  Put a spave before and after o there will be
		// a gap if the image is in the middle of text.
		return str.replace(/<img[^>]*\bsrc=(?:(?:("|')([^\1>]*)\1)|([^\s>]*))>/ig, " $2$3 ").
			// Save the href from links, but don't save any # links!
			replace(/<a[^>]*\bhref=(?:(?:("|')(?!#)([^\1>]*)\1)|((?!"|'|#)[^\s>]*))>/ig, "$2$3 ").
			// Change <br> to  \n,
			replace(/<br\s*\/?>/g, '\n').
			// Remove all other tags
			replace(/<[^>]*>/g, '').
			// Convert numeric entities
			replace(/&#([^;]*);/g, function(match, number) {
				return String.fromCharCode(parseInt(number, 10));
			}).
			// Convert string entities
			replace(/&([^;]*);/g, function(match, entityStr) {
				var val = context.htmlEntities[entityStr];
				if (val) return String.fromCharCode(val);
				return match;
			});
	}
};
