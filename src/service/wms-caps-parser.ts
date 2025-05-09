import type {
  WMSCapabilities,
  Service,
  Capability,
  Request,
  Layer,
  BoundingBoxes,
  BoundingBox,
  Attribution,
  Style,
  MetadataURL,
  Dimension,
  ContactInformation,
  ContactAddress,
  DCPType,
  LogoURL
} from './wms.types';

export function parseWMSCapabilities(xmlString: string): WMSCapabilities {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Invalid WMS Capabilities XML");
  }

  const root = xmlDoc.documentElement;
  
  const capabilities: WMSCapabilities = {
      version: root.getAttribute("version"),
      service: parseService(root),
      capability: parseCapability(root)
  };

  return capabilities;
}

function parseService(root: Element): Service | null {
  const serviceElement = root.getElementsByTagName("Service")[0];
  if (!serviceElement) return null;

  return {
      name: getElementText(serviceElement, "Name"),
      title: getElementText(serviceElement, "Title"),
      abstract: getElementText(serviceElement, "Abstract"),
      keywords: parseKeywords(serviceElement),
      onlineResource: getOnlineResource(serviceElement),
      contactInformation: parseContactInformation(serviceElement),
      fees: getElementText(serviceElement, "Fees"),
      accessConstraints: getElementText(serviceElement, "AccessConstraints")
  };
}

function parseCapability(root: Element): Capability | null {
  const capabilityElement = root.getElementsByTagName("Capability")[0];
  if (!capabilityElement) return null;

  // Get service-level SRS/CRS
  const rootLayer = Array.from(capabilityElement.children)
    .find(el => el.localName === 'Layer');
  
  const serviceLevelCRS = rootLayer ? Array.from(rootLayer.children)
    .filter(el => el.localName === 'CRS' || el.localName === 'SRS')
    .map(crs => crs.textContent?.trim())
    .filter((crs): crs is string => !!crs) : [];

  return {
    request: parseRequest(capabilityElement),
    layers: parseLayers(capabilityElement, { crs: serviceLevelCRS })
  };
}

function parseRequest(capabilityElement: Element): Request | null {
  const requestElement = capabilityElement.getElementsByTagName("Request")[0];
  if (!requestElement) return null;

  const requests: Request = {};
  
  for (const child of Array.from(requestElement.children)) {
    const requestName = child.localName;
    const dcpType = parseDCPType(child);
    
    if (requestName) {
      requests[requestName] = {
        formats: Array.from(child.getElementsByTagName("Format"))
          .map(format => format.textContent?.trim() || ""),
        url: dcpType?.get || null
      };
    }
  }
  
  return requests;
}

interface InheritedProps {
  crs?: string[];
  styles?: Style[];
  boundingBox?: BoundingBoxes | null;
  attribution?: Attribution | null;
  metadataURLs?: MetadataURL[];
  dimensions?: Dimension[];
}

