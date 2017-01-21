/* Pagejump-spec.js 
 * 
 * copyright (c) 2010-2016, Christian Mayer and the CometVisu contributers.
 * 
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 3 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA
 */

/**
 * Unit tests for pagejump widget
 *
 */
describe("testing a pagejump widget", function() {
  var templateEngine = cv.TemplateEngine.getInstance();

  it("should test the pagejump creator", function() {

    var res = this.createTestWidgetString("pagejump", {'name': 'Testpage'}, "<label>Test</label>");
    var widget = qx.bom.Html.clean([res[1]])[0];
    expect(widget).toHaveClass('pagejump');
    expect(widget).toHaveLabel('Test');
    expect(widget).toHaveValue('Testpage');

    expect(res[0].getPath()).toBe("id_0");
    expect(res[0].getActiveScope()).toBe("target");
  });

  it("should test the pagejump creator with some extra settings", function() {

    var res = this.createTestWidgetString("pagejump", {
      'align': 'right',
      'flavour': 'potassium',
      'target': 'OtherPage',
      'path': 'ParentPage',
      'active_scope': 'path'
    }, '<layout colspan="6" rowspan="2"></layout>');
    var widget = qx.bom.Html.clean([res[1]])[0];

    expect(widget).toHaveClass('right');
    expect(widget).toHaveClass('innerrowspan');
    expect(widget).toHaveClass('flavour_potassium');

    expect(res[0].getPath()).toBe("id_0");
    expect(res[0].getTargetPath()).toBe("ParentPage");
    expect(res[0].getTarget()).toBe("OtherPage");
    expect(res[0].getAlign()).toBe("right");
    expect(res[0].getActiveScope()).toBe("path");
    expect(res[0].getColspan()).toBe(6);
    expect(res[0].getRowspanClass()).toBe("rowspan rowspan2");
  });

  it("should test the pagejump creator with infoaction embedded", function() {

    var res = this.createTestWidgetString("pagejump", {},
      '<widgetinfo><text>Test</text></widgetinfo>');
    var widget = qx.bom.Html.clean([res[1]])[0];

    expect(widget).toHaveClass('infoaction');
  });

  it("should trigger the pagejumps downaction", function() {

    var creator = this.createTestElement("pagejump", {
      'target': 'test'
    });
    cv.MessageBroker.getInstance().publish("setup.dom.finished");
    var actor = creator.getActor();
    qx.event.Registration.fireEvent(actor, "pointerdown", qx.event.type.Event, []);
    expect(actor).toHaveClass("switchPressed");

  });

  it("should trigger the pagejumps action", function() {
    spyOn(templateEngine, 'scrollToPage');

    var widget = this.createTestElement("pagejump", {
      'target': 'test'
    });
    cv.MessageBroker.getInstance().publish("setup.dom.finished");
    var actor = widget.getActor();
    expect(actor).toHaveClass("switchUnpressed");

    qx.event.Registration.fireEvent(actor, "tap", qx.event.type.Event, []);
    expect(templateEngine.scrollToPage).toHaveBeenCalledWith('test');
  });

  it("should trigger the pagejumps action with target path", function() {
    spyOn(templateEngine, 'scrollToPage');
    spyOn(templateEngine, 'getPageIdByPath').and.returnValue('id_1');

    var creator = this.createTestElement("pagejump", {
      'target': 'test',
      'path': 'path'
    });
    cv.MessageBroker.getInstance().publish("setup.dom.finished");
    var actor = creator.getActor();

    expect(actor).toHaveClass("switchUnpressed");

    qx.event.Registration.fireEvent(actor, "tap", qx.event.type.Event, []);
    expect(templateEngine.scrollToPage).toHaveBeenCalledWith('id_1');
  });

  it("should test the scrolltopage listener", function() {

  });
});