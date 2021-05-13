/* ColorChooser.js 
 * 
 * copyright (c) 2010-2021, Christian Mayer and the CometVisu contributers.
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
 *
 */
qx.Class.define('cv.parser.widgets.ColorChooser', {
  type: "static",

  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {
    /**
     * Parses the widgets XML configuration and extracts the given information
     * to a simple key/value map.
     *
     * @param xml {Element} XML-Element
     * @param path {String} internal path of the widget
     * @param flavour {String} Flavour of the widget
     * @param pageType {String} Page type (2d, 3d, ...)
     */
    parse: function (xml, path, flavour, pageType) {
      let data = cv.parser.WidgetParser.parseElement(this, xml, path, flavour, pageType, this.getAttributeToPropertyMappings());
      cv.parser.WidgetParser.parseFormat(xml, path);
      cv.parser.WidgetParser.parseAddress(xml, path, this.makeAddressListFn);

      /*
    let datatype_min, datatype_max;
    Array.from(xml.children).filter(function(m){return m.matches("address");}).forEach(function(elem) {
      var transform = elem.getAttribute('transform');
      if (cv.Transform.registry[transform] && cv.Transform.registry[transform].range) {
        if (!( datatype_min > cv.Transform.registry[transform].range.min )) {// jshint ignore:line
          datatype_min = cv.Transform.registry[transform].range.min;
        }
        if (!( datatype_max < cv.Transform.registry[transform].range.max )) {// jshint ignore:line
          datatype_max = cv.Transform.registry[transform].range.max;
        }
      }
    });*/
      //var min = parseFloat(xml.getAttribute('min') || datatype_min || 0);
      //var max = parseFloat(xml.getAttribute('max') || datatype_max || 100);

      //data.min = min;
      //data.max = max;
      data.baseColors = { // default to sRGB color space with D65 white point
        r: {x: 0.64, y: 0.33, Y: 0.2126},
        g: {x: 0.30, y: 0.60, Y: 0.7152},
        b: {x: 0.15, y: 0.06, Y: 0.0722},
        w: {x: 0.3127, y: 0.3290, Y: 1}
      };
      console.log('parse', xml);
      let
        r_x          = xml.getAttribute('r_x'),
        r_y          = xml.getAttribute('r_y'),
        r_wavelength = xml.getAttribute('r_wavelength'),
        r_strength   = xml.getAttribute('r_strength'),
        r_curve      = xml.getAttribute('r_curve'),
        r_scale      = xml.getAttribute('r_scale'),
        g_x          = xml.getAttribute('g_x'),
        g_y          = xml.getAttribute('g_y'),
        g_wavelength = xml.getAttribute('g_wavelength'),
        g_strength   = xml.getAttribute('g_strength'),
        g_curve      = xml.getAttribute('g_curve'),
        g_scale      = xml.getAttribute('g_scale'),
        b_x          = xml.getAttribute('b_x'),
        b_y          = xml.getAttribute('b_y'),
        b_wavelength = xml.getAttribute('b_wavelength'),
        b_strength   = xml.getAttribute('b_strength'),
        b_curve      = xml.getAttribute('b_curve'),
        b_scale      = xml.getAttribute('b_scale'),
        w_x          = xml.getAttribute('w_x'),
        w_y          = xml.getAttribute('w_y'),
        w_strength   = xml.getAttribute('w_strength'),
        w_curve      = xml.getAttribute('w_curve'),
        w_scale      = xml.getAttribute('w_scale');

      if( r_wavelength ) {
        let xy = cv.util.Color.wavelength2xy(r_wavelength);
        data.baseColors.r.x = xy.x;
        data.baseColors.r.y = xy.y;
      }
      if( r_x ) { data.baseColors.r.x = parseFloat(r_x); }
      if( r_y ) { data.baseColors.r.y = parseFloat(r_y); }
      if( r_strength ) { data.baseColors.r.Y = parseFloat(r_strength); }
      data.baseColors.r.scale    = r_scale ? parseFloat(r_scale) : 100;
      switch (r_curve) {
        case 'exponential':
          data.baseColors.r.curve = 'exp';
          break;

        case 'logarithmic':
          data.baseColors.r.curve = 'log';
          break;

        case 'linear':
        case null:
          data.baseColors.r.curve = [1];
          break;

        default:
          data.baseColors.r.curve = r_curve.split(';').map(x=>parseFloat(x));
      }

      if( g_wavelength ) {
        let xy = cv.util.Color.wavelength2xy(g_wavelength);
        data.baseColors.g.x = xy.x;
        data.baseColors.g.y = xy.y;
      }
      if( g_x ) { data.baseColors.g.x = parseFloat(g_x); }
      if( g_y ) { data.baseColors.g.y = parseFloat(g_y); }
      if( g_strength ) { data.baseColors.g.Y = parseFloat(g_strength); }
      data.baseColors.g.scale    = g_scale ? parseFloat(g_scale) : 100;
      switch (g_curve) {
        case 'exponential':
          data.baseColors.g.curve = 'exp';
          break;

        case 'logarithmic':
          data.baseColors.g.curve = 'log';
          break;

        case 'linear':
        case null:
          data.baseColors.g.curve = [1];
          break;

        default:
          data.baseColors.g.curve = g_curve.split(';').map(x=>parseFloat(x));
      }

      if( b_wavelength ) {
        let xy = cv.util.Color.wavelength2xy(b_wavelength);
        data.baseColors.b.x = xy.x;
        data.baseColors.b.y = xy.y;
      }
      if( b_x ) { data.baseColors.b.x = parseFloat(b_x); }
      if( b_y ) { data.baseColors.b.y = parseFloat(b_y); }
      if( b_strength ) { data.baseColors.b.Y = parseFloat(b_strength); }
      data.baseColors.b.scale    = b_scale ? parseFloat(b_scale) : 100;
      switch (b_curve) {
        case 'exponential':
          data.baseColors.b.curve = 'exp';
          break;

        case 'logarithmic':
          data.baseColors.b.curve = 'log';
          break;

        case 'linear':
        case null:
          data.baseColors.b.curve = [1];
          break;

        default:
          data.baseColors.b.curve = b_curve.split(';').map(x=>parseFloat(x));
      }
      if( w_x ) { data.baseColors.w.x = parseFloat(w_x); }
      if( w_y ) { data.baseColors.w.y = parseFloat(w_y); }
      if( w_strength ) { data.baseColors.w.Y = parseFloat(w_strength); }
      data.baseColors.w.scale    = w_scale ? parseFloat(w_scale) : 100;
      switch (w_curve) {
        case 'exponential':
          data.baseColors.w.curve = 'exp';
          break;

        case 'logarithmic':
          data.baseColors.w.curve = 'log';
          break;

        case 'linear':
        case null:
          data.baseColors.w.curve = [1];
          break;

        default:
          data.baseColors.w.curve = w_curve.split(';').map(x=>parseFloat(x));
      }

      return data;
    },
    
    makeAddressListFn: function(src, transform, mode, variant) {
      return [true, variant];
    },

    getAttributeToPropertyMappings: function () {
      return {
        'controls': {'default': 'triangle'},
        'send_on_finish': {
          target: 'sendOnFinish',
          'default': false,
          transform: function(value) {
            return value === 'true';
          }
        }
      };
    }
  },

  defer: function (statics) {
    // register the parser
    cv.parser.WidgetParser.addHandler('colorchooser', statics);
  }
});
