/* _common.js
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

define(['joose', 'lib/cv/role/HasAddress', 'lib/cv/Config'], function(joose, HasAddress, Config) {

  /**
   * This role provides the vlue transformation methods
   *
   * @class cv.role.Transform
   */
  Role("cv.role.Transform", {

    methods: {

      transformEncode : function(transformation, value) {
        var basetrans = transformation.split('.')[0];
        return transformation in Transform ? Transform[transformation]
          .encode(value) : (basetrans in Transform ? Transform[basetrans]
          .encode(value) : value);
      },

      transformDecode : function(transformation, value) {
        var basetrans = transformation.split('.')[0];
        return transformation in Transform ? Transform[transformation]
          .decode(value) : (basetrans in Transform ? Transform[basetrans]
          .decode(value) : value);
      }
    }
  });
});