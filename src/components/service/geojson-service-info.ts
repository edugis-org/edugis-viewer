// geojson-service-info.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ServiceInfoType } from './map-service-info';
import { translate as t } from '../../i18n.js';

// Extended interface for GeoJSON service info
interface GeoJSONServiceInfoType extends ServiceInfoType {
  serviceTitle?: string;
}

@customElement('geojson-service-info')
export class GeoJsonServiceInfo extends LitElement {
  @property({ type: Object })
  serviceInfo: GeoJSONServiceInfoType = {};
  
  static styles = css`
    .geojson-info {
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
    
    .source-type-badge {
      background-color: #5cb85c;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75em;
      margin-left: 8px;
    }
    
    .service-url {
      margin: 8px 0;
      color: #666;
      font-family: monospace;
      font-size: 0.85em;
      background-color: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      word-break: break-all;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      margin: 12px 0;
    }
    
    .stat-item {
      background-color: white;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #eee;
      text-align: center;
    }
    
    .stat-value {
      font-size: 1.1em;
      font-weight: bold;
      color: #2e7dba;
    }
    
    .stat-label {
      font-size: 0.8em;
      color: #666;
      margin-top: 2px;
    }
    
    .geometry-types {
      margin: 8px 0;
    }
    
    .geometry-type-badge {
      display: inline-block;
      background-color: #e8f4f8;
      color: #2e7dba;
      border-radius: 4px;
      padding: 2px 6px;
      margin-right: 4px;
      margin-bottom: 4px;
      font-size: 0.8em;
      border: 1px solid #d0e7f0;
    }
    
    .properties-section {
      margin: 12px 0;
    }
    
    .section-title {
      font-weight: bold;
      margin-bottom: 6px;
      font-size: 0.9em;
    }
    
    .properties-list {
      max-height: 80px;
      overflow-y: auto;
      background-color: white;
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 6px;
    }
    
    .property-item {
      display: inline-block;
      background-color: #f8f9fa;
      border-radius: 3px;
      padding: 2px 5px;
      margin: 1px;
      font-size: 0.8em;
      color: #555;
    }
    
    .layer-section {
      margin-top: 16px;
    }
    
    .layer-item {
      padding: 12px;
      border: 1px solid #eee;
      border-radius: 4px;
      background-color: white;
      margin-bottom: 8px;
    }
    
    .layer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .layer-title {
      font-weight: bold;
      font-size: 1em;
      color: #333;
    }
    
    .layer-type-badge {
      background-color: #6c757d;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75em;
      font-family: monospace;
    }
    
    .layer-description {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 8px;
    }
    
    .geometry-info {
      font-size: 0.85em;
      color: #555;
      margin-bottom: 12px;
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
    
    .wfs-info {
      margin-top: 8px;
      padding: 8px;
      background-color: #e8f4f8;
      border-radius: 4px;
      font-size: 0.85em;
    }
    
    .wfs-feature-types {
      margin-top: 6px;
    }
    
    .feature-type-item {
      background-color: white;
      padding: 4px 6px;
      margin: 2px;
      border-radius: 3px;
      display: inline-block;
      font-size: 0.8em;
    }
    
    .arcgis-info {
      margin-top: 8px;
      padding: 8px;
      background-color: #fff3cd;
      border-radius: 4px;
      font-size: 0.85em;
    }
    
    .arcgis-layers {
      margin-top: 6px;
    }
    
    .arcgis-layer-item {
      background-color: white;
      padding: 4px 6px;
      margin: 2px;
      border-radius: 3px;
      display: inline-block;
      font-size: 0.8em;
    }
    
    .no-data {
      color: #999;
      font-style: italic;
    }
  `;
  
  render() {
    if (!this.serviceInfo || !this.serviceInfo.capabilities) {
      return html`<div>Loading GeoJSON service information...</div>`;
    }
    
    const title = this.serviceInfo.serviceTitle || 'GeoJSON Service';
    const capabilities = this.serviceInfo.capabilities;
    const analysis = capabilities.analysis || {};
    const sourceType = capabilities.sourceType || 'direct';
    
    return html`
      <div class="geojson-info">
        <div class="service-header">
          <div class="service-title">
            ${title}
            <span class="source-type-badge">${this._getSourceTypeLabel(sourceType)}</span>
          </div>
          <div class="service-badge">GeoJSON</div>
        </div>
        
        <div class="service-url">${this.serviceInfo.serviceURL}</div>
        
        ${this._renderStats(analysis)}
        
        ${this._renderGeometryTypes(analysis.geometryTypes)}
        
        ${this._renderProperties(analysis.properties)}
        
        ${this._renderSourceSpecificInfo(capabilities)}
        
        ${this._renderLayerSection()}
      </div>
    `;
  }
  
