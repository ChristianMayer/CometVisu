/**
 * Main class of the CometVisu file manager.
 * @author Tobias Bräutigam
 * @since 0.12.0
 *
 * @asset(manager/*)
 */
qx.Class.define('cv.ui.manager.Main', {
  extend: qx.core.Object,
  type: "singleton",

  /*
  ***********************************************
    CONSTRUCTOR
  ***********************************************
  */
  construct: function () {
    this.base(arguments);
    this.initOpenFiles(new qx.data.Array());
    this.__initCommands();
    this._draw();
  },

  /*
  ***********************************************
    STATICS
  ***********************************************
  */
  statics: {
    __editors: {},

    // use this one when no one else fits
    __defaultEditor: {
      Clazz: cv.ui.manager.editor.Source,
      instance: null
    },

    /**
     * Registers an editor for a specific file, that is identified by the given selector.
     * @param selector {String} filename-/path or regular expression.
     * @param clazz {qx.ui.core.Widget} widget class that handles those type of files
     */
    registerFileEditor: function (selector, clazz) {
      if (qx.core.Environment.get('qx.debug')) {
        qx.core.Assert.assertTrue(qx.Interface.classImplements(clazz, cv.ui.manager.editor.IEditor));
      }
      this.__editors[selector] = {
        Clazz: clazz,
        instance: null,
        regex: selector.startsWith('/') && selector.endsWith('/') ? new RegExp(selector.substring(1, selector.length-1)) : null
      };
    },

    getFileEditor: function (file) {
      var found = null;
      Object.keys(this.__editors).some(function (key) {
        if ((key.regex && key.regex.test(file.getFullPath())) || key === file.getFullPath()) {
          found = this.__editors[key];
          return true;
        }
      }, this);
      return found || this.__defaultEditor;
    }
  },

  /*
  ***********************************************
    PROPERTIES
  ***********************************************
  */
  properties: {
    openFiles: {
      check: 'qx.data.Array',
      deferredInit: true
    }
  },

  /*
  ***********************************************
    MEMBERS
  ***********************************************
  */
  members: {
    __previewFileIndex: null,
    __root: null,
    _pane: null,
    _tree: null,
    _stack: null,
    _menuBar: null,
    _oldCommandGroup: null,
    _mainContent: null,
    _openFilesController: null,
    _hiddenConfigFakeFile: null,

    /**
     * open selected file in preview mode
     * @private
     */
    _onChangeTreeSelection: function () {
     this.__openSelectedFile(true);
    },

    /**
     * Permanantly open file
     * @private
     */
    _onDblTapTreeSelection: function () {
      this.__openSelectedFile(false);
    },

    __openSelectedFile: function (preview) {
      var sel = this._tree.getSelection();
      if (sel.length > 0) {
        var node = sel.getItem(0);
        if (node.getType() === 'file') {
          this.openFile(node, preview);
        }
      }
    },

    _onChangeFileSelection: function () {
      var sel = this._openFilesController.getSelection();
      if (sel.length > 0) {
        var node = sel.getItem(0);
        if (node.getType() === 'file') {
          var editorConfig = cv.ui.manager.Main.getFileEditor(node);
          if (!editorConfig.instance) {
            editorConfig.instance = new editorConfig.Clazz();
            this._menuBar.addListener('save', editorConfig.instance.save, editorConfig.instance);
            editorConfig.instance.bind('saveable', this._menuBar.getChildControl('save-button'), 'enabled');
            this._stack.add(editorConfig.instance);
          } else {
            this._stack.setSelection([editorConfig.instance]);
          }
          editorConfig.instance.setFile(node);
        }
      }
    },

    openFile: function (file, preview) {
      var openFiles = this.getOpenFiles();
      if (preview === true) {
        if (!file.getUserData('permanent')) {
          if (this.__previewFileIndex !== null) {
            openFiles.setItem(this.__previewFileIndex, file);
          } else {
            var length = openFiles.unshift(file);
            this.__previewFileIndex = length - 1;
          }
        }
      } else {
        if (this.__previewFileIndex === null || openFiles.indexOf(file) !== this.__previewFileIndex) {
          openFiles.push(file);
        }
        file.setUserData('permanent', true);
        this.__previewFileIndex = null;
      }
      this._openFilesController.getTarget().setModelSelection([file]);
    },

    closeFile: function (file) {
      file.setUserData('permanent', null);
      this.getOpenFiles().remove(file);
      if (this.getOpenFiles().length === 0) {
        this._stack.getSelection()[0].resetFile();
      }
    },

    _onCloseFile: function (ev) {
      this.closeFile(ev.getTarget().getLayoutParent().getModel());
    },

    __getRoot: function () {
      if (!this.__root) {
        this.__root = qx.dom.Element.create('div', {
          id: 'manager',
          style: 'position: absolute; top: 0; left: 0; right: 0; bottom: 0;'
        });
        qx.dom.Element.insertEnd(this.__root, document.body);
        qx.theme.manager.Meta.getInstance().setTheme(cv.theme.Dark);
      }
      return this.__root;
    },

    __initCommands: function () {
      var group = new qx.ui.command.Group();
      group.add('save', new qx.ui.command.Command('Ctrl+S'));
      group.add('save-as', new qx.ui.command.Command('Ctrl+Shift+S'));
      group.add('close', new qx.ui.command.Command('Ctrl+X'));
      group.add('new-file', new qx.ui.command.Command('Ctrl+N'));
      group.add('new-folder', new qx.ui.command.Command('Ctrl+Shift+N'));
      group.add('quit', new qx.ui.command.Command('Ctrl+Q'));

      var manager = qx.core.Init.getApplication().getCommandManager();
      this._oldCommandGroup = manager.getActive();
      manager.add(group);
      manager.setActive(group);

      group.get('quit').addListener('execute', this.dispose, this);
    },

    // overridden
    _draw: function () {

      var root = new qx.ui.root.Inline(this.__getRoot(), true, true);
      qx.core.Init.getApplication().setRoot(root);
      root.setLayout(new qx.ui.layout.Canvas());

      var main = new qx.ui.container.Composite(new qx.ui.layout.Dock());
      root.add(main, {edge: 0});

      this._pane = new qx.ui.splitpane.Pane();
      main.add(this._pane, {edge: 'center'});

      var rootFolder = new cv.ui.manager.model.FileItem('.');
      this._tree = new qx.ui.tree.VirtualTree(rootFolder, 'name', 'children');
      rootFolder.load(function () {
        this._tree.setHideRoot(true);
      }, this);
      this._tree.set({
        selectionMode: 'one',
        minWidth: 300,
        openMode: 'tap'
      });
      this._tree.setDelegate({
        createItem: function () {
          var item = new qx.ui.tree.VirtualTreeItem();
          item.addListener('dbltap', this._onDblTapTreeSelection, this);
          return item;
        }.bind(this),

        // Bind properties from the item to the tree-widget and vice versa
        bindItem : function(controller, item, index) {
          controller.bindDefaultProperties(item, index);
          controller.bindPropertyReverse("open", "open", null, item, index);
          controller.bindProperty("open", "open", null, item, index);
          controller.bindProperty("readable", "enabled", null, item, index);
          controller.bindProperty("icon", "icon", null, item, index);
        }
      });
      this._tree.openNode(rootFolder);
      this._tree.getSelection().addListener("change", this._onChangeTreeSelection, this);
      var leftContent = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      leftContent.add(this._tree, {flex: 1});
      this._pane.add(leftContent, 0);

      // left-bottom bar
      var leftToolbar = new qx.ui.toolbar.ToolBar();
      var openHiddenConfigButton = new qx.ui.toolbar.Button(qx.locale.Manager.tr('Edit hidden config'), '@MaterialIcons/settings/30');
      openHiddenConfigButton.set({
        toolTipText: qx.locale.Manager.tr('Edit hidden config')
      });
      openHiddenConfigButton.addListener('execute', function () {
        if (!this._hiddenConfigFakeFile) {
          this._hiddenConfigFakeFile = new cv.ui.manager.model.FileItem('hidden.php').set({
            hasChildren: false,
            parentFolder: "",
            parent: rootFolder,
            readable: true,
            writeable: true,
            overrideIcon: true,
            icon: '@MaterialIcons/settings/15',
            type: "file"
          });
        }
        if (this.getOpenFiles().includes(this._hiddenConfigFakeFile)) {
          this.closeFile(this._hiddenConfigFakeFile);
        } else {
          this.openFile(this._hiddenConfigFakeFile, false);
        }
      }, this);
      leftToolbar.add(openHiddenConfigButton);
      leftContent.add(leftToolbar);

      this._mainContent = new qx.ui.container.Composite(new qx.ui.layout.VBox());

      // tab list
      var list = new qx.ui.form.List(true);
      // list.setAppearance('open-files-tabs');
      list.set({
        decorator: null,
        minHeight: 30,
        height: 30,
        padding: 0
      });
      this._openFilesController = new qx.data.controller.List(this.getOpenFiles(), list, "name");
      this._openFilesController.setDelegate({
        createItem: function () {
          var item = new qx.ui.form.ListItem();
          var icon = item.getChildControl('icon');
          icon.setAnonymous(false);
          icon.setCursor('pointer');
          icon.addListener('tap', this._onCloseFile, this);
          return item;
        }.bind(this),

        configureItem: function (item) {
          item.setAppearance('open-file-item');
        }
      });
      list.addListener('changeSelection', this._onChangeFileSelection, this);
      this._mainContent.add(list);

      this._stack = new qx.ui.container.Stack();
      this._mainContent.add(this._stack, {flex: 1});
      this._pane.add(this._mainContent, 1);

      // menu on top
      this._menuBar = new cv.ui.manager.MenuBar();
      main.add(this._menuBar, {edge: 'north'});
    }
  },

  /*
  ***********************************************
    DESTRUCTOR
  ***********************************************
  */
  destruct: function () {
    this._disposeObjects(
      '_pane', '_tree', '_stack', '_menuBar', '_mainContent', '_openFilesController',
      '_hiddenConfigFakeFile'
    );
    // restore former command group
    var application = qx.core.Init.getApplication();
    var manager = application.getCommandManager();
    manager.setActive(this._oldCommandGroup);
    this._oldCommandGroup = null;

    // defer the reset to let the dispose queue to be emptied before removing the root
    new qx.util.DeferredCall(function () {
      application.resetRoot();
    }).schedule();

    document.body.removeChild(this.__root);
    this.__root = null;

    // cleanup editor instances
    if (cv.ui.manager.Main.__defaultEditor.instance) {
      cv.ui.manager.Main.__defaultEditor.instance.dispose();
      cv.ui.manager.Main.__defaultEditor.instance = null;
    }
    Object.keys(cv.ui.manager.Main.__editors).forEach(function (regex) {
      if (cv.ui.manager.Main.__editors[regex].instance) {
        cv.ui.manager.Main.__editors[regex].instance.dispose();
        cv.ui.manager.Main.__editors[regex].instance = null;
      }
    });
  },

  defer: function(statics) {
    // initialize on load
    statics.getInstance();

    // register special file editors
    statics.registerFileEditor("hidden.php", cv.ui.manager.editor.Config);
  }
});
