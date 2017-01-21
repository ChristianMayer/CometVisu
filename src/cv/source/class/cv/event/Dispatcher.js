/**
 * The dispatcher registers listeners for all relevant events to the window object
 * and dispatched the event to the EventHandler. The dispatcher listens to similar events
 * like touchstart and mousedown but makes sure that these events are not fired
 *
 * @param handler
 * @constructor
 */
qx.Class.define('cv.event.Dispatcher', {
  extend: cv.Object,

  /*
  ******************************************************
    CONSTRUCTOR
  ******************************************************
  */
  construct: function(handler) {
    if (handler) {
      this.setHandler(handler);
    }
  },

  /*
  ******************************************************
    PROPERTIES
  ******************************************************
  */
  properties: {
    handler: {
      check: "cv.event.Handler"
    }
  },


  /*
  ******************************************************
    MEMBERS
  ******************************************************
  */
  members: {
    /**
     * register to all events
     */
    register: function () {
      qx.event.Registration.addListener(document, "pointerdown", this._onDown, this);
      // window.addEventListener('mousedown', this._onDown.bind(this));
      // window.addEventListener('touchstart', this._onDown.bind(this));

      qx.event.Registration.addListener(document, "pointerup", this._onUp, this);
      // window.addEventListener('mouseup', this._onUp.bind(this));
      // window.addEventListener('touchend', this._onUp.bind(this));

      // qx.event.Registration.addListener(document, "pointermove", this._onMove, this);
      window.addEventListener('mousemove', this._onMove.bind(this));
      window.addEventListener('touchmove', this._onMove.bind(this));
    },

    _onDown: function (event) {
      this.getHandler().onPointerDown(event);
    },

    _onUp: function (event) {
      this.getHandler().onPointerUp(event);
      // if (event.type === "touchend") {
      //   // prevent mouseup beeing fired
      //   event.preventDefault();
      // }
    },

    _onMove: function (event) {
      // dispatch by event type
      if (event.type === "mousemove") {
        this.getHandler()._onPointerMoveNoTouch(event);
      } else if (event.type === "touchmove") {
        this.getHandler()._onPointerMoveTouch(event);
      } else {
        console.error("onhandled event type " + event.type);
      }
    }
  }
});