  _renderStats(analysis) {
    const featureCount = analysis.featureCount || 0;
    const geometryTypeCount = analysis.geometryTypes?.length || 0;
    const propertyCount = analysis.properties?.length || 0;
    
    return html`
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${featureCount.toLocaleString()}</div>
          <div class="stat-label">Features</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${geometryTypeCount}</div>
          <div class="stat-label">Geometry Types</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${propertyCount}</div>
          <div class="stat-label">Properties</div>
        </div>
      </div>
    `;
  }
  
  _renderGeometryTypes(geometryTypes) {
    if (!geometryTypes || geometryTypes.length === 0) {
      return html``;
    }
    
    return html`
      <div class="geometry-types">
        <div class="section-title">Geometry Types:</div>
        <div>
          ${geometryTypes.map(type => 
            html`<span class="geometry-type-badge">${type}</span>`
          )}
        </div>
      </div>
    `;
  }
  
  _renderProperties(properties) {
    if (!properties || properties.length === 0) {
      return html``;
    }
    
    return html`
      <div class="properties-section">
        <div class="section-title">Properties (${properties.length}):</div>
        <div class="properties-list">
          ${properties.map(prop => 
            html`<span class="property-item">${prop}</span>`
          )}
        </div>
      </div>
    `;
  }
  
  _renderSourceSpecificInfo(capabilities) {
    const sourceType = capabilities.sourceType;
    
    if (sourceType === 'wfs' && capabilities.wfsCapabilities) {
      return this._renderWFSInfo(capabilities);
    }
    
    if (sourceType === 'arcgis' && capabilities.arcgisServiceInfo) {
      return this._renderArcGISInfo(capabilities);
    }
    
    return html``;
  }
  
  _renderLayerSection() {
    const capabilities = this.serviceInfo.capabilities;
    const analysis = capabilities.analysis || {};
    const geometryTypes = analysis.geometryTypes || [];
    
    // Group geometry types into map layer types
    const layerTypes = this._getMapLayerTypes(geometryTypes);
    
    if (layerTypes.length === 0) {
      return html`
        <div class="layer-section">
          <div class="no-data">No mappable geometry types found</div>
        </div>
      `;
    }
    
    const baseTitle = this._getBaseLayerTitle();
    const needsSuffix = layerTypes.length > 1 || this._hasPolygons(geometryTypes);
    
    return html`
      <div class="layer-section">
        <div class="section-title">Available Layers:</div>
        ${layerTypes.map(layerType => this._renderLayerItem(layerType, baseTitle, needsSuffix))}
      </div>
    `;
  }
  
  _getMapLayerTypes(geometryTypes) {
    const layerTypes = [];
    
    // Check for point types
    if (this._hasPoints(geometryTypes)) {
      layerTypes.push({
        type: 'points',
        mapboxType: 'circle',
        title: 'Points',
        description: 'Point and MultiPoint features displayed as circles',
        geometries: geometryTypes.filter(type => 
          type === 'Point' || type === 'MultiPoint'
        )
      });
    }
    
    // Check for line types
    if (this._hasLines(geometryTypes)) {
      layerTypes.push({
        type: 'lines',
        mapboxType: 'line',
        title: 'Lines',
        description: 'LineString and MultiLineString features displayed as lines',
        geometries: geometryTypes.filter(type => 
          type === 'LineString' || type === 'MultiLineString'
        )
      });
    }
    
    // Check for polygon types - create both fill and outline layers
    if (this._hasPolygons(geometryTypes)) {
      const polygonGeometries = geometryTypes.filter(type => 
        type === 'Polygon' || type === 'MultiPolygon'
      );
      
      layerTypes.push({
        type: 'polygons',
        mapboxType: 'fill',
        title: 'Areas',
        description: 'Polygon and MultiPolygon features displayed as filled areas',
        geometries: polygonGeometries
      });
      
      layerTypes.push({
        type: 'polygon-outlines',
        mapboxType: 'line',
        title: 'Area Outlines',
        description: 'Polygon and MultiPolygon features displayed as outline borders',
        geometries: polygonGeometries
      });
    }
    
    return layerTypes;
  }
  
  _hasPoints(geometryTypes) {
    return geometryTypes.some(type => type === 'Point' || type === 'MultiPoint');
  }
  
  _hasLines(geometryTypes) {
    return geometryTypes.some(type => type === 'LineString' || type === 'MultiLineString');
  }
  
  _hasPolygons(geometryTypes) {
    return geometryTypes.some(type => type === 'Polygon' || type === 'MultiPolygon');
  }
  
  _getBaseLayerTitle() {
    const serviceTitle = this.serviceInfo.serviceTitle || '';
    const serviceURL = this.serviceInfo.serviceURL || '';
    
    // For direct GeoJSON files, extract filename without extension
    if (this.serviceInfo.capabilities?.sourceType === 'direct') {
      try {
        const url = new URL(serviceURL);
        const pathname = url.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
        
        // Remove .json or .geojson extension
        const baseName = filename.replace(/\.(geo)?json$/i, '').replace(/_/g, ' ').trim();
        if (baseName && baseName !== filename) {
          return baseName;
        }
      } catch (e) {
        // Fall back to service title
      }
    }
    
    return serviceTitle || 'GeoJSON Layer';
  }
  
