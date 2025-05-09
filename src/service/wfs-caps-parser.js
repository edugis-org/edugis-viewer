export function parseWFSCapabilities(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Invalid XML");
  }

  const root = xmlDoc.documentElement;
  const ns = {
      wfs: "http://www.opengis.net/wfs/2.0",
      ows: "http://www.opengis.net/ows/1.1",
      fes: "http://www.opengis.net/fes/2.0"
  };

  return {
      version: root.getAttribute("version"),
      serviceIdentification: parseServiceIdentification(root, ns),
      serviceProvider: parseServiceProvider(root, ns),
      operationsMetadata: parseOperationsMetadata(root, ns),
      featureTypeList: parseFeatureTypeList(root, ns),
      filter_capabilities: parseFilterCapabilities(root, ns)
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

function parseOperationsMetadata(root, ns) {
  const operations = root.getElementsByTagNameNS(ns.ows, "Operation");
  const result = {};

  Array.from(operations).forEach(operation => {
      const name = operation.getAttribute("name");
      result[name] = {
          dcp: parseDCP(operation, ns),
          parameters: parseOperationParameters(operation, ns),
          constraints: parseOperationConstraints(operation, ns)
      };
  });

  return result;
}

function parseFeatureTypeList(root, ns) {
  const featureTypeList = root.getElementsByTagNameNS(ns.wfs, "FeatureTypeList")[0];
  if (!featureTypeList) return null;

  return Array.from(featureTypeList.getElementsByTagNameNS(ns.wfs, "FeatureType"))
      .map(featureType => ({
          name: getElementTextNS(featureType, ns.wfs, "Name"),
          title: getElementTextNS(featureType, ns.wfs, "Title"),
          abstract: getElementTextNS(featureType, ns.wfs, "Abstract"),
          keywords: parseKeywords(featureType, ns),
          defaultCRS: getElementTextNS(featureType, ns.wfs, "DefaultCRS"),
          otherCRS: parseOtherCRS(featureType, ns),
          wgs84BoundingBox: parseWGS84BoundingBox(featureType, ns),
          metadata: parseMetadataURL(featureType, ns)
      }));
}

function parseFilterCapabilities(root, ns) {
  const filterCaps = root.getElementsByTagNameNS(ns.fes, "Filter_Capabilities")[0];
  if (!filterCaps) return null;

  return {
      conformance: parseFilterConformance(filterCaps, ns),
      spatialCapabilities: parseSpatialCapabilities(filterCaps, ns),
      temporalCapabilities: parseTemporalCapabilities(filterCaps, ns),
      functions: parseFunctions(filterCaps, ns),
      comparisionOperators: parseComparisonOperators(filterCaps, ns)
  };
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

function parseOperationParameters(operation, ns) {
  const parameters = operation.getElementsByTagNameNS(ns.ows, "Parameter");
  const result = {};

  Array.from(parameters).forEach(param => {
      const name = param.getAttribute("name");
      result[name] = {
          allowedValues: parseAllowedValues(param, ns)
      };
  });

  return result;
}

function parseOperationConstraints(operation, ns) {
  const constraints = operation.getElementsByTagNameNS(ns.ows, "Constraint");
  const result = {};

  Array.from(constraints).forEach(constraint => {
      const name = constraint.getAttribute("name");
      result[name] = {
          allowedValues: parseAllowedValues(constraint, ns)
      };
  });

  return result;
}

function parseAllowedValues(element, ns) {
  const allowedValues = element.getElementsByTagNameNS(ns.ows, "AllowedValues")[0];
  if (!allowedValues) return null;

  return Array.from(allowedValues.getElementsByTagNameNS(ns.ows, "Value"))
      .map(value => value.textContent);
}

function parseOtherCRS(featureType, ns) {
  const otherCRS = featureType.getElementsByTagNameNS(ns.wfs, "OtherCRS");
  return Array.from(otherCRS).map(crs => crs.textContent);
}

function parseMetadataURL(featureType, ns) {
  const metadata = featureType.getElementsByTagNameNS(ns.wfs, "MetadataURL");
  return Array.from(metadata).map(md => ({
      type: md.getAttribute("type"),
      href: md.getAttribute("xlink:href")
  }));
}

function parseFilterConformance(filterCaps, ns) {
  const conformance = filterCaps.getElementsByTagNameNS(ns.fes, "Conformance")[0];
  if (!conformance) return null;

  const constraints = conformance.getElementsByTagNameNS(ns.fes, "Constraint");
  const result = {};

  Array.from(constraints).forEach(constraint => {
      const name = constraint.getAttribute("name");
      result[name] = getElementTextNS(constraint, ns.fes, "DefaultValue") === "TRUE";
  });

  return result;
}

function parseSpatialCapabilities(filterCaps, ns) {
  const spatial = filterCaps.getElementsByTagNameNS(ns.fes, "Spatial_Capabilities")[0];
  if (!spatial) return null;

  return {
      geometryOperands: parseGeometryOperands(spatial, ns),
      spatialOperators: parseSpatialOperators(spatial, ns)
  };
}

function parseGeometryOperands(spatial, ns) {
  const operands = spatial.getElementsByTagNameNS(ns.fes, "GeometryOperand");
  return Array.from(operands).map(operand => operand.getAttribute("name"));
}

function parseSpatialOperators(spatial, ns) {
  const operators = spatial.getElementsByTagNameNS(ns.fes, "SpatialOperator");
  return Array.from(operators).map(operator => operator.getAttribute("name"));
}

function parseTemporalCapabilities(filterCaps, ns) {
  const temporal = filterCaps.getElementsByTagNameNS(ns.fes, "Temporal_Capabilities")[0];
  if (!temporal) return null;

  return {
      temporalOperands: parseTemporalOperands(temporal, ns),
      temporalOperators: parseTemporalOperators(temporal, ns)
  };
}

function parseFunctions(filterCaps, ns) {
  const functions = filterCaps.getElementsByTagNameNS(ns.fes, "Functions")[0];
  if (!functions) return null;

  return Array.from(functions.getElementsByTagNameNS(ns.fes, "Function"))
      .map(func => ({
          name: func.getAttribute("name"),
          returns: getElementTextNS(func, ns.fes, "Returns"),
          arguments: parseFunctionArguments(func, ns)
      }));
}

// Add these helper functions to the WFS capabilities parser
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
        onlineResource: getOnlineResource(contactInfo, ns),
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

function getOnlineResource(element, ns) {
    const onlineResource = element.getElementsByTagNameNS(ns.ows, "OnlineResource")[0];
    return onlineResource ? onlineResource.getAttribute("xlink:href") : null;
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

function parseTemporalOperands(temporal, ns) {
    const operands = temporal.getElementsByTagNameNS(ns.fes, "TemporalOperand");
    return Array.from(operands).map(operand => operand.getAttribute("name"));
}

function parseTemporalOperators(temporal, ns) {
    const operators = temporal.getElementsByTagNameNS(ns.fes, "TemporalOperator");
    return Array.from(operators).map(operator => operator.getAttribute("name"));
}

function parseFunctionArguments(func, ns) {
    const functionArgs = func.getElementsByTagNameNS(ns.fes, "Argument");
    return Array.from(functionArgs).map(arg => ({
        name: arg.getAttribute("name"),
        type: getElementTextNS(arg, ns.fes, "Type")
    }));
}

function parseWGS84BoundingBox(element, ns) {
    const bbox = element.getElementsByTagNameNS(ns.ows, "WGS84BoundingBox")[0];
    if (!bbox) return null;

    const lowerCorner = getElementTextNS(bbox, ns.ows, "LowerCorner");
    const upperCorner = getElementTextNS(bbox, ns.ows, "UpperCorner");

    return {
        lowerCorner: lowerCorner ? lowerCorner.split(" ").map(Number) : null,
        upperCorner: upperCorner ? upperCorner.split(" ").map(Number) : null
    };
}

function parseComparisonOperators(filterCaps, ns) {
    const comparison = filterCaps.getElementsByTagNameNS(ns.fes, "Comparison_Operators")[0];
    if (!comparison) return null;

    const operators = comparison.getElementsByTagNameNS(ns.fes, "ComparisonOperator");
    return Array.from(operators).map(operator => operator.getAttribute("name"));
}

// Also adding these related functions that might be needed for complete filter capabilities parsing
function parseScalarCapabilities(filterCaps, ns) {
    const scalar = filterCaps.getElementsByTagNameNS(ns.fes, "Scalar_Capabilities")[0];
    if (!scalar) return null;

    return {
        logicalOperators: hasLogicalOperators(scalar, ns),
        comparisonOperators: parseComparisonOperators(scalar, ns)
    };
}

function hasLogicalOperators(scalar, ns) {
    return scalar.getElementsByTagNameNS(ns.fes, "LogicalOperators").length > 0;
}

function parseIdCapabilities(filterCaps, ns) {
    const id = filterCaps.getElementsByTagNameNS(ns.fes, "Id_Capabilities")[0];
    if (!id) return null;

    return {
        resourceIdentifiers: Array.from(
            id.getElementsByTagNameNS(ns.fes, "ResourceIdentifier")
        ).map(ri => ri.getAttribute("name"))
    };
}