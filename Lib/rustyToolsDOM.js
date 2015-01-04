/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint eqnull: true, curly: false, latedef: true, newcap: true, undef: true, unused: true, strict: true, browser: true, devel: true*/
/* global self, Document, Element */   // self is the generic global it is "window" im aweb page, or the clobal in a web worker.
                    // js hint should know this!


/**
 * Make a dom element and set any properties.
 */
Element.prototype.createElementFromObject = function(templateObj, opt_document) {
    "use strict";
    var element = (opt_document || document).createElement(templateObj.tag);
    element.addOneLevel(templateObj);
    return element;
};

Document.prototype.isEnabled = function(xpathOrCSSQuery, optScopeElement) {
    "use strict";
    var enabled;	// undefined - false but not === false
    var el;
    
    if (!optScopeElement) optScopeElement = this;

    // NOTE: document.evaluate / xpath is not supported by I.E.!
    if (this.evaluate && -1 < xpathOrCSSQuery.search(/\//)) {
        var elements = this.evaluate(xpathOrCSSQuery, optScopeElement, null,
                self.XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
        try {
            while ((enabled !== false) && (el = elements.iterateNext()) &&
                    (enabled = !el.disabled));
        } catch (e) {}
    } else {
        if ('function' === typeof optScopeElement.querySelectorAll) {
            // NOTE: querySelectorAll returns a NodeList that is array like, but not
            // actually an array.
            var nodeList = optScopeElement.querySelectorAll(xpathOrCSSQuery);
            var index = nodeList.length;
            enabled = !!nodeList.length;
            while ((false !== enabled) && index--) {
                enabled = !nodeList[index].disabled;
            }
        } else if ('#' === xpathOrCSSQuery[0]) {
            el = optScopeElement.getElementById(xpathOrCSSQuery.substr(1));
            enabled = el && !el.disabled;
        }
    }
    return !!enabled;
};

