/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The testers have a lot of tiny functons - use the whole script "use strict".
"use strict";

RustyTools.Xhr.__test = function(t, r) {
	// .Fn level RustyTools methods
	t.test([
		'RustyTools.Xhr.__test\n' +
		'RustyTools.Xhr.httpRequest - GET existing url',
		function(t, r) {
			RustyTools.Xhr.httpRequest({url: 'lib/rustyToolsEmpty.js', dataType: 'text/plain',
				onSuccessCallback: function(strData) {
					// This was an asyncronous callback, so run .test to test and show the results.
					t.test([
						'RustyTools.Xhr.httpRequest onSuccessCallback',
						function(t, r) {
							// The content of RustyTools.empty should end with "RustyTools.Empty = {};"
							r.match(/RustyTools\.Empty = {};\s*$/, strData);
						}
					]);
				}, onFailureCallback: function(request) {
					// This was an asyncronous callback, so run .test to test and show the results.
					t.test([
						'RustyTools.Xhr.httpRequest onFailureCallback - should succeed',
						function(t, r) {
							// If it errored the request.status must be something other than 200
							r.same(request.status, 200);
						}
					]);
				}, onXMLHttpRequestLoadError: function() {
					// This was an asyncronous callback, so run .test to test and show the results.
					t.test([
						'RustyTools.Xhr.httpRequest onXMLHttpRequestLoadError',
						function(t, r) {
							// Failed to create an XHR object
							r.not("Failed to create XHR.");
						}
					]);
				}});
		},
		'RustyTools.Xhr.httpRequest - GET non-existing url',
		function(t, r) {
			RustyTools.Xhr.httpRequest({url: 'lib/rustyToolsEmpty2.js', dataType: 'text/plain',
				onSuccessCallback: function(strData) {
					// This was an asyncronous callback, so run .test to test and show the results.
					t.test([
						'RustyTools.Xhr.httpRequest onSuccessCallback',
						function(t, r) {
							// Should not succeed rustyToolsEmpty2.js does not exist
							r.not(strData || t);
						}
					]);
				}, onFailureCallback: function(request) {
					// This was an asyncronous callback, so run .test to test and show the results.
					t.test([
						'RustyTools.Xhr.httpRequest onFailureCallback - should fail',
						function(t, r) {
							// rustyToolsEmpty2.js does not exit.  Should get a non 200 return.
							// Fail but invert the failure code so we can see the code.
							r.same(request.status, 200).invertFailed();
						}
					]);
				}, onXMLHttpRequestLoadError: function() {
					// This was an asyncronous callback, so run .test to test and show the results.
					t.test([
						'RustyTools.Xhr.httpRequest onXMLHttpRequestLoadError',
						function(t, r) {
							// Failed to create an XHR object
							r.not("Failed to create XHR.");
						}
					]);
				}});
		}
	]);
};

