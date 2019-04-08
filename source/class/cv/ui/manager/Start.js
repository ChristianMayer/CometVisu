/**
 * Simple view that provides all of the file-related features of the old editor in an easy to use way.
 */
qx.Class.define('cv.ui.manager.Start', {
  extend: qx.ui.core.Widget,
  implement: [
    cv.ui.manager.editor.IEditor,
    cv.ui.manager.IActionHandler
  ],

  /*
  ***********************************************
    CONSTRUCTOR
  ***********************************************
  */
  construct: function () {
    this.base(arguments);
    this._setLayout(new qx.ui.layout.VBox(8));
    this._configRegex = /^visu_config_?([^.]+)?\.xml$/;
    ['configs-title', 'configs', 'demo-configs-title', 'demo-configs', 'media-title', 'media'].forEach(this._createChildControl, this);
  },

  /*
  ***********************************************
    PROPERTIES
  ***********************************************
  */
  properties: {
    file: {
      check: 'cv.ui.manager.model.FileItem',
      apply: '_loadRoot'
    },
    appearance: {
      refine: true,
      init: 'cv-start'
    },

    selectedItem: {
      check: 'cv.ui.manager.model.FileItem',
      nullable: true,
      apply: '_applySelectedItem'
    }
  },

  /*
  ***********************************************
    MEMBERS
  ***********************************************
  */
  members: {
    _configRegex: null,
    _ignoreSelectionChanges: false,

    save: function () {},
    getCurrentContent: function () {},
    canHandleAction: function(actionName) {
      return false;
    },
    handleAction: function (actionName) {},

    _loadRoot: function (value) {
      this.getChildControl('configs').setFile(value);
      var found = 0;

      value.load(function () {
        value.getChildren().some(function (file) {
          if (file.getName() === 'media') {
            this.getChildControl('media').setFile(file);
            found++;
          } else if (file.getName() === 'demo') {
            this.getChildControl('demo-configs').setFile(file);
            found++;
          }
          return found === 2;
        }, this);
      }, this);
    },

    _onChangeSelection: function (ev) {
      if (this._ignoreSelectionChanges === false) {
        var list = ev.getTarget();
        var selection = ev.getData();
        this._ignoreSelectionChanges = true;

        // unselect the other lists
        ['configs', 'demo-configs', 'media'].forEach(function (name) {
          var control = this.getChildControl(name);
          if (control !== list) {
            control.resetSelection();
          }
        }, this);
        this._ignoreSelectionChanges = false;
        if (selection.length > 0) {
          this.setSelectedItem(selection[0].getModel());
        }
      }
    },

    _applySelectedItem: function (value) {

    },

    // overridden
    _createChildControlImpl : function(id) {
       var control;

       switch (id) {
         case 'configs-title':
           control = new qx.ui.basic.Label(this.tr('Configurations'));
           this._add(control);
           break;

         case 'configs':
           control = new cv.ui.manager.viewer.Folder();
           control.set({
             showTextFilter: false,
             permanentFilter: function (file) {
               var match = this._configRegex.exec(file.getName());
               return !!match && (!match[1] || !match[1].endsWith('temp'));
             }.bind(this),
             labelConverter: function (name) {
               var configName = cv.ui.manager.model.FileItem.getConfigName(name);
               return configName ? qx.lang.String.firstUp(configName) : '<Default>';
             },
             file: cv.ui.manager.model.FileItem.ROOT
           });
           control.addListener('changeSelection', this._onChangeSelection, this);
           this._add(control);
           break;

         case 'demo-configs-title':
           control = new qx.ui.basic.Label(this.tr('Demo configurations'));
           this._add(control);
           break;

         case 'demo-configs':
           control = new cv.ui.manager.viewer.Folder();
           control.set({
             showTextFilter: false,
             permanentFilter: function (file) {
               return this._configRegex.test(file.getName());
             }.bind(this),
             labelConverter: function (name) {
               var configName = cv.ui.manager.model.FileItem.getConfigName(name);
               return configName ? qx.lang.String.firstUp(configName) : '<Default>';
             }
           });
           control.addListener('changeSelection', this._onChangeSelection, this);
           this._add(control);
           break;

         case 'media-title':
           control = new qx.ui.basic.Label(this.tr('Media files'));
           this._add(control);
           break;

         case 'media':
           control = new cv.ui.manager.viewer.Folder();
           control.set({
             showTextFilter: false
           });
           control.addListener('changeSelection', this._onChangeSelection, this);
           this._add(control, {flex: 1});
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
    this._configRegex = null;
  }
});
