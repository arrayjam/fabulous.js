/** @jsx React.DOM */

// Allow editing of code example and evaluate
var OptionsExample = React.createClass({
  getInitialState: function() {
    return { optionsHash: this.props.documentation.options[0].code };
  },

  handleCodeChange: function(optionsHash) {
    this.setState({optionsHash: optionsHash});
    this.evaluate();
  },

  evaluate: function() {
    console.log("EVAL", arguments);
  },

  render: function() {
    var options = this.props.documentation.options.map(function(option) {
      return (
        <OptionsExampleOption optionName={option.name} optionHash={option.code} onOptionSelect={this.handleCodeChange} />
      );
    }.bind(this));
    return (
      <div>
        <OptionsExampleEvaluator selector={"#" + this.props.documentation.name} optionsHash={this.state.optionsHash} onCodeChange={this.handleCodeChange} />
        <ul>
          {options}
        </ul>
        <div id={this.props.documentation.name}>#{this.props.documentation.name}</div>
      </div>
    );
  }
});

var OptionsExampleEvaluator = React.createClass({
  render: function() {
    return (
      <div>$("{this.props.selector}").fabulous({"{ "}<span contentEditable onInput={this.handleInput}>{this.props.optionsHash}</span>{" }"});</div>
    );
  },

  handleInput: function(event) {
    this.props.onCodeChange(event.target.innerHTML);
  }

});

var OptionsExampleOption = React.createClass({
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

