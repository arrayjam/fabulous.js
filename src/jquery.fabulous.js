import "color/hsl";
import "scale/cubehelix";
import "scale/linear";
import "scale/identity";
import "arrays/range";

var numberOfTimesCalled = 0;
var prideColors = ["#E40303", "#FF8C00", "#FFED00", "#008026", "#004DFF", "#750787"];

$.fn.fabulous = function(options) {
  // styles
  //    - cubehelix-rainbow
  //    - rainbow
  //    - pride

  var opts = $.extend({}, $.fn.fabulous.defaults, options);
  numberOfTimesCalled++;

  opts.cycle = ~~opts.cycle;
  opts.rotation = ~~opts.rotation;

  var classPrefix = "fabulous-selection-" + numberOfTimesCalled + "-",
      styleTag = $("<style>").appendTo("body"),
      styles = [],
      scale, mode;

  if (opts.style === "cubehelix-rainbow") {
    scale = d3.scale.linear().domain([0, opts.cycle]).range([0, 360]);
    mode = d3.scale.cubehelix()
        .domain([0, 180, 360])
        .range([
          d3.hsl(-100, 0.75, 0.35),
          d3.hsl(  80, 1.50, 0.80),
          d3.hsl( 260, 0.75, 0.35)
        ]);
  } else if (opts.style === "rainbow") {
    scale = d3.scale.linear().domain([0, opts.cycle]).range([0, 360]);
    mode = function(hue) { return d3.hsl(hue, 1, 0.5); };
  } else if (opts.style === "pride") {
    if (options.cycle && options.cycle !== 6) {
      console.log("Using the Pride style. Overriding cycle setting to 6.");
      consoleStripe(prideColors);
      opts.cycle = 6;
    }
    scale = d3.scale.identity();
    mode = d3.scale.linear().domain(d3.range(opts.cycle)).range(prideColors);
  }

  var colorByIndex = function(index) {
    return mode(scale(index));
  };

  function consoleStripe (colors) {
    rotateArray(colors, opts.rotation).forEach(function(color) {
      console.log("%c" + new Array(22).join(" "),
                   "background: " + color + "; color: " + color + ";");
    });
  }

  function rotateArray (array, rotation) {
    array.unshift.apply(array, array.splice(rotation, array.length));
    return array;
  }

  function textColorRules (color) {
    return [
      "background-color: transparent",
      "color: " + color
    ];
  }

  function selectionStyleWebKit (className, color, glow) {
    var rules = textColorRules(color);

    // WebKit browsers display a nice glow, so we give it 40px
    if (glow) rules.push("text-shadow: 0 0 40px " + color);
    return "." + className + "::selection { " + rules.join("; ") + " }";
  }

  function selectionStyleMoz (className, color, glow) {
    var rules = textColorRules(color);

    // Firefox's text-shadow doesn't extend past the line-height, so give it only a bit
    if (glow) rules.push("text-shadow: 0 0 5px " + color);
    return "." + className + "::-moz-selection { " + rules.join("; ") + " }";
  }

  // This works nicely in Chrome, Safari and Firebug.
  // Doesn't work for Firefox yet but I'd rather not add browser detection code here.
  if (opts.preview) {
    console.log("Fabulous.js preview:");
    console.log("Style:", opts.style, "Cycle:", opts.cycle, "Rotation:", opts.rotation);
    consoleStripe(d3.range(opts.cycle).map(colorByIndex));
  }

  d3.range(opts.cycle).forEach(function(index) {
    var className = classPrefix + index,
        indexColor = colorByIndex(index);

    styles.push(selectionStyleWebKit(className, indexColor, opts.glow));
    styles.push(selectionStyleMoz(className, indexColor, opts.glow));
  });

  if (opts.disableOtherSelectionStyles) {
    styles.push("*::selection { background-color: transparent; }");
    styles.push("*::-moz-selection { background-color: transparent; }");
  }

  styleTag.html(styles.join("\n"));

  var all = [];

  // For each wrapped element given to this plugin
  this.each(function() {
    // Wrap each child
    $(this)
      .find("*") // Get all descending elements
      .add(this) // And the child element
      .filter(function(d) { // Only take
        return d.childElementCount === 0 || // The leaf elements
          Array.prototype.slice.call(this.childNodes).some(function(dd) { return dd.nodeType === Node.TEXT_NODE; }); // The text nodes
          // Check if this is necessary
          // getComputedStyle(this).display !== "inline"; // And the block-level elements
      })
      .each(function() { all.push(this); });
  });

  $(all).addClass(function(index) {
    // Apply a rotation to the index if specified
    return classPrefix + ((index + opts.rotation) % opts.cycle);
  });
};

$.fn.fabulous.defaults = {
  style: "cubehelix-rainbow",
  cycle: 8,
  rotation: 0,
  glow: true,
  disableOtherSelectionStyles: true,
  preview: false,
};
