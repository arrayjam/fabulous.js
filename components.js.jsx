/** @jsx React.DOM */

// Allow editing of code example and evaluate
var OptionsExample = React.createClass({
  getInitialState: function() {
    return { optionsHash: "" };
  },

  handleOptionSelect: function(optionsHash) {
    this.setState({optionsHash: optionsHash});
  },

  render: function() {
    var options = this.props.documentation.options.map(function(option) {
      return (
        <Option optionName={option.name} optionHash={option.code} onOptionSelect={this.handleOptionSelect} />
      );
    }.bind(this));
    return (
      <div>
        $("#{this.props.documentation.name}").fabulous({"{ "}<span contentEditable>{this.state.optionsHash}</span>{" }"});
        <ul>
          {options}
        </ul>
        <div id={this.props.documentation.name}>#{this.props.documentation.name}</div>
      </div>
    );
  }
});

var Option = React.createClass({
  handleClick: function() {
    this.props.onOptionSelect(this.props.optionHash);
  },

  render: function() {
    return (
      <li onClick={this.handleClick}>{this.props.optionName}</li>
    );
  }
});

var styleDocumentation = {
  name: "style-options",
  options: [
    { name: "cubehelix-rainbow", code: "style: \"cubehelix-rainbow\", cycle: 20" },
    { name: "hcl-rainbow",       code: "style: \"hcl-rainbow\", remove: $('#hurr')" },
    { name: "rainbow",           code: "style: \"rainbow\", glow: true" },
    { name: "pride",             code: "style: \"pride\"" }
  ]
};

React.renderComponent(
  <OptionsExample documentation={styleDocumentation} />,
  $("#style-example")[0]
);

