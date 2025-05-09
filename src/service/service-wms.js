// check if the service is a WMS service
// and return the capabilities document

import { parseWMSCapabilities } from './wms-caps-parser';


function wmsCapbilitiesURL(url) {
  try {
    // Check if the URL is valid and accessible
    const urlObj = new URL(url);
    // remove possibly existing parameters 'service', 'request' and 'version'
    const capabilitiesParams = ['service', 'request', 'version'];
    const urlParams = new URLSearchParams(urlObj.search);
    for (const param of urlParams) {
      if (capabilitiesParams.includes(param[0].toLowerCase())) {
        urlParams.delete(param[0]);
      }
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



export async function serviceGetWMSCapabilities(url) {
  url = wmsCapbilitiesURL(url);
  if (url) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Service not reachable: ${response.statusText}`);
      }
      const capabilitiesXML = await response.text();
      const capabilities = parseWMSCapabilities(capabilitiesXML);
      return capabilities;
    } catch (error) {
      console.error(`Error fetching WMS capabilities: ${error.message}`);
      return null;
    }
  }
}