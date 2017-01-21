/* structure_plugin.js 
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
 * This plugins integrates zrssfeed to display RSS-Feeds via Google-API 
 * *and* a parser for local feeds using jQuery 1.5+ into CometVisu.
 * rssfeedlocal is derived from simplerss and zrssfeed
 * rssfeedlocal is mainly meant to be used with rsslog.php and plugins
 *
 * @example
 *   <rss src="/visu/plugins/rss/rsslog.php" refresh="300" link="false" title="false"></rss>
 *   <rss src="http://www.tagesschau.de/xml/rss2" refresh="300">Test API</rss>
 *   <rss src="/visu/plugins/rss/tagesschau-rss2.xml" refresh="300" header="true" date="true"></rss>
 *
 * @author Michael Markstaller
 * @since 2011
 */
qx.Class.define('cv.plugins.rss.Main', {
  extend: cv.structure.pure.AbstractWidget,
  include: [cv.role.Refresh],

  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {
    getAttributeToPropertyMappings: function() {
      return {
        'src': {},
        'width': { "default": "" },
        'height': { "default": "" },
        'limit': { "default": 10 },
        'header': { "default": true },
        'date': { "default": true },
        'content': { "default": true },
        'snippet': { "default": true },
        'showerror': { "default": true },
        'ssl': { "default": false },
        'linktarget': { "default": "_new" },
        'link': { "default": true },
        'title': { "default": true }
      }
    }
  },

  /*
  ******************************************************
    PROPERTIES
  ******************************************************
  */
  properties: {
    src: { check: "String", init: "" },
    'width': { init: "" },
    'height': { init: "" },
    'limit': { init: 10 },
    'header': { init: true },
    'date': { init: true },
    'content': { init: true },
    'snippet': { init: true },
    'showerror': { init: true },
    'ssl': { init: false },
    'linktarget': { init: "_new" },
    'link': { init: true },
    'title': { init: true }
  },

  /*
  ******************************************************
    MEMBERS
  ******************************************************
  */
  members: {
    _getInnerDomString: function () {
      var rssstyle = ''
      + this.getWidth() ? 'width:' + this.getWidth() : ''
        + this.getHeight() ? 'height:' + this.getHeight() : '';
      return '<div class="actor"><div class="rss_inline" id="rss_' + this.getPath() + '" style="' + rssstyle + '"></div>';
    },

    _onDomReady: function () {
      this.base(arguments);
      this.refreshRSS();
    },

    _setupRefreshAction: function() {
      this._timer = new qx.event.Timer(this.getRefresh());
      this._timer.addListener("interval", function () {
        this.refreshRSS();
      }, this);
      this._timer.start();
    },

    refreshRSS: function () {
      var data = cv.data.Model.getInstance().getWidgetData(this.getPath());
      $('#' + this.getPath() + ' .rss_inline').rssfeed(this.getSrc(), data);
    }
  },

  defer: function() {
    var loader = cv.util.ScriptLoader.getInstance();
    loader.addScripts('plugins/rss/dep/zrssfeed/jquery.zrssfeed.js');
    cv.xml.Parser.addHandler("rss", cv.plugins.rss.Main);
  }
});
