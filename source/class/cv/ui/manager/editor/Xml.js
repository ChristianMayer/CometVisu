/**
 * Default XML-Editor included as iframe.
 */
qx.Class.define('cv.ui.manager.editor.Xml', {
  extend: cv.ui.manager.editor.AbstractEditor,

  /*
  ***********************************************
    CONSTRUCTOR
  ***********************************************
  */
  construct: function () {
    this.base(arguments);
    this._setLayout(new qx.ui.layout.Grow());
    this._handledActions = ['save'];
    this.__basePath = qx.util.Uri.getAbsolute(window.location.pathname + qx.util.LibraryManager.getInstance().get("cv", "resourceUri") + '/../editor/editor.html');
    this._draw();
  },

  /*
  ***********************************************
    STATICS
  ***********************************************
  */
  statics: {
    SUPPORTED_FILES: /visu_config.*\.xml/,
    TITLE: qx.locale.Manager.tr('Xml-editor'),
    ICON: cv.theme.dark.Images.getIcon('xml', 18)
  },

  /*
  ***********************************************
    MEMBERS
  ***********************************************
  */
  members: {
    _currentContent: null,

    _draw: function () {

    },

    _loadFile: function (file) {
      if (this._iframe) {
        this._iframe.destroy();
      }
      if (file) {
        var match = /.*visu_config_?(.*)\.xml/.exec(file.getName());
        if (match) {
          this._iframe = new qx.ui.embed.Iframe(qx.util.Uri.appendParamsToUrl(this.__basePath, 'embed=0&config=' + match[1]));
          this._iframe.addListener('load', function () {
            // inject save method
            this._iframe.getWindow().saveFromIframe = this.saveFromIframe.bind(this);
          }, this);

          this._add(this._iframe);
        }
      }
    },

    saveFromIframe: function (data) {
      // create XML string from data
      var xml = '';
      data.forEach(function (elem) {
        xml += this._elemToXml(elem, '');
      }, this);
      this._currentContent = xml;
      this._onContentChanged();
      this.save();
    },

    _elemToXml: function (elem) {
      var xml = '';
      if (elem.nodeName === '#text') {
        xml += elem.nodeValue;
      } else {
        xml += '<' + elem.nodeName;
        Object.keys(elem.attributes).forEach(function (attrName) {
          xml += ' ' + attrName + '="' + elem.attributes[attrName] + '"';
        });

        if (!elem.nodeValue && elem.children.length === 0) {
          xml += '/>';
        } else {
          xml += '>';
          if (elem.nodeValue) {
            xml += elem.nodeValue;
          }
          var children = [];
          elem.children.forEach(function (child) {
            children.push(this._elemToXml(child));
          }, this);
          xml += children.join('');
          xml += '</' + elem.nodeName + '>';
        }
      }
      return xml;
    },

    getCurrentContent: function () {
      return this._currentContent;
    },

    _onContentChanged: function () {
      this.getFile().setModified(true);
    },

    isSupported: function (file) {
      return cv.ui.manager.editor.Xml.SUPPORTED_FILES.test(file.getName());
    }
  },

  /*
  ***********************************************
    DESTRUCTOR
  ***********************************************
  */
  destruct: function () {

  }
});
