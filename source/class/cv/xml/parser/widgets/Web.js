/* Web.js 
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
 *
 */
qx.Class.define('cv.xml.parser.widgets.Web', {
  extend: cv.xml.parser.AbstractBasicWidget,
  include: [
    cv.role.Update,
    cv.role.Refresh
  ],

  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {

    /**
     * Returns a mapping to map XML-Attributes to properties to help the parser to parse the config element.
     * @return {Map}
     */
    getAttributeToPropertyMappings: function () {
      return {
        address: {},
        width: {},
        height: {},
        frameborder: {
          transform: function (value) {
            return value === "true";
          }
        },
        background: {},
        src: {},
        scrolling: {}
      };
    },

    /**
     * Parsed the ga attribute if set
     * @param xml {Element} web XML-Element from config
     * @param path {String} path to the widget
     */
    afterParse: function (xml, path) {
      var data = cv.data.Model.getInstance().getWidgetData(path);
      var ga = xml.getAttribute("ga");
      if (ga) {
        cv.data.Model.getInstance().addAddress(ga);
        if (cv.Config.backend.substr(0, 2) == "oh") {
          data.address['_' + ga] = ['OH:switch', 'OFF'];
        } else {
          data.address['_' + ga] = ['DPT:1.001', 0];
        }
      }
    }
  },

  defer: function(statics) {
    // register the parser
    cv.xml.Parser.addHandler("web", statics);
    cv.xml.Parser.addHook("web", "after", statics.afterParse, statics);
  }
});

