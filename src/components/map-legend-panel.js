/* map-legend-panel
   Visual container that displays the layer legend or a message that no legend is available.
   If the layer style is editable, this container also provides buttons to access layer-legend edit dialogs
*/

import {LitElement, html, svg, css} from 'lit';
import mbStyleParser from '../utils/mbox-style-parse.js';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n.js';
//import MbStyleParser2 from '../utils/mbox-style-parse2.js'
import './map-legend-item-edit';
import './map-legend-line';
import './map-legend-fill';
import './map-legend-circle';
import './map-legend-symbol';

/**
* @polymer
* @extends HTMLElement
*/
class MapLegendPanel extends LitElement {
  static get properties() { 
    return { 
      legendurl: {type: String},
      zoom: {type: Number},
      maplayer: {type: Object},
      transparency: {type: Number},
      updatelegend: { type: Number},
      activeEdits: {type: Object}
    }; 
  }
  static get styles() {
    return css `
      :host {
        display: block;
      }
      .legendcontainer {
        text-align: left;
        padding-left: 5px;
        background: white;
        overflow: hidden;
      }
      .legendcontainer img {
        max-width: calc(100% - 3px);
      }
      .hidden {
        display: none;
      }`
  }
  constructor() {
      super();
      this.transparency = 0;
      this.updatelegend = 0;
      this.activeEdits = {};
  }
  connectedCallback() {
    super.connectedCallback()
    this.languageChanged = this.languageChanged.bind(this);
    registerLanguageChangedListener(this.languageChanged);
  }
  disconnectedCallback() {
    super.disconnectedCallback()
    unregisterLanguageChangedListener(this.languageChanged);
  }
  languageChanged() {
    this.requestUpdate();
  }
  shouldUpdate(changedProperties) {
    if (changedProperties.has('maplayer')) {
      if (this.maplayer && this.maplayer.metadata && this.maplayer.hasOwnProperty('transparency')) {
        this.transparency = this.maplayer.metadata.transparency;
      } else {
        // this.transparency = 0;
      }
    }
    return true;
  }
  _legendReady() {
    this.dispatchEvent(new CustomEvent('load', {}));
  }
  fixedLegend(maplayer)
  {
    if (maplayer.metadata && maplayer.metadata.legendurl) {
      return html`<img @load="${()=>this._legendReady()}" src="${maplayer.metadata.legendurl}">`;
    }
  }
    
