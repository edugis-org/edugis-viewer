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
      return html`<div>Loading WMS service information...</div>`;
    }
    
    const title = this.serviceInfo.capabilities?.service?.title || 'WMS Service';
    const abstract = this.serviceInfo.capabilities?.service?.abstract || 'No description available';
    const layers = this.serviceInfo.capabilities?.capability?.layers || [];
    
    return html`
      <div class="wms-info">
        <div class="service-header">
          <div class="service-title">${title}</div>
          <div class="service-badge">WMS</div>
        </div>
        
        <div class="service-abstract">${abstract}</div>
        
        <div class="layer-list">
          <div class="layer-list-header">
            <div class="layer-list-title">Available Layers</div>
            <div class="layer-count">(${layers.length})</div>
          </div>
          
          ${layers.length === 0 
            ? html`<div class="no-layers">No layers available</div>` 
            : html`
                <div class="layer-grid">
                  ${layers.map(layer => this._renderLayerItem(layer))}
                </div>
              `
          }
        </div>
      </div>
    `;
  }
  
  _renderLayerItem(layer) {
    const name = layer.name || layer.Name || '';
    const title = layer.title || layer.Title || name || 'Unnamed Layer';
    const abstract = layer.abstract || layer.Abstract || 'No description';
    
    return html`
      <div class="layer-item">
        <div class="layer-title" title="${title}">${title}</div>
        <div class="layer-details" title="${abstract}">${abstract}</div>
        <button class="add-button" @click=${() => this._addLayer(layer)}>Add to Map</button>
      </div>
    `;
  }
  
  _addLayer(layer) {
    // Dispatch an event that the parent can listen for
    let bbox = [];
    if (layer.boundingBox) {
      if (layer.boundingBox.geographic) {
        const geo = layer.boundingBox.geographic;
        bbox = [geo.minx, geo.miny, geo.maxx, geo.maxy];
      } else {
        const geo = layer.boundingBox.boundingBoxes?.filter(bbox=> bbox.crs === 'EPSG:4326' || bbox.crs === 'CRS:84')[0];
        if (geo) {
          bbox = [geo.minx, geo.miny, geo.maxx, geo.maxy];
        }        
      }
    }
    this.dispatchEvent(new CustomEvent('add-layer', {
      detail: { 
        type: 'WMS',
        serviceInfo: JSON.parse(JSON.stringify(this.serviceInfo)),
        layer,
        bbox
      },
      bubbles: true,
      composed: true
    }));
  }
}