/**
 *
 */
qx.Class.define('cv.ui.manager.editor.Worker', {
  extend: qx.core.Object,
  type: 'singleton',

  /*
  ***********************************************
    CONSTRUCTOR
  ***********************************************
  */
  construct: function () {
    this.base(arguments);
    this._files = {};
    // create WebWorker
    this._worker = cv.data.FileWorker.getInstance();
    this._worker.addListener('message', this._onMessage, this);
  },

  /*
  ***********************************************
    PROPERTIES
  ***********************************************
  */
  properties: {
    editor: {
      check: 'cv.ui.manager.editor.AbstractEditor',
      nullable: true
    }
  },

  /*
  ***********************************************
    MEMBERS
  ***********************************************
  */
  members: {
    _worker: null,
    _files: null,

    open: function (file, code, schema, features) {
      this._worker.postMessage(["openFile", {
        path: file.getFullPath(),
        code: qx.xml.Document.isXmlDocument(code) ? code.documentElement.outerHTML : code,
        schema: schema
      }, features]);
      this._files[file.getFullPath()] = file;
    },

    close: function (file) {
      this._worker.postMessage(["closeFile", {
        path: file.getFullPath()
      }]);
      delete this._files[file.getFullPath()];
    },

    contentChanged: function (file, content) {
      this._worker.postMessage(["contentChange", {
        path: file.getFullPath(),
        code: content
      }]);
    },

    validateConfig: function (file) {
      if (file.isConfigFile()) {
        return this._worker.validateConfig(file.getServerPath());
      } else {
        qx.log.Logger.error(this, file.getFullPath() + ' is no configuration file');
      }
    },

    validateXmlConfig: function (content) {
      return this._worker.validateXmlConfig(content);
    },

    _onMessage: function (e) {
      let topic = e.getData().topic;
      let data = e.getData().data;
      let path = e.getData().path;
      let file = this._files[path];
      if (!file && topic !== 'validationResult') {
        qx.log.Logger.error(this, 'no file found for path ' + path + ' ignoring worker message for topic ' + topic);
        return;
      }
      let editor = this.getEditor();
      switch(topic) {
        case "modified":
          // new files are always modified, to not override that state
          if (!file.isTemporary()) {
            file.setModified(data.modified);
          }
          file.setHash(data.currentHash);
          break;

        case "hash":
          file.setHash(data);
          break;

        case "errors":
          file.setValid(!data || data.length === 0);
          if (editor) {
            editor.showErrors(path, data);
          }
          break;

        case "decorations":
          if (editor) {
            editor.showDecorations(path, data);
          }
          break;
      }
    }
  },

  /*
  ***********************************************
    DESTRUCTOR
  ***********************************************
  */
  destruct: function () {
    this._worker.terminate();
    this._worker = null;
  }
});
