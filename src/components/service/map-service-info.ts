// lit component to show service info
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface ServiceInfoType {
  type?: string | null;
  error?: string | null;
  capabilities?: object | null;
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
      border: 1px solid #ccc;
      padding: 16px;
      border-radius: 8px;
      background-color: #f9f9f9;
    }
    .service-name {
      font-size: 1.5em;
      font-weight: bold;
    }
  `;
  
  render() {
    switch (this.serviceInfo.type) {
      case null:
      case undefined:
        return html``;
      case 'WMS':
        return html`
          <div class="service-info">
            <div class="service-name">WMS Service</div>
            <div>Capabilities: ${this.serviceInfo.capabilities}</div>
          </div>`;
      default:
        return html`
          <div class="service-info">
            <div class="service-name">Unknown Service</div>
            <div>Error: ${this.serviceInfo.error}</div>
          </div>`;
    }
  }
}
