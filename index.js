import {
  select,
  selectAll,
} from "d3-selection";

import {
  linear,
  rainbow
} from "d3-scale";

import {
  hcl,
  hsl,
  cubehelix
} from "d3-color";

import {
  range
} from "d3-arrays";

var instanceIndex = 0;
export default function () {
  var cycle = 30,
      style = "cubehelix",
      saturation = 0.5,
      setSaturation = false,
      lightness = 0.5,
      setLightness = false,
      rotation = 0,
      randomRotation = false,
      glow = true,
      styleTagClass = "fabulous-styles",
      disableOtherSelectionStyles = true,
      exclude = null,
      selection = true,
      text = false,
      preview = true;

  function my(selector) {
    if(instanceIndex !== undefined) instanceIndex++;

    if(!selection && !text) {
      console.log("Neither .selection nor .text are set! Nothing for me to do.");
      return;
    }

    if(randomRotation) {
      rotation = Math.floor(Math.random() * cycle);
    } else {
      rotation = rotation % cycle;
    }

    var color;
    if(style === "cubehelix") {
      color = CubehelixStyle(cycle, saturation, lightness);
    } else if(style === "hcl") {
      color = HCLStyle(cycle, saturation, lightness);
    } else if(style === "hsl") {
      color = HSLStyle(cycle, saturation, lightness);
    } else if(style === "pride") {
      color = PrideStyle(saturation, lightness);
      cycle = 6;
    } else {
      console.log("Style " + style + " not found. Defaulting to \"hcl\"");
      color = HCLStyle(cycle, saturation, lightness);
    }

    var colors = rotateArray(range(cycle).map(color), rotation);

    if(preview) {
      console.log("Style: ", style);
      console.log("Cycle: ", cycle);
      console.log("Rotation: ", rotation);
      colors.forEach(logColor);
    }

    var classPrefix = "fabulous-" + instanceIndex + "-";
    select("body").append("style")
        .class(styleTagClass, true)
        .html(generateStyleTag(colors, glow, disableOtherSelectionStyles, classPrefix, selection, text));


    var selectedElements = getAllElementsFromSelector(selector);
    if(exclude) {
      var excludedElements = getAllElementsFromSelector(exclude);
      selectedElements = selectedElements.filter(function(element) {
        return excludedElements.indexOf(element) === -1;
      });
    }


    selectAll(selectedElements)
        .filter(function() {
          // NOTE(yuri): Only take the
          // 1) Leaf nodes, or
          // 2) Nodes which have direct text node children
          // 3) Block-level nodes (???)
          // TODO(yuri): Figure out whether to include 3)
          var result = this.childElementCount === 0 ||
           Array.prototype.slice.call(this.childNodes).some(function(dd) { return dd.nodeType === Node.TEXT_NODE; });
          // getComputedStyle(this).display !== "inline";

          return result;
        })
        .each(function(_, index) {
          var className = classPrefix + (index % cycle).toString();
          select(this).class(className, true);
        }).size();

    return my;

    function CubehelixStyle(cycle, saturation, lightness) {
      var cycleScale = linear().domain([0, cycle]).range([0, 1]);
      var saturationValue = linear().domain([0, 1]).range([0, 2])(saturation);
      var lightnessValue = linear().domain([0, 1]).range([0, 1])(lightness);
      var rainbowScale = rainbow();
      return function(index) {
        var color = cubehelix(rainbowScale(cycleScale(index)));

        if(setSaturation) color.s = saturationValue;
        if(setLightness) color.l = lightnessValue;

        return color;
      };
    }

    function HCLStyle(cycle, saturation, lightness) {
      var cycleScale = linear().domain([0, cycle]).range([0, 360]);
      var saturationValue = linear().domain([0, 1]).range([0, 100])(saturation);
      var lightnessValue = linear().domain([0, 1]).range([0, 150])(lightness);
      return function(index) {
        var color = hcl(cycleScale(index), 50, 75);

        if(setSaturation) color.c = saturationValue;
        if(setLightness) color.l = lightnessValue;

        return color;
      };
    }

    function HSLStyle(cycle, saturation, lightness) {
      var cycleScale = linear().domain([0, cycle]).range([0, 360]);
      var saturationValue = linear().domain([0, 1]).range([0, 2])(saturation);
      var lightnessValue = linear().domain([0, 1]).range([0, 1])(lightness);
      return function(index) {
        var color = hsl(cycleScale(index), 1, 0.5);

        if(setSaturation) color.s = saturationValue;
        if(setLightness) color.l = lightnessValue;

        return color;
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

    function generateStyleTag(colors, glow, disableOtherSelectionStyles, classPrefix, selection, text) {
      var styleDeclarations = [];
      colors.forEach(function(color, index) {
        var className = classPrefix + index.toString();

        if(selection) {
          styleDeclarations.push(generateSelectionStyleDeclarations(color, className, glow));
          styleDeclarations.push(generateSelectionStyleDeclarationsGecko(color, className, glow));
        }

        if(text) {
          styleDeclarations.push(generateTextStyleDeclarations(color, className, glow));
        }
      });

      if (disableOtherSelectionStyles) {
        styleDeclarations.push("::selection { background-color: transparent; }");
        styleDeclarations.push("::-moz-selection { background-color: transparent; }");
      }

      return styleDeclarations.join("\n");

      function generateSelectionStyleDeclarations(color, className, glow) {
        var declarations = generateDeclarations(color);

        // NOTE(yuri): WebKit browsers display a nice glow, so we give it 40px
        if (glow) declarations.push("text-shadow: 0 0 40px " + color);
        return "." + className + "::selection { " + declarations.join("; ") + " }";
      }

      function generateSelectionStyleDeclarationsGecko(color, className, glow) {
        var declarations = generateDeclarations(color);

        // NOTE(yuri): Firefox's text-shadow doesn't extend past the line-height, so give it only a bit
        if (glow) declarations.push("text-shadow: 0 0 5px " + color);
        return "." + className + "::-moz-selection { " + declarations.join("; ") + " }";
      }

      function generateTextStyleDeclarations(color, className, glow) {
        var declarations = generateDeclarations(color);

        // NOTE(yuri): WebKit browsers display a nice glow, so we give it 40px
        if (glow) declarations.push("text-shadow: 0 0 40px " + color);
        return "." + className + " { " + declarations.join("; ") + " }";
      }

      function generateDeclarations(color) {
        return [
          "background-color: transparent",
          "color: " + color
        ];
      }
    }

    function getAllElementsFromSelector(selector) {
      var result = [];
      var selection = selectAll(selector);
      selection.each(function() {
        result.push(this);

        select(this).selectAll("*").each(function() { result.push(this); });
      });

      return result;
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

  my.saturation = function(_) {
    if(!arguments.length) {
      if(setSaturation) {
        return saturation;
      } else {
        return false;
      }
    }

    saturation = _;
    setSaturation = true;
    return my;
  };

  my.lightness = function(_) {
    if(!arguments.length) {
      if(setLightness) {
        return lightness;
      } else {
        return false;
      }
    }

    lightness = _;
    setLightness = true;
    return my;
  };

  my.rotation = function(_) {
    if(!arguments.length) return rotation;
    rotation = _;
    return my;
  };

  my.randomRotation = function(_) {
    if(!arguments.length) return randomRotation;
    randomRotation = _;
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

  my.exclude = function(_) {
    if(!arguments.length) return exclude;
    exclude = _;
    return my;
  };

  my.selection = function(_) {
    if(!arguments.length) return selection;
    selection = _;
    return my;
  };

  my.text = function(_) {
    if(!arguments.length) return text;
    text = _;
    return my;
  };

  my.preview = function(_) {
    if(!arguments.length) return preview;
    preview = _;
    return my;
  };

  return my;
}

