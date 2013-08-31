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
      var str = RustyTools.Str.toString(5);
      str += typeof str;
      r.same(str, '5string');
    },
    function(t,r) {
      var str = RustyTools.Str.toString(function(){return 2 + 3});
      str += typeof str;
      r.same(str, '5string');
    },
    function(t,r) {
      var str = RustyTools.Str.toString('x', 'y', function(){return 'z'});
      str += typeof str;
      r.same(str, 'xyzstring');
    },
    function(t,r) {
      var str = RustyTools.Str.toString('A', ['B', function(str){return 'C ';}, 5.1], ' ', 3.14159);
      r.same(str, 'ABC 5.1 3.14159');
    },

    'RustyTools.Str.multiReplace',
    function(t, r) {
      var source = 'Param1: <#1/>, Param12: <#12/>, Param2: <#2/>, Param3: <#3/>, ' +
          'Param4: <#4/>, Param5: <#5/>, Param6: <#6/>, Param7: <#7/>, Param8: <#8/>, '+
          'Param9: <#9/>, Param11: <#11/>, all except 10: ' +
          '<#1/>,<#2/>,<#3/>,<#4/>,<#5/>,<#6/>,<#7/>,<#8/>,<#9/>,<#11/>,<#12/>,<#13/>';
      var subst = {1: 'a', 2: 'b', 3: 3.3, 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'h', 
          9: 'i', 10: 'j', 11: 'k', 12: function() {return 'l'}}
      var replaced1 = RustyTools.Str.multiReplace(source, subst);
      var shouldbe1 = 'Param1: a, Param12: l, Param2: b, Param3: 3.3, ' +
          'Param4: d, Param5: e, Param6: f, Param7: g, Param8: h, ' +
          'Param9: i, Param11: k, all except 10: ' +
          'a,b,3.3,d,e,f,g,h,i,k,l,<#13/>';
      var replaced2 = RustyTools.Str.multiReplace(source, subst, true);
      var shouldbe2 = 'Param1: a<#1/>, Param12: l<#12/>, Param2: b<#2/>, Param3: 3.3<#3/>, ' +
          'Param4: d<#4/>, Param5: e<#5/>, Param6: f<#6/>, Param7: g<#7/>, Param8: h<#8/>, '+
          'Param9: i<#9/>, Param11: k<#11/>, all except 10: ' +
          'a<#1/>,b<#2/>,3.3<#3/>,d<#4/>,e<#5/>,f<#6/>,g<#7/>,h<#8/>,i<#9/>,k<#11/>,l<#12/>,<#13/>';

      var filtered = RustyTools.Str.mulitReplaceCleanup(replaced2);
      r.different(source, replaced1).same(replaced1, shouldbe1).different(source, replaced2).
          same(replaced2, shouldbe2).same(filtered, shouldbe1.replace(/<#13\/>/g, ''));
    },
 
    'RustyTools.Str.replaceByObj',
    function(t,r) {
      var str = RustyTools.Str.replaceByObj('aabbaacccc', {aa: '-test-', cc: '-test2-'});
      r.same(str, '-test-bb-test--test2--test2-');
    }
  ]);
};
