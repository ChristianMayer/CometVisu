/* Application.js 
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
 * This is the main application class of the CometVisu
 *
 *
 * @asset(config/*)
 * @asset(demo/*)
 * @asset(designs/*)
 * @asset(icon/*)
 * @asset(plugins/*)
 *
 * @require(qx.bom.Html,cv.ui.PopupHandler)
 */
qx.Class.define("cv.Application",
{
  extend : qx.application.Native,

  /*
   ******************************************************
   STATICS
   ******************************************************
   */
  statics: {
    HTML_STRUCT: '<div id="top" class="loading"><div class="nav_path">-</div></div><div id="navbarTop" class="loading"></div><div id="centerContainer"><div id="navbarLeft" class="loading page"></div><div id="main" style="position:relative; overflow: hidden;" class="loading"><div id="pages" class="clearfix" style="width:20000em; position:relative;clear:both;"><!-- all pages will be inserted here --></div></div><div id="navbarRight" class="loading page"></div></div><div id="navbarBottom" class="loading"></div><div id="bottom" class="loading"><hr /><div class="footer"></div></div><div id="message"></div>'
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    _blocker: null,

    /**
     * Toggle the {qx.bom.Blocker} visibility
     * @param val {Boolean}
     */
    block: function(val) {
      if (val) {
        if (!this._blocker) {
          this._blocker = new qx.bom.Blocker();
          this._blocker.setBlockerColor("#000000");
          this._blocker.setBlockerOpacity("0.2");
        }
        this._blocker.block();
      } else if (this._blocker){
        this._blocker.unblock();
      }
    },

    /**
     * This method contains the initial application code and gets called
     * during startup of the application
     */
    main : function() {
      if (qx.core.Environment.get("qx.aspects")) {
        qx.dev.Profile.stop();
        qx.dev.Profile.start();
      }
      // Call super class
      this.base(arguments);
      this.block(true);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug")) {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;
        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      /*
       -------------------------------------------------------------------------
       Below is your actual application code...
       -------------------------------------------------------------------------
       */
      // in debug mode load the uncompressed unobfuscated scripts
      qx.bom.Stylesheet.includeFile(qx.util.ResourceManager.getInstance().toUri('designs/designglobals.css'));

      this.__init();
    },

    /**
     * Internal initialization method
     * @private
     */
    __init: function() {
      var templateEngine = cv.TemplateEngine.getInstance();

      qx.event.Registration.addListener(window, 'resize', cv.layout.ResizeHandler.invalidateScreensize, cv.layout.ResizeHandler);
      qx.event.Registration.addListener(window, 'unload', function () {
        if (templateEngine.visu) {
          templateEngine.visu.stop();
        }
      }, this);
      qx.bom.Lifecycle.onReady(function () {
        var cache = false;
        var body = qx.bom.Selector.query("body")[0];
        if (cv.Config.enableCache && cv.ConfigCache.isCached()) {
          // load settings
          this.debug("using cache");
          cv.ConfigCache.restore();
        } else {
          // load empty HTML structure
          qx.dom.Element.empty(body);
          qx.bom.Html.clean([cv.Application.HTML_STRUCT], null, body);
        }
        this.loadConfig();
      }, this);
    },

    /**
     * Load a config file
     */
    loadConfig: function() {
      // get the data once the page was loaded
      var uri = qx.util.ResourceManager.getInstance().toUri('config/visu_config' + (cv.Config.configSuffix ? '_' + cv.Config.configSuffix : '') + '.xml');
      if (cv.Config.testMode) {
        // workaround for e2e-tests
        uri = 'resource/config/visu_config' + (cv.Config.configSuffix ? '_' + cv.Config.configSuffix : '') + '.xml';
      }
      this.debug("Requesting "+uri);
      var ajaxRequest = new qx.io.request.Xhr(uri);
      ajaxRequest.set({
        accept: "application/xml",
        cache: !cv.Config.forceReload
      });
      ajaxRequest.setUserData("noDemo", true);
      ajaxRequest.addListenerOnce("success", function (e) {
        this.block(false);
        var req = e.getTarget();
        // Response parsed according to the server's response content type
        var xml = req.getResponse();

        if (!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) {
          this.configError("parsererror");
        }
        else {
          // check the library version
          var xmlLibVersion = qx.bom.element.Attribute.get(qx.bom.Selector.query('pages', xml)[0], "lib_version");
          if (xmlLibVersion === undefined) {
            xmlLibVersion = -1;
          }
          if (cv.Config.libraryCheck && xmlLibVersion < cv.Config.libraryVersion) {
            this.configError("libraryerror");
          }
          else {
            if (req.getResponseHeader("X-CometVisu-Backend-LoginUrl")) {
              cv.Config.backendUrl = req.getResponseHeader("X-CometVisu-Backend-LoginUrl");
            }
            if (req.getResponseHeader("X-CometVisu-Backend-Name")) {
              cv.Config.backend = req.getResponseHeader("X-CometVisu-Backend-Name");
            }
            this.bootstrap(xml);
          }
        }
      }, this);

      ajaxRequest.addListener("statusError", function (e) {
        var status = e.getTarget().getTransport().status;
        if (!qx.util.Request.isSuccessful(status) && ajaxRequest.getUserData("noDemo")) {
          ajaxRequest.setUserData("noDemo", false);
          ajaxRequest.setUserData("origUrl", ajaxRequest.getUrl());
          ajaxRequest.setUrl(ajaxRequest.getUrl().replace('config/', 'demo/'));
          ajaxRequest.send();
        } else if (!qx.util.Request.isSuccessful(status)) {
          this.configError("filenotfound", [ajaxRequest.getUserData("origUrl"), ajaxRequest.getUrl()]);
        }
        else {
          this.configError(status, null);
        }
      }, this);

      ajaxRequest.send();

      // message discarding - but not for errors:
      var messageElement = qx.bom.Selector.query('#message')[0];
      qx.event.Registration.addListener(messageElement, 'tap', function () {
        if (!qx.bom.element.Class.has(messageElement, 'error'))
          this.innerHTML = '';
      }, messageElement);
    },

    /**
     * Initialize the content
     * @param xml {Document} XML configuration retrieved from backend
     */
    bootstrap: function(xml) {
      this.debug("bootstrapping");
      var cache = false;
      var engine = cv.TemplateEngine.getInstance();
      var loader = cv.util.ScriptLoader.getInstance();
      engine.xml = xml;
      loader.addListenerOnce("finished", function() {
        engine.setScriptsLoaded(true);
      }, this);
      if (cv.Config.enableCache && cv.ConfigCache.isCached()) {

        // check if cache is still valid
        if (!cv.ConfigCache.isValid(xml)) {
          this.debug("cache is invalid re-parse xml");
          // cache invalid
          cv.Config.cacheUsed = false;
          cv.ConfigCache.clear();

          // load empty HTML structure
          var body = qx.bom.Selector.query("body")[0];
          qx.dom.Element.empty(body);
          qx.bom.Html.clean([cv.Application.HTML_STRUCT], null, body);

          //empty model
          cv.data.Model.getInstance().resetWidgetDataModel();
          cv.data.Model.getInstance().resetAddressList();
        } else {
          // loaded cache is still valid
          cv.Config.cacheUsed = true;
          // cv.Config.lazyLoading = true;
          engine.initBackendClient();
          this.__detectInitialPage();

          engine.addListenerOnce("changeReady", function() {
            // create the objects
            cv.Config.TMP.treePath = cv.Config.initialPage;
            var data = cv.data.Model.getInstance().getWidgetData("id_");
            cv.structure.WidgetFactory.createInstance(data.$$type, data);
          }, this);
          this.loadStyles();
          this.loadPlugins();
          this.loadScripts();
          this.loadIcons();
        }
      }
      if (!cv.Config.cacheUsed) {
        this.debug("starting");
        this.__detectInitialPage();
        engine.parseXML(xml);
        this.loadStyles();
        this.loadPlugins();
        this.loadScripts();
        this.loadIcons();
        this.debug("done");

        if (cv.Config.enableCache) {
          // cache dom + data when everything is ready
          cv.MessageBroker.getInstance().subscribe("setup.dom.finished", function() {
            cv.ConfigCache.dump(xml);
          }, this);
        }
      }
    },

    loadIcons: function() {
      cv.Config.iconsFromConfig.forEach(function(icon) {
        cv.IconHandler.getInstance().insert(icon.name, icon.uri, icon.type, icon.flavour, icon.color, icon.styling, icon.dynamic);
      }, this);
    },

    loadStyles: function() {
      cv.util.ScriptLoader.getInstance().addStyles(cv.Config.configSettings.stylesToLoad);
    },

    loadScripts: function() {
      if (cv.Config.configSettings.scriptsToLoad.length > 0) {
        cv.util.ScriptLoader.getInstance().addScripts(cv.Config.configSettings.scriptsToLoad);
      }
    },

    loadPlugins: function() {
      var plugins = cv.Config.configSettings.pluginsToLoad;
      if (plugins.length > 0) {
        this.debug("loading plugins");
        qx.io.PartLoader.require(plugins, function() {
          this.debug("plugins loaded");
          qx.event.Timer.once(function() {
            cv.util.ScriptLoader.getInstance().setAllQueued(true);
            cv.TemplateEngine.getInstance().setPartsLoaded(true);
          }, this, 0);
        }, this);
      } else {
        this.debug("no plugins to load => all scripts queued");
        cv.util.ScriptLoader.getInstance().setAllQueued(true);
        cv.TemplateEngine.getInstance().setPartsLoaded(true);
      }
    },

    __detectInitialPage: function() {
      var startpage = 'id_';
      if (cv.Config.startpage) {
        startpage = cv.Config.startpage;
        if (typeof(Storage) !== 'undefined') {
          if ('remember' === startpage) {
            startpage = localStorage.getItem('lastpage');
            cv.Config.rememberLastPage = true;
            if ('string' !== typeof( startpage ) || 'id_' !== startpage.substr(0, 3))
              startpage = 'id_'; // fix obvious wrong data
          } else if ('noremember' === startpage) {
            localStorage.removeItem('lastpage');
            startpage = 'id_';
            cv.Config.rememberLastPage = false;
          }
        }
      } else {
        var req = qx.util.Uri.parseUri(window.location.href);
        if (req.anchor && req.anchor.substring(0, 3) === "id_") {
          startpage = req.anchor;
        }
      }
      cv.Config.initialPage = startpage;
    },

    /**
     * Handle errors that occur during loading ot the config file
     * @param textStatus {String} error status
     * @param additionalErrorInfo {String} error message
     */
    configError: function( textStatus, additionalErrorInfo ) {
      var configSuffix = (cv.Config.configSuffix ? cv.Config.configSuffix : '');
      var message = 'cv.Config.File Error!<br/>';
      switch (textStatus) {
        case 'parsererror':
          message += 'Invalid config file!<br/><a href="check_config.php?config=' + configSuffix + '">Please check!</a>';
          break;
        case 'libraryerror':
          var link = window.location.href;
          if (link.indexOf('?') <= 0) {
            link = link + '?';
          }
          link = link + '&libraryCheck=false';
          message += 'cv.Config.file has wrong library version!<br/>' +
            'This can cause problems with your configuration</br>' +
            '<p>You can run the <a href="./upgrade/index.php?config=' + configSuffix + '">cv.Config.ration Upgrader</a>.</br>' +
            'Or you can start without upgrading <a href="' + link + '">with possible configuration problems</a>.</p>';
          break;
        case 'filenotfound':
          message += '404: cv.Config.file not found. Neither as normal config (' +
            additionalErrorInfo[0] + ') nor as demo config (' +
            additionalErrorInfo[1] + ').';
          break;
        default:
          message += 'Unhandled error of type "' + textStatus + '"';
          if( additionalErrorInfo ) {
            message += ': ' + additionalErrorInfo;
          }
          else {
            message += '.';
          }
      }
      var messageElement = qx.bom.Selector.query('#message')[0];
      qx.bom.element.Class.add(messageElement, 'error');
      messageElement.innerHTML = message;
      this.error(message);
      this.block(false);
    }
  }
});
