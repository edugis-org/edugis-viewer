import {LitElement, html, css} from 'lit';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n.js';

function _uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

const FormStatus = {
    setLayer: 1,
    setLayerDetail:2
};
const FormError = {
    noError: 0,
    noLayerName: 1
}

const propertyTypes ={
    "Point":  ["string", "number", "longitude", "latitude", "url"],
    "Line": ["string", "number", "length", "url"],
    "Polygon": ["string", "number", "longitude", "latitude", "perimeter", "area", "url"]
}
const defaultProperties = [
    {name: "id", type: "number"},
    {name: "name", type: "string"}
]

const newLayers = {
    Polygon: {
      "isnewlayer": true,
      "id": null,
      "metadata": {
        "title": "",
        "attributes": {
          "translations": [
            {"name": "name", "translation": "naam"}
          ]
        },
        "properties": defaultProperties.map(prop=>({name: prop.name, type: prop.type}))
      },
      "type": "fill",
      "source": {
        "type": "geojson",
        "data": {
          "type": "FeatureCollection",
          "features": []
        },
        "attribution": "EduGIS"
      },
      "paint": {
        "fill-color": "#000",
        "fill-outline-color": "#000",
        "fill-opacity": 0.7
      }
    },
    Line: {
      "isnewlayer": true,
      "id": null,
      "metadata": {
        "title": "",
        "attributes": {
          "translations": [
            {"name": "name", "translation": "naam"}
          ]
        },
        "properties": defaultProperties.map(prop=>({name: prop.name, type: prop.type}))
      },
      "type": "line",
      "source" : {
        "type": "geojson",
        "data": {
          "type": "FeatureCollection",
          "features": []
        },
        "attribution": "EduGIS"
      },
      "paint" : {
        "line-color" : "#000",
        "line-width" : 3
      }
    },
    Point : {
      "isnewlayer": true,
      "id": null,
      "metadata": {
        "title": "",
        "attributes": {
          "translations": [
            {"name": "name", "translation": "naam"}
          ]
        },
        "properties": defaultProperties.map(prop=>({name: prop.name, type: prop.type}))
      },
      "type": "circle",
      "source" : {
        "type": "geojson",
        "data": {
          "type": "FeatureCollection",
          "features": []
        },
        "attribution": "EduGIS"
      },
      "paint" : {
        "circle-pitch-alignment":"map",
        "circle-pitch-scale": "map",
        "circle-radius": 6,
        "circle-color" : "#fff",
        "circle-opacity": 0.7,
        "circle-stroke-color": "#000",
        "circle-stroke-width": 2
      }
    }
  };  

  
