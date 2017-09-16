
describe('test the NotificationCenter', function () {

  var center = cv.ui.NotificationCenter.getInstance();

  beforeEach(function() {
    // set animation time to 0
    cv.ui.NotificationCenter.SLIDE.duration = 0;
    center._init();
  });

  afterEach(function() {
    cv.ui.NotificationCenter.clear(true);
    cv.ui.NotificationCenter.SLIDE.duration = 350;
  });

  it("should test some basics", function () {
    var severities = center.getSeverities();
    expect(severities.indexOf("low")).toBeGreaterThanOrEqual(0);
    expect(severities.indexOf("normal")).toBeGreaterThanOrEqual(0);
    expect(severities.indexOf("high")).toBeGreaterThanOrEqual(0);
    expect(severities.indexOf("urgent")).toBeGreaterThanOrEqual(0);
  });

  it('should toggle the visibility', function(done) {
    var element = qx.bom.Selector.query("#notification-center")[0];

    expect(element).not.toBeUndefined();

    expect(qx.bom.element.Style.get(element, "transform")).toEqual("none");
    center.toggleVisibility();
    setTimeout(function() {
      expect(qx.bom.element.Style.get(element, "transform")).toEqual("matrix(1, 0, 0, 1, -300, 0)");
      center.toggleVisibility();
      setTimeout(function() {
        expect(qx.bom.element.Style.get(element, "transform")).toEqual("matrix(1, 0, 0, 1, 0, 0)");
        done();
      }, 100);
    }, 100);
  });

  it('should toggle the badge visibility', function(done) {
    var element = qx.bom.Selector.query("#notification-center .badge")[0];

    expect(element).not.toBeUndefined();

    expect(qx.bom.element.Class.has(element, "hidden")).toBeFalsy();
    center.disableBadge(true);
    setTimeout(function() {
      expect(qx.bom.element.Class.has(element, "hidden")).toBeTruthy();
      center.disableBadge(false);
      setTimeout(function() {
        expect(qx.bom.element.Class.has(element, "hidden")).toBeFalsy();
        done();
      }, 10);
    }, 10);
  });

  it('should handle messages', function() {

    var message = {
      topic: "cv.test",
      title: "Title",
      message: "Test message",
      severity: "normal"
    };
    var badge = qx.bom.Selector.query("#notification-center .badge")[0];
    expect(badge).not.toBeUndefined();

    center.handleMessage(qx.lang.Object.clone(message));
    expect(center.__messages.getLength()).toBe(1);

    expect(qx.bom.element.Attribute.get(badge, "html")).toEqual("1");
    expect(qx.bom.element.Class.has(badge, "normal")).toBeTruthy();

    // add message with higher severity
    message.severity = "high";
    message.unique = true;

    center.handleMessage(qx.lang.Object.clone(message));
    // as the message was unique it replaces the old one
    expect(center.__messages.getLength()).toBe(1);

    expect(qx.bom.element.Attribute.get(badge, "html")).toEqual("1");
    expect(qx.bom.element.Class.has(badge, "high")).toBeTruthy();

    // add message with higher severity
    message.severity = "urgent";
    message.unique = false;

    center.handleMessage(qx.lang.Object.clone(message));
    // as the message was unique it replaces the old one
    expect(center.__messages.getLength()).toBe(2);

    expect(qx.bom.element.Attribute.get(badge, "html")).toEqual("2");
    expect(qx.bom.element.Class.has(badge, "urgent")).toBeTruthy();

    // remove unique messages
    message.condition = false;
    message.unique = true;

    center.handleMessage(qx.lang.Object.clone(message));
    center.handleMessage(qx.lang.Object.clone(message));
    // as we had 2 messages with same topic both should be gone now
    expect(center.__messages.getLength()).toBe(0);

    expect(qx.bom.element.Attribute.get(badge, "html")).toBeNull();
    expect(qx.bom.element.Class.has(badge, "urgent")).toBeFalsy();
  });

  it("should test the maxEntries limit", function() {
    center.setMaxEntries(5);
    var message = {
      topic: "cv.test",
      title: "Title",
      message: "Test message",
      severity: "normal"
    };

    for(var i=0; i< 10; i++) {
      var msg = qx.lang.Object.clone(message);
      msg.title = i;
      center.handleMessage(msg);
    }

    expect(center.__messages.getLength()).toBe(5);
    expect(center.__messages.getItem(0).title).toBe(5);

    // delete a message by index
    cv.ui.NotificationCenter.deleteMessage(0);
    expect(center.__messages.getLength()).toBe(4);
    expect(center.__messages.getItem(0).title).toBe(6);

    // delete a message by index which is not deletable
    center.__messages.getItem(0).deletable = false;
    cv.ui.NotificationCenter.deleteMessage(0);
    expect(center.__messages.getLength()).toBe(4);
    expect(center.__messages.getItem(0).title).toBe(6);
  });

  it("should perform a message action", function() {
    var spy = jasmine.createSpy();

    qx.Class.define("cv.test.ActionHandler", {
      extend: cv.core.notifications.actions.AbstractActionHandler,
      implement: cv.core.notifications.IActionHandler,

      members: {
        handleAction: function() {
          spy();
        },
        getDomElement: function() {
          return null;
        }
      }
    });
    cv.core.notifications.ActionRegistry.registerActionHandler("test", cv.test.ActionHandler);

    var message = {
      topic: "cv.test",
      title: "Title",
      message: "Test message",
      severity: "normal",
      actions: {
        test: [{
          needsConfirmation: false,
          deleteMessageAfterExecution: true
        }]
      }
    };
    center.handleMessage(message);
    cv.ui.NotificationCenter.performAction(center.__messages.getLength()-1);
    expect(spy).toHaveBeenCalled();
    cv.core.notifications.ActionRegistry.unregisterActionHandler("test");

    // message should have been deleted by action execution
    expect(center.__messages.getLength()).toEqual(0);
  });
});