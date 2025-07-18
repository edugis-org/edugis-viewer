import {LitElement, html, css} from 'lit';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n.js';
import {loadService} from '../service/service.js';
import './service/map-service-info';
import psl from 'psl';


function getBaseName(url) {
  try {
    const urlObj = new URL(url);
    // Use psl to get the base domain
    const parsed = psl.parse(urlObj.hostname);
    return parsed ? parsed.domain : urlObj.hostname;
  } catch (error) {
    console.error(`Error parsing URL: ${error.message}`);
    return url; // Fallback to the original URL if parsing fails
  }
}


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
        min-height: 120px;
        max-height: 80%;
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
        position: fixed;
        z-index: 10;
        min-width: 300px;
        max-width: 90%;
        max-height: 300px;
        overflow-y: auto;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      
      .dropdown-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .dropdown-item:last-child {
        border-bottom: none;
      }
      
      .dropdown-item-text {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-right: 16px;
      }
      
      .dropdown-item:hover {
        background-color: #f0f7fd;
      }
      
      .dropdown-item-remove {
        color: #d9534f;
        padding: 2px 6px;
        font-size: 12px;
        border-radius: 3px;
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      
      .dropdown-item-remove:hover {
        opacity: 1;
        background-color: #f9f2f2;
      }
      
      .empty-dropdown {
        padding: 8px 12px;
        color: #666;
        font-style: italic;
        text-align: center;
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
    //this.serviceURL = "https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0";
    this.serviceURL = "";
    this.serviceError = "";
    this.serviceInfo = {};
    this.previousServices = [];
    this.showDropdown = false;
    this.dropdownPosition = { top: 0, left: 0 };
    
    // Load saved services from localStorage
    this._loadSavedServices(); 
  }

  connectedCallback() {
    super.connectedCallback()
    this.languageChanged = this.languageChanged.bind(this);
    registerLanguageChangedListener(this.languageChanged);
  }
  disconnectedCallback() {
    super.disconnectedCallback()
    unregisterLanguageChangedListener(this.languageChanged);
  }
  languageChanged() {
    this.requestUpdate();
  }
  
  _loadSavedServices() {
    try {
      const savedServices = localStorage.getItem('mapServiceHistory');
      if (savedServices) {
        this.previousServices = JSON.parse(savedServices);
      } else {
        // Default services as fallback
        this.previousServices = [
          { title: "pdok.nl: Landelijke Voorziening Beeldmateriaal", url: "https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0" }
        ];
        this._saveServices();
      }
    } catch (e) {
      console.error("Error loading saved services:", e);
      this.previousServices = [];
    }
  }
  
  _saveServices() {
    try {
      localStorage.setItem('mapServiceHistory', JSON.stringify(this.previousServices));
    } catch (e) {
      console.error("Error saving services:", e);
    }
  }
  
  render() {
    if (!this.active) {
      return html``;
    }
    
    return html`
      <div id="overlay" @click="${(e)=>this._handleClickOutside(e)}">
        <div id="dialog-window">
          <div id="dialog-header">
            <div id="dialog-title">${t('lfs: Add External Layer')}</div>
            <div @click="${e => this._close(e)}" id="closebutton">×</div>
          </div> <!-- dialog-header -->
          
          <div id="dialog-content">
            <form @submit="${e => e.preventDefault()}">
              <div class="form-group">
                ${this._renderFieldHeader(t('lfs: Service URL'), 'serviceURL')}
                <div class="input-container">
                  <input
                    type="url"
                    id="serviceURL"
                    .value=${this.serviceURL}
                    @input=${(e) => this._handleInputChange(e)}
                    required
                    placeholder="${t('lfs: Enter a valid service URL')}">
                  
                  <div class="dropdown-container">
                    <div class="dropdown-toggle" @click="${this._toggleDropdown}">
                      <span>▼</span>
                    </div>
                  </div>
                  
                  <button type="button"
                    @click=${() => this._loadService()}
                    ?disabled=${this.loading}>
                    ${this.loading ? t('lfs: Loading...') : t('lfs: Load')}
                  </button>
                </div>
                <div class="error">${this.serviceError}</div>
              </div> <!-- form-group -->
            </form>
            
            ${this.showDropdown ? this._renderDropdown() : ''}
            
            <map-service-info .serviceInfo=${this.serviceInfo} @add-layer="${this._handleAddLayer}"></map-service-info>
          </div> <!-- dialog-content -->
        </div> <!-- dialog-window -->
      </div> <!-- overlay -->
    `;
  }
  
  _renderDropdown() {
    const style = `top: ${this.dropdownPosition.top}px; left: ${this.dropdownPosition.left}px; max-height: ${this.dropdownPosition.maxHeight}px;`;
    
    return html`
      <div class="dropdown-menu" style="${style}">
        ${this.previousServices.length === 0 ? 
          html`<div class="empty-dropdown">No saved services</div>` :
          this.previousServices.map(service => html`
            <div class="dropdown-item">
              <div class="dropdown-item-text" 
                  title="${service.title}"
                  @click="${() => this._selectPreviousService(service.url)}">
                ${service.title}
              </div>
              <div class="dropdown-item-remove" 
                  title="Remove from history"
                  @click="${(e) => this._removeService(e, service.url)}">
                ✕
              </div>
            </div>
          `)
        }
      </div>
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
    this.serviceInfo = {};
    this.serviceURL = e.target.value;
  }
  
  _toggleDropdown(e) {
    e.stopPropagation();
    
    if (!this.showDropdown) {
      // Calculate dropdown position
      const toggleButton = e.target.closest('.dropdown-toggle');
      const rect = toggleButton.getBoundingClientRect();
      
      // Get the dialog content element to calculate available space
      const dialogWindow = this.shadowRoot.querySelector('#dialog-window');
      const dialogRect = dialogWindow.getBoundingClientRect();
      
      // Get input container and URL input field for better positioning
      const inputContainer = this.shadowRoot.querySelector('.input-container');
      const inputRect = inputContainer.getBoundingClientRect();
      
      // Get the URL input field specifically to match its width
      const urlInput = this.shadowRoot.querySelector('#serviceURL');
      const urlInputRect = urlInput.getBoundingClientRect();
      
      // Calculate dropdown width based on the dialog width for maximum space
      const dialogContentWidth = dialogRect.width - 40; // Subtract margins
      const dropdownWidth = Math.min(dialogContentWidth * 0.9, Math.max(urlInputRect.width, 400));
      
      // Position dropdown initially aligned with input left edge
      let leftPos = inputRect.left;
      
      // Check right boundary - ensure dropdown stays within dialog
      if (leftPos + dropdownWidth > dialogRect.right - 20) {
        // Align right edges instead
        leftPos = dialogRect.right - dropdownWidth - 20;
      }
      
      // Ensure we don't go off the left edge either
      leftPos = Math.max(dialogRect.left + 10, leftPos);
      
      // Position dropdown below the toggle button
      this.dropdownPosition = {
        top: rect.bottom + 2,
        left: leftPos
      };
      
      // Calculate available space below the dropdown
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom - 10; // 10px bottom margin
      
      // Calculate available space above the dropdown
      const spaceAbove = rect.top - 10; // 10px top margin
      
      // Define a minimum height for the dropdown
      const minDropdownHeight = 100; // In pixels
      
      // Define a preferred maximum height (for very large spaces)
      const preferredMaxHeight = Math.min(400, Math.max(spaceBelow, spaceAbove)); 
      
      let maxHeight, dropdownTop;
      
      // Determine if dropdown should go below or above the button
      if (spaceBelow >= minDropdownHeight) {
        // Position below with calculated max height
        dropdownTop = rect.bottom + 2;
        maxHeight = Math.min(spaceBelow, preferredMaxHeight);
      } else if (spaceAbove >= minDropdownHeight) {
        // Position above with calculated max height
        dropdownTop = rect.top - 2 - Math.min(spaceAbove, preferredMaxHeight);
        maxHeight = Math.min(spaceAbove, preferredMaxHeight);
      } else {
        // Not enough space above or below, use the larger of the two
        if (spaceBelow >= spaceAbove) {
          dropdownTop = rect.bottom + 2;
          maxHeight = spaceBelow;
        } else {
          dropdownTop = Math.max(10, rect.top - 2 - spaceAbove);
          maxHeight = spaceAbove;
        }
      }
      
      // Update position with calculated values
      this.dropdownPosition = {
        top: dropdownTop,
        left: leftPos,
        maxHeight: maxHeight // Add maxHeight to the position object
      };
    }
    
    this.showDropdown = !this.showDropdown;
  }

  _handleClickOutside(e) {    
    if (!this.showDropdown) {
      return; // Do nothing if dropdown is not shown
    }
    
    // Get click path
    const path = e.composedPath();
    
    // Check if click is inside dropdown or toggle button
    const isClickInsideDropdown = path.some(el => 
      el.classList && (
        el.classList.contains('dropdown-toggle') || 
        el.classList.contains('dropdown-menu')
      )
    );
    
    if (!isClickInsideDropdown) {
      // Click was outside dropdown, so hide it
      this.showDropdown = false;
      this.requestUpdate();
    }
  }
  
  _selectPreviousService(url) {
    this.serviceURL = url;
    this.showDropdown = false;
    this._loadService();
  }
  
  _removeService(e, url) {
    e.stopPropagation(); // Prevent triggering selection
    
    this.previousServices = this.previousServices.filter(service => service.url !== url);
    this._saveServices();
    
    if (this.previousServices.length === 0) {
      this.showDropdown = false;
    }
    
    this.requestUpdate();
  }
  
  _handleAddLayer(e) {
    // Prevent default behavior    
    e.preventDefault();
    e.stopPropagation();
    // Forward the add-layer event to the dialog callback
    this.addLayerCallback(e);
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
          
          // Add to previously used services if not already there and if successful
          const existingIndex = this.previousServices.findIndex(s => s.url === serviceInfo.serviceURL);
          let title = getBaseName(serviceInfo.serviceURL) +': ' +
             serviceInfo.serviceTitle || serviceInfo.capabilities?.service?.title || serviceInfo.serviceURL;
          const serviceTitle = title;
          
          if (existingIndex === -1) {
            // Add new service to the beginning of the array
            this.previousServices = [
              { 
                title: serviceTitle,
                url: serviceInfo.serviceURL 
              },
              ...this.previousServices.slice(0, 19) // Keep max 20 items
            ];
            this._saveServices();
          } else if (existingIndex > 0) {
            // Move existing service to the top of the list
            const service = this.previousServices[existingIndex];
            // Update title in case it changed
            service.title = serviceTitle;
            this.previousServices = [
              service,
              ...this.previousServices.slice(0, existingIndex),
              ...this.previousServices.slice(existingIndex + 1)
            ];
            this._saveServices();
          }
        }
        
        this.serviceInfo = serviceInfo;
      } catch (err) {
        this.serviceError = `${t("lfs: Failed to load service:")} ${err.message || t('lfs: Unknown error')}`;
      } finally {
        this.loading = false;
      }
    } else {
      this.serviceError = t('lfs: Please enter a valid service URL.');
    }
  }
  
  showDialog(addLayerCallback) {
    this.addLayerCallback = addLayerCallback;
    this.serviceError = '';
    this.serviceInfo = {};
    this.active = true;
  }
}

customElements.define('map-dialog-layer-external', MapDialogLayerExternal);