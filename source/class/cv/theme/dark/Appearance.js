/* Appearance.js 
 * 
 * copyright (c) 2010-2017, Christian Mayer and the CometVisu contributers.
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



qx.Theme.define("cv.theme.dark.Appearance", {
  extend : osparc.theme.osparcdark.Appearance,

  appearances : {
    'open-file-item': {
      include: 'listitem',
      alias: 'listitem',

      style: function () {
        return {
          iconPosition: 'right',
          gap: 10,
          height: 25,
          padding: [0, 10],
          margin: 0,
          icon: osparc.theme.osparcdark.Image.URLS['tabview-close']
        };
      }
    },

    'list': {
      style: function () {
        return {
          decorator: null
        };
      }
    },

    'cv-editor-config': {
      style: function () {
        return {
          padding: 10
        };
      }
    },

    'cv-editor-config-section': {
      style: function () {
        return {
          padding: 10,
          decorator: 'cv-editor-config-section',
          marginBottom: 10
        };
      }
    },

    'cv-editor-config-option': {
      style: function () {
        return {
          marginBottom: 10
        };
      }
    },

    'cv-config-textfield': {
      include: 'textfield',
      alias: 'textfield',

      style: function () {
        return {
          minWidth: 300
        };
      }
    },

    'cv-editor-config-section/section-title': {
      style: function () {
        return {
          font: 'title',
          marginRight: 20
        };
      }
    },

    'cv-editor-config-section/options-title': 'cv-editor-config-section/section-title',
    'cv-editor-config-section/name': 'cv-config-textfield',
    'cv-editor-config-section/list': {
      include: 'list',
      alias: 'list',

      style: function() {
        return {
          height: null
        };
      }
    }
  }
});