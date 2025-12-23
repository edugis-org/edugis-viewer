import {LitElement, html, svg, css} from 'lit';
import {GeoJSON} from '../utils/geojson';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n.js';
import GeoJSONParser from 'jsts/org/locationtech/jts/io/GeoJSONParser';
import DistanceOp from 'jsts/org/locationtech/jts/operation/distance/DistanceOp';
import {customSelectCss} from './custom-select-css.js';
import {getVisibleFeatures} from '../utils/mbox-features.js';
import './wc-button';

const dummyIcon = svg`<svg height="24" width="24" viewbox="0 0 24 24"><style>.normal{ font: bold 18px sans-serif;}</style><text x="4" y="16" class="normal">A</text></svg>`;

let addedLayerCounter = 0;

/**
* @polymer
* @extends HTMLElement
*/
class MapDataToolShortestDistance extends LitElement {
  static get properties() { 
    return {
      map: {type: Object},
      buttonEnabled : {type: Boolean},
      resultMessage: {type: String}
    }; 
  }
  static get styles() {
    return css`
      ${customSelectCss()}
      .buttoncontainer {border: 1px solid gray; border-radius:4px;padding:2px;fill:gray;width:150px;margin-top:5px;}
      .edugisblue {
        --dark-color: var(--theme-background-color, #2e7dba);
        --light-color: var(--theme-color, white);
        width: 100%;
      }
    `
  }
  constructor() {
      super();
      this.map = {};
      this.buttonEnabled = false;
      this.resultMessage = null;
      this.timeoutId = null;
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
  render() {
    return html`
      <b>${t('Calculate shortest distance')}</b><p></p>
      ${t('Calculate the shortest distance from all elements in layer 1 to the nearest element in layer 2.')}<p></p>
      <b>${t('Layer')} 1</b><br>
      ${this._renderLayerList()}<p></p>
      <b>${t('Layer')} 2</b><br>
      ${this._renderLayerList()}<p></p>
      <wc-button class="edugisblue" @click="${e=>this._handleClick(e)}" ?disabled="${!this.buttonEnabled}">${t('Calculate')}</wc-button><br>
      ${this.resultMessage ? this.resultMessage : ''}
    </div>
    `
  }
  _renderLayerList() {
    const layers = this.map.getStyle().layers.filter(layer=>layer.metadata && !layer.metadata.reference && !layer.metadata.isToolLayer && ['fill','line','circle','symbol'].includes(layer.type));
    if (layers.length < 2) {
      return html`${layers.length} ${t('map layers available (at least 2 required)')}`;
    }
    return html`<div class="styled-select"><select @change="${e=>this._layerSelected(e)}">
    <option value="" disabled selected>${t('Select map layer')}</option>
    ${layers.map(layer=>html`<option value=${layer.id}>${layer.metadata.title?layer.metadata.title:layer.id}</option>`)}
    </select><span class="arrow"></span></div>`
  }
  _layerSelected(e) {
    const selections = this.shadowRoot.querySelectorAll('select');
    this.buttonEnabled = (selections.length === 2 && (selections[0].value != selections[1].value) && (selections[0].value !== '') && selections[1].value !== '')
  }
  async _getFeatures(layerid) {
    const features = await getVisibleFeatures(this.map, layerid);
    return {"type":"FeatureCollection", "features": features};
  }
  _turfDistance(sourceFeatures1, sourceFeatures2) {
    const distanceGeojson = {
      "type": "FeatureCollection",
      "features": []
    }
    for (let feature1 of sourceFeatures1.features) {
      let minDistance = 50000;
      let resultFeature2;
      for (let feature2 of sourceFeatures2.features) {
        const distance = turf.distance(feature1, feature2);
        
        if (distance < minDistance) {
          minDistance = distance;
          resultFeature2 = feature2;
        }
      }
      const feature = GeoJSON.Feature("LineString");
      
      feature.geometry.coordinates = [feature1.geometry.coordinates, resultFeature2.geometry.coordinates];
      feature.properties.distance = minDistance;
      distanceGeojson.features.push(feature);
    }
    return distanceGeojson;
  }
  _jstsDistance(sourceFeatures1, sourceFeatures2) {
    // we are using jsts for distance calculations between geometries other than points
    // jsts does not support geodesic distance calculations, so we need to
    // project to EPSG:3857 for euclidian distance calculations
    const features1 = GeoJSON._project(sourceFeatures1, 'EPSG:4326', 'EPSG:3857');
    const features2 = GeoJSON._project(sourceFeatures2, 'EPSG:4326', 'EPSG:3857');

    const distanceGeojson = {
      "type": "FeatureCollection",
      "features": []
    }
    const geoJSONParser = new GeoJSONParser();
    
    for (let feature1 of features1.features) {
      let minDistance = 50000000;
      let points;
      const jstGeom1 = geoJSONParser.read(feature1.geometry);
      for (let feature2 of features2.features) {
        const jstGeom2 = geoJSONParser.read(feature2.geometry);
        const distanceOp = new DistanceOp(jstGeom1, jstGeom2);
        const distance = distanceOp.distance();    
        if (distance < minDistance) {
          minDistance = distance;
          points = distanceOp.nearestPoints();
        }
      }
      const feature = GeoJSON.Feature("LineString");
      
      feature.geometry.coordinates = [[points[0].x, points[0].y], [points[1].x, points[1].y]]
      distanceGeojson.features.push(feature);
    }
    // project back to EPSG:4326 and calculate lengths
    const result = GeoJSON._project(distanceGeojson, 'EPSG:3857', 'EPSG:4326')
    result.features.forEach(feature=>{
      const distance = turf.length(feature, {units: 'meters'});
      if (distance > 100000) {
        feature.properties.kmdistance = Math.round(distance / 1000);
      } else if (distance > 10000) {
        feature.properties.kmdistance = Math.round(distance / 100) / 10;
      } else if (distance > 1000) {
        feature.properties.kmdistance = Math.round(distance / 10) / 100;
      } else if (distance > 100) {
        feature.properties.distance = Math.round(distance);
      } else if (distance > 10) {
        feature.properties.distance = Math.round(distance * 10) / 10;
      } else {
        feature.properties.distance = Math.round(distance * 100) / 100;
      }
    })
    return result;
  }

  async _calculateDistances(layer1id, layer2id) {
    this.buttonEnabled = false;
    const sourceFeatures1 = await this._getFeatures(layer1id);
    const sourceFeatures2 = await this._getFeatures(layer2id);
    let resultFeatures;
    if (sourceFeatures1.type === 'FeatureCollection' && 
        sourceFeatures1.features.length && 
        sourceFeatures1.features[0].geometry.type === 'Point' &&
        sourceFeatures2.type === 'FeatureCollection' && 
        sourceFeatures2.features.length &&
        sourceFeatures2.features[0].geometry.type === 'Point') {
        // two point layers, calculate distance over the globe
        resultFeatures = this._turfDistance(sourceFeatures1, sourceFeatures2);
    } else {
      resultFeatures = this._jstsDistance(sourceFeatures1, sourceFeatures2);
    }
    const newLayer = {
      id: GeoJSON._uuidv4(),
      metadata: {
        title: 'Berekende afstanden' + (addedLayerCounter ? ` (${addedLayerCounter + 1})` : ''),
        attributes: {
          translations: [
            {"name": "distance", "unit": " meter"},
            {'name': "kmdistance", "translation": "distance", "unit": " kilometer"}
          ]
        }
      },
      type: "line",
      source : {
        type: "geojson",
        data: resultFeatures
      },
      paint: {
        "line-color": "black",
        "line-width": 1
      }
    }
    addedLayerCounter++;
    this.dispatchEvent(new CustomEvent('addlayer', {
      detail: newLayer,
      bubbles: true,
      composed: true
    }));
    this._showResultMessage(`Kaartlaag: '${newLayer.metadata.title}' toegevoegd` )
  }
  _handleClick(e) {
    if (!this.buttonEnabled) {
      return;
    }
    const selections = this.shadowRoot.querySelectorAll('select');
    if (selections.length == 2) {
      const layer1id = selections[0].value;
      const layer2id = selections[1].value;
      this._calculateDistances(layer1id, layer2id);
    }
  }
  _showResultMessage(message) {
    if (this.message !== null && this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
    this.resultMessage = message;
    if (this.message !== null ) {
      this.timeoutId = setTimeout(()=>this._showResultMessage(null), 10000);
    } else {
      this.timeoutId = null;
    }
  }
}
customElements.define('map-datatool-shortest-distance', MapDataToolShortestDistance);