export class MapDrawLayerDialog extends LitElement {
    static get styles() {
        return css`
        :host {
            display: block;
        }
        .button {
            display: inline-block;
            color: var(--theme-color, white);
            background-color: var(--theme-background-color, #2e7dba);
            border-radius: 4px;
            text-align: center;
            border: 1px solid lightgray;
            height: 22px;
            margin-top: 2px;
            height: 22px;
            padding-left: 5px;
            padding-right: 5px;
            min-width: 60px;
        }
        .button:hover {
            cursor: pointer;
            background-color: var(--theme-background-color-hover, #286CA0);
        }
        #overlay {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(204,204,204,0.6);
            z-index: 3; /* mapbox-gl uses z-index 2 for tools */
        }
        #window {
          display: flex;
          flex-direction: column;
          border: 1px solid lightgray;
          box-shadow: 4px 4px 9px 0px rgba(168,168,168,1);
          border-radius: 4px;
          min-width: 40%;
          max-width: 70%;
          min-height: 120px;
          max-height: 80%;
          background-color: white;
          font-size: 14px;
        }
        #header {
          display: block;
          height: 2em;
          border-bottom: 1px solid whitesmoke;
          background-color: var(--theme-background-color, #2e7dba);
          color: var(--theme-color, white);
        }
        #closebutton {
          float: right;
          padding: 2px 10px;
          margin: 2px;
          cursor: pointer;
          font-weight: bold;
        }
        #closebutton:hover {
          background-color: lightgray;
          color: black;
        }
        #layerlist {
            max-height: 200px;
            overflow: auto;
        }
        #content {
          overflow: auto;
          padding: 5px;
        }
        .error {
            color: red;
        }
        .btnsmall {
            width: 20px;
            height: 20px;
            line-height: 100%;
            box-sizing: border-box;
            text-align: center;
            padding: 0;
        }
        .btncolumn {
            width: 22px;
        }
        table, th, td {
            border: 1px dotted;
            border-collapse: collapse;
        }
        .propertyname  {
            white-space: nowrap;
        }
        table {
            margin-top: 2px;
            margin-left: 5px;
            width: 100%;
            table-layout: fixed;
        }
        th {
            background-color: lightgray;
            text-align: left;
        }
        td input {
            max-width: calc(100% - 10px);
        }
        #layerlist, #layerlist select {
            width: 100%;
        }
        `
    }
    static get properties() { 
        return { 
          active: {type: Boolean},
          formStatus: {type: Number}
        }; 
    }
    constructor() {
        super();
        this.active = false;
        this.formStatus = FormStatus.setLayer;
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
    shouldUpdate(changedProp) {
        if (changedProp.has('active')) {
            if (this.active) {
                // reset
                this.formStatus = FormStatus.setLayer;
            }
        }
        if (changedProp.has('formStatus')) {
            if (this.formStatus === FormStatus.setLayerDetail) {
                setTimeout(()=>{
                    const ref = this.shadowRoot.querySelector('#layername');
                    if (ref) {
                        ref.focus();
                    }
                },500);
            }
        }
        return true;
    }
    _removeProperty(event, idx) {
        this.currentEditLayer.metadata.properties.splice(idx,1);
        this.requestUpdate();
    }
    _addProperty(event) {
        const propertyName = this.shadowRoot.querySelector('#propertyName').value;
        const propertyType = this.shadowRoot.querySelector('#propertyType').value;
        if (propertyName.trim() === "") {
            return;
        }
        this.currentEditLayer.metadata.properties.push({name: propertyName, type: propertyType});
        this.shadowRoot.querySelector('#propertyName').value = "";
        this.shadowRoot.querySelector('#propertyType').options[0].selected = true;
        this.requestUpdate();
    }
    _createNewLayer() {
        this.currentEditLayer = JSON.parse(JSON.stringify(newLayers[this.featureType]));
        this.currentEditLayer.id = this.currentEditLayerId = _uuidv4();
    }
    _checkEnterKeyInTitle(event) {
        if (event.key === "Enter") {
            const ref = this.shadowRoot.querySelector('#propertyName');
            if (ref) {
                ref.focus();
            }
        }
    }
    _checkEnterInPropertyName(event) {
        if (event.key === "Enter") {
            this._addProperty();
        }
    }
    _renderLayerForm(){
        switch(this.formStatus) {
            case FormStatus.setLayer:
                return html`
                <div>${t('Select a layer')}: </div>
                <div id="layerlist" @dblclick="${(e)=>this._handleNextButtonClick(e)}">
                    <select size="10">
                        <option value="new" ?selected="${this.currentEditLayerId == null}">${t('New draw layer', {layertype: t(`layertype${this.featureType}`)})}</option>
                        ${this.editableLayers.map(layer=>{
                            return html`<option value="${layer.id}" ?selected="${layer.id===this.currentEditLayerId}">${layer.metadata.title}</option>`
                        })}
                    </select>
                </div>
                <div tabindex="0" class="button" @keydown="${(e)=>{if (e.key==='Enter') this._handleNextButtonClick()}}" @click="${(e)=>this._handleNextButtonClick(e)}">${t('Next')}</div>
                `
            case FormStatus.setLayerDetail:
                if (!(this.currentEditLayer && this.currentEditLayer.id === this.currentEditLayerId)) {
                    this.currentEditLayer = this.editableLayers.find(layer=>layer.id === this.currentEditLayerId);
                }
                if (!this.currentEditLayer) {
                    this._createNewLayer();
                }
                let placeHolder = this.currentEditLayer.metadata.title;
                if (placeHolder === "") {
                    placeHolder = t('name of new layer',{layertype: t(`layertype${this.featureType}`)});
                }
                return html`
                <input id="layername" type="text" @keyup="${(e)=>this._checkEnterKeyInTitle(e)}" value="${this.currentEditLayer.metadata.title}" placeholder="${placeHolder}">
                ${this.formError === FormError.noLayerName ? html`<div class="error">${t('Enter a name')}</div>`:''}
                <div>
                    <div>
                    <table id="propertytable">
                        <tr><th>${t('Properties')}</th><th>${t('Type')}</th><th class="btncolumn"></th></tr>
                        ${this.currentEditLayer.metadata.properties.map((property,idx)=>html`<tr><td>${t(property.name)}</td><td>${t(property.type)}</td><td>${idx===0?'':html`<button class="btnsmall" @click="${(e)=>this._removeProperty(e, idx)}">-</button>`}</td></tr>`)}
                        <tr>
                        <td><input id="propertyName" @keyup="${(e)=>this._checkEnterInPropertyName(e)}" type="text" placeholder="${t('new property')}"></td>
                        <td>
                            <select id="propertyType">
                            ${propertyTypes[this.featureType].map((type, idx)=>html`<option ?selected=${idx===0} value="${type}">${t(type)}</option>`)}
                            </select>
                        </td>
                        <td><button class="btnsmall" @click="${(event)=>this._addProperty(event)}">+</button></tr>
                    </table>
                    </div>
                </div>
                <div tabindex="0" class="button" @click="${(e)=>this._handleBackButtonClick(e)}" @keydown="${(e)=>{if (e.key==='Enter') this._handleBackButtonClick()}}">${t('Previous')}</div>
                <div tabindex="0" class="button" @click="${(e)=>this._handleOkButtonClick(e)}" @keydown="${(e)=>{if (e.key==='Enter') this._handleOkButtonClick()}}">${t('OK')}</div>
                `;
            default:
                return html`invalid form status`;
        }
    }
    render() {
        if (!this.active) {
            return html``;
        }
        return html`
        <div id="overlay">
            <div id="window" @click="${e=>e.stopPropagation()}">
                <div id="header"><div @click="${e=>this._close(e)}" id="closebutton">x</div></div>
                <div id="content">
                    ${this._renderLayerForm()}
                </div>
            </div>
        </div>`
    }
    firstUpdated() {

    }
    updated() {

    }
    _handleBackButtonClick(e) {
        this.formStatus = FormStatus.setLayer;
    }
    _handleNextButtonClick(e) {
        this.currentEditLayerId = this.shadowRoot.querySelector('select').value;
        this.formStatus = FormStatus.setLayerDetail;
    }
    _checkForm() {
        const layername = this.renderRoot.querySelector('#layername').value.trim();
        if (layername === '') {
            this.formError = FormError.noLayerName;
            return false;
        }
        this.formError = FormError.noError;
        return true;
    }
    _handleOkButtonClick(e) {
        if (this._checkForm()) {
            const dialogLayerTitle = this.shadowRoot.querySelector('#layername').value.trim();
            this.titleHasChanged = (dialogLayerTitle !== this.currentEditLayer.metadata.title);                
            this.currentEditLayer.metadata.title = dialogLayerTitle;
            this._addProperty(); // add property if user forgot to click '+' button
            if (!this.editableLayers.find(layer=>layer.id === this.currentEditLayerId)) {
                this.editableLayers.push(this.currentEditLayer);
            }
            if (this.clickHandler) {
                this.clickHandler();
                this.active = false;
            }
        } else {
            this.requestUpdate();
        }
    }
    _close(e) {
        if (this.cancelHandler) {
            this.cancelHandler();
        }
        this.active = false;
    }
}

customElements.define('map-draw-layerdialog', MapDrawLayerDialog);