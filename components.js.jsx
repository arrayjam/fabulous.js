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
    var options = this.props.options.map(function(option) {
      return (
        <Option optionName={option.name} optionHash={option.code} onOptionSelect={this.handleOptionSelect} />
      );
    }.bind(this));
    return (
      <div>
        {this.state.optionsHash}
        <ul>
          {options}
        </ul>
      </div>
    );
  }
});

var Option = React.createClass({
  handleClick: function(option) {
    this.props.onOptionSelect(this.props.optionHash);
  },

  render: function() {
    return (
      <li onClick={this.handleClick}>{this.props.optionName}</li>
    );
  }
});

var styleOptions = [
  { name: "cubehelix-rainbow", code: "{ style: \"cubehelix-rainbow\" }" },
  { name: "hcl-rainbow", code: "{ style: \"hcl-rainbow\" }" },
  { name: "rainbow", code: "{ style: \"rainbow\" }" },
  { name: "pride", code: "{ style: \"pride\" }" }
];

React.renderComponent(
  <OptionsExample options={styleOptions} />,
  $("#style-example")[0]
);
