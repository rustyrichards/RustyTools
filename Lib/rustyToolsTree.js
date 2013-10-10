// Object Tree support

RustyTools.Tree = {
	// In findMatchingDescendants the startObj may not be matched, but for all others the parent
	// must match be matched for the children to be tested.  (Only matching decendants of matching
	// parents.)
	findMatchingDescendants: function(startObj, fnIsObjMatched, fnGetChildren) {
		"use strict";
		var matchedObjs = [];
		var lastMoLength = 0;
		// startObj may be desired, or maybe we just want the children.
		if (fnIsObjMatched(startObj)) matchedObjs.push(startObj);

		// Walk the tree of objects. Don't recurse inteate;
		// JavaScript has a limited stack.
		//
		// Iteration method:
		//  Save the last length of the found objects.
		//  For each of the new matched objects find all its children and check to see if they match.
		do {
			var index = lastMoLength;
			lastMoLength = matchedObjs.length;
			var toCheck = (lastMoLength) ? matchedObjs : [startObj];
			while (index < toCheck.length) {
				var newObjs = fnGetChildren(toCheck[index]);
				for (var j=0; j<newObjs.length; j++) {
					var testObj = newObjs[j];
					if (fnIsObjMatched(testObj)) {
						if (-1 === matchedObjs.indexOf(testObj)) matchedObjs.push(testObj);
					}
				}
				index++;
			}
		} while (lastMoLength < matchedObjs.length);

		return matchedObjs;
	},

	// findAllMatches is simular to findMatchingDescendants except it will search the whole object tree
	// and return all object that pass fnIsObjMatched
	findAllMatches: function(startObj, fnIsObjMatched, fnGetChildren) {
		"use strict";
		// allObjsInTree is needed to prevent duplicates. (The same object in different parts of the tree.)
		var allObjsInTree = [startObj];
		var matchedObjs = [];
		var lastObjsLength = 0;

		if (fnIsObjMatched(startObj)) matchedObjs.push(startObj);

		// Walk the tree of objects. Don't recurse inteate;
		// JavaScript has a limited stack.
		//
		// Iteration method:
		//  Save the last length of the found objects.
		//  For each of the new matched objects find all its children and check to see if they match.
		do {
			var index = lastObjsLength;
			lastObjsLength = allObjsInTree.length;
			while (index < allObjsInTree.length) {
				var newObjs = fnGetChildren(allObjsInTree[index]);
				for (var j=0; j<newObjs.length; j++) {
					var testObj = newObjs[j];
					if (-1 === allObjsInTree.indexOf(testObj)) {
						// Here testObj is unique.
						allObjsInTree.push(testObj);
						if (fnIsObjMatched(testObj)) matchedObjs.push(testObj);
					}
				}
				index++;
			}
		} while (lastObjsLength < allObjsInTree.length);

		return matchedObjs;
	}
};
