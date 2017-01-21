/* UrlTrigger.js 
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
 *
 *
 * @author Christian Mayer
 * @since 2012
 */
qx.Class.define('cv.structure.pure.UrlTrigger', {
  extend: cv.structure.AbstractWidget,
  include: [
    cv.role.Operate,
    cv.role.HasAnimatedButton,
    cv.role.BasicUpdate
  ],

  /*
  ******************************************************
    PROPERTIES
  ******************************************************
  */
  properties: {
    sendValue: { check: "String", init: "0" },
    params: { check: "String", init: '' },
    url: { check: "String", nullable: true }
  },

  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {
    getAttributeToPropertyMappings: function () {
      return {
        'value' : { target: 'sendValue', "default": "0" },
        'params'  : { "default": '' },
        'url': { }
      };
    },
    getDefaultClasses: function(type) {
      // additional trigger class
      return 'widget clearfix trigger '+type.toLowerCase();
    }
  },

  /*
  ******************************************************
    MEMBERS
  ******************************************************
  */
  members: {

    _onDomReady: function() {
      this.base(arguments);
      this.defaultUpdate(undefined, this.getSendValue(), this.getDomElement());
    },

    _getInnerDomString: function () {
      var actor = '<div class="actor switchUnpressed ';
      if ( this.getAlign() )
        actor += this.getAlign();
      actor += '"><div class="value"></div></div>';
      return actor;
    },

    _action: function() {
      var xhr = new qx.io.request.Xhr(qx.util.ResourceManager.getInstance().toUri(this.getUrl()));
      xhr.set({
        method: "GET",
        accept: "application/html",
        requestData: this.getParams()
      });
      xhr.send();
    }
  },

  defer: function() {
    // register the parser
    cv.xml.Parser.addHandler("urltrigger", cv.structure.pure.UrlTrigger);
  }
}); // end define
