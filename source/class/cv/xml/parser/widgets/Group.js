/* Group.js 
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
 * Parse group config elements
 */
qx.Class.define('cv.xml.parser.widgets.Group', {
  extend: cv.xml.parser.AbstractBasicWidget,
  include: cv.role.HasChildren,

  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {
    afterParse: function (xml, path, flavour, pageType) {
      var data = cv.data.Model.getInstance().getWidgetData(cv.role.HasChildren.getStoragePath(xml, path));
      if (data.target) {
        data.classes += ' clickable';
        data.bindClickToWidget = true; // for groups with pagejumps this is mandatory
      }
      if (data.noWidget === true) {
        data.classes = data.classes.replace("widget ", "");
      }
    },
    getAttributeToPropertyMappings: function () {
      return {
        'nowidget': {
          target: 'noWidget', "default": false, transform: function (value) {
            return value === "true";
          }
        },
        'name': { "default": "" },
        'target': { "default": "" }
      };
    }
  },

  defer: function(statics) {
    cv.xml.Parser.addHandler("group", statics);
    cv.xml.Parser.addHook("group", "after", cv.role.HasChildren.parseChildren, cv.role.HasChildren);
    cv.xml.Parser.addHook("group", "after", statics.afterParse, statics);
  }
});