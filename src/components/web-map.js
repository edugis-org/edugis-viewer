import {LitElement, html} from 'lit';
import {ifDefined} from 'lit/directives/if-defined.js';
import {MapImportExport} from './map-import-export.js';
import '../../lib/openmaptiles-language.js';
import './map-data-catalog.js';
import './map-spinner.js';
import './map-coordinates.js';
import './map-measure';
import './map-language';
import './map-search';
import './map-dialog';
import './map-gsheet-form';
import './map-info-formatted';
import './map-panel';
import './map-geolocation';
import './map-pitch';
import './map/layer/map-layer-container.js';
import './map/layer/map-layer-set.js';
import './map-draw';
import './map-data-toolbox';
import './map-sheet-tool';
import './map-modal-dialog';
import './map-dialog-layer-external.js';
import './map-proj-chooser';
import "./map-save-layer";
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from "../i18n.js";
import { WebMapInitializer } from './web-map-initializer.js';
import { WebMapStyleLoader } from './web-map-style-loader.js';
import { WebMapSearchResultManager } from './web-map-search-result-manager.js';


import {GeoJSON} from '../utils/geojson';
import {wmsUrl} from '../utils/wmsurl';
import mapgl from '../map-gl'

import { importExportIcon, gpsIcon, languageIcon, arrowLeftIcon, outlineInfoIcon, combineToolIcon, threeDIcon, infoIcon, drawIcon, sheetIcon, world3Icon } from './my-icons';
import { measureIcon, layermanagerIcon, searchIcon as gmSearchIcon } from '../gm/gm-iconset-svg';
import {geoJSONProject, coordProject} from '@edugis/proj-convert'


