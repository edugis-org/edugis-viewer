
/* 
//see  https://stackoverflow.com/questions/51670987/how-to-import-non-module-javascript-into-polymer-3-0
//import * as mapboxgl from './node_modules/mapbox-gl/dist/mapbox-gl.js';
// load external mapbox-gl.js script
const mapboxgljs = document.createElement('script');
mapboxgljs.setAttribute('src', 'node_modules/mapbox-gl/dist/mapbox-gl.js');
document.head.appendChild(mapboxgljs);
// load external mapbox-gl.css 
const mapboxcss = document.createElement('link');
mapboxcss.setAttribute('href', 'node_modules/mapbox-gl/dist/mapbox-gl.css');
mapboxcss.setAttribute('rel', 'stylesheet');
document.head.appendChild(mapboxcss);
*/

import '../../lib/openmaptiles-language.js';
import './map-data-catalog.js';
import './map-spinner.js';
import './map-coordinates.js';
import './button-expandable.js';
import './map-legend-container.js';
import './map-measure';
import './map-language';
import './map-search';
import './map-dialog';
import './map-gsheet-form';
import './map-info-formatted';
import './map-panel';
import './map-geolocation';
import './map-pitch';
import './map-selected-layers';
import './map-draw';
import './map-import-export';
import './map-data-toolbox';

import {GeoJSON} from '../utils/geojson';
import {getCapabilitiesNodes, copyMetadataToCapsNodes} from '../utils/capabilities';
import {wmsUrl} from '../utils/wmsurl';

import ZoomControl from '../../lib/zoomcontrol';
import { importExportIcon, gpsIcon, languageIcon, arrowLeftIcon, outlineInfoIcon, combineToolIcon, threeDIcon, infoIcon, drawIcon } from './my-icons';
import { measureIcon, layermanagerIcon, searchIcon as gmSearchIcon } from '../gm/gm-iconset-svg';

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getResolution (map)
{
  // returns degrees / pixel-width
  if (!map) {
    return undefined;
  }
  const y = map._container.clientHeight / 2;
  return getAngle(map.unproject([0, y]), map.unproject([1, y]));
}

