export function parseWMTSCapabilities(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Invalid XML");
  }

  const root = xmlDoc.documentElement;
  const ns = {
      wmts: "http://www.opengis.net/wmts/1.0",
      ows: "http://www.opengis.net/ows/1.1"
  };

  return {
      version: root.getAttribute("version"),
      serviceIdentification: parseServiceIdentification(root, ns),
      serviceProvider: parseServiceProvider(root, ns),
      operationsMetadata: parseOperationsMetadata(root, ns),
      contents: parseContents(root, ns)
  };
}

function parseServiceIdentification(root, ns) {
  const element = root.getElementsByTagNameNS(ns.ows, "ServiceIdentification")[0];
  if (!element) return null;

  return {
      title: getElementTextNS(element, ns.ows, "Title"),
      abstract: getElementTextNS(element, ns.ows, "Abstract"),
      keywords: parseKeywords(element, ns),
      serviceType: getElementTextNS(element, ns.ows, "ServiceType"),
      serviceTypeVersion: getElementTextNS(element, ns.ows, "ServiceTypeVersion"),
      fees: getElementTextNS(element, ns.ows, "Fees"),
      accessConstraints: getElementTextNS(element, ns.ows, "AccessConstraints")
  };
}

function parseServiceProvider(root, ns) {
  const element = root.getElementsByTagNameNS(ns.ows, "ServiceProvider")[0];
  if (!element) return null;

  return {
      providerName: getElementTextNS(element, ns.ows, "ProviderName"),
      providerSite: getProviderSite(element, ns),
      serviceContact: parseServiceContact(element, ns)
  };
}

function parseContents(root, ns) {
  const contents = root.getElementsByTagNameNS(ns.wmts, "Contents")[0];
  if (!contents) return null;

  return {
      layers: parseLayers(contents, ns),
      tileMatrixSets: parseTileMatrixSets(contents, ns)
  };
}

function parseLayers(contents, ns) {
  const layers = contents.getElementsByTagNameNS(ns.wmts, "Layer");
  return Array.from(layers).map(layer => ({
      title: getElementTextNS(layer, ns.ows, "Title"),
      abstract: getElementTextNS(layer, ns.ows, "Abstract"),
      identifier: getElementTextNS(layer, ns.ows, "Identifier"),
      bounds: parseWGS84BoundingBox(layer, ns),
      styles: parseStyles(layer, ns),
      formats: parseFormats(layer, ns),
      tileMatrixSetLinks: parseTileMatrixSetLinks(layer, ns),
      dimensions: parseDimensions(layer, ns),
      resourceUrls: parseResourceUrls(layer, ns)
  }));
}

function parseTileMatrixSets(contents, ns) {
  const tileMatrixSets = contents.getElementsByTagNameNS(ns.wmts, "TileMatrixSet");
  const result = {};

  Array.from(tileMatrixSets).forEach(tileMatrixSet => {
      const identifier = getElementTextNS(tileMatrixSet, ns.ows, "Identifier");
      result[identifier] = {
          identifier: identifier,
          supportedCRS: getElementTextNS(tileMatrixSet, ns.ows, "SupportedCRS"),
          tileMatrices: parseTileMatrices(tileMatrixSet, ns)
      };
  });

  return result;
}

function parseTileMatrices(tileMatrixSet, ns) {
  const tileMatrices = tileMatrixSet.getElementsByTagNameNS(ns.wmts, "TileMatrix");
  return Array.from(tileMatrices).map(matrix => ({
      identifier: getElementTextNS(matrix, ns.ows, "Identifier"),
      scaleDenominator: parseFloat(getElementTextNS(matrix, ns.wmts, "ScaleDenominator")),
      topLeftCorner: getElementTextNS(matrix, ns.wmts, "TopLeftCorner").split(" ").map(Number),
      tileWidth: parseInt(getElementTextNS(matrix, ns.wmts, "TileWidth")),
      tileHeight: parseInt(getElementTextNS(matrix, ns.wmts, "TileHeight")),
      matrixWidth: parseInt(getElementTextNS(matrix, ns.wmts, "MatrixWidth")),
      matrixHeight: parseInt(getElementTextNS(matrix, ns.wmts, "MatrixHeight"))
  }));
}

