/** @jsx React.DOM */

var OptionsExample = React.createClass({
  getInitialState: function() {
    return { optionsHash: "", evalString: "" };
  },

  handleCodeChange: function(optionsHash) {
    console.log("handleCodeChange", optionsHash);
    this.setState({optionsHash: optionsHash}, this.evaluate);
  },

  createdStyleClass: function() {
    return "fabulous-documentation-" + this.props.documentation.name;
  },

  resultSelector: function() {
    return "#" + this.props.documentation.name;
  },

  evaluate: function() {
    var selector = this.resultSelector(),
        styleTagClass = this.createdStyleClass(),
        hash = this.state.optionsHash + ", styleTagClass: \"" + styleTagClass + "\"",
        evalString = "$('" + selector + "').fabulous({" + hash + "})";

    console.log($("." + styleTagClass));
    $("." + styleTagClass).remove();

    console.log("EVAL", evalString);
    this.setState({ evalString: evalString});
  },

  render: function() {
    var options = this.props.documentation.options.map(function(option, index) {
      return (
        <OptionsExampleOption key={index} optionName={option.name} optionHash={option.code} onOptionSelect={this.handleCodeChange} selected={option.code === this.state.optionsHash} />
      );
    }.bind(this));
    return (
      <div>
        <OptionsExampleEvaluator selector={this.resultSelector()} optionsHash={this.state.optionsHash} onCodeChange={this.handleCodeChange} />
        <ul>
          {options}
        </ul>
        <OptionsExampleResult id={this.props.documentation.name} evalString={this.state.evalString} />
      </div>
    );
  }
});

var OptionsExampleResult = React.createClass({
  componentDidUpdate: function() {
    eval(this.props.evalString);
    setTimeout(function() {
      window.getSelection().selectAllChildren(this.refs.result.getDOMNode());
    }.bind(this), 1);
  },

  render: function() {
    return (
      <div key={+new Date()} id={this.props.id} ref="result">
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
        <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <span>Things</span> <br/>
      </div>
    );
  }
});

var OptionsExampleEvaluator = React.createClass({
  render: function() {
    return (
      <code>$("{this.props.selector}").fabulous({"{ "}<span>{this.props.optionsHash}</span>{" }"});</code>
    );
  },

  handleInput: function(event) {
    this.props.onCodeChange(event.target.innerHTML);
  }
});

var OptionsExampleOption = React.createClass({
  handleClick: function() {
    console.log("handleClick", this.props.optionHash);
    this.props.onOptionSelect(this.props.optionHash);
  },

  render: function() {
    return (
      <li className={this.props.selected ? "active" : ""} onClick={this.handleClick}><code>{this.props.optionName}</code></li>
    );
  }
});

React.renderComponent(
  <OptionsExample documentation={{
    name: "style-options",
    options: [
      { name: "cubehelix-rainbow", code: "style: \"cubehelix-rainbow\"" },
      { name: "hcl-rainbow",       code: "style: \"hcl-rainbow\"" },
      { name: "rainbow",           code: "style: \"rainbow\"" },
      { name: "pride",             code: "style: \"pride\"" }
    ]
  }} />,
  $("#style-example")[0]
);

React.renderComponent(
  <OptionsExample documentation={{
    name: "cycle-options",
    options: [
      { name: "8",   code: "cycle: 8" },
      { name: "20",  code: "cycle: 20" },
      { name: "200", code: "cycle: 200" },
    ]
  }} />,
  $("#cycle-example")[0]
);

React.renderComponent(
  <OptionsExample documentation={{
    name: "rotation-options",
    options: [
      { name: "0",   code: "rotation: 0, cycle: 200" },
      { name: "50",  code: "rotation: 50, cycle: 200" },
      { name: "100", code: "rotation: 100, cycle: 200" },
    ]
  }} />,
  $("#rotation-example")[0]
);

React.renderComponent(
  <OptionsExample documentation={{
    name: "glow-options",
    options: [
      { name: "true",  code: "glow: true" },
      { name: "false", code: "glow: false" },
    ]
  }} />,
  $("#glow-example")[0]
);


