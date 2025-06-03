// xyz-service-info.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ServiceInfoType } from './map-service-info';

@customElement('xyz-service-info')
export class XYZServiceInfo extends LitElement {
  @property({ type: Object })
  serviceInfo: ServiceInfoType = {};
  
  static styles = css`
    .xyz-info {
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
    
    .service-details {
      margin: 8px 0;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 4px 0;
      font-size: 0.9em;
    }
    
    .detail-label {
      font-weight: bold;
      color: #333;
    }
    
    .detail-value {
      color: #666;
    }
    
    .format-badge {
      display: inline-block;
      background-color: #e8f4f8;
      color: #2e7dba;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 0.8em;
      border: 1px solid #d0e7f0;
    }
    
    .layer-section {
      margin-top: 16px;
    }
    
    .layer-item {
      padding: 12px;
      border: 1px solid #eee;
      border-radius: 4px;
      background-color: white;
    }
    
    .layer-title {
      font-weight: bold;
      font-size: 1em;
      margin-bottom: 8px;
      color: #333;
    }
    
    .layer-description {
      font-size: 0.9em;
      color: #666;
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
    
    .preview-info {
      margin-top: 8px;
      padding: 8px;
      background-color: #f8f9fa;
      border-radius: 4px;
      font-size: 0.85em;
      color: #666;
    }
  `;
  
  render() {
    if (!this.serviceInfo || !this.serviceInfo.capabilities) {
      return html`<div>Loading XYZ service information...</div>`;
    }
    
    const title = this.serviceInfo.title || 
                  this._extractTitleFromUrl(this.serviceInfo.serviceURL) || 
                  'XYZ Tile Service';
    
    const format = this.serviceInfo.capabilities?.format || 'Unknown format';
    const serviceUrl = this.serviceInfo.serviceURL || '';
    
    return html`
      <div class="xyz-info">
        <div class="service-header">
          <div class="service-title">${title}</div>
          <div class="service-badge">XYZ</div>
        </div>
        
        <div class="service-url">${serviceUrl}</div>
        
        <div class="service-details">
          <div class="detail-row">
            <span class="detail-label">Format:</span>
            <span class="format-badge">${this._formatDisplayName(format)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Type:</span>
            <span class="detail-value">XYZ Tile Service</span>
          </div>
        </div>
        
        <div class="layer-section">
          <div class="layer-item">
            <div class="layer-title">Tile Layer</div>
            <div class="layer-description">
              XYZ tile service providing raster tiles in ${this._formatDisplayName(format)} format.
            </div>
            <div class="preview-info">
              Preview tile: ${this._getPreviewTileUrl(serviceUrl)}
            </div>
            <button class="add-button" @click=${() => this._addLayer()}>Add to Map</button>
          </div>
        </div>
      </div>
    `;
  }
  
  _extractTitleFromUrl(url) {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return null;
    }
  }
  
  _formatDisplayName(contentType) {
    if (!contentType) return 'Unknown';
    
    // Extract format from content type
    if (contentType.includes('image/png')) return 'PNG';
    if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) return 'JPEG';
    if (contentType.includes('image/webp')) return 'WebP';
    if (contentType.includes('image/gif')) return 'GIF';
    if (contentType.includes('image/')) return contentType.split('/')[1].toUpperCase();
    
    return contentType;
  }
  
  _getPreviewTileUrl(serviceUrl) {
    if (!serviceUrl) return '';
    return serviceUrl.replace('{z}', '0').replace('{x}', '0').replace('{y}', '0');
  }
  
  _addLayer() {
    // Create a synthetic layer object for XYZ services
    const layer = {
      name: 'xyz-layer',
      title: this.serviceInfo.title || this._extractTitleFromUrl(this.serviceInfo.serviceURL) || 'XYZ Tile Layer',
      abstract: `XYZ tile service providing raster tiles in ${this._formatDisplayName(this.serviceInfo.capabilities?.format)} format.`,
      identifier: 'xyz-layer'
    };
    
    this.dispatchEvent(new CustomEvent('add-layer', {
      detail: { 
        type: 'XYZ',
        serviceInfo: JSON.parse(JSON.stringify(this.serviceInfo)),
        layer,
        tileUrl: this.serviceInfo.serviceURL,
        bbox: [] // XYZ services typically don't provide bbox info
      },
      bubbles: true,
      composed: true
    }));
  }
}