function parseOperationsMetadata(root, ns) {
  const operations = root.getElementsByTagNameNS(ns.ows, "Operation");
  const result = {};

  Array.from(operations).forEach(operation => {
      const name = operation.getAttribute("name");
      result[name] = {
          dcp: parseDCP(operation, ns)
      };
  });

  return result;
}

// Helper functions
function getElementTextNS(parent, namespace, localName) {
  const element = parent.getElementsByTagNameNS(namespace, localName)[0];
  return element ? element.textContent : null;
}

function parseKeywords(element, ns) {
  const keywords = element.getElementsByTagNameNS(ns.ows, "Keywords")[0];
  if (!keywords) return [];
  
  return Array.from(keywords.getElementsByTagNameNS(ns.ows, "Keyword"))
      .map(keyword => keyword.textContent);
}

function parseWGS84BoundingBox(element, ns) {
  const bbox = element.getElementsByTagNameNS(ns.ows, "WGS84BoundingBox")[0];
  if (!bbox) return null;

  const lowerCorner = getElementTextNS(bbox, ns.ows, "LowerCorner").split(" ").map(Number);
  const upperCorner = getElementTextNS(bbox, ns.ows, "UpperCorner").split(" ").map(Number);

  return {
      lowerCorner,
      upperCorner
  };
}

function parseStyles(layer, ns) {
  const styles = layer.getElementsByTagNameNS(ns.wmts, "Style");
  return Array.from(styles).map(style => ({
      identifier: getElementTextNS(style, ns.ows, "Identifier"),
      isDefault: style.getAttribute("isDefault") === "true",
      legendURL: parseLegendURL(style, ns)
  }));
}

function parseTileMatrixSetLinks(layer, ns) {
  const links = layer.getElementsByTagNameNS(ns.wmts, "TileMatrixSetLink");
  return Array.from(links).map(link => ({
      tileMatrixSet: getElementTextNS(link, ns.wmts, "TileMatrixSet"),
      tileMatrixSetLimits: parseTileMatrixSetLimits(link, ns)
  }));
}

function parseResourceUrls(layer, ns) {
  const resourceUrls = layer.getElementsByTagNameNS(ns.wmts, "ResourceURL");
  return Array.from(resourceUrls).map(url => ({
      format: url.getAttribute("format"),
      resourceType: url.getAttribute("resourceType"),
      template: url.getAttribute("template")
  }));
}

function parseDimensions(layer, ns) {
  const dimensions = layer.getElementsByTagNameNS(ns.wmts, "Dimension");
  return Array.from(dimensions).map(dimension => ({
      identifier: getElementTextNS(dimension, ns.ows, "Identifier"),
      default: getElementTextNS(dimension, ns.wmts, "Default"),
      values: Array.from(dimension.getElementsByTagNameNS(ns.wmts, "Value"))
          .map(value => value.textContent)
  }));
}

function getProviderSite(element, ns) {
    const providerSite = element.getElementsByTagNameNS(ns.ows, "ProviderSite")[0];
    return providerSite ? providerSite.getAttribute("xlink:href") : null;
}

function parseServiceContact(element, ns) {
    const contact = element.getElementsByTagNameNS(ns.ows, "ServiceContact")[0];
    if (!contact) return null;

    return {
        individualName: getElementTextNS(contact, ns.ows, "IndividualName"),
        positionName: getElementTextNS(contact, ns.ows, "PositionName"),
        contactInfo: parseContactInfo(contact, ns)
    };
}

