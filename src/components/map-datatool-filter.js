// skeleton for a lit-element component
// Path: src\components\test.js
// Compare this snippet from src\components\map-datatool-intersect.js:
import {LitElement, html, css} from 'lit';
import getVisibleFeatures from '../utils/mbox-features';
import {until} from 'lit-html/directives/until.js';
import './wc-button';

let outputLayerCounter = 0;

class MapDatatoolFilter extends LitElement {
    static get styles() {
        return css`
        :host {
            display: block;
        }
        #form {
            position: relative;
            min-width: 250px;
            min-height: 50px;
            border: 1px solid black;
            padding: 5px;
        }
        #form select {
            width: 100%;
            margin-bottom: 5px;
        }
        #form label {
            font-weight: bold;
        }
        #form #operatorselect {
            width: 10em;
        }
        `
    }
    static get properties() { 
        return { 
          map: {type: Object},
          layerId: {type: String},
          buttonEnabled: {type: Boolean}
        }; 
    }
    constructor() {
        super();
        this.layerId = "";
        this.properties = {};
        this.selectedProperty = "";
        this.selectedOperator = "==";
        this.outputLayername = "";
        this.map = {};
        this.buttonEnabled = false;
        this.value = undefined;
        this.logicalOperator = "new";
        this.outputLayerId = "";
        this.outputLayer = undefined;
        this.attributeTranslations = [];
    }
    shouldUpdate(changedProp) {
        if (changedProp.has('map')) {
            // do something with sprop change
        }
        return true;
    }
    render() {
        const layers = this.map.getStyle().layers.filter(layer=>layer.metadata && !layer.metadata.reference && !layer.metadata.isToolLayer && ['fill','line','circle','symbol'].includes(layer.type));
        if (layers.length < 1) {
            return html`${layers.length} kaartlagen aanwezig (minimaal 1 nodig)`;
        }
        return html`
        <div id="form">
            ${this._renderLayerList()}
            ${until (this._renderAttributeList(), html`<p>loading...</p>`)}
            ${this._renderOperatorList()}
            ${this._renderExpression()}
            ${this._renderLogicalOperators()}
            <input type="text" placeholder="naam van uitvoerlaag" name="outputname" ?disabled="${this.layerid===""}" @keyup="${(e)=>this._outputNameUpdate(e)}" .value="${this.outputLayername}">
            <wc-button class="edugisblue" @click="${e=>this._handleClick(e)}" ?disabled="${!this.buttonEnabled}">Filteren</wc-button><br>
        </div>`
    }
    firstUpdated() {

    }
    updated() {

    }
    _outputNameUpdate(e) {
        this.outputLayername = e.target.value;
        this.buttonEnabled = this.outputLayername.trim().length && this.layerid !== "";
    }
    _handleLogicalOperatorChange(e) {
        this.logicalOperator = e.target.value;
    }
    _renderLogicalOperators() {
        if (this.outputLayerId === "") {
            return html``;
        }
        if (!this.map.getLayer(this.outputLayerId)) {
            return html``;
        }
        return html`<div>
        <input name="logicop" type="radio" id="new" ?checked="${this.logicalOperator==="new"}" value="new" @change="${(e)=>this._handleLogicalOperatorChange(e)}">
        <label for="new">maak nieuwe uitvoer-laag</label><br/>
        <input name="logicop" type="radio" id="and" ?checked="${this.logicalOperator==="and"}" value="and" @change="${(e)=>this._handleLogicalOperatorChange(e)}">
        <label for="and">toepassen op bestaande uitvoer</label><br/>
        <input name="logicop" type="radio" id="or" ?checked="${this.logicalOperator==="or"}" value="or" @change="${(e)=>this._handleLogicalOperatorChange(e)}">
        <label for="or">toevoegen aan bestaande uitvoer</label>
        </div>
        `;
    }
    _stringValueChanged(e) {
        this.value = e.target.value;
    }
    _numberValueChanged(e) {
        this.value = parseFloat(e.target.value);
    }
    _booleanValueChanged(e) {
        this.value = e.target.checked;
    }
    _renderExpression() {
        if (this.selectedProperty === "" || this.selectedOperator === "null" || this.selectedOperator === "!null") {
            return html``;
        }
        // add extra html to each case
        switch(this.properties[this.selectedProperty].type) {
            case "string":
                return html`<label for="stringvalue">Waarde</label><input id="stringvalue" type="text" .value="${this.value?this.value:''}" @change="${(e)=>this._stringValueChanged(e)}">`;
            case "number":
                return html`<label for="numbervalue">Waarde</label><input id="numbervalue" type="number" .value="${this.value}" @change="${(e)=>this._numberValueChanged(e)}">`;
            case "boolean":
                return html`<label for="booleanvalue">Waarde</label><input id="booleanvalue" type="checkbox" ?checked="${this.value}" @change="${(e)=>this._booleanValueChanged(e)}">`;
            default:
                return html``;
        }
    }
    _layerSelected(e) {
        this.properties = {};
        this.selectedProperty = "";
        this.layerId = e.target.value;
        this.selectedOperator = "==";
        this.attributeTranslations = [];
        this.outputLayername = "";
        const layer = this.map.getLayer(this.layerId);
        if (!layer) {
            return;
        }
        this.attributeTranslations = layer?.metadata?.attributes?.translations??[];
        this.outputLayerId = layer.id + "_filter_" + outputLayerCounter;
        this.outputLayer = this.map.getLayer(this.outputLayerId);
        if (this.outputLayer) {
            this.outputLayername = layer.metadata.title;
        } else {
            this.outputLayername = "";
        }
    }
    _operatorSelected(e) {
        this.selectedOperator = e.target.value;
        this.update();
    }
    _renderOperatorList() {
        // check if this.selectedProperty is empty string
        if (this.selectedProperty === "") {
            return html``;
        }
        switch(this.properties[this.selectedProperty].type) {
            case "string":
                return html`<label for="operatorselect">Operator</label><div class="styled-select"><select id="operatorselect" @change="${(e)=>this._operatorSelected(e)}">
                <option value="==" ?selected="${this.selectedOperator==='='}">=</option>
                <option value="!=" ?selected="${this.selectedOperator==='<>'}">!=</option>
                <option value="null" ?selected="${this.selectedOperator==='null'}">geen data (null)</option>
                <option value="!null" ?selected="${this.selectedOperator==='!null'}">wel data (not null)</option>
                <option value="contains" ?selected="${this.selectedOperator==='contains'}">bevat</option>
                <option value="!contains" ?selected="${this.selectedOperator==='!contains'}">bevat niet</option>
                <option value="startsWith" ?selected="${this.selectedOperator==='startsWith'}">begint met</option>
                <option value="endsWith" ?selected="${this.selectedOperator==='endsWith'}">eindigt met</option>
                </select><span class="arrow"></span></div>`
            case "boolean":
                return html`<label for="operatorselect">Operator</label><div class="styled-select"><select id="operatorselect" @change="${(e)=>this._operatorSelected(e)}">
                <option value="==" ?selected="${this.selectedOperator==='='}">=</option>
                <option value="!=" ?selected="${this.selectedOperator==='<>'}">!=</option>
                <option value="null" ?selected="${this.selectedOperator==='null'}">geen data (null)</option>
                <option value="!null" ?selected="${this.selectedOperator==='!null'}">wel data (not null)</option>
                </select><span class="arrow"></span></div>`
            case "number":
                return html`<label for="operatorselect">Operator</label><div class="styled-select"><select id="operatorselect" @change="${(e)=>this._operatorSelected(e)}">
                <option value="==" ?selected="${this.selectedOperator==='>'}">=</option>
                <option value=">" ?selected="${this.selectedOperator==='>'}">&gt;</option>
                <option value="<" ?selected="${this.selectedOperator==='<'}">&lt;</option>
                <option value=">=" ?selected="${this.selectedOperator==='>='}">&gt;=</option>
                <option value="<=" ?selected="${this.selectedOperator==='<='}">&lt;=</option>
                <option value="null" ?selected="${this.selectedOperator==='null'}">geen data (null)</option>
                <option value="!null" ?selected="${this.selectedOperator==='!null'}">wel data (not null)</option>
                </select><span class="arrow"></span></div>`
            case "mixed":
                return html`<label for="operatorselect">Operator</label><div class="styled-select"><select id="operatorselect" @change="${(e)=>this._operatorSelected(e)}">
                <option value="==" ?selected="${this.selectedOperator==='==='}">=</option>
                <option value="!=" ?selected="${this.selectedOperator==='!='}">!=</option>
                <option value=">" ?selected="${this.selectedOperator==='>'}">&gt;</option>
                <option value="<" ?selected="${this.selectedOperator==='<'}">&lt;</option>
                <option value=">=" ?selected="${this.selectedOperator==='>='}">&gt;=</option>
                <option value="<=" ?selected="${this.selectedOperator==='<='}">&lt;=</option>
                <option value="null" ?selected="${this.selectedOperator==='null'}">geen data (null)</option>
                <option value="!null" ?selected="${this.selectedOperator==='!null'}">wel data (not null)</option>
                <option value="contains" ?selected="${this.selectedOperator==='contains'}">bevat</option>
                <option value="!contains" ?selected="${this.selectedOperator==='!contains'}">bevat niet</option>
                <option value="startsWith" ?selected="${this.selectedOperator==='startsWith'}">begint met</option>
                <option value="endsWith" ?selected="${this.selectedOperator==='endsWith'}">eindigt met</option>
                </select><span class="arrow"></span></div>`
            default:
                return html``;
        }
    }
    _renderLayerList() {
        const layers = this.map.getStyle().layers.filter(layer=>layer.metadata && !layer.metadata.reference && !layer.metadata.isToolLayer && ['fill','line','circle','symbol'].includes(layer.type));
        if (layers.length < 1) {
          return html`${layers.length} kaartlagen aanwezig (minimaal 1 nodig)`;
        }
        return html`<label for="layerselect">Invoerlaag</label><div class="styled-select"><select id="layerselect" @change="${e=>this._layerSelected(e)}">
        <option value="" disabled selected>Selecteer kaartlaag</option>
        ${layers.map(layer=>html`<option value=${layer.id}>${layer.metadata.title?layer.metadata.title:layer.id}</option>`)}
        </select><span class="arrow"></span></div>`
    }
    _attributeSelected(e) {
        const layer = this.map.getLayer(this.layerId);
        if (!layer) {
            return;
        }
        this.selectedProperty = e.target.value;
        this.update();
    }
    _getAttributesFromFeatures(features) {
        const attributes = {};
        features.forEach(feature=>{
            Object.keys(feature.properties).forEach(attribute=>{
                if (feature.properties[attribute] !== null && feature.properties[attribute] !== undefined) {
                    if (!attributes[attribute]) {
                        attributes[attribute] = {type: typeof feature.properties[attribute]};
                    } 
                    if (attributes[attribute].type != typeof feature.properties[attribute]) {
                        attributes[attribute].type = "mixed";
                    }
                }
            })
        })
        return attributes;
    }
    async _renderAttributeList() {
        if (this.layerId === "") {
            return html``;
        }
        // check if this.properties is empty object
        let selectText = "Selecteer attribuut";
        if (Object.keys(this.properties).length === 0 && this.properties.constructor === Object) {
            const features = await getVisibleFeatures(this.map, this.layerId);
            if (features.length === 0) {
                selectText = "Geen zichtbare elementen in invoerlaag";
            }
            this.properties = this._getAttributesFromFeatures(features);
        }
        return html`<label for="attributeselect">Attribuut</label><div class="styled-select"><select id="attributeselect" @change="${e=>this._attributeSelected(e)}">
        <option value="" disabled ?selected="${this.selectedProperty===''}">${selectText}</option>
        ${Object.keys(this.properties).map(property=>html`<option value=${property} ?selected="${this.selectedProperty===property}">${this.attributeTranslations.find(({name})=>name===property)?.translation??property}</option>`)}
        </select><span class="arrow"></span></div>`
    }
    _getLayerFilterExpression() {
        let filter = [];
        switch (this.selectedOperator) {
            case "==":
            case "!=":
            case ">":
            case "<":
            case ">=":
            case "<=":
                if (typeof this.value == "string") {
                    filter = [this.selectedOperator, ["downcase", ["get" , this.selectedProperty]], this.value.toLowerCase()];
                } else {
                    filter = [this.selectedOperator, ["get" , this.selectedProperty], this.value];
                }
                break;
            case "null":
                filter = ["any", ["!", ["has", this.selectedProperty], ["==", ["get", this.selectedProperty], null]]];
                break;
            case "!null":
                filter = ["all", ["has", this.selectedProperty], ["!=", ["get", this.selectedProperty], null]];
                break;
            case "contains":
                filter = ["!=", ["index-of", this.value.toLowerCase(), ["downcase", ["get", this.selectedProperty]], 0], -1];
                break;
            case "!contains":
                filter = ["==", ["index-of", this.value.toLowerCase(), ["downcase", ["get", this.selectedProperty]], 0], -1];
                break;
            case "startsWith":
                filter = ["==", ["index-of", this.value.toLowerCase(), ["downcase", ["get", this.selectedProperty]], 0], 0];
                break;
            case "endsWith":
                filter = ["==", ["index-of", this.value.toLowerCase(), ["downcase",["get", this.selectedProperty]], 0], ["-", ["length", ["get", this.selectedProperty]], this.value.length]];
                break;
        }
        switch (this.logicalOperator)   {
            case "new":
                break;
            case "and":
                filter = ["all", filter, this.outputLayer.filter];
                break;
            case "or":
                filter = ["any", filter, this.outputLayer.filter]
                break;
        }
        return filter;
    }
    async _handleClick(e) {
        switch (this.logicalOperator)   {
            case "new":
                if (this.outputLayer) {
                    outputLayerCounter++;
                    this.outputLayerId = this.layerId + "_filter_" + outputLayerCounter;
                    this.outputLayer = undefined;
                }
                break;
            case "and":
                break;
            case "or":
                break;
        }
        const filterExpression = this._getLayerFilterExpression();
        if (this.outputLayer) {
            this.map.setFilter(this.outputLayerId, filterExpression);
        } else {
            const inputLayer = this.map.getLayer(this.layerId).serialize();
            const newLayer = {...inputLayer};
            newLayer.id = this.outputLayerId;
            newLayer.metadata = {
                title: this.outputLayername,
                abstract: `Filter op ${this.selectedProperty} ${this.selectedOperator} ${this.value}`
            }
            newLayer.source = this.map.getSource(inputLayer.source).serialize();
            newLayer.filter = filterExpression;
            this.dispatchEvent(new CustomEvent('addlayer', {detail: newLayer, bubbles: true, composed: true}));
            setTimeout(() => {
                this.outputLayer = this.map.getLayer(this.outputLayerId);
            }, 500);
        } 
    }
}

//register the custom element
customElements.define('map-datatool-filter', MapDatatoolFilter);

