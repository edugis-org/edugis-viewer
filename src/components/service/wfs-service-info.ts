// wfs-service-info.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ServiceInfoType } from './map-service-info';
import { translate as t } from '../../i18n.js';

@customElement('wfs-service-info')
export class WfsServiceInfo extends LitElement {
  @property({ type: Object })
  serviceInfo: ServiceInfoType = {};
  addingFeatureType = false;
  
  static styles = css`
    .wfs-info {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
      background-color: #f9f9f9;
      margin-top: 10px;
    }
    
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .service-title {
      font-size: 1.2em;
      font-weight: bold;
      color: #2e7dba;
    }
    
    .service-badge {
      background-color: #2e7dba;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8em;
    }
    
    .service-abstract {
      margin: 8px 0;
      color: #666;
      font-style: italic;
      max-height: 60px;
      overflow-y: auto;
      font-size: 0.9em;
    }
    
    .service-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
      margin: 12px 0;
    }
    
    .info-item {
      background-color: white;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #eee;
    }
    
    .info-label {
      font-size: 0.75em;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    
    .info-value {
      font-size: 0.9em;
      font-weight: bold;
      color: #333;
    }
    
    .feature-types-section {
      margin-top: 16px;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .section-title {
      font-weight: bold;
      font-size: 1em;
    }
    
    .feature-type-count {
      color: #666;
      font-size: 0.9em;
    }
    
    .feature-types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 8px;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .feature-type-item {
      padding: 12px;
      border: 1px solid #eee;
      border-radius: 4px;
      background-color: white;
      transition: background-color 0.2s;
    }
    
    .feature-type-item:hover {
      background-color: #f0f7fd;
    }
    
    .feature-type-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    
    .feature-type-title {
      font-weight: bold;
      font-size: 0.95em;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      margin-right: 8px;
    }
    
    .geometry-type-badge {
      background-color: #5cb85c;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75em;
      white-space: nowrap;
    }
    
    .feature-type-name {
      font-family: monospace;
      font-size: 0.8em;
      color: #666;
      margin-bottom: 6px;
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
    }
    
    .feature-type-abstract {
      font-size: 0.85em;
      color: #666;
      max-height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      margin-bottom: 8px;
    }
    
    .feature-type-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.8em;
    }
    
    .detail-item {
      color: #555;
    }
    
    .detail-label {
      font-weight: bold;
    }
    
    .bbox-info {
      font-size: 0.75em;
      color: #666;
      margin-bottom: 8px;
      font-family: monospace;
      background-color: #f8f9fa;
      padding: 4px;
      border-radius: 3px;
    }
    
    .add-button {
      background-color: #2e7dba;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
      width: 100%;
    }
    
    .add-button:hover {
      background-color: #246499;
    }
    
    .no-feature-types {
      color: #666;
      font-style: italic;
      padding: 16px;
      text-align: center;
    }
    
    .output-formats {
      margin: 8px 0;
      font-size: 0.85em;
    }
    
    .format-badge {
      display: inline-block;
      background-color: #e8f4f8;
      color: #2e7dba;
      border-radius: 3px;
      padding: 2px 4px;
      margin: 1px;
      font-size: 0.75em;
      border: 1px solid #d0e7f0;
    }
    
    .geojson-available {
      background-color: #d4edda;
      color: #155724;
      border-color: #c3e6cb;
    }
  `;
  
  render() {
    if (!this.serviceInfo || !this.serviceInfo.capabilities) {
      return html`<div>Loading WFS service information...</div>`;
    }
    
    const capabilities = this.serviceInfo.capabilities;
    const service = capabilities.serviceIdentification || {};
    const outputFormats = capabilities.operationsMetadata?.GetFeature?.parameters?.outputFormat?.allowedValues || [];
    const featureTypes = capabilities.featureTypeList || [];
    return html`
      <div class="wfs-info">
        <div class="service-header">
          <div class="service-title">${service.title || 'WFS Service'}</div>
          <div class="service-badge">WFS ${capabilities.version || '2.0.0'}</div>
        </div>
        
        ${service.abstract ? html`
          <div class="service-abstract">${service.abstract}</div>
        ` : ''}
        
        ${this._renderServiceInfo(service, capabilities)}
        
        <div class="feature-types-section">
          <div class="section-header">
            <div class="section-title">${t('lfs: Available Feature Types')}</div>
            <div class="feature-type-count">(${featureTypes.length})</div>
          </div>
          
          ${featureTypes.length === 0 
            ? html`<div class="no-feature-types">No feature types available</div>` 
            : html`
                <div class="feature-types-grid">
                  ${featureTypes.map(featureType => this._renderFeatureTypeItem(featureType, outputFormats))}
                </div>
              `
          }
        </div>
      </div>
    `;
  }
  
