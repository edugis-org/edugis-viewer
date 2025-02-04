import rootUrl from '../utils/rooturl.js';

// Utility class for asynchronous loading of Map styles 
export class WebMapStyleLoader {
  constructor(webMap) {
    this.webMap = webMap;
    this.map = webMap.map;
  }

  addStyle(styleInfo, readyCallback) {
    let url = styleInfo.source;
    if (typeof url === 'string') {  
      if (url.split('/')[0].indexOf(':') === -1) {
        // relative url
        url = rootUrl + url;
      }
      if (url.indexOf('mapbox:') === 0) {
        url = url.replace('mapbox://styles/mapbox/', 'https://api.mapbox.com/styles/v1/mapbox/') + `?access_token=${APIkeys.mapbox}`;
      }
      fetch(url).then(data=>data.json()).then(styleObject=>{
        styleInfo.source = styleObject;
        this._addStyleObject(styleInfo, readyCallback);
      });
    } else {
      this._addStyleObject(styleInfo, readyCallback);
    }
  }

  _storeThematicLayers() {
    this.storedThematicLayers = this.map.getStyle()?.layers.filter(layer=>{
      if (!layer.metadata || layer.metadata.reference) {
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
    });
    if (this.storedThematicLayers === undefined) {
      this.storedThematicLayers = [];
    }
  }

  _restoreThematicLayers()
  {
    if (this.storedThematicLayers) {
      this.storedThematicLayers.forEach(layer=>{
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
        this.webMap.addLayer({detail:layer});
      });
      this.storedThematicLayers = null;
    }
  }

  _setReferenceLayerMetadata(styleInfo, styleId, styleTitle) {
    for (const mapLayer of styleInfo.source.layers) { 
      mapLayer.metadata = mapLayer.metadata || {};     
      mapLayer.metadata.reference = true;      
      mapLayer.metadata.styleid = styleId;
      mapLayer.metadata.styletitle = styleTitle;
    }
  }

  _applyStyle(style, styleId, styleTitle, readyCallback) {
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
      this.webMap.addLayer({detail:layer});
    });
    if (readyCallback) {
      readyCallback();
    }
  }
  _setApiKeys(url) {
    if (url.indexOf('{') >= 0) {
      for (const key in APIkeys) {
        const keyTemplate = `{${key}key}`;
        if (url.indexOf(keyTemplate) !== -1) {
          url = url.replace(keyTemplate, APIkeys[key]);
          break;
        }
      }
    }
    return url;
  }
  _loadStyle(url, styleId, styleTitle, readyCallback) {
    if (typeof url === 'object') {
      // no need to dereference url
      return this._applyStyle(url, styleId, styleTitle, readyCallback);
    }
    if (url.split('/')[0].indexOf(':') === -1) {
      // relative url
      url = rootUrl + url;
    } 
    if (url.indexOf('mapbox:') === 0) {
      url = url.replace('mapbox://styles/mapbox/', 'https://api.mapbox.com/styles/v1/mapbox/') + `?access_token=${APIkeys.mapbox}`;
    }
    url = this._setApiKeys(url);
    fetch(url).then(data=>data.json()).then(style=>{
      this._applyStyle(style, styleId, styleTitle, readyCallback);
    });
  }
  
  _setApiStyleKeys(styleInfo) {
    if (styleInfo.source.glyphs) {
      styleInfo.source.glyphs = this._setApiKeys(styleInfo.source.glyphs);
    }
    if (styleInfo.source.sprite) {
      styleInfo.source.sprite = this._setApiKeys(styleInfo.source.sprite);
    }
    for (const source in styleInfo.source.sources) {
      if (styleInfo.source.sources[source].url) {
        styleInfo.source.sources[source].url = this._setApiKeys(styleInfo.source.sources[source].url);
      }
    }
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

  _addStyleObject(styleInfo, readyCallback) {
      const styleId = styleInfo.id;
      const styleTitle = styleInfo.metadata?.title || styleInfo.name || styleId || "style title not defined";  
      if (styleInfo.metadata?.reference) {
        // This is a background style. A map can have only one background style. 
        // This requires replacing the current style, using map.setStyle()
        // Therefore we need to store the current thematic layers, and add them back after the new style is loaded.
        
        /* store thematic layers */
        this._storeThematicLayers();

        /* set handler for style.load event */
        this.map.once("style.load", ()=>{
          this._restoreThematicLayers();
          this.setMapFog();
          readyCallback();
        });

        /* add reference metadata to new layers set by setStyle() */
        this._setReferenceLayerMetadata(styleInfo, styleId, styleTitle);

        /* set API keys for style if necessary */
        this._setApiStyleKeys(styleInfo);

        if (!styleInfo.source.glyphs) {
          styleInfo.source.glyphs = 'https://tiles.edugis.nl/glyphs/{fontstack}/{range}.pbf';
        }
        if (!styleInfo.source.sprite) {
          styleInfo.source.sprite = 'https://openmaptiles.github.io/osm-bright-gl-style/sprite';
        }
      
        // add {diff: false} to force new style.load event
        this.map.setStyle(styleInfo.source, {diff: false});
      } else {
        /* add style to existing layers */
        this._loadStyle(styleInfo.source, styleId, styleTitle, readyCallback);
      }
    }
}