  getUserLegend(maplayer) {
    let classInfo = maplayer.metadata.classInfo;
    switch(maplayer.type) {
      case 'fill':
          return classInfo.classes.map((item,index)=>{
            return svg`
              <svg width="30" height="15">
                <rect id="${maplayer.id} ${index}" width="30" height="15" style="fill:${item.paint};fill-opacity:1;stroke-width:1;stroke:#cccccc"/>
              </svg>${html` ${item.label}<br>`}`;
          })
        break;
      case 'line':
        break;
      case 'circle':
          let radius = 5;
          return classInfo.classes.map((item,index)=>{
            return svg`
              <svg width="${radius*2+2}" height="${radius*2+2}">
                <circle id="${maplayer.id} ${index}" cx="${radius+1}" cy="${radius+1}" r="${radius}" style="fill:${item.paint};fill-opacity:1;stroke-width:1;stroke:white}" />
              </svg> 
            ${item.label}<br>
            `
          })
        break;
      default: 
        return `unsupported user layer: ${maplayer.type}`
    }
  }
  _translateItems(items, translation) {
    for (const item of items) {
      if (translation.name === item.attrName) {
        item.attrName = translation.translation;
        if (translation.hasOwnProperty('decimals') && !isNaN(parseInt(translation.decimals))) {
          if (typeof parseFloat(item.attrValue) == "number" && !isNaN(parseFloat(item.attrValue))) {
            let factor = Math.pow(10, parseInt(translation.decimals));
            item.attrValue = parseInt(Math.round(parseFloat(item.attrValue) * factor)) / factor;
          }
        }
        if (translation.valuemap && Array.isArray(translation.valuemap)) {
          const valueMap = translation.valuemap.find(valueMap=>
            Array.isArray(valueMap) &&
            valueMap.length > 1 && 
            valueMap[0] == item.attrValue && 
            (valueMap.length < 3 || valueMap[2] === "" || valueMap[2] === "==" || valueMap[2] === item.attrExpression));
          if (valueMap) {
            item.attrValue = valueMap[1];
            item.mappedValue = true;
          }
        }
        if (!item.mappedValue && translation.unit && translation.unit !== "") {
          item.attrValue = `${item.attrValue}${translation.unit}`
        }
      }
    }
  }
  _addExpressionOperatorsToValues(items) {
    for (const item of items) {
      if (item.mappedValue) {
        continue;
      }
      if (item.hasOwnProperty('attrValue')) {
        switch (item.attrExpression) {
          case '<=':
          case '>=':
          case '<':
          case '>':
            item.attrValue = item.attrExpression + item.attrValue;
            break;
          case '!=':
            item.attrValue = 'niet ' + item.attrValue;
            break;
          case undefined:
          case null:
          case '==':
            break;
          default:
            console.warn(`addEpressionOperatorsToValues: not yet implemented: ${item.attrExpression}`);
        }
      }
    }
  }
  _formatItems(maplayer, items) {
    if (maplayer.metadata && maplayer.metadata.attributes && maplayer.metadata.attributes.translations) {
      let attributes = maplayer.metadata.attributes;
      for (let translation of attributes.translations) {
        this._translateItems(items.colorItems, translation);
        this._translateItems(items.radiusItems, translation);
        this._translateItems(items.strokeColorItems, translation);
        this._translateItems(items.strokeWidthItems, translation);
      }
    }
    this._addExpressionOperatorsToValues(items.colorItems);
    this._addExpressionOperatorsToValues(items.radiusItems);
    this._addExpressionOperatorsToValues(items.strokeColorItems);
    this._addExpressionOperatorsToValues(items.strokeWidthItems);
  }
  getLegendContent(maplayer) {
    if (maplayer && maplayer.metadata && maplayer.metadata.hidelegend) {
      return html``;
    }
    if ((maplayer.hasOwnProperty('minzoom') && maplayer.minzoom > this.zoom) || (maplayer.hasOwnProperty('maxzoom') && maplayer.maxzoom < this.zoom)) {
      return html``;
    }
    let legendContent = html`${t('legend unavailable')}`;
    if (maplayer.metadata && maplayer.metadata.classInfo) {
      return this.getUserLegend(maplayer)
    }
    if (maplayer.metadata && maplayer.metadata.legendurl) {
      return this.fixedLegend(maplayer);
    }
    if (!this.activeEdits.hasOwnProperty(maplayer.id)) {
      this.activeEdits[maplayer.id] = maplayer.metadata.activeEdits ? maplayer.metadata.activeEdits : [];
    }
    const layerTitle = maplayer.metadata && maplayer.metadata.title?maplayer.metadata.title:maplayer.id;
    const items = mbStyleParser.legendItemsFromLayer(maplayer, layerTitle, this.zoom);
    this._formatItems(maplayer, items);
    switch(maplayer.type) {
      case 'raster':
        legendContent = this.fixedLegend(maplayer);
        break;
      case 'fill':
        //legendContent = this.fillLegend(maplayer, items);
        if (maplayer.paint && maplayer.paint["fill-pattern"]) {
          legendContent = html`<map-legend-symbol 
            title="${layerTitle}" 
            .symbols="${maplayer.metadata.imageData}"></map-legend-symbol>`
        } else {
          legendContent = html`<map-legend-fill 
            @activeEdits="${this._layerSetActiveEdits}"
            @change="${this._updatePaintProperty}"
            .activeEdits = "${this.activeEdits[maplayer.id]}"
            .items="${items}"
            title="${layerTitle}"
            layerid="${maplayer.id}"></map-legend-fill>`
        }
        break;
      case 'fill-extrusion':
        //legendContent = this.filleExtrusionLegend(maplayer, items);
        legendContent = html`<map-legend-fill 
          @activeEdits="${this._layerSetActiveEdits}"
          @change="${this._updatePaintProperty}" 
          .activeEdits = "${this.activeEdits[maplayer.id]}"
          .items="${items}" 
          title="${layerTitle}" 
          layerid="${maplayer.id}"></map-legend-fill>`
        break;
      case 'line':
        //legendContent = this.lineLegend(maplayer, items);
        legendContent = html`<map-legend-line 
          @activeEdits="${this._layerSetActiveEdits}"
          @change="${this._updatePaintProperty}"
          .activeEdits = "${this.activeEdits[maplayer.id]}"
          .items="${items}" 
          title="${layerTitle}" 
          layerid="${maplayer.id}"></map-legend-line>`
        break;
      case 'circle':
        //legendContent = this.circleLegend(maplayer, items);
        legendContent = html`<map-legend-circle 
          @activeEdits="${this._layerSetActiveEdits}"
          @change="${this._updatePaintProperty}"
          .activeEdits = "${this.activeEdits[maplayer.id]}"
          .items="${items}" 
          title="${layerTitle}" 
          layerid="${maplayer.id}"></map-legend-circle>`
        break;
      case 'style':
        if (maplayer.metadata && maplayer.metadata.sublayers && maplayer.metadata.sublayers.length) {
          legendContent = maplayer.metadata.sublayers.map(sublayer=>this.getLegendContent(sublayer));
        }
        break;
      case 'symbol':
        //legendContent = '';
        let fontSize = maplayer.layout["text-size"];
        if (fontSize && typeof fontSize !== 'number') {
          fontSize = mbStyleParser.getZoomDependentPropertyInfo(this.zoom,fontSize,layerTitle);
          if (fontSize.items && fontSize.items.length) {
            fontSize = fontSize.items[0].value;
          } else {
            fontSize = 12;
          }
        }
        let font = maplayer.layout["text-font"];
        if (Array.isArray(font)) {
          font = font.join(', ');
        }
        const fontColor=maplayer.paint?maplayer.paint["text-color"]?maplayer.paint["text-color"]:"#000":"#000";
        const textTransform = maplayer.layout && maplayer.layout["text-transform"]?`text-transform:${maplayer.layout["text-transform"]};`:''
        const fontStyle = `font-family:${font};font-size:${fontSize}px;color:${fontColor};${textTransform}`;
        legendContent = html`<map-legend-symbol
          @activeEdits="${this._layerSetActiveEdits}"
          @change="${this._updatePaintProperty}"
          .activeEdits = "${this.activeEdits[maplayer.id]}"
          title="${layerTitle}"
          .symbols="${maplayer.metadata.imageData}"
          .fontStyle=${fontStyle}
          layerid="${maplayer.id}"></map-legend-symbol>`
        break;
      case 'background':
        //legendContent = this.backgroundLegend(maplayer);
        legendContent = html`<map-legend-fill 
          @activeEdits="${this._layerSetActiveEdits}"
          @change="${this._updatePaintProperty}" 
          .activeEdits = "${this.activeEdits[maplayer.id]}"
          .items="${items}"
          title="${layerTitle}"
          layerid="${maplayer.id}"></map-legend-fill>`
        break;
      case 'heatmap':
      case 'hillshade':
      case 'sky':
      default:
        legendContent = html`<div>${t('legend unavailable for type')}: ${maplayer.type}</div>`;
    }
    return legendContent;
  }

