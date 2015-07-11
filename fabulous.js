(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.fabulous = factory();
}(this, function () { 'use strict';

    var instanceIndex = 0;


    // When depth = 1, root = [Node, …].
    // When depth = 2, root = [[Node, …], …].
    // When depth = 3, root = [[[Node, …], …], …]. etc.
    // Note that [Node, …] and NodeList are used interchangeably; see arrayify.
    function Selection(root, depth) {
      this._root = root;
      this._depth = depth;
      this._enter = this._update = this._exit = null;
    }

    function defaultView(node) {
      return node
          && ((node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
              || (node.document && node) // node is a Window
              || node.defaultView); // node is a Document
    }

    function dispatchEvent(node, type, params) {
      var window = defaultView(node),
          event = window.CustomEvent;

      if (event) {
        event = new event(type, params);
      } else {
        event = window.document.createEvent("Event");
        if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
        else event.initEvent(type, false, false);
      }

      node.dispatchEvent(event);
    }

    function selection_dispatch(type, params) {

      function dispatchConstant() {
        return dispatchEvent(this, type, params);
      }

      function dispatchFunction() {
        return dispatchEvent(this, type, params.apply(this, arguments));
      }

      return this.each(typeof params === "function" ? dispatchFunction : dispatchConstant);
    }

    function noop() {}

    var requoteRe = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

    function requote(string) {
      return string.replace(requoteRe, "\\$&");
    }

    function filterListenerOf(listener) {
      return function(event) {
        var related = event.relatedTarget;
        if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
          listener(event);
        }
      };
    }

    var event = null;

    function listenerOf(listener, ancestors, args) {
      return function(event1) {
        var i = ancestors.length, event0 = event; // Events can be reentrant (e.g., focus).
        while (--i >= 0) args[i << 1] = ancestors[i].__data__;
        event = event1;
        try {
          listener.apply(ancestors[0], args);
        } finally {
          event = event0;
        }
      };
    }

    var filterEvents = new Map;

    if (typeof document !== "undefined") {
      var _element = document.documentElement;
      if (!("onmouseenter" in _element)) {
        filterEvents.set("mouseenter", "mouseover").set("mouseleave", "mouseout");
      }
    }

    function selection_event(type, listener, capture) {
      var n = arguments.length,
          key = "__on" + type,
          filter,
          root = this._root;

      if (n < 2) return (n = this.node()[key]) && n._listener;

      if (n < 3) capture = false;
      if ((n = type.indexOf(".")) > 0) type = type.slice(0, n);
      if (filter = filterEvents.has(type)) type = filterEvents.get(type);

      function add() {
        var ancestor = root, i = arguments.length >> 1, ancestors = new Array(i);
        while (--i >= 0) ancestor = ancestor[arguments[(i << 1) + 1]], ancestors[i] = i ? ancestor._parent : ancestor;
        var l = listenerOf(listener, ancestors, arguments);
        if (filter) l = filterListenerOf(l);
        remove.call(this);
        this.addEventListener(type, this[key] = l, l._capture = capture);
        l._listener = listener;
      }

      function remove() {
        var l = this[key];
        if (l) {
          this.removeEventListener(type, l, l._capture);
          delete this[key];
        }
      }

      function removeAll() {
        var re = new RegExp("^__on([^.]+)" + requote(type) + "$"), match;
        for (var name in this) {
          if (match = name.match(re)) {
            var l = this[name];
            this.removeEventListener(match[1], l, l._capture);
            delete this[name];
          }
        }
      }

      return this.each(listener
          ? (n ? add : noop) // Attempt to add untyped listener is ignored.
          : (n ? remove : removeAll));
    }

    function selection_datum(value) {
      return arguments.length ? this.property("__data__", value) : this.node().__data__;
    }

    function selection_remove() {
      return this.each(function() {
        var parent = this.parentNode;
        if (parent) parent.removeChild(this);
      });
    }

    function selectorOf(selector) {
      return function() {
        return this.querySelector(selector);
      };
    }

    var namespaces = (new Map)
        .set("svg", "http://www.w3.org/2000/svg")
        .set("xhtml", "http://www.w3.org/1999/xhtml")
        .set("xlink", "http://www.w3.org/1999/xlink")
        .set("xml", "http://www.w3.org/XML/1998/namespace")
        .set("xmlns", "http://www.w3.org/2000/xmlns/");

    function namespace(name) {
      var i = name.indexOf(":"), prefix = name;
      if (i >= 0) prefix = name.slice(0, i), name = name.slice(i + 1);
      return namespaces.has(prefix) ? {space: namespaces.get(prefix), local: name} : name;
    }

    function creatorOf(name) {
      name = namespace(name);

      function creator() {
        var document = this.ownerDocument,
            uri = this.namespaceURI;
        return uri
            ? document.createElementNS(uri, name)
            : document.createElement(name);
      }

      function creatorNS() {
        return this.ownerDocument.createElementNS(name.space, name.local);
      }

      return name.local ? creatorNS : creator;
    }

    function selection_append(creator, selector) {
      if (typeof creator !== "function") creator = creatorOf(creator);

      function append() {
        return this.appendChild(creator.apply(this, arguments));
      }

      function insert() {
        return this.insertBefore(creator.apply(this, arguments), selector.apply(this, arguments) || null);
      }

      return this.select(arguments.length < 2
          ? append
          : (typeof selector !== "function" && (selector = selectorOf(selector)), insert));
    }

    function selection_html(value) {
      if (!arguments.length) return this.node().innerHTML;

      function setConstant() {
        this.innerHTML = value;
      }

      function setFunction() {
        var v = value.apply(this, arguments);
        this.innerHTML = v == null ? "" : v;
      }

      if (value == null) value = "";

      return this.each(typeof value === "function" ? setFunction : setConstant);
    }

    function selection_text(value) {
      if (!arguments.length) return this.node().textContent;

      function setConstant() {
        this.textContent = value;
      }

      function setFunction() {
        var v = value.apply(this, arguments);
        this.textContent = v == null ? "" : v;
      }

      if (value == null) value = "";

      return this.each(typeof value === "function" ? setFunction : setConstant);
    }

    function collapse(string) {
      return string.trim().replace(/\s+/g, " ");
    }

    function classerOf(name) {
      var re;
      return function(node, value) {
        if (c = node.classList) return value ? c.add(name) : c.remove(name);
        if (!re) re = new RegExp("(?:^|\\s+)" + requote(name) + "(?:\\s+|$)", "g");
        var c = node.getAttribute("class") || "";
        if (value) {
          re.lastIndex = 0;
          if (!re.test(c)) node.setAttribute("class", collapse(c + " " + name));
        } else {
          node.setAttribute("class", collapse(c.replace(re, " ")));
        }
      };
    }

    function selection_class(name, value) {
      name = (name + "").trim().split(/^|\s+/);
      var n = name.length;

      if (arguments.length < 2) {
        var node = this.node(), i = -1;
        if (value = node.classList) { // SVG elements may not support DOMTokenList!
          while (++i < n) if (!value.contains(name[i])) return false;
        } else {
          value = node.getAttribute("class");
          while (++i < n) if (!classedRe(name[i]).test(value)) return false;
        }
        return true;
      }

      name = name.map(classerOf);

      function setConstant() {
        var i = -1;
        while (++i < n) name[i](this, value);
      }

      function setFunction() {
        var i = -1, x = value.apply(this, arguments);
        while (++i < n) name[i](this, x);
      }

      return this.each(typeof value === "function" ? setFunction : setConstant);
    }

    function selection_property(name, value) {
      if (arguments.length < 2) return this.node()[name];

      function remove() {
        delete this[name];
      }

      function setConstant() {
        this[name] = value;
      }

      function setFunction() {
        var x = value.apply(this, arguments);
        if (x == null) delete this[name];
        else this[name] = x;
      }

      return this.each(value == null ? remove : typeof value === "function" ? setFunction : setConstant);
    }

    function selection_style(name, value, priority) {
      var n = arguments.length;

      if (n < 2) return defaultView(n = this.node()).getComputedStyle(n, null).getPropertyValue(name);

      if (n < 3) priority = "";

      function remove() {
        this.style.removeProperty(name);
      }

      function setConstant() {
        this.style.setProperty(name, value, priority);
      }

      function setFunction() {
        var x = value.apply(this, arguments);
        if (x == null) this.style.removeProperty(name);
        else this.style.setProperty(name, x, priority);
      }

      return this.each(value == null ? remove : typeof value === "function" ? setFunction : setConstant);
    }

    function selection_attr(name, value) {
      name = namespace(name);

      if (arguments.length < 2) {
        var node = this.node();
        return name.local
            ? node.getAttributeNS(name.space, name.local)
            : node.getAttribute(name);
      }

      function remove() {
        this.removeAttribute(name);
      }

      function removeNS() {
        this.removeAttributeNS(name.space, name.local);
      }

      function setConstant() {
        this.setAttribute(name, value);
      }

      function setConstantNS() {
        this.setAttributeNS(name.space, name.local, value);
      }

      function setFunction() {
        var x = value.apply(this, arguments);
        if (x == null) this.removeAttribute(name);
        else this.setAttribute(name, x);
      }

      function setFunctionNS() {
        var x = value.apply(this, arguments);
        if (x == null) this.removeAttributeNS(name.space, name.local);
        else this.setAttributeNS(name.space, name.local, x);
      }

      return this.each(value == null
          ? (name.local ? removeNS : remove)
          : (typeof value === "function"
              ? (name.local ? setFunctionNS : setFunction)
              : (name.local ? setConstantNS : setConstant)));
    }

    function selection_each(callback) {
      var depth = this._depth,
          stack = new Array(depth);

      function visit(nodes, depth) {
        var i = -1,
            n = nodes.length,
            node;

        if (--depth) {
          var stack0 = depth * 2,
              stack1 = stack0 + 1;
          while (++i < n) {
            if (node = nodes[i]) {
              stack[stack0] = node._parent.__data__, stack[stack1] = i;
              visit(node, depth);
            }
          }
        }

        else {
          while (++i < n) {
            if (node = nodes[i]) {
              stack[0] = node.__data__, stack[1] = i;
              callback.apply(node, stack);
            }
          }
        }
      }

      visit(this._root, depth);
      return this;
    }

    function selection_empty() {
      return !this.node();
    }

    function selection_size() {
      var size = 0;
      this.each(function() { ++size; });
      return size;
    }

    function firstNode(nodes, depth) {
      var i = -1,
          n = nodes.length,
          node;

      if (--depth) {
        while (++i < n) {
          if (node = nodes[i]) {
            if (node = firstNode(node, depth)) {
              return node;
            }
          }
        }
      }

      else {
        while (++i < n) {
          if (node = nodes[i]) {
            return node;
          }
        }
      }
    }

    function selection_node() {
      return firstNode(this._root, this._depth);
    }

    function selection_nodes() {
      var nodes = new Array(this.size()), i = -1;
      this.each(function() { nodes[++i] = this; });
      return nodes;
    }

    function selection_call() {
      var callback = arguments[0];
      callback.apply(arguments[0] = this, arguments);
      return this;
    }

    function arrayifyNode(nodes, depth) {
      var i = -1,
          n = nodes.length,
          node;

      if (--depth) {
        while (++i < n) {
          if (node = nodes[i]) {
            nodes[i] = arrayifyNode(node, depth);
          }
        }
      }

      else if (!Array.isArray(nodes)) {
        var array = new Array(n);
        while (++i < n) array[i] = nodes[i];
        array._parent = nodes._parent;
        nodes = array;
      }

      return nodes;
    }


    // The leaf groups of the selection hierarchy are initially NodeList,
    // and then lazily converted to arrays when mutation is required.
    function arrayify(selection) {
      return selection._root = arrayifyNode(selection._root, selection._depth);
    }

    function _ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function selection_sort(comparator) {
      if (!comparator) comparator = _ascending;

      function compare(a, b) {
        return a && b ? comparator(a.__data__, b.__data__) : !a - !b;
      }

      function visit(nodes, depth) {
        if (--depth) {
          var i = -1,
              n = nodes.length,
              node;
          while (++i < n) {
            if (node = nodes[i]) {
              visit(node, depth);
            }
          }
        }

        else {
          nodes.sort(compare);
        }
      }

      visit(arrayify(this), this._depth);
      return this.order();
    }

    function orderNode(nodes, depth) {
      var i = nodes.length,
          node,
          next;

      if (--depth) {
        while (--i >= 0) {
          if (node = nodes[i]) {
            orderNode(node, depth);
          }
        }
      }

      else {
        next = nodes[--i];
        while (--i >= 0) {
          if (node = nodes[i]) {
            if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
            next = node;
          }
        }
      }
    }

    function selection_order() {
      orderNode(this._root, this._depth);
      return this;
    }

    function emptyNode(nodes, depth) {
      var i = -1,
          n = nodes.length,
          node,
          empty = new Array(n);

      if (--depth) {
        while (++i < n) {
          if (node = nodes[i]) {
            empty[i] = emptyNode(node, depth);
          }
        }
      }

      empty._parent = nodes._parent;
      return empty;
    }

    function emptyOf(selection) {
      return new Selection(emptyNode(arrayify(selection), selection._depth), selection._depth);
    }


    // Lazily constructs the exit selection for this (update) selection.
    // Until this selection is joined to data, the exit selection will be empty.
    function selection_exit() {
      return this._exit || (this._exit = emptyOf(this));
    }


    // Lazily constructs the enter selection for this (update) selection.
    // Until this selection is joined to data, the enter selection will be empty.
    function selection_enter() {
      if (!this._enter) {
        this._enter = emptyOf(this);
        this._enter._update = this;
      }
      return this._enter;
    }

    function EnterNode(parent, datum) {
      this.ownerDocument = parent.ownerDocument;
      this.namespaceURI = parent.namespaceURI;
      this._next = null;
      this._parent = parent;
      this.__data__ = datum;
    }

    EnterNode.prototype = {
      appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
      insertBefore: function(child, next) { return this._parent.insertBefore(child, next || this._next); }
    };

    function valueOf_(value) { // XXX https://github.com/rollup/rollup/issues/12
      return function() {
        return value;
      };
    }


    // The value may either be an array or a function that returns an array.
    // An optional key function may be specified to control how data is bound;
    // if no key function is specified, data is bound to nodes by index.
    // Or, if no arguments are specified, this method returns all bound data.
    function selection_data(value, key) {
      if (!value) {
        var data = new Array(this.size()), i = -1;
        this.each(function(d) { data[++i] = d; });
        return data;
      }

      var depth = this._depth - 1,
          stack = new Array(depth * 2),
          bind = key ? bindKey : bindIndex;

      if (typeof value !== "function") value = valueOf_(value);
      visit(this._root, this.enter()._root, this.exit()._root, depth);

      function visit(update, enter, exit, depth) {
        var i = -1,
            n,
            node;

        if (depth--) {
          var stack0 = depth * 2,
              stack1 = stack0 + 1;

          n = update.length;

          while (++i < n) {
            if (node = update[i]) {
              stack[stack0] = node._parent.__data__, stack[stack1] = i;
              visit(node, enter[i], exit[i], depth);
            }
          }
        }

        else {
          var j = 0,
              before;

          bind(update, enter, exit, value.apply(update._parent, stack));
          n = update.length;

          // Now connect the enter nodes to their following update node, such that
          // appendChild can insert the materialized enter node before this node,
          // rather than at the end of the parent node.
          while (++i < n) {
            if (before = enter[i]) {
              if (i >= j) j = i + 1;
              while (!(node = update[j]) && ++j < n);
              before._next = node || null;
            }
          }
        }
      }

      function bindIndex(update, enter, exit, data) {
        var i = 0,
            node,
            nodeLength = update.length,
            dataLength = data.length,
            minLength = Math.min(nodeLength, dataLength);

        // Clear the enter and exit arrays, and then initialize to the new length.
        enter.length = 0, enter.length = dataLength;
        exit.length = 0, exit.length = nodeLength;

        for (; i < minLength; ++i) {
          if (node = update[i]) {
            node.__data__ = data[i];
          } else {
            enter[i] = new EnterNode(update._parent, data[i]);
          }
        }

        // Note: we don’t need to delete update[i] here because this loop only
        // runs when the data length is greater than the node length.
        for (; i < dataLength; ++i) {
          enter[i] = new EnterNode(update._parent, data[i]);
        }

        // Note: and, we don’t need to delete update[i] here because immediately
        // following this loop we set the update length to data length.
        for (; i < nodeLength; ++i) {
          if (node = update[i]) {
            exit[i] = update[i];
          }
        }

        update.length = dataLength;
      }

      function bindKey(update, enter, exit, data) {
        var i,
            node,
            dataLength = data.length,
            nodeLength = update.length,
            nodeByKeyValue = new Map,
            keyStack = new Array(2).concat(stack),
            keyValues = new Array(nodeLength),
            keyValue;

        // Clear the enter and exit arrays, and then initialize to the new length.
        enter.length = 0, enter.length = dataLength;
        exit.length = 0, exit.length = nodeLength;

        // Compute the keys for each node.
        for (i = 0; i < nodeLength; ++i) {
          if (node = update[i]) {
            keyStack[0] = node.__data__, keyStack[1] = i;
            keyValues[i] = keyValue = key.apply(node, keyStack);

            // Is this a duplicate of a key we’ve previously seen?
            // If so, this node is moved to the exit selection.
            if (nodeByKeyValue.has(keyValue)) {
              exit[i] = node;
            }

            // Otherwise, record the mapping from key to node.
            else {
              nodeByKeyValue.set(keyValue, node);
            }
          }
        }

        // Now clear the update array and initialize to the new length.
        update.length = 0, update.length = dataLength;

        // Compute the keys for each datum.
        for (i = 0; i < dataLength; ++i) {
          keyStack[0] = data[i], keyStack[1] = i;
          keyValue = key.apply(update._parent, keyStack);

          // Is there a node associated with this key?
          // If not, this datum is added to the enter selection.
          if (!(node = nodeByKeyValue.get(keyValue))) {
            enter[i] = new EnterNode(update._parent, data[i]);
          }

          // Did we already bind a node using this key? (Or is a duplicate?)
          // If unique, the node and datum are joined in the update selection.
          // Otherwise, the datum is ignored, neither entering nor exiting.
          else if (node !== true) {
            update[i] = node;
            node.__data__ = data[i];
          }

          // Record that we consumed this key, either to enter or update.
          nodeByKeyValue.set(keyValue, true);
        }

        // Take any remaining nodes that were not bound to data,
        // and place them in the exit selection.
        for (i = 0; i < nodeLength; ++i) {
          if ((node = nodeByKeyValue.get(keyValues[i])) !== true) {
            exit[i] = node;
          }
        }
      }

      return this;
    }

    var filterOf = function(selector) {
      return function() {
        return this.matches(selector);
      };
    };

    if (typeof document !== "undefined") {
      var element = document.documentElement;
      if (!element.matches) {
        var vendorMatches = element.webkitMatchesSelector || element.msMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector;
        filterOf = function(selector) { return function() { return vendorMatches.call(this, selector); }; };
      }
    }


    // The filter may either be a selector string (e.g., ".foo")
    // or a function that returns a boolean.
    function selection_filter(filter) {
      var depth = this._depth,
          stack = new Array(depth * 2);

      if (typeof filter !== "function") filter = filterOf(filter);

      function visit(nodes, depth) {
        var i = -1,
            n = nodes.length,
            node,
            subnodes;

        if (--depth) {
          var stack0 = depth * 2,
              stack1 = stack0 + 1;
          subnodes = new Array(n);
          while (++i < n) {
            if (node = nodes[i]) {
              stack[stack0] = node._parent.__data__, stack[stack1] = i;
              subnodes[i] = visit(node, depth);
            }
          }
        }

        // The filter operation does not preserve the original index,
        // so the resulting leaf groups are dense (not sparse).
        else {
          subnodes = [];
          while (++i < n) {
            if (node = nodes[i]) {
              stack[0] = node.__data__, stack[1] = i;
              if (filter.apply(node, stack)) {
                subnodes.push(node);
              }
            }
          }
        }

        subnodes._parent = nodes._parent;
        return subnodes;
      }

      return new Selection(visit(this._root, depth), depth);
    }

    function selectorAllOf(selector) {
      return function() {
        return this.querySelectorAll(selector);
      };
    }


    // The selector may either be a selector string (e.g., ".foo")
    // or a function that optionally returns an array of nodes to select.
    // This is the only operation that increases the depth of a selection.
    function selection_selectAll(selector) {
      var depth = this._depth,
          stack = new Array(depth * 2);

      if (typeof selector !== "function") selector = selectorAllOf(selector);

      function visit(nodes, depth) {
        var i = -1,
            n = nodes.length,
            node,
            subnode,
            subnodes = new Array(n);

        if (--depth) {
          var stack0 = depth * 2,
              stack1 = stack0 + 1;
          while (++i < n) {
            if (node = nodes[i]) {
              stack[stack0] = node._parent.__data__, stack[stack1] = i;
              subnodes[i] = visit(node, depth);
            }
          }
        }

        // Data is not propagated since there is a one-to-many mapping.
        // The parent of the new leaf group is the old node.
        else {
          while (++i < n) {
            if (node = nodes[i]) {
              stack[0] = node.__data__, stack[1] = i;
              subnodes[i] = subnode = selector.apply(node, stack);
              subnode._parent = node;
            }
          }
        }

        subnodes._parent = nodes._parent;
        return subnodes;
      }

      return new Selection(visit(this._root, depth), depth + 1);
    }


    // The selector may either be a selector string (e.g., ".foo")
    // or a function that optionally returns the node to select.
    function selection_select(selector) {
      var depth = this._depth,
          stack = new Array(depth * 2);

      if (typeof selector !== "function") selector = selectorOf(selector);

      function visit(nodes, update, depth) {
        var i = -1,
            n = nodes.length,
            node,
            subnode,
            subnodes = new Array(n);

        if (--depth) {
          var stack0 = depth * 2,
              stack1 = stack0 + 1;
          while (++i < n) {
            if (node = nodes[i]) {
              stack[stack0] = node._parent.__data__, stack[stack1] = i;
              subnodes[i] = visit(node, update && update[i], depth);
            }
          }
        }

        // The leaf group may be sparse if the selector returns a falsey value;
        // this preserves the index of nodes (unlike selection.filter).
        // Propagate data to the new node only if it is defined on the old.
        // If this is an enter selection, materialized nodes are moved to update.
        else {
          while (++i < n) {
            if (node = nodes[i]) {
              stack[0] = node.__data__, stack[1] = i;
              if (subnode = selector.apply(node, stack)) {
                if ("__data__" in node) subnode.__data__ = node.__data__;
                if (update) update[i] = subnode, delete nodes[i];
                subnodes[i] = subnode;
              }
            }
          }
        }

        subnodes._parent = nodes._parent;
        return subnodes;
      }

      return new Selection(visit(this._root, this._update && this._update._root, depth), depth);
    }

    function selection() {
      return new Selection([document.documentElement], 1);
    }

    Selection.prototype = selection.prototype = {
      select: selection_select,
      selectAll: selection_selectAll,
      filter: selection_filter,
      data: selection_data,
      enter: selection_enter,
      exit: selection_exit,
      order: selection_order,
      sort: selection_sort,
      call: selection_call,
      nodes: selection_nodes,
      node: selection_node,
      size: selection_size,
      empty: selection_empty,
      each: selection_each,
      attr: selection_attr,
      style: selection_style,
      property: selection_property,
      class: selection_class,
      classed: selection_class, // deprecated alias
      text: selection_text,
      html: selection_html,
      append: selection_append,
      insert: selection_append, // deprecated alias
      remove: selection_remove,
      datum: selection_datum,
      event: selection_event,
      on: selection_event, // deprecated alias
      dispatch: selection_dispatch
    };

    function select(selector) {
      return new Selection([typeof selector === "string" ? document.querySelector(selector) : selector], 1);
    }

    function selectAll(selector) {
      return new Selection(typeof selector === "string" ? document.querySelectorAll(selector) : selector, 1);
    }

    function Hsl(h, s, l) {
      this.h = +h;
      this.s = Math.max(0, Math.min(1, +s));
      this.l = Math.max(0, Math.min(1, +l));
    }

    function Color() {}

    Color.prototype = {
      toString: function() {
        return this.rgb() + "";
      }
    };

    var _prototype = Hsl.prototype = new Color;

    var darker = .7;

    function Rgb(r, g, b) {
      this.r = Math.max(0, Math.min(255, Math.round(r)));
      this.g = Math.max(0, Math.min(255, Math.round(g)));
      this.b = Math.max(0, Math.min(255, Math.round(b)));
    }

    var __prototype = Rgb.prototype = new Color;

    __prototype.brighter = function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k);
    };

    __prototype.rgb = function() {
      return this;
    };

    function _format(r, g, b) {
      if (isNaN(r)) r = 0;
      if (isNaN(g)) g = 0;
      if (isNaN(b)) b = 0;
      return "#"
          + (r < 16 ? "0" + r.toString(16) : r.toString(16))
          + (g < 16 ? "0" + g.toString(16) : g.toString(16))
          + (b < 16 ? "0" + b.toString(16) : b.toString(16));
    }

    __prototype.toString = function() {
      return _format(this.r, this.g, this.b);
    };

    __prototype.darker = function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k);
    };

    var brighter = 1 / darker;

    _prototype.brighter = function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k);
    };

    _prototype.darker = function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k);
    };


    /* From FvD 13.37, CSS Color Module Level 3 */
    function hsl2rgb(h, m1, m2) {
      return (h < 60 ? m1 + (m2 - m1) * h / 60
          : h < 180 ? m2
          : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
          : m1) * 255;
    }

    _prototype.rgb = function() {
      var h = this.h % 360 + (this.h < 0) * 360,
          s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
          l = this.l,
          m2 = l <= .5 ? l * (1 + s) : l + s - l * s,
          m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2)
      );
    };

    var named = (new Map)
        .set("aliceblue", 0xf0f8ff)
        .set("antiquewhite", 0xfaebd7)
        .set("aqua", 0x00ffff)
        .set("aquamarine", 0x7fffd4)
        .set("azure", 0xf0ffff)
        .set("beige", 0xf5f5dc)
        .set("bisque", 0xffe4c4)
        .set("black", 0x000000)
        .set("blanchedalmond", 0xffebcd)
        .set("blue", 0x0000ff)
        .set("blueviolet", 0x8a2be2)
        .set("brown", 0xa52a2a)
        .set("burlywood", 0xdeb887)
        .set("cadetblue", 0x5f9ea0)
        .set("chartreuse", 0x7fff00)
        .set("chocolate", 0xd2691e)
        .set("coral", 0xff7f50)
        .set("cornflowerblue", 0x6495ed)
        .set("cornsilk", 0xfff8dc)
        .set("crimson", 0xdc143c)
        .set("cyan", 0x00ffff)
        .set("darkblue", 0x00008b)
        .set("darkcyan", 0x008b8b)
        .set("darkgoldenrod", 0xb8860b)
        .set("darkgray", 0xa9a9a9)
        .set("darkgreen", 0x006400)
        .set("darkgrey", 0xa9a9a9)
        .set("darkkhaki", 0xbdb76b)
        .set("darkmagenta", 0x8b008b)
        .set("darkolivegreen", 0x556b2f)
        .set("darkorange", 0xff8c00)
        .set("darkorchid", 0x9932cc)
        .set("darkred", 0x8b0000)
        .set("darksalmon", 0xe9967a)
        .set("darkseagreen", 0x8fbc8f)
        .set("darkslateblue", 0x483d8b)
        .set("darkslategray", 0x2f4f4f)
        .set("darkslategrey", 0x2f4f4f)
        .set("darkturquoise", 0x00ced1)
        .set("darkviolet", 0x9400d3)
        .set("deeppink", 0xff1493)
        .set("deepskyblue", 0x00bfff)
        .set("dimgray", 0x696969)
        .set("dimgrey", 0x696969)
        .set("dodgerblue", 0x1e90ff)
        .set("firebrick", 0xb22222)
        .set("floralwhite", 0xfffaf0)
        .set("forestgreen", 0x228b22)
        .set("fuchsia", 0xff00ff)
        .set("gainsboro", 0xdcdcdc)
        .set("ghostwhite", 0xf8f8ff)
        .set("gold", 0xffd700)
        .set("goldenrod", 0xdaa520)
        .set("gray", 0x808080)
        .set("green", 0x008000)
        .set("greenyellow", 0xadff2f)
        .set("grey", 0x808080)
        .set("honeydew", 0xf0fff0)
        .set("hotpink", 0xff69b4)
        .set("indianred", 0xcd5c5c)
        .set("indigo", 0x4b0082)
        .set("ivory", 0xfffff0)
        .set("khaki", 0xf0e68c)
        .set("lavender", 0xe6e6fa)
        .set("lavenderblush", 0xfff0f5)
        .set("lawngreen", 0x7cfc00)
        .set("lemonchiffon", 0xfffacd)
        .set("lightblue", 0xadd8e6)
        .set("lightcoral", 0xf08080)
        .set("lightcyan", 0xe0ffff)
        .set("lightgoldenrodyellow", 0xfafad2)
        .set("lightgray", 0xd3d3d3)
        .set("lightgreen", 0x90ee90)
        .set("lightgrey", 0xd3d3d3)
        .set("lightpink", 0xffb6c1)
        .set("lightsalmon", 0xffa07a)
        .set("lightseagreen", 0x20b2aa)
        .set("lightskyblue", 0x87cefa)
        .set("lightslategray", 0x778899)
        .set("lightslategrey", 0x778899)
        .set("lightsteelblue", 0xb0c4de)
        .set("lightyellow", 0xffffe0)
        .set("lime", 0x00ff00)
        .set("limegreen", 0x32cd32)
        .set("linen", 0xfaf0e6)
        .set("magenta", 0xff00ff)
        .set("maroon", 0x800000)
        .set("mediumaquamarine", 0x66cdaa)
        .set("mediumblue", 0x0000cd)
        .set("mediumorchid", 0xba55d3)
        .set("mediumpurple", 0x9370db)
        .set("mediumseagreen", 0x3cb371)
        .set("mediumslateblue", 0x7b68ee)
        .set("mediumspringgreen", 0x00fa9a)
        .set("mediumturquoise", 0x48d1cc)
        .set("mediumvioletred", 0xc71585)
        .set("midnightblue", 0x191970)
        .set("mintcream", 0xf5fffa)
        .set("mistyrose", 0xffe4e1)
        .set("moccasin", 0xffe4b5)
        .set("navajowhite", 0xffdead)
        .set("navy", 0x000080)
        .set("oldlace", 0xfdf5e6)
        .set("olive", 0x808000)
        .set("olivedrab", 0x6b8e23)
        .set("orange", 0xffa500)
        .set("orangered", 0xff4500)
        .set("orchid", 0xda70d6)
        .set("palegoldenrod", 0xeee8aa)
        .set("palegreen", 0x98fb98)
        .set("paleturquoise", 0xafeeee)
        .set("palevioletred", 0xdb7093)
        .set("papayawhip", 0xffefd5)
        .set("peachpuff", 0xffdab9)
        .set("peru", 0xcd853f)
        .set("pink", 0xffc0cb)
        .set("plum", 0xdda0dd)
        .set("powderblue", 0xb0e0e6)
        .set("purple", 0x800080)
        .set("rebeccapurple", 0x663399)
        .set("red", 0xff0000)
        .set("rosybrown", 0xbc8f8f)
        .set("royalblue", 0x4169e1)
        .set("saddlebrown", 0x8b4513)
        .set("salmon", 0xfa8072)
        .set("sandybrown", 0xf4a460)
        .set("seagreen", 0x2e8b57)
        .set("seashell", 0xfff5ee)
        .set("sienna", 0xa0522d)
        .set("silver", 0xc0c0c0)
        .set("skyblue", 0x87ceeb)
        .set("slateblue", 0x6a5acd)
        .set("slategray", 0x708090)
        .set("slategrey", 0x708090)
        .set("snow", 0xfffafa)
        .set("springgreen", 0x00ff7f)
        .set("steelblue", 0x4682b4)
        .set("tan", 0xd2b48c)
        .set("teal", 0x008080)
        .set("thistle", 0xd8bfd8)
        .set("tomato", 0xff6347)
        .set("turquoise", 0x40e0d0)
        .set("violet", 0xee82ee)
        .set("wheat", 0xf5deb3)
        .set("white", 0xffffff)
        .set("whitesmoke", 0xf5f5f5)
        .set("yellow", 0xffff00)
        .set("yellowgreen", 0x9acd32);

    function rgb(r, g, b) {
      if (arguments.length === 1) {
        if (!(r instanceof Color)) r = color(r);
        if (r) {
          r = r.rgb();
          b = r.b;
          g = r.g;
          r = r.r;
        } else {
          r = g = b = NaN;
        }
      }
      return new Rgb(r, g, b);
    }

    function rgbn(n) {
      return rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff);
    }

    var reHslPercent = /^hsl\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;

    var reRgbPercent = /^rgb\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;

    var reRgbInteger = /^rgb\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*\)$/;

    var reHex6 = /^#([0-9a-f]{6})$/;

    var reHex3 = /^#([0-9a-f]{3})$/;

    function color(format) {
      var m;
      format = (format + "").trim().toLowerCase();
      return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf))) // #f00
          : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
          : (m = reRgbInteger.exec(format)) ? rgb(m[1], m[2], m[3]) // rgb(255,0,0)
          : (m = reRgbPercent.exec(format)) ? rgb(m[1] * 2.55, m[2] * 2.55, m[3] * 2.55) // rgb(100%,0%,0%)
          : (m = reHslPercent.exec(format)) ? hsl(m[1], m[2] * .01, m[3] * .01) // hsl(120,50%,50%)
          : named.has(format) ? rgbn(named.get(format))
          : null;
    }

    function hsl(h, s, l) {
      if (arguments.length === 1) {
        if (h instanceof Hsl) {
          l = h.l;
          s = h.s;
          h = h.h;
        } else {
          if (!(h instanceof Color)) h = color(h);
          if (h) {
            if (h instanceof Hsl) return h;
            h = h.rgb();
            var r = h.r / 255,
                g = h.g / 255,
                b = h.b / 255,
                min = Math.min(r, g, b),
                max = Math.max(r, g, b),
                range = max - min;
            l = (max + min) / 2;
            if (range) {
              s = l < .5 ? range / (max + min) : range / (2 - max - min);
              if (r === max) h = (g - b) / range + (g < b) * 6;
              else if (g === max) h = (b - r) / range + 2;
              else h = (r - g) / range + 4;
              h *= 60;
            } else {
              h = NaN;
              s = l > 0 && l < 1 ? 0 : h;
            }
          } else {
            h = s = l = NaN;
          }
        }
      }
      return new Hsl(h, s, l);
    }

    function interpolateNumber(a, b) {
      return a = +a, b -= a, function(t) {
        return a + b * t;
      };
    }

    function interpolateObject(a, b) {
      var i = {},
          c = {},
          k;

      for (k in a) {
        if (k in b) {
          i[k] = interpolate(a[k], b[k]);
        } else {
          c[k] = a[k];
        }
      }

      for (k in b) {
        if (!(k in a)) {
          c[k] = b[k];
        }
      }

      return function(t) {
        for (k in i) c[k] = i[k](t);
        return c;
      };
    }


    // TODO sparse arrays?
    function interpolateArray(a, b) {
      var x = [],
          c = [],
          na = a.length,
          nb = b.length,
          n0 = Math.min(a.length, b.length),
          i;

      for (i = 0; i < n0; ++i) x.push(interpolate(a[i], b[i]));
      for (; i < na; ++i) c[i] = a[i];
      for (; i < nb; ++i) c[i] = b[i];

      return function(t) {
        for (i = 0; i < n0; ++i) c[i] = x[i](t);
        return c;
      };
    }

    function interpolateRgb(a, b) {
      a = rgb(a);
      b = rgb(b);
      var ar = a.r,
          ag = a.g,
          ab = a.b,
          br = b.r - ar,
          bg = b.g - ag,
          bb = b.b - ab;
      return function(t) {
        return _format(Math.round(ar + br * t), Math.round(ag + bg * t), Math.round(ab + bb * t));
      };
    }

    function interpolate0(b) {
      return function() {
        return b;
      };
    }

    function interpolate1(b) {
      return function(t) {
        return b(t) + "";
      };
    }

    var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
    var reB = new RegExp(reA.source, "g");

    function interpolateString(a, b) {
      var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
          am, // current match in a
          bm, // current match in b
          bs, // string preceding current number in b, if any
          i = -1, // index in s
          s = [], // string constants and placeholders
          q = []; // number interpolators

      // Coerce inputs to strings.
      a = a + "", b = b + "";

      // Interpolate pairs of numbers in a & b.
      while ((am = reA.exec(a))
          && (bm = reB.exec(b))) {
        if ((bs = bm.index) > bi) { // a string precedes the next number in b
          bs = b.slice(bi, bs);
          if (s[i]) s[i] += bs; // coalesce with previous string
          else s[++i] = bs;
        }
        if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
          if (s[i]) s[i] += bm; // coalesce with previous string
          else s[++i] = bm;
        } else { // interpolate non-matching numbers
          s[++i] = null;
          q.push({i: i, x: interpolateNumber(am, bm)});
        }
        bi = reB.lastIndex;
      }

      // Add remains of b.
      if (bi < b.length) {
        bs = b.slice(bi);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }

      // Special optimization for only a single match.
      // Otherwise, interpolate each of the numbers and rejoin the string.
      return s.length < 2 ? (q[0]
          ? interpolate1(q[0].x)
          : interpolate0(b))
          : (b = q.length, function(t) {
              for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
              return s.join("");
            });
    }

    var interpolators = [
      function(a, b) {
        var t = typeof b, c;
        return (t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
            : b instanceof color ? interpolateRgb
            : Array.isArray(b) ? interpolateArray
            : t === "object" && isNaN(b) ? interpolateObject
            : interpolateNumber)(a, b);
      }
    ];

    function interpolate(a, b) {
      var i = interpolators.length, f;
      while (--i >= 0 && !(f = interpolators[i](a, b)));
      return f;
    }

    var e2 = Math.sqrt(2);

    var e5 = Math.sqrt(10);

    var e10 = Math.sqrt(50);

    function tickRange(domain, count) {
      if (count == null) count = 10;

      var start = domain[0],
          stop = domain[domain.length - 1];

      if (stop < start) error = stop, stop = start, start = error;

      var span = stop - start,
          step = Math.pow(10, Math.floor(Math.log(span / count) / Math.LN10)),
          error = span / count / step;

      // Filter ticks to get closer to the desired count.
      if (error >= e10) step *= 10;
      else if (error >= e5) step *= 5;
      else if (error >= e2) step *= 2;

      // Round start and stop values to step interval.
      return [
        Math.ceil(start / step) * step,
        Math.floor(stop / step) * step + step / 2, // inclusive
        step
      ];
    }

    function nice(domain, step) {
      domain = domain.slice();
      if (!step) return domain;

      var i0 = 0,
          i1 = domain.length - 1,
          x0 = domain[i0],
          x1 = domain[i1],
          t;

      if (x1 < x0) {
        t = i0, i0 = i1, i1 = t;
        t = x0, x0 = x1, x1 = t;
      }

      domain[i0] = Math.floor(x0 / step) * step;
      domain[i1] = Math.ceil(x1 / step) * step;
      return domain;
    }

    var prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];


    // Computes the decimal coefficient and exponent of the specified number x with
    // significant digits p, where x is positive and p is in [1, 21] or undefined.
    // For example, formatDecimal(1.23) returns ["123", 0].
    function formatDecimal(x, p) {
      if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
      var i, coefficient = x.slice(0, i);

      // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
      // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
      return [
        coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
        +x.slice(i + 1)
      ];
    }

    function exponent(x) {
      return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
    }

    var prefixExponent;

    function formatPrefixAuto(x, p) {
      var d = formatDecimal(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1],
          i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
          n = coefficient.length;
      return i === n ? coefficient
          : i > n ? coefficient + new Array(i - n + 1).join("0")
          : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
          : "0." + new Array(1 - i).join("0") + formatDecimal(x, p + i - 1)[0]; // less than 1y!
    }

    function formatRounded(x, p) {
      var d = formatDecimal(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1];
      return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
          : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
          : coefficient + new Array(exponent - coefficient.length + 2).join("0");
    }

    function formatDefault(x, p) {
      x = x.toPrecision(p);

      out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
        switch (x[i]) {
          case ".": i0 = i1 = i; break;
          case "0": if (i0 === 0) i0 = i; i1 = i; break;
          case "e": break out;
          default: if (i0 > 0) i0 = 0; break;
        }
      }

      return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
    }

    var formatTypes = {
      "": formatDefault,
      "%": function(x, p) { return (x * 100).toFixed(p); },
      "b": function(x) { return Math.round(x).toString(2); },
      "c": function(x) { return x + ""; },
      "d": function(x) { return Math.round(x).toString(10); },
      "e": function(x, p) { return x.toExponential(p); },
      "f": function(x, p) { return x.toFixed(p); },
      "g": function(x, p) { return x.toPrecision(p); },
      "o": function(x) { return Math.round(x).toString(8); },
      "p": function(x, p) { return formatRounded(x * 100, p); },
      "r": formatRounded,
      "s": formatPrefixAuto,
      "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
      "x": function(x) { return Math.round(x).toString(16); }
    };


    // [[fill]align][sign][symbol][0][width][,][.precision][type]
    var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

    function FormatSpecifier(specifier) {
      if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

      var match,
          fill = match[1] || " ",
          align = match[2] || ">",
          sign = match[3] || "-",
          symbol = match[4] || "",
          zero = !!match[5],
          width = match[6] && +match[6],
          comma = !!match[7],
          precision = match[8] && +match[8].slice(1),
          type = match[9] || "";

      // The "n" type is an alias for ",g".
      if (type === "n") comma = true, type = "g";

      // Map invalid types to the default format.
      else if (!formatTypes[type]) type = "";

      // If zero fill is specified, padding goes after sign and before digits.
      if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

      this.fill = fill;
      this.align = align;
      this.sign = sign;
      this.symbol = symbol;
      this.zero = zero;
      this.width = width;
      this.comma = comma;
      this.precision = precision;
      this.type = type;
    }

    FormatSpecifier.prototype.toString = function() {
      return this.fill
          + this.align
          + this.sign
          + this.symbol
          + (this.zero ? "0" : "")
          + (this.width == null ? "" : Math.max(1, this.width | 0))
          + (this.comma ? "," : "")
          + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
          + this.type;
    };

    function formatSpecifier(specifier) {
      return new FormatSpecifier(specifier);
    }

    function identity(x) {
      return x;
    }

    function formatGroup(grouping, thousands) {
      return function(value, width) {
        var i = value.length,
            t = [],
            j = 0,
            g = grouping[0],
            length = 0;

        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring(i -= g, i + g));
          if ((length += g + 1) > width) break;
          g = grouping[j = (j + 1) % grouping.length];
        }

        return t.reverse().join(thousands);
      };
    }

    function localeFormat(locale) {
      var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity,
          currency = locale.currency,
          decimal = locale.decimal;

      function format(specifier) {
        specifier = formatSpecifier(specifier);

        var fill = specifier.fill,
            align = specifier.align,
            sign = specifier.sign,
            symbol = specifier.symbol,
            zero = specifier.zero,
            width = specifier.width,
            comma = specifier.comma,
            precision = specifier.precision,
            type = specifier.type;

        // Compute the prefix and suffix.
        // For SI-prefix, the suffix is lazily computed.
        var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
            suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? "%" : "";

        // What format function should we use?
        // Is this an integer type?
        // Can this type generate exponential notation?
        var formatType = formatTypes[type],
            maybeSuffix = !type || /[defgprs%]/.test(type);

        // Set the default precision if not specified,
        // or clamp the specified precision to the supported range.
        // For significant precision, it must be in [1, 21].
        // For fixed precision, it must be in [0, 20].
        precision = precision == null ? (type ? 6 : 12)
            : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
            : Math.max(0, Math.min(20, precision));

        return function(value) {
          var valuePrefix = prefix,
              valueSuffix = suffix;

          if (type === "c") {
            valueSuffix = formatType(value) + valueSuffix;
            value = "";
          } else {
            value = +value;

            // Convert negative to positive, and compute the prefix.
            // Note that -0 is not less than 0, but 1 / -0 is!
            var valueNegative = (value < 0 || 1 / value < 0) && (value *= -1, true);

            // Perform the initial formatting.
            value = formatType(value, precision);

            // Compute the prefix and suffix.
            valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
            valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

            // Break the formatted value into the integer “value” part that can be
            // grouped, and fractional or exponential “suffix” part that is not.
            if (maybeSuffix) {
              var i = -1, n = value.length, c;
              while (++i < n) {
                if (c = value.charCodeAt(i), 48 > c || c > 57) {
                  valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                  value = value.slice(0, i);
                  break;
                }
              }
            }
          }

          // If the fill character is not "0", grouping is applied before padding.
          if (comma && !zero) value = group(value, Infinity);

          // Compute the padding.
          var length = valuePrefix.length + value.length + valueSuffix.length,
              padding = length < width ? new Array(width - length + 1).join(fill) : "";

          // If the fill character is "0", grouping is applied after padding.
          if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

          // Reconstruct the final output based on the desired alignment.
          switch (align) {
            case "<": return valuePrefix + value + valueSuffix + padding;
            case "=": return valuePrefix + padding + value + valueSuffix;
            case "^": return padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
          }
          return padding + valuePrefix + value + valueSuffix;
        };
      }

      function formatPrefix(specifier, value) {
        var f = format((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
            e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
            k = Math.pow(10, -e),
            prefix = prefixes[8 + e / 3];
        return function(value) {
          return f(k * value) + prefix;
        };
      }

      return {
        format: format,
        formatPrefix: formatPrefix
      };
    }

    var locale = localeFormat({
      decimal: ".",
      thousands: ",",
      grouping: [3],
      currency: ["$", ""]
    });

    var format = locale.format;

    function precisionFixed(step) {
      return Math.max(0, -exponent(Math.abs(step)));
    }

    function precisionRound(step, max) {
      return Math.max(0, exponent(Math.abs(max)) - exponent(Math.abs(step))) + 1;
    }

    var formatPrefix = locale.formatPrefix;

    function precisionPrefix(step, value) {
      return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
    }

    function tickFormat(domain, count, specifier) {
      var range = tickRange(domain, count);
      if (specifier == null) {
        specifier = ",." + precisionFixed(range[2]) + "f";
      } else {
        switch (specifier = formatSpecifier(specifier), specifier.type) {
          case "s": {
            var value = Math.max(Math.abs(range[0]), Math.abs(range[1]));
            if (specifier.precision == null) specifier.precision = precisionPrefix(range[2], value);
            return formatPrefix(specifier, value);
          }
          case "":
          case "e":
          case "g":
          case "p":
          case "r": {
            if (specifier.precision == null) specifier.precision = precisionRound(range[2], Math.max(Math.abs(range[0]), Math.abs(range[1]))) - (specifier.type === "e");
            break;
          }
          case "f":
          case "%": {
            if (specifier.precision == null) specifier.precision = precisionFixed(range[2]) - (specifier.type === "%") * 2;
            break;
          }
        }
      }
      return format(specifier);
    }

    function scale(x) {
      var k = 1;
      while (x * k % 1) k *= 10;
      return k;
    }

    function range(start, stop, step) {
      if ((n = arguments.length) < 3) {
        step = 1;
        if (n < 2) {
          stop = start;
          start = 0;
        }
      }

      var i = -1,
          n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
          k = scale(Math.abs(step)),
          range = new Array(n);

      start *= k;
      step *= k;
      while (++i < n) {
        range[i] = (start + i * step) / k;
      }

      return range;
    }

    function ticks(domain, count) {
      return range.apply(null, tickRange(domain, count));
    }

    function interpolateRound(a, b) {
      return a = +a, b -= a, function(t) {
        return Math.round(a + b * t);
      };
    }

    function uninterpolateNumber(a, b) {
      b = (b -= a = +a) || 1 / b;
      return function(x) {
        return (x - a) / b;
      };
    }

    function uninterpolateClamp(a, b) {
      b = (b -= a = +a) || 1 / b;
      return function(x) {
        return Math.max(0, Math.min(1, (x - a) / b));
      };
    }

    function bilinear(domain, range, uninterpolate, interpolate) {
      var u = uninterpolate(domain[0], domain[1]),
          i = interpolate(range[0], range[1]);
      return function(x) {
        return i(u(x));
      };
    }

    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function ascendingComparator(f) {
      return function(d, x) {
        return ascending(f(d), x);
      };
    }

    function bisector(compare) {
      if (compare.length === 1) compare = ascendingComparator(compare);
      return {
        left: function(a, x, lo, hi) {
          if (arguments.length < 3) lo = 0;
          if (arguments.length < 4) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) < 0) lo = mid + 1;
            else hi = mid;
          }
          return lo;
        },
        right: function(a, x, lo, hi) {
          if (arguments.length < 3) lo = 0;
          if (arguments.length < 4) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) > 0) hi = mid;
            else lo = mid + 1;
          }
          return lo;
        }
      };
    }

    var ascendingBisect = bisector(ascending);
    var bisectRight = ascendingBisect.right;

    var bisect = bisectRight;

    function polylinear(domain, range, uninterpolate, interpolate) {
      var k = Math.min(domain.length, range.length) - 1,
          u = new Array(k),
          i = new Array(k),
          j = -1;

      // Handle descending domains.
      if (domain[k] < domain[0]) {
        domain = domain.slice().reverse();
        range = range.slice().reverse();
      }

      while (++j < k) {
        u[j] = uninterpolate(domain[j], domain[j + 1]);
        i[j] = interpolate(range[j], range[j + 1]);
      }

      return function(x) {
        var j = bisect(domain, x, 1, k) - 1;
        return i[j](u[j](x));
      };
    }

    function newLinear(domain, range, interpolate, clamp) {
      var output,
          input;

      function rescale() {
        var linear = Math.min(domain.length, range.length) > 2 ? polylinear : bilinear,
            uninterpolate = clamp ? uninterpolateClamp : uninterpolateNumber;
        output = linear(domain, range, uninterpolate, interpolate);
        input = linear(range, domain, uninterpolate, interpolateNumber);
        return scale;
      }

      function scale(x) {
        return output(x);
      }

      scale.invert = function(y) {
        return input(y);
      };

      scale.domain = function(x) {
        if (!arguments.length) return domain.slice();
        domain = x.map(Number);
        return rescale();
      };

      scale.range = function(x) {
        if (!arguments.length) return range.slice();
        range = x.slice();
        return rescale();
      };

      scale.rangeRound = function(x) {
        return scale.range(x).interpolate(interpolateRound);
      };

      scale.clamp = function(x) {
        if (!arguments.length) return clamp;
        clamp = !!x;
        return rescale();
      };

      scale.interpolate = function(x) {
        if (!arguments.length) return interpolate;
        interpolate = x;
        return rescale();
      };

      scale.ticks = function(count) {
        return ticks(domain, count);
      };

      scale.tickFormat = function(count, specifier) {
        return tickFormat(domain, count, specifier);
      };

      scale.nice = function(count) {
        domain = nice(domain, tickRange(domain, count)[2]);
        return rescale();
      };

      scale.copy = function() {
        return newLinear(domain, range, interpolate, clamp);
      };

      return rescale();
    }

    function linear() {
      return newLinear([0, 1], [0, 1], interpolate, false);
    }

    function Hcl(h, c, l) {
      this.h = +h;
      this.c = +c;
      this.l = +l;
    }

    var ___prototype = Hcl.prototype = new Color;

    var Kn = 18;

    ___prototype.brighter = function(k) {
      return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k));
    };

    ___prototype.darker = function(k) {
      return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k));
    };

    function Lab(l, a, b) {
      this.l = +l;
      this.a = +a;
      this.b = +b;
    }

    var ____prototype = Lab.prototype = new Color;

    ____prototype.brighter = function(k) {
      return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b);
    };

    ____prototype.darker = function(k) {
      return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b);
    };

    function xyz2rgb(x) {
      return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
    }

    var t0 = 4 / 29;
    var t1 = 6 / 29;
    var t2 = 3 * t1 * t1;

    function lab2xyz(t) {
      return t > t1 ? t * t * t : t2 * (t - t0);
    }

    var Zn = 1.088830;

    var Xn = 0.950470;
    var Yn = 1;

    ____prototype.rgb = function() {
      var y = (this.l + 16) / 116,
          x = isNaN(this.a) ? y : y + this.a / 500,
          z = isNaN(this.b) ? y : y - this.b / 200;
      y = Yn * lab2xyz(y);
      x = Xn * lab2xyz(x);
      z = Zn * lab2xyz(z);
      return new Rgb(
        xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
        xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
        xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z)
      );
    };

    var t3 = t1 * t1 * t1;

    function xyz2lab(t) {
      return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
    }

    function rgb2xyz(x) {
      return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    }

    var deg2rad = Math.PI / 180;

    function lab(l, a, b) {
      if (arguments.length === 1) {
        if (l instanceof Lab) {
          b = l.b;
          a = l.a;
          l = l.l;
        } else if (l instanceof Hcl) {
          var h = l.h * deg2rad;
          b = Math.sin(h) * l.c;
          a = Math.cos(h) * l.c;
          l = l.l;
        } else {
          if (!(l instanceof Rgb)) l = rgb(l);
          var r = rgb2xyz(l.r),
              g = rgb2xyz(l.g),
              b = rgb2xyz(l.b),
              x = xyz2lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / Xn),
              y = xyz2lab((0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / Yn),
              z = xyz2lab((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / Zn);
          b = 200 * (y - z);
          a = 500 * (x - y);
          l = 116 * y - 16;
        }
      }
      return new Lab(l, a, b);
    }

    ___prototype.rgb = function() {
      return lab(this).rgb();
    };

    var rad2deg = 180 / Math.PI;

    function hcl(h, c, l) {
      if (arguments.length === 1) {
        if (h instanceof Hcl) {
          l = h.l;
          c = h.c;
          h = h.h;
        } else {
          if (!(h instanceof Lab)) h = lab(h);
          l = h.l;
          c = Math.sqrt(h.a * h.a + h.b * h.b);
          h = Math.atan2(h.b, h.a) * rad2deg;
          if (h < 0) h += 360;
        }
      }
      return new Hcl(h, c, l);
    }

    function Cubehelix(h, s, l) {
      this.h = +h;
      this.s = +s;
      this.l = +l;
    }

    var prototype = Cubehelix.prototype = new Color;

    prototype.brighter = function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Cubehelix(this.h, this.s, this.l * k);
    };

    prototype.darker = function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Cubehelix(this.h, this.s, this.l * k);
    };

    var E = +1.97294;

    var D = -0.90649;

    var C = -0.29227;

    var B = +1.78277;

    var A = -0.14861;

    var gamma = 1;

    prototype.rgb = function() {
      var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
          l = Math.pow(this.l, gamma),
          a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
          cosh = Math.cos(h),
          sinh = Math.sin(h);
      return new Rgb(
        255 * (l + a * (A * cosh + B * sinh)),
        255 * (l + a * (C * cosh + D * sinh)),
        255 * (l + a * (E * cosh))
      );
    };

    var EB = E * B;

    var ED = E * D;

    var BC_DA = B * C - D * A;

    function cubehelix(h, s, l) {
      if (arguments.length === 1) {
        if (h instanceof Cubehelix) {
          l = h.l;
          s = h.s;
          h = h.h;
        } else {
          if (!(h instanceof Rgb)) h = rgb(h);
          var r = h.r / 255, g = h.g / 255, b = h.b / 255;
          l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB);
          var bl = b - l, k = (E * (g - l) - C * bl) / D, lgamma = Math.pow(l, gamma);
          s = Math.sqrt(k * k + bl * bl) / (E * lgamma * (1 - lgamma)); // NaN if lgamma=0 or lgamma=1
          h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
          if (h < 0) h += 360;
        }
      }
      return new Cubehelix(h, s, l);
    }

    function interpolateCubehelixLong(a, b) {
      a = cubehelix(a);
      b = cubehelix(b);
      var ah = isNaN(a.h) ? b.h : a.h,
          as = isNaN(a.s) ? b.s : a.s,
          al = a.l,
          bh = isNaN(b.h) ? 0 : b.h - ah,
          bs = isNaN(b.s) ? 0 : b.s - as,
          bl = b.l - al;
      return function(t) {
        a.h = ah + bh * t;
        a.s = as + bs * t;
        a.l = al + bl * t;
        return a + "";
      };
    }

    function rainbow() {
      return linear()
          .interpolate(interpolateCubehelixLong)
          .domain([0, 0.5, 1.0])
          .range([cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8), cubehelix(260, 0.75, 0.35)]);
    }

    function index () {
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

    return index;

}));