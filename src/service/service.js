import { serviceGetWMSCapabilities } from "./service-wms.js";
import { serviceGetWMTSCapabilities } from "./service-wmts.js";
import { serviceGetXYZInfo } from "./service-xyz.js";
import { serviceGetGeoJSON } from "./service-geojson.js";
import { serviceGetWFSCapabilities } from "./service-wfs.js";

function validateURLSyntaxAndProtocol(url) {

  try {
    const test = new URL(url);
  } catch (error) {
    // fix missing protocol
    if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://') ) {
      url = `https://${url}`;
    }
  }

  try {
    const result = new URL(url); // Returns the URL object if valid
    if (result.protocol !== 'http:' && result.protocol !== 'https:') {
      throw new Error('Invalid protocol. Only HTTP and HTTPS are allowed.');
    }
    result.protocol = 'https:'; // Force HTTPS protocol
    return result;
  } catch (error) {

    
    throw new Error(`Invalid URL: ${error.message}`);
  }
}

export async function loadService(url) {
  const serviceInfo = {
    serviceURL: url,
    type: null,
    capabilities: null,
    error: null
  }
  try {
    const serviceUrl = validateURLSyntaxAndProtocol(url);
    serviceInfo.serviceURL = serviceUrl.href;

    // Check if this looks like a specific WFS GetFeature request for GeoJSON
    const decodedUrl = decodeURIComponent(serviceUrl.href).toLowerCase();
    const isSpecificWFSGetFeature = decodedUrl.includes('request=getfeature') &&
                                   (decodedUrl.includes('outputformat=application/json') ||
                                    decodedUrl.includes('outputformat=geojson') ||
                                    decodedUrl.includes('outputformat=json'));
    
    if (isSpecificWFSGetFeature) {
      // Try GeoJSON first for specific WFS GetFeature requests
      const geoJSONInfo = await serviceGetGeoJSON(serviceUrl.href);
      if (!geoJSONInfo.error) {
        return geoJSONInfo;
      }
    }
    
    // Try WFS first for general service discovery (before GeoJSON to show all available feature types)
    const wfsServiceInfo = await serviceGetWFSCapabilities(serviceUrl.href);
    if (!wfsServiceInfo.error) {
      return wfsServiceInfo;
    }
    
    // Try GeoJSON (for direct GeoJSON files or if WFS detection failed)
    const geoJSONInfo = await serviceGetGeoJSON(serviceUrl.href);
    if (!geoJSONInfo.error) {
      return geoJSONInfo;
    }
    
    // Try WMS
    const wmsServiceInfo = await serviceGetWMSCapabilities(serviceUrl.href);
    if (!wmsServiceInfo.error) {
      return wmsServiceInfo;
    }
    
    // Try WMTS
    const wmtsServiceInfo = await serviceGetWMTSCapabilities(serviceUrl.href);
    if (!wmtsServiceInfo.error) {
      return wmtsServiceInfo;
    }
    
    // Try XYZ (last resort)
    const xyzServiceInfo = await serviceGetXYZInfo(serviceUrl.href);
    if (!xyzServiceInfo.error) {
      return xyzServiceInfo;
    }
  } catch (error) {
    serviceInfo.error = `Error accessing service: ${error.message}`;
  }
  if (!serviceInfo.error) {
    serviceInfo.error = 'Unknown service type or error';
  }
  return serviceInfo;
}