function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// srs optional, defaults to 'EPSG:3857'
// adds projected .x and .y properties to lngLat
function projectLngLat(lngLat, srs)
{
    if (!srs) {
        srs = 'EPSG:3857';
    }
    var p = coordProject([lngLat.lng, lngLat.lat], 'EPSG:4326', srs);

    lngLat.x = p[0];
    lngLat.y = p[1];
    return lngLat;
}

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
      defaultdatacatalog: Object,
      layerlist: Array,
      haslegend: Boolean,
      accesstoken: String,
      lastClickPoint: Array,
      currentTool: String,
      configurl: String,
      updatelegend: Number,
      exporttool: Boolean,
      layerFillColor: Object,
      removedLayerId: String,
      saveCounter: Number,
      copiedCoordinate: String,
      hasHillshadeLayer: Boolean,
      hillshadeLayerId: String,
      terrainActive: Boolean
    }; 
  }
  constructor() {
    super();
    this.map = {};
    this.pitch = 0;
    this.bearing = 0;
    this.maxPitch = 60;
    this.viewbox = [];
    // default property values
    this.mapstyle = this.getEmptyStyle();
    this.mapstyleid = "EmptyStyle";
    this.mapstyletitle = "Empty Style";
    this.lon = 0;
    this.lat = 0;
    this.displaylat = this.lat;
    this.displaylng = this.lon;
    this.zoom = 1;
    this.resolution = 0;
    this.navigation = "false";
    this.zoomlevel = "false";
    this.scalebar = "false";
    this.geolocate = "false";
    this.coordinates = "false";
    this.layerlist = [];
    this.haslegend = false;
    this.accesstoken = undefined;
    this.lastClickPoint = [];
    this.thematicLayers = [];
    this.delayedLayers = [];
    this.layerlist = [];
    this.backgroundLayers = [];
    this.datagetter = {};
    this.updatelegend = 0;
    this.currentTool = '';
    this.layerFillColor = {layerid: -1, color: '#000'};
    this.removedLayerId = "";
    this.saveCounter = 0;
    this.defaultdatacatalog = [];
    this.toolList = [
      {name:"toolbar", visible: true, position: "opened", order: 0, info:""},
      {name:"search", visible: true, position: "", order: 100, info:"", icon: gmSearchIcon},
      {name:"datacatalog", visible: true, search: false, position: "", order: 101, info:"", icon:layermanagerIcon},
      {name:"measure", visible: true, position: "", order: 102, info:"", icon: measureIcon},
      {name:"info", visible: true, position: "", order: 103, info: "", icon: infoIcon},
      {name:"maplanguage", visible: true, position: "", order: 104, info: "", icon: languageIcon},
      {name:"pitch", visible: true, position: "", order: 105, info: "", icon: threeDIcon},
      {name:"geolocate", visible: true, position: "", order: 106, info: "", icon: gpsIcon},
      {name:"draw", visible: true, position: "", order: 107, info: "", icon: drawIcon},
      {name:"importexport", visible: true, position: "", order: 108, info: "", icon: importExportIcon},
      {name:"datatoolbox", visible: true, position: "", order: 109, info: "", icon: combineToolIcon},
      {name:"sheetimport", visible: true, position: "", order: 110, info: "", icon: sheetIcon},
      {name:"projchooser", visible: true, position:"", order: 120, info: "", icon: world3Icon},
      {name:"zoomlevel", visible: true, position: "bottom-left", order: 200, info: ""},
      {name:"navigation", visible: true, position: "bottom-left", order: 201, info: ""},
      {name:"coordinates", visible: true, position: "bottom-center", order: 202},
      {name:"scalebar", visible: true, position: "bottom-right", order: 203, info: ""},
      {name:"legend", visible: true, position: "opened", opened: 1, order: 204, info: ""},
    ];
    this.setToolListInfo();
    this.webMapSearchResultManager = new WebMapSearchResultManager(this);
    this.exporttool = false;
  }
  connectedCallback() {
    super.connectedCallback();
    this.listener = this.languageChanged.bind(this);
    registerLanguageChangedListener(this.listener);
  }
  disconnectedCallback() {
      super.disconnectedCallback()
      unregisterLanguageChangedListener(this.listener);
  }
  setToolListInfo() {
    const info = [
      ["toolbar", ""],
      ["search",`${t("Search name, place or address")}`],
      ["datacatalog",`${t("Map layers")}`],
      ["measure",`${t('Measure distance and surface')}`],
      ["info", `${t('Get info from map')}`],
      ["maplanguage", `${t('Map language')}`],
      ["pitch", `${t('Map view angle')}`],
      ["geolocate", `${t('Zoom to my location')}`],
      ["draw", `${t('Draw map layer')}`],
      ["importexport", `${t('Save map')}`],
      ["datatoolbox", `${t('Toolbox')}`],
      ["sheetimport", `${t('Upload table')}`],
      ["projchooser", `${t('Map projection')}`],
      ["zoomlevel", `${t('Zoom level')}`],
      ["navigation",`${t('Zoom, rotate')}`],
      ["scalebar", `${t('Scale')}`],
      ["legend", `${t('Legend and map layers')}`]
    ];
    this.toolList.forEach(tool=>{
      const item = info.find(item=>item[0]===tool.name);
      if (item) {
        tool.info = item[1];
      }
    });
  }
  setControlTooltips() {
    this.map.getContainer().querySelector(`.${mapgl.libName}-ctrl-compass`)?.setAttribute('title', t('Reset bearing to north'));
    this.map.getContainer().querySelector(`.${mapgl.libName}-ctrl-zoom-in`)?.setAttribute('title', t('Zoom in'));
    this.map.getContainer().querySelector(`.${mapgl.libName}-ctrl-zoom-out`)?.setAttribute('title', t('Zoom out'));
    this.map.getContainer().querySelector(`.${mapgl.libName}-ctrl-attrib-button`)?.setAttribute('title', t('Toggle attribution'));
    this.map.getContainer().querySelector(`.${mapgl.libName}-ctrl-compass`)?.setAttribute('aria-label', t('Reset bearing to north'));
    this.map.getContainer().querySelector(`.${mapgl.libName}-ctrl-zoom-in`)?.setAttribute('aria-label', t('Zoom in'));
    this.map.getContainer().querySelector(`.${mapgl.libName}-ctrl-zoom-out`)?.setAttribute('aria-label', t('Zoom out'));
    this.map.getContainer().querySelector(`.${mapgl.libName}-ctrl-attrib-button`)?.setAttribute('aria-label', t('Toggle attribution'));
  }
  languageChanged() {
    this.setToolListInfo();
    this.setControlTooltips();
    this.requestUpdate();
  }
  setTerrainLayer(id, active) {
    const layer = this.map.getLayer(id);
    if (layer?.type === 'hillshade') {
      if (active) {
        const clonedSource = this.map.getSource(this.map.getLayer(id).source).serialize()
        delete clonedSource.id;
        const newId = GeoJSON._uuidv4();
        this.map.addSource(newId, clonedSource);
        this.map.setTerrain({source: newId});
        this.terrainActive = true;
      } else {
        this.map.setTerrain();
        this.terrainActive = false;
      }
    }
  }
  async updateTerrain(customEvent) {
    if (customEvent.detail.layerid) {
      const id = customEvent.detail.layerid;
      const active = customEvent.detail.terrain;
      const layer = this.map.getLayer(id);
      if (layer) {
        layer.metadata.terrain = active;
        this.setTerrainLayer(id, active);
        this.hillshadeLayerId = id;
        this.terrainActive = active;
      }
    } else {
      const id = this.hillshadeLayerId;
      const active = customEvent.detail.checked;
      let layer = this.map.getLayer(id);
      if (!layer) {
        layer = this.getDataCatalogLayers(this.datacatalog).find(layer=>layer.layerInfo.id===id);
        if (layer) {
          // merge metadata: {terrain: true} with layer.metadata
          layer.layerInfo.metadata = { ...(layer.layerInfo.metadata || {}), terrain: active };
          const event = new CustomEvent('addlayer', {detail: layer.layerInfo});
          await this.addLayer(event);
        }
      } else {
        layer.metadata.terrain = active;
        this.setTerrainLayer(id, active);
        this.terrainActive = active;
      }
    }
  }
  updateSingleLayerVisibility(id, visible) {
    const layer = this.map.getLayer(id);
    if (layer) {
      this.map.setLayoutProperty(id, 'visibility', (visible ? 'visible' : 'none'));
      layer.metadata.visible = visible;
      if (layer.type === 'hillshade' && layer.metadata.terrain) {
        if (visible) {
          this.setTerrainLayer(id, true);
        } else {
          this.setTerrainLayer(id, false);
        }
      }
      // update item in this.layerlist
      const layerlistitem = this.layerlist.find(layerlistitem=>layerlistitem.id===id);
      if (layerlistitem) {
        layerlistitem.layervisible = visible;
      }
    }
  }
  updateLayerVisibility(e) {
    if (this.map.version) {
      if (Array.isArray(e.detail.layerid)) {
        e.detail.layerid.forEach(id=>{
          this.updateSingleLayerVisibility(id, e.detail.visible);
        });
      } else {
        this.updateSingleLayerVisibility(e.detail.layerid, e.detail.visible);
      }
      this.resetLayerListRequested = true;
      this.map._update(true); // TODO: how refresh map wihtout calling private mapbox-gl function?
    }
  }
  updateEditMode(e) {
    if (this.map.version) {
      const editMode = e.detail.editMode;
      const visible = !editMode;
      const layerId = e.detail.layerId;
      const layer = this.map.getLayer(layerId);
      if (editMode) {
        layer.metadata.inEditMode = true;
      } else {
        delete layer.metadata.inEditMode;
      }
      layer.metadata.visible = visible; // why is this necessary?
      this.updateSingleLayerVisibility(layerId, visible);
      this.resetLayerListRequested = true;
      this.map._update(true); // TODO: how refresh map wihtout calling private mapbox-gl function?
    }
  }
  updateSingleLayerOpacity(id, opacity) {
    if (isNaN(opacity) || opacity < 0 || opacity > 1) {
      return; // cannot parse opacity to valid single number
    }
    const layer = this.map.getLayer(id);
    if (layer) {
      switch (layer.type) {
        case 'hillshade':
          this.map.setPaintProperty(id, 'hillshade-exaggeration', opacity);
          break;
        case 'symbol':
            this.map.setPaintProperty(id, 'text-opacity', opacity);
            this.map.setPaintProperty(id, 'icon-opacity', opacity);
          break;
        case 'circle':
          this.map.setPaintProperty(id, `circle-opacity`, opacity);
          this.map.setPaintProperty(id, `circle-stroke-opacity`, opacity);
          break;
        default:
          this.map.setPaintProperty(id, `${layer.type}-opacity`, opacity);
      }
    }
  }
  updateLayerOpacity(e) {
    if (this.map.version) {
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
    const layer = this.map.getLayer(id)
    if (layer) {
      for (let key in propertyInfo) {
        if (key !== "layerid") {
          if (key === "text-size") {
            this.map.setLayoutProperty(id, key, propertyInfo[key]); // hack, text-size is not a paint property
          } else {
            this.map.setPaintProperty(id, key, propertyInfo[key]);
            if (key === 'fill-color' || key === 'circle-color') {
              this.layerFillColor = {layerid: id, color: propertyInfo[key]}; // for draw color update
            }
          }
        }
      }
    }
  }
  updateLayerPaintProperty(e, wait = 150) {
    // If no timeout is set, execute immediately and set timeout to execute at least every wait ms
    if (!this.timeout) {
      this.executeLayerPaintUpdate(e);
      this.timeout = setTimeout(() => {
        this.timeout = null;
      }, wait);
    } else {
      // Store latest event for deferred execution and skip execution if another event is received within wait ms
      clearTimeout(this.deferredTimeout);
      this.deferredTimeout = setTimeout(() => {
        this.executeLayerPaintUpdate(e);
      }, wait);
    }
  }
  executeLayerPaintUpdate(e) {
    if (this.map.version) {
      if (Array.isArray(e.detail.layerid)) {
        e.detail.layerid.forEach(id => {
          this.updateSingleLayerPaintProperty(id, e.detail);
        });
      } else {
        this.updateSingleLayerPaintProperty(e.detail.layerid, e.detail);
      }
    }
  }
  updateLayerFilter(e) {
    if (this.map.version){
      this.map.setFilter(e.detail.layerid, e.detail.filter);
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
    if (this.map.version && e && e.detail && e.detail.layerid) {
      const targetLayer = this.map.getLayer(e.detail.layerid);
      if (targetLayer) {
        if (targetLayer.type === 'hillshade' && targetLayer.metadata.terrain) {
            this.setTerrainLayer(e.detail.layerid, false); // remove terrain
        }        
        const source = targetLayer.source;
        this.map.removeLayer(targetLayer.id);
        this.removeSourceIfOrphaned(source);
        this.removedLayerId = targetLayer.id;
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
  
  
  insertServiceKey(layerInfo) {
    /* replace '{geodanmapskey}' by APIkeys.geodanmaps, '{freetilehostingkey}' by APIkeys.freetilehosting etc. */
    for (let key in APIkeys) {
      const keyTemplate = `{${key}key}`;
      if (layerInfo.source) {
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
  }
  insertTime(layerInfo){
    //2018-09-21T23:35:00Z
    let interval = 300000; // 5 minutes default
    if (layerInfo.metadata && layerInfo.metadata.timeinterval) {
      interval = layerInfo.metadata.timeinterval;
    }
    const now = encodeURIComponent(new Date(Math.floor((Date.now() - (2 * interval)) / interval) * interval).toISOString());
    if (layerInfo.source) {
      if (layerInfo.source.tiles) {
        layerInfo.source.tiles = layerInfo.source.tiles.map(tileurl=>tileurl.replace('{time}', now));
      }
      if (layerInfo.source.url) {
        layerInfo.source.url = layerInfo.source.url.replace('{time}', now);
      }
    }
  }
  removeReferenceLayers()  {
    const referenceLayers = this.map.getStyle()?.layers.filter(layer=>layer.metadata?.reference);
    referenceLayers?.forEach(layer=>{
      this.map.removeLayer(layer.id)
      if (this.map.getSource(layer.id)) {
        this.map.removeSource(layer.id);
      }
    });
  }

  async addLayer(e) {
    if (this.styleLoading) {
        this.delayedLayers.push(e);
      return;
    }
    const layerInfo = e.detail;
    if (layerInfo.type === 'style') {
      this.styleLoading = true;
      const styleLoader = new WebMapStyleLoader(this);
      styleLoader.addStyle(layerInfo, () => {
        this.styleLoading = false;
        const delayedLayers = this.delayedLayers;
        this.delayedLayers = [];
        delayedLayers.forEach(e=>this.addLayer(e));
      });
    } else {
      layerInfo.metadata = Object.assign(layerInfo.metadata || {}, {userlayer: true});
      this.insertServiceKey(layerInfo);
      this.insertTime(layerInfo);
      if (layerInfo.metadata.wms && !layerInfo.metadata.featureinfoproxy) {
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
      if (layerInfo.type === 'symbol' && layerInfo.layout && layerInfo.layout.hasOwnProperty("icon-image")) {
        if (layerInfo.metadata && !layerInfo.metadata.imageData) {
          layerInfo.metadata.imageData = this._getIconImageDataFromLayer(layerInfo);
        }
      }
      if (layerInfo.metadata && layerInfo.metadata.reference) {
        this.removeReferenceLayers();
        this.layerlist = [...this.layerlist.filter(layer=>layer.metadata?.reference==false || layer.background)];        
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
              if (layerInfo.source && layerInfo.source.type === "geojson") {
                layerInfo.metadata.cansave = true;
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
      if (layerInfo.type === 'hillshade' && layerInfo.metadata?.terrain) {
          this.setTerrainLayer(layerInfo.id, true);
      }
    }
    this.resetLayerList();
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
    if (this.map.version) {
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
  getDataCatalogLayers(catalog) {
    const result = [];
    const enumerateLayers = (layers)=>{
      if (Array.isArray(layers)) {
        layers.forEach(layer=>{
          if (layer.type !== 'layergroup') {  
            if (layer.sublayers) {
              enumerateLayers(layer.sublayers);
            } else {
              result.push(layer);
            }
          }
        })
      }
    }
    enumerateLayers(catalog);
    return result;
  }
  getHillshadeLayerId(catalog) {
    // returns first hillshade layerId from this.datacatalog or null    
    const catalogLayers = this.getDataCatalogLayers(catalog);
    const hillshadeLayer = catalogLayers.find(layer=>layer.layerInfo.type==='hillshade');
    if (hillshadeLayer) {
      return hillshadeLayer.layerInfo.id;
    }
    return null;
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
    this._updateFeatureState();
    if (this.currentTool === name) {
      this.currentTool = '';
    } else {
      this.currentTool = name;
    }
  }
  disableDrawTool() {
    this.currentTool = '';
    this.resetLayerList();
  }
  showExternalLayerDialog(e) {
    const MapDialogLayerExternal = this.shadowRoot.querySelector('map-dialog-layer-external');
    if (MapDialogLayerExternal) {
      MapDialogLayerExternal.showDialog((e)=>this.addLayerFromService(e));
    }
  }

  async testLegendUrl(url) {
    try {
      const response = await fetch(url, {method: 'HEAD'});
      if (!response.ok && response.status === 405) { // 405 Method Not Allowed   
        const response = await fetch(url, {method: 'GET'});
      }
      if (response.ok) {
        if (response.headers.get('content-type').includes('image')) {
          return url;
        }
      } 
    } catch (error) {
      console.error('Error fetching legend URL:', error.message);
    }
    return '';
  }
  async addLayerFromService(e) {
    const serviceInfo = e.detail.serviceInfo;
    switch (serviceInfo.type) {
      case 'WMS':
        {
          const layer = e.detail.layer;
          const layerUrl = new URL(serviceInfo.serviceURL);
          layerUrl.searchParams.set('layers', layer.name);
          layerUrl.searchParams.set('bbox', '{bbox-epsg-3857}');
          layerUrl.searchParams.set('transparent', 'true');
          const wmsMapUrl = layerUrl.href.replace('%7Bbbox-epsg-3857%7D', '{bbox-epsg-3857}');
          const legendUrl = await this.testLegendUrl(wmsUrl(wmsMapUrl, 'getlegendgraphic'));
          const layerInfo = {
            id: GeoJSON._uuidv4(),
            type: 'raster',
            metadata: {
              wms: true,
              title: layer.title,
              abstract: layer.abstract,
              legendurl: legendUrl,
            },
            source: {
              type: 'raster',
              tiles: [wmsMapUrl],
              minzoom: 0,
              maxzoom: 22
            },
          }
          if (e.detail.bbox?.length === 4) {
            layerInfo.source.bounds = e.detail.bbox;
          }
          this.addLayer({detail: layerInfo});
        }
        break;
      case 'WMTS':
        {
          const layer = e.detail.layer;
          const tileUrl = e.detail.tileUrl;          
          const layerInfo = {
            id: GeoJSON._uuidv4(),
            type: 'raster',
            metadata: {
              title: layer.title,
              abstract: layer.abstract,
            },
            source: {
              type: 'raster',
              tiles: [tileUrl],
              minzoom: 0,
              maxzoom: 22
            },
          }
          if (e.detail.legendUrl) {
            layerInfo.metadata.legendurl = e.detail.legendUrl;
          }
          if (e.detail.bbox?.length === 4) {
            layerInfo.source.bounds = e.detail.bbox;
          }
          this.addLayer({detail: layerInfo});
        }
        break;
      default:
          alert(`Unsupported layer type: ${LayerInfo.type}`);
    }
  }
  renderToolbarTools()
  {
    const toolbar = this.toolList.find(tool=>tool.name==="toolbar");
    if (!toolbar || !toolbar.visible) {
      return '';
    }
    const showLanguageTool = this.checkMapIsLanguageSwitcherCapable();
    const showProjectionTool = typeof mapboxgl !== 'undefined';
    const tools = this.toolList.filter(tool=>tool.visible && tool.icon && (tool.name!=='maplanguage' || showLanguageTool) && (tool.name !== 'projchooser' || showProjectionTool));
    if (this.exporttool && this.exporttool !== "0" && this.exporttool.toString().toLowerCase() !== "false") {
      if (!tools.find(tool=>tool.name === 'importexport')) {
        let overrideTool = this.toolList.find(tool=>tool.name === 'importexport');
        overrideTool.order = 99999;
        overrideTool.visible = 1;
        tools.push(overrideTool)
      }
    }
    if (tools.length == 0) {
      return '';
    }
    const datacatalog = tools.find(t=>t.name==="datacatalog");
    let layerSearch = false;
    if (datacatalog && datacatalog.search) {
      layerSearch = true;
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
              <map-iconbutton .icon="${tool.icon}" info="${ifDefined(tool.info)}" 
                @click="${e=>this.toggleTool(tool.name)}" 
                .active="${this.currentTool===tool.name}">
              </map-iconbutton>
            </li>`
          })}
        </ul>
      </div>
      <div id="panel-container" class="${this.currentTool !==''?"active":""}">
        <map-panel .active="${this.currentTool==="search"}">
          <map-search .active="${this.currentTool==="search"}" .viewbox="${this.viewbox}" 
            @persistSearchFeature="${(e)=>this.webMapSearchResultManager.persistSearchFeature(e)}" 
            @searchclick="${e=>this.webMapSearchResultManager.fitBounds(e)}" 
            @searchresult="${e=>this.webMapSearchResultManager.searchResult(e)}">
          </map-search>
        </map-panel>
        <map-panel .active="${this.currentTool==='datacatalog'}">
          <map-data-catalog .active="${this.currentTool==='datacatalog'}"
            .datacatalog="${this.datacatalog}" 
            .maplayers="${this.layerlist}" 
            .search=${layerSearch} 
            @addlayer="${(e) => this.addLayer(e)}" 
            @removelayer="${e=>this.removeLayer(e)}"
            @addExternalLayer="${e=>this.showExternalLayerDialog(e)}"
            @addLayerFromService="${e=>this.addLayerFromService(e)}">
          </map-data-catalog>
        </map-panel>
        <map-panel .active="${this.currentTool==='measure'}">
          <map-measure .webmap="${this.map}" .active="${this.currentTool==='measure'}"></map-measure>
        </map-panel>
        <map-panel .active="${this.currentTool==='info'}">
          <map-info-formatted .info="${this.featureInfo}" .active="${this.currentTool==='info'}" 
            @togglestreetview="${e=>this.toggleStreetView(e)}" 
            @infomode="${e=>this.updateInfoMode(e)}">
          </map-info-formatted>
        </map-panel>
        <map-panel .active="${this.currentTool==='maplanguage'}">
          <map-language .active="${this.currentTool==='maplanguage'}" language="autodetect" @languagechanged="${e=>this.setLanguage(e)}"></map-language>
        </map-panel>
        <map-panel .active="${this.currentTool==='geolocate'}">
        <map-geolocation .webmap="${this.map}" .active="${this.currentTool==='geolocate'}"></map-geolocation>
        </map-panel>        
        <map-panel .active="${this.currentTool==='pitch'}">
          <map-pitch .active="${this.currentTool==='pitch'}" .terrain .pitch="${this.currentTool==='pitch' && this.map && this.map.getPitch()}"
             @updatepitch="${e=>this.updatePitch(e.detail.degrees)}"
             ?terrain-button="${this.hasHillshadeLayer}"
             ?terrain-active="${this.terrainActive}"
             @updateterrain="${e=>this.updateTerrain(e)}"
             @updatevisibility="${(e) => this.updateLayerVisibility(e)}"
             ></map-pitch>
        </map-panel>
        <map-panel .active="${this.currentTool==='draw'}">
          <map-draw .active="${this.currentTool==='draw'}" 
            .map="${this.map}"
            .layercolor=${this.layerFillColor}
            .removedlayerid="${this.removedLayerId}"
            .savecounter="${this.saveCounter}"
            @addlayer="${e=>this.addLayer(e)}" 
            @movelayer="${e=>this.moveLayer(e)}"
            @titlechange="${e=>this.resetLayerList(e)}"
            @updateeditmode="${(e) => this.updateEditMode(e)}">
          </map-draw>
        </map-panel>
        <map-panel .active="${this.currentTool==='importexport'}">
          <map-import-export .active="${this.currentTool==='importexport'}" .map="${this.map}" 
            .toollist="${this.toolList}" 
            .datacatalog="${this.datacatalog}" 
            @droppedfile="${e=>this._processDroppedFile(e.detail)}">
          </map-import-export>
        </map-panel>
        <map-panel .active="${this.currentTool==='datatoolbox'}">
          <div style="width:100%"></div>
          <map-data-toolbox .active="${this.currentTool==='datatoolbox'}" 
            .map="${this.map}" 
            @titlechange="${()=>this.resetLayerList()}" 
            @addlayer="${e=>this.addLayer(e)}" 
            @removelayer="${e=>this.removeLayer(e)}"
            @updatevisibility="${(e) => this.updateLayerVisibility(e)}">
          </map-data-toolbox>
        </map-panel>
        <map-panel .active="${this.currentTool==='sheetimport'}">
          <div style="width:100%"></div>
          <map-sheet-tool .active="${this.currentTool==='sheetimport'}" .map="${this.map}" 
            @droppedfile="${e=>this._processDroppedFile(e.detail)}">
          </map-sheet-tool>
        </map-panel>
        <map-panel .active="${this.currentTool==='projchooser'}">
          <map-proj-chooser .active="${this.currentTool==='projchooser'}" .map="${this.map}"></map-proj-chooser>
        </map-panel>
      </div>
    </div>`
  }
  handleCopiedCoordinate(e) {
    console.log(e.detail);
  }
  renderCoordinates(){
    const tool = this.toolList.find(tool=>tool.name==='coordinates');
    if (tool && tool.visible) {
      return html`<map-coordinates @copiedcoordinate="${e=>this.handleCopiedCoordinate(e)}" .visible="${true}" .lon="${this.displaylng}" .lat="${this.displaylat}" .resolution="${this.resolution}" .clickpoint="${this.lastClickPoint}"></map-coordinates>` 
    }
    return '';
  }
  renderLegend() {
    const legend = this.toolList.find(tool=>tool.name==='legend');
    if (!legend || !legend.visible) {
      return html``;
    }
    return html`
    <div id="legend-container-container">
      <div id="button-hide-legend" @click="${e=>this.toggleLegend(e)}">
        <span class="offset"></span><i>${arrowLeftIcon}</i>
      </div>
      <map-layer-container 
        @removelayer="${(e) => this.removeLayer(e)}"
        @updatevisibility="${(e) => this.updateLayerVisibility(e)}"
        @movelayer="${e=>this.moveLayer(e)}" 
        @updateopacity="${e => this.updateLayerOpacity(e)}"
        @changepaintproperty="${e=>this.updateLayerPaintProperty(e)}"
        @changefilter="${e=>this.updateLayerFilter(e)}"
        @updateterrain="${e=>this.updateTerrain(e)}"
        @enddrawmode="${(e)=>this.disableDrawTool()}"
        >
        <span slot="title">Gekozen kaartlagen</span>
        <map-layer-set id="layersthematic" userreorder open .layerlist="${this.thematicLayers}" 
          .zoom="${this.zoom}"
          ?terrain-active="${this.terrainActive}"
          .datagetter="${this.datagetter}"
          .updatelegend="${this.updatelegend}"
          nolayer="${ifDefined(t("No map layers selected")??undefined)}">
            <span>${t("Selected Map Layers")}</span>
        </map-layer-set>
        <map-layer-set id="layersbackground" .layerlist="${this.backgroundLayers}" 
          .zoom="${this.zoom}"
          ?terrain-active="${this.terrainActive}"
          nolayer = "${'No background layer available'}">
            <span>${t('Background layers')}</span>
        </map-layer-set>
      </map-layer-container>
    </div>`;
  }
  render() {
    
    return html`<style>
      ${mapgl.css}
      /* workaround bug mapbox-gl v.051, https://github.com/mapbox/mapbox-gl-js/issues/7589 */
      .${mapgl.libName}-ctrl.${mapgl.libName}-ctrl-attrib p {
        display: inline-block;
        margin: 2px;
      }
      :host {
        display: inline-block;
        min-width: 200px;
        min-height: 200px; 
        overflow: hidden;
      }
      .webmap {width: 100%; height: 100%}
      .${mapgl.libName}-ctrl.${mapgl.libName}-ctrl-group.${mapgl.libName}-ctrl-zoom {
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
        box-sizing: border-box;
        user-select: none;
      }
      </style>
    <div class="webmap"></div>
    ${this.renderToolbarTools()}
    ${this.renderCoordinates()}
    ${this.renderLegend()}
    ${this.sheetdialog?html`<map-dialog dialogtitle="Sheet-Kaart" @close="${e=>{this.sheetdialog=null;this.requestUpdate();}}"><map-gsheet-form .layerinfo="${this.sheetdialog}" @addlayer="${(e) => this.addLayer(e)}"></map-gsheet-form></map-dialog>`:html``} 
    <map-spinner .webmap=${this.map}></map-spinner>
    <map-modal-dialog></map-modal-dialog>
    <map-dialog-layer-external></map-dialog-layer-external>
    <map-save-layer .webmap=${this.map} .container=${this} @beforesave="${(e)=>this._beforeSaveLayer(e)}"></map-save-layer>
    `
  }
  _beforeSaveLayer(event) {
    this.saveCounter++;
  }
  checkMapIsLanguageSwitcherCapable(recheck)
  {
    if (recheck) {
      this.isLanguageSwitcherCapable = undefined;
    }
    if (this.isLanguageSwitcherCapable !== undefined) {
      return this.isLanguageSwitcherCapable;
    }
    if (!this.map.version) {
      return this.isLanguageSwitcherCapable = undefined;
    }
    if (!this.map.isStyleLoaded() && !recheck) {
      return this.isLanguageSwitcherCapable = undefined;
    }
    return this.isLanguageSwitcherCapable = this.map.getStyle().layers.find(layer=>layer.source === 'openmaptiles' && layer.metadata && layer.metadata.reference == true) !== undefined;
  }
  _getAngle (latlng1, latlng2)
  {
    const rad = Math.PI / 180,
        lat1 = latlng1.lat * rad,
        lat2 = latlng2.lat * rad,
        a = Math.sin(lat1) * Math.sin(lat2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.cos((latlng2.lng - latlng1.lng) * rad);
    return Math.acos(Math.min(a, 1)) / rad;
  }
  _getResolution (map)
  {
    // returns degrees / pixel-width
    if (!map) {
      return undefined;
    }
    const y = map._container.clientHeight / 2;
    return this._getAngle(map.unproject([0, y]), map.unproject([1, y]));
  }
  _mapMoveEnd() {
    const bounds = this.map.getBounds();
    this.viewbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    this.resolution = this._getResolution(this.map);
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
  setHillShadeInfo(catalog) {
    if (catalog) {
      this.hillshadeLayerId = this.getHillshadeLayerId(catalog);
      this.hasHillshadeLayer = this.hillshadeLayerId !== null;
      this.terrainActive = false;
    } else {
      this.hillshadeLayerId = null;
      this.hasHillshadeLayer = false;
      this.terrainActive = false;
    }
  }
  async resolveLayerReferences(parentUrl, layerArray, baseUrl) {
    for (let layer of layerArray) {
      if (layer.type === "group") {
        await this.resolveLayerReferences(parentUrl, layer.sublayers, baseUrl);
      } else {
        if (typeof layer.layerInfo === 'string') {
          try {
            let url = layer.layerInfo;
            if (!url.match(/^https?:\/\//i)) {
              // relative url
              let slashPos = parentUrl.lastIndexOf('/');
              if (slashPos >= 0) {
                url = parentUrl.substr(0, slashPos + 1) + url;
              }
            }
            let response = await fetch(url);
            if (response.status >= 200 && response.status < 300) {
              layer.layerInfo = await response.json();
            } else if (baseUrl) {
              // try again with baseUrl
              let slashPos = baseUrl.lastIndexOf('/');
              if (slashPos >= 0) {
                url = baseUrl.substr(0, slashPos + 1) + url;
              }
              response = await fetch(url);
              if (response.status >= 200 && response.status < 300) {
                layer.layerInfo = await response.json();
              }
            }
            if (typeof layer.layerInfo === 'string') {
              throw new Error(`Error loading layer ${layer.layerInfo}`);  
            }
          } catch (err) {
            layer.title = `Error ${err.message} (${layer.layerInfo})`;
            layer.layerInfo = {
              id: GeoJSON._uuidv4(),
              title: `Error ${err.message} (${layer.layerInfo})`
            }
          }
        }
      }
    }
  }
  
  async handleConfiguration() {
    // (re-)load the configuration
    const initializer = new WebMapInitializer(this);
  
    if (this.configurl) {
      try {
        let config;
        if (typeof this.configurl === 'string') {
          // Load and apply external configuration
          const response = await fetch(this.configurl);
          if (!response.ok) {
            throw new Error(`Error loading config: ${response.statusText || response.status}`);
          }
          config = await response.json();
        } else {
          // Use provided configuration object (such as a dropped config file)
          config = this.configurl;
        }
        
        // Resolve any layer references in the config
        const baseUrl = typeof this.configurl === 'string' ? this.configurl : "";
        await this.resolveLayerReferences(
          baseUrl, 
          config.datacatalog, 
          config.fallbackBaseUrl ?? config.baseUrl
        );
        
        // Apply the loaded configuration
        await initializer.initializeMap(config);
      } catch (error) {
        console.error('Error loading configuration:', error);
        alert(`Error loading config:\n${this.configurl}\n${error}`);
        // Fall back to default configuration
        await initializer.initializeMap({
          datacatalog: this.defaultdatacatalog
        });
      }
    } else {
      // No external config, use default
      await initializer.initializeMap({
        datacatalog: this.defaultdatacatalog
      });
    }
  }
  
  
  applyMapSettings(mapConfig) {
    // Set center if provided
    if (mapConfig.center) {
      [this.lon, this.lat] = mapConfig.center;
    }
  
    // Apply numeric properties if present
    ['zoom', 'pitch', 'bearing', 'maxPitch'].forEach(prop => {
      if (mapConfig.hasOwnProperty(prop)) {
        this[prop] = mapConfig[prop];
      }
    });
  
    // Handle style configuration
    this.mapstyle = mapConfig.style || this.getEmptyStyle();
    this.mapstyleid = mapConfig.style?.id;
    this.mapstyletitle = mapConfig.style?.name;
  }
  
  getEmptyStyle() {
    return {
      version: 8,
      name: "EmptyStyle",
      id: "emptystyle",
      sources: {},
      layers: [],
      glyphs: "https://tiles.edugis.nl/glyphs/{fontstack}/{range}.pbf",
      sprite: "https://openmaptiles.github.io/osm-bright-gl-style/sprite"
    };
  }
  
  firstUpdated() {
    const mapcontainer = this.shadowRoot.querySelector('div');
    mapcontainer.addEventListener('dragover', (e)=>{
      e.preventDefault()
    });
    mapcontainer.addEventListener('drop', (ev)=> this.handleDrop(ev));   
    this.addEventListener('openedfile', (ev)=> this.handleOpenedFile(ev));
    this.addEventListener('showmodaldialog', event=> {
      let modalDialog = this.shadowRoot.querySelector('map-modal-dialog');
      if (modalDialog) {
        modalDialog.markdown = event.detail.markdown;
      }
    });

    this.handleConfiguration();
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
  async _loadCSV(droppedFile) {
    /* handle added csv (converted to json with papaparse or XSLX)
       1 - determine which vector data should be joined to the file data (get url, key and fkey)
       2 - load the external vector data, do not visually display the features
       3 - create an empty geojson layer with visible features (when added)
       4 - scan the rendered invisible features (step 2) for fkey and 
           copy the feature geometry with properties added from the file to the  geojson layer
       5 - visually display the geojson layer
    */
    let csvKeyDataPairs = [
      {
        key: 'postcode', 
        fkey: 'postcode',
        type: 'circle', 
        source: {
          "type": "vector",
          "tiles": [
            'https://tiles.edugis.nl/v1/mvt/postcode.postcode2019q1/{z}/{x}/{y}?columns=postcode,substring(postcode+from+1+for+4)+as+pc4'
          ]
        },
        sourceLayer: "postcode.postcode2019q1",
        minzoom: 8,
        paint: {
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
      },
      {
        key: 'GemeentecodeGM', 
        fkey: 'statcode',
        type: 'fill', 
        source: {
          "type": "geojson",
          "data": 'https://tiles.edugis.nl/geojson/cbs_gemeente_2019_gegeneraliseerd.geojson'
        },
        sourceLayer: 'cbs_gemeente_2019_gegeneraliseerd',
        minzoom: 5,
        paint: {
            "fill-color": [
              "step",
              ["get", "Inwoners"],
              "#fff7ec",
              17290, "#fee8c8",
              22795, "#fdd49e",
              26587, "#fdbb84",
              33025, "#fc8d59",
              44058, "#ef6548",
              67551, "#d7301f",
              844947, "#990000",
            ],
            "fill-outline-color": "white",
            "fill-opacity": 0.8
          }
      }
    ];

    let csvKeyName = droppedFile.data.meta.fields.find(fieldname=>csvKeyDataPairs.find(pair=>pair.key === fieldname)!==undefined);
    if (!csvKeyName) {
      csvKeyName = droppedFile.data.meta.fields.find(fieldname=>csvKeyDataPairs.find(pair=>pair.key.toLowerCase() === fieldname.toLowerCase()) !== undefined);
    }
    if (!csvKeyName) {
      alert(`CSV file should have a column named: '${csvKeyDataPairs.map(pair=>pair.key).join("' or '")}'`)
      return;
    }
    let keyInfo = csvKeyDataPairs.find(pair=>pair.key === csvKeyName);
    if (!keyInfo) {
      keyInfo = csvKeyDataPairs.find(pair=>pair.key.toLowerCase() === csvKeyName.toLowerCase());
    }
    let mappedCSV = new Map(droppedFile.data.data.map(row=>[row[csvKeyName], row]));
    const vectorKeyName = keyInfo.fkey;
    if (vectorKeyName === 'postcode') {
      // remove possible spaces from csv postcode
      droppedFile.data.data.forEach(item=>item[csvKeyName]=item[csvKeyName].replace(' ', ''))
    }
    if (keyInfo.source.type === "geojson") {
      if (typeof keyInfo.source.data === "string") {
        // preload the data
        let response = await fetch (keyInfo.source.data);    
        if (response.ok) {
          let json = await response.json();
          keyInfo.source.data = json;
        }
      }
      if (typeof keyInfo.source.data === 'object') {
        // link the csv to the geojson
        keyInfo.source.data.features = keyInfo.source.data.features
          .filter(feature=>mappedCSV.has(feature.properties[vectorKeyName]))
          .map(feature=>{
            feature.properties = Object.assign({}, feature.properties, mappedCSV.get(feature.properties[vectorKeyName]));
              return feature;
          });
      }
    }

    const geocodedCSVLayerId = GeoJSON._uuidv4();
    const geocodedCSVLayer = {
      "metadata": {"title": `${droppedFile.filename}`},
      "id": geocodedCSVLayerId,
      "type": keyInfo.type,
      "minzoom": keyInfo.minzoom,
      "source": {
        "type": "geojson",
        "data": {
          "type": "FeatureCollection",
          "features": []
        }
      },
      "paint": keyInfo.paint
    }

    if (keyInfo.source.type === "geojson" && typeof keyInfo.source.data === "object") {
      geocodedCSVLayer.source.data = keyInfo.source.data;
    } else {
      const hiddenVectorLayerId = GeoJSON._uuidv4();
      const hiddenVectorLayer = {
        "metadata": {
          "title": `${droppedFile.filename}`,
          "isToolLayer": true
        },
        "id": hiddenVectorLayerId,
        "type": keyInfo.type,
        "minzoom": keyInfo.minzoom,
        "source": keyInfo.source,
        "paint": {},
        filter: false
      }
      if (hiddenVectorLayer.source.type === 'vector') {
        hiddenVectorLayer.source.id = hiddenVectorLayerId;
        hiddenVectorLayer.source.minzoom = keyInfo.minzoom;
        hiddenVectorLayer.source.maxzoom = 16;
        hiddenVectorLayer["source-layer"] = keyInfo.sourceLayer;
      }
      
      const sourceLayer = hiddenVectorLayer["source-layer"];

          
      let jsonFeatures = [];
      const mappedJson = new Map();

      const handleSourceData = e=>{
        if (e.isSourceLoaded && e.sourceId === hiddenVectorLayerId) {
          let vectorFeatures = this.map.querySourceFeatures(hiddenVectorLayerId, {sourceLayer:sourceLayer});
          let jsonUpdated = false;
          for (let vectorFeature of vectorFeatures) {
            const keyValue = vectorFeature.properties[vectorKeyName];
            if (mappedCSV.has(keyValue)) {            
              //csvKeyValues.delete(keyValue);
              if (!mappedJson.has(keyValue)) {
                jsonUpdated = true;
                mappedJson.set(keyValue, {
                  type: "Feature",
                  properties: Object.assign({}, vectorFeature.properties, mappedCSV.get(keyValue)),
                  geometry: vectorFeature.geometry,
                  tile: vectorFeature.tile
                })                
              } else {
                let feature = mappedJson.get(keyValue);
                if (feature.tile.z < vectorFeature.tile.z) {
                  // more detailed feature for this keyValue found
                  jsonUpdated = true;
                  mappedJson.set(keyValue, {
                    type: "Feature",
                    properties: feature.properties,
                    geometry: vectorFeature.geometry,
                    tile: vectorFeature.tile
                  })
                }
              }
            }
          }
          if (jsonUpdated) {
            this.map.getSource(geocodedCSVLayerId).setData({
              "type": "FeatureCollection",
              "features": Array.from(mappedJson.values())
            })
          }
        };
      }
      this.map.on('sourcedata', handleSourceData); /* todo: remove handler when layer is removed */
      this.addLayer({detail: hiddenVectorLayer});
    }
    this.addLayer({detail: geocodedCSVLayer});
  }

  _processDroppedFile(droppedFile) {
    if (droppedFile === false) {
      alert('Dropped item not recognized as a file');
    } else if (droppedFile.error) {
      alert('Json error: ' + droppedFile.error);
    } else if (droppedFile.data.map && droppedFile.data.tools) {
      this.resolveLayerReferences(droppedFile.filename, droppedFile.data.datacatalog, droppedFile.data.baseUrl).then(()=>{
        this.configurl = droppedFile.data;
        this.handleConfiguration();
      })
    } else if (droppedFile.data.type && (droppedFile.data.type === "Feature" || droppedFile.data.type === "FeatureCollection" || droppedFile.data.type === "Topology")) {
      const filename = droppedFile.filename.replace(/\.[^/.]+$/,"");
      let geojson = droppedFile.data;
      if (geojson.type === "Topology") {
        // convert topojson to geojson
        geojson = topojson.feature(geojson,geojson.objects[Object.keys(geojson.objects)[0]])
      }
      if (geojson.crs) {
        geojson = geoJSONProject(geojson);
      }
      const layers = GeoJSON.createLayers(geojson, filename);
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
    } else if (Array.isArray(droppedFile.data) && droppedFile.data.length) {
      for (const layer of droppedFile.data) {
        if (layer.type === 'FeatureCollection' || layer.type === 'Feature') {
          const filename = droppedFile.filename.replace(/\.[^/.]+$/,"");
          const layers = GeoJSON.createLayers(layer, filename);
          layers.forEach(layer=>this.addLayer({detail: layer}));
        } else if (layer.style) {
          this.addLayer({detail: layer.style});
        }
      }
    } else {
      alert ('Valid data, but content not recognized');
    }
  }

  handleDrop(ev) {
    this.currentTool = '';
    MapImportExport.handleDrop(ev).then(droppedFile=>{
     this._processDroppedFile(droppedFile);
    })
  };
  async handleOpenedFile(ev) {
    const file = ev.detail;
    const openedFile = await MapImportExport._readFile(file);
    this._processDroppedFile(openedFile);
  }
  
  mapHasZoomed() {
    this.resetLayerListRequested = true;
  }

  mapHasRendered() {
    if (this.resetLayerListRequested) {
      if (!this.map.style.stylesheet) {
        /* mapbox-gl bug? getStyle() throws exception on empty style */
        this.layerlist = [];
        console.log("layerlist empty")
        return;
      }
      const newLayerList = this.map.getStyle().layers
      this.layerlist = [...newLayerList];
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
      if (this.map.version) {
        this.handleConfiguration();
      }
    }

    if (changedProperties.has("layerlist")) {
      this.thematicLayers = this.layerlist.filter(layer=>!layer.metadata || (layer.metadata && (!layer.metadata.reference) && !(layer.metadata.isToolLayer))).reverse();
      this.backgroundLayers = this.layerlist.filter(layer=>layer.metadata && layer.metadata.reference).reverse();
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
  setLanguage(e) {
    //this.storeNoneReferenceLayers();
    if (e.detail.language === "autodetect") {
      this.map.autodetectLanguage();
    } else {
      this.map.setLanguage(e.detail.language, (e.detail.language !== "native"));
    }
    //setTimeout(()=>this.restoreNoneReferenceLayers(), 1000); // how else?    
    // maybe: this.once('styledata', () => this.restoreNoneReferenceLayers()); ?
  }
  mapClick(e) {
    this.lastClickPoint = [e.lngLat.lng,e.lngLat.lat];
    this.handleInfo(e);
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
    } else if (json.hasOwnProperty("coord")) {
      // openweather API json
      let geoJson = {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "geometry": {"type": "Point", "coords": [json.coord.lon, json.coord.lat]},
            "properties": {
              "feels_like": json.main.feels_like,
              "humidity": json.main.humidity,
              "pressure": json.main.pressure,
              "temp": json.main.temp,
              "temp_max": json.main.temp_max,
              "temp_min": json.main.temp_min,
              "name": json.name,
              "timezone": json.timezone,
              "visibility": json.visibility,
              "wind-speed": json.wind.speed,
              "wind-deg": json.wind.deg,
              "weather-description": json.weather[0].description,
              "weather-icon": json.weather[0].icon, 
              "location-local-date-time": new Date(json.dt * 1000 + json.timezone * 1000 + new Date().getTimezoneOffset() * 60 * 1000).toLocaleString(navigator.language, {weekday: "short", day:"numeric", month: "long", year: "numeric", hour: "numeric", minute: "numeric"})
            }
          }
        ]
      }
      if (json.rain && json.rain["1h"]) {
        geoJson.features[0].properties.rain = json.rain["1h"];
      }
      return geoJson;
    } else if (json.hasOwnProperty("current")) {
      // openWeather onecall API
      let geoJson = {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "geometry": {"type": "Point", "coords": [json.lon, json.lat]},
            "properties": {
              "feels_like": json.current.feels_like,
              "humidity": json.current.humidity,
              "pressure": json.current.pressure,
              "sunrise": new Date(json.current.sunrise * 1000 + json.timezone_offset * 1000 + new Date().getTimezoneOffset() * 60 * 1000).toLocaleString(navigator.language, {weekday: "short", day:"numeric", month: "long", year: "numeric", hour: "numeric", minute: "numeric"}),
              "sunset": new Date(json.current.sunset * 1000 + json.timezone_offset * 1000 + new Date().getTimezoneOffset() * 60 * 1000).toLocaleString(navigator.language, {weekday: "short", day:"numeric", month: "long", year: "numeric", hour: "numeric", minute: "numeric"}),
              "temp": json.current.temp,
              "timezone": json.timezone,
              "timezone_offset": json.timezone_offset,
              "visibility": json.current.visibility,
              "wind-speed": json.current.wind_speed,
              "wind-deg": json.current.wind_deg,
              "weather-description": json.current.weather[0].description,
              "weather-icon": json.current.weather[0].icon, 
              "location-local-date-time": new Date(json.current.dt * 1000 + json.timezone_offset * 1000 + new Date().getTimezoneOffset() * 60 * 1000).toLocaleString(navigator.language, {weekday: "short", day:"numeric", month: "long", year: "numeric", hour: "numeric", minute: "numeric"})
            }
          }
        ]
      }
      return geoJson;
    };
    return json;
  }
  queryWMSFeatures(lngLat, metadata) {
    const featureInfoUrl = metadata.getFeatureInfoUrl;
    if (featureInfoUrl.startsWith('https://api.openweathermap.org')) {
      /* force lng between -180 and +180 */
      let lng = lngLat.lng % 360;
      lng = lng < -180 ? lng + 360 : lng > 180 ? lng - 360 : lng;
      let url = featureInfoUrl.replace('{openweathermapkey}', APIkeys.openweathermap).replace('{longitude}', lng).replace('{latitude}',lngLat.lat);
      return fetch(url)
      .then(response=>{        
          return response.json().then(json=>this.jsonToGeoJSON(json));
      });
    }
    const featureInfoFormat = metadata.getFeatureInfoFormat ? metadata.getFeatureInfoFormat : 'text/xml';
    const wmtsResolution = (2 * 20037508.342789244) / (256 * Math.pow(2, (Math.round(this.zoom+1))));
    // get webmercator coordinates for clicked point
    const clickedPointMercator = projectLngLat(lngLat);
    // create 3 x 3 pixel bounding box in webmercator coordinates
    const leftbottom = {x: clickedPointMercator.x - 1.5 * wmtsResolution, y: clickedPointMercator.y - 1.5 * wmtsResolution};
    const righttop = {x: clickedPointMercator.x + 1.5 * wmtsResolution, y: clickedPointMercator.y + 1.5 * wmtsResolution};
    // getFeatureinfo url for center pixel of 3x3 pixel area
    let srs = 'EPSG:3857';
    if (featureInfoUrl.toLowerCase().indexOf('srs=epsg:900913') > -1) {
      srs = 'EPSG:900913';
    }
    const params = `&fi_point_tolerance=3&fi_line_tolerance=3&width=3&height=3&x=1&y=1&srs=${srs}&info_format=${featureInfoFormat}&bbox=`;
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
      "properties": {"info": `${t('waiting for response')}...`}
    };
  }
  toggleStreetView(e) {
    this.streetViewOn = e.detail.streetview;
  }
  updateInfoMode(e) {
    if (this.map.version) {
      this.map.getCanvas().style.cursor = (e.detail) ? 'crosshair' : 'pointer';
    }
  }
  getStreetViewImage(lngLat)
  {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lngLat.lat},${lngLat.lng}&key=${APIkeys.google}`;
    return fetch(url).then(response=>response.json()).then(json=>{
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
      if (outlineInfoIcon.getHTML){
        this.markerDiv.innerHTML = outlineInfoIcon.getHTML(); // old html template 
        this.markerDiv.innerHTML = this.markerDiv.firstElementChild.innerHTML;
      } else if (outlineInfoIcon.strings) {
        this.markerDiv.innerHTML = outlineInfoIcon.strings[0]; // newer html template
      }
    }
    if (this.marker) {
      const oldMarkerPixelPos = this.map.project(this.marker.getLngLat());
      const newMarkerPixelPos = this.map.project(lngLat);
      if (Math.abs(oldMarkerPixelPos.x - newMarkerPixelPos.x) < 5 && Math.abs(oldMarkerPixelPos.y - newMarkerPixelPos.y) < 5) {
        // marker clicked again
        this.marker.remove();
        this.marker = null;
        this.infoClicked = false;
        return;
      }
      this.marker.remove();
    }
    this.marker = new mapgl.Marker({element:this.markerDiv}).setLngLat(lngLat).addTo(this.map);
  }
  _updateFeatureState()
  {
    if (this.featureInfo.length) {
      if (this.oldFeature && 
        this.oldFeature.id === this.featureInfo[0].id && 
        this.oldFeature.source === this.featureInfo[0].source && 
        this.oldFeature.sourceLayer === this.featureInfo[0].sourceLayer) {
          // same feature selected
          return;
      }
      if (this.oldFeature) {
        this.map.setFeatureState(this.oldFeature ,{active: false});
      }
      if (this.featureInfo[0].id) {
        //const newFeature = {source: this.featureInfo[0].source, sourceLayer: this.featureInfo[0].sourceLayer, id: this.featureInfo[0].id};
        const newFeature = this.featureInfo[0];
        this.map.setFeatureState(newFeature, {active: true});
        this.oldFeature = newFeature;
      } else {
        this.oldFeature = null;
      }
    } else if (this.oldFeature) {
      this.map.setFeatureState(this.oldFeature ,{active: false});
      this.oldFeature = null;
    }
  }
  handleInfo(e) {
    if (this.currentTool !== 'info') {
      this.infoClicked = false;
      if (this.featureInfo?.length) {
        this.featureInfo = [];
      }
      return;
    }
    if (e.type === "mousemove" && !this.infoClicked) {
      this.featureInfo = this.map.queryRenderedFeatures(e.point);
      //const height = this.map.queryTerrainElevation(e.lngLat);
      //console.log(`height: ${height}`);
      this._updateFeatureState();
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
          //const height = this.map.queryTerrainElevation(e.lngLat);
          //console.log(`height: ${height}`);
        }
      }
      if (this.streetViewOn) {
        const streetViewInfo = {"type":"Feature", "properties": {"image": "retrieving..."}, "layer": {"id":"streetview", "metadata": {"attributes":{"allowedattributes":["image"],"translations":[{"name":"image","translation":"afbeelding"}]}}}};
        featureInfo.push(streetViewInfo);
        this.getStreetViewImage(e.lngLat).then(imageurl=>{
          streetViewInfo.properties.image = imageurl;
          streetViewInfo.properties.latitude = e.lngLat.lat;
          streetViewInfo.properties.longitude = e.lngLat.lng;
          this.featureInfo = [...this.featureInfo];
          this.requestUpdate();
        });
      }
      if (featureInfo.length == 0) {
        this.featureInfo = [{layer:{metadata:{title:'Gekozen kaartlagen'}},properties:[]}];
      } else {
        this.featureInfo = featureInfo.reverse();
      }
      this._updateFeatureState();
    }
  }
  _iconData(iconName, title) {
    if (!this._iconDataCache) {
      const images = this.map.style.imageManager.images;
      this._iconDataCache = []
      for (const name in images) {
        if (images[name].data) {
          const {height,width,data} = images[name].data;
          //const size = Math.max(width, height);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          //const offsetX = (size - width) / 2;
          //const offsetY = (size - height) / 2;
          const imageData = new ImageData(Uint8ClampedArray.from(data), width, height);
          //ctx.putImageData(imageData, offsetX, offsetY);
          ctx.putImageData(imageData, 0, 0);
          this._iconDataCache.push({name: name, data: canvas.toDataURL()});
        } else if (images[name].spriteData) {
          const spriteData = images[name].spriteData;
          const canvas = spriteData.context.canvas;

          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = spriteData.width;
          croppedCanvas.height = spriteData.height;
          const croppedCtx = croppedCanvas.getContext('2d');
          croppedCtx.drawImage(canvas, spriteData.x, spriteData.y, spriteData.width, spriteData.height, 0, 0, spriteData.width, spriteData.height);
          this._iconDataCache.push({name: name, data: croppedCanvas.toDataURL()});
        } else {
          // empty data
          this._iconDataCache.push({name: name, data: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="});
        }
      }
    }
    const iconSearch = iconName.replace(/{[^}]+}/g, '(.+)');
    const matchingIcons = this._iconDataCache.filter(({name})=>name.search(iconSearch) !== -1).map(iconInfo=>{
      const attributeValues = iconInfo.name.match(iconSearch).slice(1);
      let attributeNames = attributeValues.length ? iconName.match(/{[^}]+}/g).slice(0) : [];
      if (attributeNames.length === 0) {
        attributeNames.push(title)
      } else {
        attributeNames = attributeNames.map(attr=>attr.slice(1,-1));
      }
      return {
        iconName: iconInfo.name,
        data: iconInfo.data,
        attributeValues: attributeValues,
        attributeNames: attributeNames
      }
    });
    return matchingIcons;
  }
  _filterForAllowedAndIgnoredIcons(layer, icons) {
    if (layer.metadata && layer.metadata.attributes) {
      if (layer.metadata.attributes.ignoreLegendSymbolValues) {
        for (const attribute of layer.metadata.attributes.ignoreLegendSymbolValues) {
          icons = icons.filter(icon=>{
            let index = icon.attributeNames.indexOf(attribute.name);
            if (index > -1) {
              if (icon.attributeValues.length > index) {
                return !attribute.values.includes(icon.attributeValues[index]);
              }
            }
            return true;
          })
        }
      }
      if (layer.metadata.attributes.allowLegendSymbolValues) {
        for (const attribute of layer.metadata.attributes.allowLegendSymbolValues) {
          icons = icons.filter(icon=>{
            let index = icon.attributeNames.indexOf(attribute.name);
            if (index > -1) {
              if (icon.attributeValues.length > index) {
                return attribute.values.includes(icon.attributeValues[index]);
              }
            }
            return true;
          })
        }
      }
    }
    return icons;
  }
  _getIconImageDataFromLayer(layerInfo) {
    let iconName = layerInfo.layout && layerInfo.layout["icon-image"] ? layerInfo.layout["icon-image"] :
            layerInfo.paint && layerInfo.paint["fill-pattern"] ? layerInfo.paint["fill-pattern"] :
              undefined;
    if (iconName) {
      if (typeof iconName === 'string') {
        const title = layerInfo.metadata && layerInfo.metadata.title ? layerInfo.metadata.title : layerInfo.id;
        return this._filterForAllowedAndIgnoredIcons(layerInfo, this._iconData(iconName, title));
      }
    }
  }
  mapHasData(e) {
    // handler for map 'data' event
    if (e.dataType === 'style' && e.style?.imageManager?.isLoaded()) {
      this._updateLayerIconImages();
      this.resetLayerList();
    }
  }
  _updateLayerIconImages() {
    // copy icon images from style sprite to layer metadata
    this._iconDataCache = undefined;
    const layers = this.map.getStyle().layers;
    for (const layer of layers) {
      if ((
          (layer.layout && layer.layout.hasOwnProperty('icon-image'))
          || (layer.paint && layer.paint.hasOwnProperty("fill-pattern"))
          ) && layer.metadata && !layer.metadata.imageData) {
          layer.metadata.imageData = this._getIconImageDataFromLayer(layer);
      }
    }
  }
}
customElements.define('web-map', WebMap);
