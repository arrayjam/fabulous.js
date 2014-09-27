/** @jsx React.DOM */


// Allow editing of code example and evaluate

var OptionsExample = React.createClass({
  render: function() {
    var options = this.props.options.map(function(option) {
      return (
        <li>{option.name}</li>
      );
    }.bind(this));
    return (
      <div className="clearfix">
        <ul style={{"float": "left"}}>
          {options}
        </ul>
        <div style={{"float": "right", "overflow": "scroll"}}>
          THINGS<br />
          THINGS<br />
          THINGS<br />
          THINGS<br />
          THINGS<br />
          THINGS<br />
          THINGS<br />
          THINGS<br />
          THINGS<br />
          THINGS<br />
          THINGS<br />
          THINGS<br />
          THINGS<br />
        </div>
      </div>
    );
  }
});

var styleOptions = [
  { name: "cubehelix-rainbow", code: "{style: \"cubehelix-rainbow\"}" },
  { name: "rainbow", code: "{style: \"rainbow\"}" },
  { name: "pride", code: "{style: \"pride\"}" }
];

React.renderComponent(
  <OptionsExample options={styleOptions} />,
  $("#style-example")[0]
);
