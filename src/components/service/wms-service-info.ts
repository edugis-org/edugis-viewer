// wms-service-info.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ServiceInfoType } from './map-service-info';

@customElement('wms-service-info')
export class WmsServiceInfo extends LitElement {
  @property({ type: Object })
  serviceInfo: ServiceInfoType = {};
  
  static styles = css`
    .wms-info {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 16px;
      background-color: #f9f9f9;
    }
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
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
      margin: 12px 0;
      color: #666;
      font-style: italic;
    }
    .layer-list {
      margin-top: 16px;
    }
    .layer-item {
      padding: 8px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
    }
    .layer-item:hover {
      background-color: #f0f7fd;
    }
    .layer-title {
      font-weight: bold;
    }
    .layer-details {
      font-size: 0.9em;
      color: #666;
      margin-top: 4px;
    }
    .add-button {
      background-color: #2e7dba;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 4px;
    }
    .add-button:hover {
      background-color: #246499;
    }
  `;
  
  render() {
    if (!this.serviceInfo || !this.serviceInfo.capabilities) {
      return html`<div>Loading WMS service information...</div>`;
    }
    
    const title = this.serviceInfo.capabilities.service.title || 'WMS Service';
    const abstract = this.serviceInfo.capabilities.service.abstract || 'No description available';
    const layers = this.serviceInfo.capabilities.capability.layers || [];
    
    return html`
      <div class="wms-info">
        <div class="service-header">
          <div class="service-title">${title}</div>
          <div class="service-badge">WMS</div>
        </div>
        
        <div class="service-abstract">${abstract}</div>
        
        <div class="layer-list">
          <h3>Available Layers (${layers.length})</h3>
          ${layers.length === 0 
            ? html`<div>No layers available</div>` 
            : layers.map(layer => this._renderLayerItem(layer))
          }
        </div>
      </div>
    `;
  }
  
  _renderLayerItem(layer) {
    return html`
      <div class="layer-item">
        <div class="layer-title">${layer.name || layer.Title}</div>
        <div class="layer-details">${layer.abstract || layer.Abstract || 'No description'}</div>
        <button class="add-button" @click=${() => this._addLayer(layer)}>Add to Map</button>
      </div>
    `;
  }
  
  _addLayer(layer) {
    // Dispatch an event that the parent can listen for
    this.dispatchEvent(new CustomEvent('add-layer', {
      detail: { 
        type: 'WMS',
        serviceURL: this.serviceInfo.serviceURL,
        layer
      },
      bubbles: true,
      composed: true
    }));
  }
}