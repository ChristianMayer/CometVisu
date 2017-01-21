/* structure_plugin.js (c) 2010 by Christian Mayer [CometVisu at ChristianMayer dot de]
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
 * Use the Web Speech API (https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
 * to make text-to-speech service available. This plugin listens to a address and forwards the
 * incoming data to the browser TTS engine (if the browser supports it)
 *
 * @example <caption>Simple example</caption>
 * <speech lang="en">
 *  <address transform="OH:string" mode="read">Speak</address>
 * </speech>
 *
 * @example <caption>Example preventing repetition within a timeout and use mapping</caption>
 * ...
 * <meta>
 *  <plugins>
 *    <plugin name="speech" />
 *  </plugins>
 *  <mappings>
 *    <mapping name="speak">
 *      <entry value="0">Hello, welcome home</entry>
 *      <entry value="1">Please close all windows</entry>
 *      <entry value="2">Please close all doors</entry>
 *    </mapping>
 *  </mappings>
 * </meta>
 * ...
 * <speech lang="en" repeat-timout="300" mapping="speak">
 *  <address transform="DPT:5.010" mode="read">Speak</address>
 * </speech>
 *
 * @author Tobias Bräutigam
 * @since 0.10.0
 */
qx.Class.define('cv.plugin.speech.Main', {
  extend: cv.Object,
  include: cv.role.Update,

  /*
   ******************************************************
   CONSTRUCTOR
   ******************************************************
   */
  construct: function(props) {
    this.base(arguments);
    this.set(props);
    this.__lastSpeech = {};
  },


  /*
   ******************************************************
   STATICS
   ******************************************************
   */
  statics: {
    parse: function (element, path, flavour, pageType) {
      if (!window.speechSynthesis) {
        qx.log.Logger.warn("this browser does not support the Web Speech API");
        return;
      }

      var address = cv.role.HasAddress.makeAddressList(element, false, path);

      return templateEngine.setWidgetData( path, {
        'path'    : path,
        'language': qx.bom.element.Attribute.get(element, 'lang') ? qx.bom.element.Attribute.get(element, 'lang') .toLowerCase() : null,
        'address' : address,
        'mapping' : qx.bom.element.Attribute.get(element, 'mapping'),
        'repeatTimeout': qx.bom.element.Attribute.get(element, 'repeat-timeout') ? parseInt(qx.bom.element.Attribute.get(element, 'repeat-timeout')) : -1,
        '$$type'  : 'speech'
      });
    }
  },

  /*
   ******************************************************
   PROPERTIES
   ******************************************************
   */
  properties: {
    path              : { check: "String" },
    $$type            : { check: "String" },
    language          : { check: "String" },
    mapping           : { check: "String", init: "" },
    repeatTimeout     : { check: "Number", init: -1 }
  },

  /*
   ******************************************************
   MEMBERS
   ******************************************************
   */
  members: {
    __lastSpeech : null,

    _processIncomingValue: function(address, data) {
      return this.defaultValueHandling(address, data);
    },

    handleUpdate: function(text, address) {

      if (!templateEngine.visu.dataReceived) {
        // first call -> skipping
        this.__lastSpeech[address] = {
          text: text,
          time: Date.now()
        };
        this.debug("skipping initial TTS for "+text);
        return;
      }

      if (!text || text.length === 0) {
        // nothing to say
        this.debug("no text to speech given");
        return;
      }

      if (typeof text === "string" && text.substring(0,1) === "!") {
        // override repeatTimeout, force saying this
        text = substring(1);
      }
      else if (this.getRepeatTimeout() >= 0) {
        // do not repeat (within timeout when this.repeatTimeout > 0)
        if (this.__lastSpeech[address] && this.__lastSpeech[address].text == text && (this.getRepeatTimeout() === 0 ||
          this.getRepeatTimeout() >= Math.round((Date.now()-this.__lastSpeech[address].time)/1000))) {
          // update time
          this.__lastSpeech[address].time = Date.now();
          // do not repeat
          this.debug("skipping TTS because of repetition " + text);
          return;
        }
      }
      this.debug("changing lastSpeech from '%s' to '%s'", this.__lastSpeech[address] ? this.__lastSpeech[address].text : "", text);
      this.__lastSpeech[address] = {
        text: text,
        time: Date.now()
      };

      var synth = window.speechSynthesis;

      // speak
      var utterThis = new SpeechSynthesisUtterance(text);

      var selectedVoice, defaultVoice;
      var voices = synth.getVoices();
      for (var i = 0, l = voices.length; i < l; i++) {
        if (this.language && voices[i].lang.substr(0, 2).toLowerCase() === this.language) {
          selectedVoice = voices[i];
        }
        if (voices[i].default) {
          defaultVoice = voices[i];
        }
      }
      if (!selectedVoice) {
        selectedVoice = defaultVoice;
      }
      utterThis.voice = selectedVoice;
      this.debug("saying '%s' in voice %s", text, selectedVoice.name);
      synth.speak(utterThis);
    }
  },

  defer: function() {
    // register the parser
    cv.xml.Parser.addHandler("speech", cv.structure.pure.Speech);
  }
});
