/* Clock.js 
 * 
 * copyright (c) 2010-2017, Christian Mayer and the CometVisu contributers.
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
 * @asset(plugins/clock/*)
 */
qx.Class.define('cv.plugins.DiagramDerivate', {
  extend: cv.plugins.diagram.AbstractDiagram,
  include: [cv.ui.common.Update],
  /*
  ***********************************************
    CONSTRUCTOR
  ***********************************************
  */
  construct: function (props) {
    props.value = new Date();
    this.base(arguments, props);
  },

  /*
  ******************************************************
  PROPERTIES
  ******************************************************
  */
  properties: {
    src: {
      check: 'String'
    }
  },

  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {
    /**
     * Parses the widgets XML configuration and extracts the given information
     * to a simple key/value map.
     *
     * @param xml {Element} XML-Element
     * @param path {String} internal path of the widget
     * @param flavour {String} Flavour of the widget
     * @param pageType {String} Page type (2d, 3d, ...)
     * @return {Map} extracted data from config element as key/value map
     */
    parse: function (xml, path, flavour, pageType) {
      var data = cv.parser.WidgetParser.parseElement(this, xml, path, flavour, pageType, this.getAttributeToPropertyMappings());
      cv.parser.WidgetParser.parseFormat(xml, path);
      cv.parser.WidgetParser.parseAddress(xml, path);
      return data;
    },

    getAttributeToPropertyMappings: function () {
      let transformValueTrue = function(value) {
        return value === 'true';
      };

      return {
        'src': {
          'default': 'plugins/clock/clock_pure.svg'
        }
      };
    }
  },

  /*
  ******************************************************
    MEMBERS
  ******************************************************
  */
  members: {
    __inDrag: 0,       // is the handle currently dragged?

    _getInnerDomString: function () {
      return '<div class="actor" style="width:100%;height:100%">DiagDeriv</div>';
    },

    _onDomReady: function () {
    },

    // overridden
    initListeners: function () {},

    // overridden
    _update: function (address, data, isDataAlreadyHandled) {
      let value = isDataAlreadyHandled ? data : this.defaultValueHandling(address, data);
      let time = value.split(':');
      this._updateHands( time[0], time[1], time[2] );
    },

    handleEvent: function (event) {
    },

    dragHelper: function (event) {
    },

    dragAction: function () {
    },

    _updateHands: function ( hour, minute, second ) {
    }
  },

  defer: function(statics) {
    cv.parser.WidgetParser.addHandler("diagramderivate", cv.plugins.DiagramDerivate);
    cv.ui.structure.WidgetFactory.registerClass("diagramderivate", statics);
  }
});