function parseContactInfo(element, ns) {
    const contactInfo = element.getElementsByTagNameNS(ns.ows, "ContactInfo")[0];
    if (!contactInfo) return null;

    return {
        phone: parsePhone(contactInfo, ns),
        address: parseAddress(contactInfo, ns),
        hoursOfService: getElementTextNS(contactInfo, ns.ows, "HoursOfService"),
        contactInstructions: getElementTextNS(contactInfo, ns.ows, "ContactInstructions")
    };
}

function parsePhone(element, ns) {
    const phone = element.getElementsByTagNameNS(ns.ows, "Phone")[0];
    if (!phone) return null;

    return {
        voice: getElementTextNS(phone, ns.ows, "Voice"),
        facsimile: getElementTextNS(phone, ns.ows, "Facsimile")
    };
}

function parseAddress(element, ns) {
    const address = element.getElementsByTagNameNS(ns.ows, "Address")[0];
    if (!address) return null;

    return {
        deliveryPoint: getElementTextNS(address, ns.ows, "DeliveryPoint"),
        city: getElementTextNS(address, ns.ows, "City"),
        administrativeArea: getElementTextNS(address, ns.ows, "AdministrativeArea"),
        postalCode: getElementTextNS(address, ns.ows, "PostalCode"),
        country: getElementTextNS(address, ns.ows, "Country"),
        electronicMailAddress: getElementTextNS(address, ns.ows, "ElectronicMailAddress")
    };
}

function parseLegendURL(style, ns) {
    const legendURL = style.getElementsByTagNameNS(ns.wmts, "LegendURL")[0];
    if (!legendURL) return null;

    return {
        format: legendURL.getAttribute("format"),
        href: legendURL.getAttribute("xlink:href"),
        width: parseInt(legendURL.getAttribute("width")),
        height: parseInt(legendURL.getAttribute("height"))
    };
}

function parseTileMatrixSetLimits(link, ns) {
    const limits = link.getElementsByTagNameNS(ns.wmts, "TileMatrixSetLimits")[0];
    if (!limits) return null;

    return Array.from(limits.getElementsByTagNameNS(ns.wmts, "TileMatrixLimits"))
        .map(limit => ({
            tileMatrix: getElementTextNS(limit, ns.wmts, "TileMatrix"),
            minTileRow: parseInt(getElementTextNS(limit, ns.wmts, "MinTileRow")),
            maxTileRow: parseInt(getElementTextNS(limit, ns.wmts, "MaxTileRow")),
            minTileCol: parseInt(getElementTextNS(limit, ns.wmts, "MinTileCol")),
            maxTileCol: parseInt(getElementTextNS(limit, ns.wmts, "MaxTileCol"))
        }));
}

function parseFormats(layer, ns) {
    const formats = layer.getElementsByTagNameNS(ns.wmts, "Format");
    return Array.from(formats).map(format => format.textContent);
}

function parseDCP(operation, ns) {
    const http = operation.getElementsByTagNameNS(ns.ows, "HTTP")[0];
    if (!http) return null;

    return {
        get: parseRequestMethod(http, "Get", ns),
        post: parseRequestMethod(http, "Post", ns)
    };
}

function parseRequestMethod(http, method, ns) {
    const methodElement = http.getElementsByTagNameNS(ns.ows, method)[0];
    if (!methodElement) return null;

    return {
        href: methodElement.getAttribute("xlink:href"),
        constraints: parseConstraints(methodElement, ns)
    };
}

function parseConstraints(element, ns) {
    const constraints = element.getElementsByTagNameNS(ns.ows, "Constraint");
    const result = {};

    Array.from(constraints).forEach(constraint => {
        const name = constraint.getAttribute("name");
        const allowedValues = constraint.getElementsByTagNameNS(ns.ows, "AllowedValues")[0];
        if (allowedValues) {
            result[name] = Array.from(allowedValues.getElementsByTagNameNS(ns.ows, "Value"))
                .map(value => value.textContent);
        }
    });

    return result;
}
