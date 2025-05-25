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

function wmtsCapbilitiesURL(url, withStyle = false, withVersion = false) {
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
    // iterate urlObj.searchParams
    for (const [key, value] of urlObj.searchParams) {
      if (key.toLowerCase() === 'service' && value.toLowerCase() === 'wmts' ||
        key.toLowerCase() === 'request' && value.toLowerCase() === 'getcapabilities') {    
        // a KVP request url
        const removeParams = ['service', 'request', 'version'];
        const searchParams = Array.from(urlObj.searchParams.keys());
        for (const paramName of searchParams) {
          if (removeParams.includes(paramName.toLowerCase())) {
            urlObj.searchParams.delete(paramName);
          }
        }
        urlObj.searchParams.set('service', 'WMTS');
        urlObj.searchParams.set('request', 'GetCapabilities');
        return urlObj.href;
      }
    }
    const baseWmtsUrl = inferWMTSBaseUrl(urlObj.href, withStyle);
    if (baseWmtsUrl === null) {
      return null; // not a valid WMTS base URL
    }
    const baseUrlObj = new URL(baseWmtsUrl);
    // default to REST capabilities
    baseUrlObj.pathname = baseUrlObj.pathname.replace(/\/$/, '') + `${withVersion? '/1.0.0' : ''}` + '/WMTSCapabilities.xml';
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
    const removeParams = ['service', 'request', 'version', 'tilerow', 'tilecol', 'tilematrix', 'tilematrixset', 'style', 'format', 'layer'];
    const searchParams = Array.from(urlObj.searchParams.keys());
    for (const paramName of searchParams) {
      if (removeParams.includes(paramName.toLowerCase())) {
        urlObj.searchParams.delete(paramName);
      }
    }
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
  for (const withVersion of [false, true]) {
    for (const withStyle of [false, true]) {
      const testUrl = wmtsCapbilitiesURL(url, withStyle, withVersion);
      if (testUrl) {
        result.serviceURL = testUrl;
        try {
          let response = await fetch(testUrl, { method: 'GET' });
          if (!response.ok) {
            result.error = `Service not reachable: ${response.statusText}`;
            if (withStyle && withVersion) {
              return result;
            } else {
              continue;
            }
          }
          // Check content type and possibly content-length
          const contentType = response.headers.get('Content-Type');
          if (!contentType || !contentType.includes('xml')) {
            result.error = `Invalid content type: ${contentType}`;
            response.body?.cancel();
            if (withStyle && withVersion) {
              return result;
            } else {
              continue;
            }
          }
          const contentLength = response.headers.get('Content-Length');
          if (contentLength && parseInt(contentLength) > 5000000) {
            result.error = `Content too large: ${contentLength} bytes`;
            response.body?.cancel();
            return result;
          }
          const capabilitiesXML = await response.text();
          const capabilities = parseWMTSCapabilities(capabilitiesXML);
          result.type = 'WMTS';
          result.capabilities = capabilities;
          result.serviceURL = baseURLFromCapabilitiesURL(result.serviceURL);
          result.serviceTitle = capabilities?.serviceIdentification?.title || result.serviceURL;
          result.error = null;
          return result;
        } catch (error) {      
          result.error = `Error fetching WMTS capabilities: ${error.message}`;
        }
      } else {
        result.error = 'Invalid URL for WMTS capabilities.';
      }
    }
  }
  return result;
}