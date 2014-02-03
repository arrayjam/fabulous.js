(function($) {
  var styleTagId = "fabulous-styles",
      classPrefix = "fabulous-selection-",
      style = $("<style>").attr("id", styleTagId).appendTo("body"),
      period = 13,
      styles = [],
      scale = d3.scale.linear().domain([0, period]).range([0, 360]);

  Array.apply(null, Array(period)).map(function (_, i) {return i;}).forEach(function(i) {
    styles.push("." + classPrefix + i + "::selection { background-color: white; color: " + d3.hsl(scale(i), 1, 0.5) + "; }");
  });
  style.html(styles.join("\n"));

  $.fn.fabulous = function() {
    return this.each(function() {
      var els = $(this).find("*").add(this);

      els.addClass(function(i) {
        return classPrefix + i % period;
      });
    });
  };
}(jQuery));
//var parents = Array.prototype.slice.call(document.querySelectorAll(".hello"));
//console.log(parents);

//console.log(d3.selectAll(".hello *"));

//var i = 0;

//var period = 82;

//d3.selectAll(".hello *")
  //.attr("class", function(d) {
    //return "f" + i++ % period;
  //});

//var h = d3.scale.linear()
    //.domain([0, period])
    //.range([0, 360]);

//var style = d3.select("body").append("style");

//var a = d3.range(i).map(function(d) {
  //var c = d3.hsl(h(d), 1, 0.5);
  //return ".f" + d % period + "::selection{" +
    //"color: " + c + ";" +
    //"background-color: white;" +
    //"}";
//});

//style.text(a.join("\n"));

