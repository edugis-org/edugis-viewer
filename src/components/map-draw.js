import {LitElement, html, css} from 'lit';
import {ifDefined} from 'lit/directives/if-defined.js';
import './map-iconbutton';
import {selectIcon, pointIcon, lineIcon, polygonIcon, trashIcon, checkIcon, warningIcon, combineIcon, uncombineIcon, downloadIcon, openfileIcon, threeDIcon} from './my-icons';
import drawStyle from './map-draw-theme.js';
import drawCss from './map-draw-css.js';
import {MapDrawLayerDialog} from './map-draw-layerdialog';
import {threedots} from './my-icons.js';
import './wc-button';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n.js';

/**
* @polymer
* @extends HTMLElement
*/
class MapDraw extends LitElement {
  static get properties() { 
    return {
      active: {type: Boolean},
      map: {type: Object},
      selectedFeatures: {type: Array},
      drawMode: {type: String},
      message: {type: String},
      layercolor: {type: Object},
      removedlayerid: {type: String},
      savecounter: {type: Number}
    }; 
  }
  createRenderRoot() {
    return this; // do not use shadowRoot
  }
  static get styles() {
    // this doesn't work, because mapbox-gl is not using shadowRoot
    // mapbox-gl-draw needs to access DOM elements outside the shadowRoot
    return css`
    `;
  }
  constructor() {
      super();
      this.map = {};
      this.active = false;
      this.selectedFeatures = [];
      this.drawMode = 'simple_select';
      this.featureType = 'None';
      this.featureCollection = {"type": "FeatureCollection", "features": []};
      this.message = null;
      this.timeoutId = null;
      this.snapLayers = [];
      this.editableLayers = {Point:[],Line:[],Polygon:[]};
      this.currentLayer = {Point: null, Line: null, Polygon: null};
      this.layercolor = {layerid: -1, color: '#000'};
      this.savecounter = 0;
      this.history = [];
      this.historyIndex = 0;
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
  shouldUpdate(changedProp){
    if (changedProp.has('map')){
      if (this.map.version && this.active) {
        this._addMbDrawToMap();
      }
    }
    if (changedProp.has('savecounter')) {
      this._saveFeaturesToLayer();
    }
    if (changedProp.has('layercolor')) {
      if (this.map.version && this.active && this.currentLayer[this.featureType] && this.currentLayer[this.featureType].id === this.layercolor.layerid) {
        this._updateDrawLayerStyle(this.currentLayer[this.featureType]);
      }
    }
    if (changedProp.has('active')) {
      if (this.active) {
        this._addMbDrawToMap();
      } else {
        this._removeDrawFromMap();
      }
    }
    if (changedProp.has('removedlayerid')) {
      this._removeLayer()
    }
    return true;
  }
  _removeLayer() {
    for (const layerType in this.currentLayer) {
      if (this.currentLayer[layerType] && this.currentLayer[layerType].id===this.removedlayerid) {
        this.currentLayer[layerType] = null;
        if (layerType === this.featureType) {
          this.mbDraw.deleteAll();
          this.selectedFeatures = [];
          this.history = [];
          this.historyIndex = 0;
          this.hasUnsavedFeatures = false;
        }
      }
      const index = this.editableLayers[layerType].findIndex(layer=>layer.id===this.removedlayerid);
      if (index >= 0) {
        this.editableLayers[layerType].splice(index, 1);
      }
    }
  }
  _addDialogs() {
    this.mapDialog = new MapDrawLayerDialog();
    this.map.getContainer().parentNode.appendChild(this.mapDialog);
    this.mapDialog.clickHandler = () => this._handleDialogOkClick();
    this.mapDialog.cancelHandler = () => this._handleDialogCancel();
  }
  _removeDialogs() {
    const container = this.map.getContainer().parentNode;
    const dialogElement = container.querySelector('map-draw-layerdialog');
    container.removeChild(dialogElement);
  }
  _canCombineFeatures()
  {
    if (this.selectedFeatures.length < 2) {
      return false;
    }
    const featureType = this.selectedFeatures[0].geometry.type.replace('Multi','');
    for (let i = 1; i < this.selectedFeatures.length; i++) {
      if (this.selectedFeatures[i].geometry.type.replace('Multi','') !== featureType) {
        return false;
      }
    }
    return true;
  }
  _renderSelectedFeatures() {
    if (this.selectedFeatures.length === 0) {
      return html``;
    }
    const currentLayer = this.currentLayer[this.featureType];
    return html`
    <div id="selectedfeatures">
      <div>${t(`Selected${this._currentGeometryType()}`)}:</div>
      <table id="selectedproperties">
        ${this.selectedFeatures.map(feature=>{
          const properties = {...feature.properties};
          for (const key in properties) {
            if (!currentLayer.metadata.properties.find(attr=>attr.name===key)) {
              delete properties[key]; // only handle user defined properties
            }
          }
          return Object.keys(properties).map(key=> {
            const type = currentLayer.metadata.properties.find(attr=>attr.name===key)?.type;
            return html`
            <tr><td class="propertyname">${t(key)}</td>
              <td><input ?disabled=${key==="id" || !["string","number","url"].includes(type)} 
                    type="${type==='url' ? 'url' : 'text'}"
                    @input="${(e)=>this._updateFeatureProperty(e, feature, key)}" 
                    .value="${this.mbDraw.get(feature.id).properties[key]?this.mbDraw.get(feature.id).properties[key]:''}"></td>
            </tr>`
          });
        })}
      </table>
    </div>`
  }
  _renderHelp() {
    let helptext = ''
    let mode = this.mbDraw.getMode();
    const showTrash = this.selectedFeatures.length && (this.mbDraw.getMode() === 'simple_select' || this.mbDraw.getSelectedPoints().features.length);
    const element = this.featureType.toLowerCase();
    
    switch (mode) {
      case 'simple_select':
        if (this.selectedFeatures.length) {
          if (this.featureType === 'Point') {
            helptext = t('draw-help-selected-point');
          } else {
            helptext = t('draw-help-selected-non-point', {'definitearticleelement': t(`definitearticle${element}`), otherelement: t(`other${element}`), referelement: t(`refer${element}`)});
          }
        } else if (this.featureType === 'None') {
            helptext = ``
        } else {
          helptext = t('draw-help-select-element', {'indefinitearticleelement': t(`indefinitearticle${element}`)});
        }
        break;
      case 'direct_select':
        if (this.mbDraw.getSelectedPoints().features.length) {
          helptext = t('draw-help-edit-point');
        } else {
          helptext = t('draw-help-edit-element', {otherelement: t(`other${element}`), referelement: t(`refer${element}`)});
        }
        break;
      case 'draw_point':
        helptext = t('draw-help-point');
        break;
      case 'draw_line_string':
        helptext =t('draw-help-line');
        break;
      case 'draw_polygon': 
        helptext = t('draw-help-polygon');
        break;
      default:
        helptext = `onbekende modus: ${mode}`
    }
    const helphtml = helptext.split('\n').map(line=>line.trim() !== ''? html`<li>${line}</li>`: '');
    return html`<ul>${helphtml}</ul>`;
  }
  _renderHistory() {
    if (this.history.length > 0) {
      return html`
      <div class="history">
        <wc-button compact @click=${this._undo} ?disabled=${!(this.historyIndex > 0)}><i class="material-icons">${t('undo')}</i></wc-button>
        <wc-button compact @click=${this._redo} ?disabled=${!(this.historyIndex < this.history.length)}><i class="material-icons">${t('redo')}</i></wc-button>
      </div>`
    } else {
      return html``
    }
    
  }
  _inSelectMode() {
    return ['simple_select','direct_select'].includes(this.mbDraw.getMode())
  }
  render() {
    if (!this.active) {
      return html``;
    }
    const showSelect = this.currentLayer[this.featureType] && !this._isEmptyNewLayer(this.currentLayer[this.featureType]);
    const inSelectMode = this._inSelectMode();
    const showTrash = this.selectedFeatures.length && (this.mbDraw.getMode() === 'simple_select' || this.mbDraw.getSelectedPoints().features.length)
    return html`
      <style>
      ${drawCss}
      .drawcontainer {font-size:14px;display: flex; flex-direction: column; justify-content: flex-start; align-items: stretch;max-height:100%}
      .header {
        font-weight: bold;
        position: relative;
        font-size: 16px;
        width: 100%;
        height: 30px;
        padding: 5px;
        border-bottom: 1px solid lightblue;
        box-sizing: border-box;
        margin-bottom: 12px;
        flex-shrink: 0}
      .right {float: right; margin-left: 4px;}
      .dropzone {display: inline-block; height: 24px; width: 210px; border: 1px dashed gray; border-radius: 2px;}
      .dragover {background-color: lightgray;} 
      .buttonbar {font-size: 0;}
      .buttoncontainer {display: inline-block; box-sizing: border-box; width: 55px; height: 55px; line-height:75px;fill:darkgray;}
      .message {background-color: rgba(146,195,41,0.98);width: 100%;box-shadow: 2px 2px 4px 0; height: 36px; color: white; font-weight: bold; line-height: 36px;padding: 2px;}
      .message.warning {
        background-color: rgba(255,165,0,0.98);
        fill: white;
      }
      .iconcontainer {display: inline-block; width: 24px; height: 24px; fill: white; margin: 5px; vertical-align: middle;}
      .scrollcontainer {flex-grow: 1; overflow: auto;}
      .layertype {
            font-weight: bold;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
      }
      .history {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 4px;
        gap: 10px;
      }
      </style>
      <div class="drawcontainer" @dragover="${e=>e.preventDefault()}">
      <div class="header">${t('Draw map layer')}</div>
      <div>${this.featureType === 'None'? `${t('Select point, line, or shape layer')}`:`${this._inSelectMode()?`${t('Select')} `:`${t('Draw')} `} ${t(this.featureType).toLocaleLowerCase()}`}</div>
      <div class="buttonbar">
      <div class="buttoncontainer" @click="${(e)=>this._changeMode('draw_point')}" title="[1]"><map-iconbutton .active="${!inSelectMode && this.featureType === 'Point'}" info="${ifDefined(t('Point layer')??undefined)}" .icon="${pointIcon}"></map-iconbutton></div>
      <div class="buttoncontainer" @click="${(e)=>this._changeMode('draw_line_string')}" title="[2]"><map-iconbutton .active="${!inSelectMode && this.featureType === 'Line'}" info="${ifDefined(t('Line layer')??undefined)}" .icon="${lineIcon}"></map-iconbutton></div>
      <div class="buttoncontainer" @click="${(e)=>this._changeMode('draw_polygon')}" title="[3]" ><map-iconbutton info="${ifDefined(t('Polygon layer')??undefined)}" .active="${!inSelectMode && this.featureType === 'Polygon'}" .icon="${polygonIcon}"></map-iconbutton></div>
      ${showSelect?html`
      <div class="buttoncontainer" @click="${(e)=>this._setMode('simple_select')}" title="[ESC]" ><map-iconbutton info="${t('Select')} ${t(this.featureType).toLowerCase()}" .active="${this._inSelectMode()}" .icon="${selectIcon}"></map-iconbutton></div>
      ` : html``}
      ${showTrash?html`
      <div class="buttoncontainer" @click="${(e)=>this.mbDraw.trash()}" title="[Del]" ><map-iconbutton info="${ifDefined(t('Delete selection')??undefined)}" .icon="${trashIcon}"></map-iconbutton></div>
      ` : html``}
      </div>
      ${this._renderEditLayerInfo()}
      <div class="scrollcontainer">
      ${this._renderSelectedFeatures()}
      ${this._renderMessage()}
      ${this._renderHelp()}
      ${this._renderHistory()}
      </div>
      </div>
    `
  }
  _getType(mode){
    switch (mode) {
      case 'draw_point':
        return 'Point'
      case 'draw_line_string':
        return 'Line'
      case 'draw_polygon':
        return 'Polygon'
      default:
        return 'None'
    }
  }
  _getMode(featureType) {
    switch (featureType) {
      case 'Point':
        return 'draw_point';
      case 'Line':
        return 'draw_line_string';
      case 'Polygon':
        return 'draw_polygon';
      default:
        return 'simple_select';
    }
  }
  _setEditableLayers(type) {
      const layerTypes = {
        "Point":["circle", "symbol"],
        "Line": ["line"],
        "Polygon": ["fill","fill-extrusion"]
      }
      this.editableLayers[type] = this.map.getStyle().layers
        .filter(layer=>{
          if (layerTypes[type].includes(layer.type) && layer.metadata && !layer.metadata.isToolLayer) {
            let source = layer.source;
            if (typeof source === 'string') {
              source = this.map.getSource(source).serialize();
            }
            if (source.type === 'geojson') {
              return true;
            }
          }
          return false;
        });
      this.editableLayers[type].reverse();
  }
  _changeMode(newMode) {
    this._restoreCurrentLayer(); // todo: inefficient if layer is not changed?
    if (this.drawMode !== newMode) {
      this.history = [];
      this.historyIndex = 0;
    }
    this.drawMode = newMode;
    const type = this.featureType = this._getType(newMode);
    if (!this.currentLayer[type]) {
      this._showDialog();
    } else {
      this._loadCurrentFeatures();
    }
    this._setMode(newMode);
  }
  _setMode(newMode) {
    this.mbDraw.changeMode(newMode);
    this.requestUpdate();
  }
  _currentGeometryType() {
    let mode = this.drawMode;
    if (mode === 'simple_select' || mode === 'direct_select') {
      if (this.selectedFeatures.length > 0) {
        switch (this.selectedFeatures[0].geometry.type) {
          case 'Point':
          case 'MultiPoint':
            mode = 'draw_point';
            break;
          case 'LineString':
          case 'MultiLineString':
            mode = 'draw_line_string';
            break;
          case 'Polygon':
          case 'MultiPolygon':
            mode = 'draw_polygon';
            break;
        }
      }
    }
    return this._getType(mode);
  }
  _layerTitleChange(newTitle) {
    this.currentLayer[this.featureType].metadata.title = newTitle;
    const mapLayer = this.map.getLayer(this.currentLayer[this.featureType].id);
    if (mapLayer) {
      mapLayer.metadata.title = newTitle;
      // notify application that layer title has changed
      this.dispatchEvent(new CustomEvent('titlechange', {
        detail: {
          layerid: this.currentLayer[this.featureType].id,
          title: newTitle
        }
      }));
    }
  }
  _addNewLayerToMap() {
    if (this._isEmptyNewLayer(this.currentLayer[this.featureType])) {
      delete this.currentLayer[this.featureType].isnewlayer;
      this.dispatchEvent(new CustomEvent('addlayer', 
        {detail: this.currentLayer[this.featureType]}
      ));
      this.dispatchEvent(new CustomEvent('movelayer', {
        detail: { 
          layers: [this.currentLayer[this.featureType].id],
          beforeLayer: "gl-draw-polygon-fill-inactive.cold"
        }
      }));
      this.mbDraw.options.snapLayers.push(this.currentLayer[this.featureType].id);
      //this._addNewLayerOption();
    }
  }
  async _handleDialogOkClick() {
    this.history = [];
    this.historyIndex = 0;
    this.currentLayer[this.featureType] = this.mapDialog.currentEditLayer;
    if (this._isEmptyNewLayer(this.currentLayer[this.featureType])) {
      this._addNewLayerToMap();
    } else {
      await this._prepareLayerForDraw(this.mapDialog.currentEditLayer);
      const mapLayer = this.map.getLayer(this.currentLayer[this.featureType].id);
      if (mapLayer && mapLayer.metadata) {
        mapLayer.metadata.properties = JSON.parse(JSON.stringify(this.currentLayer[this.featureType].metadata.properties));
      }
    }
    this._changeMode(this._getMode(this.featureType));
    if (this.mapDialog.titleHasChanged) {
      this._layerTitleChange(this.mapDialog.currentEditLayer.metadata.title)
    }
  }
  _handleDialogCancel() {
    if (!this.currentLayer[this.featureType]) {
      this._setMode('simple_select');
      this.featureType = 'None';
    } else {
      this._changeMode(this._getMode(this.featureType));
    }
  }
  _prepareProperties(layer) {
    if (!layer.metadata.hasOwnProperty('properties')) {
      const properties = new Map();
      let features = this.map.queryRenderedFeatures(undefined,{layers:[layer.id]});
      for (const feature of features) {
        for (const propname in feature.properties) {
          if (!properties.has(propname)) {
            if (feature.properties[propname] !== null && feature.properties[propname] !== undefined) {
              if (typeof feature.properties[propname] === 'number') {
                properties.set(propname, 'number');
              } else {
                properties.set(propname, 'string');
              }
            }
          }
        }
      }
      layer.metadata.properties = [{"name": "id", "type": "number"}];
      for (const [key,value] of properties) {
        if (key !== 'id') {
          layer.metadata.properties.push({"name": key, "type": value});
        }
      }
    }
  }
  async _prepareLayerForDraw(layer) {
    let id = 1;
    const source = this.map.getSource(layer.id).serialize();
    if (typeof source.data === 'string') {
      // fetch data and convert layer source to geojsonSource
      let result = await fetch(source.data);
      if (result.ok) {
        let json = await result.json();
        const propertySet = new Set();
        for (const prop of layer.metadata.properties) {
            propertySet.add(prop.name);
        }
        for (const feature of json.features) {
          if (!feature.properties.hasOwnProperty('id')) {
            feature.properties.id = id++;
          }  
          for (const key in feature.properties) {
            if (!propertySet.has(key)) {
              delete feature.properties[key];
            }
          }
        }
        const mapLayer = this.map.getLayer(layer.id);
        const mapSource = this.map.getSource(mapLayer.source);
        mapSource.setData(json);
      }
    }
  }
  async _showDialog() {
    this._restoreCurrentLayer();
    const currentLayer = this.currentLayer[this.featureType];
    const type = this.featureType = this._getType(this.drawMode);
    await this._setEditableLayers(type);
    this.mapDialog.featureType = this.featureType;
    this.mapDialog.currentEditLayerId = currentLayer ? currentLayer.id : null;
    this.mapDialog.editableLayers = this.editableLayers[this.featureType];
    for (const layer of this.mapDialog.editableLayers) {
      this._prepareProperties(layer);
    }
    this.mapDialog.active = true;
  }
  _renderEditLayerInfo() {
    const featureType = this.featureType;
    if (featureType == 'None' || !this.currentLayer[this.featureType]) {
        return html``;
    }
    return html`<div class="layertype" @click="${()=>this._showDialog()}" >${t('Map layer')}: '${this.currentLayer[this.featureType].metadata.title}' <span title="${ifDefined(t('edit map layer')??undefined)}" class="dotsright">${threedots}</span></div>`;
  }
  _renderMessage() {
    if (this.message) {
      if (this.messageIsError) {
        return html`<div class="message warning"><div class="iconcontainer">${warningIcon}</div>${this.message}</div>`
      }
      return html`<div class="message"><div class="iconcontainer">${checkIcon}</div>${this.message}</div>`
    }
    return ''
  }
  _setSnapLayers() {
    const layerTypes = {
      "Point":["circle", "symbol"],
      "Line": ["line"],
      "Polygon": ["fill","fill-extrusion"]
    }
    const drawSnapLayers = new Set(this.mbDraw.options.snapLayers);
    const mapSnapLayers = this.map.getStyle().layers
      .filter(layer=>
        (layerTypes.Point.includes(layer.type) ||
        layerTypes.Line.includes(layer.type) ||
        layerTypes.Polygon.includes(layer.type)) 
          && !layer['source-layer'] && layer.metadata && !layer.metadata.isToolLayer)
      .map(layer=>layer.id);
    mapSnapLayers.forEach(layer=>drawSnapLayers.add(layer));
    this.mbDraw.options.snapLayers = Array.from(drawSnapLayers);
  }
  _addMbDrawToMap(){ 
    if (this.map.version) {
      // store map.boxZoom
      this.boxZoomable = this.map.boxZoom.isEnabled();
      this.mbDraw = new MapboxDraw({
        displayControlsDefault: true,
        keybindings: true,
        controls: {point: false, line_string: false, polygon: false, trash: false, combine_features: false, uncombine_features: false},
        styles: drawStyle
      });
      this._setSnapLayers();
      this.mbDraw.options.styles.forEach(style=>style.metadata = {isToolLayer: true});
      this.map.addControl(this.mbDraw, 'bottom-right');
      this.map.on('draw.create', this.featuresCreated = (e)=>this._featuresCreated(e));
      this.map.on('draw.selectionchange', this.featuresSelected = (e)=>this._featuresSelected(e));
      this.map.on('draw.update', this.featuresUpdated = (e)=>this._featuresUpdated(e));
      this.map.on('draw.modechange', this.drawModeChange = (e)=>this._drawModeChange(e));
      this.map.on('draw.delete', this.drawDelete = (e)=>this._drawDelete(e));
      this.map.on('draw.combine', this.drawCombine = (e)=>this._drawCombine(e));
      this.map.on('draw.uncombine', this.drawUncombine = (e)=>this._drawUncombine(e));
      this.map.getCanvasContainer().addEventListener('keydown', this.keyDown=(e)=>this._keyDown(e));
      this.map.getCanvas().style.cursor = "unset"; // let mapbox-gl-draw handle the cursor
      this._addDialogs();
      setTimeout(()=>this.mbDraw.changeMode(this.drawMode = 'simple_select'), 100);
    }
  }
  _removeDrawFromMap()
  {
    if (this.map.version) {
      if (this.mbDraw) {
        this.mbDraw.changeMode(this.drawMode = 'simple_select');
      }
      this._restoreCurrentLayer();
      this.history = [];
      this.historyIndex = 0;
      //this.currentLayer[this.featureType] = null;
      this.featureType = 'None';
      this.map.off('draw.create', this.featuresCreated);
      this.map.off('draw.selectionchange', this.featuresSelected);
      this.map.off('draw.update', this.featuresUpdated);
      this.map.off('draw.modechange', this.drawModeChange);
      this.map.off('draw.delete', this.drawDelete);
      this.map.getCanvasContainer().removeEventListener('keydown', this.keyDown);
      //this._updateMapDrawLayers();
      //this._setMapDrawLayersVisibility(true);  
      this.map.removeControl(this.mbDraw);

      this.selectedFeatures = [];

      this._removeDialogs();
      
      // restore map.boxZoom
      if (this.boxZoomable) {
        this.map.boxZoom.enable();
      } else {
        this.map.boxZoom.disable();
      }
    }
  }
  _drawModeChange(e) {
    //this.drawMode = e.mode;
    //this._setMode(e.mode);
    this.requestUpdate();
  }
  _undo() {
    this.selectedFeatures = [];
    this._setMode('simple_select');
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const undoAction = this.history[this.historyIndex];
      switch (undoAction.type) {
        case 'create':
          this.mbDraw.delete(undoAction.features.map(f=>f.id));
          break;
        case 'update':
          this.mbDraw.add({type: "FeatureCollection", features: undoAction.features});
          break;
        case 'delete':
          this.mbDraw.add({type: "FeatureCollection", features: undoAction.features});
          break;
      }
    }
  }
  _redo() {
    this.selectedFeatures = [];
    this._setMode('simple_select');
    if (this.historyIndex < this.history.length) {
      const redoAction = this.history[this.historyIndex];
      switch (redoAction.type) {
        case 'create':
          this.mbDraw.add({type: "FeatureCollection", features: redoAction.features});
          break;
        case 'update':
          this.mbDraw.add({type: "FeatureCollection", features: redoAction.newFeatures});
          break;
        case 'delete':
          this.mbDraw.delete(redoAction.features.map(f=>f.id));
          break;
      }
      this.historyIndex++;
    }
  }
  _keyDown(event) {
    if (!((event.srcElement || event.target).classList.contains('mapboxgl-canvas') || 
      (event.srcElement || event.target).classList.contains('maplibregl-canvas'))) return; // we only handle events on the map
    if ((event.key === 'Backspace' || event.key === 'Delete')) {
      this.mbDraw.trash();
      event.preventDefault();
    } else if (event.key === '1') {
      this._changeMode('draw_point');
    } else if (event.key === '2') {
      this._changeMode('draw_line_string');
    } else if (event.key === '3') {
      this._changeMode('draw_polygon');
    } else if (event.key === 'Escape') {
      this._setMode('simple_select');
    } else if (event.key === 'z' && event.ctrlKey) {
      this._undo();
    } else if (event.key === 'y' && event.ctrlKey) {
      this._redo();
    }
    console.log(event.key)
  }
  _isEmptyNewLayer(layer) {
    return layer.isnewlayer;
  }
  _isValidFeature(feature, type) {
    if (feature.geometry.coordinates === null) {
      console.log('null');
      return false;
    }
    if (feature.geometry.coordinates.length === 0) {
      console.log('[]');
      return false;
    }
    if (feature.geometry.coordinates.length === 1) {
      if (feature.geometry.coordinates[0] === null) {
        console.log('[null]');
        return false;
      }
      if (feature.geometry.coordinates[0].length === 0) {
        console.log('[[]]')
        return false;
      }
      if (feature.geometry.coordinates[0][0] === null) {
        console.log('[[null]]')
        return false;
      }
    }
    return true;
  }
  _setDefaultDrawLayerColors(type) {
    switch (type) {
      case 'Point':
        const circleColor = drawStyle.find(style=>style.id === 'gl-draw-point-inactive').paint['circle-color'];
        this.map.setPaintProperty("gl-draw-point-inactive.cold", "circle-color", circleColor);
        this.map.setPaintProperty("gl-draw-point-active.cold", "circle-color", circleColor);
        this.map.setPaintProperty("gl-draw-point-inactive.hot", "circle-color", circleColor);
        this.map.setPaintProperty("gl-draw-point-active.hot", "circle-color", circleColor);
        break;
      case 'Line':
        break;
      case 'Polygon':
        const fillColor = drawStyle.find(style=>style.id === 'gl-draw-polygon-fill-inactive').paint['fill-color'];
        this.map.setPaintProperty('gl-draw-polygon-fill-inactive.cold', "fill-color", fillColor);
        this.map.setPaintProperty('gl-draw-polygon-fill-inactive.hot', "fill-color", fillColor);
        this.map.setPaintProperty('gl-draw-polygon-fill-active.cold', "fill-color", fillColor);
        this.map.setPaintProperty('gl-draw-polygon-fill-active.hot', "fill-color", fillColor);
        break;
    }
  }
  _saveFeaturesToLayer() {
    const layer = this.currentLayer[this.featureType];
    if (!layer || this._isEmptyNewLayer(layer)) {
      return false;
    }
    const source = this.map.getSource(layer.id);
    if (source) {
      if (this.hasUnsavedFeatures) {
        const featureCollection = this.mbDraw.getAll();
        featureCollection.features = featureCollection.features.filter(this._isValidFeature, this.featureType);
        source.setData(JSON.parse(JSON.stringify(featureCollection)));
        this.hasUnsavedFeatures = false;
      }
      return true;
    }
    return false;
  }
  _restoreCurrentLayer() {
    if (this._saveFeaturesToLayer()) {
      this.mbDraw.deleteAll();
      this.selectedFeatures = [];
      this._setEditMode(this.currentLayer[this.featureType].id, false);
    } else {
      //console.log('_updateMapLayer failed for layer ' + layer.id);
    }
  }
  _updateDrawLayerStyle(layer) {
    switch (layer.type) {
        case 'circle':
          const circleColor = this.map.getPaintProperty(layer.id, "circle-color");
          this.map.setPaintProperty("gl-draw-point-inactive.cold", "circle-color", circleColor);
          this.map.setPaintProperty("gl-draw-point-active.cold", "circle-color", circleColor);
          this.map.setPaintProperty("gl-draw-point-inactive.hot", "circle-color", circleColor);
          this.map.setPaintProperty("gl-draw-point-active.hot", "circle-color", circleColor);
          break;
        case 'line':
          break;
        case 'fill':
          const fillColor = this.map.getPaintProperty(layer.id, "fill-color");
          this.map.setPaintProperty('gl-draw-polygon-fill-inactive.cold', "fill-color", fillColor);
          this.map.setPaintProperty('gl-draw-polygon-fill-inactive.hot', "fill-color", fillColor);
          this.map.setPaintProperty('gl-draw-polygon-fill-active.cold', "fill-color", fillColor);
          this.map.setPaintProperty('gl-draw-polygon-fill-active.hot', "fill-color", fillColor);
          break;
    }
  }
  _loadCurrentFeatures() {
    this.mbDraw.deleteAll();
    this.selectedFeatures = [];
    const layer = this.currentLayer[this.featureType];
    if (!layer || this._isEmptyNewLayer(layer)){
      return;
    }
    const source = this.map.getSource(layer.id);
    if (source) {
      const sourceData = source.serialize();
      if (sourceData) {
        const featureCollection = sourceData.data;
        this._updateDrawLayerStyle(layer);
        this.mbDraw.set(featureCollection);
        this.hasUnsavedFeatures = false;
        this._setEditMode(layer.id, true);
      }
    } else {
      console.error(`could not get source for ${layer.id}`)
    }
  }
  _setEditMode(layerId, editMode) {
    const mapLayer = this.map.getLayer(layerId);
    if (mapLayer) {
      this.dispatchEvent(new CustomEvent('updateeditmode', {
        detail: {
          layerId: layerId,
          editMode: editMode
        }
      }));
    }
  }
  _defaultPropertyValue(type, feature) {
    switch (type) {
      case 'number':
      case 'string':
      case 'url':
        return null;
      case 'longitude':
        return turf.centroid(feature).geometry.coordinates[0];
      case 'latitude':
        return turf.centroid(feature).geometry.coordinates[1];
      case 'perimeter':
      case 'length':
        return turf.length(feature);
      case 'area':
        return turf.area(feature);
    }
  }
  _getUniqueFeatureId(){
    const featureCollection = this.mbDraw.getAll();
    let result = 1;
    for (const feature of featureCollection.features) {
      const featureId = parseInt(feature.properties.id);
      if (feature.properties.id && result <= featureId) {
        result = featureId + 1;
      }
    }
    return result;
  }
  _applyFeatureProperty(featureId, name, value) {
    this.mbDraw.setFeatureProperty(featureId, name, value);
    if (this.historyIndex > 0) {
      // update current and future features
      for (let i = this.historyIndex - 1; i < this.history.length; i++) {
        const newFeature = this.history[i].newFeatures?.find(({id})=>id===featureId);
        if (newFeature) {
          newFeature.properties[name] = value;
        } else {
          const historyFeature = this.history[i].features.find(({id})=>id===featureId);
          if (historyFeature) {
            historyFeature.properties[name] = value;
          }
        }
      }
    }
  }
  _updateDefaultFeatureProperties(feature) {
    const newId = this._getUniqueFeatureId();
    this.currentLayer[this.featureType].metadata.properties.forEach((property,idx)=>{
      if (idx === 0) {
        this._applyFeatureProperty(feature.id, property.name, newId);
        feature.properties[property.name] = newId;
      } else {
        const value = this._defaultPropertyValue(property.type, feature);
        this._applyFeatureProperty(feature.id, property.name, value);
        //feature.properties[property.name] = value;
      }
    });
    this.hasUnsavedFeatures = true;
  }
  _updateFeatureAutoProperties(feature) {
    this.currentLayer[this.featureType].metadata.properties.forEach((property)=>{
      const value = this._defaultPropertyValue(property.type, feature);
      if (value) {
        this._applyFeatureProperty(feature.id, property.name, value);
        feature.properties[property.name] = value;
      }
    });
    this.hasUnsavedFeatures = true;
    this.requestUpdate();
  }
  _convertType(key, value, typeInfo) {    
    if (typeInfo) {
      if (typeInfo.type === 'number') {
        const numberValue = parseFloat(value.replace(',','.'));
        return isNaN(numberValue) ? null : numberValue;          
      }
    }
    return value;
  }
  _updateFeatureProperty(e, feature, key) {
    const value = e.target.value;
    let typeInfo = null;
    if (this.currentLayer[this.featureType].metadata && this.currentLayer[this.featureType].metadata.properties) {
      typeInfo = this.currentLayer[this.featureType].metadata.properties.find(({name})=>name===key);
    }
    let convertedValue = this._convertType(key, value, typeInfo);
    if (convertedValue !== value) {
      const floatValue = value.replace(',', '.').replace(/([\+\-]?)[^\d\.]*([0-9]*)[^\.]*([\.]?)[^0-9]*([0-9]*).*/,'$1$2$3$4')
      e.target.value = floatValue;
    }
    this._applyFeatureProperty(feature.id, key, convertedValue);
    if (feature.properties[key] !== convertedValue) {
      feature.properties[key] = convertedValue;
      this.hasUnsavedFeatures = true;
      if (typeInfo?.type === 'url') {
        // if the property is a url, we need to check if it is a valid url
        try {
          const url = new URL(convertedValue);
          if (url.protocol === 'http:') {
            url.protocol = 'https:'; // convert http to https
            const newValue = url.href;
            if (newValue.endsWith('/') && !convertedValue.endsWith('/')) {
              convertedValue = newValue.slice(0, -1);
            } else {
              convertedValue = newValue;
            }            
            e.target.value = convertedValue;
            this._applyFeatureProperty(feature.id, key, convertedValue);
          }
        } catch (e) {
          this._setMessage(`'${convertedValue}' ${t("invalid URL")}`, true);
          return;
        }
      }
      this._setMessage(`'${e.target.value}' ${t("saved")}`);
    }
  }
  _featuresCreated(e) {
    // update history
    if (this.historyIndex < this.history.length) {
      this.history = this.history.slice(0, this.historyIndex);
    }
    this.history.push({type: 'create', features: JSON.parse(JSON.stringify(e.features))});
    this.historyIndex = this.history.length;
    // update feature properties
    e.features.forEach(feature=>this._updateDefaultFeatureProperties(feature));
    this.hasUnsavedFeatures = true;
  }
  _featuresSelected(e) {
    this.selectedFeatures = e.features;
    // check if any newly defined layer properties should be added to the feature
    for (const prop of this.currentLayer[this.featureType].metadata.properties) {
      for (const feature of this.selectedFeatures) {
        if (!feature.properties.hasOwnProperty(prop.name)) {
          const value = this._defaultPropertyValue(prop.type, feature);
          this._applyFeatureProperty(feature.id, prop.name, value);
          feature.properties[prop.name] = value; // update internal copy as well
        }
      }
    }
  }
  _featuresUpdated(e) {
    if (!e.midpoint) {
      // update history
      if (this.historyIndex < this.history.length) {
        this.history = this.history.slice(0, this.historyIndex);
      }
      const oldFeaturesJson = JSON.stringify(this.selectedFeatures);
      const newFeaturesJson = JSON.stringify(e.features);
      if (oldFeaturesJson !== newFeaturesJson) {
          this.history.push({type: 'update', features: JSON.parse(oldFeaturesJson), newFeatures: JSON.parse(newFeaturesJson)});
          this.historyIndex = this.history.length;
      }
      // update feature properties
      e.features.forEach(feature=>this._updateFeatureAutoProperties(feature));
      this.hasUnsavedFeatures = true;
    }
    setTimeout(()=>this.selectedFeatures = e.features, 0);
  }
  _drawDelete(e) {
    this.selectedFeatures = [];
    this.hasUnsavedFeatures = true;
    // update history
    if (this.historyIndex < this.history.length) {
      this.history = this.history.slice(0, this.historyIndex);
    }
    this.history.push({type: 'delete', features: JSON.parse(JSON.stringify(e.features))});
    this.historyIndex = this.history.length;
  }
  _drawCombine(e) {
    this.selectedFeatures = [];
    setTimeout(()=>{
      //e.createdFeatures.forEach(feature=>this._setDefaultFeatureProperties(feature));
      this.selectedFeatures = e.createdFeatures;
    }, 100);
    this.hasUnsavedFeatures = true;
  }
  _drawUncombine(e) {
    this.selectedFeatures = [];
    setTimeout(()=>{
      //e.createdFeatures.forEach(feature=>this._setDefaultFeatureProperties(feature));
      this.selectedFeatures = e.createdFeatures;
    }, 100);
    this.hasUnsavedFeatures = true;
  }
  _setMessage(message, isError = false) {
    if (message !== null && this.timeoutId != null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.message = message;
    this.messageIsError = isError;
    if (message !== null) {
      this.timeoutId = setTimeout(()=>this._setMessage(null), 4000)
    }
  }

}
customElements.define('map-draw', MapDraw);
