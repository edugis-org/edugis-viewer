import {LitElement, html} from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './map-iconbutton';
import {openfileIcon, downloadIcon} from './my-icons';
import {toGeoJSON} from '../lib//togeojson';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n';

/**
* @polymer
* @extends HTMLElement
*/
export class MapImportExport extends LitElement {
  static get properties() { 
    return {
      active: {type: Boolean},
      map: {type: Object},
      datacatalog: {type: Array},
      onlyselected: {type: Boolean}
    }; 
  }
  constructor() {
      super();
      this.map = {};
      this.active = false;
      this.datacatalog = [];
      this.onlyselected = false;
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
  /* createRenderRoot() {
    return this;
  }*/
  shouldUpdate(changedProp){
    return true;
  }
  render() {
    if (!this.active) {
      return html``;
    }
    return html`
      <style>
      .rowcontainer {display: flex; align-items: flex-end;}
      .dropzone {flex-grow: 10; height: 24px; border: 1px dashed gray; border-radius: 2px; margin-right: 4px;}
      .buttoncontainer {display: inline-block; width: 20px; height: 20px; border: 1px solid gray; border-radius:4px;padding:2px;fill:gray;}
      .dragover {background-color: lightgray;}
      .spacer {flex-grow: 10;}
      </style>
      <hr>
      <div>${t('Open')}</div>
      <div class="drawcontainer" @dragover="${e=>e.preventDefault()}" @drop="${(e)=>this._handleDropZoneDrop(e)}">
      <div class="rowcontainer">
        <input type="file" id="fileElem" accept=".json" style="display:none" @change="${e=>this._openFiles(e)}">
        ${window.saveAs ? html`<div class="dropzone" @dragover="${e=>e.target.classList.add('dragover')}" @dragleave="${e=>e.target.classList.remove('dragover')}">drop config json here</map-iconbutton></div>`: ''}
        ${window.saveAs ? html`<div class="buttoncontainer right" @click="${(e)=>this.shadowRoot.querySelector('#fileElem').click()}"><map-iconbutton info="${ifDefined(t('open file')??undefined)}" .icon="${openfileIcon}"></map-iconbutton></div>`: ''}
      </div>
      <hr>
      <div>${t('Save')}</div>
      <input type="checkbox" name="onlyselected" ?checked="${this.onlyselected}" @click="${(e)=>this._toggleOnlyVisible(e)}"> ${t('Selected map layers only')}<br>
      ${t('Visible tools')}:<br>
      <div class="rowcontainer">
      <div class="spacer">
      ${this.toollist.map(tool=>html`<input type="checkbox" name="${tool.name}" ?checked="${tool.visible}" @click="${e=>tool.visible=!tool.visible}">${tool.name}<br>`)}
      </div>
      ${window.saveAs ? html`<div class="buttoncontainer right" @click="${(e)=>this._saveFile()}"><map-iconbutton info="${ifDefined(t('save')??undefined)}" .icon="${downloadIcon}"></map-iconbutton></div>`: ''}
      </div>
      </div>
    `
  }
  _selectedLayersAndGroups(list) {
    const result = [];
    list.forEach(item=>{
      if (item.checked) {
        result.push(item);
      }
      if (item.sublayers) {
        const subresult = this._selectedLayersAndGroups(item.sublayers);
        if (subresult.length) {
          const groupItem = Object.assign({}, item);
          groupItem.sublayers = subresult;
          result.push(groupItem);
        }
      }
    })
    return result;
  }
  getDataCatalogItem(idOrTitle, layers) {
    if (!Array.isArray(layers)) {
      layers = [layers];
    }
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (layer.id && layer.id === idOrTitle) {
        return layer;
      }
      if (layer.title && layer.title === idOrTitle) {
        return layer;
      }
      if (layer.sublayers) {
        const subresult = this.getDataCatalogItem(idOrTitle, layer.sublayers);
        if (subresult) {
          return subresult;
        }
      }
    }
    return undefined;
  }
  _saveFile(e) {
    const center = this.map.getCenter();
    let datacatalog = this.onlyselected? this._selectedLayersAndGroups(this.datacatalog) : [ ...this.datacatalog];
    datacatalog = datacatalog.filter(item=>item.id !== 'extralayers');
    const layers = this.map.getStyle().layers;
    const extraLayers = layers.filter(layer=>{
      if (layer.metadata.reference || layer.metadata.isToolLayer) {
        return false;
      }
      if (layer.id) {
        return !this.getDataCatalogItem(layer.id, this.datacatalog);
      } else if (layer.title) {
        return !this.getDataCatalogItem(layer.title, this.datacatalog);
      }
      return false;
    })
    if (extraLayers.length) {
      const extraLayersGroup = {
          "type": "group",
          "title": "Toegevoegde lagen",
          "id": "extralayers",
          "sublayers": []
      };      
      datacatalog.push(extraLayersGroup);

      for (let extraLayer of extraLayers) {
        if (extraLayer.type === 'line' || extraLayer.type === 'fill' || extraLayer.type === 'circle' || extraLayer.type === 'symbol') {
          let source = extraLayer.source;
          if (typeof source === 'string') {
            source = this.map.getSource(source).serialize();
            extraLayer.source = source;
          }
        }
        extraLayersGroup.sublayers.push({
          "type": "geojson",
          "title": extraLayer.metadata.title,
          "checked": true,
          "layerInfo": extraLayer
        })
      }      
    }
    const json = {
        map: { zoom: this.map.getZoom(),center: [center.lng, center.lat], pitch: this.map.getPitch(), bearing: this.map.getBearing()},
        datacatalog: datacatalog,
        tools: this.toollist.reduce((result, tool)=>{
            result[tool.name] = {};
            if (tool.hasOwnProperty('opened')) {result[tool.name].opened = tool.opened};
            if (tool.hasOwnProperty('visible')) {result[tool.name].visible = tool.visible};
            if (tool.hasOwnProperty('position')) {result[tool.name].position = tool.position};
            if (tool.hasOwnProperty('order')) {result[tool.name].order = tool.order};
            if (tool.name === 'importexport' && tool.visible && tool.order === 99999) {
              // do not save override
              result[tool.name].visible = false;
              result[tool.name].order = 100;
            }
            return result;},{}),
        keys: {}
    }
    const blob = new Blob([JSON.stringify(json, null, 2)], {type: "application/json"});
    window.saveAs(blob, 'mapconfig.json');
  }

