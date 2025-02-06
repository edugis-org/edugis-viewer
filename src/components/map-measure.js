import {LitElement, html, css} from 'lit';
import './map-iconbutton';
import { translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n.js';

/***
 * the following crashes polymer build, moved script load to index.html ?? :
  import {along as turfAlong,
  area as turfArea,
  bearing as turfBearing, 
  distance as turfDistance, 
  length as turfLength, 
  lineString as turfLineString,
  polygon as turfPolygon} from '@turf/turf/turf.es';
*/

// get geographic coordinates along line A to B
function getPointsAlongLine(startPoint, endPoint)
{
    const degrees = {"units": "degrees"};
    const line = turf.lineString([startPoint, endPoint]);
    const length = turf.length(line, degrees);
    const count = Math.ceil(length / 1); // steps of 1 degree
    const dist = length / count;
    const points = [];
    for (var i = 0; i < count; i++) {
        const along = turf.along(line, 0.00000001 + i * dist, degrees);
        points.push(along.geometry.coordinates);
    }
    points.push(turf.along(line, length, degrees).geometry.coordinates);
    return points;
}

function formatDistance(d, units) {
  // units is one of kilometers, miles, degrees
  switch (units) {
    case 'kilometers':
      if (d < 0.01) {
        return (Math.round(d * 10000)/10).toFixed(1) + " m";
      }
      if (d < 2.0) {
        return (Math.round(d * 1000)).toFixed(0) + " m";
      }
      if (d < 10) {
        return d.toFixed(2) + " km";
      }
      if (d < 100) {
        return d.toFixed(1) + " km";
      }
      return d.toFixed(0) + " km";
    break;
  }
}

function formatArea(a) {
  if (a  < 10000) {
    return html`${Math.round(a)} m<sup>2</sup>`
  }
  if (a < 100000) {
    const hectares = Math.round(a /100) / 100;
    return  `${hectares} ha`;
  }
  if (a < 1000000) {
    const hectares = Math.round(a /1000) / 10;
    return  `${hectares} ha`;
  }
  if (a < 10000000){
    const km2 = Math.round(a / 10000) / 100;
    return html`${km2} km<sup>2</sup>`;
  }
  if (a < 100000000){
    const km2 = Math.round(a / 100000) / 10;
    return html`${km2} km<sup>2</sup>`;
  }
  return html`${Math.round(a / 1000000)} km<sup>2</sup>`
}

class MapMeasure extends LitElement {
  static get properties() { 
    return { 
      active: Boolean,
      webmap: Object
    }; 
  }
  constructor() {
      super();
      // initialise variables
      this.shouldReenableDoubleClickZoom = false;
      this._boundHandleClick = this.handleMapClick.bind(this);
      this._boundHandleMapMouseMove = this.handleMapMouseMove.bind(this);
      this._boundHandleKeyPress = this.handleKeyPress.bind(this);
      this.geojson = {
        "type": "FeatureCollection",
        "features": []
      };
      // set property defaults
      this.active = this.activated = false;
      this.webmap = undefined;
  }
  static styles = css`
    .measurecontainer {
      font-size: 14px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      max-height: 100%;
    }
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
      flex-shrink: 0;
    }
    .scrollcontainer {
      display: flex;
      flex-grow: 1;
      flex-direction: column-reverse;
      width: 100%;
      overflow: auto;
    }
    .totals {
      width: 100%;
      font-weight: bold;
    }
    .separator {
      width: 100%;
      height: 1px;
      background-color: lightgray;
      margin-top: 10px;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      margin-bottom: 1em;
      border-collapse: collapse;
    }
    th{
      font-weight: bold;
      background-color: #ddd;
    }
    th, td {
      padding: 0.25em;
      border: 1px solid #ccc;
    }
    .button {
      display: inline-block;
      color: var(--theme-color, white);
      background-color: var(--theme-background-color, #2e7dba);
      border-radius: 4px;
      text-align: center;
      border: 1px solid lightgray;
      padding-left: 3px;
      padding-right: 3px;
    }
    .button:hover {
      cursor: pointer;
      background-color: var(--theme-hover-background-color, #286CA0);
    }
    `;
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
    this.header = html`<div class="header">${t('Measure distance and surface')}</div>`;
    this.startMessage = html`${this.header}${t('Click on the map to measure distance or area')}`;
    this.requestUpdate();
  }
  handleMapMouseMove(e) {
    let features = this.webmap.queryRenderedFeatures(e.point, { layers: ['map-measure-points']});
    this.webmap.getCanvas().style.cursor = (features.length) ? 'pointer' : 'crosshair';
  }
  resetMeasurement()
  {
    this.geojson.features = [];
    this.hasPolygon = false;
    const source = this.webmap.getSource('map-measure-geojson');
    if (source) {
      source.setData(this.geojson);
    }
  }
  updateGeoJsonSource() {
    // update the geojson source
    const source = this.webmap.getSource('map-measure-geojson');
    if (source) {
      source.setData(this.geojson);
    }
  }
  addGeoJsonLinesAndPolygon() {
    // add line through points, calculate distance
    const options = {units: 'kilometers'};
    const pointCount = this.geojson.features.length;
    let polygon = [];
    if (pointCount > 1) {
      for (let i = 1; i < pointCount; i++) {
        const point1 = this.geojson.features[i-1].geometry.coordinates;
        const point2 = this.geojson.features[i].geometry.coordinates;
        const lineDistance = turf.distance(point1, point2, options);
        const line = getPointsAlongLine(point1, point2);
        this.geojson.features.push(
          {
            "type": "Feature",
            "geometry" : {
              "type": "LineString",
              "coordinates": line
            },
            "properties": {
              "length": formatDistance(lineDistance, options.units)
            }
          }
        );
        if (this.hasPolygon) {
          polygon.push(...line);
        }
      }
      if (polygon.length) {
        polygon.push(polygon[0]);
        this.geojson.features.push(
          {
            "type": "Feature",
            "geometry": {
              "type": "Polygon",
              "coordinates": [polygon]
            },
            "properties": {}
          }
        )
      }
    } 
  }
  removeLastPoint() {
    this.geojson.features = this.geojson.features.filter(feature=>feature.geometry.type=="Point");
    this.hasPolygon = false;
    if (this.geojson.features.length > 0) {
      if (this.geojson.features[this.geojson.features.length-1].geometry.type=="Point") {
        // remove last point feature
        this.geojson.features.pop();
      }
    }
    this.addGeoJsonLinesAndPolygon();
    this.updateGeoJsonSource();
    this.requestUpdate();
  }
  handleKeyPress(e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.removeLastPoint();
    }
  }
  handleMapClick(e) {
    this.mouseUsed = (e && e.originalEvent && e.originalEvent.pointerType && e.originalEvent.pointerType === 'mouse')
    if (this.webmap.version) {
      let clickedFeatures = this.webmap.queryRenderedFeatures(e.point, { layers: ['map-measure-points'] });
      if (this.hasPolygon) {
        this.resetMeasurement();
        clickedFeatures = [];
      }
      
      // Remove the linestrings from the group
      // So we can redraw it based on the points collection
      this.geojson.features = this.geojson.features.filter(feature=>feature.geometry.type=="Point");
 
      let point = [e.lngLat.lng, e.lngLat.lat];
      if (clickedFeatures.length) {
        const clickedID = clickedFeatures[0].properties.id;
        // an existing point was clicked
        if (this.geojson.features.length > 2 && this.geojson.features[0].properties.id === clickedID) {
          // closing polygon
          this.hasPolygon = true;
          point = this.geojson.features[0].geometry.coordinates;
          this.geojson.features.push(
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": point
              },
              "properties": {
                "id": (this.geojson.features.length + 1).toString()
              }
            }
          );
        } else {
          if (this.geojson.features[this.geojson.features.length -1].properties.id === clickedID) {
            // clicked last point
            this.resetMeasurement();
          }
        }
      } else {
        // add a new point
        this.geojson.features.push(
          {
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": point
            },
            "properties": {
              "id": (this.geojson.features.length + 1).toString()
            }
          }
        );
      }

      this.addGeoJsonLinesAndPolygon();
      this.updateGeoJsonSource();
      this.requestUpdate();
    };
  };
  updateActivation() {
    if (this.active === this.activated) {
      return;
    }
    this.activated = this.active;
    if (this.webmap.version) {
      if (this.activated) {
        // setup measuring on map
        if (this.webmap.doubleClickZoom.isEnabled()) {
          this.webmap.doubleClickZoom.disable();
          this.shouldReenableDoubleClickZoom = true;
        }
        this.webmap.addSource('map-measure-geojson', {
          "type":"geojson", 
          "data":this.geojson
        });
        this.webmap.addLayer({
          "id": "map-measure-line",
          "type": "line",
          "metadata": {"isToolLayer": true},
          "source": "map-measure-geojson",
          "layout": {
              "line-join": "round",
              "line-cap": "round"
          },
          "paint": {
              "line-color": "#c30",
              "line-width": 3,
              "line-dasharray": [3, 2]
          },
          "filter": ['in', '$type', 'LineString']
        });
        this.webmap.addLayer({
          "id": "map-measure-points",
          "type": "circle",
          "metadata": {"isToolLayer": true},
          "source": "map-measure-geojson",
          "paint": {
            "circle-radius": 5,
            "circle-color": ["match", 
              ["get", "id"], 
              "1", "#000", 
              "#999"]
          },
          "filter": ['>', 'id', '']
        });
        this.webmap.addLayer({
          "id": "map-measure-surface",
          "type": "fill",
          "metadata": {"isToolLayer": true},
          "source": "map-measure-geojson",
          "filter": ['==', '$type', "Polygon"],
          "layout": {
            "visibility": "visible"
          },
          "paint": {
            "fill-color": "#c30",
            "fill-opacity": 0.4
          }
        })
        this.webmap.addLayer({
          "id": "map-measure-line-length",
          "type": "symbol",
          "source": "map-measure-geojson",
          "metadata": {"isToolLayer": true},
          "filter": ['==', '$type', 'LineString'],
          "layout": {
            "symbol-placement": "line",
            "text-field": "{length}",
            "text-size": 14,
            "text-rotation-alignment": "map",
            "visibility": "visible"
          },
          "paint": {
            "text-color": "#000",
            "text-halo-color": "#fff",
            "text-halo-width": 4
          }
        });
        this.webmap.on('click', this._boundHandleClick);
        this.webmap.on('mousemove', this._boundHandleMapMouseMove);
        this.webmap.getCanvasContainer().addEventListener('keydown', this._boundHandleKeyPress);
      } else {
        // remove measuring from map
        this.hasPolygon = false;
        this.geojson.features = [];
        if (this.shouldReenableDoubleClickZoom) {
          this.webmap.doubleClickZoom.enable();
          this.shouldReenableDoubleClickZoom = false;
        }
        this.webmap.off('click', this._boundHandleClick);
        this.webmap.off('mousemove', this._boundHandleMapMouseMove);
        this.webmap.getCanvasContainer().removeEventListener('keydown', this._boundHandleKeyPress);
        if (this.webmap.isStyleLoaded()) { // false if webmap got replaced
          this.webmap.removeLayer('map-measure-line');
          this.webmap.removeLayer('map-measure-points');
          this.webmap.removeLayer('map-measure-line-length');
          this.webmap.removeLayer('map-measure-surface');
          this.webmap.removeSource('map-measure-geojson');  
        }
        this.geojson.features = [];
        this.webmap.getCanvas().style.cursor = '';
        this.measureInfo = this.startMessage;
      }
    }
  }
  shouldUpdate(changedProperties) {
    if (changedProperties.has('active')) {
      this.updateActivation();
    }
    return true;
  }
  render() {
    if (!this.active) {
      return html``;
    }
    const points = this.geojson.features.filter(f => f.geometry.type == 'Point');
    let measurements = [];
    let totalDistance = 0;
    let totalArea = this.hasPolygon ? turf.area(this.geojson.features[this.geojson.features.length-1]) : 0;
    for (let p = 1; p < points.length; p++) {
      const distance = turf.distance(points[p-1].geometry.coordinates, points[p].geometry.coordinates, {units: 'kilometers'});
      totalDistance += distance;
      const bearing = turf.bearing(points[p-1].geometry.coordinates, points[p].geometry.coordinates);
      measurements.push({distance: distance, bearing: bearing});
    }
    return html`
    <div class="measurecontainer">
      <div class="header">${t('Measure distance and surface')}</div>
        <div class="scrollcontainer">
          <div>
            ${points.length > 1 ? html`
              <table>
                <tr><th>${t('Distance')}</th><th>${t('Bearing')}</th></tr>
                ${measurements.map(m => html`<tr><td>${formatDistance(m.distance, 'kilometers')}</td><td>${Math.round(m.bearing)} &deg;</td></tr>`)}
              </table>
            ` : ''}
            <div class="totals">
              ${points.length > 2 ? html`${t('Total distance')}: ${formatDistance(totalDistance, 'kilometers')}<br>` : ''}
              ${totalArea > 0 ? html`${t('Area')}: ${formatArea(totalArea)}<br>` : ''}
            </div>
            ${points.length > 1 ? html`<div class="separator"></div>` : ''}
            <div>
              ${points.length === 0 || this.hasPolygon ? html`${t('Click on the map to measure distance or area')}` : ''}
              ${points.length === 1 && !this.hasPolygon ? html`${t('Click next point')}` : ''}
              ${points.length > 1 && !this.hasPolygon ? html`${t('Click next point')}.<br>${t('Click last point to finish')}.` : ''}
              ${points.length > 2 && !this.hasPolygon ? html`<br>${t('Click first point for area')}.` : ''}
              ${points.length > 0 && !this.mouseUsed ? html`<br><div class="button" @click="${e=>this.removeLastPoint(e)}">Del</div>`:html`<br>`}
              ${points.length > 0 ? html`${t('[Del]/[Backspace] to remove last point')}` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
  }
}
customElements.define('map-measure', MapMeasure);
