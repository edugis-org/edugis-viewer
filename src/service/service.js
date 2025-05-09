function validateURL(url) {

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
    const serviceUrl = validateURL(url);
    serviceInfo.serviceURL = serviceUrl.href;
    // Check if the URL is valid and accessible
    const response = await fetch(serviceUrl.href, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`Service not reachable: ${response.statusText}`);
    }
  } catch (error) {
    serviceInfo.error = `Error accessing service: ${error.message}`;
  }
  return serviceInfo;
}
