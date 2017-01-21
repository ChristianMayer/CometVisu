/**
 *
 * @asset(cv/config/*.xml)
 * @asset(cv/demo/*.xml)
 * @asset(cv/designs/*)
 */
qx.Class.define('cv.TemplateEngine', {
  extend: cv.Object,
  type: "singleton",
  
  construct: function() {
    // this.base(arguments);
    cv.Config.eventHandler = new cv.event.Handler(this);
    this.pagePartsHandler = new cv.PagePartsHandler();
  
    this.rememberLastPage = false;
    this.currentPage = null;
  
  
    // if true the whole widget reacts on click events
    // if false only the actor in the widget reacts on click events
    this.bindClickToWidget = false;
  
    this.widgetData = {}; // hash to store all widget specific data
    /**
     * Structure where a design can set a default value that a widget or plugin
     * can use.
     * This is especially important for design relevant information like colors
     * that can not be set though CSS.
     *
     * Useage: this.defaults.plugin.foo = {bar: 'baz'};
     */
    this.defaults = {widget: {}, plugin: {}};
    /**
     * Function to test if the path is in a valid form.
     * Note: it doesn't check if it exists!
     */
    this.pathRegEx = /^id(_[0-9]+)+$/;
  
    this.callbacks = {}; // Hash of functions to call during page change
    this.main_scroll = null;
    this.old_scroll = '';
    this.visu = null;
  
    this.pluginsToLoadCount = 0;
    this.xml = null;
  },
  
  properties: {
    // store the mappings
    mappings: {
      check: "Object",
      init: {}
    },
    
    // store the stylings
    stylings: {
      check: "Object",
      init: {}
    },

    ready: {
      check: "Boolean",
      init: false,
      apply: "_applyReady"
    }
  },
  
  /*
  ******************************************************
    MEMBERS
  ******************************************************
  */
  members: {

    // property apply
    _applyReady: function(value) {
      if (value === true) {
        this.setupPage();
      }
    },

    /**
     * @deprecated {0.10.0} Please use {cv.data.Model.getInstance().setWidgetData()}
     */
    widgetDataInsert: function (path, obj) {
      this.warn("widgetDataInsert is deprecated! Please use cv.data.Model.getInstance().setWidgetData() instead");
      return cv.data.Model.getInstance().setWidgetData(path, obj);
    },

    /**
     * @deprecated {0.10.0} Please use {cv.data.Model.getInstance().getWidgetData()}
     */
    widgetDataGet: function (path) {
      this.warn("widgetDataGet is deprecated! Please use cv.data.Model.getInstance().getWidgetData() instead");
      return cv.data.Model.getInstance().getWidgetData(path);
    },

    /**
     * @deprecated {0.10.0} Please use {cv.data.Model.getInstance().addAddress()} instead
     */
    addAddress: function (address, id) {
      this.warn("addAddress is deprecated! Please use cv.data.Model.getInstance().addAddress() instead");
      cv.data.Model.getInstance().addAddress(address, id);
    },

    /**
     * @deprecated {0.10.0} Please use {cv.data.Model.getInstance().getAddresses()} instead
     */
    getAddresses: function () {
      this.warn("getAddresses is deprecated! Please use cv.data.Model.getInstance().getAddresses() instead");
      return cv.data.Model.getInstance().getAddresses();
    },

    update: function (json) {
      for (var key in json) {
        //$.event.trigger('_' + key, json[key]);
        if (!(key in this.getAddressList()))
          continue;

        var data = json[key];
        this.getAddressList()[key].forEach(function (id) {
          if (typeof id === 'string') {
            var element = document.getElementById(id);
            var type = element.dataset.type || 'page'; // only pages have no datatype set
            var widget = cv.structure.WidgetFactory.getInstanceById(id);
            if (widget.update) {
              widget.update(key, data);
            }
            //console.log( element, type, updateFn );
          } else if (typeof id === 'function') {
            id.call(key, data);
          }
        });
      }
    },

    initBackendClient: function () {
      if (cv.Config.testMode) {
        this.visu = new cv.io.Mockup();
      }
      else if (cv.Config.backend == "oh") {
        this.visu = new cv.io.Client({
          backendName: 'openhab',
          backendUrl: cv.Config.backendUrl
        });
      }
      else if (cv.Config.backend == "oh2") {
        this.visu = new cv.io.Client({
          backendName: 'openhab2',
          backendUrl: cv.Config.backendUrl
        });
      } else {
        this.visu = new cv.io.Client({
          backendName: cv.Config.backend,
          backendUrl: cv.Config.backendUrl
        });
      }

      this.visu.update = function (json) { // overload the handler
        this.update(json);
        this.visu.update = this.update.bind(this); // handle future requests directly
      }.bind(this);
      this.user = 'demo_user'; // example for setting a user
    },

    bindActionForLoadingFinished: function (fn) {
      $("#pages").bind("done", fn);
    },

    fireLoadingFinishedAction: function () {
      $("#pages").triggerHandler("done");
    },

    resetPageValues: function () {
      this.currentPage = null;
      cv.layout.Manager.currentPageUnavailableWidth = -1;
      cv.layout.Manager.currentPageUnavailableHeight = -1;
      cv.layout.Manager.currentPageNavbarVisibility = null;
    },

    parseXML: function (loaded_xml) {
      this.xml = loaded_xml;
      /*
       * First, we try to get a design by url. Secondly, we try to get a predefined
       */
      // read predefined design in config
      var pagesNode = qx.bom.Selector.query("pages", this.xml)[0];


      if (qx.bom.element.Attribute.get(pagesNode, "backend") !== null) {
        cv.Config.backend = qx.bom.element.Attribute.get(pagesNode, "backend");
      }
      this.initBackendClient();

      if (!qx.bom.element.Attribute.get(pagesNode, 'scroll_speed') !== null) {
        cv.Config.scrollSpeed = 400;
      } else {
        cv.Config.scrollSpeed = qx.bom.element.Attribute.get(pagesNode, 'scroll_speed') | 0;
      }

      if (qx.bom.element.Attribute.get(pagesNode, 'bind_click_to_widget') !== null) {
        cv.Config.bindClickToWidget = qx.bom.element.Attribute.get(pagesNode, 'bind_click_to_widget') == "true" ? true : false;
      }
      if (qx.bom.element.Attribute.get(pagesNode, 'default_columns') !== null) {
        cv.Config.defaultColumns = qx.bom.element.Attribute.get(pagesNode, 'default_columns');
      }
      if (qx.bom.element.Attribute.get(pagesNode, 'min_column_width') !== null) {
        cv.Config.minColumnWidth = qx.bom.element.Attribute.get(pagesNode, 'min_column_width');
      }
      this.screensave_time = qx.bom.element.Attribute.get(pagesNode, 'screensave_time');
      this.screensave_page = qx.bom.element.Attribute.get(pagesNode, 'screensave_page');

      var predefinedDesign = qx.bom.element.Attribute.get(pagesNode, "design");
      // design by url
      // design by config file
      if (!cv.Config.clientDesign) {
        if (predefinedDesign) {
          cv.Config.clientDesign = predefinedDesign;
        }
        // selection dialog
        else {
          this.selectDesign();
        }
      }
      if (qx.bom.element.Attribute.get(pagesNode, 'max_mobile_screen_width') !== null)
        cv.Config.maxMobileScreenWidth = qx.bom.element.Attribute.get(pagesNode, 'max_mobile_screen_width');

      var scriptsToLoad = [];
      if (cv.Config.clientDesign) {
        var baseUri = 'cv/designs/' + cv.Config.clientDesign;
        qx.bom.Stylesheet.includeFile(qx.util.ResourceManager.getInstance().toUri(baseUri + '/basic.css'));
        if (!cv.Config.forceNonMobile) {
          qx.bom.Stylesheet.includeFile(qx.util.ResourceManager.getInstance().toUri(baseUri + '/mobile.css'));
        }
        qx.bom.Stylesheet.includeFile(qx.util.ResourceManager.getInstance().toUri(baseUri + '/custom.css'));
        scriptsToLoad.push('cv/designs/' + cv.Config.clientDesign + '/design_setup.js');
      }

      var metaParser = new cv.xml.parser.Meta();

      // start with the plugins
      qx.lang.Array.append(scriptsToLoad, metaParser.parsePlugins(this.xml));

      // and then the rest
      metaParser.parse(this.xml);

      if (scriptsToLoad.length > 0) {
        var dynloader = new cv.util.DynamicScriptLoader(scriptsToLoad);
        dynloader.addListener("ready", function() {
          this.setReady(true);
        }, this);
        dynloader.start();
      } else {
        this.setReady(true);
      }
    },

    setupPage: function () {
      // and now setup the pages

      // login to backend as it might change some settings needed for further processing
      this.visu.login(true, function () {

        // as we are sure that the default CSS were loaded now:
        qx.bom.Selector.query('link[href*="mobile.css"]').forEach(function (elem) {
          qx.bom.element.Attribute.set(elem, 'media', 'only screen and (max-width: ' + cv.Config.maxMobileScreenWidth + 'px)');
        });

        var page = qx.bom.Selector.query('pages > page', this.xml)[0]; // only one page element allowed...

        this.createPages(page, 'id');
        cv.structure.pure.Page.createFinal();

        cv.MessageBroker.getInstance().publish("setup.dom.finished");

        var startpage = 'id_';
        if (cv.Config.startpage) {
          startpage = cv.Config.startpage;
          if (typeof(Storage) !== 'undefined') {
            if ('remember' === startpage) {
              startpage = localStorage.getItem('lastpage');
              this.rememberLastPage = true;
              if ('string' !== typeof( startpage ) || 'id_' !== startpage.substr(0, 3))
                startpage = 'id_'; // fix obvious wrong data
            } else if ('noremember' === startpage) {
              localStorage.removeItem('lastpage');
              startpage = 'id_';
              this.rememberLastPage = false;
            }
          }
        }
        this.currentPage = qx.bom.Selector.query('#' + startpage)[0];

        cv.layout.Manager.adjustColumns();
        cv.layout.Manager.applyColumnWidths();

        this.main_scroll = new cv.PageHandler();
        if (this.scrollSpeed != undefined) {
          this.main_scroll.setSpeed(this.scrollSpeed);
        }

        this.scrollToPage(startpage, 0);

        /* CM, 9.4.16:
         * TODO: Is this really needed?
         * I can't find any source for setting .fast - and when it's set, it's
         * most likely not working as scrollToPage should have been used instead
         * anyway...
         *
         $('.fast').bind('click', function() {
         this.main_scroll.seekTo($(this).text());
         });
         */

        // reaction on browser back button
        qx.bom.History.getInstance().addListener("request", function(e) {
          var lastPage = e.getData();
          if (lastPage) {
            this.scrollToPage(lastPage, 0, true);
          }
        }, this);

        // run the Trick-O-Matic scripts for great SVG backdrops
        qx.bom.Selector.query('embed').forEach(function () {
          this.onload = Trick_O_Matic
        });

        if (cv.Config.enableAddressQueue) {
          // identify addresses on startpage
          var startPageAddresses = {};
          qx.bom.Selector.query('.actor', this.currentPage).forEach(function (elem) {
            var data = qx.bom.element.Dataset.getAll(elem);
            if (undefined === data.address) data = qx.bom.element.Dataset.getAll(elem.parentElement);
            for (var addr in data.address) {
              startPageAddresses[addr.substring(1)] = 1;
            }
          });
          this.visu.setInitialAddresses(Object.keys(startPageAddresses));
        }
        var addressesToSubscribe = cv.data.Model.getInstance().getAddresses();
        if (0 !== addressesToSubscribe.length)
          this.visu.subscribe(addressesToSubscribe);

        this.xml = null; // not needed anymore - free the space

        qx.bom.Selector.query('.icon').forEach(function (icon) {
          cv.util.IconTools.fillRecoloredIcon(icon);
        }, this);
        qx.bom.element.Class.remove(qx.bom.Selector.query('.loading')[0], 'loading');
        this.fireLoadingFinishedAction();
        if (qx.lang.Type.isNumber(this.screensave_time)) {
          this.screensave = new qx.event.Timer(this.screensave_time * 1000);
          this.screensave.addListener("interval", function () {
            this.scrollToPage();
          }, this);
          this.screensave.start();
          qx.event.Registration.addListener(document, "pointerdown", this.screensave.restart, this.screensave);
        }
      }, this);
    },

    createPages: function (page, path, flavour, type) {

      var parsedData = cv.xml.Parser.parse(page, path, flavour, type);
      if (!Array.isArray(parsedData)) {
        parsedData = [parsedData];
      }

      for (var i = 0, l = parsedData.length; i < l; i++) {
        var data = parsedData[i];
        var widget = cv.structure.WidgetFactory.createInstance(data.$$type, data);

        var retval = widget ? widget.getDomString() : undefined;

        if (undefined === retval)
          return;

        if ('string' === typeof retval) {
          return '<div class="widget_container '
            + (data.rowspanClass ? data.rowspanClass : '')
            + (data.containerClass ? data.containerClass : '')
            + ('break' === data.$$type ? 'break_container' : '') // special case for break widget
            + '" id="' + path + '" data-type="' + data.$$type + '">' + retval + '</div>';
        } else {
          return qx.dom.Element.create('div', {
            'class': 'widget_container ' + (data.rowspanClass ? data.rowspanClass : '')+ (data.containerClass ? data.containerClass : ''),
            id: path,
            "data-type": data.$$type}).appendChild(retval);
        }
      }
    },

    /**
     * Little helper to find the relevant page path for a given widget.
     *
     * @param element {Element} The this.xml element
     * @param widgetpath {String} The path / ID of the widget
     * @return {String} The path of the parent
     */
    getPageIdForWidgetId: function (element, widgetpath) {
      var
        parent = element.parentNode,
        parentpath = widgetpath.replace(/[0-9]*$/, '');

      while (parent && parent.nodeName !== 'page') {
        parent = parent.parentNode;
        parentpath = parentpath.replace(/[0-9]*_$/, '');
      }
      return parentpath;
    },

    getPageIdByPath: function (page_name, path) {
      if (page_name == null) return null;
      if (page_name.match(/^id_[0-9_]*$/) != null) {
        // already a page_id
        return page_name;
      } else {
        if (path != undefined) {
          var scope = this.traversePath(path);
          if (scope == null) {
            // path is wrong
            this.error("path '" + path + "' could not be traversed, no page found");
            return null;
          }
          return this.getPageIdByName(page_name, scope);
        } else {
          return this.getPageIdByName(page_name);
        }
      }
    },

    traversePath: function (path, root_page_id) {
      var path_scope = null;
      var index = path.indexOf("/");
      if (index >= 1) {
        // skip escaped slashes like \/
        while (path.substr(index - 1, 1) == "\\") {
          var next = path.indexOf("/", index + 1);
          if (next >= 0) {
            index = next;
          }
        }
      }
      //    console.log("traversePath("+path+","+root_page_id+")");
      if (index >= 0) {
        // traverse path one level down
        var path_page_name = path.substr(0, index);
        path_scope = this.getPageIdByName(path_page_name, root_page_id);
        path = path.substr(path_page_name.length + 1);
        path_scope = this.traversePath(path, path_scope);
        //      console.log(path_page_name+"=>"+path_scope);
        return path_scope;
      } else {
        // bottom path level reached
        path_scope = this.getPageIdByName(path, root_page_id);
        return path_scope;
      }
      return null;
    },

    getPageIdByName: function (page_name, scope) {
      if (page_name.match(/^id_[0-9_]*$/) != null) {
        // already a page_id
        return page_name;
      } else {
        var page_id = null;
        // find Page-ID by name
        // decode html code (e.g. like &apos; => ')
        page_name = $("<textarea/>").html(page_name).val();
        // remove escaped slashes
        page_name = page_name.replace("\\\/", "/");

        //      console.log("Page: "+page_name+", Scope: "+scope);
        var selector = (scope != undefined && scope != null) ? '.page[id^="' + scope + '"] h1:contains(' + page_name + ')' : '.page h1:contains(' + page_name + ')';
        var pages = $(selector, '#pages');
        if (pages.length > 1 && this.currentPage != null) {
          // More than one Page found -> search in the current pages descendants first
          var fallback = true;
          pages.each(function (i) {
            var p = $(this).closest(".page");
            if ($(this).text() == page_name) {
              if (p.attr('id').length < this.currentPage.attr('id').length) {
                // found pages path is shorter the the current pages -> must be an ancestor
                if (this.currentPage.attr('id').indexOf(p.attr('id')) == 0) {
                  // found page is an ancenstor of the current page -> we take this one
                  page_id = p.attr("id");
                  fallback = false;
                  //break loop
                  return false;
                }
              } else {
                if (p.attr('id').indexOf(this.currentPage.attr('id')) == 0) {
                  // found page is an descendant of the current page -> we take this one
                  page_id = p.attr("id");
                  fallback = false;
                  //break loop
                  return false;
                }
              }
            }
          });
          if (fallback) {
            // take the first page that fits (old behaviour)
            pages.each(function (i) {
              if ($(this).text() == page_name) {
                page_id = $(this).closest(".page").attr("id");
                // break loop
                return false;
              }
            });
          }
        } else {
          pages.each(function (i) {
            if ($(this).text() == page_name) {
              page_id = $(this).closest(".page").attr("id");
              // break loop
              return false;
            }
          });
        }
      }
      if (page_id != null && page_id.match(/^id_[0-9_]*$/) != null) {
        return page_id;
      } else {
        // not found
        return null;
      }
    },

    scrollToPage: function (target, speed, skipHistory) {
      if (undefined === target)
        target = this.screensave_page;
      var page_id = this.getPageIdByPath(target);
      if (page_id == null) {
        return;
      }

      if (undefined === speed)
        speed = cv.Config.scrollSpeed;

      if (this.rememberLastPage)
        localStorage.lastpage = page_id;

      // push new state to history
      if (skipHistory === undefined) {
        qx.bom.History.getInstance().addToHistory(page_id, page_id);
      }

      this.main_scroll.seekTo(page_id, speed); // scroll to it

      this.pagePartsHandler.initializeNavbars(page_id);
      $(window).trigger('scrolltopage', page_id);
    },

    /*
     * Show a popup of type "type". The attributes is an type dependend object
     * This function returnes a jQuery object that points to the whole popup, so
     * it's content can be easily extended
     */
    showPopup: function (type, attributes) {
      return cv.structure.pure.AbstractWidget.getPopup(type).create(attributes);
    },

    /*
     * Remove the popup. The parameter is the jQuery object returned by the
     * showPopup function
     */
    removePopup: function (jQuery_object) {
      jQuery_object.remove();
    },


    selectDesign: function () {
      var body = qx.bom.Selector.query("body")[0];

      qx.bom.Selector.query('body > *').forEach(function(elem) {
        qx.bom.element.Style(elem, 'display', 'none');
      }, this);
      qx.bom.element.Style.set(body, 'backgroundColor', "black");


      var div = qx.dom.Element.create("div", {id: "designSelector"});
      qx.bom.element.Style.setStyles(body, {
        background: "#808080",
        width: "400px",
        color: "white",
        margin: "auto",
        padding: "0.5em"
      });
      div.innerHTML = "Loading ...";

      body.appendChild(div);

      var store = new qx.data.store.Json("./designs/get_designs.php");

      store.addListener("loaded", function () {
        var html = "<h1>Please select design</h1>";
        html += "<p>The Location/URL will change after you have chosen your design. Please bookmark the new URL if you do not want to select the design every time.</p>";

        div.innerHTML = html;

        store.getModel().forEach(function(element) {

          var myDiv = qx.dom.Element.create("div", {
              cursor: "pointer",
              padding: "0.5em 1em",
              borderBottom: "1px solid black",
              margin: "auto",
              width: "262px",
              position: "relative"
          });

          myDiv.innerHTML = "<div style=\"font-weight: bold; margin: 1em 0 .5em;\">Design: " + element + "</div>";
          myDiv.innerHTML += "<iframe src=\"designs/design_preview.html?design=" + element + "\" width=\"160\" height=\"90\" border=\"0\" scrolling=\"auto\" frameborder=\"0\" style=\"z-index: 1;\"></iframe>";
          myDiv.innerHTML += "<img width=\"60\" height=\"30\" src=\"./demo/media/arrow.png\" alt=\"select\" border=\"0\" style=\"margin: 60px 10px 10px 30px;\"/>";

          qx.dom.Element.insertEnd(myDiv, div);


          var tDiv = qx.dom.Element.create("div", {
            background: "transparent",
            position: "absolute",
            height: "90px",
            width: "160px",
            zIndex: 2
          });
          var pos = qx.bom.Selector.query("iframe")[0].getBoundingClientRect();
          qx.bom.element.Style.setStyles(tDiv, {
            left: pos.left + "px",
            top: pos.top + "px"
          });
          qx.dom.Element.insertEnd(tDiv, myDiv);

          qx.event.Registration.addListener(myDiv, 'pointerover', function() {
            qx.bom.element.Style.set(myDiv, 'background', "#bbbbbb");
          }, this);

          qx.event.Registration.addListener(myDiv, 'pointerout', function() {
            qx.bom.element.Style.set(myDiv, 'background', "transparent");
          }, this);

          qx.event.Registration.addListener(myDiv, 'tap', function() {
            if (document.location.search == "") {
              document.location.href = document.location.href
                + "?design=" + element;
            } else {
              document.location.href = document.location.href
                + "&design=" + element;
            }
          });
        });
      });
    },

    // tools for widget handling
    /**
     * Return a widget (to be precise: the widget_container) for the given path
     */
    lookupWidget: function (path) {
      var id = path.split('_');
      var elementNumber = +id.pop();
      return $('.page#' + id.join('_')).children().children()[elementNumber + 1];
    },

    getParentPage: function (page) {
      if (0 === page.length) return null;

      return this.getParentPageById(page.attr('id'), true);
    },

    getParentPageById: function (path, isPageId) {
      if (0 < path.length) {
        var pathParts = path.split('_');
        if (isPageId) pathParts.pop();
        while (pathParts.length > 1) {
          pathParts.pop();
          var path = pathParts.join('_') + '_';
          if ($('#' + path).hasClass("page")) {
            return $('#' + path);
          }
        }
      }
      return null;
    },

    getParentPageFromPath: function (path) {
      return this.getParentPageById(path, false);
    },

    /**
     * Create a new widget.
     * FIXME: this does nothing, should be removed?
     */
    create: function (path, element) {
      return "created widget '" + path + "': '" + element + "'";
    },

    /**
     * Delete an existing path, i.e. widget, group or even page - including
     * child elements.
     * FIXME: this does nothing, should be removed?
     */
    deleteCommand: function (path) {
      console.log(this.lookupWidget(path), $('#' + path));
      //$( this.lookupWidget( path ) ).remove();
      return "deleted widget '" + path + "'";
    },

    /**
     * Focus a widget.
     */
    focus: function (path) {
      $('.focused').removeClass('focused');
      $(this.lookupWidget(path)).addClass('focused');
    }
  }
});