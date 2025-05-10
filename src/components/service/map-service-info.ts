// map-service-info.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './wms-service-info';

// Service type interfaces
export interface ServiceInfoType {
  type?: string | null;
  error?: string | null;
  serviceURL?: string;
  capabilities?: any;
  title?: string;
  abstract?: string;
  layers?: any[];
}

@customElement('map-service-info')
export class MapServiceInfo extends LitElement {
  @property({ type: Object })
  serviceInfo: ServiceInfoType = {
    type: null,
    error: null,
    capabilities: null,
  };
  
  static styles = css`
    .service-info {
      margin-top: 16px;
      width: 100%;
    }
    .loader {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(0,0,0,0.1);
      border-radius: 50%;
      border-top-color: #2e7dba;
      animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .error-message {
      color: #d9534f;
      padding: 12px;
      border-left: 4px solid #d9534f;
      background-color: #f9f2f2;
      margin-top: 12px;
    }
  `;
  
  render() {
    if (!this.serviceInfo) {
      return html``;
    }

    if (this.serviceInfo.error) {
      return html`
        <div class="service-info">
          <div class="error-message">
            <strong>Error:</strong> ${this.serviceInfo.error}
          </div>
        </div>
      `;
    }

    switch (this.serviceInfo.type) {
      case null:
      case undefined:
        return html``;
      case 'WMS':
        return html`
          <div class="service-info">
            <wms-service-info .serviceInfo=${this.serviceInfo}></wms-service-info>
          </div>`;
      case 'WMTS':
        return html`
          <div class="service-info">
            <wmts-service-info .serviceInfo=${this.serviceInfo}></wmts-service-info>
          </div>`;
      case 'WFS':
        return html`
          <div class="service-info">
            <wfs-service-info .serviceInfo=${this.serviceInfo}></wfs-service-info>
          </div>`;
      default:
        return html`
          <div class="service-info">
            <generic-service-info .serviceInfo=${this.serviceInfo}></generic-service-info>
          </div>`;
    }
  }
}