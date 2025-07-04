import {geoJSONProject} from '@edugis/proj-convert'

class Feature {
  constructor(typeName) {
    this.type = "Feature";
    this.properties = {};
    this.geometry = {
      "type": typeName,
      "coordinates": []
    }
  }
}

export class GeoJSON {
  static _isXY(list) {
    return list.length >= 2 &&
      typeof list[0] === 'number' &&
      typeof list[1] === 'number';
  }

  static _traverseCoords(coordinates, callback) {
    if (GeoJSON._isXY(coordinates)) return callback(coordinates);
    return coordinates.map(function(coord){return GeoJSON._traverseCoords(coord, callback);});
  }

  // Simplistic shallow clone that will work for a normal GeoJSON object.
  static _clone(obj) {
    if (null == obj || 'object' !== typeof obj) return obj;
    var copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
  }
  
  static _traverseGeoJson(geometryCb, nodeCb, geojson) {
    if (geojson == null) return geojson;
  
    var r = GeoJSON._clone(geojson);
    var self = GeoJSON._traverseGeoJson.bind(this, geometryCb, nodeCb);
  
    switch (geojson.type) {
    case 'Feature':
      r.geometry = self(geojson.geometry);
      break;
    case 'FeatureCollection':
      r.features = r.features.map(self);
      break;
    case 'GeometryCollection':
      r.geometries = r.geometries.map(self);
      break;
    default:
      geometryCb(r);
      break;
    }
  
    if (nodeCb) nodeCb(r);
  
    return r;
  }

  static _detectCrs(geojson, projs) {
    var crsInfo = geojson.crs,
        crs;
  
    if (crsInfo === undefined) {
      throw new Error('Unable to detect CRS, GeoJSON has no "crs" property.');
    }
  
    if (crsInfo.type === 'name') {
      crs = projs[crsInfo.properties.name];
    } else if (crsInfo.type === 'EPSG') {
      crs = projs['EPSG:' + crsInfo.properties.code];
    }
  
    if (!crs) {
      throw new Error('CRS defined in crs section could not be identified: ' + JSON.stringify(crsInfo));
    }
  
    return crs;
  }

  static getBoundingBox(geojson) {
    var min = [Number.MAX_VALUE, Number.MAX_VALUE],
        max = [-Number.MAX_VALUE, -Number.MAX_VALUE];
    GeoJSON._traverseGeoJson(function(_gj) {
      GeoJSON._traverseCoords(_gj.coordinates, function(xy) {
        min[0] = Math.min(min[0], xy[0]);
        min[1] = Math.min(min[1], xy[1]);
        max[0] = Math.max(max[0], xy[0]);
        max[1] = Math.max(max[1], xy[1]);
      });
    }, null, geojson);
    return [min[0], min[1], max[0], max[1]];
  }

  static _project(geojson, from, to, projs) {
    return geoJSONProject(geojson, from, to);
  }

  /*
  _reverse(geojson) {
    return this._traverseGeoJson(function(gj) {
      gj.coordinates = traverseCoords(gj.coordinates, function(xy) {
        return [ xy[1], xy[0] ];
      });
    }, null, geojson);
  }
  */
  
  static _toWgs84(geojson, from, projs) {
    return GeoJSON._project(geojson, from, 'EPSG:4326', projs);
  }
  
  static convertTopoJsonLayer(layerInfo) {
    return fetch(layerInfo.source.data).then(data=> {
      return data.json().then(json=>{
        // replace url with topojson first object converted to geojson
        layerInfo.metadata.originaldata = layerInfo.source.data;
        layerInfo.source.data = topojson.feature(json, json.objects[Object.keys(json.objects)[0]]);
        return layerInfo;        
      })
    }).catch(reason=>console.log(reason));
  }

  static loadGeoJsonToMemory(layerInfo) {
    if (typeof layerInfo.source.data === "string") {
      return fetch(layerInfo.source.data)
        .then(data=>data.json())
        .then(json=>{
          layerInfo.metadata.originaldata = layerInfo.source.data;
          if (json.type === "Topology") {
            // convert to geojson
            json = topojson.feature(json, json.objects[Object.keys(json.objects)[0]]);
          }
          layerInfo.source.data = json;
          return layerInfo;
        });     
    }    
  }

  static convertProjectedGeoJsonLayer(layerInfo) {
    const crs = layerInfo.metadata.crs;
    if (typeof layerInfo.data == 'object') {
      return new Promise((resolve, reject)=>{
        if (!layerInfo.metadata.originaldata) {
          layerInfo.metadata.originaldata = layerinfo.source.data;
          layerInfo.source.data = GeoJSON._toWgs84(layerInfo.source.data, "EPSG:3857");
        }
        resolve();
      })
    } else {
      return fetch(layerInfo.source.data).then(data=>data.json()).then(json=>{
        layerInfo.metadata.originaldata = layerInfo.source.data;
        layerInfo.source.data = GeoJSON._toWgs84(json, "EPSG:3857");
        return layerInfo;
      })
    }
  }