function parseLayers(capabilityElement: Element, rootProps: InheritedProps = {}): Layer[] {
  const layers: Layer[] = [];
  
  function parseLayer(layerElement: Element, inheritedProps: InheritedProps = {}): void {
    const layerCRS = Array.from(layerElement.children)
      .filter(el => el.localName === 'CRS' || el.localName === 'SRS')
      .map(crs => crs.textContent?.trim())
      .filter((crs): crs is string => !!crs);

    const crs = [
      ...(inheritedProps.crs || []),
      ...(rootProps.crs || []),
      ...layerCRS
    ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates (keep only first occurrences)

    const styles = [
      ...(inheritedProps.styles || []),
      ...parseStyles(layerElement)
    ];

    let maxScaleDenominator: number | null = parseFloat(getElementText(layerElement, "MaxScaleDenominator") || "NaN");
    let minScaleDenominator: number | null = parseFloat(getElementText(layerElement, "MinScaleDenominator") || "NaN");

    if (isNaN(maxScaleDenominator)) maxScaleDenominator = null;
    if (isNaN(minScaleDenominator)) minScaleDenominator = null;

    if (!maxScaleDenominator && !minScaleDenominator) {
      const scaleHint = Array.from(layerElement.children).find(el => el.localName === 'ScaleHint');
      if (scaleHint) {
        const max = parseFloat(scaleHint.getAttribute('max') || "NaN");
        const min = parseFloat(scaleHint.getAttribute('min') || "NaN");
        
        if (!isNaN(max)) minScaleDenominator = 1 / max;
        if (!isNaN(min)) maxScaleDenominator = min ? 1 / min : null;
      }
    }

    const layer: Layer = {
      name: getElementText(layerElement, "Name"),
      title: getElementText(layerElement, "Title"),
      abstract: getElementText(layerElement, "Abstract"),
      keywords: parseKeywords(layerElement),
      crs: crs,
      boundingBox: parseBoundingBox(layerElement) || inheritedProps.boundingBox || null,
      attribution: parseAttribution(layerElement) || inheritedProps.attribution || null,
      styles: styles,
      metadataURLs: parseMetadataURLs(layerElement) || inheritedProps.metadataURLs || [],
      dimensions: parseDimensions(layerElement) || inheritedProps.dimensions || [],
      maxScaleDenominator,
      minScaleDenominator,
      queryable: layerElement.getAttribute("queryable") === "1"
    };

    const propsToInherit: InheritedProps = {
      crs: layer.crs,
      styles: layer.styles,
      boundingBox: layer.boundingBox,
      attribution: layer.attribution,
      metadataURLs: layer.metadataURLs,
      dimensions: layer.dimensions
    };

    if (layer.name) {
      layers.push(layer);
    }

    for (const child of Array.from(layerElement.children)) {
      if (child.localName === 'Layer') {
        parseLayer(child, propsToInherit);
      }
    }
  }

  for (const child of Array.from(capabilityElement.children)) {
    if (child.localName === 'Layer') {
      parseLayer(child);
    }
  }
  
  return layers;
}

function parseMetadataURLs(layerElement: Element): MetadataURL[] {
  return Array.from(layerElement.children)
    .filter(child => child.localName === 'MetadataURL')
    .map(metadata => ({
      type: metadata.getAttribute('type'),
      format: getElementText(metadata, 'Format'),
      onlineResource: getOnlineResource(metadata)
    }));
}

function parseDimensions(layerElement: Element): Dimension[] {
  return Array.from(layerElement.children)
    .filter(child => child.localName === 'Dimension' || child.localName === 'Extent')
    .map(dim => ({
      name: dim.getAttribute('name'),
      units: dim.getAttribute('units'),
      unitSymbol: dim.getAttribute('unitSymbol'),
      default: dim.getAttribute('default'),
      multipleValues: dim.getAttribute('multipleValues') === '1',
      nearestValue: dim.getAttribute('nearestValue') === '1',
      current: dim.getAttribute('current') === '1',
      value: dim.textContent
    }));
}

function getElementText(parent: Element, localName: string): string | null {
  for (const child of Array.from(parent.children)) {
    if (child.localName === localName) {
      return child.textContent;
    }
  }
  return null;
}

function parseKeywords(element: Element): string[] {
  const keywordsElement = Array.from(element.children)
    .find(el => el.localName === 'Keywords' || el.localName === 'KeywordList');
  if (!keywordsElement) return [];
  
  return Array.from(keywordsElement.children)
    .filter(el => el.localName === 'Keyword')
    .map(keyword => keyword.textContent || "");
}

function getOnlineResource(element: Element): string | null {
  const onlineResource = Array.from(element.children)
    .find(el => el.localName === 'OnlineResource');
  return onlineResource ? onlineResource.getAttribute("xlink:href") : null;
}

function parseContactInformation(element: Element): ContactInformation | null {
  const contactElement = Array.from(element.children)
    .find(el => el.localName === 'ContactInformation');
  if (!contactElement) return null;

  const contactPrimaryElement = Array.from(contactElement.children)
    .find(el => el.localName === 'ContactPersonPrimary');
  const contactPerson = contactPrimaryElement 
    ? getElementText(contactPrimaryElement, "ContactPerson")
    : getElementText(contactElement, "ContactPerson");
  const contactOrganization = contactPrimaryElement
    ? getElementText(contactPrimaryElement, "ContactOrganization")
    : getElementText(contactElement, "ContactOrganization");

  return {
    contactPerson,
    contactOrganization,
    contactPosition: getElementText(contactElement, "ContactPosition"),
    contactAddress: parseContactAddress(contactElement),
    contactVoiceTelephone: getElementText(contactElement, "ContactVoiceTelephone"),
    contactEmail: getElementText(contactElement, "ContactElectronicMailAddress")
  };
}

function parseContactAddress(contactElement: Element): ContactAddress | null {
  const addressElement = Array.from(contactElement.children)
    .find(el => el.localName === 'ContactAddress');
  if (!addressElement) return null;

  return {
    type: getElementText(addressElement, "AddressType"),
    address: getElementText(addressElement, "Address"),
    city: getElementText(addressElement, "City"),
    state: getElementText(addressElement, "StateOrProvince"),
    postCode: getElementText(addressElement, "PostCode"),
    country: getElementText(addressElement, "Country")
  };
}

function parseDCPType(requestElement: Element): DCPType | null {
  const dcpElement = Array.from(requestElement.children)
    .find(el => el.localName === 'DCPType');
  if (!dcpElement) return null;

  const httpElement = Array.from(dcpElement.children)
    .find(el => el.localName === 'HTTP');
  if (!httpElement) return null;

  const getElement = Array.from(httpElement.children)
    .find(el => el.localName === 'Get');
  const postElement = Array.from(httpElement.children)
    .find(el => el.localName === 'Post');

  return {
    get: getElement ? getOnlineResource(getElement) : null,
    post: postElement ? getOnlineResource(postElement) : null
  };
}

function parseBoundingBox(layerElement: Element): BoundingBoxes | null {
  const bboxes = Array.from(layerElement.children)
    .filter(el => el.localName === 'BoundingBox')
    .map(bbox => ({
      crs: bbox.getAttribute("CRS") || bbox.getAttribute("SRS") || "",
      minx: parseFloat(bbox.getAttribute("minx") || "0"),
      miny: parseFloat(bbox.getAttribute("miny") || "0"),
      maxx: parseFloat(bbox.getAttribute("maxx") || "0"),
      maxy: parseFloat(bbox.getAttribute("maxy") || "0")
    }));

  const geographicElement = Array.from(layerElement.children)
    .find(el => el.localName === 'EX_GeographicBoundingBox');
  
  let geographic: BoundingBox | null = null;
  if (geographicElement) {
    geographic = {
      crs: 'EPSG:4326',
      minx: parseFloat(getElementText(geographicElement, "westBoundLongitude") || "0"),
      miny: parseFloat(getElementText(geographicElement, "southBoundLatitude") || "0"),
      maxx: parseFloat(getElementText(geographicElement, "eastBoundLongitude") || "0"),
      maxy: parseFloat(getElementText(geographicElement, "northBoundLatitude") || "0")
    };
  } else {
    const latLonElement = Array.from(layerElement.children)
      .find(el => el.localName === 'LatLonBoundingBox');
    if (latLonElement) {
      geographic = {
        crs: 'EPSG:4326',
        minx: parseFloat(latLonElement.getAttribute("minx") || "0"),
        miny: parseFloat(latLonElement.getAttribute("miny") || "0"),
        maxx: parseFloat(latLonElement.getAttribute("maxx") || "0"),
        maxy: parseFloat(latLonElement.getAttribute("maxy") || "0")
      };
    }
  }

  return {
    boundingBoxes: bboxes,
    geographic
  };
}

function parseStyles(layerElement: Element): Style[] {
  return Array.from(layerElement.children)
    .filter(el => el.localName === 'Style')
    .map(style => ({
      name: getElementText(style, "Name"),
      title: getElementText(style, "Title"),
      abstract: getElementText(style, "Abstract"),
      legendURL: parseLegendURL(style)
    }));
}

function parseLegendURL(styleElement: Element): string {
  const legendElement = Array.from(styleElement.children)
    .find(el => el.localName === 'LegendURL');
  if (!legendElement) return "";

  const width = parseInt(legendElement.getAttribute("width") || "0");
  const height = parseInt(legendElement.getAttribute("height") || "0");
  const format = getElementText(legendElement, "Format");
  const onlineResource = getOnlineResource(legendElement) || "";
  if (onlineResource) {
    const url = new URL(onlineResource);
    if (!url.protocol) {
      url.protocol = "https:";
    }
    if (width > 0) {
      url.searchParams.set("width", width.toString());
    }
    if (height > 0) {
      url.searchParams.set("height", height.toString());
    }
    if (format) {
      url.searchParams.set("format", format);
    }
    return url.toString();
  }
  return "";
}

function parseAttribution(layerElement: Element): Attribution | null {
  const attribution = Array.from(layerElement.children)
    .find(el => el.localName === 'Attribution');
  if (!attribution) return null;

  return {
    title: getElementText(attribution, "Title"),
    onlineResource: getOnlineResource(attribution),
    logoURL: parseLogoURL(attribution)
  };
}

function parseLogoURL(attributionElement: Element): LogoURL | null {
  const logoElement = Array.from(attributionElement.children)
    .find(el => el.localName === 'LogoURL');
  if (!logoElement) return null;

  return {
    width: parseInt(logoElement.getAttribute("width") || "0"),
    height: parseInt(logoElement.getAttribute("height") || "0"),
    format: getElementText(logoElement, "Format"),
    onlineResource: getOnlineResource(logoElement)
  };
}