  render()
  {
    let legendContent;
    if (this.maplayer && this.maplayer.type) {
      legendContent = this.getLegendContent(this.maplayer);
    } 
    return html`
      <div class="legendcontainer" style="opacity:${this.transparency?1-Math.round(this.transparency)/100:1};">${legendContent}</div>`;
  }
  _layerSetActiveEdits(event) {
    this.activeEdits[event.detail.layerid] = event.detail.activeEdits;
    this.maplayer.metadata.activeEdits = event.detail.activeEdits;
  }
  _uninterpolate(value, input, base, top, bottom) {
    const difference = top[0] - bottom[0]; 
    const progress = (input - bottom[0]);
    if (progress < 0.1) {
      bottom[1] = value;
      return;
    }
    if (base === 1) {
      // lineair reverse interpolation      
      top[1] = bottom[1] + (value - bottom[1]) / (progress / difference);
      if (top[1] < bottom[1] + 0.1) {
        top[1] = bottom[1] + 0.1;
      }
      return;
    }
    top[1] = bottom[1] + (value - bottom[1]) / (progress / difference);
  }
  _updatePaintValue(paint, itemIndex, value) {
    if (Array.isArray(paint)) {
      switch(paint[0]) {
        case 'case':
          paint[2 + (itemIndex*2)] = value;
          break;
        case 'match':
        case 'step':
          paint[3 + (itemIndex*2)] = value;
      }
    } else if (typeof paint === 'string' || typeof paint === 'number') {
      paint = value;
    } else if (typeof paint === 'object' && paint !== undefined) {
      paint = value;
      /* if (!paint.property && paint.base)  {
        // zoom dependent value
        let i;
        for (i = 0; i < paint.stops.length - 1 && this.zoom >= paint.stops[i][0]; i++) {
          ;
        }
        this._uninterpolate(value, this.zoom, paint.base, paint.stops[i], paint.stops[i-1]);
      }*/
    }
    return paint;
  }
  _updatePaintProperty(event)
  {
    const paintProperty = {};
    const layerid = event.detail.layerid;
    const itemIndex = event.detail.itemIndex;
    const editLayer = this.maplayer.id === layerid ? this.maplayer : this.maplayer.metadata.sublayers.find(({id})=>id === layerid);
    paintProperty.layerid = editLayer.id;
    
    if (event.detail.color) {
      const propertyName = `${editLayer.type}-color`;
      const color = event.detail.color;
      let paintColor = editLayer.metadata.paint ? 
        editLayer.metadata.paint[propertyName] : 
          editLayer.paint[propertyName];
      paintProperty[propertyName] = this._updatePaintValue(paintColor, itemIndex, color);
    }
    if (event.detail.outlineColor) {
      const propertyName = editLayer.type === 'fill' ? 'fill-outline-color' : `${editLayer.type}-stroke-color`
      const color = event.detail.outlineColor;
      let paintColor = editLayer.metadata.paint ? 
        editLayer.metadata.paint[propertyName] : 
          editLayer.paint[propertyName];
      if (!paintColor) {
        // note: if you create 'fill-outline-color' on a previously added layer, the created fill-outline-color is ignored by the renderer
        // todo: somehow force the renderer to include the newly created fill-outline-color here
        if (editLayer.metadata.paint) {
          editLayer.metadata.paint[propertyName] = color;
        } else {
          editLayer.paint[propertyName] = color;
        }
        paintColor = color;
      }
      paintProperty[propertyName] = this._updatePaintValue(paintColor, itemIndex, color);
    }
    if (event.detail.width !== undefined) {
      const propertyName = editLayer.type === 'line' ? "line-width" : `${editLayer.type}-stroke-width`
      const width = event.detail.width;
      let paintWidth = editLayer.metadata.paint ? 
        editLayer.metadata.paint[propertyName] : 
          editLayer.paint[propertyName];
      if (!paintWidth) {
        if (editLayer.metadata.paint) {
          editLayer.metadata.paint[propertyName] = width;
        } else {
          editLayer.paint[propertyName] = width;
        }
      }
      paintProperty[propertyName] = this._updatePaintValue(paintWidth, itemIndex, width);
    }
    if (event.detail.radius !== undefined) {
      const propertyName = `${editLayer.type}-radius`
      const radius = event.detail.radius;
      let paintRadius = editLayer.metadata.paint ? 
        editLayer.metadata.paint[propertyName] : 
          editLayer.paint[propertyName];
      if (!paintRadius && paintRadius !== 0) {
        if (editLayer.metadata.paint) {
          editLayer.metadata.paint[propertyName] = radius;
        } else {
          editLayer.paint[propertyName] = radius;
        }
      } else {
        paintRadius = radius;
      }
      paintProperty[propertyName] = this._updatePaintValue(paintRadius, itemIndex, paintRadius);
    }
    if (event.detail.fontStyle) {
      const fontStyles = event.detail.fontStyle.split(';');
      const fontSize = fontStyles.find(style=>style.startsWith('font-size:')).slice(10,-2);
      const fontColor = fontStyles.find(style=>style.startsWith('color:')).slice(6);
      if (!this.maplayer.layout || this.maplayer.layout['text-size'] !== fontSize) {
        paintProperty["text-size"] = parseFloat(fontSize);
      }
      if (!this.maplayer.paint || this.maplayer.paint['text-color'] !== fontColor) {
        paintProperty["text-color"] = fontColor;
      }
    }
    for (const property in paintProperty) {
      if (property !== 'layerid') {
        if (editLayer.paint && editLayer.paint[property]) {
          editLayer.paint[property] = paintProperty[property];
        }
      }
    }
    this.dispatchEvent(new CustomEvent('changepaintproperty', {
      detail: paintProperty,
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('map-legend-panel', MapLegendPanel);