/* InfoTrigger.js 
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
 * @module structure/pure/InfoTrigger
 * @author Christian Mayer
 * @since 2012
 */
qx.Class.define('cv.structure.pure.InfoTrigger', {
  extend: cv.structure.pure.AbstractWidget,
  include: [
    cv.role.Operate,
    cv.role.Update,
    cv.role.HasAnimatedButton,
    cv.role.HandleLongpress
  ],

  /*
  ******************************************************
    PROPERTIES
  ******************************************************
  */
  properties: {
    'downValue': {
      check: "String",
      init: "0"
    },
    'shortDownValue': {
      check: "String",
      init: "0"
    },
    'downLabel': {
      check: "String",
      nullable: true
    },
    'upValue': {
      check: "String",
      init: "0"
    },
    'shortUpValue': {
      check: "String",
      init: "0"
    },
    'upLabel': {
      check: "String",
      nullable: true
    },
    'isAbsolute': {
      check: "Boolean",
      init: false
    },
    'min': {
      check: "Number",
      init: 0
    },
    'max': {
      check: "Number",
      init: 255
    },
    'infoPosition': {
      check: ["left", "middle", "right"],
      init: 'middle'
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
        'downvalue': {target: 'downValue', "default": "0"},
        'shortdownvalue': {target: 'shortDownValue', "default": "0"},
        'downlabel': {target: 'downLabel'},
        'upvalue': {target: 'upValue', "default": "0"},
        'shortupvalue': {target: 'shortUpValue', "default": "0"},
        'uplabel': {target: 'upLabel'},
        'shorttime': {target: 'shortThreshold', transform: parseFloat, "default": -1},
        'change': {
          target: 'isAbsolute', transform: function (value) {
            return (value || 'relative') === "absolute";
          }
        },
        'min': {transform: parseFloat, "default": 0},
        'max': {transform: parseFloat, "default": 255},
        'infoposition': {target: 'infoPosition', "default": 'left'}
      };
    },

    makeAddressListFn: function (src, transform, mode, variant) {
      // Bit 0 = short, Bit 1 = button => 1|2 = 3 = short + button
      return [true, variant == 'short' ? 1 : (variant == 'button' ? 2 : 1 | 2)];
    }
  },

  /*
  ******************************************************
    MEMBERS
  ******************************************************
  */
  members: {
    _getInnerDomString: function () {
      // create buttons + info
      var ret_val = '<div style="float:left;">';

      var actordown = '<div class="actor switchUnpressed downlabel" ';
      if (this.getAlign())
        actordown += 'style="text-align: ' + this.getAlign() + '" ';
      actordown += '>';
      actordown += '<div class="label">' + (this.getDownLabel() || '-') + '</div>';
      actordown += '</div>';

      var actorup = '<div class="actor switchUnpressed uplabel" ';
      if (this.getAlign())
        actorup += 'style="text-align: ' + this.getAlign() + '" ';
      actorup += '>';
      actorup += '<div class="label">' + (this.getUpLabel() || '+') + '</div>';
      actorup += '</div>';

      var actorinfo = '<div class="actor switchInvisible" ';
      if (this.getAlign())
        actorinfo += 'style="text-align: ' + this.getAlign() + '" ';
      actorinfo += '><div class="value">-</div></div>';

      switch (this.getInfoPosition()) {
        case 'middle':
          ret_val += actordown;
          ret_val += actorinfo;
          ret_val += actorup;
          break;
        case 'right':
          ret_val += actordown;
          ret_val += actorup;
          ret_val += actorinfo;
          break;
        default:
          ret_val += actorinfo;
          ret_val += actordown;
          ret_val += actorup;
          break;
      }

      return ret_val + '</div>';
    },

    _onDomReady: function() {
      this.base(arguments);
      this.addListener("longtap", this._onLongTap, this);
    },

    _onLongTap: function(event) {
      this.__action(false, qx.bom.element.Class.has(event.getCurrentTarget(), 'downlabel'));
    },

    _action: function(event) {
      this.__action(true, qx.bom.element.Class.has(event.getCurrentTarget(), 'downlabel'));
    },

    __action: function (isShort, isDown) {
      var value;
      if (isShort) {
        value = isDown ? this.getShortDownValue() : this.getShortUpValue();
      } else {
        value = isDown ? this.getDownValue() : this.getUpValue();
      }

      var bitMask = (isShort ? 1 : 2);

      if (this.getIsAbsolute()) {
        value = parseFloat(this.getBasicValue());
        if (isNaN(value))
          value = 0; // anything is better than NaN...
        value = value + parseFloat(value);
        value = Math.max(value, this.getMin());
        value = Math.min(value, this.getMax());
      }
      this.sendToBackend(value, function(address) {
        return !!(address[2] & bitMask);
      });
    }
  },

  defer: function () {
    // register the parser
    cv.xml.Parser.addHandler("infotrigger", cv.structure.pure.InfoTrigger);
  }
});