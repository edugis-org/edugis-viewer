import {LitElement, html, css} from 'lit';
import {loadService} from '../service/service.js';
import './service/map-service-info';

/**
* @polymer
* @extends HTMLElement
*/
export class MapDialogLayerExternal extends LitElement {
  static get properties() { 
    return { 
      active: {type: Boolean},
      serviceError: {type: String},
      loading: {type: Boolean},
      serviceURL: {type: String},
      serviceInfo: {type: Object},
      previousServices: {type: Array},
      showDropdown: {type: Boolean}
    }; 
  }
  
  static get styles() {
    return css`
      #overlay {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(204,204,204,0.6);
        z-index: 3; /* mapbox-gl uses z-index 2 for tools */
      }
      
      #dialog-window {
        display: flex;
        flex-direction: column;
        border: 1px solid lightgray;
        box-shadow: 4px 4px 9px 0px rgba(168,168,168,1);
        border-radius: 4px;
        max-width: 90%;
        height: 80%;
        background-color: white;  
      }
      
      #dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 2em;
        text-height: 2em;
        border-bottom: 1px solid whitesmoke;
        background-color: var(--theme-background-color, #2e7dba);
        color: var(--theme-text-color, #fff);
        padding-left: 5px;
      }
      
      #closebutton {
        padding: 2px 10px;
        margin: 2px;
        cursor: pointer;
        font-weight: bold;
        color: white;
      }
      
      #closebutton:hover {
        background-color: rgba(232, 17, 35, 0.9);
        color: white;
      }
      
      #dialog-content {
        overflow: auto;
        padding: 10px;
      }
      
      .form-group {
        margin-bottom: 12px;
      }
      
      .input-container {
        display: flex;
        gap: 8px;
        width: 100%;
      }
      
      input {
        flex: 1;
        padding: 6px 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      
      .dropdown-container {
        position: relative;
      }
      
      .dropdown-toggle {
        height: 100%;
        background-color: #f5f5f5;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 6px 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
      }
      
      .dropdown-toggle:hover {
        background-color: #e9e9e9;
      }
      
      .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        z-index: 10;
        min-width: 200px;
        max-height: 300px;
        overflow-y: auto;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        display: none;
      }
      
      .dropdown-menu.show {
        display: block;
      }
      
      .dropdown-item {
        padding: 8px 12px;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .dropdown-item:hover {
        background-color: #f0f7fd;
      }
      
      button {
        background-color: #2e7dba;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
      }
      
      button:hover {
        background-color: #246499;
      }
      
      button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
      
      .error {
        color: #d9534f;
        font-size: 14px;
        margin-top: 8px;
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
  }
  
  constructor() {
    super();
    this.active = false;
    this.serviceURL = "https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0";
    this.serviceError = "";
    this.serviceInfo = {};
    this.previousServices = [
      { title: "Landelijke Voorziening Beeldmateriaal", url: "https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0" },
      { title: "Kadaster BRT Achtergrondkaart", url: "https://service.pdok.nl/brt/achtergrondkaart/wms/v2_0" },
      { title: "BAG WMS", url: "https://service.pdok.nl/lv/bag/wms/v2_0" },
      { title: "Nationaal Georegister", url: "https://nationaalgeoregister.nl/geonetwork/srv/dut/csw" }
    ];
    this.showDropdown = false;
    
    // Click outside handler for dropdown
    this._handleClickOutside = this._handleClickOutside.bind(this);
  }
  
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._handleClickOutside);
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleClickOutside);
  }
  
  render() {
    if (!this.active) {
      return html``;
    }
    
    return html`
      <div id="overlay">
        <div id="dialog-window" @click="${e => e.stopPropagation()}">
          <div id="dialog-header">
            <div id="dialog-title">Add External Layer</div>
            <div @click="${e => this._close(e)}" id="closebutton">×</div>
          </div> <!-- dialog-header -->
          
          <div id="dialog-content">
            <form @submit="${e => e.preventDefault()}">
              <div class="form-group">
                ${this._renderFieldHeader('Service URL', 'serviceURL')}
                <div class="input-container">
                  <input
                    type="url"
                    id="serviceURL"
                    .value=${this.serviceURL}
                    @input=${(e) => this._handleInputChange(e)}
                    required
                    placeholder="Enter a valid service URL">
                  
                  <div class="dropdown-container">
                    <div class="dropdown-toggle" @click="${this._toggleDropdown}">
                      <span>▼</span>
                    </div>
                    ${this.showDropdown ? html`
                      <div class="dropdown-menu show">
                        ${this.previousServices.map(service => html`
                          <div class="dropdown-item" @click="${() => this._selectPreviousService(service.url)}">
                            ${service.title}
                          </div>
                        `)}
                      </div>
                    ` : ''}
                  </div>
                  
                  <button type="button"
                    @click=${() => this._loadService()}
                    ?disabled=${this.loading}>
                    Load
                  </button>
                </div>
                <div class="error">${this.serviceError}</div>
              </div> <!-- form-group -->
            </form>
            
            <map-service-info .serviceInfo=${this.serviceInfo} @add-layer="${this._handleAddLayer}"></map-service-info>
          </div> <!-- dialog-content -->
        </div> <!-- dialog-window -->
      </div> <!-- overlay -->
    `;
  }
  
  _renderFieldHeader(label, forId) {
    return html`
      <div class="field-header">
        <label class="field-label" for="${forId}">${label}</label>
      </div>
    `;
  }
  
  _close(event) {
    this.active = false;
    this.showDropdown = false;
  }
  
  _handleInputChange(e) {
    this.serviceURL = e.target.value;
  }
  
  _toggleDropdown(e) {
    e.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }
  
  _handleClickOutside(e) {
    const path = e.composedPath();
    const dropdown = this.shadowRoot?.querySelector('.dropdown-container');
    if (dropdown && !path.includes(dropdown) && this.showDropdown) {
      this.showDropdown = false;
      this.requestUpdate();
    }
  }
  
  _selectPreviousService(url) {
    this.serviceURL = url;
    this.showDropdown = false;
    this.requestUpdate();
  }
  
  _handleAddLayer(e) {
    // Forward the add-layer event to parent components
    const detail = e.detail;
    this.dispatchEvent(new CustomEvent('add-layer', {
      detail,
      bubbles: true,
      composed: true
    }));
    
    // Optionally close the dialog after adding a layer
    // this._close();
  }
  
  async _loadService() {
    this.serviceError = '';
    this.serviceInfo = {};
    
    if (this.serviceURL) {
      this.loading = true;
      
      try {
        const serviceInfo = await loadService(this.serviceURL);
        
        if (serviceInfo.error) {
          this.serviceError = serviceInfo.error;
        } else {
          // Update service URL if it was redirected
          this.serviceURL = serviceInfo.serviceURL || this.serviceURL;
          
          // Add to previously used services if not already there
          const existingIndex = this.previousServices.findIndex(s => s.url === serviceInfo.serviceURL);
          
          if (existingIndex === -1) {
            // Add new service to the beginning of the array
            this.previousServices = [
              { 
                title: serviceInfo.title || serviceInfo.serviceURL, 
                url: serviceInfo.serviceURL 
              },
              ...this.previousServices.slice(0, 9) // Keep max 10 items
            ];
          } else if (existingIndex > 0) {
            // Move existing service to the top of the list
            const service = this.previousServices[existingIndex];
            this.previousServices = [
              service,
              ...this.previousServices.slice(0, existingIndex),
              ...this.previousServices.slice(existingIndex + 1)
            ];
          }
        }
        
        this.serviceInfo = serviceInfo;
      } catch (err) {
        this.serviceError = `Failed to load service: ${err.message || 'Unknown error'}`;
      } finally {
        this.loading = false;
      }
    } else {
      this.serviceError = 'Please enter a valid service URL.';
    }
  }
  
  showDialog() {
    this.serviceError = '';
    this.serviceInfo = {};
    this.active = true;
  }
}

customElements.define('map-dialog-layer-external', MapDialogLayerExternal);