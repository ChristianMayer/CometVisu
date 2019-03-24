/**
 * Some icon definitions.
 */
qx.Class.define('cv.theme.dark.Images', {
  type: 'static',

  /*
  ***********************************************
    STATICS
  ***********************************************
  */
  statics: {
    ICONS: {
      'new-file': '@MaterialIcons/note_add',
      'new-folder': '@MaterialIcons/create_new_folder',
      'save': '@MaterialIcons/save',
      'delete': '@MaterialIcons/delete',
      'close': '@MaterialIcons/close',
      'quit': '@MaterialIcons/exit_to_app',
      'undo': '@MaterialIcons/undo',
      'redo': '@MaterialIcons/redo',
      'hidden-config': '@MaterialIcons/settings',
      'reload': '@MaterialIcons/sync',
      'add': '@MaterialIcons/add',
      'mounted-folder': '@MaterialIcons/folder_special',
      'folder': '@MaterialIcons/folder',
      'folder-open': '@MaterialIcons/folder_open',
      'file': '@MaterialIcons/insert_drive_file',
      'download': '@MaterialIcons/cloud_download',
      'rename': '@MaterialIcons/text_rotation_none'
    },

    getIcon: function (name, size) {
      return this.ICONS.hasOwnProperty(name) ? this.ICONS[name] + '/' + size : '@MaterialIcons/' + name + '/' + size;
    }
  }
});
