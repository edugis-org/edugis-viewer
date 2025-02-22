import {wmsUrl} from './wmsurl';
import {coordProject} from '@edugis/proj-convert';

function uuid4() {
    // from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    // Public Domain/MIT
    let d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){

        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
}

function convertToArray(layerlist) {
    if (!layerlist) {
        return [];
    }
    if (Array.isArray(layerlist)){
        return layerlist;
    }
    return layerlist.split(',').map(layer=>layer.trim());
}

function allowedLayer(Layer, deniedlayers, allowedlayers) {
    if (!Layer.Name || Layer.Name === '') {
      return true;
    }
    if (deniedlayers.length) {
      if (deniedlayers.find(layer=>layer === Layer.Name)) {
        return false;
      }
    }
    if (allowedlayers.length) {
      return (allowedlayers.find(layer=>layer === Layer.Name));
    }
    return true;
}

function scaleHintToZoomLevel(hint, scaleHintType)
  {
    let level = 0;
    let calc = 110692.6408;
    if (scaleHintType === 'paper') {
      calc = 500000000;
    }
    for (; level < 22; level++, calc /= 2.0) {
      if (hint > calc) {
        return level;
      }
    }
    return level;
}

function preferredFeatureInfoFormat(formats) {
  if (formats.includes('application/json')) {
    return 'application/json';
  }
  if (formats.includes('application/vnd.ogc.gml')) {
    return 'application/vnd.ogc.gml';
  }
  if (formats.includes('application/xml')) {
    return 'application/xml';
  }
  if (formats.includes('text/plain')) {
    return 'text/plain';
  }
  // not supported
  return '';
}

function layerGroup(Layer) {
  return {
    "type" : "group",
    "title": Layer.Title,
    "id": uuid4(),
    "sublayers" :[]
  }
}

function layerToNode(Layer, Request, scaleHintType) {
    let onlineResource = new URL(Request.GetMap.DCPType[0].HTTP.Get.OnlineResource);
    // upgrade to https (cannot load from http)
    if (onlineResource.protocol === 'http:') {
      onlineResource.protocol = 'https:';
      onlineResource.port = 443;
    }
    onlineResource = onlineResource.toString();
    let featureInfoResource;
    if (Request.GetFeatureInfo && Request.GetFeatureInfo.DCPType && Request.GetFeatureInfo.DCPType.length) {
      featureInfoResource = new URL(Request.GetFeatureInfo.DCPType[0].HTTP.Get.OnlineResource);
    } else {
      featureInfoResource = onlineResource;
    }
    if (featureInfoResource.protocol === 'http:') {
      featureInfoResource.protocol = 'https:';
      featureInfoResource.port = 443;
    }
    let legendurl = undefined;
    if (Layer.Style && Layer.Style.length && Layer.Style[0].LegendURL && Layer.Style[0].LegendURL.length) {
      legendurl = Layer.Style[0].LegendURL[0].OnlineResource;
    }
    const node = { "title": Layer.Title, "id": uuid4(), "type":"wmsfromcaps", "layerInfo": {
      "id" : uuid4(),
      "type" : "raster",
      "metadata" : {
          "title" : Layer.Title,
          "legendurl": legendurl,
          "abstract": Layer.Abstract ? Layer.Abstract : ""
      },
      "source" : {
          "type": "raster",
          "tileSize" : 256,
          "tiles": [
              onlineResource + "service=WMS&version=1.1.1&request=GetMap&layers=" + encodeURIComponent(Layer.Name) + "&SRS=EPSG:3857&transparent=true&format=image/png&BBOX={bbox-epsg-3857}&width=256&height=256&styles=" // + encodeURIComponent(Layer.Style[0].Name)
          ],
          "attribution": Layer.Attribution && Layer.Attribution.Title ? Layer.Attribution.Title: ""
          }
      }
    }
    if (legendurl === undefined) {
      const url = wmsUrl(onlineResource + "layers=" + encodeURIComponent(Layer.Name), 'getlegendgraphic');
      node.layerInfo.metadata.legendurl = url;
      node.layerInfo.metadata.legendguessed = true;
    }
    if (Layer.queryable) {
      const getFeatureInfoFormat = Request && Request.GetFeatureInfo && Request.GetFeatureInfo.Format && Request.GetFeatureInfo.Format.length ? preferredFeatureInfoFormat(Request.GetFeatureInfo.Format): '';
      if (getFeatureInfoFormat != '') {
        node.layerInfo.metadata.getFeatureInfoUrl = featureInfoResource + "service=WMS&version=1.1.1&request=GetFeatureInfo&layers=" + encodeURIComponent(Layer.Name) + "&query_layers=" + encodeURIComponent(Layer.Name)
        node.layerInfo.metadata.getFeatureInfoFormat = getFeatureInfoFormat;
      }
    }
    if (Layer.ScaleHint) {
      if (Layer.ScaleHint.max) {
        node.layerInfo.minzoom = scaleHintToZoomLevel(Layer.ScaleHint.max, scaleHintType);
        node.layerInfo.source.minzoom = node.layerInfo.minzoom;
      }
      if (Layer.ScaleHint.min) {
        node.layerInfo.maxzoom = scaleHintToZoomLevel(Layer.ScaleHint.min, scaleHintType);
        node.layerInfo.source.maxzoom = node.layerInfo.maxzoom;
      }
    }
    if (Layer.EX_GeographicBoundingBox) {
      node.layerInfo.source.bounds = Layer.EX_GeographicBoundingBox;      
    } else if (Layer.LatLonBoundingBox) {
      node.layerInfo.source.bounds = Layer.LatLonBoundingBox;
    } else if (Layer.BoundingBox) {
      const bbox4326 = Layer.BoundingBox.find(bbox=>bbox.crs==='EPSG:4326');
      if (bbox4326) {
        node.layerInfo.source.bounds = bbox4326.extent;
      } else {
        for (const bbox of Layer.BoundingBox) {
          const ll = coordProject([bbox.extent[0], bbox.extent[1]], bbox.crs, 'EPSG:4326');
          const tr = coordProject([bbox.extent[2],bbox.extent[3]], bbox.crs, 'EPSG:4326');
          if (ll && tr) {
            node.layerInfo.source.bounds = [...ll, ...tr];
            break;
          }
        }
      }
    } 
    return node;
}

