/**
 * Unit tests for image widget
 *
 * @author Tobias Bräutigam
 * @since 2016
 */

define( ['jquery','TemplateEngine', '_common', 'widget_image'], function($, engine, design) {

  describe("testing a image widget", function() {
    var templateEngine = engine.getInstance();

    it("should test the image creator", function() {

      var creator = design.basicdesign.getCreator("image");

      var xml = $.parseXML("<root/>");
      var image = xml.createElement('image');
      var label = xml.createElement('label');
      label.appendChild(xml.createTextNode("Test"));
      image.appendChild(label);
      xml.documentElement.appendChild(image);
      var widget = $(creator.create(xml.firstChild.firstChild, 'id_0', null, 'image'));
      
      expect(widget).toHaveClass('image');
      expect(widget.find("div.label").text()).toBe('Test');

      var data = templateEngine.widgetDataGet('id_0');
      expect(data.path).toBe("id_0");
    });
  });
});