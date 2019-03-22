/**
 * Widget for filesystem items in a virtual tree.
 */
qx.Class.define('cv.ui.manager.tree.VirtualFsItem', {
  extend: qx.ui.tree.VirtualTreeItem,

  /*
  ***********************************************
    PROPERTIES
  ***********************************************
  */
  properties: {
    editing: {
      check: 'Boolean',
      init: false,
      apply: '_applyEditing'
    },

    name: {
      check: 'String',
      init: '',
      event: 'changeName'
    }
  },

  /*
  ***********************************************
    MEMBERS
  ***********************************************
  */
  members: {

    _applyEditing: function (value, old) {
      if (value !== old) {
        var field = this.getChildControl('edit');
        if (value) {
          field.setValue(this.getLabel());
          field.show();
          qx.event.message.Bus.dispatchByName('cv.manager.tree.enable', false);
        } else {
          qx.event.message.Bus.dispatchByName('cv.manager.tree.enable', true);
          field.exclude();
          // save new name
          if (field.getValue() !== this.getName()) {
            this.getModel().rename(field.getValue());
          }
        }
      }
    },

    __cancelEditing: function () {
      this.getChildControl('edit').setValue(this.getName());
      this.setEditing(false);
    },

    _onKeypress: function (ev) {
      if (ev.getKeyIdentifier() === 'Enter') {
        this.setEditing(false);
      } else if (ev.getKeyIdentifier() === 'Esc') {
        this.__cancelEditing();
      }
    },

    // overridden
    _createChildControlImpl : function(id) {
       var control;

       switch (id) {
         case 'edit':
           control = new qx.ui.form.TextField();
           control.addListener('keypress', this._onKeypress, this);
           control.exclude();
           control.addListener('changeVisibility', function (ev) {
              if (ev.getData() === 'visible') {
                this.getChildControl('label').exclude();
              } else {
                this.getChildControl('label').show();
              }
           }, this);
           control.addListener('blur', function () {
             console.log('blur', this.toHashCode());
             this.setEditing(false);
           }, this);
           this._add(control);
           break;
       }

       return control || this.base(arguments, id);
    }
  }
});
