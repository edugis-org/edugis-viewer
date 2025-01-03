import {LitElement, html, css, svg} from 'lit';
import './map-legend-item-edit';

class MapLegendCircle extends LitElement {
  static get styles() {
    return css`
    :host {
        display: block;
    }
    .container {
        display: flex;
        align-items: center;
    }
    .label {
        padding-left: 2px;
        cursor: pointer;
    }
    .bubblecontainer {
      display: block;
      position: relative;
    }
    .bubbles {
      position: relative;
      list-style: none;
      font-size: 0;
      color: var(--map-legend-label-color, #aaa);
      padding: 0;
      margin:
        var(--map-legend-margin, 0.75rem)
        calc(1.5 * var(--map-legend-margin, 0.75rem));
    }
	  .bubbles li {
      left: 50%;
      text-align: center;
    }
    .bubbles li + li {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
	  }
	  .bubbles li span {
      position: absolute;
      bottom: 100%;
      left: 0;
      width: 50%;
      margin-bottom: -1px;
      border-bottom: 1px solid var(--map-legend-bubble-stroke, #ccc);
      font-size: var(--map-legend-label-size, 0.65rem);
      padding-bottom: 0;
      line-height: 1em;
      text-align: left;
	  }
	  .bubbles li:nth-child(2n + 1) span {
      left: 50%;
      text-align: right;
    }
    .bubbles li::before {
        display: inline-block;
        content: '';
        height: calc(2 * var(--radius));
        width: calc(2 * var(--radius));
        border: 1px solid var(--map-legend-bubble-stroke, #ccc);
        background: var(--map-legend-bubble-background, #f8f8f8);
        border-radius: 50%;
     }`
    }
    static get properties() { 
        return { 
          title: {stype: String},
          items: {type: Object},
          layerid: {type: String},
          activeEdits: {type: Array}
        }; 
    }
    constructor() {
        super();
        this.title = "untitled";
        this.items = [];
        this.layerid = "";
        this.activeEdits = [];
    }
    _circleItem(color, strokeColor, strokeWidth, radius,label) {
        radius += strokeWidth/2; // svg has half of stroke inside circle, mapbox-gl outside circle
        const size = radius*2+2+strokeWidth;
        return svg`
            <svg width="${size}" height="${size}">
            <circle cx="${size/2}" cy="${size/2}" r="${radius}" style="fill:${color};stroke-width:${strokeWidth};stroke:${strokeColor}"/>
            </svg>${html`<span class="label">${label}</span>`}
          `
    }
    _eqSet(as, bs) {
      if (as.size !== bs.size) return false;
      for (var a of as) if (!bs.has(a)) return false;
      return true;
    }
    render() {
        const items = this.items;
        if (items.colorItems.length <= 1 && items.radiusItems.length <= 1) {
            const color = items.colorItems.length ? items.colorItems[0].paintValue : 'rgba(0,0,0,0)';
            const strokeColor = items.strokeColorItems.length ? items.strokeColorItems[0].paintValue : color;
            const strokeWidth = items.strokeWidthItems.length ? items.strokeWidthItems[0].paintValue : 0;
            const radius = items.radiusItems.length ? items.radiusItems[0].paintValue : 3;
            const label = items.colorItems.length ? items.colorItems[0].attrName: this.title;
            return html`
            <map-legend-item-edit 
                .visible=${this.activeEdits.includes(0)}
                @editActive="${this._editActive}"
                @change="${this._colorChanged}"
                @changeLineWidth="${this._outlineWidthChanged}"
                @changeLineColor="${this._outlineColorChanged}"
                @changeRadius="${this._radiusChanged}"
                legendItemType="circle" 
                .color=${color} 
                .lineWidth=${strokeWidth}
                lineColor=${strokeColor}
                radius=${radius}>
                <div class="container">${this._circleItem(color, strokeColor, strokeWidth, radius, label)}</div>
            </map-legend-item-edit>
            `
        }
        let result = [];
        let usedRadiusValues = new Set();
        if (items.colorItems.length > 1) {
            result.push(html`${items.colorItems[0].attrName}`);
            const coloredCircles = items.colorItems.map(({paintValue,attrValue}, itemIndex)=>{
                if (attrValue === undefined) {
                    return html``;
                }
                const colorAttrValue = attrValue;
                let strokeColor;
                switch (items.strokeColorItems.length) {
                    case 0:
                        strokeColor = paintValue;
                        break;
                    case 1:
                        strokeColor = items.strokeColorItems[0].paintValue;
                        break;
                    default:
                        const strokeColors = items.strokeColorItems.filter(({attrValue})=>attrValue===colorAttrValue);
                        if (strokeColors.length === 1) {
                            strokeColor = strokeColors[0].paintValue;
                        } else {
                            strokeColor = paintValue;
                        }
                }
                let strokeWidth;
                switch (items.strokeWidthItems.length) {
                    case 0:
                        strokeWidth = 1;
                        break;
                    case 1:
                        strokeWidth = items.strokeWidthItems[0].paintValue;
                        break;
                    default:
                        const strokeWidths = items.strokeWidthItems.filter(({attrValue})=>attrValue===colorAttrValue);
                        if (strokeWidths.length === 1) {
                            strokeWidth = strokeWidths[0].paintValue;
                        } else {
                            strokeWidth = 1;
                        }
                }
                let radius;
                switch (items.radiusItems.length) {
                    case 0:
                        radius = 3;
                        break;
                    case 1:
                        radius = items.radiusItems[0].paintValue;
                        break;
                    default:
                        const radiusWidths = items.radiusItems.filter(({attrValue})=>attrValue===colorAttrValue);
                        if (radiusWidths.length === 1) {
                            radius = radiusWidths[0].paintValue;
                            usedRadiusValues.add(colorAttrValue);
                        } else {
                            radius = 3;
                        }
                }
                //const label = attrExpression ? attrExpression === '==' ? attrValue : `${attrExpression} ${attrValue}` : attrValue;
                return html`<map-legend-item-edit 
                    .visible=${this.activeEdits.includes[itemIndex]}
                    @editActive="${this._editActive}"
                    @change="${this._colorChanged}"
                    @changeLineColor="${this._outlineColorChanged}"
                    @changeLineWidth="${this._outlineWidthChanged}"
                    @changeRadius="${this._radiusChanged}"
                    .itemIndex=${itemIndex} 
                    legendItemType="circle" 
                    .color=${paintValue}
                    .lineColor=${strokeColor}
                    .lineWidth=${strokeWidth}
                    .radius=${radius}>
                    <div class="container">${this._circleItem(paintValue, strokeColor, strokeWidth, radius, attrValue)}</div>
                </map-legend-item-edit>
                `
            });
            result.push(coloredCircles);
        }
        if (items.radiusItems.length > 1) {
            const allRadiusValues = new Set(items.radiusItems.filter(({attrValue})=>attrValue!==undefined).map(({attrValue})=>attrValue));
            if (!this._eqSet(allRadiusValues, usedRadiusValues)) {
              result.push(html`${items.radiusItems[0].attrName}`);
              const bgcolor = items.colorItems.length === 1 ? items.colorItems[0].paintValue : '#f8f8f8';
              const radii = items.radiusItems
                .filter(({attrName})=>attrName !== undefined)
                .sort((a,b)=>b.paintValue-a.paintValue)
                .map(({paintValue,attrValue})=>
                  html`<li style="--radius:${paintValue}px"><span>${attrValue}</span></li>`);
              result.push(html`<div class="bubblecontainer"><ul class="bubbles" style="--map-legend-bubble-background:${bgcolor}">${radii}</ul></div>`)
            }
        }
        return result;
    }
    firstUpdated() {

    }
    updated() {

    }
    _editActive(event) {
        if (event.detail.editActive) {
            this.activeEdits = this.activeEdits.concat(event.detail.itemIndex);
        } else {
            this.activeEdits = this.activeEdits.filter(index=>index !== event.detail.itemIndex);
        }
        this.dispatchEvent(new CustomEvent('activeEdits', {
            detail: {
                activeEdits: this.activeEdits,
                layerid: this.layerid
            }
        }));
    }
    _colorChanged(event) {
        const itemIndex = event.detail.itemIndex;
        const color = event.detail.color;
        this.items.colorItems[itemIndex].paintValue = color;
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                layerid: this.layerid,
                color: color,
                itemIndex: itemIndex
            }
        }));
        this.requestUpdate();
    }
    _outlineColorChanged(event) {
        const itemIndex = event.detail.itemIndex;
        const color = event.detail.color;
        if (this.items.strokeColorItems.length) {
            this.items.strokeColorItems[itemIndex].paintValue = color;
        } else {
            this.items.strokeColorItems.push({paintvalue: color});
        }
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                layerid: this.layerid,
                outlineColor: color,
                itemIndex: event.detail.itemIndex
            }
        }));
        this.requestUpdate();
    }
    _outlineWidthChanged(event) {
        const itemIndex = event.detail.itemIndex;
        const width = event.detail.width;
        if (this.items.strokeWidthItems.length) {
            this.items.strokeWidthItems[itemIndex].paintValue = width;
        } else {
            this.items.strokeWidthItems.push({paintValue: width});
        }
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                layerid: this.layerid,
                width: width,
                itemIndex: itemIndex
            }
        }));
        this.requestUpdate();
    }
    _radiusChanged(event) {
        const itemIndex = event.detail.itemIndex;
        const radius = event.detail.radius;
        this.items.radiusItems[itemIndex].paintValue = radius;
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                layerid: this.layerid,
                radius: radius,
                itemIndex: itemIndex
            }
        }));
        this.requestUpdate();
    }
}

customElements.define('map-legend-circle', MapLegendCircle);