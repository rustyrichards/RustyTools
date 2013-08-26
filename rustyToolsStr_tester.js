RustyTools.Str.__test = function(t, r) {
  // .Fn level RustyTools methods
  t.test([
    'RustyTools.Str.__test\n' +
    'RustyTools.Str.entitize',
    function(t,r) {
      var entitized = RustyTools.Str.entitize('<a> & \r\n');
      r.different(entitized,'<a> & \r\n') &&
          r.same(entitized, '&lt;a&gt;&nbsp;&amp;&nbsp;<br/>');
    },
    function(t,r) {
      var entitized = RustyTools.Str.entitize('<a> & \r\n', true);
      r.same(entitized, '&lt;a&gt;&nbsp;&amp;&nbsp;\r\n');
    },

    'RustyTools.Str.quote',
    function(t,r) {
      var quoted = RustyTools.Str.quote('"can\'t"', "'");
      r.same(quoted, "'\"can\\\'t\"'");
    },
    'RustyTools.Str.toString',
    function(t,r) {
      var str = RustyTools.Str.toString('A', ['B', function(str){return 'C ';}, 5.1], ' ', 3.14159);
      r.same(str, 'ABC 5.1 3.14159');
    },
    'RustyTools.Str.multiReplace',
    function(t, r) {
      var source = 'Param1: @1@, Param12: @12@, Param2: @2@, Param3: @3@, ' +
          'Param4: @4@, Param5: @5@, Param6: @6@, Param7: @7@, Param8: @8@, '+
          'Param9: @9@, Param11: @11@, all except 10: ' +
          '@1@,@2@,@3@,@4@,@5@,@6@,@7@,@8@,@9@,@11@,@12@';
      var replaced = RustyTools.Str.multiReplace(source, 'a', 'b', 'c', 'd', 'e',
          'f', 'g', 'h', 'i', 'j', 'k', 'l');
      var shouldbe = 'Param1: a, Param12: l, Param2: b, Param3: c, ' +
          'Param4: d, Param5: e, Param6: f, Param7: g, Param8: h, ' +
          'Param9: i, Param11: k, all except 10: ' +
          'a,b,c,d,e,f,g,h,i,k,l';
      r.different(source, replaced) &&
          r.same(replaced, shouldbe);
    },
    'RustyTools.Str.replaceByObj',
    function(t,r) {
      var str = RustyTools.Str.replaceByObj('aabbaacccc', {aa: '-test-', cc: '-test2-'});
      r.same(str, '-test-bb-test--test2--test2-');
    }
  ]);
};
