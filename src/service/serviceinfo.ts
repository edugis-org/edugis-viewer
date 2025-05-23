/**
 * Configuration options for URL content info retrieval
 */
interface ContentInfoOptions {
  /** Maximum size to download if full GET is needed (default: 10MB) */
  maxSafeSize?: number;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
}

/**
 * Method used to retrieve the content information
 */
type ContentInfoMethod = 
  | 'RANGE'                    // Range request succeeded (206)
  | 'RANGE_FALLBACK_LARGE'     // Range request returned 200 but file too large
  | 'RANGE_FALLBACK_SMALL'     // Range request returned 200, small file consumed
  | 'HEAD'                     // HEAD request succeeded
  | 'GET_CANCELLED_LARGE'      // GET request cancelled due to declared size
  | 'GET_SIZE_LIMITED'         // GET request stopped due to actual size
  | 'GET_COMPLETE'             // GET request completed (small file)
  | 'GET_NO_STREAM'            // GET request succeeded but no stream
  | 'ALL_FAILED';              // All methods failed

/**
 * Status of the content info retrieval
 */
type ContentInfoStatus = 'success' | 'invalid' | 'unknown';

/**
 * Result of URL content info retrieval
 */
interface ContentInfoResult {
  /** MIME type of the content */
  contentType: string;
  /** Size of the content in bytes, null if unknown */
  contentLength: number | null;
  /** Method that was successfully used */
  method: ContentInfoMethod | null;
  /** Overall status of the operation */
  status: ContentInfoStatus;
  /** Error message if any issues occurred */
  error: string | null;
}

/**
 * Map service types based on content analysis
 */
type ServiceType = 
  | 'ogc_service'    // WMS/WFS/WMTS (XML-based)
  | 'cog'            // Cloud Optimized GeoTIFF
  | 'json_service'   // Vector tiles, GeoJSON, etc.
  | 'raster'         // Regular image
  | 'unknown';       // Could not determine

/**
 * Extended result for map service analysis
 */
interface MapServiceInfo extends ContentInfoResult {
  /** Detected service type */
  serviceType: ServiceType;
  /** Whether the file size is considered safe to download */
  isSafeSize: boolean | null;
}

/**
 * Helper interface for timeout controller
 */
interface TimeoutController {
  controller: AbortController;
  timeoutId: NodeJS.Timeout;
}

/**
 * Gets content-type and content-length for a URL using multiple fallback strategies
 * Prioritizes methods that don't download large amounts of data
 * 
 * @param url - The URL to analyze
 * @param options - Configuration options
 * @returns Promise resolving to content information
 */
async function getUrlContentInfo(
  url: string, 
  options: ContentInfoOptions = {}
): Promise<ContentInfoResult> {
  const {
    maxSafeSize = 10 * 1024 * 1024, // 10MB default
    timeout = 10000 // 10 second timeout
  } = options;

  const result: ContentInfoResult = {
    contentType: 'unknown',
    contentLength: null,
    method: null,
    status: 'unknown',
    error: null
  };

  // Helper function to create timeout controller
  function createTimeoutController(ms: number): TimeoutController {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ms);
    return { controller, timeoutId };
  }

  // Strategy 1: Try range request for first byte (most efficient)
  try {
    const { controller, timeoutId } = createTimeoutController(timeout);
    
    const rangeResponse = await fetch(url, {
      method: 'GET',
      headers: { 'Range': 'bytes=0-1' }, // Request first 2 bytes
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (rangeResponse.status === 206) {
      // Server supports range requests - perfect!
      result.contentType = rangeResponse.headers.get('Content-Type') || 'unknown';
      
      const contentRange = rangeResponse.headers.get('Content-Range');
      if (contentRange) {
        // Extract total size from "bytes 0-1/12345" format
        const match = contentRange.match(/\/(\d+)$/);
        result.contentLength = match ? parseInt(match[1], 10) : null;
      }
      
      result.method = 'RANGE';
      result.status = 'success';
      
      // Consume the small response
      await rangeResponse.arrayBuffer();
      return result;
    }
    
    // Server returned 200 instead of 206 - doesn't support ranges
    if (rangeResponse.status === 200) {
      result.contentType = rangeResponse.headers.get('Content-Type') || 'unknown';
      const contentLengthHeader = rangeResponse.headers.get('Content-Length');
      result.contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : null;
      
      // Check if the file is too large to safely download
      if (result.contentLength && result.contentLength > maxSafeSize) {
        result.method = 'RANGE_FALLBACK_LARGE';
        result.status = 'success';
        result.error = `File too large (${result.contentLength} bytes), cancelled download`;
        
        // Cancel the response to avoid downloading
        if (rangeResponse.body) {
          await rangeResponse.body.cancel();
        }
        return result;
      }
      
      // Small file, safe to consume
      result.method = 'RANGE_FALLBACK_SMALL';
      result.status = 'success';
      await rangeResponse.arrayBuffer();
      return result;
    }

  } catch (rangeError) {
    // Range request failed, continue to next strategy
    const errorMessage = rangeError instanceof Error ? rangeError.message : String(rangeError);
    result.error = `Range request failed: ${errorMessage}`;
  }

  // Strategy 2: Try HEAD request (no download, but might have CORS issues)
  try {
    const { controller, timeoutId } = createTimeoutController(timeout);
    
    const headResponse = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (headResponse.ok) {
      result.contentType = headResponse.headers.get('Content-Type') || 'unknown';
      const contentLengthHeader = headResponse.headers.get('Content-Length');
      result.contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : null;
      result.method = 'HEAD';
      result.status = 'success';
      return result;
    }

  } catch (headError) {
    // HEAD request failed, continue to next strategy
    const errorMessage = headError instanceof Error ? headError.message : String(headError);
    result.error += ` | HEAD request failed: ${errorMessage}`;
  }

  // Strategy 3: Controlled GET request with size monitoring
  try {
    const { controller, timeoutId } = createTimeoutController(timeout);
    
    const getResponse = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!getResponse.ok) {
      throw new Error(`HTTP ${getResponse.status}: ${getResponse.statusText}`);
    }

    result.contentType = getResponse.headers.get('Content-Type') || 'unknown';
    const declaredLength = getResponse.headers.get('Content-Length');
    result.contentLength = declaredLength ? parseInt(declaredLength, 10) : null;

    // If we know the size and it's too large, don't download
    if (result.contentLength && result.contentLength > maxSafeSize) {
      result.method = 'GET_CANCELLED_LARGE';
      result.status = 'success';
      result.error = `File too large (${result.contentLength} bytes), cancelled download`;
      
      if (getResponse.body) {
        await getResponse.body.cancel();
      }
      return result;
    }

    // Stream the response and monitor size
    if (getResponse.body) {
      const reader = getResponse.body.getReader();
      let downloadedBytes = 0;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          downloadedBytes += value!.length;
          
          // Stop if we've downloaded too much
          if (downloadedBytes > maxSafeSize) {
            await reader.cancel();
            result.method = 'GET_SIZE_LIMITED';
            result.status = 'success';
            result.contentLength = result.contentLength || downloadedBytes; // Use actual if declared was wrong
            result.error = `Download stopped at ${downloadedBytes} bytes (size limit reached)`;
            return result;
          }
        }
        
        // Successfully downloaded entire (small) file
        result.method = 'GET_COMPLETE';
        result.status = 'success';
        result.contentLength = result.contentLength || downloadedBytes;
        return result;
        
      } catch (streamError) {
        const errorMessage = streamError instanceof Error ? streamError.message : String(streamError);
        result.error += ` | Stream error: ${errorMessage}`;
      }
    } else {
      // No readable stream
      result.method = 'GET_NO_STREAM';
      result.status = 'success';
      return result;
    }

  } catch (getError) {
    const errorMessage = getError instanceof Error ? getError.message : String(getError);
    result.error += ` | GET request failed: ${errorMessage}`;
  }

  // All strategies failed
  result.status = 'invalid';
  result.method = 'ALL_FAILED';
  return result;
}

