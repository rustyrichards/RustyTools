/* global document */
/* global window */

var ui = RustyTools.Ui;

// Inject RustyTools.Str into string to make string function chaining easier.
String.prototype = RustyTools.cloneOneLevel(String.prototype, RustyTools.Str);

// Add some utilities into string to manipulate classes

// Remove 1 or more class strings.
// If the string ends in a - wild card to end of the class.
String.prototype.removeClass = function(/* class strings */) {
	"use strict";
	var result = this;
	for (var i=0; i<arguments.length; i++) {
		var expStr = RustyTools.Str.regExpEscape(arguments[i]);
		var wildcard = '';
		if ('-' === expStr[expStr.length - 1]) {
			wildcard = '[^\\s\'\"]*';
		}

		var expr = new RegExp( '\\s*' + expStr + wildcard, 'g');
		result = result.replace(expr, '');
	}

	return result;
};

// editControl handles the events from the settings.
var editControl = {
	fontSize: 12,
	tabSize: 2,

	translator: javaScriptSyntaxCheck.makeTranslator(),
	symbolTableRoot: javaScriptSyntaxCheck.makeCurrentSymbolTable(),


	setCSSText: function() {
		"use strict";
		var css = RustyTools.Str.multiReplace(
			'font-size:<#fontSize/>pt; tab-size:<#tabSize/>; -moz-tab-size:<#tabSize/>;' +
			' -ms-tab-size:<#tabSize/>;', this);
		document.getElementById('edit-parent').style.cssText = css;
	},

	getSelectionText: function() {
		"use strict";
		if (window.getSelection) {
			// window.getSelection().toString() had the markup filtered out.
			var range = window.getSelection().getRangeAt(0);
			var result = '';
			if (range) {
				// I.E. can mess up the trailng /n.  Since we are using
				// white-space:pre-wrap, the whitespace will acutally be in the
				// textContent.  So just walk the fragment's childNodes.
				var frag = range.cloneContents();
				for (var i=0; i<frag.childNodes.length; i++) result += frag.childNodes[i].textContent;
			}
			return result;
		}
		return '';
	},

	prevId: function(id) {
		"use strict";
		var parts = id.split('-');
		return parts[0] + '-' + (parseInt(parts[1], 10) - 2);
	},

	indent: function(indentCount) {
		"use strict";
		var i, frag;
		if (window.getSelection) {
			// window.getSelection().toString() had the markup filtered out.
			var range = window.getSelection().getRangeAt(0);
			if (range) {
				// Indent all the 'indent' classed, and maybe the one before.
				frag = range.cloneContents();
				var first = true;
				for (i=0; i<frag.childNodes.length; i++) {
					var node = frag.childNodes[i];
					var id = node.id;
					if ('indent' === node.className || first) {
						// If the first child is not an indent - step back one and try it.
						first = false;
						if ('indent' !== node.className) id = this.prevId(id);

						var docNode = document.getElementById(id);
						if (docNode && 'indent' === docNode.className) {
							var html = docNode.innerHTML;
							if (0 < indentCount) {
								// Add tabs to the end of 'indent'
								for (var j=0; j<indentCount; j++) html += '\t';
							} else {
								// Remove a run of up to indentCount tabs.
								var regex = new RegExp('\t{0,' + (indentCount * -1) + '}');
								html = html.replace(regex, '');
							}
							docNode.innerHTML = html;
						}
					}
				}
			}
		}

		// If nothing was selected and it is an insert - just insert tabs
		if ((!frag || !frag.childNodes || !frag.childNodes.length) && 0 < indentCount) {
			var tabs = '\t';
			for (i=1; i<indentCount; i++) tabs += '\t';
			this.insertText(tabs);
		}
	},

	insertText: function(str) {
		"use strict";
		try {
			var range = window.getSelection().getRangeAt(0);
			var frag = document.createDocumentFragment(), child,
					temp = document.createElement('body');
					temp.innerHTML = RustyTools.Str.entitize(str, true);
			while ((child = temp.firstChild)) frag.appendChild(child);

			range.deleteContents();
			range.insertNode(frag);
		} catch(e) {
			// Not ad good - will loose the selection
			try {
				document.execCommand("insertText", true, str);
			} catch(other) {}
		}
	},

	insertOnEachSelectedLine: function(toInsert) {
		"use strict";
		var str = this.getSelectionText();
		if (str) {
			str = str.replace(/([^\n]+(?:\n|$))/g, toInsert + '$1');
		} else {
			str = toInsert;
		}
		this.insertText(str);
	},

	removeOnEachSelectedLine: function(chrToRemove) {
		"use strict";
		var str = this.getSelectionText();
		if (str) {
			var regex = new RegExp('([^<chr>\n]*)<chr>([^\n]*(?:\n|$))'.replace(
					/<chr>/g, RustyTools.Str.regExpEscape(chrToRemove)), 'g');
			str = str.replace(regex, '$1$2');
		} else {
			str = '';
		}
		this.insertText(str);
	},

	keydown: function(event) {
		"use strict";
		if (event.keyCode === 9) {
			event.preventDefault();
			this.indent((event.shiftKey) ? -1 : 1);
		}
	},

	keypress: function(event) {
		"use strict";
		switch (event.keyCode) {
			case 10:
			case 13:
				this.insertText('\x0a');
				event.preventDefault();
				break;
			// Default handle all the others.
		}
	},

	options: function(event) {
		// /[^#]*#/ - all before and including the #
		switch (event.target.href.replace(/[^#]*#/, '')) {
			case 'tab+':
				if (1 == this.tabSize) this.tabSize = 2;
				else if (16 > this.tabSize) this.tabSize +=2;
				break;
			case 'tab-':
				if (2 < this.tabSize) this.tabSize -= 2;
				else this.tabSize = 1;
				break;
			case 'font+':
				if (36 > this.fontSize) this.fontSize += 2;
				break;
			case 'font-':
				if (6 < this.fontSize) this.fontSize -= 2;
				break;
			case 'toggleLineNumbers':
				var editParent = document.getElementById('edit-parent');
				if (-1 !== editParent.className.search(/\bno-numbers/)) {
					editParent.className = editParent.className.removeClass('no-numbers');
				} else {
					editParent.className = editParent.className + ' no-numbers';
				}

		}
		this.setCSSText();
	},

	font: function(event) {
		"use strict";
		// /[^#]*#/ - all before and including the #
		var element = event.target;
		while ('A' !== element.tagName) element = element.parentNode;

		var fontName = element.href.replace(/[^#]*#/, '');
		if (event.target.checked) {
			var editParent = document.getElementById('edit-parent');
			// Remove the old font name.  Add the selected one.
			editParent.className = editParent.className.removeClass('font-') +
					' ' + fontName;
		}
	},

	copy: function(event) {
		"use strict";
		event.preventDefault();
		if (event.clipboardData) {
			event.clipboardData.setData('text/plain', this.getSelectionText());
		} else if (window.clipboardData /* I.E. */) {
			window.clipboardData.setData("Text", this.getSelectionText());
		}
	},

	cut: function(event) {
		"use strict";
		this.copy();
		this.insertText('');
	},

	paste: function(event) {
		"use strict";
		event.preventDefault();
		var text = '';
		if (event.clipboardData) {
			if (/text\/html/.test(event.clipboardData.types)) {
				text = RustyTools.Str.markupToPlainText(event.clipboardData.getData('text/html'));
			}
			else if (/text\/plain/.test(event.clipboardData.types)) {
				text = event.clipboardData.getData('text/plain');
			}
		} else if (window.clipboardData /* I.E. */) {
			text = window.clipboardData.getData("Text", this.getSelectionText());
		}
		this.insertText(text);
	},

	tokenToMarkup: function(result, token) {
		"use strict";
		// Inject the first line number
		if ('number' !== typeof token) {
			switch(token.type) {
				case 'lineBreak':
				case 'whitespace':
					result +=  RustyTools.Str.mulitReplaceCleanup(
							RustyTools.Str.multiReplace('<span id="token-<#index/>" ' +
									'class="<#subType/>"><#str/></span>', token, 'pre'));
					break;
				case 'grouping':
					var groupingCount = token.groupingCount;
					if (0 < groupingCount) groupingCount &= 7;
					token.subType = 'group' + groupingCount;
					// Fall trhough wanted.
				default:
					result += RustyTools.Str.mulitReplaceCleanup(
							RustyTools.Str.multiReplace('<span id="token-<#index/>" ' +
							'class="<#getCombinedType/>" title="<#errorMessage/>">' +
							'<#str/></span>', token, 'pre'));
			}
		}
		return result;
	},

	tokenizeForEditor: function(str) {
		"use strict";
		var tokens = this.translator.extractTokens(str);
		var whitespaceIndex = this.translator.whitespaceIndex;

		//Make sure there is a whitespace at 0 and one after each lineBreak
		var index = tokens.length;
		var last;
		while(index--) {
			var token = tokens[index];
			if (token && 'lineBreak' === token.type) {
				if (!last || 'whitespace' !== last.type) {
					// Inject a whitespace after the linebreak to make the indent/outdent
					// much easier.
					var newToken = new RustyTools.Translate.Token('whitespace',
							whitespaceIndex, '', token.line+1, 0);
					newToken.subType = 'indent';
					tokens.splice(index+1, 0, newToken);
				} else {
					last.subType = 'indent';
				}
			}
			last = token;
		}
		return tokens;
	},

	parseForEditor: function(tokens) {
		"use strict";
		var count = 0;
		var str = ui.replace(ui.lineNumber, ++count) +
				this.translator.parseTokens(tokens,
				javaScriptSyntaxCheck, javaScriptSyntaxCheck.stateManager,
				this.symbolTableRoot).reduce(this.tokenToMarkup.bind(this), '');
		return str.replace(/\r\n|\r|\n/g, function() {
				return '\n' + ui.replace(ui.lineNumber, ++count);
		});
	},

	// Build an array of splice commands that will convert newTokens into oldTokens
	buildSpliceDifference: function(oldTokens, newTokens) {
		"use strict";
		var spliceCommands = [], spliceStart = -1, spliceEnd = 0, toInsert = [],
				oldCount = oldTokens.length, newCount = newTokens.length,
				oldIndex = 0, newIndex = 0;

		while (newCount-- && oldCount--) {
			var oldToken = oldTokens[oldIndex++], newToken = newTokens[newIndex++];
			if (!oldToken.isSame(newToken)) {
				if (-1 === spliceStart) spliceStart = newIndex - 1;
				if ('lineBreak' === newToken.type && 'lineBreak' !== oldToken.type ) {
					// Wait for old to get to a lineBreak
					toInsert.push(oldToken);
					// Try the new token again
					newIndex--;
					++newCount;
				} else if ('lineBreak' !== newToken.type && 'lineBreak' === oldToken.type ) {
					// Wait for new to get to a lineBreak
					spliceEnd++;
					// Try the new token again
					oldIndex--;
					++oldCount;
				} else {
					// The lengths are the same so replace. (delete and insert)
					spliceEnd++;
					toInsert.push(oldToken);
				}
			} else {
				// Same - save off the splice command.
				if (-1 !== spliceStart) {
					spliceCommands.push([spliceStart, spliceEnd].concat(toInsert));
					spliceStart = -1;
					spliceEnd = 0;
					toInsert = [];
				}
			}
		}

		if (newCount > 0) {
			// There are more at the end of newTokens, so delete them.
			if (-1 === spliceStart) spliceStart = newIndex - 1;
			spliceEnd += newCount;
		} else if (oldCount > 0) {
			// There are more at the end of newTokens, so insert them.
			while (oldCount--) toInsert.push(oldTokens[oldIndex++]);
		}

		// Save off the splice command.
		if (-1 !== spliceStart) {
			spliceCommands.push([spliceStart, spliceEnd].concat(toInsert));
		}

		// NOTE: because of the changing of the array size.  The splice commands
		// must be applied from the right (last to first use reduceRight).
		return spliceCommands;
	},

	// Splices the tokens to the previous state and rebuild spliceArray to be
	// able to revert the change.
	revertTokens: function(tokens, spliceArray) {
		"use strict";
		spliceArray.reduceRight(function(tokens, spliceParams, index, array) {
			var reverseSplice = [spliceParams[0], spliceParams.length - 1];
			array[index] = reverseSplice.concat(tokens.splice.apply(tokens, spliceParams));
			return tokens;
		}, tokens);

		return tokens;
	}
};

var page = {
	fontStyle: 'font-cousine',
	fontSize: '12pt',
	openedFiles: [],
	openedFileTokens: [],
	activeIndex: 0,
	fileMenuTimer: 0,
	tabIndex: 5,

	globalKeyDown: function(event) {
		switch (event.keyCode) {
			case 25:	// Ctrl-Y
				event.preventDefault();
				break;
			case 26:	// Ctrl-Z
				event.preventDefault();
				break;
		}
	},

	getActiveDocument: function() {
		"use strict";
		return document.getElementById('edit-area' + this.activeIndex);
	},

	makeInactive: function(index) {
		"use strict";
		if (-1 < index && index < this.openedFiles.length) {
			var active = document.getElementById('edit-area' + index);
			// Don't put in multiple "hidden" classes.
			active.className = active.className.removeClass('hidden') + ' hidden';
		}
		if (this.activeIndex === index) this.activeIndex = -1;
	},

	fileChanged: function(event) {
		"use strict";
		var id = parseInt(event.target.value, 10);
		var active;
		if (event.target.checked) {
			this.makeInactive(this.activeIndex);
			active = document.getElementById('edit-area' + id);
			active.className = active.className.removeClass('hidden');
			this.activeIndex = id;
			document.getElementById('file-name').value = this.openedFiles[id].url;
			this.openedFiles[id].active = 'checked';
		} else {
			this.makeInactive(id);
		}
	},

	urlFailed: function(request, obj, url) {
		"use strict";

		// To keep the order correct just load an error message as the buffer.
		this.urlLoaded(RustyTools.Str.multiReplace('<div style="color:red">' +
				'Failure: <#status/>  Loading: <#url/></div>', [request, this]),
				obj, url, true);
	},

	xhrLoadFailed: function() {
		"use strict";
		document.getElementById('editArea').innerHTML =
				'<div style="color:red">Failure: Unable to create an XMLHttpRequest</div>';
	},

	urlLoaded: function(data, obj, url) {
		"use strict";
		if (data && data.length && url) {
			// Remove any query or location parameters.
			var fileUrl = url.replace(/(?:\?|#)[\s\S]*/, '');
			var displayString;
			var fileIndex = this.openedFiles.indexOf(url);
			if (-1 !== fileIndex && -1 !== fileUrl.search(/\.js$/)) {
				displayString = editControl.parseForEditor((
						this.openedFileTokens[fileIndex] =
						editControl.tokenizeForEditor(data)));
			} else {
				this.openedFileTokens[fileIndex] = null;
				displayString = RustyTools.Str.entitize(data, true);
			}
			var editClassName = 'editframe';
			if (this.openedFiles.indexOf(url) === this.activeIndex) {
				// Make the first file active.
				document.getElementById('file-name').value = fileUrl;
			} else {
				editClassName += ' hidden';
			}
			document.getElementById('edit-parent').appendChild(
					RustyTools.createDomElement({
					tag: 'DIV',
					id: 'edit-area' + fileIndex,
					tabIndex: this.tabIndex++,
					contentEditable: true,
					className: editClassName,
					innerHTML: displayString,
					onkeydown: editControl.keydown.bind(editControl),
					onkeypress: editControl.keypress.bind(editControl),
					oncopy: editControl.copy.bind(editControl),
					oncut: editControl.cut.bind(editControl),
					onpaste: editControl.paste.bind(editControl)
				}));
		}
	},

	load: function() {
		"use strict";
		var menus = {
			menu: [
				{menuName: 'Options', subMenu: [
					{content: 'Colors'},
					{content: '<hr>'},
					{id: 'tab+', content: 'Tab Size Increase'},
					{id: 'tab-', content: 'Tab Size Decrease'},
					{id: 'font+', content: 'Font Size Increase'},
					{id: 'font-', content: 'Font Size Decrease'},
					{content: '<hr>'},
					{id: 'toggleLineNumbers', content: 'Toggle Line Numbers'}
				]},
				{menuName: 'Files', subMenu: []},
				{menuName: 'Font', subMenu: [
					{id: 'font-anonymous-pro', content: ui.replace(ui.radioItem, 'font',
							'font-anonymous-pro', 'Anonymous Pro')},
					{id: 'font-courier-new', content: ui.replace(ui.radioItem, 'font',
							'font-courier-new', 'Courier New')},
					{id: 'font-cousine', content: ui.replace(ui.radioItem, 'font',
							'font-cousine', 'Cousine')},
					{id: 'font-droid-sans-mono', content: ui.replace(ui.radioItem, 'font',
							'font-droid-sans-mono', 'Droid Sans Mono')},
					{id: 'font-inconsolata', content: ui.replace(ui.radioItem, 'font',
							'font-inconsolata', 'Inconsolata')},
					{id: 'font-lekton', content: ui.replace(ui.radioItem, 'font',
							'font-lekton', 'Lekton')},
					{id: 'font-nova-mono', content: ui.replace(ui.radioItem, 'font',
							'font-nova-mono', 'Nova Mono')},
					{id: 'font-ubuntu-mono', content: ui.replace(ui.radioItem, 'font',
							'font-ubuntu-mono', 'Ubuntu Mono')},
					{id: 'font-VT323', content: ui.replace(ui.radioItem, 'font',
							'font-VT323', 'VT323')}
				]},
			]
		};

		this.openedFiles = RustyTools.Str.getQueryValues('href');
		var index = this.openedFiles.length;
		while (index--) {
			if (!this.openedFiles[index]) this.openedFiles.splice(index, 1);
		}

		this.openedFiles.forEach(function loadFileMenu(fileUri) {
			menus.menu[1].subMenu.push(
					{content: ui.replace(ui.checkItem,
					'',	// Use 'checked' to check the slected file.
					// fileUri.replace... Show the name and extension only.
					fileUri.replace(/.*?([^\/]+$)/, '$1'))
					});
		});

		ui.makeComponent(ui.menu, menus, document.getElementById('menu-container'));

		RustyTools.Events.addEventListener('menu-Options', 'click',
				editControl.options.bind(editControl));
		RustyTools.Events.addEventListener('menu-Font', 'click',
				editControl.font.bind(editControl));

		// Run a the test if the paramter &test or &test=[anything other than flase]
		// is set.
		var val = RustyTools.Str.getQueryValues('test');
		// == type coersion wanted! - convert true to the string.
		if (val.length && ('true' === val[0])) {
			var syntaxTest = RustyTools.load.bind(RustyTools, RustyTools.cfg.
					rustyScriptPath.replace(/\/Lib/i, '/Syntax'),
					'javaScriptSyntaxCheck.__test');
			RustyTools.load(null, 'RustyTools.Testing', syntaxTest);
		}

		// Load each url in href parameter(s)
		this.openedFiles.reduce(function(value, arrayElement) {
			// Use XHR to load toLoad.shift();
			RustyTools.Xhr.httpRequest({url: arrayElement, dataType: 'text/plain',
				callbackContext: page, onSuccessCallback: page.urlLoaded,
				onFailureCallback: page.urlFailed,
				onXMLHttpRequestLoadError: page.xhrLoadFailed});
		}, '');
	},

	find: function(opt_editorIndex) {
		if (opt_editorIndex == null) opt_editorIndex = this.activeIndex;
		var exprStr = document.getElementById('regex-str').value;
		if (!document.getElementById('use-regex').checked) exprStr = RustyTools.Str.regExpEscape(exprStr);
		var options = (document.getElementById('no-case').checked) ? 'ig' : 'g';

		var expr = new RegExp(exprStr, options);
		var str = this.openedFileTokens[opt_editorIndex].reduce(
				function(result, token) {
					return result + token.str;
				}, '');
// For now this is just a test.  The match must be translated back to the edit.
		var matchArr, count = 1
		while ((matchArr = expr.exec(str)) !== null) {
			RustyTools.log("Match #" + count++ + ' ends at: ' + matchArr.lastIndex);
		}
	}
};

/***
Bookmarklet to edit the current web page.
javascript:var url = '//googledrive.com/host/0B6hrjAwMff9xOGczWHdqUzl5akU/WebEdit/WebEdit.html?href='; url += encodeURIComponent(window.location.href); var scripts = document.getElementsByTagName('script'); var i = scripts.length; while (i--) {if (scripts[i].src) url += "&href=" + encodeURIComponent(scripts[i].src);} window.open(url);
***/