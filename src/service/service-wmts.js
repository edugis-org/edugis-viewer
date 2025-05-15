// check if the service is a WMS service
// and return the capabilities document

import { parseWMTSCapabilities } from './wmts-caps-parser';

function inferWMTSBaseUrl(tileUrl, withStyle) {
  try {
    const url = new URL(tileUrl);
    const pathname = url.pathname;
    
    // Identify the numeric segments (z/x/y) that indicate tile coordinates
    const segments = pathname.split('/').filter(s => s.length > 0);
    
    // Find the position of the first numeric segment (usually the z/tileMatrix value)
    let numericStartIndex = -1;
    
    // Look for consecutive numeric segments (at least 3 for z/x/y)
    for (let i = 0; i < segments.length - 2; i++) {
      if (/^\d+$/.test(segments[i]) && 
          /^\d+$/.test(segments[i+1]) && 
          /^\d+\.[a-zA-Z0-9]+$/.test(segments[i+2])) {
        numericStartIndex = i;
        break;
      }
      
      if (/^\d+$/.test(segments[i]) && 
          /^\d+$/.test(segments[i+1]) && 
          /^\d+$/.test(segments[i+2])) {
        numericStartIndex = i;
        break;
      }
    }
    
    // If we found a pattern, assume everything before it is the base URL
    if (numericStartIndex > 0) {
      // In WMTS RESTful pattern, we assume:
      // .../layer/style/tileMatrixSet/tileMatrix/tileRow/tileCol.format
      // .../layer/tileMatrixSet/tileMatrix/tileRow/tileCol.format
      // So skip 2 (no style) or 3 (style) segments back from the numeric part for layer/style/tileMatrixSet
      const baseUrlEndIndex = Math.max(0, numericStartIndex - (withStyle ? 3 : 2));
      
      // Reconstruct the base URL
      const baseSegments = segments.slice(0, baseUrlEndIndex);
      const basePathname = '/' + baseSegments.join('/');
      
      url.pathname = basePathname;
      return url.href;
    } else {
      return url.href;
    }
  } catch (e) {
    return null;
  }
}

function wmtsCapbilitiesURL(url, withStyle = false) {
  // the given WMTS url can either be:
  // the base URL of the service (e.g. https://example.com/wmts/v2.0)
  // or a KVP request (e.g. https://example.com/wmts/v2.0?service=WMTS&request=GetCapabilities)
  // or a specific REST Capabilities request (e.g. https://example.com/wmts/v2.0/1.0.0/WMTSCapabilities.xml)
  // or a WMTS REST tile request (e.g. https://example.com/wmts/v2.0/layer/EPSG:3857/1/2/3.png)
  // or a WMTS REST tile template request (e.g. https://example.com/wmts/v2.0/layer/EPSG:3857/{z}/{x}/{y}.png)
  // or a WMTS REST tile template capabilities request (e.g. https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/standaard/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png
  try {
    // Check if the URL is valid and accessible
    const urlObj = new URL(url);
    // check if the URL is a REST Capabilities request
    if (urlObj.pathname.endsWith('WMTSCapabilities.xml')) {
      // a REST Capabilities request
      return urlObj.href;
    }
    if (urlObj.searchParams.has('service') && 
        urlObj.searchParams.get('service').toLowerCase() === 'wmts') {
          // a KVP request url
          urlObj.search = '';
          urlObj.searchParams.set('service', 'WMTS');
          urlObj.searchParams.set('request', 'GetCapabilities');
          return urlObj.href;
    }
    const baseWmtsUrl = inferWMTSBaseUrl(urlObj.href, withStyle);
    if (baseWmtsUrl === null) {
      return null; // not a valid WMTS base URL
    }
    const baseUrlObj = new URL(baseWmtsUrl);
    // default to REST capabilities
    baseUrlObj.pathname = baseUrlObj.pathname.replace(/\/$/, '') + '/WMTSCapabilities.xml';
    return baseUrlObj.href;    
  } catch (error) {
    console.error(`Error creating WMTS capabilities URL: ${error.message}`);
    return null;
  }
}


function cleanupWMTSURL(url) {
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

function baseURLFromCapabilitiesURL(url) {
  try {
    const urlObj = new URL(url);
    // url is either KVP or REST
    // check if URL is REST capabilities URL
    if (urlObj.pathname.endsWith('WMTSCapabilities.xml')) {
      // remove the capabilities part
      
      urlObj.pathname = urlObj.pathname.replace(/\/WMTSCapabilities\.xml$/, '');
      if (urlObj.pathname.endsWith('/1.0.0')) {
        urlObj.pathname = urlObj.pathname.replace(/\/1\.0\.0$/, '');
      }
      return urlObj.href;
    }
    urlObj.search = '';
    return urlObj.href;
  } catch (error) {
    console.error(`Error creating base URL from capabilities URL: ${error.message}`);
    return url;
  }
}

export async function serviceGetWMTSCapabilities(url) {
  const result = {
    serviceURL: url,
    serviceTitle: null,
    type: null,
    capabilities: null,
    error: null
  }
  for (const withStyle of [false, true]) {
    url = wmtsCapbilitiesURL(url, withStyle);
    if (url) {
      result.serviceURL = url;
      try {
        let response = await fetch(url, { method: 'HEAD' });
        if (!response.ok && response.status === 405) {            
            response = await fetch(url, { method: 'GET' });
        }
        if (!response.ok) {
          result.error = `Service not reachable: ${response.statusText}`;
          if (withStyle) {
            return result;
          } else {
            continue;
          }
        }
        // Check content type and possibly content-length
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('xml')) {
          result.error = `Invalid content type: ${contentType}`;
          if (withStyle) {
            return result;
          } else {
            continue;
          }
        }
        const contentLength = response.headers.get('Content-Length');
        if (contentLength && parseInt(contentLength) > 5000000) {
          result.error = `Content too large: ${contentLength} bytes`;
          return result;
        }
        response = await fetch(url, { method: 'GET' });
        const capabilitiesXML = await response.text();
        const capabilities = parseWMTSCapabilities(capabilitiesXML);
        result.type = 'WMTS';
        result.capabilities = capabilities;
        result.serviceURL = baseURLFromCapabilitiesURL(result.serviceURL);
        result.serviceTitle = capabilities?.serviceIdentification?.title || result.serviceURL;
        return result;
      } catch (error) {      
        result.error = `Error fetching WMTS capabilities: ${error.message}`;
      }
    } else {
      result.error = 'Invalid URL for WMTS capabilities.';
    }
  }
  return result;
}