  static _uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static cleanupStyle(style) {
    if (style.metadata) {
      let metadata = style.metadata;
      if (metadata.inEditMode) {
        delete metadata.visible;
        delete metadata.inEditMode;
      }
    }
  }

  // returns a point-layer, line-layer, fill-layer if point, line, polygon features exist
  static createLayers(geojson, filename) {
    const result = [];
    if (geojson.type === "Feature") {
      // convert to FeatureCollection
      geojson.type = "FeatureCollection";
      geojson.features = [{
        "type": "Feature",
        "geometry": Object.assign({}, geojson.geometry),
        "properties": Object.assign({}, geojson.properties)
      }];
      delete geojson.geometry;
      delete geojson.properties;
    }
    if (geojson.features && geojson.features.length) {
      const fillFeatures = geojson.features.filter(feature=>feature.geometry && (feature.geometry.type==='Polygon'||feature.geometry.type==='MultiPolygon'));
      const lineFeatures = geojson.features.filter(feature=>feature.geometry && (feature.geometry.type==='LineString'||feature.geometry.type==='MultiLineString'));
      const pointFeatures = geojson.features.filter(feature=>feature.geometry && (feature.geometry.type==='Point'||feature.geometry.type==='MultiPoint'));
      if (fillFeatures.length) {
        if (geojson.style && (geojson.style.type === 'line' || geojson.style.type === 'fill' || geojson.style.type === 'fill-extrusion')) {
          // style part of geojson, this is an EduGIS specific geojson
          const style = geojson.style;
          const attribution = style.source?style.source.attribution?style.source.attribution:undefined:undefined;
          delete geojson.style;
          style.id = GeoJSON._uuidv4();
          style.source = {
            "type":"geojson",
            "data": {"type": "FeatureCollection", "features": fillFeatures}
          }
          if (attribution) {
            style.source.attribution = attribution;
          }
          GeoJSON.cleanupStyle(style);
          result.push(style);
        } else {
          result.push( 
            {
                "metadata": {"title": `${filename} fill`},
                "id": GeoJSON._uuidv4(),
                "type":"fill",
                "source":{
                  "type":"geojson",
                  "data": {"type": "FeatureCollection", "features": fillFeatures}
                },
                "paint":{
                  "fill-color":"#ccc",
                  "fill-opacity":0.6,
                  "fill-outline-color":"#444"
                }
            });
        }
      }
      if (lineFeatures.length) {
        if (geojson.style && geojson.style.type === 'line') {
          // style part of geojson, this is an EduGIS specific geojson
          const style = geojson.style;
          const attribution = style.source?style.source.attribution?style.source.attribution:undefined:undefined;
          delete geojson.style;
          style.id = GeoJSON._uuidv4();
          style.source = {
            "type":"geojson",
            "data": {"type": "FeatureCollection", "features": lineFeatures}
          }
          if (attribution){
            style.source.attribution = attribution;
          }
          result.push(style);
        } else {
          result.push(
            {
              "metadata": {"title": `${filename} line`},
              "id": GeoJSON._uuidv4(),
              "type":"line",
              "source":{
                "type":"geojson",
                "data": {"type": "FeatureCollection", "features": lineFeatures}
              },
              "paint":{
                "line-color":"#000",
                "line-width": 2
              }
            });
        }
      }
      if (pointFeatures.length) {
        if (geojson.style && (geojson.style.type === 'circle' || geojson.style.type === 'symbol')) {
          // style part of geojson, this is an EduGIS specific geojson
          const style = geojson.style;
          const attribution = style.source?style.source.attribution?style.source.attribution:undefined:undefined;
          delete geojson.style;
          style.id = GeoJSON._uuidv4();
          style.source = {
            "type":"geojson",
            "data": {"type": "FeatureCollection", "features": pointFeatures}
          }
          if (attribution) {
            style.source.attribution = attribution;
          }
          result.push(style);
        } else {
          result.push(
            {
                "metadata": {"title": `${filename} point`},
                "id": GeoJSON._uuidv4(),
                "type":"circle",
                "source":{
                  "type":"geojson",
                  "data": {"type": "FeatureCollection", "features": pointFeatures}
                },
                "paint":{
                  "circle-color":"#FA0",
                  "circle-radius": 10,
                  "circle-stroke-width": 1,
                  "circle-stroke-color": "#FFF"
                }
            }
          );
        }
      }
    }
    return result;
  }
  static Feature(typeName) {
    return new Feature(typeName);
  }
}
