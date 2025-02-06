// Manager for the searchresult event from map-search.js

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

export class WebMapSearchResultManager {
  constructor(webMap) {
    this.webMap = webMap;
    this.loadingImages = new Set();
  }
  addMapIcon(iconUrl) {
    const name = iconUrl.split('/').pop().split('.').shift();
    if (this.webMap.map.hasImage(name)) {
      return name;
    }
    const baseUrl = 'https://nominatim.openstreetmap.org/';
    if (iconUrl.startsWith(baseUrl)) {
      // route through edugis to workaround openstreetmap CORS error
      iconUrl = 'https://tiles.edugis.nl/nominatim/' + iconUrl.slice(baseUrl.length);
    }
    if (!this.webMap.map.hasImage(name) && !this.loadingImages.has(name)) {
      this.loadingImages.add(name);
      if (iconUrl.endsWith('.svg')) { 
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            this.webMap.map.addImage(name, img);
            this.loadingImages.delete(name);
          }
          img.src = iconUrl;
      } else {
        this.webMap.map.loadImage(iconUrl, (error, image) => {
          if (error) {
            // todo
            this.loadingImages.delete(name);
          } else {
            this.webMap.map.addImage(name, image);
            this.loadingImages.delete(name);
          }
        })
      }
    }
    return name;
  }
  searchResult(event) {
    // add list of found elements to temporary map layer
    if (this.webMap.map.version) {
      const mapSearchSource = this.webMap.map.getSource('map-search-geojson');
      if (!mapSearchSource) {
        const style = this.webMap.map.getStyle();
        if (!style.glyphs || !style.sprite) {
          const newStyle = {...style};
          if (!style.glyphs) {
            // add glyphs for text rendering
            newStyle.glyphs = 'https://tiles.edugis.nl/glyphs/{fontstack}/{range}.pbf';
          }
          if (!style.sprite) {
            // add sprites for symbol rendering
            newStyle.sprite = 'https://openmaptiles.github.io/osm-bright-gl-style/sprite';
          }
          this.webMap.map.setStyle(newStyle, {diff: true});
        }
        this.webMap.map.addSource('map-search-geojson', searchSource);
        this.webMap.map.addLayer(searchSurface);
        this.webMap.map.addLayer(searchLines);
        this.webMap.map.addLayer(searchPoints);
      }
      if (event.detail?.features?.length) {
        const searchGeoJson = JSON.parse(JSON.stringify(event.detail));
        for (const feature of searchGeoJson.features) {
          if (feature.geometry.type === 'Point' || feature.geometry.type === 'MultiPoint') {
            if (feature.properties.icon) {
              feature.properties.icon = this.addMapIcon(feature.properties.icon);
            } else {
              feature.properties.icon = 'star_11';
            }
          }
        }
        this.webMap.map.getSource('map-search-geojson').setData(searchGeoJson);
      } else {
        searchGeoJson.features = [];
        this.webMap.map.removeLayer(searchPoints.id);
        this.webMap.map.removeLayer(searchLines.id);
        this.webMap.map.removeLayer(searchSurface.id);
        this.webMap.map.removeSource('map-search-geojson');
      }
    }
  }
  fitBounds(e)
  {
    this.webMap.map.fitBounds(e.detail.bbox, {maxZoom: 19});
  }
  searchLayerId(feature) {
    return `nominatim-${feature.properties.category}-${feature.properties.type ?? ''}-${feature.properties.osm_type}-${feature.properties.osm_id}`;
  }
  pointLayer(layerId, feature) {
    if (feature.properties.icon) {
      // convert URL to map icon
      feature.properties.icon = this.addMapIcon(feature.properties.icon);
    } else {
      feature.properties.icon = 'star_11';
    }
    return {
      "id": layerId,
      "metadata": {
        "title": feature.properties.name,
      },
      "type": "symbol",
      "source": {
        "type": "geojson",
        "data": {type:"FeatureCollection", features: [feature]},
        "attribution": "Nominatim"
      },
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
    }
  }
  lineLayer(layerId, feature) {
    return {
      "id": layerId,
      "metadata": {
        "title": feature.properties.name,
      },
      "type": "line",
      "source": {
        "type": "geojson",
        "data": {type:"FeatureCollection", features: [feature]},
        "attribution": "Nominatim"
      },
      "layout": {
        "line-join": "round",
        "line-cap": "round"
      },
      "paint": {
        "line-color": "#c30",
        "line-width": 3
      },
      "filter": ['==', '$type', 'LineString']
    };
  }
  polygonLayer(layerId, feature) {
    return {
      "id": layerId,
      "metadata": {
        "title": feature.properties.name,
      },
      "type": "fill",
      "source": {
        "type": "geojson",
        "data": {type:"FeatureCollection", features: [feature]},
        "attribution": "Nominatim"
      },
      "paint": {
        "fill-color": "#c30",
        "fill-opacity": 0.4
      },
      "filter": ['==', '$type', 'Polygon']
    };
  }
  persistSearchFeature(event) {
    // persist search feature as a map layer
    const {persist, feature} = event.detail;
    const layerId = this.searchLayerId(feature);
    const layer = this.webMap.map.getLayer(this.searchLayerId);
    if (layer && !persist) {
      this.webMap.map.removeLayer(layerId);
    } else if (!layer && persist) {
      switch (feature.geometry.type) {
        case 'Point':
        case 'MultiPoint':
          this.webMap.addLayer({detail:this.pointLayer(layerId, feature)});
          break;
        case 'LineString':
        case 'MultiLineString':
          this.webMap.addLayer({detail:this.lineLayer(layerId, feature)});
          break;
        case 'Polygon':
        case 'MultiPolygon':
          this.webMap.addLayer({detail:this.polygonLayer(layerId, feature)});
          break;
        default:
          console.log('unsupported geometry type', feature.geometry.type);
      }
    }
  }
}

export default WebMapSearchResultManager;
