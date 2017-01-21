/* MultiTrigger.js 
 * 
 * copyright (c) 2010-2016, Christian Mayer and the CometVisu contributers.
 * 
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 3 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA
 */


/**
 * TODO: complete docs
 * @module structure/pure/Multitrigger
 * @author Christian Mayer
 * @since 2012
 */
qx.Class.define('cv.structure.pure.MultiTrigger', {
  extend: cv.structure.pure.AbstractWidget,
  include: [cv.role.Operate, cv.role.Update, cv.role.HasAnimatedButton],

  /*
  ******************************************************
    CONSTRUCTOR
  ******************************************************
  */
  construct: function(props) {
    this.base(arguments, props);
    if (this.getMapping()) {
      cv.MessageBroker.getInstance().subscribe("setup.dom.finished", function () {
        var actor = this.getActor();
        var children = qx.dom.Hierarchy.getChildElements(actor);
        var value, element;

        for (var i=1; i<=4; i++) {
          value = this.defaultValueHandling(undefined, this['getButton'+i+'value']);
          element = children[i];
          qx.dom.Element.empty(element);
          this.defaultValue2DOM(value, function (e) {
            if (qx.lang.Type.isString(e) || qx.lang.Type.isNumber(e)) {
              qx.dom.Element.insertEnd(document.createTextNode(e), element);
            } else {
              qx.dom.Element.insertEnd(e, element);
            }
          });
        }
      }, this);
    }
  },

  /*
  ******************************************************
    PROPERTIES
  ******************************************************
  */
  properties: {
    showstatus: {
      check: "Boolean",
      init: false
    },
    button1label: {
      check: "String",
      nullable: true
    },
    button1value: {
      check: "String",
      nullable: true
    },
    button2label: {
      check: "String",
      nullable: true
    },
    button2value: {
      check: "String",
      nullable: true
    },
    button3label: {
      check: "String",
      nullable: true
    },
    button3value: {
      check: "String",
      nullable: true
    },
    button4label: {
      check: "String",
      nullable: true
    },
    button4value: {
      check: "String",
      nullable: true
    }
  },

  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {
    getAttributeToPropertyMappings: function () {
      return {
        showstatus: {
          transform: function (value) {
            return value === 'true';
          }
        },
        button1label: {},
        button1value: {},
        button2label: {},
        button2value: {},
        button3label: {},
        button3value: {},
        button4label: {},
        button4value: {}
      }
    },

    makeAddressListFn: function (src, transform, mode, variant) {
      return [true, variant];
    }
  },

  /*
  ******************************************************
    MEMBERS
  ******************************************************
  */
  members: {
    _getInnerDomString: function () {
      // create the actor
      var ret_val = '<div class="actor_container" style="float:left">';

      if (this.getButton1label()) {
        ret_val += '<div class="actor switchUnpressed">';
        ret_val += '<div class="value">' + this.getButton1label() + '</div>';
        ret_val += '</div>';
      }

      if (this.getButton2label()) {
        ret_val += '<div class="actor switchUnpressed">';
        ret_val += '<div class="value">' + this.getButton2label() + '</div>';
        ret_val += '</div>';
        ret_val += '<br/>';
      }

      if (this.getButton3label()) {
        ret_val += '<div class="actor switchUnpressed">';
        ret_val += '<div class="value">' + this.getButton3label() + '</div>';
        ret_val += '</div>';
      }

      if (this.getButton4label()) {
        ret_val += '<div class="actor switchUnpressed">';
        ret_val += '<div class="value">' + this.getButton4label() + '</div>';
        ret_val += '</div>';
        ret_val += '<br/>';
      }
      return ret_val + '</div>';
    },

    // overridden, only transform the value, do not apply it to DOM
    _processIncomingValue: function (address, data) {
      return this.applyTransform(address, data);
    },

    /**
     * Handles the incoming data from the backend for this widget
     *
     * @method handleUpdate
     * @param value {any} incoming data (already transformed + mapped)
     */
    handleUpdate: function (value) {
      var children = qx.bom.Selector.query('.actor_container .actor', this.getDomElement());
      children.forEach(function(actor) {
        var index = children.indexOf(actor)+1;
        var isPressed = value === this['getButton' + index + 'value']();
        qx.bom.element.Class.remove(actor, isPressed ? 'switchUnpressed' : 'switchPressed');
        qx.bom.element.Class.add(actor, isPressed ? 'switchPressed' : 'switchUnpressed');
      }, this);
    },

    /**
     * Get the value that should be send to backend after the action has been triggered
     *
     * @method getActionValue
     */
    getActionValue: function (event) {
      var index = qx.bom.Selector.query('.actor_container .actor', this.getDomElement()).indexOf(event.getCurrentTarget())+1;
      return this['getButton' + index + 'value']();
    },

    initListeners: function() {
      qx.bom.Selector.query('.actor_container .actor', this.getDomElement()).forEach(function(actor) {
        qx.event.Registration.addListener(actor, "tap", this.action, this);
      }, this);

    }
  },

  defer: function () {
    // register the parser
    cv.xml.Parser.addHandler("multitrigger", cv.structure.pure.MultiTrigger);
  }
});