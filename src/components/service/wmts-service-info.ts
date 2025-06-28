// wmts-service-info.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ServiceInfoType } from './map-service-info';
import { translate as t } from '../../i18n.js';

@customElement('wmts-service-info')
export class WmtsServiceInfo extends LitElement {
  @property({ type: Object })
  serviceInfo: ServiceInfoType = {};
  
  static styles = css`
    .wmts-info {
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
    
    .layer-list {
      margin-top: 10px;
    }
    
    .layer-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .layer-list-title {
      font-weight: bold;
      font-size: 1em;
    }
    
    .layer-count {
      color: #666;
      font-size: 0.9em;
    }
    
    .matrix-set-info {
      margin-top: 4px;
      font-size: 0.85em;
      color: #666;
    }
    
    .matrix-set-badge {
      display: inline-block;
      background-color: #f0f0f0;
      border-radius: 4px;
      padding: 2px 6px;
      margin-right: 4px;
      margin-bottom: 4px;
      font-size: 0.8em;
    }
    
    .layer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 8px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .layer-item {
      padding: 8px;
      border: 1px solid #eee;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .layer-item:hover {
      background-color: #f0f7fd;
    }
    
    .layer-title {
      font-weight: bold;
      font-size: 0.95em;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .layer-details {
      font-size: 0.85em;
      color: #666;
      max-height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    
    .format-info {
      margin-top: 4px;
      font-size: 0.85em;
      color: #666;
    }
    
    .add-button {
      background-color: #2e7dba;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 6px;
      width: 100%;
      font-size: 0.9em;
    }
    
    .add-button:hover {
      background-color: #246499;
    }
    
    .no-layers {
      color: #666;
      font-style: italic;
      padding: 8px;
    }
  `;
  
  render() {
    if (!this.serviceInfo || !this.serviceInfo.capabilities) {
      return html`<div>Loading WMTS service information...</div>`;
    }
    
    const title = this.serviceInfo.capabilities?.serviceIdentification?.title || 
                  this.serviceInfo.capabilities?.ServiceIdentification?.Title || 
                  'WMTS Service';
    
    const abstract = this.serviceInfo.capabilities?.serviceIdentification?.abstract || 
                     this.serviceInfo.capabilities?.ServiceIdentification?.Abstract || 
                     'No description available';
    
    const layers = this.serviceInfo.capabilities?.contents?.layers || 
                   this.serviceInfo.capabilities?.Contents?.Layers || 
                   [];
    
    // Handle both camelCase and PascalCase variants in the capabilities
    const layerList = Array.isArray(layers) ? layers : [layers];
    
    return html`
      <div class="wmts-info">
        <div class="service-header">
          <div class="service-title">${title}</div>
          <div class="service-badge">WMTS</div>
        </div>
        
        <div class="service-abstract">${abstract}</div>
        
        <div class="layer-list">
          <div class="layer-list-header">
            <div class="layer-list-title">Available Layers</div>
            <div class="layer-count">(${layerList.length})</div>
          </div>
          
          ${layerList.length === 0 
            ? html`<div class="no-layers">No layers available</div>` 
            : html`
                <div class="layer-grid">
                  ${layerList.map(layer => this._renderLayerItem(layer))}
                </div>
              `
          }
        </div>
      </div>
    `;
  }
  
  _renderLayerItem(layer) {
    // Handle both camelCase and PascalCase property names
    const identifier = layer.identifier || layer.Identifier || '';
    const title = layer.title || layer.Title || identifier || 'Unnamed Layer';
    const abstract = layer.abstract || layer.Abstract || 'No description';
    
    // Get matrix sets associated with this layer
    const tileMatrixSets = layer.tileMatrixSetLinks || layer.TileMatrixSetLinks || [];
    const matrixSetLinks = Array.isArray(tileMatrixSets) ? tileMatrixSets : [tileMatrixSets];
    const matrixSetIds = matrixSetLinks.map(link => 
      link.tileMatrixSet || link.TileMatrixSet
    ).filter(Boolean);
    
    // Get formats for this layer
    const formats = layer.formats || layer.Formats || [];
    const formatList = Array.isArray(formats) ? formats : [formats];
    
    return html`
      <div class="layer-item">
        <div class="layer-title" title="${title}">${title}</div>
        <div class="layer-details" title="${abstract}">${abstract}</div>
        
        <div class="matrix-set-info">
          <div>Matrix Sets:</div>
          <div>
            ${matrixSetIds.length === 0 
              ? 'None' 
              : matrixSetIds.map(id => html`<span class="matrix-set-badge">${id}</span>`)}
          </div>
        </div>
        
        <div class="format-info">
          <div>Formats: ${formatList.length > 0 ? formatList[0] : 'None'}</div>
          ${formatList.length > 1 ? html`<div>+${formatList.length - 1} more</div>` : ''}
        </div>
        
        <button class="add-button" @click=${() => this._addLayer(layer)}>${t('lfs: Add to Map')}</button>
      </div>
    `;
  }
  
