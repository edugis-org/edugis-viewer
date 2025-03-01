import mapgl from '../map-gl';
import ZoomControl from '../../lib/zoomcontrol';

export class WebMapInitializer {
  constructor(webMap) {
    this.webMap = webMap;
  }

  prepareStyle(style, styleId, styleTitle) {
    // Add metadata to all layers
    if (style.layers) {
      style.layers.forEach(layer => {
        if (!layer.metadata) {
          layer.metadata = {};
        }
        layer.metadata.reference = true;
        layer.metadata.styleid = styleId;
        layer.metadata.styletitle = styleTitle;
      });
    }
    
    // Ensure glyphs are set
    if (!style.glyphs) {
      style.glyphs = 'https://tiles.edugis.nl/glyphs/{fontstack}/{range}.pbf';
    }
    
    return style;
  }

  async initializeMap(config) {
    // Apply API keys if present
    
    if (config.keys) {
      APIkeys = { ...APIkeys, ...config.keys };
    }
    if (this.webMap.accesstoken && mapgl.libName === 'mapboxgl') {
        mapgl.accessToken = config.keys?.mapbox || this.webMap.accesstoken;
    }
    
    // Apply tool configurations
    if (config.tools) {
      await this.applyToolSettings(config.tools);
    }

    // Initialize the map
    this.createMap(config);
    
    // post initialization: see this.mapCreated()
  }

  getCheckedLayers(nodeList, layerInfos = []) {
    // recursively lookup checked nodes and return array
    nodeList.forEach(node=>{
      if (node.sublayers) {
        this.getCheckedLayers(node.sublayers, layerInfos);
      } else if (node.checked) {
        layerInfos.push({order: node.checked, layerInfo: node.layerInfo});
      }
    });
    return layerInfos;
  }
  
