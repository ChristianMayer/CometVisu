/* Roundbar.js
 * 
 * copyright (c) 2010-2020, Christian Mayer and the CometVisu contributers.
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
 * Adds a display to the visu that can represent values from the BUS
 * and shows them with a round bar.
 *
 * @widgetexample <settings>
 *   <caption>Show temperature in degree celcius</caption>
 *   <screenshot name="roundbar_temp">
 *     <data address="0/0/0">19</data>
 *   </screenshot>
 * </settings>
 * <roundbar format="%.1f °C">
 *   <label>outside temperature</label>
 *   <address transform="DPT:9.001">0/0/0</address>
 * </roundbar>
 *
 * @author Christian Mayer
 * @since 0.12.0 (2020)
 */
qx.Class.define('cv.ui.structure.pure.Roundbar', {
  extend: cv.ui.structure.AbstractWidget,
  include: cv.ui.common.Update,

  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {
    coord: function(position) {
      return position.x.toFixed(1) + ' ' + position.y.toFixed(1);
    },
    /**
     * Create the SVG path for the round bar.
     * Angle = 0 === horizontal on the right
     */
    createBarPath: function(startAngle, startArrowPoint, endAngle, endArrowPoint, radius, width, getBBox) {
      var
        startArrowPointAngle = startAngle + startArrowPoint,
        endArrowPointAngle   = endAngle + endArrowPoint;

      var
        clockwise   = startAngle > endAngle ? 1 : 0,
        rI  = radius,
        rIM = radius + width*1/4,
        rM  = radius + width*2/4,
        rMO = radius + width*3/4,
        rO  = radius + width,
        startInner  = {x: Math.cos(startAngle             )*rI, y: -Math.sin(startAngle             )*rI},
        startMiddle = {x: Math.cos(startArrowPointAngle   )*rM, y: -Math.sin(startArrowPointAngle   )*rM},
        startOuter  = {x: Math.cos(startAngle             )*rO, y: -Math.sin(startAngle             )*rO},
        centerInner = {x: Math.cos((startAngle+endAngle)/2)*rI, y: -Math.sin((startAngle+endAngle)/2)*rI},
        centerOuter = {x: Math.cos((startAngle+endAngle)/2)*rO, y: -Math.sin((startAngle+endAngle)/2)*rO},
        endInner    = {x: Math.cos(endAngle               )*rI, y: -Math.sin(endAngle               )*rI},
        endMiddle   = {x: Math.cos(endArrowPointAngle     )*rM, y: -Math.sin(endArrowPointAngle     )*rM},
        endOuter    = {x: Math.cos(endAngle               )*rO, y: -Math.sin(endAngle               )*rO},
        startMiddleFlag = Math.abs(startAngle - startArrowPointAngle)   > Math.PI ? 1 : 0,
        startEndFlag    = Math.abs(startAngle - endAngle            )/2 > Math.PI ? 1 : 0,
        endMiddleFlag   = Math.abs(endAngle   - endArrowPointAngle  )   > Math.PI ? 1 : 0,
        startMiddleDir  = startAngle < startArrowPointAngle ? 1 : 0,
        endMiddleDir    = endAngle   < endArrowPointAngle   ? 1 : 0;

        function coord(position) {
        return position.x.toFixed(1) + ' ' + position.y.toFixed(1);
      }
      function arc(start, end, r, flag, cw) {
        return (start.x===end.x) && (start.y===end.y)
          ? ''
          : (Math.abs(start.x-end.x)+Math.abs(start.y-end.y) < 2)
            ? 'L' + coord(end)
            : ['A', r, r, 0, flag, cw, coord(end)].join(' ');
      }

      if (getBBox) {
        var
          rMax = Math.max(rI, rO),
          isInside = function(a) {return  (startAngle < a && a < endAngle) || (startAngle > a && a > endAngle);},
          rMiddle = isInside(-Math.PI*4/2) || isInside(Math.PI*0/2) ?  rMax : startInner.x,
          uMiddle = isInside(-Math.PI*3/2) || isInside(Math.PI*1/2) ? -rMax : startInner.y,
          lMiddle = isInside(-Math.PI*2/2) || isInside(Math.PI*2/2) ? -rMax : startInner.x,
          dMiddle = isInside(-Math.PI*1/2) || isInside(Math.PI*3/2) ?  rMax : startInner.y;
        return {
          u: Math.min(startInner.y, startMiddle.y, startOuter.y, endInner.y, endMiddle.y, endOuter.y, uMiddle),
          d: Math.max(startInner.y, startMiddle.y, startOuter.y, endInner.y, endMiddle.y, endOuter.y, dMiddle),
          l: Math.min(startInner.x, startMiddle.x, startOuter.x, endInner.x, endMiddle.x, endOuter.x, lMiddle),
          r: Math.max(startInner.x, startMiddle.x, startOuter.x, endInner.x, endMiddle.x, endOuter.x, rMiddle)
        };
      }

      if( width < 1.0 ) {
        return [
          'M', coord(startOuter),
          arc(startOuter, centerOuter, rO, startEndFlag, clockwise),
          arc(centerOuter, endOuter, rO, startEndFlag, clockwise)
        ].join(' ');
      }

      return ['M', coord(startInner),
        startArrowPointAngle === startAngle
          ? 'L' + coord(startOuter)
          : arc(startInner, startMiddle, rIM, startMiddleFlag, 1-startMiddleDir) +
            arc(startMiddle, startOuter, rMO, startMiddleFlag, startMiddleDir),
        arc(startOuter , centerOuter, rO, startEndFlag, clockwise),
        arc(centerOuter, endOuter   , rO, startEndFlag, clockwise),
        endArrowPointAngle === endAngle
          ? 'L' + coord(endInner)
          : arc(endOuter, endMiddle, rMO, endMiddleFlag, 1-endMiddleDir) +
            arc(endMiddle, endInner, rIM, endMiddleFlag, endMiddleDir),
        arc(startInner , centerInner, rI, startEndFlag, 1-clockwise),
        arc(centerInner, startInner , rI, startEndFlag, 1-clockwise),
        'Z'
      ].join(' ');
    },
    createIndicatorPath: function(angle, p) {
      var
        s = Math.sin(angle),
        c = Math.cos(angle),
        wx = c * p.width,
        wy = s * p.width;

      if(p.thickness > 0) {
        var
          tx = -s * p.thickness/2,
          ty =  c * p.thickness/2;
        return [
          'M', this.coord({x:c*p.radius+wx-tx,y: -(s*p.radius+wy-ty)}),
          'L', this.coord({x:c*p.radius      ,y: -(s*p.radius      )}),
          'L', this.coord({x:c*p.radius+wx+tx,y: -(s*p.radius+wy+ty)})
        ].join(' ');
      } else {
        return [
          'M', this.coord({x:c*p.radius   ,y: -(s*p.radius   )}),
          'L', this.coord({x:c*p.radius+wx,y: -(s*p.radius+wy)})
        ].join(' ');
      }
    }
  },

  /*
   ******************************************************
   PROPERTIES
   ******************************************************
   */
  properties: {
    type: { check: "Array" },
    indicators: { check: "Array" },

    min: { check: "Number" },
    max: { check: "Number" },
    axisradius: { check: "Number" },
    axiswidth: { check: "Number" },
    axiscolor: { check: "String" },
    ranges: { check: "Array" },
    minorradius: { check: "Number" },
    minorwidth: { check: "Number" },
    minorspacing: { check: "String" },
    minorcolor: { check: "String" },
    majorradius: { check: "Number" },
    majorwidth: { check: "Number" },
    majorposition: { check: "String" },
    majorcolor: { check: "String" },
    start: { check: "Number" },
    end: { check: "Number" },
    arrowtype: { check: "Number" },
    radius: { check: "Number" },
    width: { check: "Number" },
    spacing: { check: "Number" },
    overflowarrow: { check: "Boolean" },
    fontsize: { check: "Number" },
    textx: { check: "Number" },
    texty: { check: "Number" },
    textlength: { check: "Number" },
    textanchor: { check: "String" },
    linespace: { check: "Number" },
    bboxgrow: { check: "Number" },
    debug: { check: "Boolean" },
    currentRatioValue: { check: "Array", init: [] },
    targetRatioValue: { check: "Array", init: [] }
  },

  /*
  ******************************************************
    MEMBERS
  ******************************************************
  */
  members: {
    // overridden
    _getInnerDomString: function () {
      function bboxAdd(bbox, x, y) {
        if (bbox.u > y) { bbox.u = y; }
        if (bbox.d < y) { bbox.d = y; }
        if (bbox.l > x) { bbox.l = x; }
        if (bbox.r < x) { bbox.r = x; }
        return bbox;
      }

      this.setCurrentRatioValue(Array(this.getIndicators().length).fill(0));
      this.setTargetRatioValue(Array(this.getIndicators().length).fill([0,false,false]));

      var
        self = this,
        s = this.getStart(),
        e = this.getEnd(),
        min = this.getMin(),
        max = this.getMax(),
        cntValues = 0,
        svgMajor = '',
        svgMinor = '',
        svgRanges = '',
        svgIndicators = '',
        svgText = '',
        createBarPath = cv.ui.structure.pure.Roundbar.createBarPath;

      var
        rMax = this.getAxisradius()+this.getAxiswidth(),
        sMax = 0,
        eMax = 0;
      this.getIndicators().forEach(function (indicator) {
        rMax = Math.max(rMax, indicator.radius, indicator.radius+indicator.width);
        sMax = Math.max(sMax, indicator.startarrow);
        eMax = Math.max(eMax, indicator.endarrow);
      });
      var BBox = createBarPath(
        s,
        sMax,
        e,
        eMax,
        rMax,
        0,
        true
      );

      if (this.getMinorwidth() > 0) {
        var
          spacing = parseFloat(this.getMinorspacing()),
          rIn = this.getMinorradius(),
          rOut = this.getMinorwidth() + rIn;

        if (/^[0-9]+%/.test(this.getMinorspacing())) { // special case: percentage
          spacing = (max-min) * spacing / 100;
        }

        svgMinor += '<path class="minor" d="';
        for (var angle=s, delta = (e-s)*spacing/(max-min), cnt=(max-min)/spacing; cnt >= 0; angle+=delta,cnt--) {
          var
            sin = Math.sin(angle),
            cos = Math.cos(angle);
          svgMinor += [
            'M', (cos*rIn ).toFixed(1), (-sin*rIn ).toFixed(1),
            'L', (cos*rOut).toFixed(1), (-sin*rOut).toFixed(1)
          ].join(' ');

          BBox = bboxAdd(BBox, cos*rIn , -sin*rIn );
          BBox = bboxAdd(BBox, cos*rOut, -sin*rOut);
        }
        if (this.getMinorcolor() !== '') svgMinor += '" style="stroke:' + this.getMinorcolor();
        svgMinor += '" />';
      }

      if (this.getMajorwidth() > 0) {
        var
          rIn = this.getMajorradius(),
          rOut = this.getMajorwidth() + rIn;

        svgMajor += '<path class="major" d="';

        this.getMajorposition().split(';').forEach(function (position) {
          switch (position) {
            case 'min':
              position = min;
              break;

            case 'max':
              position = max;
              break;
          }
          var
            angle = s+(e-s)*(position-min)/(max-min),
            sin = Math.sin(angle),
            cos = Math.cos(angle);
          svgMajor += [
            'M', (cos*rIn ).toFixed(1), (-sin*rIn ).toFixed(1),
            'L', (cos*rOut).toFixed(1), (-sin*rOut).toFixed(1)
          ].join(' ');

          BBox = bboxAdd(BBox, cos*rIn , -sin*rIn );
          BBox = bboxAdd(BBox, cos*rOut, -sin*rOut);
        });
        if (this.getMajorcolor() !== '') svgMajor += '" style="stroke:' + this.getMajorcolor();
        svgMajor += '" />';
      }

      this.getRanges().forEach(function (range) {
        var
          sRange = (e-s)*(range.start-min)/(max-min)+s,
          eRange = (e-s)*(range.end  -min)/(max-min)+s,
          rRange = range.radius || self.getAxisradius(),
          wRange = range.width  || self.getAxiswidth(),
          thisBBox = createBarPath(sRange,0,eRange,0,rRange,wRange, true);
        svgRanges += '<path class="range" d="';
        svgRanges += createBarPath(sRange,0,eRange,0,rRange,wRange);
        if (range.style) {
          svgRanges += '" style="' + range.style;
        }
        svgRanges += '" />';

        BBox = bboxAdd(BBox, thisBBox.l, thisBBox.u);
        BBox = bboxAdd(BBox, thisBBox.r, thisBBox.d);
      });

      this.getIndicators().forEach(function (indicator) {
        svgIndicators += '<path class="indicator" style="' + indicator.style + '" />';

        if (indicator.showValue) { cntValues++; }
      });

      if (cntValues>0) {
        svgText += '<text class="value" y="'+this.getTexty()+'"'
          + ' text-anchor="' + this.getTextanchor() +'"'
          + ' font-size="' + this.getFontsize() + '">'
          + '<tspan x="'+this.getTextx()+'" dy="0">-</tspan>'
          + ('<tspan x="'+this.getTextx()+'" dy="' + this.getLinespace() + '">-</tspan>').repeat(cntValues-1)
          + '</text>';

        var
          textDistribution = ({start:[0,1],middle:[0.5,0.5],end:[1,0]})[this.getTextanchor()] || [0,1],
          textU = Math.min(0, -this.getFontsize(), this.getLinespace()*(cntValues-1)-(this.getLinespace()<0?this.getFontsize():0)),
          textD = Math.max(0, -this.getFontsize(), this.getLinespace()*(cntValues-1)-(this.getLinespace()<0?this.getFontsize():0));
        BBox = bboxAdd(BBox, this.getTextx()-textDistribution[0]*this.getTextlength(), this.getTexty()+textU);
        BBox = bboxAdd(BBox, this.getTextx()+textDistribution[1]*this.getTextlength(), this.getTexty()+textD);
      }

      var html = '<div class="actor">'
        + '<svg width="100%" height="100%" viewBox="' + [
          BBox.l - this.getBboxgrow(),
          BBox.u - this.getBboxgrow(),
          BBox.r - BBox.l + 2*this.getBboxgrow(),
          BBox.d - BBox.u + 2*this.getBboxgrow()
        ].join(' ') + '">';
      if(this.getDebug()) {
        html += '<rect width="'+(BBox.r-BBox.l)+'" height="'+(BBox.d-BBox.u)+'" x="'+(BBox.l)+'" y="'+(BBox.u)+'" stroke="blue" />'
          + '<circle cx="0" cy="0" r="3" fill="red" />';
      }

      if (this.getAxisradius() > 0) {
        var
          sectorPath = createBarPath(s,0,e,0,this.getAxisradius(),0),
          axisPath = createBarPath(s,0,e,0,this.getAxisradius(),this.getAxiswidth()),
          stroke = this.getAxiscolor() === '' ? undefined : this.getAxiscolor(),
          fill   = this.getAxiswidth() < 1 ? 'none' : stroke;
        html +=
          '<path class="sector" d="'+sectorPath+' L0 0Z"/>' +
          '<path class="axis" d="'+axisPath+'" style="' +
          (stroke ? 'stroke:'+stroke : '') +
          (fill   ? ';fill:' +fill   : '') +
          '"/>';
      }

      html += svgMinor + svgMajor + svgRanges + svgIndicators + svgText;
      html += '</svg></div>';

      return html;
    },

    /**
     * Updates the roundbar widget
     *
     * @param address {String} KNX-GA or openHAB item name
     * @param data {var} incoming data
     */
    _update: function(address, data) {
      if (data === undefined || address === undefined) { return; }
      var
        value = cv.Transform.decode( this.getAddress()[ address ][0], data ),
        target = this.getTargetRatioValue(),
        tspan =  Array.from(this.getDomElement().getElementsByTagName('tspan')),
        valueFormat = this.applyFormat(address, value);

      this.getIndicators().forEach(function(indicator,i){
        if(address === indicator.address) {
          target[i] = [
            (Math.min(Math.max(value,indicator.min),indicator.max)-indicator.min)/(indicator.max-indicator.min),
            value < indicator.min,
            value > indicator.max
          ];
          if(tspan[i]!==undefined) tspan[i].textContent = valueFormat;
        }
      });

      this.setTargetRatioValue(target);

      var
        indicators =  Array.from(this.getDomElement().getElementsByClassName('indicator'));

      if(true || !this.animationFrame) {
        // TODO only animate when widget is visible
        this.animateIndicators(indicators,false);
      }
    },

    /**
     * Update the display of the indicators.
     *
     * @param indicatorElements Array with the bars to modify
     * @param jumpToTarget skip animation
     */
    animateIndicators: function (indicatorElements, jumpToTarget) {
      var
        current = this.getCurrentRatioValue(),
        target = this.getTargetRatioValue(),
        indicators = this.getIndicators();

      // current is already at target
      if( current.every(function(this_i,i){return this_i === target[i][0];}) ) {
        this.animationFrame = 0;
        return; // then nothing to do
      }
      var
        finished = true,
        startAngle = this.getStart(),
        endAngle = this.getEnd(),
        arrowType = this.getArrowtype(),
        overflowarrow = this.getOverflowarrow();

      // calculate new values to show by applying two types of rate limiting:
      // first do an exponential smoothing and then limit that to stay in range
      var expSmoothing = 0.2;
      var rateLimit = 0.05;
      indicatorElements.forEach(function(indicator,i){
        if( jumpToTarget===true || Math.abs(current[i] - target[i][0]) < 0.01 ) {
          current[i] = target[i][0];
        } else {
          finished = false;
          var expSmoothedValue = current[i] * (1-expSmoothing) + target[i][0] * expSmoothing;
          if( current[i] > expSmoothedValue ) {
            current[i] = current[i]-expSmoothedValue > rateLimit ? current[i]-rateLimit : expSmoothedValue;
          } else {
            current[i] = current[i]-expSmoothedValue < -rateLimit ? current[i]+rateLimit : expSmoothedValue;
          }
        }

        var targetAngle = startAngle + current[i]*(endAngle-startAngle);
        if (!overflowarrow) {
          targetAngle = Math.max(startAngle,targetAngle - indicators[i].endarrow);
        }

        if (indicators[i].isBar) {
          indicator.setAttribute('d',
            cv.ui.structure.pure.Roundbar.createBarPath(
              startAngle,
              (overflowarrow&&!(target[i][1]&&current[i]<0.01)) ? 0 : indicators[i].startarrow,
              targetAngle,
              (overflowarrow&&!(target[i][2]&&current[i]>0.99)) ? 0 : indicators[i].endarrow,
              indicators[i].radius,
              indicators[i].width
            )
          );
        } else {
          indicator.setAttribute('d',
            cv.ui.structure.pure.Roundbar.createIndicatorPath(
              targetAngle,
              indicators[i]
            )
          );
        }
      });
      this.setCurrentRatioValue(current);

      if (!finished) {
        this.animationFrame = window.requestAnimationFrame(this.animateIndicators.bind(this,indicatorElements,false));
      }
    }
  }
});

