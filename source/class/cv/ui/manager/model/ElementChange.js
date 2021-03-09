/**
 * An atomic change on an cv.ui.manager.model.XmlElement that can be undone / redone.
 */
qx.Class.define('cv.ui.manager.model.ElementChange', {
  extend: qx.core.Object,

  /*
  ***********************************************
    CONSTRUCTOR
  ***********************************************
  */
  construct: function (title, element, changes, type) {
    this.base(arguments);
    this.setTitle(title);
    this.setElement(element);
    this.setChanges(changes);
    this.setChangeType(type || 'content');
  },
  /*
  ***********************************************
    PROPERTIES
  ***********************************************
  */
  properties: {
    element: {
      check: 'cv.ui.manager.model.XmlElement'
    },
    title: {
      check: 'String'
    },
    changes: {
      check: 'Array'
    },
    changeType: {
      check: ['content', 'created', 'deleted', 'moved'],
      init: ['content']
    }
  },

  /*
  ***********************************************
    MEMBERS
  ***********************************************
  */
  members: {
    /**
     * Undo all changes
     * @return {Boolean} true if all changes are undone
     */
    undo: function() {
      const element = this.getElement();
      let success = false;
      let change;
      if (!element.isDisposed()) {
        switch (this.getChangeType()) {
          case 'content':
            this.getChanges().forEach(change => {
              element.setAttribute(change.attribute, change.old);
            });
            element.updateModified();
            success = true;
            break;

          case 'deleted':
            change = this.getChanges()[0];
            if (change.parent) {
              change.parent.insertChild(change.child, change.index, true);
              success = true;
            }
            break;

          case 'created':
            change = this.getChanges()[0];
            if (change.child) {
              change.child.remove(true);
              success = true;
            }
            break;

          case 'moved':
            // TODO
            change = this.getChanges()[0];
            break;

        }
      }
      return success;
    },

    /**
     * Redo all change
     *  @return {Boolean} true if all changes are redone
     */
    redo: function () {
      const element = this.getElement();
      let success = false;
      if (!element.isDisposed()) {
        switch (this.getChangeType()) {
          case 'content':
            this.getChanges().forEach(change => {
              element.setAttribute(change.attribute, change.value);
            });
            element.updateModified();
            success = true;
            break;

          case 'deleted':
            if (element) {
              element.remove(true);
              success = true;
            }
            break;

          case 'created':
            const change = this.getChanges()[0];
            if (change.parent) {
              change.parent.insertChild(change.child, change.index, true);
              success = true;
            }
            break;

          case 'moved':
            // TODO
            break;
        }
      }
      return success;
    }
  }
});
