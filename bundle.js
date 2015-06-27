import {
  select,
  selectAll,
} from "d3-selection";

import {
  linear
} from "d3-scale";

import {
  cubehelix,
  hcl,
  hsl
} from "d3-color";

import {
  range
} from "d3-arrays";

var instanceIndex = 0;
export default function () {
  console.log("init stuff");
  var cycle = 10,
      style = "hcl",
      intensity = 0.8,
      rotation = 86,
      glow = true,
      styleTagClass = "fabulous-styles",
      disableOtherSelectionStyles = true,
      preview = true;

  function my(selector) {
    if(instanceIndex !== undefined) instanceIndex++;
    console.log("instanceIndex", instanceIndex);

    rotation = rotation % cycle;

    var color;
    if(style === "cubehelix") {
      color = CubehelixStyle(cycle, intensity);
    } else if(style === "hcl") {
      color = HCLStyle(cycle, intensity);
    } else if(style === "hsl") {
      color = HSLStyle(cycle, intensity);
    } else if(style === "pride") {
      color = PrideStyle();
      cycle = 6;
    } else {
      console.log("Style " + style + " not found. Defaulting to \"hcl\"");
      color = HCLStyle(cycle, intensity);
    }

    var colors = rotateArray(range(cycle).map(color), rotation);

    if(preview) colors.forEach(logColor);

    var classPrefix = "fabulous-" + instanceIndex + "-";
    select("body").append("style")
        .class(styleTagClass, true)
        .html(generateStyleTag(colors, glow, disableOtherSelectionStyles, classPrefix));

    var allElements = [];
    var selection = selectAll(selector);
    console.log(selection.nodes(), selection.size());
    selection.each(function() {
      // TODO(yuri): Decide if the root element needs a chance to be classed
      // TODO(yuri): Maybe just mention that all elements have to be wrapped, no pesky text nodes?
      // allElements.push(this);

      select(this).selectAll("*").each(function() { allElements.push(this); });
    });

    // TODO(yuri): Exclusion of elements by option selector
    console.log(allElements);
    selectAll(allElements)
        .filter(function() {
          // NOTE(yuri): Only take the
          // 1) Leaf nodes, or
          // 2) Nodes which have direct text node children
          // 3) Block-level nodes (???)
          return this.childElementCount === 0 ||
            Array.prototype.slice.call(this.childNodes).some(function(dd) { return dd.nodeType === Node.TEXT_NODE; }) ||
            getComputedStyle(this).display !== "inline";
        })
        .each(function(_, index) {
          var className = classPrefix + (index % cycle).toString();
          select(this).class(className, true);
        });

    function CubehelixStyle(cycle, intensity) {
      var cycleScale = linear().domain([0, cycle]).range([0, 360]);
      var intensityValue = linear().domain([0, 1]).range([0, 2])(intensity);
      return function(index) {
        return cubehelix(cycleScale(index), intensityValue, 0.5);
      };
    }

    function HCLStyle(cycle, intensity) {
      var cycleScale = linear().domain([0, cycle]).range([0, 360]);
      var intensityValue = linear().domain([0, 1]).range([0, 100])(intensity);
      return function(index) {
        return hcl(cycleScale(index), intensityValue, 75);
      };
    }

    function HSLStyle(cycle, intensity) {
      var cycleScale = linear().domain([0, cycle]).range([0, 360]);
      var intensityValue = linear().domain([0, 1]).range([0, 1])(intensity);
      return function(index) {
        return hsl(cycleScale(index), intensityValue, 0.5);
      };
    }

    function PrideStyle() {
      var prideColors = ["#E40303", "#FF8C00", "#FFED00", "#008026", "#004DFF", "#750787"];
      return function(index) {
        return prideColors[index];
      };
    }

    function rotateArray(array, rotation) {
      array.unshift.apply(array, array.splice(rotation, array.length));
      return array;
    }

    function logColor(color) {
      console.log("%c       " + color + "      ",
                  "background: " + color + "; color: " + color + ";");
    }

    function generateStyleTag(colors, glow, disableOtherSelectionStyles, classPrefix) {
      var styleDeclarations = [];
      colors.forEach(function(color, index) {
        var className = classPrefix + index.toString();

        styleDeclarations.push(generateStyleDeclarations(color, className, glow));
        styleDeclarations.push(generateStyleDeclarationsGecko(color, className, glow));
      });

      if (disableOtherSelectionStyles) {
        styleDeclarations.push("::selection { background-color: transparent; }");
        styleDeclarations.push("::-moz-selection { background-color: transparent; }");
      }

      // console.log(styleDeclarations);
      return styleDeclarations.join("\n");

      function generateStyleDeclarations(color, className, glow) {
        var declarations = generateDeclarations(color);

        // NOTE(yuri): WebKit browsers display a nice glow, so we give it 40px
        if (glow) declarations.push("text-shadow: 0 0 40px " + color);
        return "." + className + "::selection { " + declarations.join("; ") + " }";
      }

      function generateStyleDeclarationsGecko(color, className, glow) {
        var declarations = generateDeclarations(color);

        // NOTE(yuri): Firefox's text-shadow doesn't extend past the line-height, so give it only a bit
        if (glow) declarations.push("text-shadow: 0 0 5px " + color);
        return "." + className + "::-moz-selection { " + declarations.join("; ") + " }";
      }

      function generateDeclarations(color) {
        return [
          "background-color: transparent",
          "color: " + color
        ];
      }
    }
  }

  my.style = function(_) {
    if(!arguments.length) return style;
    style = _;
    return my;
  };

  my.cycle = function(_) {
    if(!arguments.length) return cycle;
    cycle = _;
    return my;
  };

  my.intensity = function(_) {
    if(!arguments.length) return intensity;
    intensity = _;
    return my;
  };

  my.rotation = function(_) {
    if(!arguments.length) return rotation;
    rotation = _;
    return my;
  };

  my.glow = function(_) {
    if(!arguments.length) return glow;
    glow = _;
    return my;
  };

  my.styleTagClass = function(_) {
    if(!arguments.length) return styleTagClass;
    styleTagClass = _;
    return my;
  };

  my.disableOtherSelectionStyles = function(_) {
    if(!arguments.length) return disableOtherSelectionStyles;
    disableOtherSelectionStyles = _;
    return my;
  };

  my.preview = function(_) {
    if(!arguments.length) return preview;
    preview = _;
    return my;
  };

  return my;
}

