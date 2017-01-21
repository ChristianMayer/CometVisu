/* NavBar.js 
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
 *
 * @module structure/pure/NavBar
 * @requires structure/pure
 * @author Christian Mayer
 * @since 2012
 */
qx.Class.define('cv.structure.pure.NavBar', {
  extend: cv.structure.pure.AbstractWidget,

  include: cv.role.HasChildren,
  
  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {

    createDefaultWidget: function (widgetType, $n, path, flavour, pageType) {

      var classes = "navbar clearfix";
      if ($n.attr('flavour')) {
        classes += " flavour_" + $n.attr('flavour');
      }// sub design choice

      // store scope globally
      var id = path.split("_");
      id.pop();
      var pos = $n.attr('position') || 'left';
      cv.data.Model.getInstance().setWidgetData(id.join('_') + '_' + pos + '_navbar', {
        'scope': $n.attr('scope') || -1
      });

      return cv.data.Model.getInstance().setWidgetData(cv.role.HasChildren.getStoragePath($n, path), {
        'path': path,
        'classes': classes,
        '$$type': widgetType
      });
    },

    getAttributeToPropertyMappings: function () {
      return {
        'scope': {"default": -1},
        'name': {},
        'dynamic': {
          transform: function (value) {
            return value === "true";
          }
        },
        'width': {"default": "300"},
        'position': {"default": 'left'}
      };
    }
  },

  /*
  ******************************************************
    PROPERTIES
  ******************************************************
  */
  properties: {
    name: {
      check: "String",
      nullable: true
    },
    scope: {
      check: "Number",
      init: -1
    },
    width: {
      check: "String",
      init: "300"
    },
    position: {
      check: ["top", "left", "right", "bottom"], 
      init: 'left'
    },
    dynamic: {
      check: "Boolean", 
      init: false
    }
  },
  
  /*
  ******************************************************
    MEMBERS
  ******************************************************
  */
  members: {
    isNotSubscribed: true,
    navbarTop: '',
    navbarLeft: '',
    navbarRight: '',
    navbarBottom: '',
    $navbarLeftSize: qx.bom.element.Dataset.get(qx.bom.Selector.query('#navbarLeft')[0], 'size'),
    $navbarRightSize: qx.bom.element.Dataset.get(qx.bom.Selector.query('#navbarRight')[0], 'size'),
    
    getGlobalPath: function () {
      var id = this.getPath().split("_");
      id.pop();
      return id.join('_') + '_' + this.getPosition() + '_navbar';
    },

    getDomString: function () {

      var container = '<div class="' + this.getClasses() + '" id="' + this.getGlobalPath() + '">';
      if (this.getName()) {
        container += '<h2>' + this.getName() + '</h2>';
      }
      container += this.getChildrenDomString();

      container += '</div>';

      var templateEngine = cv.TemplateEngine.getInstance();

      // add this to the navbars in DOM not inside the page
      switch (this.getPosition()) {
        case 'top':
          this.navbarTop += container;
          break;

        case 'left':
          this.navbarLeft += container;
          var thisSize = this.$navbarLeftSize || this.getWidth(); // FIXME - only a temporal solution
          if (this.isDynamic()) {
            templateEngine.pagePartsHandler.navbarSetSize('left', thisSize);
          }
          break;

        case 'right':
          this.navbarRight += container;
          var thisSize = this.$navbarRightSize || this.getWidth(); // FIXME - only a temporal solution
          if (this.isDynamic()) {
            templateEngine.pagePartsHandler.navbarSetSize('right', thisSize);
          }
          break;

        case 'bottom':
          this.navbarBottom += container;
          break;
      }
      templateEngine.pagePartsHandler.navbars[this.getPosition()].dynamic |= this.getDynamic();

      if (this.isNotSubscribed) {
        this.isNotSubscribed = false;
        cv.MessageBroker.getInstance().subscribe("setup.dom.finished", function () {
          if (this.navbarTop) $('#navbarTop').append(this.navbarTop);
          if (this.navbarLeft) $('#navbarLeft').append(this.navbarLeft);
          if (this.navbarRight) $('#navbarRight').append(this.navbarRight);
          if (this.navbarBottom) $('#navbarBottom').append(this.navbarBottom);
        }, this, 100);
      }

      return '';
    }
  },
  
  defer: function() {
    cv.xml.Parser.addHandler("navbar", cv.structure.pure.NavBar);
    cv.xml.Parser.addHook("navbar", "after", cv.role.HasChildren.parseChildren, cv.role.HasChildren);
  }
});