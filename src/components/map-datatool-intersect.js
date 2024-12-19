import {LitElement, html, css} from 'lit';
import getVisibleFeatures from '../utils/mbox-features';
import './wc-button';

class MapDatatoolIntersect extends LitElement {
    static get styles() {
        return css`
        :host {
            display: block;
        }`
    }
    static get properties() { 
        return { 
          resulttype: {type: String},
          map: {type: Object},
          intersectCount: {type: Number},
          busyMessage: {type: String},
          outputLayername: {type: String}
        }; 
    }
    constructor() {
        super();
        this.resulttype = 'complete';
        this.map = {};
        this.intersectCount = -1;
        this.outputLayername = "";
        this.worker = new Worker('./src/workers/intersect.js');
        this.worker.onmessage = (e) => this._handleWorkerMessage(e);
        this.busyMessage = '';
    }
    connectedCallback() {
        super.connectedCallback()
        //addEventListener('keydown', this._handleKeydown);
    }
    disconnectedCallback() {
        super.disconnectedCallback()
        //window.removeEventListener('keydown', this._handleKeydown);
    }
    shouldUpdate(changedProp) {
        if (changedProp.has('sprop')) {
            // do something with sprop change
        }
        return true;
    }
    render() {
        return html`
            <b>Intersect berekenen</b><p></p>
            Bereken elementen in kaartlaag 1 die een element in kaartlaag2 snijden (ergens raken)<p></p>
            <b>Kaartlaag 1</b><br>
            ${this._renderLayerList()}
            <b>Kaartlaag 2</b><br>
            ${this._renderLayerList()}
            <b>Uitvoer:</b><br>
            <input type="radio" name="resulttype" value="complete" id="complete" ?checked="${this.resulttype==='complete'}" @change="${(e)=>this._radioChanged(e)}"><label for="complete">Volledig</label><br>
            <input type="radio" name="resulttype" value="intersectonly" id="intersectonly" ?checked="${this.resulttype==='intersectonly'}" @change="${(e)=>this._radioChanged(e)}"><label for="intersectonly">Alleen elementen met een overlap</label><br>
            <input type="radio" name="resulttype" value="nonintersectonly" id="nonintersectonly" ?checked="${this.resulttype==='nonintersectonly'}" @change="${(e)=>this._radioChanged(e)}"><label for="nonintersectonly">Alleen elementen zonder een overlap</label><br>
            <input type="text" placeholder="naam van uitvoerlaag" name="outputname" ?disabled="${!this.targetLayerid||!this.sourceLayerid}" @keyup="${(e)=>this._outputNameUpdate(e)}" .value="${this.outputLayername}">
            <wc-button class="edugisblue" @click="${e=>this._handleClick(e)}" ?disabled="${!this.buttonEnabled}">Berekenen</wc-button><br>
            ${this.busyMessage !== '' ? html`${this.busyMessage}`:html``}
            ${this.intersectCount > -1 ?html`Aantal elementen: ${this.intersectCount}`:html``}
    </div>
    `
    }
    firstUpdated() {

    }
    updated() {

    }
    _radioChanged(e) {
      this.resulttype = e.target.value;
    }
    _outputNameUpdate(e) {
      this.outputLayername = e.target.value;
      this.buttonEnabled = this.outputLayername.trim().length && this.sourceLayerid && this.targetLayerid;
    }
    _layerSelected(e) {
      const selections = this.shadowRoot.querySelectorAll('select');
      const validLayerSelection = (selections.length === 2 && (selections[0].value != selections[1].value) && (selections[0].value !== '') && selections[1].value !== '');
      this.buttonEnabled = validLayerSelection && this.outputLayername.trim().length > 0
      this.sourceLayerid = validLayerSelection ? selections[0].value : undefined;
      this.targetLayerid = validLayerSelection ? selections[1].value : undefined;
      this.intersectCount = -1;
      if (this.sourceLayerid && this.targetLayerid) {
        const outputLayer = this.map.getLayer(this.sourceLayerid+this.targetLayerid);
        if (outputLayer) {
          this.outputLayername = outputLayer.metadata.title;
          this.buttonEnabled = this.outputLayername.trim().length && this.sourceLayerid && this.targetLayerid;
        } else {
          this.outputLayername = "";
        }
      } else {
        this.outputLayername = "";
      }
      this.update();
    }
    _renderLayerList() {
      const layers = this.map.getStyle().layers.filter(layer=>layer.metadata && !layer.metadata.reference && !layer.metadata.isToolLayer && ['fill','line','circle','symbol'].includes(layer.type));
      if (layers.length < 2) {
        return html`${layers.length} kaartlagen aanwezig (minimaal 2 nodig)`;
      }
      return html`<div class="styled-select"><select @change="${e=>this._layerSelected(e)}">
      <option value="" disabled selected>Selecteer kaartlaag</option>
      ${layers.map(layer=>html`<option value=${layer.id}>${layer.metadata.title?layer.metadata.title:layer.id}</option>`)}
      </select><span class="arrow"></span></div>`
    }
    _prepareResultLayer(sourceLayerid, targetLayerid) {
      const sourceLayer = this.map.getLayer(sourceLayerid).serialize();
      if (!sourceLayer) {
        this.resultLayer = null;
        return;
      }
      const resultLayerId = sourceLayerid+targetLayerid;
      if (this.map.getLayer(resultLayerId)) {
        this.dispatchEvent(new CustomEvent('removelayer', {
          detail: {layerid: resultLayerId},
          bubbles: true,
          composed: true
        }))
      }
      this.resultLayer = {
        id: resultLayerId,
        metadata: {
          title: this.outputLayername
        },
        type: sourceLayer.type,
        source: {
          type: "geojson",
          data: []
        },
      };
      this.resultLayer.paint = sourceLayer.paint;
      switch(this.resultLayer.type) {
        case 'fill':
          this.resultLayer.paint["fill-color"] = ["match", ["to-number",["get", "intersect"]],
              1, "red",
              0, "black",
              "gray"
            ];
          break;
        case 'line':
          this.resultLayer.paint["line-color"] =  ["match", ["to-number",["get", "intersect"]],
              1, "red",
              0, "black",
              "gray"
            ];
          break;
        case 'circle':
          this.resultLayer.paint["circle-color"] = ["match", ["to-number",["get", "intersect"]],
              1, "red",
              0, "black",
              "gray"
            ];
          break;
        default:
          this.resultLayer = null;
          break;
      }
    }
    async _calculateIntersect() {
      if (this.sourceLayerid && this.targetLayerid) {
        this.intersectCount = -1;
        this.busyMessage = 'Bezig met berekenen van intersecties...';
        const sourceFeatures = await getVisibleFeatures(this.map, this.sourceLayerid);
        const targetFeatures = await getVisibleFeatures(this.map, this.targetLayerid);
        this._prepareResultLayer(this.sourceLayerid, this.targetLayerid);
        this.worker.postMessage([{type: "FeatureCollection", features:sourceFeatures}, {type:"FeatureCollection", features:targetFeatures}]);
      }
    }
    _handleClick(e) {
      if (!this.buttonEnabled) {
        return;
      }
      this._calculateIntersect();
    }
    _handleWorkerMessage(event) {
      this.busyMessage = '';
      const intersectLayer = event.data;
      this.intersectCount = intersectLayer.features.reduce((total, feature)=>{
        return feature.properties.intersect?total+1:total
      }, 0);
      if (this.resultLayer) {
        switch (this.resulttype) {
          case 'intersectonly':
            intersectLayer.features = intersectLayer.features.filter(feature=>feature.properties.intersect);
            break;
          case 'nonintersectonly':
            intersectLayer.features = intersectLayer.features.filter(feature=>!feature.properties.intersect);
            break;
          case 'complete':
          default:
            break;

        }
        const selections = this.shadowRoot.querySelectorAll('select');
        this.resultLayer.source.data = intersectLayer;
        this.resultLayer.metadata.abstract = `Deze kaartlaag is gemaakt met de EduGIS 'intersect'-tool. ${this.intersectCount} elementen uit ${selections[0][selections[0].selectedIndex].text} snijden met de elementen uit ${selections[1][selections[1].selectedIndex].text}`;
        this.dispatchEvent(new CustomEvent('addlayer', {
          detail: this.resultLayer,
          bubbles: true,
          composed: true
        }))
      }
    }
}

customElements.define('map-datatool-intersect', MapDatatoolIntersect);