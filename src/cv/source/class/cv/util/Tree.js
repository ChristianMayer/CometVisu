/**
 * Tree
 *
 * @author tobiasb
 * @since 2016
 */

/**
 * Helper methods for the widget tree
 */
qx.Class.define('cv.util.Tree', {
  type: "static",

  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {

    /*
     * *********************************************************
     * Widget tree helper functions
     * ********************************************************
     */
    getChildWidgets: function(widget, type) {
      return widget.getChildren().filter(function(child) {
        return !type || child.get$$type() === type;
      })
    },

    /**
     * Get the parent widget with optional type filter
     *
     * @param widget {cv.structure.pure.AbstractWidget} start traversing up the with this widget
     * @param type {String?} only return parent of this type
     * @returns {cv.structure.pure.AbstractWidget|null}
     */
    getParentWidget: function(widget, type) {
      var parent = widget.getParentWidget();
      while (parent) {
        if (!type || parent.get$$type() === type) {
          return parent;
        }
        parent = parent.getParentWidget();
      }
    },

    /*
     * *********************************************************
     * Widget data tree helper functions
     * ********************************************************
     */
    getParentPageData: function(path) {
      var data = {};
      console.log("getParentPath "+path);
      var isPage = path.substr(-1,1) === "_"; // path ends with _
      if (!isPage) {
        path = path.substr(0, path.length - 1);
      }
      var parentPath = path;
      if (parentPath === "id_") {
        return null;
      }
      var model = cv.data.Model.getInstance();
      while (qx.lang.Object.isEmpty(data) && parentPath.length > 2) {
        console.log("checking "+parentPath);
        data = model.getWidgetData(parentPath);
        if (parentPath === "id_") {
          break;
        }
        var parts = parentPath.substr(0, parentPath.length - 1).split("_");
        parts.pop();
        parentPath = parts.join("_") + "_";
      }
      return data;
    },

    /*
    * *********************************************************
    * DOM-Element tree helper functions
    * ********************************************************
    */
    getChildElements: function(element, selector) {
      return qx.dom.Hierarchy.getChildElements(element).filter(function(child) {
        if (selector) {
          return qx.bom.Selector.matches(selector, child);
        } else {
          return true;
        }
      }, this);
    },

    getParentPage: function(element) {
      return this.getParent(element, "#pages", ".page", 1)[0];
    },

    getParentGroup: function(element) {
      return this.getParent(element, "#pages", ".group", 1)[0];
    },

    getParent: function(element, until, selector, limit) {
      var parents = [];
      var parent = qx.dom.Element.getParentElement(element);
      while (parent && qx.bom.element.Attribute.get(parent, 'id') !== "pages") {
        var found = [parent];
        if (selector) {
          found = qx.bom.Selector.matches(selector, found);
        }
        parents = parents.concat(found);
        if (limit && parents.length >= limit) {
          break;
        }
        if (until && qx.bom.Selector.matches(until, [parent]).length > 0) {
          break;
        }
        parent = qx.dom.Element.getParentElement(parent);
      }
      return parents;
    }
  }
});