  _renderServiceInfo(service, capabilities) {
    const items = [];
    
    if (service.serviceType) {
      items.push({ label: 'Service Type', value: service.serviceType });
    }
    
    if (capabilities.version) {
      items.push({ label: 'Version', value: capabilities.version });
    }
    
    if (service.fees) {
      items.push({ label: 'Fees', value: service.fees });
    }
    
    if (typeof service.accessConstraints === 'string') {
      items.push({ label: 'Access', value: service.accessConstraints });
    } else if (Array.isArray(service.accessConstraints)) {
      items.push({ label: 'Access', value: service.accessConstraints.join(', ') });      
    }
    
    if (items.length === 0) return html``;
    
    return html`
      <div class="service-info-grid">
        ${items.map(item => html`
          <div class="info-item">
            <div class="info-label">${item.label}</div>
            <div class="info-value">${item.value}</div>
          </div>
        `)}
      </div>
    `;
  }
  
  _renderFeatureTypeItem(featureType, outputFormats) {
    const name = featureType.name || featureType.Name || '';
    const title = featureType.title || featureType.Title || name || t('lfs: Unnamed Feature Type');
    const abstract = featureType.abstract || featureType.Abstract || '';
    const geometryType = this._getGeometryType(featureType);
    const hasGeoJSON = this._hasGeoJSONSupport(featureType, outputFormats);
    
    return html`
      <div class="feature-type-item">
        <div class="feature-type-header">
          <div class="feature-type-title" title="${title}">${title}</div>
          ${geometryType ? html`<div class="geometry-type-badge">${geometryType}</div>` : ''}
        </div>
        
        <div class="feature-type-name">${name}</div>
        
        ${abstract ? html`
          <div class="feature-type-abstract" title="${abstract}">${abstract}</div>
        ` : ''}
        
        ${this._renderFeatureTypeDetails(featureType)}
        
        ${this._renderBoundingBox(featureType)}
        
        ${this._renderOutputFormats(featureType, hasGeoJSON)}
        
        <button class="add-button" 
                @click=${() => this._addFeatureType(featureType)}
                ?disabled=${!hasGeoJSON}>
          ${hasGeoJSON ? t('lfs: Add as GeoJSON Layer') : t('lfs: GeoJSON not supported')}
        </button>
      </div>
    `;
  }
  
  _renderFeatureTypeDetails(featureType) {
    const details = [];
    
    if (featureType.defaultCRS || featureType.defaultSRS) {
      details.push({
        label: 'Default CRS',
        value: featureType.defaultCRS || featureType.defaultSRS
      });
    }
    
    if (featureType.otherCRS && featureType.otherCRS.length > 0) {
      details.push({
        label: 'Other CRS',
        value: `${featureType.otherCRS.length} available`
      });
    }
    
    if (details.length === 0) return html``;
    
    return html`
      <div class="feature-type-details">
        ${details.map(detail => html`
          <div class="detail-item">
            <span class="detail-label">${detail.label}:</span> ${detail.value}
          </div>
        `)}
      </div>
    `;
  }
  
  _renderBoundingBox(featureType) {
    const bbox = featureType.wgs84BoundingBox || featureType.boundingBox;
    if (!bbox) return html``;
    
    let bboxText = '';
    if (bbox.lowerCorner && bbox.upperCorner) {
      // WFS 2.0 format
      const lower = bbox.lowerCorner;
      const upper = bbox.upperCorner;
      bboxText = `[${lower[0]}, ${lower[1]}, ${upper[0]}, ${upper[1]}]`;
    } else if (bbox.minx !== undefined) {
      // Alternative format
      bboxText = `[${bbox.minx}, ${bbox.miny}, ${bbox.maxx}, ${bbox.maxy}]`;
    }
    
    if (!bboxText) return html``;
    
    return html`
      <div class="bbox-info">
        <strong>Bounding Box:</strong> ${bboxText}
      </div>
    `;
  }
  
  _renderOutputFormats(featureType, hasGeoJSON) {
    const formats = featureType.outputFormats || [];
    if (formats.length === 0) return html``;
    
    return html`
      <div class="output-formats">
        <strong>Output Formats:</strong><br>
        ${formats.map(format => html`
          <span class="format-badge ${this._isGeoJSONFormat(format) ? 'geojson-available' : ''}">${format}</span>
        `)}
      </div>
    `;
  }
  
