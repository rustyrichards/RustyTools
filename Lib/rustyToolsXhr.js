// © 2013 Russell W. Richards
// License: Not yet determined.

RustyTools.Xhr = {
	convertJson: (JSON && JSON.parse) ? JSON.parse :
			function(jsonStr) {
				"use strict";
				return eval('(' + jsonStr + ')');},

	getXHTMLHttpRequest: function() {
		"use strict";
		var xhr = null;
		if (window.XMLHttpRequest) {
			xhr = new XMLHttpRequest();
		} else if (window.ActiveXObject) {
			xhr = new ActiveXObject("Msxml2.XMLHTTP");
			if (!xhr) xhr = new ActiveXObject("Microsoft.XMLHTTP");
		}
		return xhr;
	},

	handlerObj: {
		reqType: 'GET',
		dataType: 'text/json',
		async: true,
		callbackContext: null,
		onSuccessCallback: null,
		onFailureCallback: null,
		onXMLHttpRequestLoadError: null,
		outputObject: null,
		requestStatus: 0,
		requestResponseText: "",

		handleDOMObject: function(response) {
			"use strict";
			var ret = respons;
			try {
				this.outputObject.innerHTML = response;
				ret = null;
			} catch (e) {}
			return ret;
		},

		handleResponse: function() {
			"use strict";
			if (4 === this.request.readyState) {
				if (((200 <= (this.requestStatus = this.request.status)) &&
						(300 > this.requestStatus)) ||  (304 === this.requestStatus) ||
						(0 === this.requestStatus)) {
					var convertedData = (this.requestResponseText = this.request.responseText);
					switch (this.dataType) {
						case "text/html":
							convertedData = this.handleDOMObject(convertedData);
							break;
						case "text/xml":
							convertedData = this.request.responseXML;
							break;
						case "text/json":
							try {
								convertedData = this.convertJson(convertedData);
							} catch (e) {
								convertedData = {parseError: e, json: this.request.responseText};
							}
							break;
						//case "text/plain" and all others the raw responseText will be
						//sent to the onSuccess callback.
					}
					if (this.onSuccessCallback) this.onSuccessCallback.call(this.callbackContext,
							convertedData, this.outputObject, this.url);
				} else {
					if (this.onFailureCallback) this.onFailureCallback.call(this.callbackContext,
							this.request, this.outputObject, this.url);
					else try {
						this.outputObject.innerHTML = this.request.responseText;
					} catch (e) { }
				}
				// Done with the XMLHttpRequest
				this.request = null;
			}
		}
	},

	createUrlParameters: function(xhrObject) {
		"use strict";
		var undef;
		var url = xhrObject.url
		if (xhrObject.query && ('POST' != xhrObject.reqType)) {
			var queryString = RustyTools.Fn.propertyWalk(xhrObject.query,
					function(result, key, value) {
						//  Non-PUT can only support simple types, and arrays of simple types.
						var values = RustyTools.isArrayLike(value) ? value : [value];
						for (var i=0; i<values.length; i++) {
							var oneValue = values[i];
							if (!result) result = '?';
							else result += '&';

							// In a query string there can be a key with no value
							result += encodeURIComponent(key)
							if ((undef !== oneValue) && (null !== oneValue)) {
								result += '=' + encodeURIComponent(vales[i]);
							}
						}
					},
					function(key, value) {
						var isOK =  RustyTools.isArrayLike(value) || (!(key instanceof Object));
						// Sideeffect:  Convert to post if the parameter can not be handled by
						// a query string.
						if (!isOK) xhrObject.reqType = 'POST';
						return isOK;
					}, this);
		}
		if ('POST' != xhrObject.reqType) {
			if (queryString) url += queryString;
			xhrObject.query = null;
		}

		// Make sure the xhrObject.url contains the adjusted url!
		return xhrObject.url = url;
	},

	httpRequest: function(inParamaters) {
		"use strict";
		var xhrObject = RustyTools.cloneOneLevel(this.handlerObj, inParamaters);
		var url = this.createUrlParameters(xhrObject);

		var request = xhrObject.request = this.getXHTMLHttpRequest();

		if (request) {
			// Set the expected mime type.
			try { request.overrideMimeType(xhrObject.dataType); } catch (e) { }

			request.open(xhrObject.reqType, url, xhrObject.async);

			// If there are multiple properties in the query make the
			// "application/x-www-form-urlencoded".  Otherwiae let the xmlHttpRequest
			// automatically set the request headers!
			// This way the new form and file objects will work.
			if (('POST' === xhrObject.reqType) && (1 < xhrObject.query.length)) {
				request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				request.setRequestHeader("Content-length", xhrObject.query.length);
				request.setRequestHeader("Connection", "close");
			}
			// Make a closure to call with xhrObject as the "this".
			request.onreadystatechange = function() { xhrObject.handleResponse.call(xhrObject); };
			request.send(xhrObject.query);
		} else {
			if (xhrObject.onXMLHttpRequestLoadError) xhrObject.onXMLHttpRequestLoadError.call(
					xhrObject.callbackContext);
			else if ("text/html" === xhrObject.dataType) try {
					xhrObject.outputObject.innerHTML = "<h2>Unable to initialize AJAX.</h2>";
			} catch (e) { }
		}

		return xhrObject;
	}
}
