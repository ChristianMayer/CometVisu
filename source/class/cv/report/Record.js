/* Transform.js 
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
 * Recording tool for user interactions on existing configs. Used for bug reproduction.

 * @author Tobias Bräutigam
 * @since 0.11.0 (2017)
 */
qx.Class.define('cv.report.Record', {
  extend: qx.core.Object,
  type: "singleton",

  /*
  ******************************************************
    CONSTRUCTOR
  ******************************************************
  */
  construct: function() {
    this.__log = [];
    this.__listeners = {};
    this.__start = Date.now();
    this.__xhr = { response: [], request:[] };
    this.__data = {};
  },

  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {
    CONFIG: "config",
    BACKEND: "backend",
    USER: "user",
    CACHE: "cache",
    XHR: "xhr",
    SCREEN: "screen",
    RUNTIME: "runtime",
    REPLAYING: false,
    data: null,

    prepare: function() {
      if (cv.Config.reporting === true && !cv.report.Record.REPLAYING) {
        // patch XHR
        qx.Class.patch(qx.io.request.Xhr, cv.report.utils.MXhrHook);

        // add resize listener
        qx.event.Registration.addListener(window, "resize", function() {
          this.record(this.SCREEN, "resize", {
            w: qx.bom.Viewport.getWidth(),
            h: qx.bom.Viewport.getHeight()
          });
        }, this);

        // save browser settings
        var runtime = {
          browserName: qx.bom.client.Browser.getName(),
          browserVersion: qx.bom.client.Browser.getVersion(),
          deviceName: qx.bom.client.Device.getName(),
          deviceType: qx.bom.client.Device.getType(),
          pixelRatio: qx.bom.client.Device.getDevicePixelRatio(),
          touch: qx.bom.client.Device.getTouch(),
          locale: qx.bom.client.Locale.getLocale(),
          cv: {},
          width: qx.bom.Viewport.getWidth(),
          height: qx.bom.Viewport.getHeight()
        };

        // save CometVisu build information
        Object.getOwnPropertyNames(cv.Version).forEach(function(name) {
          if (/^[A-Z]+$/.test(name)) {
            runtime.cv[name] = cv.Version[name];
          }
        });

        this.record(this.RUNTIME, "config", runtime);
      }
    },

    register: function(target, path, events) {
      if (cv.Config.reporting === true && !cv.report.Record.REPLAYING) {
        cv.report.Record.getInstance().register(target, path, events);
      }
    },

    record: function(category, path, data) {
      if (cv.Config.reporting === true && !cv.report.Record.REPLAYING) {
        cv.report.Record.getInstance().record(category, path, data);
      }
    },

    /**
     * Save cache in
     */
    logCache: function() {
      if (cv.Config.reporting === true && !cv.report.Record.REPLAYING) {
        cv.report.Record.record(cv.report.Record.CACHE, cv.Config.configSuffix, {
          data: cv.ConfigCache.getData(),
          body: cv.ConfigCache.getBody()
        });
      }
    },

    normalizeUrl: function(url) {
      if (url.indexOf("nocache=") >= 0) {
        url = url.replace(/[\?|&]nocache=[0-9]+/, "");
      }
      if (url.indexOf("ts=") >= 0) {
        url = url.replace(/[\?|&]ts=[0-9]+/, "");
      }
      return url;
    }
  },

  /*
  ******************************************************
    MEMBERS
  ******************************************************
  */
  members: {
    __start: null,
    __log: null,
    __xhr: null,
    __listeners: null,
    __data: null,

    register: function(target, path, events) {
      var lid;
      var Reg = qx.event.Registration;

      events.forEach(function(event) {
        lid = Reg.addListener(target, event, qx.lang.Function.curry(this._onEvent, path), this);
      }, this);
    },

    _onEvent: function(path, ev) {
      this.record(cv.report.Record.USER, path, ev.getType());
    },

    record: function(category, path, data) {
      switch (category) {

        case cv.report.Record.XHR:
          data.t = Date.now();
          this.__xhr[path].push(data);
          break;

        case cv.report.Record.CACHE:
        case cv.report.Record.RUNTIME:
          this.__data[category] = data;
          break;

        default:
          this.__log.push({
            c: category,
            t: Date.now(),
            i: path,
            d: data
          });
      }
    },

    /**
     * Download Log as file
     */
    download: function() {

      var data = {
        data: this.__data,
        start: this.__start,
        xhr: this.__xhr,
        log: this.__log,
        configSuffix: cv.Config.configSuffix,
        end: Date.now()
      };

      var d = new Date();

      var a = window.document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([qx.lang.Json.stringify(data)], {type: 'application/json'}));
      a.download = 'CometVisu-replay-'+d.toISOString()+'.json';

      // Append anchor to body.
      document.body.appendChild(a);
      a.click();

      // Remove anchor from body
      document.body.removeChild(a);
    }
  }
});