// check if the service returns GeoJSON data
// and return the GeoJSON information

import { parseWFSCapabilities } from './wfs-caps-parser.js';

/**
 * Tests if a URL is an ArcGIS Feature Service and converts it to GeoJSON
 */
async function testArcGISFeatureService(url) {
  try {
    // Check if URL looks like ArcGIS Feature Service
    const arcgisPattern = /\/rest\/services\/.*\/FeatureServer/i;
    const mapServerPattern = /\/rest\/services\/.*\/MapServer/i;
    
    if (!arcgisPattern.test(url) && !mapServerPattern.test(url)) {
      return null;
    }
    
    let baseUrl = url;
    const urlObj = new URL(url);
    
    // Clean up URL - remove query parameters and ensure proper format
    urlObj.search = '';
    baseUrl = urlObj.href;
    
    // Remove trailing slash and layer numbers if present
    baseUrl = baseUrl.replace(/\/\d+\/?$/, '');
    
    // First, try to get service info to understand the service
    const serviceInfoUrl = `${baseUrl}?f=json`;
    const serviceResponse = await fetch(serviceInfoUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(8000)
    });
    
    if (!serviceResponse.ok) return null;
    
    const serviceInfo = await serviceResponse.json();
    
    // Check if it's a valid ArcGIS service
    if (!serviceInfo.layers && !serviceInfo.tables) {
      return null;
    }
    
    // Try to get data from the first available layer
    const layers = serviceInfo.layers || [];
    if (layers.length === 0) return null;
    
    const firstLayer = layers[0];
    const layerUrl = `${baseUrl}/${firstLayer.id}/query`;
    
    // Create GeoJSON query URL
    const queryUrl = new URL(layerUrl);
    queryUrl.searchParams.set('where', '1=1'); // Get all features
    queryUrl.searchParams.set('outFields', '*'); // Get all fields
    queryUrl.searchParams.set('f', 'geojson'); // Request GeoJSON format
    queryUrl.searchParams.set('resultRecordCount', '1000'); // Limit results
    
    return {
      serviceInfo: serviceInfo,
      queryUrl: queryUrl.href,
      selectedLayer: firstLayer,
      baseUrl: baseUrl
    };
    
  } catch (error) {
    return null;
  }
}

/**
 * Attempts to convert an ArcGIS service URL to GeoJSON format
 */
function convertArcGISToGeoJSON(url) {
  try {
    const urlObj = new URL(url);
    
    // Check if it already has f=geojson
    if (urlObj.searchParams.get('f') === 'geojson') {
      return url;
    }
    
    // Check if it's a query endpoint
    if (url.includes('/query')) {
      urlObj.searchParams.set('f', 'geojson');
      if (!urlObj.searchParams.has('where')) {
        urlObj.searchParams.set('where', '1=1');
      }
      if (!urlObj.searchParams.has('outFields')) {
        urlObj.searchParams.set('outFields', '*');
      }
      return urlObj.href;
    }
    
    // Check if it's a FeatureServer/MapServer URL
    const arcgisPattern = /\/rest\/services\/.*\/(FeatureServer|MapServer)/i;
    if (arcgisPattern.test(url)) {
      // Extract layer number if present
      const layerMatch = url.match(/\/(FeatureServer|MapServer)\/(\d+)/i);
      const layerNum = layerMatch ? layerMatch[2] : '0';
      
      // Remove layer number from base URL if present
      const baseUrl = url.replace(/\/\d+\/?$/, '');
      
      // Create query URL
      const queryUrl = `${baseUrl}/${layerNum}/query`;
      const queryUrlObj = new URL(queryUrl);
      queryUrlObj.searchParams.set('where', '1=1');
      queryUrlObj.searchParams.set('outFields', '*');
      queryUrlObj.searchParams.set('f', 'geojson');
      queryUrlObj.searchParams.set('resultRecordCount', '1000');
      
      return queryUrlObj.href;
    }
    
    return url;
    
  } catch (error) {
    return url;
  }
}