function addNodesFromLayer(Layer, Request, scaleHintType, deniedlayers, allowedlayers, depth = 0) {
  if (!Array.isArray(Layer)) {
    Layer = [Layer];
  }
  let result = [];
  Layer.forEach(layer=>{
    if (layer.Name && layer.Name !== '') {
      if (allowedLayer(layer, deniedlayers, allowedlayers)) {
        if (!layer.Layer?.length) { // only add leaf nodes
          result.push(layerToNode(layer, Request, scaleHintType))
        }
      }
    }
    if (layer.Layer && allowedLayer(layer.Layer, deniedlayers, allowedlayers)) {
      // layer has sublayers
      const sublayers = addNodesFromLayer(layer.Layer, Request, scaleHintType, deniedlayers, allowedlayers, depth + 1);
      if (depth === 0) {
        result = sublayers;
      } else {
        if (sublayers.length > 0) {
          const node = layerGroup(layer);
          node.sublayers = sublayers;
          result.push(node);
        } else {
          // no sublayers (unnamed or denied or not allowed), show group as layer
          if (layer.Name && layer.Name !== '') {
            result.push(layerToNode(layer, Request, scaleHintType));
          }
        }
      }
    }
  })
  return result;
}

function capabilitiesToCatalogNodes(xml, deniedlayers, allowedlayers, scaleHintType) {
    const parser = new WMSCapabilities();
    const json = parser.parse(xml);
    
    if (!json.Capability) {
      // no capabilities
      return [];
    }
    deniedlayers = convertToArray(deniedlayers);
    allowedlayers = convertToArray(allowedlayers);
    const result = addNodesFromLayer(json.Capability.Layer, json.Capability.Request, scaleHintType, deniedlayers, allowedlayers)
    return result;
}

function removeEmptyGroups(nodes) {
  let result = [];
  if (nodes.length == 0) {
    return result;
  }
  for (let node of nodes) {
    if (node.type === "group") {
      node.sublayers = removeEmptyGroups(node.sublayers);
      if (node.sublayers.length > 0) {
        result.push(node);
      }
    } else {
      result.push(node);
    }
  }
  return result;
}

export function getCapabilitiesNodes(node) {
    const url = wmsUrl(node.url, 'getcapabilities');
    const scaleHintType = node.scalehinttype === 'paper' ? 'paper' : 'resolution';
    return fetch(url).then(response=>{
        if (!response.ok) {
          throw Error(`${node.id}: req rejected with status ${response.status} ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (contentType) {
          if (contentType.startsWith('application/vnd.ogc.wms_xml') || contentType.startsWith('text/xml') || contentType.startsWith('application/xml')) {
            // caps 1.1.1 or caps 1.3.0
            return response.text().then(xml=>{
              let nodes = capabilitiesToCatalogNodes(xml, node.deniedlayers, node.allowedlayers, scaleHintType);
              nodes = removeEmptyGroups(nodes);
              if (nodes.length == 0) {
                nodes.push({"title": `${nodeId}: 0 layers or failed`});
              }
              return nodes;
            });
          } else {
              throw Error(`Getcapabilities: unexpected content-type: ${contentType}`);
          }
        } else {
            throw Error('content-type not set in getcapabilities response');
        }
    });
}

export function copyMetadataToCapsNodes(sourceLayerInfo, capsNodes) {
  capsNodes.forEach(node=>{
    if (node.layerInfo) {
      if (!node.layerInfo.metadata) {
        node.layerInfo.metadata = {};
      }
      if (sourceLayerInfo.tilecacheurl) {
        node.layerInfo.metadata.tilecacheurl = sourceLayerInfo.tilecacheurl;
      }
    }
    if (node.sublayers) {
      copyMetadataToCapsNodes(sourceLayerInfo, node.sublayers);
    } 
  });
}