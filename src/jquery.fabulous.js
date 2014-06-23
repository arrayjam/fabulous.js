$.fn.fabulous = function(period) {
  // Coerce to an int, or use a default
  period = ~~period || 52;
  var a = +new Date();
  var styleTagId = "fabulous-styles",
      classPrefix = "fabulous-selection-",
      style = $("<style>").attr("id", styleTagId).appendTo("body"),
      styles = [],
      scale = (function () {
        var uninterp = uninterpolate(0, period),
        interp = interpolate(0, 360);
        return function(x) {
          return interp(uninterp(x));
        };
      })();

  var hcl = function(index) { return d3.hcl(scale(index), 100, 55); }

  var cubehelix = d3.scale.cubehelix()
        .domain([0, 180, 360])
        .range([
          d3.hsl(-100, 0.75, 0.35),
          d3.hsl(  80, 1.50, 0.80),
          d3.hsl( 260, 0.75, 0.35)
        ]);

  var color = function(index, s, l) {
    s = s || 1;
    l = l || 0.5;

    console.log(scale(index));
    return cubehelix(scale(index));
    //return hcl(index);
    //return d3_hsl_rgb(scale(index), s, l);
  };

  Array.apply(null, Array(period)).map(function (_, i) {return i;}).forEach(function(i) {
    styles.push("." + classPrefix + i + "::selection { background-color: transparent; color: " + color(i) + "; text-shadow: 0px 0px 40px " + color(i) + "; }");
    //styles.push("." + classPrefix + i + "::selection { background-color: transparent; color: " + color(i) + ";}");
    styles.push("." + classPrefix + i + "::-moz-selection { background-color: transparent; color: " + color(i) + "; text-shadow: 0 0 5px " + color(i) + ";}");
  });

  styles.push("*::selection { background-color: transparent; }");
  styles.push("*::-moz-selection { background-color: transparent; }");
  //styles.push("*::-moz-selection { background-color: transparent; color: " + d3_hsl_rgb(scale(i), 1, 0.5) + "; }");
  //styles.push("* { -webkit-tap-highlight-color: " + d3_hsl_rgb(scale(i), 1, 0.5) + "; }");
  style.html(styles.join("\n"));

  function interpolate(a, b) {
    b -= a = +a;
    return function(t) { return a + b * t; };
  }

  function uninterpolate(a, b) {
    b = b - (a = +a) ? 1 / (b - a) : 0;
    return function(x) { return (x - a) * b; };
  }

  function d3_hsl_rgb(h, s, l) {
    var m1,
        m2;

    /* Some simple corrections for h, s and l. */
    h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;
    s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;
    l = l < 0 ? 0 : l > 1 ? 1 : l;

    /* From FvD 13.37, CSS Color Module Level 3 */
    m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
    m1 = 2 * l - m2;

    function v(h) {
      if (h > 360) h -= 360;
      else if (h < 0) h += 360;
      if (h < 60) return m1 + (m2 - m1) * h / 60;
      if (h < 180) return m2;
      if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
      return m1;
    }

    function vv(h) {
      return Math.round(v(h) * 255);
    }

    return "#" + d3_rgb_hex(vv(h + 120)) + d3_rgb_hex(vv(h)) + d3_rgb_hex(vv(h - 120));
  }

  function d3_rgb_hex(v) {
    return v < 0x10
        ? "0" + Math.max(0, v).toString(16)
        : Math.min(255, v).toString(16);
  }

  var all = [];
  this.each(function() {
    $(this)
      .find("*")
      .add(this)
      .filter(function(d) {
        return d.childElementCount === 0 || Array.prototype.slice.call(this.childNodes).some(function(dd) { return dd.nodeType === Node.TEXT_NODE; }) || getComputedStyle(this).display !== "inline";
      })
      .each(function() { all.push(this); });
  });
  console.log(all.length);


  $(all).addClass(function(i) {
    return classPrefix + i % period;
  });
};