/**
 * Creates a WFS GetCapabilities URL from a given URL
 */
function createWFSCapabilitiesURL(url) {
  try {
    const urlObj = new URL(url);
    
    // Remove existing WFS parameters
    const wfsParams = ['service', 'request', 'version', 'typename', 'typenames', 'outputformat', 'srsname', 'crs', 'bbox', 'maxfeatures', 'count'];
    const urlParams = new URLSearchParams(urlObj.search);
    const paramNames = Array.from(urlParams.keys());
    
    for (const paramName of paramNames) {
      if (wfsParams.includes(paramName.toLowerCase())) {
        urlParams.delete(paramName);
      }
    }
    
    // Set WFS GetCapabilities parameters
    urlParams.set('service', 'WFS');
    urlParams.set('request', 'GetCapabilities');
    urlParams.set('version', '2.0.0');
    
    urlObj.search = urlParams.toString();
    return urlObj.href;
    
  } catch (error) {
    return null;
  }
}

/**
 * Tests if a URL is a WFS service by fetching its capabilities
 */
async function testWFSService(url) {
  try {
    const capabilitiesURL = createWFSCapabilitiesURL(url);
    if (!capabilitiesURL) return null;
    
    const response = await fetch(capabilitiesURL, { 
      method: 'GET',
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) return null;
    
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('xml')) return null;
    
    const capabilitiesXML = await response.text();
    const capabilities = parseWFSCapabilities(capabilitiesXML);
    
    return {
      capabilities: capabilities,
      capabilitiesURL: capabilitiesURL,
      baseURL: url
    };
    
  } catch (error) {
    return null;
  }
}

/**
 * Creates a WFS GetFeature URL that returns GeoJSON for a specific feature type
 */
function createWFSGeoJSONURL(baseURL, featureTypeName, maxFeatures = 1000) {
  try {
    const urlObj = new URL(baseURL);
    
    // Clear existing parameters
    urlObj.search = '';
    
    // Set WFS GetFeature parameters for GeoJSON output
    urlObj.searchParams.set('service', 'WFS');
    urlObj.searchParams.set('request', 'GetFeature');
    urlObj.searchParams.set('version', '2.0.0');
    urlObj.searchParams.set('typeNames', featureTypeName);
    urlObj.searchParams.set('outputFormat', 'application/json');
    urlObj.searchParams.set('count', maxFeatures.toString());
    
    return urlObj.href;
    
  } catch (error) {
    return null;
  }
}

/**
 * Attempts to convert a URL to return GeoJSON format if it's a WFS service
 */
function convertToGeoJSONURL(url) {
  try {
    const urlObj = new URL(url);
    
    // Check if it's already a WFS service with specific parameters
    const searchParams = urlObj.searchParams;
    const service = searchParams.get('service')?.toLowerCase();
    const request = searchParams.get('request')?.toLowerCase();
    
    if (service === 'wfs') {
      // Clean up existing WFS parameters and set GeoJSON output
      const wfsParams = ['service', 'request', 'version', 'typename', 'typenames', 'outputformat', 'srsname', 'crs', 'bbox', 'maxfeatures', 'count'];
      const existingParams = {};
      
      // Preserve existing WFS parameters
      for (const [key, value] of searchParams) {
        if (wfsParams.includes(key.toLowerCase())) {
          existingParams[key.toLowerCase()] = value;
        }
      }
      
      // Clear all parameters and rebuild with GeoJSON output
      urlObj.search = '';
      urlObj.searchParams.set('service', 'WFS');
      urlObj.searchParams.set('request', existingParams.request || 'GetFeature');
      urlObj.searchParams.set('version', existingParams.version || '2.0.0');
      urlObj.searchParams.set('outputFormat', 'application/json');
      
      // Add back other preserved parameters
      if (existingParams.typename || existingParams.typenames) {
        urlObj.searchParams.set('typeNames', existingParams.typename || existingParams.typenames);
      }
      if (existingParams.srsname || existingParams.crs) {
        urlObj.searchParams.set('srsName', existingParams.srsname || existingParams.crs);
      }
      if (existingParams.bbox) {
        urlObj.searchParams.set('bbox', existingParams.bbox);
      }
      if (existingParams.maxfeatures || existingParams.count) {
        urlObj.searchParams.set('count', existingParams.maxfeatures || existingParams.count);
      }
      
      return urlObj.href;
    }
    
    // For non-WFS URLs, return as-is (might be direct GeoJSON file)
    return url;
    
  } catch (error) {
    return url; // Return original URL if parsing fails
  }
}

