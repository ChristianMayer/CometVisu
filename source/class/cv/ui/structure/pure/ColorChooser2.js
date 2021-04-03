/* ColorChooser2.js 
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
 * Adds a horizontal slider to the visu. This can be used, for example, to dim a light or change temperature values.
 *
 * @author Christian Mayer
 * @since 2012
 */
qx.Class.define('cv.ui.structure.pure.ColorChooser2', {
  extend: cv.ui.structure.AbstractWidget,
  include: [cv.ui.common.Operate, cv.ui.common.Update],

  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {
    /**
     * Calculate the saturation and value from (x,y) relative widget coordinates
     * based on a centered SV-triangle.
     * @param x position for the calculation
     * @param y position for the calculation
     * @param hue value for the orientation of the triangle
     * @param radius (outside) radius of the triangle
     */
    coord2sv: function( x, y, hue, radius ) {
      const hue2angle = 2 * Math.PI;
      let
        // coordinates of the triangle corners
        Sx = 0.5 - Math.sin( hue2angle * (   -hue) ) * radius, // 100% saturation
        Sy = 0.5 - Math.cos( hue2angle * (   -hue) ) * radius,
        Wx = 0.5 - Math.sin( hue2angle * (2/3-hue) ) * radius, // 100% white
        Wy = 0.5 - Math.cos( hue2angle * (2/3-hue) ) * radius,
        Bx = 0.5 - Math.sin( hue2angle * (1/3-hue) ) * radius, // 100% black
        By = 0.5 - Math.cos( hue2angle * (1/3-hue) ) * radius,
        // differences to determine (u,v) coordinates of (x,y)
        WSx = Wx - Sx,
        WSy = Wy - Sy,
        BSx = Bx - Sx,
        BSy = By - Sy,
        CSx = x - Sx,
        CSy = y - Sy,
        uv = cv.util.Color.solve2d(WSx, WSy, BSx, BSy, CSx, CSy),
        u = uv[0], v = uv[1],
        // convert (u,v) to S and V
        saturation = 1 - u - v,
        value      = (Math.abs(1 - saturation) < 1e-3) ? 0.5 : u / (1 - saturation);
      return [saturation, value];
    },
  },

  /*
  ******************************************************
    CONSTRUCTOR
  ******************************************************
  */
  construct: function(props) {
    this.base(arguments, props);
    this.__color = new cv.util.Color();
    this.__animator = new cv.util.LimitedRateUpdateAnimator(this.__updateHandlePosition, this);
    this.__pageSizeListener = cv.ui.layout.ResizeHandler.states.addListener('changePageSizeInvalid',()=>{this.__invalidateScreensize();});
  },
  /*
  ***********************************************
    DESTRUCTOR
  ***********************************************
  */
  destruct: function () {
    cv.ui.layout.ResizeHandler.states.removeListenerById(this.__pageSizeListener);
    this.__pageSizeListener = null;
    this.__button = null;
  },

  /*
  ******************************************************
    PROPERTIES
  ******************************************************
  */
  properties: {
    controls: {
      check: "String",
      //init: 'triangle'
    },
    baseColors: {
      check: "Object"
    },
    min: {
      check: "Number",
      init: 0
    },
    max: {
      check: "Number",
      init: 100
    },
    step: {
      check: "Number",
      init: 0.5
    },
    showInvalidValues: {
      check: "Boolean",
      init: false
    },
    sendOnFinish: {
      check: "Boolean",
      init: false
    }
  },

  /*
  ******************************************************
    MEMBERS
  ******************************************************
  */
  members: {
    __mode: '',
    __color: undefined,
    __lastBusValue: {},
    __animator: null,
    __button: undefined, // cache for DOM element
    __range: undefined,  // cache for DOM element
    __actors: undefined,
    __buttonWidth: undefined,
    __pageSizeListener: undefined,
    __inDrag: false,       // is the handle currently dragged?
    __coordMin: undefined, // minimal screen coordinate of slider
    __Tmin: 2000,   // minimal color temperature to show in slider
    __Tmax: 12500,  // maximal color temperature to show in slider

    // overridden
    _getInnerDomString: function () {
      var placeholder = this.getFormat() === '' ? '' : '-';
      //<div className="hue" style="position:absolute;width:100%;height:100%;border-radius:50%;background: conic-gradient(red, magenta, blue, aqua, lime, yellow, red)"></div>
      //-webkit-mask: radial-gradient(circle farthest-side,transparent calc(100% - 9px),#fff 0)
      //<div className="saturation" style="position:absolute;width:100%;height:100%;border-radius:50%;background: radial-gradient(circle closest-side, rgb(255, 255, 255), transparent)"></div>
      //<div className="sv_triangle"
      //     style="position: absolute;padding:10px;top:0;right:0;bottom:0;left:0;transform:rotate(0deg);">
      //  <div className="inner"
      //       style="width:100%;height:75%;-webkit-mask:conic-gradient(at 50% 0%, transparent,transparent 150deg,#fff 150deg,#fff 210deg,transparent 210deg);background:linear-gradient(210deg, transparent 45%, black 90%),linear-gradient(150deg, transparent 45%, white 90%),linear-gradient(45deg, #f00, #f00);Xtransform-origin: 50% 66.6667%;Xtransform: rotate(23deg)"></div>
      console.log('_getInnerDomString', this.getControls());
      let retval = '';
      this.getControls().split(';').forEach(function(control){
        switch(control) {
          case 'triangle':
            retval += `<div class="actor cc_wheel" style="position:relative;width:195px;height:195px;">
            <div class="hue"></div><div class="sv_triangle"><div class="inner"></div><div class="handle_hue"></div><div class="handle"></div></div></div>`
            break;
            
          case 'r':
          case 'g':
          case 'b':
          case 'w':
          case 'T':
          case 'h':
          case 's':
          case 'v':
            retval += '<div class="actor cc_' + control + ` ui-slider ui-slider-horizontal ui-widget ui-widget-content ui-corner-all" style="touch-action: pan-y;">
          <button class="ui-slider-handle ui-state-default ui-corner-all" draggable="false" unselectable="true" style="transform: translate3d(0px, 0px, 0px);">`+placeholder+`</button>
          <div class="ui-slider-range" style="margin-left: 0px; width: 0px;"></div>
        </div>`;
        }
      });
      return '<div class="actors">' + retval + '</div>';
    },

    // overridden
    _onDomReady: function() {
      this.base(arguments);

      this.__throttled = cv.util.Function.throttle(this.__onChangeValue, 250, {trailing: true}, this);

      //this.getActor().addEventListener('pointerdown', this);
      //this.getDomElement().querySelector('.actors').addEventListener('pointerdown', this);
      this.getDomElement().querySelectorAll('.actor').forEach(actor=>actor.addEventListener('pointerdown', this));
    },

    _update: function (address, data) {
      let transform = this.getAddress()[address].transform;
      if (this.__inDrag || this.__lastBusValue[transform] === data) {
        // slider in use -> ignore value from bus
        // internal state unchanged -> also do nothing
        return;
      }
      
      this.__lastBusValue = {}; // forget all other transforms as they might not be valid anymore
      this.__lastBusValue[transform] = data;

      let 
        value = cv.Transform.decode(transform, data),
        variant = this.getAddress()[ address ].variantInfo;
      
      switch( variant ) {
        case 'h':
        case 's':
        case 'v':
        case 'r':
        case 'g':
        case 'b':
          value /= 100;
          break;

        case 'hsv':
          value = { h: value.get('h')/100, s: value.get('s')/100, v: value.get('v')/100 };
          break;

        case 'rgb':
          value = { r: value.get('r')/100, g: value.get('g')/100, b: value.get('b')/100 };
          break;
      }
      
      // animate when visible, otherwise jump to the target value
      this.__setSliderTo(value, variant, !this.isVisible());
    },

    /**
     * The the internal slider state and its handle and displayed value
     * @param value {Number} The new value
     * @param variant {String} The color component to change
     * @param instant {Boolean} Animate or instant change
     * @param relaxDisplay {Boolean} Let the handle move to an unstable position
     *   to give visual feedback that something does happen during interaction
     * @private
     */
    __setSliderTo: function(value, variant, instant, relaxDisplay = false) {
      ///////////////////////
      //console.log('setSlider',value, variant, instant, relaxDisplay );
      this.__color.changeComponent( variant, value );
      this.__updateHandlePosition();
      return;
      ///////////////////////
      let min = this.getMin();
      let max = this.getMax();
      let step = this.getStep();
      if (step === 0 || Math.abs((max-min)/step) > 10000) {
        // limit too small step size - it's not necessary to have more than
        // 10000 steps for the range as even the biggest screen doesn't have
        // that many pixels
        step = (max-min)/10000;
      }
      let realValue = Math.min(Math.max(value, min), max);

      if (!this.getShowInvalidValues()) {
        // map to closest allowed value
        let stepValue = Math.round((realValue - min) / step) * step + min;
        // use max when the value is greater than the middle point between the
        // biggest allowed step and the maximum
        let maxSwitchValue = (Math.floor((max - min) / step) * step + min + max) / 2;
        realValue = realValue < maxSwitchValue ? stepValue : max;
      }

      let ratio = max===min ? 0 : (realValue-min)/(max-min);

      if (relaxDisplay) {
        let valueRatio = max===min ? 0 : (Math.min(Math.max(value, min), max)-min)/(max-min);
        let delta = ratio - valueRatio;
        let stepCount = (max - min) / step;
        let factor = (2*stepCount) ** 3;
        ratio -= Math.min(factor * delta**4, Math.abs(delta)) * Math.sign(delta);
      }

      // store it to be able to suppress sending of unchanged data
      this.setBasicValue(realValue);

      if (this.getFormat() !== '') {
        // #2: map it to a value the user wants to see
        let displayValue = this.applyMapping(realValue);

        // #3: format it in a way the user understands the value
        displayValue = this.applyFormat(undefined, displayValue);
        this.setValue(displayValue);

        this.applyStyling(realValue);

        let button = this.getDomElement().querySelector('button');
        this.defaultValue2DOM(displayValue, (e) => {button.innerHTML = e;});
      }

      this.__animator.setTo(ratio, true || instant);
    },

    __updateHandlePosition: function (ratio) {
      if (this.__actors === undefined || this.__buttonWidth === undefined) {
        /*
        let actor = this.getDomElement().querySelector('.actor');
        this.__actorWidth = parseFloat(window.getComputedStyle(actor).getPropertyValue('width'));
        this.__actorHeight = parseFloat(window.getComputedStyle(actor).getPropertyValue('height'));
        this.__innerRadius = parseFloat(window.getComputedStyle(actor.querySelector('.sv_triangle')).getPropertyValue('width'));
        this.__outerRadius = parseFloat(window.getComputedStyle(actor.querySelector('.hue')).getPropertyValue('width'));
        */
        let actors = {};
        this.getDomElement().querySelectorAll('.actor').forEach(function (actor){
          let type = actor.className.replace(/.*cc_([^ ]*).*/,'$1');
          switch(type) {
            case 'wheel':
              let actorStyle = window.getComputedStyle(actor);
              let sv_triangle = actor.querySelector('.sv_triangle');
              let inner = sv_triangle.querySelector('.inner');
              let handle = actor.querySelector('.handle');
              let hue = actor.querySelector('.hue');
              actors[type] = {
                sv_triangle: sv_triangle,
                inner: inner,
                handle: handle,
                width: parseFloat(actorStyle.getPropertyValue('width')),
                height: parseFloat(actorStyle.getPropertyValue('height')),
                innerRadius: parseFloat(window.getComputedStyle(sv_triangle).getPropertyValue('width')),
                outerRadius: parseFloat(window.getComputedStyle(hue).getPropertyValue('width'))
              };
              break;

            default:
              let button = actor.querySelector('button');
              let range = actor.querySelector('.ui-slider-range');
              actors[type] = {
                button: button,
                range: range,
                width: parseFloat(window.getComputedStyle(actor).getPropertyValue('width')),
                buttonWidth: parseFloat(window.getComputedStyle(button).getPropertyValue('width'))
              };
          }
        });
        this.__actors = actors;
      }
      for( let type in this.__actors ) {
        //console.log('iter',actor) ;
        let 
          actor = this.__actors[type],
          hsv = this.__color.getHSV();
        if( type === 'wheel' ) {
          let angle = (hsv.h*360)+'deg';
          actor.sv_triangle.style.transform='rotate('+angle+')';
          actor.inner.style.background = 'linear-gradient(210deg, transparent 45%, black 90%),linear-gradient(150deg, transparent 45%, white 90%),hsl('+angle+' 100% 50%)';
          actor.handle.style.top = (1-hsv.s) * 75 + '%';
          actor.handle.style.left = (50+(hsv.v-0.5)*(1-hsv.s) * 85) + '%';
        } else {
          let ratio = this.__color.getComponent(type);
          if( 'T' === type ) {
            ratio = (ratio - this.__Tmin)/(this.__Tmax - this.__Tmin);
          }
          let length = ratio * actor.width;
          actor.button.style.transform = 'translate3d(' + (length-actor.buttonWidth/2) + 'px, 0px, 0px)';
          actor.range.style.width = length + 'px';
        }
      }
      
      //////
      let rgb = this.__color.getRGB();
      this.__parentWidget__P_101_0.getWidgetElement().querySelector('.label').style.backgroundColor = 'rgb('+rgb.r*100+'% '+rgb.g*100+'% '+rgb.b*100+'%)';
      /////
      
      //console.log('__updateHandlePosition', this.__color);
      /*
      let element = this.getDomElement();
      console.log(element );
      let sv_triangle = element.querySelector('.sv_triangle');
      let inner = sv_triangle.querySelector('.inner');
      let handle = element.querySelector('.handle');
      let angle = (this.__color.h*360)+'deg';
      sv_triangle.style.transform='rotate('+angle+')';
      inner.style.background = 'linear-gradient(210deg, transparent 45%, black 90%),linear-gradient(150deg, transparent 45%, white 90%),hsl('+angle+' 100% 50%)';
      handle.style.top = (1-this.__color.s) * 75 + '%';
      handle.style.left = (50+(this.__color.v-0.5)*(1-this.__color.s) * 85) + '%';
       */
      
      //let x = 0;
      //let y = 0;
      //handle.style.transform = 'translate('+x+'px'+y+'px)';
      ///////////
      /*
      if (this.__button === undefined) {
        let element = this.getDomElement();
        this.__button = element.querySelector('button');
        this.__range = element.querySelector('.ui-slider-range');
      }
      if (this.__button === null) {
        // most likely reason: the widget / DOM tree was deleted (e.g. due to
        // browsing to a new page or during unit tests)
        this._disposeObjects('__animator');
        return;
      }*/
      /*
      let length = ratio * this.__actorWidth;
      this.__button.style.transform = 'translate3d(' + (length-this.__buttonWidth/2) + 'px, 0px, 0px)';
      this.__range.style.width = length + 'px';
       */
    },

    __invalidateScreensize: function () {
      let min = this.getMin();
      let max = this.getMax();
      this.__actors = undefined; // invalidate cached values
      this.__animator.setTo(max===min ? 0 : (this.getBasicValue()-min)/(max-min), true /* tmp */);
    },

    handleEvent: function (event) {
      let relCoordX = 0;
      let relCoordY = 0;

      switch(event.type) {
        case 'pointerdown':
          document.addEventListener('pointermove', this);
          document.addEventListener('pointerup', this);
          let actorType = event.currentTarget.className.replace(/.*cc_([^ ]*).*/,'$1');
          let boundingRect = event.currentTarget.getBoundingClientRect();
          let computedStyle = window.getComputedStyle(event.currentTarget);
          this.__coordMinX = boundingRect.left + parseFloat(computedStyle.paddingLeft);
          this.__coordMinY = boundingRect.top + parseFloat(computedStyle.paddingTop);
          relCoordX = (event.clientX - this.__coordMinX)/this.__actors[actorType].width;
          relCoordY = (event.clientY - this.__coordMinY)/this.__actors[actorType].height;
          if( actorType === 'wheel' ) {
            let radius = this.__actors.wheel !== undefined ? (0.5 * this.__actors.wheel.innerRadius / this.__actors.wheel.outerRadius) : 1;
            let sv=cv.ui.structure.pure.ColorChooser2.coord2sv(relCoordX,relCoordY,this.__color.getHSV().h,radius);
            if( 0<=sv[0] && sv[0]<=1 && 0<=sv[1] && sv[1]<=1 ) {
              this.__mode = 'wheel_sv';
              this.__color.changeComponent('sv', sv);
              this.__inDrag = true;
            } else {
              let distSqrd = (relCoordX-0.5)**2 + (relCoordY-0.5)**2;
              console.log(distSqrd,relCoordX,relCoordY,radius**2);
              if( radius**2 < distSqrd && distSqrd < 0.5**2 ) {
                this.__mode = 'wheel_h';
                this.__color.changeComponent('h', 0.5 + Math.atan2(-relCoordX + 0.5, relCoordY - 0.5) / 2/Math.PI );
                this.__inDrag = true;
              }
            }
          } else {
            let ratio = relCoordX;
            if( 'T' === actorType ) {
              ratio = this.__Tmin + ratio * (this.__Tmax - this.__Tmin);
            }
            this.__mode = actorType;
            this.__color.changeComponent(actorType, ratio);
            this.__inDrag = true;
          }
          break;

        case 'pointermove':
          if (!this.__inDrag) {
            return;
          }
          if( event.buttons === 0 ) { // move with no button could only happen during debug sessions
            this.__inDrag = false;
            document.removeEventListener('pointermove', this);
            document.removeEventListener('pointerup', this);
          }
          let type = this.__mode.substr(0,5); // clamp "wheel_*" to "wheel"
          relCoordX = (event.clientX - this.__coordMinX)/this.__actors[type].width;
          relCoordY = (event.clientY - this.__coordMinY)/this.__actors[type].height;
          break;

        case 'pointerup':
          this.__inDrag = false;
          document.removeEventListener('pointermove', this);
          document.removeEventListener('pointerup', this);
          console.log('pointermove -> removeEventListener', this);
          type = this.__mode.substr(0,5); // clamp "wheel_*" to "wheel"
          relCoordX = (event.clientX - this.__coordMinX)/this.__actors[type].width;
          relCoordY = (event.clientY - this.__coordMinY)/this.__actors[type].height;
          break;
      }

      //console.log(event.type,relCoordX,relCoordY,this.__mode);
      if(event.type !== 'pointerdown') {
        switch (this.__mode) {
          case 'wheel_sv':
            let radius = this.__actors.wheel !== undefined ? (0.5 * this.__actors.wheel.innerRadius / this.__actors.wheel.outerRadius) : 1;
            let sv = cv.ui.structure.pure.ColorChooser2.coord2sv(relCoordX, relCoordY, this.__color.getHSV().h, radius);
            //this.__color.s = Math.min( Math.max(sv[0], 0), 1 );
            //this.__color.v = Math.min( Math.max(sv[1], 0), 1 );
            this.__color.changeComponent('sv', [Math.min(Math.max(sv[0], 0), 1), Math.min(Math.max(sv[1], 0), 1)]);
            break;
          case 'wheel_h':
            //this.__color.h = 0.5 + Math.atan2(-relCoordX + 0.5, relCoordY - 0.5) / 2/Math.PI;
            this.__color.changeComponent('h', 0.5 + Math.atan2(-relCoordX + 0.5, relCoordY - 0.5) / 2 / Math.PI);
            break;
          case 'T':
            this.__color.changeComponent('T', this.__Tmin + Math.max(0, Math.min(relCoordX, 1)) * (this.__Tmax - this.__Tmin) );
            break;
          default:
            this.__color.changeComponent(this.__mode, relCoordX);
        }
      }
      ////newRatio = 0;//Math.min(Math.max(newRatio, 0.0), 1.0); // limit to 0..1
      ////let newValue = this.getMin() + newRatio * (this.getMax() - this.getMin());
      //this.__setSliderTo(newValue, this.__inDrag, this.__inDrag);
      this.__updateHandlePosition();
      if (!this.getSendOnFinish() || event.type === 'pointerup') {
        this.__throttled.call();
      }
    },

    __onChangeValue: function() {
      console.log('__onChangeValue');
      //this.__lastBusValue = this.sendToBackend(value, false, this.__lastBusValue );
    }
  },

  defer: function(statics) {
    cv.ui.structure.WidgetFactory.registerClass("colorchooser2", statics);
  }
});
