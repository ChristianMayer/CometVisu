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
    this._worker = new Worker(qx.util.ResourceManager.getInstance().toUri('manager/worker.js'));
    this._worker.onmessage = this._onMessage.bind(this);
  },

  /*
  ***********************************************
    PROPERTIES
  ***********************************************
  */
  properties: {
    editor: {
      check: 'cv.ui.manager.editor.Source',
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

    open: function (file, code, schema) {
      this._worker.postMessage(["openFile", {
        path: file.getFullPath(),
        code: code,
        schema: schema
      }]);
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

    _onMessage: function (e) {
      var topic = e.data.shift();
      var data = e.data.shift();
      var path = e.data.shift();
      var file = this._files[path];
      if (!file) {
        qx.log.Logger.error(this, 'no file found for path ' + path + ' ignoring worker message for topic ' + topic);
        return;
      }
      var editor = this.getEditor();
      switch(topic) {
        case "modified":
          file.setModified(data.modified);
          file.setHash(data.currentHash);
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
