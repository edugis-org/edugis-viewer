// check if the service is a WMS service
// and return the capabilities document

import { parseWMTSCapabilities } from './wmts-caps-parser';

function inferWMTSBaseUrl(tileUrl, withStyle) {
  try {
    const url = new URL(tileUrl);
    const pathname = decodeURIComponent(url.pathname)
      .replace(/%7B/g, '{')
      .replace(/%7D/g, '}')
      .replace(/{x}/g, '0')
      .replace(/{y}/g, '0')
      .replace(/{z}/g, '0'); // Replace any placeholders with dummy values
    
    // Identify the numeric segments (z/x/y) that indicate tile coordinates
    const segments = pathname.split('/').filter(s => s.length > 0);
    
    // Find the position of the LAST occurrence of 3 consecutive numeric segments
    // since WMTS tile coordinates (tileMatrix/tileRow/tileCol) are always at the end
    let numericStartIndex = -1;
    
    // Look for consecutive numeric segments (at least 3 for z/x/y) - search from end
    for (let i = segments.length - 3; i >= 0; i--) {
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
    
    // If we found a pattern of 3 consecutive numbers, try to extract base URL
    if (numericStartIndex >= 0) {
      // In WMTS RESTful pattern, we assume:
      // .../layer/style/tileMatrixSet/tileMatrix/tileRow/tileCol.format
      // .../layer/tileMatrixSet/tileMatrix/tileRow/tileCol.format
      // So skip 2 (no style) or 3 (style) segments back from the numeric part for layer/style/tileMatrixSet
      const segmentsToRemove = withStyle ? 3 : 2;
      const baseUrlEndIndex = numericStartIndex - segmentsToRemove;
      
      // Check if we have enough segments left for a valid WMTS base URL
      // After removing tile coordinates and layer/style/tileMatrixSet, 
      // we should have at least some base path (could be empty for root-level services)
      if (baseUrlEndIndex < 0) {
        // Not enough segments to form a valid WMTS structure
        return null;
      }
      
      // Reconstruct the base URL
      const baseSegments = segments.slice(0, baseUrlEndIndex);
      const basePathname = baseSegments.length > 0 ? '/' + baseSegments.join('/') : '';
      
      url.pathname = basePathname;
      return url.href;
    } else {
      // No numeric pattern found, assume it's already a base URL
      return url.href;
    }
  } catch (e) {
    return null;
  }
}

function wmtsCapbilitiesURL(url, useKVP = false, withStyle = false, withVersion = false) {
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
    if (useKVP) {
      // create a KVP request URL
      for (const [key, value] of urlObj.searchParams) {
        if (key.toLowerCase() === 'service' && value.toLowerCase() !== 'wmts') {
          return null; // not a WMTS service
        }
        if (key.toLowerCase() === 'request' || value.toLowerCase() === 'version') {
          // remove key 
          urlObj.searchParams.delete(key);
        }
      }
      urlObj.searchParams.set('service', 'WMTS');
      urlObj.searchParams.set('request', 'GetCapabilities');
      if (withVersion) {
        urlObj.searchParams.set('version', '1.0.0');
      }
      if (withStyle) {
        urlObj.searchParams.set('style', 'default');
      }
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
  console.log('url', url);
  for (const useKVP of [false, true]) {    
    for (const withVersion of [false, true]) {
      for (const withStyle of [false, true]) {
        const testUrl = wmtsCapbilitiesURL(url, useKVP, withStyle, withVersion);
        console.log('testUrl', testUrl);
        if (testUrl) {
          if (withStyle && testUrl === wmtsCapbilitiesURL(url, useKVP, false, withVersion)) {
            continue; // Skip if the URL is the same as without style
          }
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
            if (!capabilities || !capabilities.contents) {
              result.error = 'Invalid WMTS capabilities document.';
              return result;
            }
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
      } // withStyle
    } // witVersion
  } // useKVP
  return result;
}