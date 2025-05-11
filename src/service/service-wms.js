// check if the service is a WMS service
// and return the capabilities document

import { parseWMSCapabilities } from './wms-caps-parser';


function wmsCapbilitiesURL(url) {
  try {
    // Check if the URL is valid and accessible
    const urlObj = new URL(url);    
    // remove possibly existing WMS parameters 'service', 'request', 'version' etc
    const capabilitiesParams = ['service', 'request', 'version', 'bbox', 'width', 'height', 'srs', 'crs', 'format', 'layers', 'styles', 'transparent'];
    const urlParams = new URLSearchParams(urlObj.search);
    const paramNames = Array.from(urlParams).map((param) => param[0]);
    for (const paramName of paramNames) {
      if (capabilitiesParams.includes(paramName.toLowerCase())) {
        if (paramName.toLowerCase() === 'service' && urlParams.get(paramName).toLowerCase() !== 'wms') {
          return null; // not a WMS service
        }
      }
      urlParams.delete(paramName);
    }
    urlParams.set('service', 'WMS');
    urlParams.set('request', 'GetCapabilities');
    urlObj.search = urlParams.toString();
    return urlObj.href;
  } catch (error) {
    console.error(`Error creating WMS capabilities URL: ${error.message}`);
    return null;
  }
}


function cleanupWMSURL(url) {
  try {
    const urlObj = new URL(url);
    // remove possibly existing parameters 'service', 'request' and 'version'
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


export async function serviceGetWMSCapabilities(url) {
  const result = {
    serviceURL: url,
    serviceTitle: null,
    type: null,
    capabilities: null,
    error: null
  }
  url = wmsCapbilitiesURL(url);
  if (url) {
    result.serviceURL = url;
    try {
      let response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        result.error = `Service not reachable: ${response.statusText}`;
        return result;
      }
      // Check content type and possibly content-length
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('xml')) {
        result.error = `Invalid content type: ${contentType}`;
        return result;
      }
      const contentLength = response.headers.get('Content-Length');
      if (contentLength && parseInt(contentLength) > 5000000) {
        result.error = `Content too large: ${contentLength} bytes`;
        return result;
      }
      response = await fetch(url, { method: 'GET' });
      const capabilitiesXML = await response.text();
      const capabilities = parseWMSCapabilities(capabilitiesXML);
      result.type = 'WMS';
      result.capabilities = capabilities;
      result.serviceURL = cleanupWMSURL(result.serviceURL);
      result.serviceTitle = capabilities?.service?.title || result.serviceURL;
      return result;
    } catch (error) {      
      result.error = `Error fetching WMS capabilities: ${error.message}`;
    }
  } else {
    result.error = 'Invalid URL for WMS capabilities.';
  }
  return result;
}