/**
 * Validates if the content is valid GeoJSON
 */
function validateGeoJSON(data) {
  try {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    
    // Basic GeoJSON validation
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Not a valid JSON object' };
    }
    
    // Check for required GeoJSON properties
    if (!data.type) {
      return { valid: false, error: 'Missing required "type" property' };
    }
    
    const validTypes = ['Feature', 'FeatureCollection', 'Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'];
    if (!validTypes.includes(data.type)) {
      return { valid: false, error: `Invalid GeoJSON type: ${data.type}` };
    }
    
    // Additional validation for FeatureCollection
    if (data.type === 'FeatureCollection') {
      if (!Array.isArray(data.features)) {
        return { valid: false, error: 'FeatureCollection must have a features array' };
      }
    }
    
    // Additional validation for Feature
    if (data.type === 'Feature') {
      if (!data.geometry && data.geometry !== null) {
        return { valid: false, error: 'Feature must have a geometry property' };
      }
    }
    
    return { valid: true, data };
    
  } catch (error) {
    return { valid: false, error: `JSON parsing error: ${error.message}` };
  }
}

/**
 * Analyzes GeoJSON data and extracts metadata
 */
function analyzeGeoJSON(geoJsonData) {
  const analysis = {
    type: geoJsonData.type,
    featureCount: 0,
    geometryTypes: new Set(),
    properties: new Set(),
    bounds: null,
    crs: geoJsonData.crs || null
  };
  
  try {
    let features = [];
    
    if (geoJsonData.type === 'FeatureCollection') {
      features = geoJsonData.features || [];
      analysis.featureCount = features.length;
    } else if (geoJsonData.type === 'Feature') {
      features = [geoJsonData];
      analysis.featureCount = 1;
    } else {
      // Direct geometry object
      analysis.geometryTypes.add(geoJsonData.type);
      analysis.featureCount = 1;
    }
    
    // Analyze features
    for (const feature of features) {
      if (feature.geometry) {
        analysis.geometryTypes.add(feature.geometry.type);
      }
      
      if (feature.properties) {
        Object.keys(feature.properties).forEach(key => {
          analysis.properties.add(key);
        });
      }
    }
    
    // Convert Sets to Arrays for serialization
    analysis.geometryTypes = Array.from(analysis.geometryTypes);
    analysis.properties = Array.from(analysis.properties);
    
    return analysis;
    
  } catch (error) {
    console.warn('Error analyzing GeoJSON:', error.message);
    return analysis;
  }
}

/**
 * Attempts to fetch and validate GeoJSON from a URL
 */
async function testGeoJSONURL(url) {
  try {
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'Accept': 'application/json, application/geo+json, text/plain'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const contentType = response.headers.get('Content-Type') || '';
    
    // Check if content type suggests JSON
    const isJsonContent = contentType.includes('json') || 
                         contentType.includes('application/json') || 
                         contentType.includes('application/geo+json') ||
                         contentType.includes('text/plain');
    
    if (!isJsonContent && !contentType.includes('text/')) {
      return {
        success: false,
        error: `Unexpected content type: ${contentType}`
      };
    }

    // Check content length
    const contentLength = response.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength) > 50000000) { // 50MB limit
      return {
        success: false,
        error: `Content too large: ${contentLength} bytes`
      };
    }

    const responseText = await response.text();
    
    // Validate GeoJSON
    const validation = validateGeoJSON(responseText);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Analyze the GeoJSON
    const analysis = analyzeGeoJSON(validation.data);

    return {
      success: true,
      url: url,
      data: validation.data,
      analysis: analysis,
      contentType: contentType
    };

  } catch (error) {
    return {
      success: false,
      error: `Network error: ${error.message}`
    };
  }
}

