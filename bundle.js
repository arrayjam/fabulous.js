import {
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

export default function () {
  console.log("init stuff");
  var cycle = 20,
      style = "hsl",
      intensity = 0.5;

  function my() {
    var color;
    if(style === "cubehelix") {
      color = CubehelixStyle(cycle, intensity);
    } else if(style === "hcl") {
      color = HCLStyle(cycle, intensity);
    } else if(style === "hsl") {
      color = HSLStyle(cycle, intensity);
    } else {
      console.log("Style " + style + " not found. Defaulting to \"cubehelix\"");
      color = CubehelixStyle(cycle, intensity);
    }


    range(cycle).forEach(function(index) {
      console.log("%c       " + color(index) + "      ",
                  "background: " + color(index) + "; color: " + color(index) + ";");
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

    console.log("Actually called");
    console.log("cycle: ", cycle);
  }

  my.cycle = function(_) {
    if(!arguments.length) return cycle;
    cycle = _;
    return my;
  };

  return my;
}

// export default {
//   get event() { return event; },
//   select: select,
//   selectAll: selectAll
// };
