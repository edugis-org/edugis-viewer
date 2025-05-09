import {LitElement, html,css} from 'lit';
import {loadService} from '../service/service.js';
import {MapServiceInfo} from './service/map-service-info';

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
        dialog-window:backdrop {
          background: rgba(0, 0, 0, 0.5);
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
          padding: 5px;
        }
       .input-with-button {
          display: flex;
          gap: 8px;
        }
       .error {
          color: #d9534f;
          font-size: 14px;
          margin-top: 8px;
        }
      `
  }
  constructor() {
      super();
      this.active = false;
      this.serviceURL = "https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0";
      this.serviceError = "";
      this.serviceInfo = {};
  }
  render() {
    if (!this.active) {
      return html``;
    }
    return html`
    <div id="overlay">
      <div id="dialog-window" @click="${e=>e.stopPropagation()}">
        <div id="dialog-header">
          <div id="dialog-title">Add External Layer</div>
          <div @click="${e=>this._close(e)}" id="closebutton">x</div>
        </div> <!-- dialog-header -->
        <div id="dialog-content">
          <form>
            <div class="form-group">
              ${this._renderFieldHeader('Service URL', 'url')}
              <div class="input-with-button">
                <input
                  type="url"
                  id="serviceURL"
                  .value=${this.serviceURL}
                  @input=${(e) => this._handleInputChange(e, 'serviceURL')}
                  required
                  placeholder="Enter a valid service URL">
                <button type="button"
                  @click=${() => this._loadService()}
                  ?disabled=${this.loading}>
                  Load
                </button>
              </div><!-- input-with-button -->
              <div class="error">${this.serviceError}</div>
            </div> <!-- form-group -->
          </form>
          <map-service-info .serviceInfo=${this.serviceInfo}></map-service-info>
        </div> <!-- dialog-content -->
      </div> <!-- dialog-window -->
    </div> <!-- overlay -->`
  }
  _renderFieldHeader(label, forId) {
    return html`
      <div class="field-header">
        <label class="field-label" for="${forId}">${label}</label>
      </div>
    `;
  }
  _close(event) {
    console.log(event.target);
    console.log(event.currentTarget);
    this.active = false;
    this.markdown = '';
  }
  _handleInputChange(e, property) {
    const input = e.target;
    //this._updateInput(input.value, property);
  }
  async _loadService() {
    this.serviceError = '';
    this.serviceInfo = {};
    const urlInput = this.shadowRoot.getElementById('serviceURL');
    const serviceURL = urlInput.value;
    if (serviceURL) {
      this.loading = true;
      this.serviceURL = serviceURL;      
      const serviceInfo = await loadService(this.serviceURL);
      if (serviceInfo.error) {
        this.serviceError = serviceInfo.error;
      }
      urlInput.value = serviceInfo.serviceURL;
      this.serviceUrl = serviceInfo.serviceURL;
      this.serviceInfo = serviceInfo;
      this.loading = false;
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
