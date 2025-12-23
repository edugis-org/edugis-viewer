import {SphericalMercator} from '../lib/sphericalmercator.js';
import Flatbush from 'flatbush';
import lineUnion from '@edugis/lineunion';
import { featureFilter } from '@maplibre/maplibre-gl-style-spec';

// Maps GeoJSON geometry types to the numeric type used by MapLibre filters
// $type in MapLibre treats Multi* variants the same as their base types
const geometryTypeMap = {
  'Point': 1,
  'MultiPoint': 1,
  'LineString': 2,
  'MultiLineString': 2,
  'Polygon': 3,
  'MultiPolygon': 3
};

const featurePropertiesAreEqual = (feature1, feature2) => {
    for (const key in feature1.properties) {
      if (!key in feature2) {
        return false;
      }
      if (feature1.properties[key] !== feature2.properties[key]) {
        return false;
      }
    }
    for (const key in feature2.properties) {
      if (!key in feature1) {
        return false;
      }
    }
    return true;
}

export const getVisibleFeatures = async (map, layerid) => {
    if (!map || !map.version || !layerid) {
      return [];
    }
    const layer = map.getLayer(layerid);
    if (!layer) {
      return [];
    }
    const mapBounds = map.getBounds();
    if (!layer.sourceLayer) { // && layer.type !== 'circle' && layer.type !== 'symbol') {
      // not a vector tile layer 
      const layout = layer.serialize().layout;
      if (layout && layout.visibility && layout.visibility === 'none') {
        // layer not visible, so return empty feature set
        return [];
      }
      const source = map.getSource(layer.source).serialize();
      if (typeof source.data === "string") {
        const response = await fetch(source.data);
        if (response.ok) {
          source.data = await response.json();
        }
      }
      if (layer.filter) {
        const compiledFilter = featureFilter(layer.filter);
        const filteredFeatures = source.data.features.filter(feature => {
          // Wrap the feature with the numeric type for $type expression support
          const wrappedFeature = {
            type: geometryTypeMap[feature.geometry?.type] || 0,
            properties: feature.properties || {},
            id: feature.id,
            geometry: feature.geometry
          };
          return compiledFilter.filter(
              { zoom: map.getZoom() },
              wrappedFeature
          );
        });
        source.data.features = filteredFeatures;
      }
      const features = source.data.features.filter(feature=>{
        const bbox = turf.bbox(feature);
        return bbox[0] < mapBounds._ne.lng && bbox[2] > mapBounds._sw.lng && bbox[1] < mapBounds._ne.lat && bbox[3] > mapBounds._sw.lat;
      });
      return features;
    } else {
      const tileMap = new Map();
      const sphericalmercator = new SphericalMercator();
      const tileBorderFeatures = [];
      let features = map.queryRenderedFeatures(undefined,{layers:[layerid]}).map((mboxfeature, index)=>{
        const x = mboxfeature._vectorTileFeature._x;
        const y = mboxfeature._vectorTileFeature._y;
        const z = mboxfeature._vectorTileFeature._z;
        const xyz = `${x},${y},${z}`;
        let tileBBox = tileMap.get(xyz)
        if (!tileBBox) {
          tileBBox = sphericalmercator.bbox(x, y, z);
          tileMap.set(xyz, tileBBox);
        }
        const jsonFeature = mboxfeature.toJSON();
        const featureBBox = turf.bbox(jsonFeature);
        if ((featureBBox[0] < tileBBox[0] || featureBBox[2] > tileBBox[2] || featureBBox[1] < tileBBox[1] || featureBBox[3] > tileBBox[3])) {
          tileBorderFeatures.push({index:index, bbox: featureBBox});
        }
        return jsonFeature;
      });

      if (tileBorderFeatures.length) {
        const flatbushIndex = new Flatbush(tileBorderFeatures.length);
        for (const featureInfo of tileBorderFeatures) {
          const bbox = featureInfo.bbox;
          flatbushIndex.add(bbox[0], bbox[1], bbox[2], bbox[3]);
        }
        flatbushIndex.finish();
        const firstTileBBox = tileMap.entries().next().value[1];
        const tolerance = (firstTileBBox[2] - firstTileBBox[0]) / 5000;

        for (let i = 0; i < tileBorderFeatures.length; i++) {
          const featureIndex = tileBorderFeatures[i].index;
          let feature1 = features[featureIndex];
          if (feature1 === null) {
            continue;
          }
          const bbox = tileBorderFeatures[i].bbox;
          const intersectCandidates = flatbushIndex.search(bbox[0], bbox[1], bbox[2], bbox[3]);
          for (let j = 0; j < intersectCandidates.length; j++) {
            const feature2Index = tileBorderFeatures[intersectCandidates[j]].index;
            if (featureIndex !== feature2Index) {
              const feature2 = features[feature2Index];
              if (feature2 === null) {
                continue;
              }
              if (feature1 && feature2 && turf.booleanIntersects(feature1, feature2)) {
                if (featurePropertiesAreEqual(feature1, feature2)) {
                  if (feature1.geometry.type === "LineString" || feature1.geometry.type === "MultiLineString") {
                    feature1 = features[featureIndex] = lineUnion(feature1, feature2, tolerance);
                  } else {
                    feature1 = features[featureIndex] = turf.union(feature1, feature2);
                    // check if feature1.properties is empty
                    if (((obj)=>{for (const key in obj) return false; return true;})(feature1.properties)) {
                      feature1.properties = feature2.properties; // bug in turf.union?
                    }
                  }
                  features[tileBorderFeatures[intersectCandidates[j]].index] = null;
                  tileBorderFeatures[intersectCandidates[j]].index = featureIndex;
                }
              }
            }
          }
        }
        features=features.filter(feature=>feature !== null);
      }
      return features;
    }
  }

  export default getVisibleFeatures;