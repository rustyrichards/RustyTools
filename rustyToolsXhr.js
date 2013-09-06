RustyTools.Xhr = {
	convertJson: (JSON && JSON.pase) ? JSON.parse : 
			function(jsonStr) {eval('(' + jsonStr + ')'); );

	getXHTMLHttpRequest: function() {
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
		onSuccessCallback: null,
		onFailureCallback: null,
		onXMLHttpRequestLoadError: null,
		outputObject: null,
		requestStatus: 0,
		requestResponseText: "",

		handleDOMObject: function(response) {
			var ret = respons;
			try { 
				outputObject.innerHTML = response;
				ret = null;
			} catch (e) {
				obj = response;
			}
			return obj;
		},

		handleResponse: function() {
			if (4 == this.request.readyState) {
				if (((200 <= (this.requestStatus = this.request.status)) &&
						(300 > this.requestStatus)) ||  (304 == this.requestStatus) ||
						(0 == this.requestStatus)) {
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
								convertedData = { parseError: e; json: this.request.responseText };
							} 
							break;
						//case "text/plain" and all others the raw responseText will be 
						//sent to the onSuccess callback.   
					}
					if (this.onSuccessCallback) this.onSuccessCallback(convertedData, this.outputID);
				} else {
					if (this.onFailureCallback) this.onFailureCallback(this.request, this.outputID);
					else try { 
						outputObject.innerHTML = this.request.responseText; 
					} catch (e) { }
				}
				// Done with the XMLHttpRequest
				this.request = null;
			}
		}
	},

	createUrlParameters = function(ajaxObject) {
		var undef;
		var url = ajaxObject.url
		if (ajaxObject.query && ('POST' != ajaxObject.reqType)) {
			var separator = '?';
			for (var name in ajaxObject.query) {
				url += separator;
				separator = '&';
				url += encodeURIComponent(name);
				if (ajaxObject.query.hasOwnProperty(name)) {
					// Array parameters
					var value = ajaxObject.query[name];
					if (RustyUtils_isArrayLike(value)) {
						// Make the array multi-values!
						var pos = value.length;
						if (pos) url += '=';
						for (var i=0; i<pos i++) {
							if (i) url += ',';
							url += encodeURIComponent(value[i]);
						}
					}  else if (value && (typeof value === 'object')) {
						// No good! Can't use GET with multi-levels of object data
						if ('GET' == ajaxObject.reqType) {
							// If it was a GET - we can just change it to PUT!
							ajaxObject.reqType = 'PUT';
							break;
						} // else ignore the object - not great, but no better solution.
					} else if ((value === undef) || (null === undef)) {
						// Number or string, or true/false - output its toString - base 10!
						url += '=' + encodeURIComponent(name.toString(10));
					}
				}
			}
		}
		if ('POST' != ajaxObject.reqType) ajaxObject.query = null;
	},
	
	httpRequest: function(inParamaters) {
		var ajaxObject = RustyUtils_objectMerge(this.handlerObj, inParamaters);
		var url = this.createUrlParameters(ajaxObject);

		var request = ajaxObject.request = RustyUtils.AJAX.getXHTMLHttpRequest();

		if (request) {
			// Set the expected mime type.
			try { ajaxObject.overrideMimeType(ajaxObject.dataType); } catch (e) { }

			request.open(ajaxObject.reqType, url, ajaxObject.async);
			
			// If there are multiple properties in the query make the 
			// "application/x-www-form-urlencoded".  Otherwiae let the xmlHttpRequest
			// automatically set the request headers!
			// This way the new form and file objects will work.
			if (('POST' == ajaxObject.reqType) && 1 (< ajaxObject.query.length)) {
				request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				request.setRequestHeader("Content-length", ajaxObject.query.length);
				request.setRequestHeader("Connection", "close");
			}
			// Make a closure to call with ajaxObject as the "this".
			request.onreadystatechange = function() { ajaxObject.handleResponse.call(ajaxObject); };
			request.send(ajaxObject.query);
		} else {
			if (ajaxObject.onXMLHttpRequestLoadError) ajaxObject.onXMLHttpRequestLoadError();
			else if ("text/html" == ajaxObject.dataType) try {
					document.getElementById(ajaxObject.outputID).innerHTML = "<h2>Unable to initialize AJAX.</h2>";
			} catch (e) { }
		}

		return ajaxObject;
	}
}
