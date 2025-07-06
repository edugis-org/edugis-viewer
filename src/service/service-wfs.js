// service-wfs.js
// Check if the service is a WFS service and return the capabilities document

import { parseWFSCapabilities } from './wfs-caps-parser';

function wfsCapabilitiesURL(url) {
  try {
    // Check if the URL is valid and accessible
    const urlObj = new URL(url);    
    // Remove possibly existing WFS parameters
    const capabilitiesParams = ['service', 'request', 'version', 'typename', 'typenames', 'featureid', 'bbox', 'filter', 'propertyname', 'sortby', 'startindex', 'count', 'outputformat', 'resulttype', 'storedquery_id'];
    const urlParams = new URLSearchParams(urlObj.search);
    const paramNames = Array.from(urlParams).map((param) => param[0]);
    
    for (const paramName of paramNames) {
      if (capabilitiesParams.includes(paramName.toLowerCase())) {
        if (paramName.toLowerCase() === 'service' && urlParams.get(paramName).toLowerCase() !== 'wfs') {
          return null; // not a WFS service
        }
      }
      urlParams.delete(paramName);
    }
    
    urlParams.set('service', 'WFS');
    urlParams.set('request', 'GetCapabilities');
    // WFS 2.0.0 is widely supported and provides better feature type information
    urlParams.set('version', '2.0.0');
    urlObj.search = urlParams.toString();
    return urlObj.href;
  } catch (error) {
    console.error(`Error creating WFS capabilities URL: ${error.message}`);
    return null;
  }
}

function cleanupWFSURL(url) {
  try {
    const urlObj = new URL(url);
    // Remove capabilities-specific parameters
    const capabilitiesParams = ['service', 'request', 'version'];
    const urlParams = new URLSearchParams(urlObj.search);
    const paramNames = Array.from(urlParams).map((param) => param[0]);

    for (const paramName of paramNames) {
      if (capabilitiesParams.includes(paramName.toLowerCase())) {
        urlParams.delete(paramName);
      }
    }
    urlObj.search = urlParams.toString();
    return urlObj.href;
  } catch (error) {
    return url;
  }
}

function createGeoJSONURL(baseURL, featureTypeName, version = '2.0.0') {
  try {
    const urlObj = new URL(baseURL);
    const urlParams = new URLSearchParams(urlObj.search);
    
    // Clear any existing parameters
    urlParams.forEach((value, key) => {
      urlParams.delete(key);
    });
    
    // Set WFS GetFeature parameters for GeoJSON output
    urlParams.set('service', 'WFS');
    urlParams.set('request', 'GetFeature');
    urlParams.set('version', version);
    urlParams.set('typeName', featureTypeName);
    urlParams.set('outputFormat', 'application/json');
    
    // Add SRSNAME for consistent coordinate system
    urlParams.set('srsName', 'EPSG:4326');
    
    urlObj.search = urlParams.toString();
    return urlObj.href;
  } catch (error) {
    console.error(`Error creating GeoJSON URL: ${error.message}`);
    return null;
  }
}

export async function serviceGetWFSCapabilities(url) {
  const result = {
    serviceURL: url,
    serviceTitle: null,
    type: null,
    capabilities: null,
    error: null
  };
  
  const capabilitiesURL = wfsCapabilitiesURL(url);
  if (!capabilitiesURL) {
    result.error = 'Invalid URL for WFS capabilities.';
    return result;
  }
  
  result.serviceURL = capabilitiesURL;
  
  try {
    const response = await fetch(capabilitiesURL, { method: 'GET' });
    if (!response.ok) {      
      result.error = `Service not reachable: ${response.statusText}`;
      return result;
    }
    
    // Check content type
    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('xml')) {
      result.error = `Invalid content type: ${contentType}`;
      return result;
    }
    
    // Check content length
    const contentLength = response.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength) > 5000000) {
      result.error = `Content too large: ${contentLength} bytes`;
      return result;
    }
    
    const capabilitiesXML = await response.text();
    const capabilities = parseWFSCapabilities(capabilitiesXML);
    
    if (!capabilities?.featureTypeList) {
      result.error = 'Invalid WFS capabilities document.';
      return result;
    }
    
    // Enhance capabilities with GeoJSON URLs for each feature type
    const baseURL = cleanupWFSURL(result.serviceURL);
    const version = capabilities.version || '2.0.0';
    
    
    result.type = 'WFS';
    result.capabilities = capabilities;
    result.serviceURL = baseURL;
    result.serviceTitle = capabilities?.serviceIdentification?.title || result.serviceURL;
    
    return result;
  } catch (error) {      
    result.error = `Error fetching WFS capabilities: ${error.message}`;
    return result;
  }
}