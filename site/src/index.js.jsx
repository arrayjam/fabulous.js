var React = require("react/addons");
var classNames = require("classnames");
var Immutable = require("immutable");

var Configuration = Immutable.fromJS([
  {
    property: "Style",
    values: [{
      name: "Cubehelix",
      defaultValue: true,
      effect: function(f) { return f.style("cubehelix"); },
      display: ".style('cubehelix')"
    }, {
      name: "HCL",
      defaultValue: false,
      effect: function(f) { return f.style("hcl"); },
      display: ".style('hcl')"
    }, {
      name: "HSL",
      defaultValue: false,
      effect: function(f) { return f.style("hsl"); },
      display: ".style('hsl')"
    }, {
      name: "Pride",
      defaultValue: false,
      effect: function(f) { return f.style("pride"); },
      display: ".style('pride')"
    }]
  }, {
    property: "Cycle",
    values: [{
      name: "6",
      defaultValue: false,
      effect: function(f) { return f.cycle(6); },
      display: ".cycle(6)"
    }, {
      name: "30",
      defaultValue: true,
      effect: function(f) { return f.cycle(30); },
      display: ".cycle(30)"
    }, {
      name: "90",
      defaultValue: false,
      effect: function(f) { return f.cycle(90); },
      display: ".cycle(90)"
    }, {
      name: "1000",
      defaultValue: false,
      effect: function(f) { return f.cycle(1000); },
      display: ".cycle(1000)"
    }]
  }, {
    property: "Rotation",
    values: [{
      name: "0",
      defaultValue: true,
      effect: function(f) { return f.rotation(6); },
      display: ".rotation(6)"
    }, {
      name: "5",
      defaultValue: false,
      effect: function(f) { return f.rotation(5); },
      display: ".rotation(5)"
    }, {
      name: "10",
      defaultValue: false,
      effect: function(f) { return f.rotation(10); },
      display: ".rotation(10)"
    }, {
      name: "Random rotation",
      defaultValue: false,
      effect: function(f) { return f.randomRotation(true); },
      display: ".randomRotation(true)"
    }, {
      name: "cycle / 2",
      defaultValue: false,
      effect: function(f) { return f.rotation(f.cycle() / 2); },
      display: ".rotation(f.cycle() / 2)"
    }]
  }, {
    property: "Saturation",
    values: [{
      name: "Not set",
      defaultValue: true,
      effect: function(f) { return f; },
      display: ""
    }, {
      name: "0.1",
      defaultValue: false,
      effect: function(f) { return f.saturation(0.1); },
      display: ".saturation(0.1)"
    }, {
      name: "0.3",
      defaultValue: false,
      effect: function(f) { return f.saturation(0.3); },
      display: ".saturation(0.3)"
    }, {
      name: "0.5",
      defaultValue: false,
      effect: function(f) { return f.saturation(0.5); },
      display: ".saturation(0.5)"
    }, {
      name: "0.7",
      defaultValue: false,
      effect: function(f) { return f.saturation(0.7); },
      display: ".saturation(0.7)"
    }, {
      name: "0.9",
      defaultValue: false,
      effect: function(f) { return f.saturation(0.9); },
      display: ".saturation(0.9)"
    }]
  }, {
    property: "Lightness",
    values: [{
      name: "Not set",
      defaultValue: true,
      effect: function(f) { return f; },
      display: ""
    }, {
      name: "0.1",
      defaultValue: false,
      effect: function(f) { return f.lightness(0.1); },
      display: ".lightness(0.1)"
    }, {
      name: "0.3",
      defaultValue: false,
      effect: function(f) { return f.lightness(0.3); },
      display: ".lightness(0.3)"
    }, {
      name: "0.5",
      defaultValue: false,
      effect: function(f) { return f.lightness(0.5); },
      display: ".lightness(0.5)"
    }, {
      name: "0.7",
      defaultValue: false,
      effect: function(f) { return f.lightness(0.7); },
      display: ".lightness(0.7)"
    }, {
      name: "0.9",
      defaultValue: false,
      effect: function(f) { return f.lightness(0.9); },
      display: ".lightness(0.9)"
    }]
  }, {
    property: "Glow",
    values: [{
      name: "On",
      defaultValue: true,
      effect: function(f) { return f.glow(true); },
      display: ".glow(true)",
    }, {
      name: "Off",
      defaultValue: false,
      effect: function(f) { return f.glow(false); },
      display: ".glow(false)",
    }]
  }
]);

var FabulousConfigurer = React.createClass({
  getInitialState: function() {
    return {
      selectedPropertyIndex: 0
    };
  },

  onPropertyChange: function(newPropertyIndex) {
    this.setState({ selectedPropertyIndex: newPropertyIndex });
  },

  render: function() {
    var properties = this.props.configuration.map(function(d) { return d.get("property"); });
    var selectedPropertyIndex = this.state.selectedPropertyIndex;
    var onPropertyChange = this.onPropertyChange;
    var values = this.props.configuration.get(selectedPropertyIndex).get("values");

    return (
      <div className="configurer">
        <PropertySelector properties={properties} selectedPropertyIndex={selectedPropertyIndex} onPropertyChange={onPropertyChange} />
        <ValueSelector values={values} />
      </div>
    );

  }
});

var ValueSelector = React.createClass({
  render: function() {
    var values = this.props.values;
    // var selectedValueIndex = values.findIndex(function(d) { return d.get("defaultValue"); });
    var selectedValueIndex = 0;
    var valuesJSX = values.map(function(value, valueIndex) {
      return (
        <div className={classNames("value", {
          "selected": valueIndex === selectedValueIndex,
          "default": value.get("defaultValue")
        })}>
          { value.get("defaultValue") ? <span className="default-indicator">(default) </span> : null }
          {value.get("name")}
        </div>
      );
    });

    return (
      <div className="container">
        <div className="values">
          {valuesJSX}
        </div>
      </div>
    );
  }
});

var PropertySelector = React.createClass({
  selectProperty: function(newPropertyIndex) {
    return this.props.onPropertyChange(newPropertyIndex);
  },

  render: function() {
    var self = this;
    var properties = this.props.properties;
    var selectedPropertyIndex = this.props.selectedPropertyIndex;
    var selectProperty = this.selectProperty;

    var propertiesJSX = properties.map(function(property, propertyIndex) {
      return (
        <div className={classNames("property", {"selected": propertyIndex === selectedPropertyIndex})}
          style={{width: (100 / properties.size) + "%"}}
          onClick={selectProperty.bind(self, propertyIndex)}>{property}</div>
      );
    });

    return (
      <div className="properties">
        <div className="container">
          <div className="properties-container">
            {propertiesJSX}
            <div className="property-mover" style={{
              width: (100 / properties.size) + "%",
              left: ((100 / properties.size) * selectedPropertyIndex) + "%"
            }} />
          </div>
        </div>
      </div>
    );
  }
});

React.render(<FabulousConfigurer configuration={Configuration} />, document.getElementById("configurer"));
