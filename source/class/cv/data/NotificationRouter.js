/* NotificationCenter.js (c) 2010 by Christian Mayer [CometVisu at ChristianMayer dot de]
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 3 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA
 */


/**
 * Global notification handler that routes messages topic-dependent to different {@link cv.data.INotificationHandler}
 * (e.g. NotificationCenter, Dialog, Toast, console.log, native notification, internal message bus ...)
 *
 * @author Tobias Bräutigam
 * @since 0.11.0
 */
qx.Class.define("cv.data.NotificationRouter", {
  extend: qx.core.Object,
  type: "singleton",

  /*
  ******************************************************
    CONSTRUCTOR
  ******************************************************
  */
  construct: function() {
    this.base(arguments);
    this.__routes = {};
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members: {
    __routes: null,

    /**
     * Register a handler for a list of topics
     * @param handler {cv.ui.INotificationHandler}
     * @param topics {Map} map of topics as key and configuration-maps as values
     */
    registerMessageHandler: function(handler, topics) {
      Object.getOwnPropertyNames(topics).forEach(function(topic) {
        var segments = topic.split(".");
        var firstSegment = segments.shift();
        var currentSegment = this.__routes[firstSegment];
        if (!currentSegment) {
          this.__routes[firstSegment] = {'__handlers__': []};
          currentSegment = this.__routes[firstSegment];
        }
        segments.forEach(function(segment) {
          if (!currentSegment[segment]) {
            currentSegment[segment] = {'__handlers__': []};
          }
          currentSegment = currentSegment[segment];
        }, this);

        currentSegment.__handlers__.push({
          handler: handler,
          config: topics[topic]
        });
      }, this);
    },

    __collectHandlers: function(topic) {
      var handlers = new qx.data.Array();
      var segments = topic.split(".");
      var firstSegment = segments.shift();
      var currentSegment = this.__routes[firstSegment];
      segments.some(function(segmentName) {
        if (!currentSegment) {
          // segment does not exists, stop searching
          return true;
        } else if (segmentName === "*") {
          // collect all
          this.__collectAllFromSegment(currentSegment, handlers);
          return true;
        } else {
          if (currentSegment["*"]) {
            handlers.append(currentSegment["*"].__handlers__);
          }
          if (currentSegment[segmentName]) {
            currentSegment = currentSegment[segmentName];
          } else{
            // stop searching
            return true;
          }
        }
      }, this);
      return handlers;
    },

    __collectAllFromSegment: function(segment, handlers) {
      Object.getOwnPropertyNames(segment).forEach(function(segmentName) {
        handlers.append(segment[segmentName].__handlers__);
        this.__collectAllFromSegment(segment[segmentName], handlers);
      }, this);
      return handlers;
    },

    dispatchMessage: function(topic, message) {
      this.__collectHandlers(topic).forEach(function(entry) {
        this.debug("dispatching '"+topic+"' message to handler: "+ entry.handler);
        entry.handler.handleMessage(message);
      }, this);
    }
  },

  /*
  ******************************************************
    DESTRUCTOR
  ******************************************************
  */
  destruct: function() {
    this._disposeMap("__routes");
  }
});