/**
 * Helper function for common map service use cases
 * Analyzes URL and attempts to detect the type of map service
 * 
 * @param url - The URL to analyze
 * @param options - Configuration options
 * @returns Promise resolving to map service information
 */
async function analyzeMapServiceUrl(
  url: string, 
  options: ContentInfoOptions = {}
): Promise<MapServiceInfo> {
  const info = await getUrlContentInfo(url, options);
  
  // Add service type detection based on content type
  let serviceType: ServiceType = 'unknown';
  
  if (info.contentType !== 'unknown') {
    const contentType = info.contentType.toLowerCase();
    
    if (contentType.includes('xml')) {
      serviceType = 'ogc_service'; // Likely WMS/WFS/WMTS capabilities
    } else if (contentType.includes('tiff') || contentType.includes('geotiff')) {
      serviceType = 'cog'; // Cloud Optimized GeoTIFF
    } else if (contentType.includes('json')) {
      serviceType = 'json_service'; // Vector tiles, GeoJSON, etc.
    } else if (contentType.includes('image/')) {
      serviceType = 'raster'; // Regular image
    }
  }
  
  const maxSafeSize = options.maxSafeSize || 10 * 1024 * 1024;
  const isSafeSize = info.contentLength ? info.contentLength <= maxSafeSize : null;
  
  return {
    ...info,
    serviceType,
    isSafeSize
  };
}

// Export types and functions
export type {
  ContentInfoOptions,
  ContentInfoMethod,
  ContentInfoStatus,
  ContentInfoResult,
  ServiceType,
  MapServiceInfo
};

export {
  getUrlContentInfo,
  analyzeMapServiceUrl
};

/* Example usage:

// Basic usage
const info: ContentInfoResult = await getUrlContentInfo('https://example.com/data.tif');
console.log(info);
// { contentType: 'image/tiff', contentLength: 50000000, method: 'RANGE', status: 'success' }

// Map service analysis with type safety
const serviceInfo: MapServiceInfo = await analyzeMapServiceUrl(
  'https://example.com/wms?service=WMS&request=GetCapabilities'
);

if (serviceInfo.status === 'success' && serviceInfo.serviceType === 'ogc_service') {
  console.log('Valid OGC service detected');
}

// Custom options with type checking
const customInfo: ContentInfoResult = await getUrlContentInfo(
  'https://example.com/large-file.cog', 
  {
    maxSafeSize: 5 * 1024 * 1024, // 5MB limit
    timeout: 5000 // 5 second timeout
  }
);

// Type-safe error handling
if (customInfo.status === 'invalid') {
  console.error('Failed to analyze URL:', customInfo.error);
} else if (customInfo.serviceType === 'cog' && customInfo.isSafeSize === false) {
  console.warn('COG file is too large for safe download');
}

*/