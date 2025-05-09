// Main types
export interface WMSCapabilities {
  version: string | null;
  service: Service | null;
  capability: Capability | null;
}

export interface Service {
  name: string | null;
  title: string | null;
  abstract: string | null;
  keywords: string[];
  onlineResource: string | null;
  contactInformation: ContactInformation | null;
  fees: string | null;
  accessConstraints: string | null;
}

export interface Capability {
  request: Request | null;
  layers: Layer[];
}

export interface Request {
  [key: string]: {
      formats: string[];
      url: string | null;
  };
}

export interface Layer {
  name: string | null;
  title: string | null;
  abstract: string | null;
  keywords: string[];
  crs: string[];
  boundingBox: BoundingBoxes | null;
  attribution: Attribution | null;
  styles: Style[];
  metadataURLs: MetadataURL[];
  dimensions: Dimension[];
  maxScaleDenominator: number | null;
  minScaleDenominator: number | null;
  queryable: boolean;
}

export interface BoundingBoxes {
  boundingBoxes: BoundingBox[];
  geographic: BoundingBox | null;
}

export interface BoundingBox {
  crs: string;
  minx: number;
  miny: number;
  maxx: number;
  maxy: number;
}

export interface Attribution {
  title: string | null;
  onlineResource: string | null;
  logoURL: LogoURL | null;
}

export interface LogoURL {
  width: number;
  height: number;
  format: string | null;
  onlineResource: string | null;
}

export interface Style {
  name: string | null;
  title: string | null;
  abstract: string | null;
  legendURL: string | null;
}

export interface MetadataURL {
  type: string | null;
  format: string | null;
  onlineResource: string | null;
}

export interface Dimension {
  name: string | null;
  units: string | null;
  unitSymbol: string | null;
  default: string | null;
  multipleValues: boolean;
  nearestValue: boolean;
  current: boolean;
  value: string | null;
}

export interface ContactInformation {
  contactPerson: string | null;
  contactOrganization: string | null;
  contactPosition: string | null;
  contactAddress: ContactAddress | null;
  contactVoiceTelephone: string | null;
  contactEmail: string | null;
}

export interface ContactAddress {
  type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postCode: string | null;
  country: string | null;
}

export interface DCPType {
  get: string | null;
  post: string | null;
}