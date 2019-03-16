/**
 * Main toolbar on top.
 */
qx.Class.define('cv.ui.manager.MenuBar', {
  extend: qx.ui.menubar.MenuBar,

  /*
  ***********************************************
    CONSTRUCTOR
  ***********************************************
  */
  construct: function () {
    this.base(arguments);
    this._commandGroup = qx.core.Init.getApplication().getCommandManager().getActive();
    this.__buttons = {};
    this._draw();
  },

  /*
  ***********************************************
    MEMBERS
  ***********************************************
  */
  members: {
    _commandGroup: null,
    __buttons: null,
    __defaultButtonConfiguration: null,
    __buttonConfiguration: null,

    _draw: function () {
      this._createChildControl('file');
      this._createChildControl('edit');
      this.add(new qx.ui.core.Spacer(), {flex: 1});
      this._createChildControl('title');
      this.add(new qx.ui.core.Spacer(), {flex: 1});

      this.__defaultButtonConfiguration = {
        'new-file': {
          menu: 'file-menu',
          args: [this.tr('New file'), '@MaterialIcons/note_add/18', this._commandGroup.get('new-file')],
          enabled: true
        },
        'new-folder': {
          menu: 'file-menu',
          args: [this.tr('New folder'), '@MaterialIcons/create_new_folder/18', this._commandGroup.get('new-folder')],
          enabled: true
        },
        'save': {
          menu: 'file-menu',
          args: [this.tr('Save'), '@MaterialIcons/save/18', this._commandGroup.get('save')],
          enabled: false,
          separator: 'before'
        },
        'save-as': {
          menu: 'file-menu',
          args: [this.tr('Save as...'), null, this._commandGroup.get('save-as')],
          enabled: false
        },
        'close': {
          menu: 'file-menu',
          args: [this.tr('Close file'), '@MaterialIcons/close/18', this._commandGroup.get('close')],
          enabled: false,
          separator: 'before'
        },
        'quit': {
          menu: 'file-menu',
          args: [this.tr('Quit'), '@MaterialIcons/exit_to_app/18', this._commandGroup.get('quit')],
          enabled: true,
          separator: 'before'
        },
        // edit menu basics
        'undo': {
          menu: 'edit-menu',
          args: [this.tr('Undo'), '@MaterialIcons/undo/18', this.tr('Ctrl+Z')],
          enabled: true
        },
        'redo': {
          menu: 'edit-menu',
          args: [this.tr('Redo'), '@MaterialIcons/redo/18', this.tr('Ctrl+Y')],
          enabled: true
        },
        'cut': {
          menu: 'edit-menu',
          args: [this.tr('Cut'), null, this.tr('Ctrl+X')],
          enabled: false,
          separator: 'before'
        },
        'copy': {
          menu: 'edit-menu',
          args: [this.tr('Copy'), null, this.tr('Ctrl+C')],
          enabled: false
        },
        'paste': {
          menu: 'edit-menu',
          args: [this.tr('Paste'), null, this.tr('Ctrl+V')],
          enabled: false
        },
        'hidden-config': {
          menu: 'edit-menu',
          args: [this.tr('Hidden configuration'), '@MaterialIcons/settings/18'],
          enabled: false
        }
      };
      this.maintainButtons();
    },

    maintainButtons: function (config) {
      if (!config) {
        config = this.__defaultButtonConfiguration;
      } else {
        config = Object.merge(this.__defaultButtonConfiguration, config);
        this.__buttonConfiguration = config;
      }
      Object.keys(config).forEach(function (id) {
        var button;
        var buttonConf = config[id];
        if (!this.__buttons.hasOwnProperty(id)) {
          // create button
          var label = buttonConf.args[0];
          var icon = buttonConf.args[1];
          var command = buttonConf.args[2];
          if (qx.lang.Type.isString(command) || !command) {
            // no command connected
            button = new qx.ui.menu.Button(label, icon);
            if (command) {
              // just add the string as shortcut hint
              button.getChildControl('shortcut').setValue(command);
            }
          } else {
            button = new qx.ui.menu.Button(label, icon, command);
          }
          button.addListener('execute', function () {
            qx.event.message.Bus.dispatchByName('cv.manager.action', id);
          }, this);
          var menu = this.getChildControl(buttonConf.menu);
          if (!menu) {
            throw new Error('no menu named ' + buttonConf.menu + ' found!');
          }
          if (buttonConf.separator === 'before') {
            menu.add(new qx.ui.menu.Separator());
          }
          menu.add(button);
          if (buttonConf.separator === 'after') {
            menu.add(new qx.ui.menu.Separator());
          }
          this.__buttons[id] = button;
        } else {
          button = this.__buttons[id];
        }
        button.setEnabled(buttonConf.enabled);

      }, this);
    },

    getButton: function (id) {
      return this.__buttons[id];
    },

    getButtonConfiguration: function () {
      return this.__buttonConfiguration || this.__defaultButtonConfiguration;
    },

    // overridden
    _createChildControlImpl : function(id) {
       var control;

       switch (id) {
         case 'title':
           control = new qx.ui.basic.Label(this.tr('CometVisu Manager'));
           this.add(control);
           break;

         case "file":
           control = new qx.ui.menubar.Button(this.tr('File'), null, this.getChildControl('file-menu'));
           this.add(control);
           break;

         case "edit":
           control = new qx.ui.menubar.Button(this.tr('Edit'), null, this.getChildControl('edit-menu'));
           this.add(control);
           break;

         case 'file-menu':
           control = new qx.ui.menu.Menu();
           break;

         case 'edit-menu':
           control = new qx.ui.menu.Menu();
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
    this._commandGroup = null;
  }
});