function getAngle (latlng1, latlng2)
{
  const rad = Math.PI / 180,
      lat1 = latlng1.lat * rad,
      lat2 = latlng2.lat * rad,
      a = Math.sin(lat1) * Math.sin(lat2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.cos((latlng2.lng - latlng1.lng) * rad);
  return Math.acos(Math.min(a, 1)) / rad;
}

let searchGeoJson = {
  "type": "FeatureCollection",
  "features": []
}
const searchSource = { 
  "type" : "geojson",
  "data" : searchGeoJson
};
const searchLines = {        
  "id": "map-search-line",
  "type": "line",
  "metadata": {"isToolLayer": true},
  "source": "map-search-geojson",
  "layout": {
      "line-join": "round",
      "line-cap": "round"
  },
  "paint": {
      "line-color": "#c30",
      "line-width": 3
  },
  "filter": ['in', '$type', 'LineString']
};
const searchPoints ={
  "id": "map-search-points",
  "type": "symbol",
  "metadata": {"isToolLayer": true},
  "source": "map-search-geojson",            
  "layout": {                        
    "icon-image": "{icon}",
    "text-field": "{name}",
    "text-font": ["Noto Sans Regular"],
    "text-offset": [0, 0.6],
    "text-anchor": "top",
    "text-size": 14,
    "text-rotation-alignment": "map",
    "text-ignore-placement": true,
    "text-allow-overlap": true,
    "icon-allow-overlap": true
  },
  "paint": {
    "text-color": "#000",
    "text-halo-color": "#fff",
    "text-halo-width": 1
  },
  "filter": ['==', '$type', 'Point']
};
const searchSurface = {
  "id": "map-search-surface",
  "type": "fill",
  "metadata": {"isToolLayer": true},
  "source": "map-search-geojson",
  "layout": {
    "visibility": "visible"
  },
  "paint": {
    "fill-color": "#c30",
    "fill-opacity": 0.4
  },
  "filter": ['==', '$type', "Polygon"],
};

let StaticMode = {
  onSetup :  function() {
    this.setActionableState(); // default actionable state is false for all actions
    return {};
  },
  toDisplayFeatures : function(state, geojson, display) {
    display(geojson);
  }
}

// srs optional, defaults to 'EPSG:3857'
// adds projected .x and .y properties to lngLat
function projectLngLat(lngLat, srs)
{
    if (!srs) {
        srs = 'EPSG:3857';
    }
    var project = proj4('EPSG:4326', srs);
    var p = project.forward({x: lngLat.lng, y: lngLat.lat});    
    lngLat.x = p.x;
    lngLat.y = p.y;
    return lngLat;
}

import {LitElement, html, svg} from 'lit-element';
import MapImportExport from './map-import-export';
/**
* @polymer
* @extends HTMLElement
*/
class WebMap extends LitElement {
  static get properties() { 
    return { 
      mapstyle: String, 
      lon: Number, 
      lat: Number, 
      zoom: Number,
      pitch: Number,
      navigation: String,
      scalebar: String,
      geolocate: String,
      coordinates: String,
      displaylat: Number,
      displaylng: Number,
      resolution: Number,
      datacatalog: Object,
      layerlist: Array,
      haslegend: Boolean,
      accesstoken: String,
      lastClickPoint: Object,
      currentTool: String,
      configurl: String
    }; 
  }
  constructor() {
    super();
    this.map = null;
    this.pitch = 0;
    this.viewbox = undefined;
    // default property values
    this.mapstyle = document.baseURI + "styles/openmaptiles/osmbright.json";
    this.mapstyleid = "OsmBright";
    this.mapstyletitle = "OSM bright (stijl)";
    this.lon = 5.0;
    this.lat = 52.0;
    this.displaylat = this.lat;
    this.displaylng = this.lon;
    this.zoom = 6;
    this.resolution = 0;
    this.navigation = "false";
    this.zoomlevel = "false";
    this.scalebar = "false";
    this.geolocate = "false";
    this.coordinates = "false";
    this.layerlist = [];
    this.haslegend = false;
    this.accesstoken = undefined;
    this.lastClickPoint = undefined;
    this.currentTool = '';
    this.toolList = [
      {name:"toolbar", visible: true, position: "opened", order: 0, info:""},
      {name:"search", visible: true, position: "", order: 100, info:"Naam, plaats of adres zoeken", icon: gmSearchIcon},
      {name:"datacatalog", visible: true, position: "", order: 101, info:"Kaartlagen", icon:layermanagerIcon},
      {name:"measure", visible: true, position: "", order: 102, info:"Afstand en oppervlakte meten", icon: measureIcon},
      {name:"info", visible: true, position: "", order: 103, info: "Informatie uit de kaart halen", icon: infoIcon},
      {name:"maplanguage", visible: true, position: "", order: 104, info: "Kaarttaal", icon: languageIcon},
      {name:"pitch", visible: true, position: "", order: 105, info: "Kaarthoek", icon: threeDIcon},
      {name:"geolocate", visible: true, position: "", order: 106, info: "Zoom naar mijn locatie", icon: gpsIcon},
      {name:"draw", visible: true, position: "", order: 107, info: "Tekenen", icon: drawIcon},
      {name:"importexport", visible: true, position: "", order: 108, info: "Kaart opslaan / openen", icon: importExportIcon},
      {name:"datatoolbox", visible: true, position: "", order: 109, info: "Gereedschapskist", icon: combineToolIcon},
      {name:"zoomlevel", visible: true, position: "bottom-left", order: 200, info: "Zoom-niveau"},
      {name:"navigation", visible: true, position: "bottom-left", order: 201, info: "Zoom, Roteer"},
      {name:"coordinates", visible: true, position: "bottom-center", order: 202},
      {name:"scalebar", visible: true, position: "bottom-right", order: 203, info: "Schaalbalk"},
      {name:"legend", visible: true, position: "opened", order: 204, info: "Legenda en kaartlagen"},
    ];
  }
  updateSingleLayerVisibility(id, visible) {
    const layer = this.map.getLayer(id);
    if (layer) {
      layer.setLayoutProperty('visibility', (visible ? 'visible' : 'none'));
      // update item in this.layerlist
      const layerlistitem = this.layerlist.find(layerlistitem=>layerlistitem.id===id);
      layerlistitem.layervisible = visible;
    }
  }
  updateLayerVisibility(e) {
    if (this.map) {
      if (Array.isArray(e.detail.layerid)) {
        e.detail.layerid.forEach(id=>{
          this.updateSingleLayerVisibility(id, e.detail.visible);
        });
      } else {
        this.updateSingleLayerVisibility(e.detail.layerid, e.detail.visible);
      }
      this.map._update(true); // TODO: how refresh map wihtout calling private mapbox-gl function?
    }
  }
  updateSingleLayerOpacity(id, opacity) {
    const layer = this.map.getLayer(id);
    if (layer) {
      switch (layer.type) {
        case 'hillshade':
          this.map.setPaintProperty(id, 'hillshade-exaggeration', opacity);
          break;
        default:
          this.map.setPaintProperty(id, `${layer.type}-opacity`, opacity);
      }
    }
  }
  updateLayerOpacity(e) {
    if (this.map) {
      if (Array.isArray(e.detail.layerid)) {
        e.detail.layerid.forEach(id=>{
          this.updateSingleLayerOpacity(id, e.detail.opacity);
        })
      } else {
        this.updateSingleLayerOpacity(e.detail.layerid, e.detail.opacity);
      }
    }
  }
  updateSingleLayerPaintProperty(id, propertyInfo) {
    const layer = this.map.getLayer(id);
    if (layer) {
      for (let key in propertyInfo) {
        if (key !== "layerid") {
          this.map.setPaintProperty(id, key, propertyInfo[key]);  
        }
      }
    }
  }
  updateLayerPaintProperty(e) {
    if (this.map) {
      if (Array.isArray(e.detail.layerid)) {
        e.detail.layerid.forEach(id=>{
          this.updateSingleLayerPaintProperty(id, e.detail);
        })
      } else {
        this.updateSingleLayerPaintProperty(e.detail.layerid, e.detail);
      }
    }
  }
  removeSourceIfOrphaned(source) {
    const otherSourceLayers = this.map.getStyle().layers.filter(layer=>layer.source===source);
    if (otherSourceLayers.length === 0) {
      if (this.map.getSource(source)) {
        this.map.removeSource(source);
      }
    }
  }
  removeLayer(e) {
    if (this.map) {
      const targetLayer = this.map.getLayer(e.detail.layerid);
      if (targetLayer) {
        const source = targetLayer.source;
        this.map.removeLayer(targetLayer.id);
        this.removeSourceIfOrphaned(source);        
      } else {
        // layer not found, check if this layer is a style
        const styleLayers = this.map.getStyle().layers.filter(layer=>layer.metadata?layer.metadata.styleid === e.detail.layerid:false);
        styleLayers.forEach(layer=>{
          const source = layer.source;
          this.map.removeLayer(layer.id);
          this.removeSourceIfOrphaned(source);
        });
      }
      this.resetLayerList();
      this.map._update(true); // TODO: how refresh map without calling private "_update()"?
    }
  }
  restoreNoneReferenceLayers()
  {
    if (this.extraLayers) {
      this.extraLayers.forEach(layer=>{
        if (!this.map.getSource(layer.storedSource.id)) {
          this.map.addSource(layer.storedSource.id, layer.storedSource.source);
          if (layer.storedSource.source.tiles) {
            const newSource = this.map.getSource(layer.storedSource.id);
            if (!newSource.tiles) {
              // mapbox-gl bug? explicitly set .tiles property if necessary
              newSource.tiles = layer.storedSource.source.tiles;
            }
          }
        }
        layer.storedSource = null;
        delete layer.storedSource;
        this.addLayer({detail:layer});
      });
      this.extraLayers = null;
    }
  }
  storeNoneReferenceLayers()
  {
    this.extraLayers = this.map.getStyle().layers.filter(layer=>{
      if (!layer.metadata || !layer.metadata.reference) {
        if (!layer.source) {
          return false;
        }
        const layerSource = this.map.getSource(layer.source);
        let typedSource = {};
        switch (layerSource.type) {
          case "raster":
            if (layerSource.url) {
              typedSource = {
                type: "raster",
                tileSize: layerSource.tileSize,
                url: layerSource.url
              }
            } else {
              typedSource = {
                type: "raster",
                tileSize: layerSource.tileSize,
                attribution: layerSource.attribution,
                tiles: layerSource.tiles,
                minzoom: layerSource.minzoom,
                maxzoom: layerSource.maxzoom
              }
            }
            break;
          case "geojson":
            typedSource = {
              type: "geojson",
              attribution: layerSource.attribution,
              data: layerSource._data
            }
            break;
          case "vector":
            if (layerSource.url) {
              typedSource = {
                  type: "vector",
                  url: layerSource.url
              }
            } else {
              typedSource = {
                id: layer.source,
                type: "vector",
                attribution: layerSource.attribution,
                tiles: layerSource.tiles,
                url: layerSource.url,
                minzoom: layerSource.minzoom,
                maxzoom: layerSource.maxzoom
              }
            }
            break;
          case "raster-dem":
            if (layerSource.url) {
              typedSource = {
                type: "raster-dem",
                url: layerSource.url
              }
            } else {
              typedSource = {
                type: "raster-dem",
                tileSize: layerSource.tileSize,
                encoding: layerSource.encoding,
                tiles: layerSource.tiles,
                attribution: layerSource.attribution
              }
            }
            break;
        }
        if (!typedSource.attribution) {
          delete typedSource.attribution; // undefined attribution not allowed
        }
        if (!typedSource.url) {
          delete typedSource.url;
        }
        if (!typedSource.tiles) {
          delete typedSource.tiles;
        }
        layer.storedSource = {
          id: layer.source,
          source: typedSource
        }
        return true;
      }
      return false;
    });
  }
  setReferenceLayers(styleId, styleTitle) {
    this.map.getStyle().layers.forEach(layer=>{
      let mapLayer = layer;
      if (mapLayer.metadata) {
        mapLayer.metadata.reference = true;
      } else {
        // get reference to original layer
        mapLayer = this.map.getLayer(layer.id);
        mapLayer.metadata = {reference: true};
      }
      if (styleId && !mapLayer.metadata.styleid) {
        mapLayer.metadata.styleid = styleId;
      }
      if (styleTitle && !mapLayer.metadata.styletitle) {
        mapLayer.metadata.styletitle = styleTitle;
      }
    });
  }
  applyStyle(style, styleId, styleTitle) {
    for (let id in style.sources) {
      if (!this.map.getSource(id)) {
        this.map.addSource(id, style.sources[id]);
      }
    }
    style.layers.forEach(layer=>{
      if (!layer.metadata) {
        layer.metadata = {};
      }
      layer.metadata.styletitle=styleTitle;
      layer.metadata.styleid=styleId;
      this.addLayer({detail:layer});
    });
  }
  loadStyle(url, styleId, styleTitle) {
    if (typeof url === 'object') {
      // no need to dereference url
      return this.applyStyle(url, styleId, styleTitle);
    }
    if (url.split('/')[0].indexOf(':') === -1) {
      // relative url
      url = document.baseURI + url;
    } 
    if (url.indexOf('mapbox:') === 0) {
      url = url.replace('mapbox://styles/mapbox/', 'https://api.mapbox.com/styles/v1/mapbox/') + `?access_token=${APIkeys.mapbox}`;
    }
    fetch(url).then(data=>data.json()).then(style=>{
      this.applyStyle(style, styleId, styleTitle);
    });
  }
  removeReferenceLayers()  {
    const referenceLayers = this.map.getStyle().layers.filter(layer=>layer.metadata && layer.metadata.reference);
    referenceLayers.forEach(layer=>{
      this.map.removeLayer(layer.id)
      if (this.map.getSource(layer.id)) {
        this.map.removeSource(layer.id);
      }
    });
  }
  addStyle(layerInfo) {
    const styleId = layerInfo.id;
    const styleTitle = layerInfo.metadata.title ? layerInfo.metadata.title : styleId ? styleId : "style title not defined";
    if (layerInfo.metadata && layerInfo.metadata.reference) {
      if (this.styleLoading) {
        return;
      }
      this.styleLoading = true;
      /* replace reference style */
      /* remove old reference layers */
      this.removeReferenceLayers(); 
      /* store non reference layers */
      this.storeNoneReferenceLayers();
      /* update layerlist */
      this.layerlist = [...this.layerlist.filter(layer=>layer.reference==false || layer.background)];
      /* set callback for map.setStyle() */
      this.map.once('styledata', ()=>{
        /* add reference metadata to new layers set by setStyle() */
        this.setReferenceLayers(styleId, styleTitle);
        /* restore old non-reference layers */
        this.restoreNoneReferenceLayers();
        
        /* allow new styles to be set */
        setTimeout(()=>{
          this.resetLayerList();          
          this.styleLoading = false;
          this.map._update(true); // TODO: how refresh map wihtout calling private mapbox-gl function?
        }, 1000);
      });
      this.map.setStyle(layerInfo.source);
    } else {
      /* add style to existing layers */
      this.loadStyle(layerInfo.source, styleId, styleTitle);
    }
  }
  insertServiceKey(layerInfo) {
    /* replace '{geodanmapskey}' by APIkeys.geodanmaps, '{freetilehostingkey}' by APIkeys.freetilehosting etc. */
    for (let key in APIkeys) {
      const keyTemplate = `{${key}key}`;
      if (layerInfo.source.tiles) {
        layerInfo.source.tiles = layerInfo.source.tiles.map(tileurl=>tileurl.replace(keyTemplate, APIkeys[key]));
      }
      if (layerInfo.source.url) {
        layerInfo.source.url = layerInfo.source.url.replace(keyTemplate, APIkeys[key]);
      }
      if (layerInfo.source.data && typeof layerInfo.source.data === "string") {
        layerInfo.source.data = layerInfo.source.data.replace(keyTemplate, APIkeys[key]);
      }
    }
  }
  insertTime(layerInfo){
    //2018-09-21T23:35:00Z
    let interval = 300000; // 5 minutes default
    if (layerInfo.metadata && layerInfo.metadata.timeinterval) {
      interval = layerInfo.metadata.timeinterval;
    }
    const now = encodeURIComponent(new Date(Math.floor((Date.now() - (2 * interval)) / interval) * interval).toISOString());
    if (layerInfo.source.tiles) {
      layerInfo.source.tiles = layerInfo.source.tiles.map(tileurl=>tileurl.replace('{time}', now));
    }
    if (layerInfo.source.url) {
      layerInfo.source.url = layerInfo.source.url.replace('{time}', now);
    }
  }
  async addLayer(e) {
    const layerInfo = e.detail;
    if (layerInfo.type === 'style') {
      this.addStyle(layerInfo);
    } else {
      layerInfo.metadata = Object.assign(layerInfo.metadata || {}, {userlayer: true});
      this.insertServiceKey(layerInfo);
      this.insertTime(layerInfo);
      if (layerInfo.metadata.wms) {
        if (!layerInfo.metadata.legendurl && layerInfo.metadata.legendurl !== '') {
          layerInfo.metadata.legendurl = wmsUrl(layerInfo.source.tiles[0], 'getlegendgraphic');
        }
        if (layerInfo.metadata.getFeatureInfoUrl !== '') {
          // layer is queryable
          if (layerInfo.metadata.getFeatureInfoUrl) {
            layerInfo.metadata.getFeatureInfoUrl = wmsUrl(layerInfo.metadata.getFeatureInfoUrl, 'getfeatureinfo');
          } else {
            layerInfo.metadata.getFeatureInfoUrl = wmsUrl(layerInfo.source.tiles[0], 'getfeatureinfo');
          }
        }
        if (layerInfo.source && layerInfo.source.tiles) {
          layerInfo.source.tiles = layerInfo.source.tiles.map(tile=>wmsUrl(tile, 'getmap'));
        }
      }
      if (layerInfo.metadata.tilecacheurl && layerInfo.source.tiles) {
        let search = new URL(layerInfo.source.tiles[0]).search;
        layerInfo.source.tiles = layerInfo.metadata.tilecacheurl.map(url=>url+search);
        delete layerInfo.metadata.tilecacheurl;
      }
      if (layerInfo.metadata.proxy) {
        layerInfo.source.tiles = layerInfo.source.tiles
          .map(url=>layerInfo.metadata.proxy + encodeURIComponent(url).replace('%7Bbbox-epsg-3857%7D', '{bbox-epsg-3857}'));
        layerInfo.metadata.featureinfoproxy = layerInfo.metadata.proxy;
        delete layerInfo.metadata.proxy;
      }
      if (layerInfo.metadata.bing && layerInfo.source.url) {
        const bingMetadata = await fetch(layerInfo.source.url).then(data=>data.json());
        const sourceMaxzoom = layerInfo.source.maxzoom;
        layerInfo.source = {
          "type" : "raster",
          "tileSize" : 256,
          "attribution" : bingMetadata.resourceSets[0].resources[0].imageryProviders.map(provider=>provider.attribution).join('|'),
          "tiles": bingMetadata.resourceSets[0].resources[0].imageUrlSubdomains.map(domain=>bingMetadata.resourceSets[0].resources[0].imageUrl.replace('{subdomain}', domain).replace('{culture}', 'nl-BE'))
        }
        if (sourceMaxzoom) {
          layerInfo.source.maxzoom = sourceMaxzoom;
        }
      }
      if (layerInfo.metadata && layerInfo.metadata.reference) {
        this.removeReferenceLayers();
        this.layerlist = [...this.layerlist.filter(layer=>layer.reference==false || layer.background)];        
        this.map.addLayer(layerInfo, this.map.getStyle().layers.length ? this.map.getStyle().layers[0].id : undefined);
      } else {
        if (layerInfo.type == "sheetlayer") {
          this.sheetdialog = layerInfo;
          this.requestUpdate();
        } else {
          if (!this.map.getLayer(layerInfo.id)) {
            if (layerInfo.type === "webgltraffic") {
              this.map.addLayer(new TrafficLayer(layerInfo.source.data));
            } else {
              if (layerInfo.source.type === "geojson") {
                if (layerInfo.metadata.topojson && !layerInfo.metadata.originaldata) {
                  await GeoJSON.convertTopoJsonLayer(layerInfo);
                } 
                if (layerInfo.metadata && layerInfo.metadata.crs && !layerInfo.metadata.originaldata) {
                  await GeoJSON.convertProjectedGeoJsonLayer(layerInfo);
                }
                if (layerInfo.metadata && layerInfo.metadata.memorygeojson && !layerInfo.metadata.originaldata) {
                  const spinner = this.shadowRoot.querySelector('map-spinner');
                  let spinnerstarted = false;
                  if (spinner && !spinner.getAttribute('visible')) {
                    spinner.setAttribute('visible', "1");
                    spinnerstarted = true;
                  }
                  await GeoJSON.loadGeoJsonToMemory(layerInfo);
                  if (spinnerstarted) {
                    spinner.setAttribute('visible', '0');
                  }
                }
              }              
              this.map.addLayer(layerInfo);
            }
          }
        }
      }
      if (layerInfo.metadata && layerInfo.metadata.hasOwnProperty('opacity')) {
        this.updateSingleLayerOpacity(layerInfo.id, layerInfo.metadata.opacity / 100);
      }
      this.resetLayerList();
    }
  }
  moveLayer(e) {
    if (e.detail.beforeFirst) {
      e.detail.layers.reverse().forEach(layer=>this.map.moveLayer(layer));
    } else {
      e.detail.layers.reverse().forEach(layer=>this.map.moveLayer(layer, e.detail.beforeLayer));
    }
    this.resetLayerList();
  }
  updatePitch(degrees) {
    if (this.map) {
      if (!isNaN(parseFloat(degrees)) && isFinite(degrees)) {
        this.pitch = parseFloat(degrees);
      } else {
        switch (this.pitch) {
          case 0:
            this.pitch = 60;
            break;
          case 60: 
            this.pitch = 30;
            break;
          case 30:
          default:
            this.pitch = 0;
            break;
        }
      }
      this.map.setPitch(this.pitch);
    }
  }
  fitBounds(e)
  {
    this.map.fitBounds(e.detail.bbox, {maxZoom: 19});
  }
  toggleToolMenu(opened) {
    const collapsed = this.shadowRoot.querySelector('#tool-menu-container').classList.contains('collapsed');
    if (collapsed && (opened === undefined || opened)) {
      this.shadowRoot.querySelector('#tool-menu-container').classList.remove('collapsed');
      this.shadowRoot.querySelector('#panel-container').classList.remove('collapsed');
      this.shadowRoot.querySelector('#button-hide-menu').classList.remove('collapsed');  
    } else {
      this.shadowRoot.querySelector('#tool-menu-container').classList.add('collapsed');
      this.shadowRoot.querySelector('#panel-container').classList.add('collapsed');
      this.shadowRoot.querySelector('#button-hide-menu').classList.add('collapsed');
    }
  }
  toggleLegend(e) {
    const container = this.shadowRoot.querySelector('#legend-container-container');    
    const button = this.shadowRoot.querySelector('#button-hide-legend');
    button.classList.toggle('collapsed');
    const rect = container.getBoundingClientRect();
    const width = rect.right - rect.left;  
    if (button.classList.contains('collapsed')) {
      container.style.right = 25-width + 'px';
      setTimeout(()=>{
        container.style.right = 'auto';
        container.style.left = 'calc(100% - 25px';
      }, 500);
    } else {
      container.style.width = null;
      container.style.maxWidth = null;
      container.style.left = null;
      container.style.right = 25-width + 'px';
      setTimeout(()=>{
        container.style.right = null;
      }, 20)
    }
  }
  toggleTool(name) {
    this.infoClicked = false;
    this.updateInfoMarker();
    this.featureInfo = [];
    if (this.currentTool === name) {
      this.currentTool = '';
    } else {
      this.currentTool = name;
    }
  }
  renderToolbarTools()
  {
    const toolbar = this.toolList.find(tool=>tool.name==="toolbar");
    if (!toolbar || !toolbar.visible) {
      return '';
    }
    const showLanguageTool = this.checkMapIsLanguageSwitcherCapable();
    const tools = this.toolList.filter(tool=>tool.visible && tool.icon && (tool.name!=='maplanguage' || showLanguageTool));
    if (tools.length == 0) {
      return '';
    }
    return html`
    <div id="tool-menu-container" class="${toolbar.position==='opened'?'':'collapsed'}">
      <div id="button-hide-menu" @click="${e=>this.toggleToolMenu()}" class="${toolbar.position==='opened'?'':'collapsed'}">
        <span class="offset"></span><i>${arrowLeftIcon}</i>
      </div>
      <div id="tools-menu">
        <ul>
          ${tools.sort((a,b)=>a.order-b.order).map(tool=>{
            return html`<li>
              <map-iconbutton .icon="${tool.icon}" info="${tool.info}" @click="${e=>this.toggleTool(tool.name)}" .active="${this.currentTool===tool.name}"></map-iconbutton>
            </li>`
          })}
        </ul>
      </div>
      <div id="panel-container" class="${this.currentTool !==''?"active":""}">
        <map-panel .active="${this.currentTool==="search"}">
          <map-search .active="${this.currentTool==="search"}" .viewbox="${this.viewbox}" @searchclick="${e=>this.fitBounds(e)}" @searchresult="${e=>this.searchResult(e)}"></map-search>
        </map-panel>
        <map-panel .active="${this.currentTool==="datacatalog"}">
          <map-data-catalog .active="${this.currentTool==="datacatalog"}" .datacatalog="${this.datacatalog}" .maplayers="${this.layerlist}" @addlayer="${(e) => this.addLayer(e)}" @removelayer="${e=>this.removeLayer(e)}"></map-data-catalog>
        </map-panel>
        <map-panel .active="${this.currentTool==='measure'}">
          <map-measure .webmap="${this.map}" .active="${this.currentTool==='measure'}"></map-measure>
        </map-panel>
        <map-panel .active="${this.currentTool==='info'}">
          <map-info-formatted .info="${this.featureInfo}" .active="${this.currentTool==='info'}" @togglestreetview="${e=>this.toggleStreetView(e)}"></map-info-formatted>
        </map-panel>
        <map-panel .active="${this.currentTool==='maplanguage'}">
          <map-language .active="${this.currentTool==='maplanguage'}" language="autodetect" @languagechanged="${e=>this.setLanguage(e)}"></map-language>
        </map-panel>
        <map-panel .active="${this.currentTool==='geolocate'}">
        <map-geolocation .webmap="${this.map}" .active="${this.currentTool==='geolocate'}"></map-geolocation>
        </map-panel>        
        <map-panel .active="${this.currentTool==='pitch'}">
          <map-pitch .active="${this.currentTool==='pitch'}" .pitch="${this.currentTool==='pitch' && this.map && this.map.getPitch()}" @updatepitch="${e=>this.updatePitch(e.detail.degrees)}"><map-pitch>
        </map-panel>
        <map-panel .active="${this.currentTool==='draw'}">
          <map-draw .active="${this.currentTool==='draw'}" .map="${this.map}" @addlayer="${e=>this.addLayer(e)}"></map-draw>
        </map-panel>
        <map-panel .active="${this.currentTool==='importexport'}">
          <div style="width:100%">Kaart opslaan / openen</div>
          <map-import-export .active="${this.currentTool==='importexport'}" .map="${this.map}" .toollist="${this.toolList}" .datacatalog="${this.datacatalog}" @droppedfile="${e=>this._processDroppedFile(e.detail)}"></map-import-export>
        </map-panel>
        <map-panel .active="${this.currentTool==='datatoolbox'}">
          <div style="width:100%"></div>
          <map-data-toolbox .active="${this.currentTool==='datatoolbox'}" .map="${this.map}" @addlayer="${e=>this.addLayer(e)}"></map-data-toolbox>
        </map-panel>
      </div>
    </div>`
  }
  renderCoordinates(){
    const tool = this.toolList.find(tool=>tool.name==='coordinates');
    if (tool && tool.visible) {
      return html`<map-coordinates visible="true" .lon="${this.displaylng}" .lat="${this.displaylat}" .resolution="${this.resolution}" .clickpoint="${this.lastClickPoint?this.lastClickPoint:undefined}"></map-coordinates>` 
    }
    return '';
  }
  renderLegend() {
    const legend = this.toolList.find(tool=>tool.name==='legend');
    if (!legend || !legend.visible) {
      return html``;
    }
    return html`
    <div id="legend-container-container" class="${legend.position==='opened'?'':'collapsed'}">
      <div id="button-hide-legend" @click="${e=>this.toggleLegend(e)}" class="${legend.position==='opened'?'':'collapsed'}">
        <span class="offset"></span><i>${arrowLeftIcon}</i>
      </div>
      <map-selected-layers 
        .layerlist="${this.layerlist}"
        .zoom="${this.zoom}"
        .datagetter="${this.datagetter}"
        @changepaintproperty="${e=>this.updateLayerPaintProperty(e)}"
        @updatevisibility="${(e) => this.updateLayerVisibility(e)}"
        @updateopacity="${(e)=>this.updateLayerOpacity(e)}"
        @removelayer="${(e) => this.removeLayer(e)}">

      </map-selected-layers>
      <mmap-legend-container .layerlist="${this.layerlist}" 
        .visible="${this.haslegend}" 
        .active="${true}" 
        .zoom="${this.zoom}" 
        @movelayer="${e=>this.moveLayer(e)}" 
        @updatevisibility="${(e) => this.updateLayerVisibility(e)}" 
        @updateopacity="${(e)=>this.updateLayerOpacity(e)}" 
        @removelayer="${(e) => this.removeLayer(e)}">
      </mmap-legend-container>
    </div>`;
  }
  render() {
    
    return html`<style>
      @import "${document.baseURI}node_modules/mapbox-gl/dist/mapbox-gl.css";
      /* workaround bug mapbox-gl v.051, https://github.com/mapbox/mapbox-gl-js/issues/7589 */
      .mapboxgl-ctrl.mapboxgl-ctrl-attrib p {
        display: inline-block;
        margin: 2px;
      }
      /* @import "${document.baseURI}node_modules/@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";*/
      :host {
        display: inline-block;
        min-width: 200px;
        min-height: 200px; 
        overflow: hidden;
      }
      .webmap {width: 100%; height: 100%}
      .mapboxgl-ctrl.mapboxgl-ctrl-group.mapboxgl-ctrl-zoom {
        background: rgba(255, 255, 255, 0.75);
      }
      #tool-menu-container {
        position: absolute;
        display: flex;
        align-items: flex-start;
        max-width: 375px; /* #panel-container + #tools-menu */
        left: 10px;
        top: 10px;
        transition: left 0.5s ease, max-width 0.5s ease;
        pointer-events: none;
      }      
      #tool-menu-container.collapsed {
        left: -55px;
        max-width: 55px;
      }
      #tools-menu {
        box-shadow: rgba(204, 204, 204, 0.5) 1px 0px 1px 1px;
        width: 55px;
        pointer-events: auto;
      }
      #panel-container {
        width: 0px;
        transition: width 0.5s ease;
        overflow: hidden;
        pointer-events: auto;
      }
      #panel-container.active {
        width: 320px;
      }
      #panel-container.collapsed {
        width: 0px;
      }
      #tools-menu ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      #tools-menu ul li {
        width: 55px;
        height: 55px;
        line-height: 67px; /* vertically center svg */
        border-bottom: 1px solid rgba(204,204,204,.52);
      }
      #button-hide-menu {
        position: absolute;
        top: 0;
        right: -25px;
        width: 25px;
        height: 55px;
        cursor: pointer;
        border-left: 1px solid #c1c1c1;
        color: #666;
        fill: #666;
        background-color: rgba(250,250,250,.87);
        box-shadow: 1px 0 1px 1px rgba(204,204,204,.5);
        line-height: 65px;
        text-align: center;
        white-space: nowrap;
        transform: rotate(0deg);
        transition: transform 0.5s ease-in-out;
        pointer-events: auto;
      }
      #button-hide-menu.collapsed {
        transform: rotate(-180deg);
      }
      #button-hide-legend {
        width: 25px;
        height: 55px;
        cursor: pointer;
        border-left: 1px solid #c1c1c1;
        color: #666;
        fill: #666;
        background-color: rgba(250,250,250,.87);
        box-shadow: 1px 0 1px 1px rgba(204,204,204,.5);
        line-height: 65px;
        text-align: center;
        white-space: nowrap;
        transform: rotate(-180deg);
        transition: transform 0.5s ease-in-out;
        pointer-events: auto;
      }
      #button-hide-legend.collapsed {
        transform: rotate(0deg);
      }
      .offset {
        display: inline-block;
        width: 5px;
      }
      #legend-container-container {
        position: absolute;
        display: flex;
        flex-direction: row;
        top: 10px;
        right: 10px;
        justify-content: flex-end;
        transition: right 0.5s ease;
        pointer-events: none;
        box-sizing: border-box;
      }
      </style>
    <div class="webmap"></div>
    ${this.renderToolbarTools()}
    ${this.renderCoordinates()}
    ${this.renderLegend()}
    ${this.sheetdialog?html`<map-dialog dialogtitle="Sheet-Kaart" @close="${e=>{this.sheetdialog=null;this.requestUpdate();}}"><map-gsheet-form .layerinfo="${this.sheetdialog}" @addlayer="${(e) => this.addLayer(e)}"></map-gsheet-form></map-dialog>`:html``} 
    <map-spinner .webmap="${this.map}"></map-spinner>`
  }
  getData()
  {
    if (!this.map) {
      return {};
    }
    return {querySourceFeatures: this.map.querySourceFeatures.bind(this.map)};
  }
  _positionString(prop) {
    // convert prop to control position
    let propl = prop.toLowerCase().trim();
    if (propl === "true" || propl === "") {
      return undefined;
    }
    return propl;
  }
  checkMapIsLanguageSwitcherCapable(recheck)
  {
    if (recheck) {
      this.isLanguageSwitcherCapable = undefined;
    }
    if (this.isLanguageSwitcherCapable !== undefined) {
      return this.isLanguageSwitcherCapable;
    }
    if (!this.map) {
      return this.isLanguageSwitcherCapable = undefined;
    }
    if (!this.map.isStyleLoaded() && !recheck) {
      return this.isLanguageSwitcherCapable = undefined;
    }
    return this.isLanguageSwitcherCapable = this.map.getStyle().layers.find(layer=>layer.source === 'openmaptiles' && layer.metadata && layer.metadata.reference == true) !== undefined;
  }
  disableRightMouseDragRotate()
  {
    const onMouseDown = this.map.dragRotate.onMouseDown;
    this.map.dragRotate.onMouseDown = function (e) {
      if (e.button === 2) {
        // right mouse button clicked
        event = new MouseEvent({button: 2, ctrlKey:true});
        onMouseDown(event);
      } else {
        onMouseDown(e);
      }
    }
  }
  initMap()
  {
    if (this.accesstoken) {
      mapboxgl.accessToken = this.accesstoken;
    }
    if (this.map) {
      this.map.remove();
    }
    this.map = new mapboxgl.Map({
        container: this.shadowRoot.querySelector('div'), 
        style: this.mapstyle,
        center: [this.lon,this.lat],
        zoom: this.zoom,
        pitch: this.pitch
    });
    this.datagetter = {
      querySourceFeatures: this.map.querySourceFeatures.bind(this.map),
      getSource: (sourcename) => this.map.getSource(sourcename)
    };
    const controlTools = this.toolList.filter(tool=>tool.position !== "").sort((a,b)=>a.order-b.order);
    controlTools.forEach(tool=>{
      if (tool.visible) {
        switch (tool.name) {
          case "zoomlevel":
              this.map.addControl(new ZoomControl(), this._positionString(tool.position));
            break;
          case "navigation":
            this.map.addControl(new mapboxgl.NavigationControl(), this._positionString(tool.position));
            break;
          case "coordinates":
            this.map.on('mousemove', e=>{this.displaylat = e.lngLat.lat; this.displaylng = e.lngLat.lng;});
            break;
          case "scalebar":
            this.map.addControl(new mapboxgl.ScaleControl(), this._positionString(tool.position));
            break;
        }
      }
    });
    this.featureInfo = [];
    this.map.on('mousemove', e=>this.handleInfo(e));
    
    this.map.autodetectLanguage(); // set openmaptiles language to browser language
    this._mapMoveEnd();
    this.map.on('moveend', ()=>{this._mapMoveEnd()});
    this.map.on('click', (e)=>this.mapClick(e));
    this.map.on('render', e=>this.mapHasRendered());
    this.map.on('zoomend', e=>this.mapHasZoomed());

    this.map.on('load', ()=>{
        if (this.activeLayers) {
          this.map.once('styledata', ()=>{
            /* add reference metadata to new layers set by setStyle() */
            this.setReferenceLayers(this.mapstyleid, this.mapstyletitle);
            this.resetLayerList();
          });
          this.addActiveLayers();
        } else {
          this.setReferenceLayers(this.mapstyleid, this.mapstyletitle);
          this.resetLayerList();
        }
        this.disableRightMouseDragRotate();
    });
  }
  addCheckedLayersFromCapabilitiesNodes(layer) {
    if (!Array.isArray(layer)) {
      layer = [layer];
    }
    
  }
  findLayer(id, layers) {
    if (!Array.isArray(layers)) {
      layers = [layers];
    }
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (layer.layerInfo && layer.layerInfo.id === id) {
        return layer;
      }
      if (layer.sublayers) {
        const subresult = this.findLayer(id, layer.sublayers);
        if (subresult) {
          return subresult;
        }
      }
    }
    return undefined;
  }
  async addActiveLayers() {
    for (let i = 0; this.activeLayers && i < this.activeLayers.length; i++) {
      const layerInfo = this.activeLayers[i];
      if (layerInfo.metadata && layerInfo.metadata.reference) {
        this.mapstyleid = layerInfo.id;
      }
      if (layerInfo.type === 'getcapabilities') {
        if (layerInfo.hasOwnProperty('checkedlayers')) {
          if (!Array.isArray(layerInfo.checkedlayers)) {
            layerInfo.checkedlayers = layerInfo.checkedlayers.split(',');
          }
          let nodes = await getCapabilitiesNodes(layerInfo);
          copyMetadataToCapsNodes(layerInfo, nodes);
          const activeLayers = this.activeLayers;
          // find and add checkedLayers in capabilities by order of checkedLayers
          for (let j = 0; this.activeLayers === activeLayers && j < layerInfo.checkedlayers.length; j++) {
            const node = this.findLayer(layerInfo.checkedlayers[j], nodes);
            if (node) {
              await this.addLayer({detail: node.layerInfo});
              while (!this.map.loaded()) {
                await timeout(50);  
              }
            }
          }
        }
      } else {
        await this.addLayer({detail: layerInfo});
        while (!this.map.loaded()) {
          await timeout(50);
        }
      }
    }
  }
  getCheckedLayerInfos(nodeList, layerInfos) {
    // recursively lookup checked nodes and return array
    if (!layerInfos) {
      layerInfos = [];
    }
    nodeList.forEach(node=>{
      if (node.sublayers) {
        this.getCheckedLayerInfos(node.sublayers, layerInfos);
      } else if (node.checked) {
        layerInfos.push({order: node.checked, layerInfo: node.layerInfo});
      }
    });
    return layerInfos;
  }
  prepareLayerInfos(nodeList) {
    let activeReferenceLayer = undefined;
    nodeList.forEach(node=>{
      if (node.sublayers) {
        this.prepareLayerInfos(node.sublayers);
      } else {
        if (!node.layerInfo.type) {
          node.layerInfo.type = node.type;
        }
        if (!node.layerInfo.metadata) {
          node.layerInfo.metadata = {};
        }
        if (!node.layerInfo.metadata.title) {
          node.layerInfo.metadata.title = node.title;
        }
        if (node.type === 'wms') {
          node.layerInfo.metadata.wms = true;        
        }        
        if (node.layerInfo.type === 'style') {
          node.layerInfo.metadata.styleid = node.layerInfo.id;
          node.layerInfo.metadata.styletitle = node.title;
        }
        if (node.type === 'reference') {
          node.layerInfo.metadata.reference = true;
          if (!activeReferenceLayer) {
            activeReferenceLayer = node;
          }
          if (node.checked) {
            activeReferenceLayer = node;
          }
        } else {
          // checked non reference nodes should have a numbered checked property starting at 2
          // checked property 1 is reserved for the reference layer
          if (node.checked) {
            if (isNaN(parseInt(node.checked))) {
              node.checked = 2;
            } else {
              node.checked = parseInt(node.checked) + 1;
            }
          }
        }
      }
    });
    if (activeReferenceLayer) {
      // set reference layer order to first
      activeReferenceLayer.checked = 1;
    }
  }
  applyConfig(config) {
    this.activeLayers = null;
    this.currentTool = '';
    if (config.keys) {
      for (let keyname in config.keys) {
        APIkeys[keyname] = config.keys[keyname];
      }
      if (APIkeys.mapboxaccesstoken) {
        this.accesstoken = APIkeys.mapboxaccesstoken;
      }
    }
    if (config.map) {
      if (config.map.center) {
        this.lon = config.map.center[0];
        this.lat = config.map.center[1];
      }
      if (config.map.hasOwnProperty('zoom')) {
        this.zoom = config.map.zoom;
      }
      if (config.map.hasOwnProperty('pitch')) {
        this.pitch = config.map.pitch;
      }
      if (!config.map.style) {
        config.map.style = {
          "version": 8,
          "name": "EmptyStyle",
          "id": "emptystyle",
          "sources": {
          },
          "layers": [
          ]
        } 
      }
      if (!config.map.style.glyphs) {
        config.map.style.glyphs = `https://free.tilehosting.com/fonts/{fontstack}/{range}.pbf?key=${APIkeys.freetilehosting}`;
        //config.map.style.glyphs = `https://tiles.edugis.nl/fonts/{fontstack}/{range}.pbf?key=${APIkeys.freetilehosting}`;
      }
      this.mapstyle = config.map.style;
      this.mapstyleid = config.map.style.id;
      this.mapstyletitle = config.map.style.name;
    }
    if (config.datacatalog) {
      this.prepareLayerInfos(config.datacatalog);
      this.activeLayers = this.getCheckedLayerInfos(config.datacatalog).sort((a,b)=>a.order-b.order).map(layer=>layer.layerInfo);
      this.datacatalog = config.datacatalog;    
    }
    if (config.tools) {
      this.toolList.forEach(tool=>tool.visible=(tool.name==='toolbar'));
      for (let toolName in config.tools) {
        const confTool = config.tools[toolName];
        /* if (toolName === 'currenttool' && confTool) {
          this.currentTool = confTool;
        }*/
        const mapTool = this.toolList.find(tool=>tool.name === toolName);
        if (mapTool) {
          for (let prop in mapTool) {
            if (confTool.hasOwnProperty(prop)) {
              mapTool[prop] = confTool[prop];
            }
          }
          if (toolName === 'toolbar' || toolName === 'legend') {
            if (confTool.opened) {
              mapTool.position = "opened";
            } else {
              mapTool.position = "collapsed";
            }
          }
        }
      }
    }
  }
  loadConfig(configurl) {
    if (configurl && configurl !== '') {
      fetch(configurl).then(response=>{
        if (response.status >= 200 && response.status < 300) {
            return response.json()
        }
        throw (new Error(`Error loading config from ${this.configurl}, status: ${response.statusText || response.status}`));
      }).then(config=>{
        this.applyConfig(config);
        this.initMap();
      }).catch(error=>{
        alert(`Error loading config:\n${configurl}\n${error}`);
      });
    } else {
      this.applyConfig(this.datacatalog);
      this.initMap();
    }
  }
  firstUpdated() {
    const mapcontainer = this.shadowRoot.querySelector('div');
    mapcontainer.addEventListener('dragover', (e)=>{
      e.preventDefault()
    });
    mapcontainer.addEventListener('drop', (ev)=> this.handleDrop(ev));
    if (this.configurl) {
      this.loadConfig(this.configurl);
    } else {
      this.initMap();
    }
  }
  _loadCSVLatLon(droppedFile) {
    const longitude = droppedFile.data.meta.fields.find(field=>field.trim().toLowerCase() === "longitude");
    const latitude = droppedFile.data.meta.fields.find(field=>field.trim().toLowerCase() === "latitude");
    const layer = {
      "metadata": {
        "title": droppedFile.filename
      },
      "id" : GeoJSON._uuidv4(),
      "type": "circle",
      "source": {
        "type": "geojson",
        "data": {
          "type": "FeatureCollection",
          "features": droppedFile.data.data.map(row=>{
            return {
              "type": "Feature",
              "properties": row,
              "geometry": {
                "type":"Point",
                "coordinates": [row[longitude], row[latitude]]
              }
            }
          })
        }
      },
      "paint": {
        "circle-radius": 5,
        "circle-color":  "red"
      }
    }
    this.addLayer({detail: layer});
  }
  _loadCSV(droppedFile) {
    // handle added csv (converted to json with papaparse)

    // json.json.data = json.json.data.filter(row=>row.hasOwnProperty('Postcode'));
    //const filter = ["match", ["get", "postcode"], Array.from(csvKeys), true, false];
    const layerid = GeoJSON._uuidv4();
    const layer = {
      "metadata": {
        "title": `${droppedFile.filename}`,
        "isToolLayer": true,
        "key": "postcode"
      },
      "id": layerid,
      "type":"circle",
      "minzoom": 8,
      "source": {
        "id": layerid,
        "type": "vector",
        "tiles": [
          "https://tiles.edugis.nl/v1/mvt/postcode.postcode2019q1/{z}/{x}/{y}?columns=postcode,substring(postcode+from+1+for+4)+as+pc4"
        ],
        "minzoom": 8,
        "maxzoom": 16
      },
      "source-layer": "postcode.postcode2019q1",
      "paint": {
        "circle-radius": 1,
        "circle-color": "white",
        "circle-opacity": 0
      },
      filter: false
    }
    if (!layer.metadata.key) {
      alert(`layer.metadata.key not defined for CSV join layer`);
      return;
    }
    //this.addLayer({detail: layer});

    const vectorKeyName = layer.metadata.key;
    const sourceLayer = layer["source-layer"];

    let csvKeyName = droppedFile.data.meta.fields.find(fieldname=>fieldname === vectorKeyName);
    if (!csvKeyName) {
      csvKeyName = droppedFile.data.meta.fields.find(fieldname=>fieldname.toLowerCase() === vectorKeyName.toLowerCase());
    }
    if (!csvKeyName) {
      alert(`CSV file should have column named: '${vectorKeyName}'`)
      return;
    }
    if (vectorKeyName.toLowerCase() === 'postcode') {
      // remove possible spaces from csv postcode
      droppedFile.data.data.forEach(item=>item[csvKeyName]=item[csvKeyName].replace(' ', ''))
    }
    const layer2id = GeoJSON._uuidv4();
    const layer2 = {
      "metadata": {"title": `${droppedFile.filename}`},
      "id": layer2id,
      "type":"circle",
      "minzoom": 8,
      "source": {
        "type": "geojson",
        "data": {
          "type": "FeatureCollection",
          "features": []
        }
      },
      "paint": {
        "circle-radius": 5,
        "circle-color": [
          "match",
          ["%", ["to-number", ["get", "pc4"]],10],
          0, "red",
          1, "green",
          2, "aqua",
          3, "orange",
          4, "blue",
          5, "yellow",
          6, "purple",
          7, "brown",
          8, "olive",
          9, "teal",
          "gray"
        ]
      }
    }
    
    const geocodedKeys = new Map();
    const jsonFeatures = [];
    const csvKeys = new Set(droppedFile.data.data.map(row=>row[csvKeyName]));

    const handleSourceData = e=>{
      console.log(`e.isSourceLoad: ${e.isSourceLoaded}, e.source.id: ${e.source.id}`);
      if (e.isSourceLoaded && e.source.id === layerid) {
        let vectorFeatures = this.map.querySourceFeatures(layerid, {sourceLayer:sourceLayer});
        const zoomLevel = this.map.getZoom();
        let needsUpdate = false;
        for (let vectorFeature of vectorFeatures) {
          const key = vectorFeature.properties[vectorKeyName];
          if (csvKeys.has(key)) {
            needsUpdate = true;
            csvKeys.delete(key);
            jsonFeatures.push(...droppedFile.data.data.filter(row=>row[csvKeyName] === key).map(row=>{
              return {
                "type":"Feature", 
                properties: Object.assign({}, vectorFeature.properties, row),
                geometry:vectorFeature.geometry  
              }
            }));
            geocodedKeys.set(key, zoomLevel);
          } else if (geocodedKeys.has(key)) {
            if (geocodedKeys.get(key) < zoomLevel) {
              // possibly more precise geometry available
              needsUpdate = true;
              for (let feature of jsonFeatures) {
                if (feature[csvKeyName] === key) {
                  feature.geometry = vectorFeature.geometry;
                }
              }
              geocodedKeys.set(key, zoomLevel);
            }
          }
        };
        if (needsUpdate) {
          this.map.getSource(layer2id).setData({
            "type": "FeatureCollection",
            "features": jsonFeatures
          })
        }
      }
    }
    this.map.on('sourcedata', handleSourceData); /* todo: remove handler when layer is removed */
    this.addLayer({detail: layer});
    this.addLayer({detail:layer2});
  }

  _processDroppedFile(droppedFile) {
    if (droppedFile === false) {
      alert('Dropped item not recognized as a file');
    } else if (droppedFile.error) {
      alert('Json error: ' + droppedFile.error);
    } else if (droppedFile.data.map && droppedFile.data.tools) {
      this.applyConfig(droppedFile.data);
      this.initMap();
    } else if (droppedFile.data.type && (droppedFile.data.type === "Feature" || droppedFile.data.type === "FeatureCollection")) {
      const layers = GeoJSON.createLayers(droppedFile);
      layers.forEach(layer=>this.addLayer({detail: layer}));
    } else if (droppedFile.data && droppedFile.data.data) {
      if (droppedFile.data.data.length) {
        if (droppedFile.data.meta.fields.find(field=>field.trim().toLowerCase() === "longitude") && droppedFile.data.meta.fields.find(field=>field.trim().toLowerCase() === "latitude")) {
          this._loadCSVLatLon(droppedFile);
        } else {
          this._loadCSV(droppedFile);
        }
      } else {
        alert ('CSV file is corrupt or empty')
      }
    } else {
      alert ('Valid data, but content not recognized');
    }
  }

  handleDrop(ev) {
    MapImportExport.handleDrop(ev).then(droppedFile=>{
     this._processDroppedFile(droppedFile);
    })
  };

  updateLayerCalculatedPaintProperties(layerlist) {
    layerlist.forEach(layer=>{
      const mapLayer = this.map.getLayer(layer.id);
      if (mapLayer && mapLayer.paint) {
        layer._paint = mapLayer.paint;
      }
    });
  }

  mapHasZoomed() {
    this.updateLayerCalculatedPaintProperties(this.layerlist);
  }

  mapHasRendered() {
    if (this.resetLayerListRequested) {
      if (!this.map.style.stylesheet) {
        /* mapbox-gl bug? getStyle() throws exception on empty style */
        this.layerlist = [];
        console.log("layerlist empty")
        return;
      }
      const layerlist = this.map.getStyle().layers;
      this.updateLayerCalculatedPaintProperties(layerlist);
      this.layerlist = [...layerlist];
      this.checkMapIsLanguageSwitcherCapable(true);
      this.updateInBounds();
      this.resetLayerListRequested = false;
    }
  }

  resetLayerList() {
    this.resetLayerListRequested = true;
  }
  shouldUpdate(changedProperties) {
    if (changedProperties.has('zoomlevel')) {
      const tool = this.toolList.find(tool=>tool.name==="zoomlevel");
      if (tool) {
        tool.visible = (this.zoomlevel.toLowerCase() !== "false");
        tool.position = this.zoomlevel.toLowerCase();
      }
    }
    
    if (changedProperties.has("navigation")) {
      const tool = this.toolList.find(tool=>tool.name==="navigation");
      if (tool) {
        tool.visible = (this.navigation.toLowerCase() !== "false");
        tool.position = this.navigation.toLowerCase();
      }
    }
    
    if (changedProperties.has("scalebar")) {
      const tool = this.toolList.find(tool=>tool.name==="scalebar");
      if (tool) {
        tool.visible = (this.scalebar.toLowerCase() !== "false");
        tool.position = this.scalebar.toLowerCase();
      }
    }

    if (changedProperties.has("coordinates")) {
      const tool = this.toolList.find(tool=>tool.name==="coordinates");
      if (tool) {
        tool.visible = (this.coordinates.toLowerCase() !== "false");
        tool.position = this.coordinates.toLowerCase();
      }
    }

    if (changedProperties.has("configurl")) {
      if (this.map) {
        this.loadConfig(this.configurl);
      }
    }

    return true;
  }
  updateInBounds() {
    let changed = false;
    this.layerlist.forEach(layer=>{
      let result = ""
      const source = this.map.getSource(layer.source);
      if (!source) {
        return;
      }
      const bounds = source.bounds ? source.bounds : layer.metadata ? layer.metadata.bounds : undefined;
      if (bounds) {
        if (this.viewbox[1] > bounds[3]) {
          result = "S"
        }
        if (this.viewbox[3] < bounds[1]) {
          result = "N"
        }
        if (this.viewbox[0] > bounds[2]) {
          // source west of viewbox
          result += "W";
        }
        if (this.viewbox[2] < bounds[0]) {
          result += "E";
        }
        if (result != '' && this.map.bearing !== 0) {
          const viewcenter = [(this.viewbox[0] + this.viewbox[2]) / 2, (this.viewbox[1] + this.viewbox[3])/2];
          const layercenter = [(bounds[0] + bounds[2])/2, (bounds[1] + bounds[3])/2];
          let angle = turf.bearing(viewcenter, layercenter) - this.map.getBearing();
          if (angle < 0) {
            angle += 360;
          }
          result = "";
          if (angle < 65 || angle >= 290) {
            result = "N"
          }
          if (angle > 120 && angle < 250) {
            result = "S"
          }
          if (angle >= 25 && angle <= 160) {
            result += "E";
          }
          if (angle >= 200 && angle <= 340) {
            result += "W"
          }
        }
        if (layer.metadata && layer.metadata.boundspos != result) {
          changed = true;
          layer.metadata.boundspos = result;
        }
      }
    });
    if (changed) {
      this.layerlist = [...this.layerlist];
    }
  }
  _mapMoveEnd() {
    const bounds = this.map.getBounds();
    this.viewbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    this.resolution = getResolution(this.map);
    const center = this.map.getCenter();
    this.displaylat = center.lat;
    this.displaylng = center.lng;
    this.zoom = this.map.getZoom();
    this.dispatchEvent(new CustomEvent('moveend', 
      {detail: {
        center: center,
        viewbox: this.viewbox, 
        zoom: this.map.getZoom(),
        bearing: this.map.getBearing(),
        pitch: this.map.getPitch()}
      }
    ));
    this.updateInBounds();
    this.requestUpdate();
  }
  setLanguage(e) {
    this.storeNoneReferenceLayers();
    if (e.detail.language === "autodetect") {
      this.map.autodetectLanguage();
    } else {
      this.map.setLanguage(e.detail.language, (e.detail.language !== "native"));
    }
    setTimeout(()=>this.restoreNoneReferenceLayers(), 1000); // how else?    
  }
  mapClick(e) {
    this.lastClickPoint = [e.lngLat.lng,e.lngLat.lat];
    this.handleInfo(e);
  }
  getIcon(iconUrl) {
    const name = iconUrl.split('/').pop().split('.').shift();
    if (this.map.hasImage(name)) {
      return name;
    }
    const baseUrl = 'https://nominatim.openstreetmap.org/';
    if (iconUrl.startsWith(baseUrl)) {
      // route through edugis to workaround openstreetmap CORS error
      iconUrl = 'https://tiles.edugis.nl/nominatim/' + iconUrl.slice(baseUrl.length);
    }
    if (!this.loadedNames) {
      this.loadedNames = [];
    }
    if (this.loadedNames.indexOf(name) == -1) {
      this.loadedNames.push(name);
      this.map.loadImage(iconUrl, (error, image) => {
        if (error) {
          // todo
        } else {
          this.map.addImage(name, image);
        }
      })
    }
    return name;
  }
  searchResult(e) {
    // add list of found elements to temporary map layer
    if (this.map) {
      const mapSearchSource = this.map.getSource('map-search-geojson');
      if (!mapSearchSource) {
        this.map.addSource('map-search-geojson', searchSource);
        this.map.addLayer(searchSurface);
        this.map.addLayer(searchLines);
        this.map.addLayer(searchPoints);
      }
      if (e.detail != null) {        
        searchGeoJson.features = e.detail.map(item=>{
          return {
              "type":"Feature",
              "geometry": item.geojson,
              "properties": {
                "icon": (item.icon?this.getIcon(item.icon): 'star_11'),
                "name": item.display_name.split(",").shift()
              }
          };
        });
        this.map.getSource('map-search-geojson').setData(searchGeoJson);
      } else {
        searchGeoJson.features = [];
        this.map.removeLayer(searchPoints.id);
        this.map.removeLayer(searchLines.id);
        this.map.removeLayer(searchSurface.id);
        this.map.removeSource('map-search-geojson');
      }
      
    }
  }
  XMLtoGeoJSON(xmlString)
  {
      const result = {"type": "FeatureCollection", "features": []};
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString,"text/xml");
      const root = xmlDoc.getElementsByTagName("GetFeatureInfoResponse");
   
      if (root && root.length) {
          const layers = root[0].getElementsByTagName("Layer");
          const layerInfo = {};
          for (var i = 0; i < layers.length; i++) {
              layerInfo.name = layers[i].getAttribute('name');
              const features = layers[i].getElementsByTagName('Feature');
              if (features && features.length) {
                  for (let j = 0; j < features.length; j++) {
                      const featureInfo = {};                  
                      featureInfo.properties = {};
                      const attributes = features[j].getElementsByTagName('Attribute');
                      if (attributes && attributes.length) {
                          for (let k = 0; k < attributes.length; k++) {
                              const attrName = attributes[k].getAttribute('name');
                              if (attrName != 'geometry') {
                                  featureInfo.properties[attrName] = attributes[k].getAttribute('value');
                              } else {
                                  let geometryString = attributes[k].getAttribute('value');
                                  const endPos = geometryString.indexOf('(');
                                  const type = geometryString.substring(0, endPos).trim();
                                  geometryString = geometryString.substring(endPos).split(',').map(function(pair){return "["+pair.trim().replace(" ", ",")+"]"}).join(",").replace(/\(/g,"[").replace(/\)/g,"]");
                                  featureInfo.geometry = {"type": type, "coordinates": JSON.parse(geometryString)};
                              }
                          }
                      }
                      
                      const featureObject = {"type": "Feature", "properties": featureInfo.properties, "geometry": featureInfo.geometry, "layername": layerInfo.name};
                      
                      const bBoxInfo = {};
                      const boundingBox = features[j].getElementsByTagName('BoundingBox');
                      if (boundingBox && boundingBox.length) {
                          bBoxInfo.left = boundingBox[0].getAttribute('minx');
                          bBoxInfo.right = boundingBox[0].getAttribute('maxx');
                          bBoxInfo.top = boundingBox[0].getAttribute('maxy');
                          bBoxInfo.bottom = boundingBox[0].getAttribute('miny');
                          bBoxInfo.srs = boundingBox[0].getAttribute('SRS');
                          featureObject.bbox = [parseFloat(bBoxInfo.left), parseFloat(bBoxInfo.bottom), parseFloat(bBoxInfo.right), parseFloat(bBoxInfo.top)];
                      }
                      
                      if (result.srs) {
                          if (bBoxInfo.srs != result.srs) {
                              // set deviating feature srs
                              featureObject.srs =  bBoxInfo.srs;
                          }
                      } else {
                          if (bBoxInfo.srs) {
                              // set global GeoJSON srs
                              result.srs =  bBoxInfo.srs;
                          }
                      }
                      result.features.push(featureObject);
                  }
              }
          }        
      } else {
        const gmlInfo = xmlDoc.getElementsByTagNameNS("http://www.opengis.net/gml", "featureMember");
        if (gmlInfo.length) {
          const xmlDoc2 = parser.parseFromString(gmlInfo[0].innerHTML,"text/xml");
          const attrs = [].slice.call(xmlDoc2.children[0].children).map(attr=>[attr.tagName.split(':')[1], attr.textContent]);
          const featureInfo = {};
  
          featureInfo.properties = attrs.reduce((result, attr)=>
              {
              if (attr[0] != 'geometry') {
                result[attr[0]]=attr[1];
              }
              return result;
            },
          {});
          featureInfo.geometry = null; /* todo: GML geometry parser */
          result.features.push(featureInfo);
        } else {
          const mapserverGmlInfo = xmlDoc.getElementsByTagNameNS("http://www.opengis.net/gml", "boundedBy");
          if (mapserverGmlInfo.length && mapserverGmlInfo[0].parentElement) {
            const attrs = [].slice.call(mapserverGmlInfo[0].parentElement.children).map(attr=>[attr.tagName, attr.textContent]);
            const featureInfo = {};
            featureInfo.properties = attrs.reduce((result, attr)=>
                {
                if (attr[0] != 'gml:boundedBy') {
                  result[attr[0]]=attr[1];
                }
                return result;
              },
            {});
            featureInfo.geometry = null;
            result.features.push(featureInfo);
          } else {
            // unknown xml format or not xml?
          }
        }          
      }
      return result;
  }
  jsonToGeoJSON(json) {
    if (Array.isArray(json)) {
      return {
        "type": "FeatureCollection", 
        "features": json.map(item=>{
          return {
            "type":"Feature",
            "geometry": {"type": "Point", "coords": item.point.coords},
            "properties": item
          }
        })
      }
    }
    return json;
  }
  queryWMSFeatures(lngLat, metadata) {
    const featureInfoUrl = metadata.getFeatureInfoUrl;
    const featureInfoFormat = metadata.getFeatureInfoFormat ? metadata.getFeatureInfoFormat : 'text/xml';
    const wmtsResolution = (2 * 20037508.342789244) / (256 * Math.pow(2, (Math.round(this.zoom+1))));
    // get webmercator coordinates for clicked point
    const clickedPointMercator = projectLngLat(lngLat);
    // create 3 x 3 pixel bounding box in webmercator coordinates
    const leftbottom = {x: clickedPointMercator.x - 1.5 * wmtsResolution, y: clickedPointMercator.y - 1.5 * wmtsResolution};
    const righttop = {x: clickedPointMercator.x + 1.5 * wmtsResolution, y: clickedPointMercator.y + 1.5 * wmtsResolution};
    // getFeatureinfo url for center pixel of 3x3 pixel area
    const params = `&width=3&height=3&x=1&y=1&crs=EPSG:3857&srs=EPSG:3857&info_format=${featureInfoFormat}&bbox=`;
    let url=featureInfoUrl+params+(leftbottom.x)+","+(leftbottom.y)+","+(righttop.x)+","+(righttop.y);
    if (metadata.featureinfoproxy) {
      url = metadata.featureinfoproxy + encodeURIComponent(url);
    }
    return fetch(url)
      .then(response=>{
        if (featureInfoFormat === 'application/json') {
          return response.json().then(json=>this.jsonToGeoJSON(json));
        }
        return response.text().then(text=>this.XMLtoGeoJSON(text))}
      );
  }
  waitingForResponse(layer) {
    return {
      "type":"Feature",
      "layer": {"id": layer.id, "metadata": layer.metadata},
      "geometry": null,
      "properties": {"info": "waiting for response..."}
    };
  }
  toggleStreetView(e) {
    this.streetViewOn = e.detail.streetview;
  }
  getStreetViewImage(lngLat)
  {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lngLat.lat},${lngLat.lng}&key=${APIkeys.google}`;
    return fetch(url).then(response=>response.json()).then(json=>{
      console.log(json);
      const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&pano=${json.pano_id}&key=${APIkeys.google}`;
      return imageUrl;
    })
  }
  updateInfoMarker(lngLat) {
    if (!lngLat) {
      if (this.marker) {
        this.marker.remove();
      }
      this.marker = null;
      return;
    }
    if (!this.markerDiv) {
      this.markerDiv = document.createElement('div');
      this.markerDiv.style = 'fill: blue;';
      this.markerDiv.innerHTML = outlineInfoIcon.getHTML();
      this.markerDiv.innerHTML = this.markerDiv.firstElementChild.innerHTML;
      //render (outlineInfoIcon, this.markerDiv); // no longer works?
    }
    if (this.marker) {
      this.marker.remove();
    }
    this.marker = new mapboxgl.Marker(this.markerDiv).setLngLat(lngLat).addTo(this.map);
  }
  handleInfo(e) {
    if (this.currentTool !== 'info') {
      this.infoClicked = false;
      if (this.featureInfo.length) {
        this.featureInfo = [];
      }
      return;
    }
    if (e.type === "mousemove" && !this.infoClicked) {
      this.featureInfo = this.map.queryRenderedFeatures(e.point);
      return;
    }
    if (e.type === "click") {
      this.infoClicked = true;
      this.updateInfoMarker(e.lngLat);
      const layers = this.map.getStyle().layers;
      const featureInfo = [];
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].metadata && layers[i].metadata.getFeatureInfoUrl) {
          if ((layers[i].minzoom === undefined || this.zoom >= layers[i].minzoom) &&
           (layers[i].maxzoom === undefined || this.zoom <= layers[i].maxzoom )) {
             let wmsFeatures = this.waitingForResponse(layers[i]);
             featureInfo.push(wmsFeatures);
             this.queryWMSFeatures(e.lngLat, layers[i].metadata)
              .then(feature=>{
                if (feature.features.length) {
                  if (feature.features.length == 1) {
                    wmsFeatures.properties = feature.features[0].properties;
                  } else {
                    // multiple features found
                    wmsFeatures.properties = {};
                    feature.features.forEach(feature=>{
                      wmsFeatures.properties = Object.assign(wmsFeatures.properties, feature.properties);
                    });
                  }
                } else {
                  wmsFeatures.properties = {};
                }
                this.featureInfo = [...this.featureInfo];
                this.requestUpdate();
              });
           }
        } else {
          const features = this.map.queryRenderedFeatures(e.point, {layers:[layers[i].id]});
          if (features.length) {
            featureInfo.push(...features.reverse());
          }
        }
      }
      if (this.streetViewOn) {
        const streetViewInfo = {"type":"Feature", "properties": {"image": "retrieving..."}, "layer": {"id":"streetview", "metadata": {}}};
        featureInfo.push(streetViewInfo);
        this.getStreetViewImage(e.lngLat).then(imageurl=>{
          streetViewInfo.properties.image = imageurl;
          this.featureInfo = [...this.featureInfo];
          this.requestUpdate();
        });
      }
      if (featureInfo.length == 0) {
        this.featureInfo = [{layer:{metadata:{title:'Geselecteerde kaartlagen'}},properties:[]}];
      } else {
        this.featureInfo = featureInfo.reverse();
      }
    }
    
  }
}
customElements.define('web-map', WebMap);
