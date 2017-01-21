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
 * A group can be used to group a couple of widgets and optionally surround them with a border or name the group.
 *
 * @widget_example <settings selector=".widget_container[data-type=group]">
 *  <screenshot name="group_with_border">
 *    <caption>Group with border and name</caption>
 *    <data address="0/0/0">1</data>
 *    <data address="0/0/1">21</data>
 *  </screenshot>
 *  </settings>
 *  <group name="Example Group">
 *    <layout colspan="6" />
 *    <text><label>Some Text</label></text>
 *    <switch>
 *      <layout colspan="3" />
 *      <label>Switch</label>
 *      <address transform="DPT:1.001" mode="readwrite">0/0/0</address>
 *    </switch>
 *    <info format="%.1f °C">
 *      <layout colspan="3" />
 *      <label>Temperature</label>
 *      <address transform="DPT:9.001">0/0/1</address>
 *    </info>
 *  </group>
 *
 * @widget_example <settings selector=".widget_container[data-type=group]">
 *  <screenshot name="group_without_border">
 *    <caption>Hidden Group: no border no name</caption>
 *    <data address="0/0/0">1</data>
 *    <data address="0/0/1">21</data>
 *  </screenshot>
 *  </settings>
 *  <group nowidget="true">
 *    <layout colspan="6" />
 *    <text><label>Some Text</label></text>
 *    <switch>
 *      <layout colspan="3" />
 *      <label>Switch</label>
 *      <address transform="DPT:1.001" mode="readwrite">0/0/0</address>
 *    </switch>
 *    <info format="%.1f °C">
 *      <layout colspan="3" />
 *      <label>Temperature</label>
 *      <address transform="DPT:9.001">0/0/1</address>
 *    </info>
 *  </group>
 *
 * @module structure/pure/Group
 * @requires structure/pure
 * @author Christian Mayer
 * @since 0.8.0 (2012)
 */
qx.Class.define('cv.structure.pure.Group', {
  extend: cv.structure.pure.AbstractWidget,

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


  /*
  ******************************************************
    PROPERTIES
  ******************************************************
  */
  properties: {
    noWidget: {
      check: "Boolean",
      init: false
    },
    name: {
      check: "String",
      init: ""
    },
    target: {
      check: "String",
      nullable: true
    }
  },

  /*
  ******************************************************
    MEMBERS
  ******************************************************
  */
  members: {

    /**
     * Action performed when the group got clicked. If a target is specified in the group attributes
     * the action will switch to the page defined by the target.
     *
     * @method action
     * @param  event {Event}
     */
    action: function (event) {
      if (this.getTarget() != 0) {
        cv.TemplateEngine.getInstance().scrollToPage(this.getTarget());
        if (event.getBubbles()) {
          event.stopPropagation();
        }
      }
    },

    _onDomReady: function() {
      this.base(arguments);
      qx.bom.element.Style.set(this.getDomElement(), "z-index", 1);
    },

    getDomString: function () {
      // heading style
      var hstyle = '';
      if (this.getAlign()) {
        hstyle += 'style="text-align:' + this.getAlign() + '"';
      }

      var container = '<div class="clearfix">';
      if (this.getName()) {
        container += '<h2 ' + hstyle + '>' + this.getName() + '</h2>';
      }

      container += this.getChildrenDomString();
      container += '</div>';

      return '<div class="' + this.getClasses() + '">' + container + '</div>';
    }
  },

  defer: function() {
    cv.xml.Parser.addHandler("group", cv.structure.pure.Group);
    cv.xml.Parser.addHook("group", "after", cv.role.HasChildren.parseChildren, cv.role.HasChildren);
    cv.xml.Parser.addHook("group", "after", cv.structure.pure.Group.afterParse, cv.structure.pure.Group);
  }
});