  _getTileUrl(serviceInfo, layer) {
    // utility function to check if the CRS is Web Mercator
    function isWebMercator(crs) {
      const normalizedCRS = crs.toLowerCase();
      if (normalizedCRS === 'epsg:3857' || normalizedCRS === 'epsg:900913') {
        return true;
      }
      // URN format with optional version: urn:ogc:def:crs:EPSG:[version:]code
      const urnPattern = /^urn:ogc:def:crs:epsg:(?:(?:\d+(?:\.\d+)?|):)?(3857|900913)$/i;
      return urnPattern.test(normalizedCRS);
    }
    // 1. get the tilematrix set for EPSG:3857
    let tileMatrixSetName = '';
    for (const tileMatrixSet in serviceInfo.capabilities?.contents?.tileMatrixSets || {}) {
      let supportedCRS = serviceInfo.capabilities?.contents?.tileMatrixSets[tileMatrixSet]?.supportedCRS || [];
      if (!Array.isArray(supportedCRS)) {
        supportedCRS = [supportedCRS];
      }
      if (supportedCRS.some(crs => isWebMercator(crs))) {
        tileMatrixSetName = serviceInfo.capabilities?.contents?.tileMatrixSets[tileMatrixSet]?.identifier || tileMatrixSet;
        break;
      }
    }
    // 2 get the template url for the layer tilematrix set
    let templateUrl = layer.resourceUrls?.filter(resource=> resource.resourceType === 'tile')[0]?.template;
    // 3 replace by {x}, {y}, {z} in the template url
    if (!templateUrl) {
      const templateUrl = new URL(serviceInfo.serviceURL)
      templateUrl.searchParams.set('tileMatrixSet', tileMatrixSetName);
      templateUrl.searchParams.set('TileMatrix', '{z}');
      templateUrl.searchParams.set('TileCol', '{x}');
      templateUrl.searchParams.set('TileRow', '{y}');
      templateUrl.searchParams.set('Service', 'WMTS');
      templateUrl.searchParams.set('Request', 'GetTile');
      templateUrl.searchParams.set('format', layer.formats?.[0]);
      templateUrl.searchParams.set('Layer', layer.identifier);
      templateUrl.searchParams.set('Version', serviceInfo.capabilities?.version || '1.0.0');
      templateUrl.searchParams.set('Style', layer.styles?.[0]?.identifier || 'default');
      return templateUrl.href.replace(/%7B/g, '{').replace(/%7D/g, '}');
    }
    let tileUrl = templateUrl.replace('{TileMatrixSet}', tileMatrixSetName);
    tileUrl = tileUrl.replace('{TileMatrix}', '{z}');
    tileUrl = tileUrl.replace('{TileRow}', '{y}');
    tileUrl = tileUrl.replace('{TileCol}', '{x}');
    return tileUrl;
  }

  _addLayer(layer) {
    // Dispatch an event that the parent can listen for
    const tileUrl = this._getTileUrl(this.serviceInfo, layer);
    if (!tileUrl) {
      alert(`Tile URL not found for layer: ${layer.identifier}`);
      return;
    }
    let bbox = [];
    if (layer.bounds?.lowerCorner && layer.bounds?.upperCorner) {
      layer.bounds.lowerCorner = layer.bounds.lowerCorner.map(coord => parseFloat(coord));
      bbox = [...layer.bounds.lowerCorner.map(coord=>parseFloat(coord)), ...layer.bounds.upperCorner.map(coord=>parseFloat(coord))];
    }
    let legendUrl = layer.styles?.[0]?.legendURL?.href || ''; 
    this.dispatchEvent(new CustomEvent('add-layer', {
      detail: { 
        type: 'WMTS',
        serviceInfo: JSON.parse(JSON.stringify(this.serviceInfo)),
        layer,
        tileUrl: tileUrl,
        legendUrl: legendUrl,
        bbox: bbox
      },
      bubbles: true,
      composed: true
    }));
  }
}