  _renderLayerItem(layerType, baseTitle, needsSuffix) {
    const title = needsSuffix ? `${baseTitle} - ${layerType.title}` : baseTitle;
    
    return html`
      <div class="layer-item">
        <div class="layer-header">
          <div class="layer-title">${title}</div>
          <div class="layer-type-badge">${layerType.mapboxType}</div>
        </div>
        <div class="layer-description">${layerType.description}</div>
        <div class="geometry-info">
          <strong>Geometries:</strong> ${layerType.geometries.join(', ')}
        </div>
        <button class="add-button" @click=${() => this._addLayer(layerType, title)}>${t('lfs: Add to Map')}</button>
      </div>
    `;
  }
  
  _renderWFSInfo(capabilities) {
    const selectedFeatureType = capabilities.selectedFeatureType;
    const availableFeatureTypes = capabilities.availableFeatureTypes || [];
    
    return html`
      <div class="wfs-info">
        <div class="section-title">WFS Service Information:</div>
        <div><strong>Selected Feature Type:</strong> ${selectedFeatureType?.title || selectedFeatureType?.name}</div>
        ${availableFeatureTypes.length > 1 ? html`
          <div class="wfs-feature-types">
            <strong>Available Feature Types:</strong>
            ${availableFeatureTypes.map(ft => 
              html`<span class="feature-type-item" title="${ft.abstract || ''}">${ft.title || ft.name}</span>`
            )}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  _renderArcGISInfo(capabilities) {
    const selectedLayer = capabilities.selectedLayer;
    const availableLayers = capabilities.availableLayers || [];
    
    return html`
      <div class="arcgis-info">
        <div class="section-title">ArcGIS Service Information:</div>
        <div><strong>Selected Layer:</strong> ${selectedLayer?.name} (ID: ${selectedLayer?.id})</div>
        ${availableLayers.length > 1 ? html`
          <div class="arcgis-layers">
            <strong>Available Layers:</strong>
            ${availableLayers.map(layer => 
              html`<span class="arcgis-layer-item" title="${layer.type || ''}">${layer.name} (${layer.id})</span>`
            )}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  _getSourceTypeLabel(sourceType) {
    switch (sourceType) {
      case 'direct': return 'Direct';
      case 'wfs': return 'WFS';
      case 'wfs_converted': return 'WFS';
      case 'wfs_inferred': return 'WFS';
      case 'arcgis': return 'ArcGIS';
      case 'arcgis_converted': return 'ArcGIS';
      default: return sourceType.toUpperCase();
    }
  }
  
  _getLayerDescription(analysis, sourceType) {
    const featureCount = analysis.featureCount || 0;
    const geometryTypes = analysis.geometryTypes || [];
    
    let description = `GeoJSON data containing ${featureCount.toLocaleString()} features`;
    
    if (geometryTypes.length > 0) {
      description += ` with ${geometryTypes.join(', ')} geometries`;
    }
    
    switch (sourceType) {
      case 'wfs':
      case 'wfs_converted':
      case 'wfs_inferred':
        description += ', sourced from a WFS service';
        break;
      case 'arcgis':
      case 'arcgis_converted':
        description += ', sourced from an ArcGIS Feature Service';
        break;
      case 'direct':
        description += ', from a direct GeoJSON source';
        break;
    }
    
    return description + '.';
  }
  
  _addLayer(layerType, title) {
    // Create a layer object for this specific geometry type
    const capabilities = this.serviceInfo.capabilities;
    const analysis = capabilities.analysis || {};
    
    const layer = {
      name: `geojson-${layerType.type}`,
      title: title,
      abstract: layerType.description,
      identifier: `geojson-${layerType.type}`,
      geometryType: layerType.type,
      mapboxType: layerType.mapboxType,
      geometries: layerType.geometries,
      featureCount: analysis.featureCount,
      properties: analysis.properties
    };
    
    // Calculate bbox if available
    let bbox = [];
    if (capabilities.bounds) {
      bbox = capabilities.bounds;
    }
    
    this.dispatchEvent(new CustomEvent('add-layer', {
      detail: { 
        type: 'GeoJSON',
        serviceInfo: JSON.parse(JSON.stringify(this.serviceInfo)),
        layer,
        dataUrl: this.serviceInfo.serviceURL,
        bbox: bbox,
        sourceType: capabilities.sourceType,
        geometryType: layerType.type,
        mapboxType: layerType.mapboxType
      },
      bubbles: true,
      composed: true
    }));
  }
}