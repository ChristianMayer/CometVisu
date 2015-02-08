/* trigger.js (c) 2012 by Christian Mayer [CometVisu at ChristianMayer dot de]
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

define( ['_common'], function( design ) {
  var basicdesign = design.basicdesign;
  
design.basicdesign.addCreator('trigger', {
  create: function( element, path, flavour, type ) {
    var 
      $e = $(element);
    
    // create the main structure
    var makeAddressListFn = function( src, transform, mode, variant ) {
      // Bit 0 = short, Bit 1 = button => 1|2 = 3 = short + button
      return [ true, variant == 'short' ? 1 : (variant == 'button' ? 2 : 1|2) ];
    }
    var ret_val = $( basicdesign.createDefaultWidget( 'trigger', $e, path, flavour, type, null, makeAddressListFn ) + '</div>' );
    // and fill in widget specific data
    var data = templateEngine.widgetDataInsert( path, {
      'sendValue'  : $e.attr('value' )                || 0,
      'shorttime'  : parseFloat($e.attr('shorttime')) || -1,
      'shortValue' : $e.attr('shortvalue')            || 0
    } );
    
    // create the actor
    var $actor = $('<div class="actor switchUnpressed"><div class="value"></div></div>');
    ret_val.append( $actor );
    
    // bind to user action
    var bindClickToWidget = templateEngine.bindClickToWidget;
    if ( data['bind_click_to_widget'] ) bindClickToWidget = data['bind_click_to_widget']==='true';
    var clickable = bindClickToWidget ? ret_val : $actor;
    basicdesign.createDefaultButtonAction( clickable, $actor, this.downaction, this.action );

    // initially setting a value
    basicdesign.defaultUpdate( undefined, data['sendValue'], ret_val, true, path );
    return ret_val;
  },
  downaction: function(event) {
     templateEngine.widgetDataGetByElement( this )['downtime'] = new Date().getTime();
  },
  action: function(event) {
    var 
      data  = templateEngine.widgetDataGetByElement( this );
    
    if( data.downtime )
    {
      var isShort = (new Date().getTime()) - data.downtime < data.shorttime;
      var bitMask = (isShort ? 1 : 2);
      for( var addr in data.address )
      {
        if (!(data.address[addr][1] & 2)) continue; // skip when write flag not set
        if (data.address[addr][2] & bitMask) {
          templateEngine.visu.write( addr, templateEngine.transformEncode( data.address[addr][0], isShort ? data.shortValue : data.sendValue ) );
        }
      }
    }
  }
});

}); // end define