
// test if a URL is an XYZ tile service and normalize it to {z}/{x}/{y} format
// the url is expected to be one of the following:
// - https://example.com/tiles
// - https://example.com/tiles/
// - https://example.com/tiles/{z}/{x}/{y}
// - https://example.com/tiles/{z}/{x}/{y}.png
// - https://example.com/tiles/{z}/{x}/{y}.jpg
// - https://example.com/tiles/10/20/30
// - https://example.com/tiles/10/20/30.png
// - https://example.com/tiles/10/20/30.jpg
// sometimes { and } are accidentally encoded as %7B and %7D
export async function serviceGetXYZInfo(url) {
  const result = {
    serviceURL: url,
    serviceTitle: null,
    type: 'XYZ',
    capabilities: null,
    error: null
  };

  try {
    // Decode URL components that might be encoded
    const decodedUrl = decodeURIComponent(url);
    const urlObj = new URL(decodedUrl);
    result.serviceTitle = urlObj.hostname;

    // Get pathname and decode any encoded braces
    let pathname = decodeURIComponent(urlObj.pathname);
    pathname = pathname.replace(/%7B/g, '{').replace(/%7D/g, '}');
    
    // Normalize the pathname to XYZ format
    const normalizedPathname = normalizeToXYZFormat(pathname);
    
    if (!normalizedPathname) {
      result.error = 'Invalid XYZ URL. Could not convert to {z}/{x}/{y} format.';
      return result;
    }

    // Test the XYZ URL with different formats
    const testResult = await testXYZUrl(urlObj, normalizedPathname);
    
    if (testResult.success) {
      result.serviceURL = testResult.url;
      result.capabilities = testResult.capabilities;
      result.error = null;
    } else {
      result.error = testResult.error;
    }

    return result;

  } catch (error) {
    result.error = `Invalid URL or network error: ${error.message}`;
    return result;
  }
}

/**
 * Normalizes various URL patterns to XYZ format with {z}/{x}/{y} placeholders
 */
function normalizeToXYZFormat(pathname) {
  // Decode any remaining encoded braces (in case they weren't caught earlier)
  pathname = pathname.replace(/%7B/g, '{').replace(/%7D/g, '}');
  
  // Already in XYZ format
  if (pathname.includes('{z}') && pathname.includes('{x}') && pathname.includes('{y}')) {
    return pathname;
  }

  // Check if URL contains numeric tile pattern like /10/20/30 or /10/20/30.png
  const tilePattern = /\/(\d+)\/(\d+)\/(\d+)(\.\w+)?$/;
  const match = pathname.match(tilePattern);
  
  if (match) {
    // Replace numeric pattern with placeholders, preserving file extension
    const extension = match[4] || '';
    return pathname.replace(tilePattern, '/{z}/{x}/{y}' + extension);
  }

  // Fallback: try to construct XYZ URL by appending pattern
  let normalizedPath = pathname;
  if (!normalizedPath.endsWith('/')) {
    normalizedPath += '/';
  }
  return normalizedPath + '{z}/{x}/{y}.png';
}

/**
 * Tests an XYZ URL with different image formats to find a working one
 */
async function testXYZUrl(urlObj, pathname) {
  const supportedFormats = ['', '.png', '.jpg', '.jpeg', '.webp'];
  const errors = [];

  // Extract current format from pathname
  const currentFormat = pathname.match(/\.\w+$/)?.[0] || '';
  const basePathname = currentFormat ? pathname.replace(/\.\w+$/, '') : pathname;

  // If pathname already has a format, test it first
  if (currentFormat) {
    const testResult = await testSingleFormat(urlObj, pathname);
    if (testResult.success) {
      return testResult;
    }
    errors.push(testResult.error);
  }

  // Test other formats
  for (const format of supportedFormats) {
    if (format === currentFormat) continue; // Skip already tested format

    const testPathname = basePathname + format;
    const testResult = await testSingleFormat(urlObj, testPathname);
    
    if (testResult.success) {
      return testResult;
    }
    errors.push(testResult.error);
  }

  return {
    success: false,
    error: `No working format found. Errors: ${errors.join('; ')}`
  };
}

/**
 * Tests a single XYZ URL format by fetching a sample tile
 */
async function testSingleFormat(urlObj, pathname) {
  try {
    // Construct full URL with sample coordinates
    // Need to manually construct to preserve unencoded braces
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const fullPath = pathname + urlObj.search + urlObj.hash;
    const testUrl = baseUrl + fullPath;
    const sampleTileUrl = testUrl.replace('{z}', '0').replace('{x}', '0').replace('{y}', '0');

    const response = await fetch(sampleTileUrl, { 
      method: 'GET',
      // Add timeout and other reasonable defaults
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText} for ${sampleTileUrl}`
      };
    }

    const contentType = response.headers.get('Content-Type') || '';
    
    // Verify content type matches expected format
    if (!isValidImageContentType(contentType, pathname)) {
      return {
        success: false,
        error: `Unexpected content type: ${contentType} for ${sampleTileUrl}`
      };
    }

    // Get tile dimensions
    const tileSize = await getTileDimensions(response);

    return {
      success: true,
      url: testUrl,
      capabilities: { format: contentType, tileSize: tileSize }
    };

  } catch (error) {
    return {
      success: false,
      error: `Network error for ${pathname}: ${error.message}`
    };
  }
}

/**
 * Validates that the content type matches the expected image format
 */
function isValidImageContentType(contentType, pathname) {
  if (!contentType.startsWith('image/')) {
    return false;
  }

  // Extract format from pathname
  const formatMatch = pathname.match(/\.(\w+)$/);
  if (!formatMatch) {
    // No specific format in URL, accept any image type
    return true;
  }

  const format = formatMatch[1].toLowerCase();
  const expectedType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
  
  return contentType.toLowerCase() === expectedType.toLowerCase();
}

/**
 * Gets the dimensions of a tile image from the fetch response
 */
async function getTileDimensions(response) {
  try {
    // Clone the response to avoid consuming the body multiple times
    const imageBlob = await response.blob();
    
    // Create an image element to load and measure the tile
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = function() {
        // Clean up object URL
        URL.revokeObjectURL(img.src);
        
        // Return dimensions object
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      
      img.onerror = function() {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image for dimension measurement'));
      };
      
      // Create object URL and load image
      img.src = URL.createObjectURL(imageBlob);
    });
    
  } catch (error) {
    // If we can't determine dimensions, return null rather than failing
    console.warn('Could not determine tile dimensions:', error.message);
    return null;
  }
}