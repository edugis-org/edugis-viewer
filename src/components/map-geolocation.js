import {LitElement, html, css} from 'lit';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n.js';

/* polyfill */
Math.log10 = Math.log10 || function(x) {
  return Math.log(x) * Math.LOG10E;
};

/**
* @polymer
* @extends HTMLElement
*/
class MapGeolocation extends LitElement {
  static get properties() { 
    return { 
      active: Boolean,
      message: String,
      webmap: Object,
      updatecount: Number
    }; 
  }
  static styles = css`
    .title {
      font-weight: bold;
      position: relative;
      font-size: 16px;
      width: 100%;
      height: 30px;
      padding: 5px;
      border-bottom: 1px solid lightblue;
      box-sizing: border-box;
      margin-bottom: 12px;
    }
  `
  constructor() {
      super();
      this.active = false;
      this.updatecount = 0;
      this.latitude = 0;
      this.longitude = 0;
      this.tracking = false;
      this.message = `${t('Determining position')}...`;
      this.watchId = undefined;
      this.webmap = undefined;
      this.flownTo = false;
      this.geojson = {
        "type": "FeatureCollection",
        "features": []
      };
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
    this.updateMessage();
  }
  shouldUpdate(changedProps) {
    if (changedProps.has('active')) {
      if (this.active && this.watchId === undefined) {
        setTimeout(()=>this.prepareMap(), 0);
      } else {
        if (!this.active && this.watchId !== undefined) {
          this.clearMap();
        }
      }
    }
    return this.active;
  }
  geoJSONCircle (pos, radius, points) {
    if(!points) points = 64;

    const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
    };

    const km = radius / 1000.0;

    const ret = [];
    const distanceX = km/(111.320*Math.cos(coords.latitude*Math.PI/180));
    const distanceY = km/110.574;

    let theta, x, y;
    for(let i=0; i<points; i++) {
        theta = (i/points)*(2*Math.PI);
        x = distanceX*Math.cos(theta);
        y = distanceY*Math.sin(theta);

        ret.push([coords.longitude+x, coords.latitude+y]);
    }
    ret.push(ret[0]);

    return {
       "type": "Feature",
       "geometry": {
          "type": "Polygon",
          "coordinates": [ret]
        }
    };
  };
  geojSONPoint(pos) {
    return {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [pos.coords.longitude, pos.coords.latitude]
      }
    }
  }
  success(pos){
    this.pos = pos;
    this.error = null;
    this.updateMessage();
    if (this.webmap.version) {
      this.geojson.features = [];
      this.geojson.features.push(this.geoJSONCircle(pos, pos.coords.accuracy));
      this.geojson.features.push(this.geojSONPoint(pos));
      this.webmap.getSource('map-geolocate').setData(this.geojson);
      if (!this.flownTo) {
        let zoom = this.webmap.getZoom();
        if (zoom < 15) {
          zoom = 15;
        }
        this.webmap.flyTo({center:[pos.coords.longitude,pos.coords.latitude], zoom:zoom});
        this.flownTo = true;
      }
    }
  }
  error(err) {
    this.pos = null;
    this.error = err;
    this.updateMessage();
  }
  prepareMap() {
    if (this.webmap.version) {
      this.webmap.addSource('map-geolocate', {
        "type":"geojson", 
        "data":this.geojson
      });
      this.webmap.addLayer({
        "id": "map-geolocate-radius",
        "type": "fill",
        "metadata": {"isToolLayer": true},
        "source": "map-geolocate",            
        "paint": {
          "fill-color": "rgba(149,201,253,0.3)",
          "fill-outline-color": "rgb(66,133,244)",
        },
        "filter": [
          "all", 
          ["==", "$type", "Polygon"]
        ]
      });
      this.webmap.addLayer({
        "id": "map-geolocate-point",
        "type": "circle",
        "metadata": {"isToolLayer": true},
        "source": "map-geolocate",     
        "paint": {
          "circle-radius": 10,
          "circle-color": "rgb(66,133,244)",
          "circle-stroke-color" : "#fff",
          "circle-stroke-width" : 1,
          "circle-pitch-alignment" : "map"
        },
        "filter": [
          "all", 
          ["==", "$type", "Point"]
        ]
      });
    }
    this.flownTo = false;
    this.watchId = navigator.geolocation.watchPosition((pos)=>this.success(pos), (err)=>this.error(err), {enableHighAccuracy: true, timeout: 45000, maximumAge: 0});
  }
  clearMap() {
    navigator.geolocation.clearWatch(this.watchId);
    this.watchId = undefined;
    this.message = `${t('Determining position')}...`
    this.geojson.features = [];
    try {
      if (this.webmap.version) {
        this.webmap.removeLayer('map-geolocate-radius');
        this.webmap.removeLayer('map-geolocate-point');
        this.webmap.removeSource('map-geolocate');
      }
    } catch (err) {
      console.warn('geolocate.clearMap: exception ' + err);
    }
  }
  updateMessage() {
    if (this.pos) {
      // 1 meter => 6 digit coordinate, 10 meter => 5 digit coordinate, 100 meter 4 digit coordinate etc.
      const factor = 6 - Math.round(Math.log10(this.pos.coords.accuracy));
      this.message = html`
      <b>${t('Longitude')}:</b> ${this.pos.coords.latitude.toFixed(factor)}&deg;<br>
      <b>${t('Latitude')}:</b> ${this.pos.coords.longitude.toFixed(factor)}&deg;<br>
      <b>${t('Precision')}:</b> ${Math.round(this.pos.coords.accuracy)} m`;
    } else if (this.error) {
      this.message = `${t('Error')}: ${this.error.code} : ${this.error.message}`;
    } else {
      this.message = `${t('Determining position')}...`
    }
  }
  render() {
    return html`
    <div class="title">${t('Location')}</div>
    <div>
      ${this.message}
    </div>`;
  }
}
customElements.define('map-geolocation', MapGeolocation);