  _getGeometryType(featureType) {
    // Try to extract geometry type from various possible locations
    if (featureType.geometryType) {
      return featureType.geometryType;
    }
    
    // Look in keywords for geometry hints
    if (featureType.keywords) {
      const geometryKeywords = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'Geometry'];
      for (const keyword of geometryKeywords) {
        if (featureType.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))) {
          return keyword;
        }
      }
    }
    
    // Default based on common patterns in name/title
    const nameTitle = (featureType.name + ' ' + (featureType.title || '')).toLowerCase();
    if (nameTitle.includes('point')) return 'Point';
    if (nameTitle.includes('line')) return 'LineString';
    if (nameTitle.includes('polygon') || nameTitle.includes('area')) return 'Polygon';
    
    return 'Geometry';
  }
  
  _hasGeoJSONSupport(featureType, outputFormats) {
    const formats = featureType.outputFormats || outputFormats || [];
    return formats.some(format => this._isGeoJSONFormat(format)) || featureType.geoJsonURL;
  }
  
  _isGeoJSONFormat(format) {
    const lowerFormat = format.toLowerCase();
    return lowerFormat.includes('json') || 
           lowerFormat.includes('geojson') || 
           lowerFormat === 'application/json' ||
           lowerFormat === 'application/geo+json';
  }
  
  async analyzeGeoJSONURL(url) {
    const result = {
      error: null,
      types: []
    };
    try {
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        result.error = `url ${url} returned status ${response.status}`;
        return result;
      }
      
      const geoJson = await response.json();
      if (!geoJson || !geoJson.features || !Array.isArray(geoJson.features)) {
        result.error = `Invalid GeoJSON format at ${url}`;
        return result;
      }
      const types = new Set();
      for (const feature of geoJson.features) {
        const type = feature.geometry?.type;
        if (type) {
          if (type.toLowerCase().includes('point')) {
            types.add('Point');
          } else if (type.toLowerCase().includes('line')) {
            types.add('LineString');
          } else if (type.toLowerCase().includes('polygon')) {
            types.add('Polygon');
          }
        }
      }
      result.types = Array.from(types);
      if (result.types.length === 0) {
        result.error = `Empty or no valid geometry types at ${url}`;
      }
      return result;
    } catch (error) {
      console.error('Error analyzing GeoJSON URL:', error);
      return result;
    }
  }
  
  async _addFeatureType(featureType) {
    if (!this.addingFeatureType) {
      this.addingFeatureType = true;
    } else {
      return; // Prevent multiple clicks
    }
    const capabilities = this.serviceInfo.capabilities;
    const service = capabilities.serviceIdentification || {};
    
    // Create layer information
    const layer = {
      name: featureType.name,
      title: featureType.title || featureType.name,
      abstract: featureType.abstract || '',
      identifier: featureType.name,
      geometryType: this._getGeometryType(featureType),
      featureType: featureType
    };
    
    // Calculate bbox if available
    let bbox = [];
    const wgs84BBox = featureType.wgs84BoundingBox || featureType.boundingBox;
    if (wgs84BBox) {
      if (wgs84BBox.lowerCorner && wgs84BBox.upperCorner) {
        // WFS 2.0 format
        const lower = wgs84BBox.lowerCorner;
        const upper = wgs84BBox.upperCorner;
        bbox = [lower[0], lower[1], upper[0], upper[1]];
      } else if (wgs84BBox.minx !== undefined) {
        // Alternative format
        bbox = [wgs84BBox.minx, wgs84BBox.miny, wgs84BBox.maxx, wgs84BBox.maxy];
      }
    }
        
    const geoJsonURL = this._constructGeoJSONURL(featureType.name, capabilities);
    const analysis = await this.analyzeGeoJSONURL(geoJsonURL);
    if (analysis.error) {
      alert(analysis.error);
      this.addingFeatureType = false;
      return;
    }

    const outputServiceInfo = {...this.serviceInfo};
    outputServiceInfo.type = 'GeoJSON';
    outputServiceInfo.serviceURL = geoJsonURL
    
    for (const type of analysis.types) {
      const layerEvent = {
        detail: { 
          type: 'GeoJSON',
          serviceInfo: JSON.parse(JSON.stringify(outputServiceInfo)),
          layer,
          dataUrl: geoJsonURL,
          bbox: bbox,
          featureTypeName: featureType.name,
          version: capabilities.version || '2.0.0',
          mapboxType: type.toLowerCase() === 'point' ? 'circle' : type.toLowerCase() === 'linestring' ? 'line' : 'fill'
        },
        bubbles: true,
        composed: true
      }
      this.dispatchEvent(new CustomEvent('add-layer', layerEvent));
      if (type === 'Polygon') { // also add as line layer
        layerEvent.detail = {...layerEvent.detail, mapboxType: 'line'};
        this.dispatchEvent(new CustomEvent('add-layer', layerEvent));
      }
    }
    this.addingFeatureType = false;
  }
  
  jsonOutputFormat(formats){
    if (!formats || formats.length === 0) {
      return 'application/json';
    }
    for (const format of formats) {
      const lowerFormat = format.toLowerCase();
      if (lowerFormat.includes('geojson') && !lowerFormat.includes('zip')) {
        return format;
      }
    }
    for (const format of formats) {
      const lowerFormat = format.toLowerCase();
      if (lowerFormat.includes('json') && !lowerFormat.includes('zip')) {
        return format;
      }
    }
    return 'application/json';
  }


  _constructGeoJSONURL(featureTypeName, capabilities) {
    try {
      const baseURL = this.serviceInfo.serviceURL;
      const urlObj = new URL(baseURL);
      const urlParams = new URLSearchParams();
      
      urlParams.set('service', 'WFS');
      urlParams.set('request', 'GetFeature');
      urlParams.set('version', capabilities.version || '2.0.0');
      urlParams.set('typeName', featureTypeName);
      urlParams.set('outputFormat', this.jsonOutputFormat(capabilities.operationsMetadata?.GetFeature?.parameters?.outputFormat?.allowedValues));
      urlParams.set('srsName', 'EPSG:4326');
      
      urlObj.search = urlParams.toString();
      return urlObj.href;
    } catch (error) {
      console.error('Error constructing GeoJSON URL:', error);
      return null;
    }
  }
}