/**
 * Main function to get GeoJSON service information
 */
export async function serviceGetGeoJSON(url) {
  const result = {
    serviceURL: url,
    serviceTitle: null,
    type: 'GeoJSON',
    capabilities: null,
    error: null
  };

  try {
    const urlObj = new URL(url);
    result.serviceTitle = urlObj.hostname;

    // Strategy 1: Try the URL as-is (direct GeoJSON file or API)
    let testResult = await testGeoJSONURL(url);
    
    if (testResult.success) {
      result.capabilities = {
        format: testResult.contentType,
        analysis: testResult.analysis,
        featureCount: testResult.analysis.featureCount,
        geometryTypes: testResult.analysis.geometryTypes,
        properties: testResult.analysis.properties,
        bounds: testResult.analysis.bounds,
        crs: testResult.analysis.crs,
        sourceType: 'direct'
      };
      result.error = null;
      
      // Set a more descriptive title if available
      if (testResult.data.name) {
        result.serviceTitle = testResult.data.name;
      } else if (testResult.analysis.featureCount > 0) {
        result.serviceTitle = `${result.serviceTitle} (${testResult.analysis.featureCount} features)`;
      }
      
      return result;
    }

    // Strategy 2: Check if it's an ArcGIS Feature Service
    const arcgisInfo = await testArcGISFeatureService(url);
    if (arcgisInfo) {
      testResult = await testGeoJSONURL(arcgisInfo.queryUrl);
      
      if (testResult.success) {
        result.serviceURL = arcgisInfo.queryUrl;
        result.capabilities = {
          format: testResult.contentType,
          analysis: testResult.analysis,
          featureCount: testResult.analysis.featureCount,
          geometryTypes: testResult.analysis.geometryTypes,
          properties: testResult.analysis.properties,
          bounds: testResult.analysis.bounds,
          crs: testResult.analysis.crs,
          sourceType: 'arcgis',
          arcgisServiceInfo: arcgisInfo.serviceInfo,
          selectedLayer: arcgisInfo.selectedLayer,
          availableLayers: arcgisInfo.serviceInfo.layers?.map(layer => ({
            id: layer.id,
            name: layer.name,
            type: layer.type,
            geometryType: layer.geometryType
          }))
        };
        result.error = null;
        result.serviceTitle = arcgisInfo.selectedLayer.name || arcgisInfo.serviceInfo.serviceDescription || result.serviceTitle;
        return result;
      } else {
        // ArcGIS service found but couldn't get GeoJSON
        result.error = `ArcGIS Feature Service detected but couldn't retrieve GeoJSON data. Available layers: ${arcgisInfo.serviceInfo.layers?.map(l => l.name).join(', ') || 'none'}`;
        return result;
      }
    }

    // Strategy 3: If it looks like an ArcGIS URL with parameters, try converting it
    if (url.toLowerCase().includes('featureserver') || url.toLowerCase().includes('mapserver')) {
      const geoJsonUrl = convertArcGISToGeoJSON(url);
      if (geoJsonUrl !== url) {
        testResult = await testGeoJSONURL(geoJsonUrl);
        if (testResult.success) {
          result.serviceURL = geoJsonUrl;
          result.capabilities = {
            format: testResult.contentType,
            analysis: testResult.analysis,
            featureCount: testResult.analysis.featureCount,
            geometryTypes: testResult.analysis.geometryTypes,
            properties: testResult.analysis.properties,
            bounds: testResult.analysis.bounds,
            crs: testResult.analysis.crs,
            sourceType: 'arcgis_converted'
          };
          result.error = null;
          return result;
        }
      }
    }

    // Strategy 4: If it looks like a WFS URL with parameters, try converting it
    if (url.toLowerCase().includes('service=wfs') || url.toLowerCase().includes('request=getfeature')) {
      const geoJsonUrl = convertToGeoJSONURL(url);
      if (geoJsonUrl !== url) {
        testResult = await testGeoJSONURL(geoJsonUrl);
        if (testResult.success) {
          result.serviceURL = geoJsonUrl;
          result.capabilities = {
            format: testResult.contentType,
            analysis: testResult.analysis,
            featureCount: testResult.analysis.featureCount,
            geometryTypes: testResult.analysis.geometryTypes,
            properties: testResult.analysis.properties,
            bounds: testResult.analysis.bounds,
            crs: testResult.analysis.crs,
            sourceType: 'wfs_converted'
          };
          result.error = null;
          return result;
        }
      }
    }

    // Strategy 5: Test if it's a WFS service by checking capabilities
    const wfsInfo = await testWFSService(url);
    if (wfsInfo && wfsInfo.capabilities && wfsInfo.capabilities.featureTypeList) {
      // Found a WFS service, try to get GeoJSON from the first available feature type
      const featureTypes = wfsInfo.capabilities.featureTypeList;
      
      if (featureTypes.length > 0) {
        // Try the first feature type
        const firstFeatureType = featureTypes[0];
        const wfsGeoJSONURL = createWFSGeoJSONURL(wfsInfo.baseURL, firstFeatureType.name);
        
        if (wfsGeoJSONURL) {
          testResult = await testGeoJSONURL(wfsGeoJSONURL);
          
          if (testResult.success) {
            result.serviceURL = wfsGeoJSONURL;
            result.capabilities = {
              format: testResult.contentType,
              analysis: testResult.analysis,
              featureCount: testResult.analysis.featureCount,
              geometryTypes: testResult.analysis.geometryTypes,
              properties: testResult.analysis.properties,
              bounds: testResult.analysis.bounds,
              crs: testResult.analysis.crs,
              sourceType: 'wfs',
              wfsCapabilities: wfsInfo.capabilities,
              selectedFeatureType: firstFeatureType,
              availableFeatureTypes: featureTypes.map(ft => ({
                name: ft.name,
                title: ft.title,
                abstract: ft.abstract
              }))
            };
            result.error = null;
            result.serviceTitle = firstFeatureType.title || firstFeatureType.name || result.serviceTitle;
            return result;
          }
        }
      }
      
      // WFS service found but couldn't get GeoJSON data
      result.error = `WFS service detected but couldn't retrieve GeoJSON data. Available feature types: ${featureTypes.map(ft => ft.name).join(', ')}`;
      return result;
    }

    // Strategy 6: If URL contains 'wfs' but no explicit parameters, try common WFS detection
    if (url.toLowerCase().includes('wfs')) {
      const geoJsonUrl = convertToGeoJSONURL(url);
      if (geoJsonUrl !== url) {
        testResult = await testGeoJSONURL(geoJsonUrl);
        if (testResult.success) {
          result.serviceURL = geoJsonUrl;
          result.capabilities = {
            format: testResult.contentType,
            analysis: testResult.analysis,
            featureCount: testResult.analysis.featureCount,
            geometryTypes: testResult.analysis.geometryTypes,
            properties: testResult.analysis.properties,
            bounds: testResult.analysis.bounds,
            crs: testResult.analysis.crs,
            sourceType: 'wfs_inferred'
          };
          result.error = null;
          return result;
        }
      }
    }

    // If all strategies failed, return the last error
    result.error = testResult.error || 'Unable to retrieve GeoJSON data from this URL';
    return result;

  } catch (error) {
    result.error = `Invalid URL or network error: ${error.message}`;
    return result;
  }
}