  _toggleOnlyVisible(e) {
    this.onlyselected = !this.onlyselected;
  }

  static _readFileAsText(inputFile) {
    const reader = new FileReader();
  
    return new Promise((resolve, reject) => {
      reader.onerror = () => {
        reader.abort();
        reject(new DOMException("Problem parsing input file."));
      };
  
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsText(inputFile);
    });
  };
  static _readBlob(inputFile) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onerror = () => {
        reader.abort();
        reject(new DOMException("Problem parsing input file."));
      };  
      reader.onload = (e) => {
        var data = new Uint8Array(e.target.result);
        resolve(data);
      };
      reader.readAsArrayBuffer(inputFile);
    });
  }
  static _readSpreadsheet(inputFile) {
    return this._readBlob(inputFile).then(data=>{
      const workbook = XLSX.read(data, {type: 'array'});
      return workbook;
    })
  }

  static async _readFile(file)
  {
    try {
        if (file.name.endsWith('.xlsx') || file.name.endsWith('xls')) {
          const workbook = await MapImportExport._readSpreadsheet(file);
          const sheets = Object.keys(workbook.Sheets);
          let json = {}
          if (sheets.length) {
            json = XLSX.utils.sheet_to_json(workbook.Sheets[sheets[0]]);
          }
          return {
            filename: file.name, 
              data: {
                data:json, 
                meta:{
                  fields: json.length?Object.keys(json[0]):[]
                }
              }
            };
        } else if (file.name.endsWith('.zip')) {
          const data = await MapImportExport._readBlob(file);
          const zip = new JSZip();
          const contents = await zip.loadAsync(data);
          const result = [];
          for (const filename in contents.files) {
            if (filename.endsWith('.json') || filename.endsWith('.geojson')) {
              console.log(filename);
              const data = await zip.file(filename).async('text');
              const json = JSON.parse(data);
              result.push(json);
            }
          }
          return {filename: file.name, data: result}
        } else {
        const text = await MapImportExport._readFileAsText(file);
        if (file.name.endsWith('.gpx') || file.name.endsWith('.kml')) {
          try {
            let result;
            let xmlDoc = new DOMParser().parseFromString(text, "text/xml");
            if (file.name.endsWith('.gpx')) {
              result = toGeoJSON.gpx(xmlDoc);
            } else {
              result = toGeoJSON.kml(xmlDoc);
            }
            return {filename: file.name, data: result}
          } catch(error) {
            return {error:error.message}
          }
        }
        if (file.name.endsWith('.csv')) {
          // probably a csv file
          if (window.Papa) {
            const result = Papa.parse(text, {
              header: true,
              skipEmptyLines: true
            });
            if (result.data.length) {
              return {filename: file.name, data: result}
            } else {
              return {error: 'invalid or empty csv'};
            }
          } else {
            return {error: 'Cannot load csv, parser not available'};
          }
        }
        return MapImportExport._parseJson(text, file.name);
       }
    } catch(error) {
        return {error: error}
    }
  }
  _openFiles(e) {
    const file = this.shadowRoot.querySelector('#fileElem').files[0];
    MapImportExport._readFile(file).then(droppedFile=>{
        this.dispatchEvent(new CustomEvent('droppedfile', {
          detail: droppedFile
        }))
    })
  }
  static _parseJson(data, filename) {
    try {
      const json = JSON.parse(data);
      return {filename: filename, data: json};
    } catch(error) {
      return {error: 'invalid json'};
    }
  }
  static async handleDrop(ev) {
    ev.preventDefault();
    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (let i = 0; i < ev.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (ev.dataTransfer.items[i].kind === 'file') {
            let file = ev.dataTransfer.items[i].getAsFile();
            return await MapImportExport._readFile(file);
        }
      }
      return false;
    } else {
      // Use DataTransfer interface to access the file(s)
      for (var i = 0; i < ev.dataTransfer.files.length; i++) {
        return await MapImportExport._readFile(ev.dataTransfer.files[i])
      }
      return false;
    }
  }
  _handleDropZoneDrop(ev) {
    this.shadowRoot.querySelector('.dropzone').classList.remove('dragover');
    MapImportExport.handleDrop(ev).then(droppedFile=>{
      this.dispatchEvent(new CustomEvent('droppedfile', {
        detail: droppedFile
      }))
    })
  }
}

export default MapImportExport;

customElements.define('map-import-export', MapImportExport);
