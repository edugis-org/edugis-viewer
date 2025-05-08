
import {LitElement, html} from 'lit';
import {ifDefined} from 'lit/directives/if-defined.js';
import './map-layer-tree';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n.js';
/**
* @polymer
* @extends HTMLElement
*/
class MapDataCatalog extends LitElement {
  static get properties() { 
    return { 
      datacatalog: Object,
      maplayers: Array,
      search: Boolean
    }; 
  }
  constructor() {
    super();
    this.datacatalog = null;
    this.maplayers = [];
    this.search = false;
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
  setListIds(list) {
    list.forEach(item=>{
      if (!item.hasOwnProperty("id")) {
        item.id = `${item.title.replace(' ', '_')}_${item.type?item.type.replace(' ', '_'):'untyped'}_id`;
      }
      if (item.sublayers) {
        this.setListIds(item.sublayers);
      }
    });
  }
  shouldUpdate(changedProps) {
    if (changedProps.has("datacatalog")) {
      if (this.datacatalog) {
        this.setListIds(this.datacatalog);
      }
    }
    return (this.datacatalog != null);
  }

  toggleLayer(e) {
    if (e.detail.checked) {
      this.handleClick(e, e.detail);
    } else {
      if (e.detail.layerInfo.id) {
        this.dispatchEvent(
          new CustomEvent('removelayer',
            {
                detail: {layerid: e.detail.layerInfo.id}
            })
        );
      }
    }
  }
  render() {
    return html`<map-layer-tree 
      headertext="${ifDefined(t('Add map layers')??undefined)}" 
      .nodelist="${this.datacatalog}" 
      .maplayers="${this.maplayers}" 
      @toggleitem="${e=>this.toggleLayer(e)}"
      @addExternalLayer="${e=>this.dispatchEvent(new CustomEvent('addExternalLayer', {detail: e.detail}))}"
      .search="${this.search}">
      </map-layer-tree>`;
  }
  getDataInfo(treenodes, dataid) {
    let result = null;
    treenodes.forEach(elem=>{
        if (!result) {
            if(elem.type=="group"){
                const subresult = this.getDataInfo(elem.sublayers, dataid);
                if (subresult) {
                    result = subresult;
                }
            } else {
                if (elem.layerInfo && elem.layerInfo.id === dataid) {
                    result = elem.layerInfo;
                }
            }
        }
    });
    return result;
  }
  async handleClick(e, node) {
    if (node.layerInfo && node.layerInfo.id) {
      const layerInfo = node.layerInfo;
      if (!layerInfo.metadata) {
        layerInfo.metadata = {};
      }
      if (!layerInfo.metadata.title) {
        layerInfo.metadata.title = node.title;
      }
      if (node.type === 'wms') {
        layerInfo.metadata.wms = true;        
      }
      layerInfo.metadata.reference = (node.type === "reference");
      
      this.dispatchEvent(new CustomEvent('addlayer', 
        {detail: layerInfo}
      ))
    }
  }
}

customElements.define('map-data-catalog', MapDataCatalog);
