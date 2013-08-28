RustyTools.Fn.__test = function(t, r) {
  // .Fn level RustyTools methods
  t.test([
    'RustyTools.Fn.__test\n' +
    'RustyTools.Fn.map && RusyTools.Fn.predicateToValue',
    function(t, r) {
      var doubled = RustyTools.Fn._testableMap([2, 3, 4], function(x) {return x + x});
      return r.same(doubled, [4, 6, 8]);
    },
    function(t, r) {
      var evenOrOdd = RustyTools.Fn.predicateToValue(function(x) {return x & 1}, 'odd', 'even');
      var kinds = RustyTools.Fn._testableMap([2, 3, 4], evenOrOdd);
      return r.same(kinds, ['even', 'odd', 'even']);
    },
    function(t, r) {
      var sum = RustyTools.Fn._testableReduce(false, [2, 3, 4], function(x, y) {return x + y});
      return r.same(sum, 9);
    },
    function(t, r) {
      var max = RustyTools.Fn._testableReduce(false, [2, 3, 11], 
          RustyTools.Fn.partialApplication(2, Math.max));
      return r.same(max, 11);
    },
    function(t, r) {
      var testArray = [2, 3, 4];
      var left = RustyTools.Fn._testableReduce(false, testArray, function(x, y) {return x});
      return r.same(left, 2);
    },
    function(t, r) {
      var testArray = [2, 3, 4];
      var right = RustyTools.Fn._testableReduce(true, testArray, function(x, y) {return x});
      return r.same(right, 4);
    },
    'RustyTools.Fn.partialApplication',
    function(t, r) {
      // Use partialApplication to make a function to parse base 2 numbers, and map that to an
      // an array os strings
      var parseBinary = RustyTools.Fn.partialApplication(1, parseInt, null, 2 /* base 2 */);
      var integers = RustyTools.Fn._testableMap(['01', '011', '0111'], parseBinary);
      return r.same(integers, [1, 3, 7]);
    },
    'RustyTools.Fn.ordering',
    function(t, r) {
      // Use RustyTools.Fn.ordering to sort odd numbers after even numbers
      var testArray = [3, 4, 1, 2, 5, 6];
      var sorted = testArray.sort(RustyTools.Fn.ordering(function(a, b) {
        var evenVsOdd = (a & 1) - (b & 1);
        return (evenVsOdd) ? (-1 == evenVsOdd) : (a < b);
      }))
      return r.same(sorted, [2, 4, 6, 1, 3, 5]);
    },
    'RustyTools.Fn.chain',
    function(t, r) {
      // Use RustyTools.Fn.ordering to sort odd numbers after even numbers
      var str = RustyTools.Fn.compose(function(x){ return x + 3}, function(x) {return x + ' is ten.'})(7);
      return r.same(str, '10 is ten.');
    }
  ]);
};

