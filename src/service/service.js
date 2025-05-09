export async function loadService(url) {
  const serviceInfo = {
    serviceURL: url,
    type: null,
    capabilities: null,
    error: null
  }
  try {
    // Check if the URL is valid and accessible
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`Service not reachable: ${response.statusText}`);
    }
  } catch (error) {
    serviceInfo.error = `Error accessing service: ${error.message}`;
  }
  return serviceInfo;
}
