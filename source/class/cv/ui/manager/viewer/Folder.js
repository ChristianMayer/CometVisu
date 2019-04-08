/**
 * Displays folder content in an explorer like view.
 */
qx.Class.define('cv.ui.manager.viewer.Folder', {
  extend: cv.ui.manager.viewer.AbstractViewer,
  implement: [
    qx.ui.core.IMultiSelection,
    qx.ui.form.IModelSelection
  ],
  include: [
    qx.ui.core.MMultiSelectionHandling,
    qx.ui.core.MRemoteChildrenHandling,
    qx.ui.form.MModelSelection
  ],

  /*
 ***********************************************
   CONSTRUCTOR
 ***********************************************
 */
  construct: function () {
    this.base(arguments);
    this._isImageRegex = new RegExp('\.(' + cv.ui.manager.viewer.Image.SUPPORTED_FILES.join('|') + ')$');
    this.initModel(new qx.data.Array());
    this._setLayout(new qx.ui.layout.VBox(8));
    this._debouncedOnFilter = qx.util.Function.debounce(this._onFilter, 500, false);
    this._createChildControl('filter');
  },

  /*
  ***********************************************
    STATICS
  ***********************************************
  */
  statics: {
    SUPPORTED_FILES: function isDir(item) {
      // noinspection JSConstructorReturnsPrimitive
      return item.getType() === 'dir';
    },
    TITLE: qx.locale.Manager.tr('Show folder'),
    ICON: cv.theme.dark.Images.getIcon('folder', 18)
  },

  /*
  ***********************************************
    EVENTS
  ***********************************************
  */
  events: {
    /**
     * This event is fired after a list item was added to the list. The
     * {@link qx.event.type.Data#getData} method of the event returns the
     * added item.
     */
    addItem : "qx.event.type.Data",

    /**
     * This event is fired after a list item has been removed from the list.
     * The {@link qx.event.type.Data#getData} method of the event returns the
     * removed item.
     */
    removeItem : "qx.event.type.Data"
  },

  /*
  ***********************************************
    PROPERTIES
  ***********************************************
  */
  properties: {
    model: {
      check: 'qx.data.Array',
      deferredInit: true
    },

    permanentFilter: {
      check: 'Function',
      nullable: true,
      apply: '_onFilter'
    },

    showTextFilter: {
      check: 'Boolean',
      init: true,
      apply: '_applyShowTextFilter'
    },

    labelConverter: {
      check: 'Function',
      nullable: true
    }
  },

  /*
 ***********************************************
   MEMBERS
 ***********************************************
 */
  members: {
    _controller: null,
    _isImageRegex: null,

    /** @type {Class} Pointer to the selection manager to use */
    SELECTION_MANAGER : qx.ui.core.selection.ScrollArea,

    _getDelegate: function () {
      var labelConverter = this.getLabelConverter();
      var converter = labelConverter ? {
        converter: labelConverter
      } : null;
      return {
        createItem: function () {
          return new cv.ui.manager.form.FileListItem();
        },
        configureItem: function (item) {
          item.addListener('dbltap', this._onDblTap, this);
          item.addListener('contextmenu', this._onFsItemRightClick, this);
        }.bind(this),
        bindItem: function (controller, item, index) {
          controller.bindProperty('', 'model', null, item, index);
          controller.bindProperty('name', 'label', converter, item, index);
          controller.bindProperty('icon', 'icon', {
            converter: function (source, file) {
              if (file.getType() === 'file' && this._isImageRegex.test(file.getName())) {
                // use the image as icon
                return file.getServerPath();
              } else {
                // remove size from icon source
                var parts = source.split('/');
                if (parts.length === 3) {
                  parts.pop();
                }
                return parts.join('/');
              }
            }.bind(this)
          }, item, index);
        }.bind(this)
      };
    },

    _onChangeSelection: function (ev) {
      console.log(ev.getData());
    },

    _onFsItemRightClick: function (ev) {
      var file = ev.getTarget().getModel();
      var menu = cv.ui.manager.contextmenu.FileItem.getInstance();
      menu.configure(file);
      ev.getTarget().setContextMenu(menu);
    },

    _onDblTap: function (ev) {
      qx.event.message.Bus.dispatchByName('cv.manager.open', ev.getTarget().getModel());
    },

    /**
     *
     * @param callback {Function} callback that is called after the model is ready (only one parameter: the model)
     * @param context {Object} the callback context
     * @returns {*}
     * @private
     */
    _createModel: function(callback, context) {
      this.getFile().load(function () {
        callback.call(context, this.getFile().getChildren());
      }, this);
    },

    _applyFile: function () {
      var container = this.getChildControl('list');
      var model = this.getModel();
      if (!this._controller) {
        this._controller = new qx.data.controller.List(null, container);
        this._controller.setDelegate(this._getDelegate());
        this._controller.addListener('changeSelection', this._onChangeSelection, this);
      }
      this._createModel(function (newModel) {
        model.replace(newModel);

        if (this.getChildControl('filter').getValue() || this.getPermanentFilter()) {
          this._onFilter();
        } else {
          this._controller.setModel(model);
        }
      }, this);
    },

    _applyShowTextFilter: function (value) {
      this.getChildControl('filter').setVisibility(value ? 'visible' : 'excluded');
    },

    _onFilter: function () {
      if (this._controller) {
        var filterString = this.getChildControl('filter').getValue();
        var filterFunction = this.getPermanentFilter();
        var filtered = this.getModel().filter(function (file) {
          return (!filterFunction || filterFunction(file)) && (!filterString || file.getName().includes(filterString));
        });
        this._controller.setModel(filtered);
      }
    },

    getChildrenContainer: function () {
      return this.getChildControl('list');
    },

    /**
     * Handle child widget adds on the content pane
     *
     * @param e {qx.event.type.Data} the event instance
     */
    _onAddChild : function(e) {
      this.fireDataEvent("addItem", e.getData());
    },

    /**
     * Handle child widget removes on the content pane
     *
     * @param e {qx.event.type.Data} the event instance
     */
    _onRemoveChild : function(e) {
      this.fireDataEvent("removeItem", e.getData());
    },

    // overridden
    _createChildControlImpl : function(id) {
      var control;

      switch (id) {

        case 'filter':
          control = new qx.ui.form.TextField();
          control.set({
            placeholder: this.tr('Filter by name...'),
            liveUpdate: true,
            margin: 8
          });
          if (!this.isShowTextFilter()) {
            control.exclude();
          }
          control.addListener('changeValue', this._debouncedOnFilter, this);
          this._addAt(control, 0);
          break;

        case 'scroll':
          control = new qx.ui.container.Scroll();
          this._addAt(control, 1, {flex: 1});
          break;

        case 'list':
          control = new qx.ui.container.Composite(new qx.ui.layout.Flow(8, 8));

          // Used to fire item add/remove events
          control.addListener("addChildWidget", this._onAddChild, this);
          control.addListener("removeChildWidget", this._onRemoveChild, this);
          this.getChildControl('scroll').add(control);
          break;
      }

      return control || this.base(arguments, id);
    }
  },

  /*
  ***********************************************
    DESTRUCTOR
  ***********************************************
  */
  destruct: function () {
    this._disposeObjects('_controller');
    this._isImageRegex = null;
  }
});