  prepareLayers(nodeList) {
    // set up layer metadata and checked (visible) layers and visible layer order
    let activeReferenceLayer = undefined;
    nodeList.forEach(node=>{
      if (node.type !== 'layergroup') {
        if (node.sublayers) {
          this.prepareLayers(node.sublayers);
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
      }
    });
    if (activeReferenceLayer) {
      // set reference layer order to first
      activeReferenceLayer.checked = 1;
    }
  }

  async applyToolSettings(tools) {
    // Reset current tool
    if (this.webMap.currentTool) {
      this.webMap.currentTool = '';
      await new Promise(resolve => setTimeout(resolve, 100)); // let tool cleanup
    }
    // Reset tool visibility except toolbar
    this.webMap.toolList.forEach(tool => {
      tool.visible = (tool.name === 'toolbar');
    });

    // Apply tool configurations
    Object.entries(tools).forEach(([toolName, toolConfig]) => {
      const mapTool = this.webMap.toolList.find(tool => tool.name === toolName);
      if (mapTool) {
        Object.assign(mapTool, toolConfig);
        
        if (toolName === 'toolbar' || toolName === 'legend') {
          mapTool.position = toolConfig.position || "opened";
        }
      }
    });
  }

  _positionString(prop) {
    // convert prop to control position
    let propl = prop.toLowerCase().trim();
    if (propl === "true" || propl === "") {
      return undefined;
    }
    return propl;
  }

  initializeDataGetter() {
    this.webMap.datagetter = {
      querySourceFeatures: (source, options) => this.webMap.map.querySourceFeatures(source, options),
      getSource: (sourcename) => this.webMap.map.getSource(sourcename),
      getFilter: (layerid) => this.webMap.map.getFilter(layerid)
    };
  }
  
  setupMapControls() {
    const controlTools = this.webMap.toolList.filter(tool=>tool.position !== "").sort((a,b)=>a.order-b.order);
    controlTools.forEach(tool=>{
      if (tool.visible) {
        switch (tool.name) {
          case "zoomlevel":
              this.webMap.map.addControl(new ZoomControl(), this._positionString(tool.position));
            break;
          case "navigation":
            this.webMap.map.addControl(new mapgl.NavigationControl({visualizePitch: true, showCompass: true, showZoom: true}), this._positionString(tool.position));
            break;
          case "coordinates":
            this.webMap.map.on('mousemove', e=>{this.webMap.displaylat = e.lngLat.lat; this.webMap.displaylng = e.lngLat.lng;});
            break;
          case "scalebar":
            this.webMap.map.addControl(new mapgl.ScaleControl(), this._positionString(tool.position));
            break;
        }
      }
    });
    this.webMap.setControlTooltips();
  };

  disableRightMouseDragRotate()
  {
    const originalDragRotate = this.webMap.map.dragRotate;
    //originalDragRotate.disable();
  }
    
  setupEventHandlers() {
    this.webMap.map.on('mousemove', e=>this.webMap.handleInfo(e));
    
    this.webMap.map.autodetectLanguage(); // set openmaptiles language to browser language

    this.webMap._mapMoveEnd();
    this.webMap.map.on('moveend', ()=>{this.webMap._mapMoveEnd()});
    this.webMap.map.on('click', (e)=>this.webMap.mapClick(e));
    this.webMap.map.on('render', e=>this.webMap.mapHasRendered());
    this.webMap.map.on('zoomend', e=>this.webMap.mapHasZoomed());
    this.webMap.map.on('data', e=>this.webMap.mapHasData(e));

    this.disableRightMouseDragRotate();
  }

  setupDatacatalog(config) {
    // Set up datacatalog
    if (config.datacatalog) {
      this.prepareLayers(config.datacatalog);
      this.webMap.datacatalog = config.datacatalog;
      const activeLayers = this.getCheckedLayers(config.datacatalog)
        .sort((a, b) => a.order - b.order)
        .map(layer => layer.layerInfo);
      for (const layer of activeLayers) {
        this.webMap.addLayer({detail:layer});
      }
      this.webMap.setHillShadeInfo(config.datacatalog);
    }
  }

  mapCreated(config) {
    // map is created
    this.setMapFog();
    // Setup map controls and event handlers
    this.initializeDataGetter();
    this.setupMapControls();
    this.setupEventHandlers();
    this.setupDatacatalog(config);
  }

  setMapFog() {
    if (this.webMap.map.setFog) {
      this.webMap.map.setFog({
        "range": [0.8, 8],
        "color": "#ffffff",
        "horizon-blend": 0.2,
        "high-color": "#4faac6",
        "space-color": "#000000",
        "star-intensity": 0.15
      });
    }
  }
  
  createMap(config) {
    // Clean up existing map if present
    if (this.webMap.map?.version) {
      this.webMap.map.remove();
    }

    // Set center if provided
    if (config.map?.center) {
      [this.webMap.lon, this.webMap.lat] = config.map.center;
    }

    // Apply numeric properties
    ['zoom', 'pitch', 'bearing', 'maxPitch'].forEach(prop => {
      if (config.map?.hasOwnProperty(prop)) {
        this.webMap[prop] = config.map[prop];
      }
    });

    // Create new map instance
    this.webMap.map = new mapgl.Map({
      container: this.webMap.shadowRoot.querySelector('div'),
      style: this.webMap.getEmptyStyle(),
      center: [this.webMap.lon, this.webMap.lat],
      zoom: this.webMap.zoom,
      pitch: this.webMap.pitch,
      bearing: this.webMap.bearing,
      maxPitch: this.webMap.maxPitch
    });

    if (this.webMap.map.version === undefined) {
      this.webMap.map.version = 'mapblibregl';
    }

    this.webMap.map.libName = mapgl.libName;

    this.webMap.map.once('load', () => {
      this.mapCreated(config);
    });
    if (this.webMap.map.loaded()) {
      this.webMap.map.off('load', this.mapHasLoaded);
      this.mapCreated(config);
    }
  }
}