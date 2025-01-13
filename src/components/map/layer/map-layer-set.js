import {html, css, LitElement} from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { downloadIcon } from '../../my-icons.js';

import "../../base/base-arrow.js";
import "./map-layer.js";
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../../../i18n.js';

/**
* @polymer
* @extends HTMLElement
*/
class MapLayerSet extends LitElement {
    static get properties() {
        return {
            layerlist: {type: Array},
            nolayer: {type: String}, 
            open: {type: Boolean},
            userreorder: {type: Boolean},
            itemscroller: {type: Object},
            zoom: {type: Number},
            datagetter: {type: Object},
            updatelegend: {type: Number},
            terrainActive: {type: Boolean, attribute: 'terrain-active'},
        }
    }
    static get styles() {
        return css`
            :host {
                display: block;
            }
            #title {
                position: relative;
                height: 58px;
                line-height: 58px;
                font-weight: bold;
                cursor: pointer;
                color: #007BC7;
            }
            base-arrow {
                position: absolute;
                right: 0px;
                top: calc(50% - 8px);
            }
            #set {
                position: relative;
                transition: height .5s ease-in-out;
            }
            .closed {
                height: 0;
                padding: 0;
                overflow: hidden;
            }
            .iconbutton {
                padding: 5px;
                cursor: pointer;
            }
        `
    }
    constructor() {
        super();
        this.layerlist = this.layerSet = [];
        this.nolayer = null;
        this.userreorder = false;
        this.open = false;
        this.zoom = 0;
        this.itemcontainer = null;
        this.itemscroller = null;
        this.datagetter = null;
        this.updatelegend = 0;
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
    shouldUpdate(changedProperties) {
        if (changedProperties.has('layerlist')) {
            this.layerSet = this.layerlist.reduce((result, layer)=>{
                if (layer.metadata && layer.metadata.styleid) {
                    if (result.previd !== layer.metadata.styleid) {
                        // new style layer
                        result.group.push({
                            id: layer.metadata.styleid, 
                            type: "style",
                            metadata: {
                                title: layer.metadata.styletitle,
                                sublayers: [layer]
                            }
                        });
                        result.previd = layer.metadata.styleid;
                    } else {
                        result.group[result.group.length - 1].metadata.sublayers.push(layer);
                    }
                } else {
                    result.group.push(layer);
                }
                return result;
            }, {group: [], previd: ""}).group;
            for (const layer of this.layerSet)
                if (layer.metadata 
                && layer.metadata.sublayers
                && layer.metadata.sublayers.length
                && layer.metadata.sublayers[0].metadata) {
                // restore legendclipped setting to whole layerSet, see <map-layer-info> toggleLegendClipped
                layer.metadata.legendclipped = layer.metadata.sublayers[0].metadata.legendclipped;
                // restore visible setting to whole layerSet, see <map-layer> _toggleVisibility
                layer.metadata.visible = layer?.metadata?.sublayers[0]?.metadata?.visible ?? true;
            }
            this._setGroupLayerProperties();
            this._updateContainers();
        }
        return true;
    }
    render() {
        return html`
        <div id="title" @click="${()=>this._toggleArrow()}"><base-arrow ?open="${this.open}" @change="${e=>this._openChange(e)}"></base-arrow><slot>Layer set title</slot></div>
        <div id="set" class="${this.open?'':'closed'}">${this._renderLayerList()}</div>
        <div id="save">${this._renderSaveLayerList()}</div>
        `
    }
    firstUpdated() {
        this._updateContainers();
    }
    _toggleArrow() {
        let arrow = this.shadowRoot.querySelector('base-arrow');
        if (arrow) {
            arrow.open = !arrow.open;
            this._openChange();
        }
    }
    _updateContainers() {
        if (this.userreorder && this.layerlist.length > 1) {
            this.itemcontainer = this.shadowRoot.querySelector('#set');
            this.itemscroller = this.parentElement && this.parentElement.itemscroller ? this.parentElement.itemscroller: null;
            this.shadowRoot.querySelectorAll('map-layer').forEach(mapLayer=>{
                mapLayer.itemcontainer = this.itemcontainer;
                mapLayer.itemscroller = this.itemscroller;
            })
        } else {
            this.itemcontainer = null;
        }
    }
    _setGroupLayerProperties() {
        // set minzoom, maxzoom, boundspos for grouped layers
        this.layerSet.forEach(layer=>{
            if (layer.metadata && layer.metadata.sublayers && layer.metadata.sublayers.length) {
                // this is a group layer
                layer.minzoom = layer.metadata.sublayers.reduce((result, sublayer)=>{
                    if (sublayer.hasOwnProperty('minzoom')) {
                      if (sublayer.minzoom < result) {
                        result = sublayer.minzoom;
                      }
                    } else {
                      result = 0;
                    }
                    return result;
                  }, 100);
                layer.maxzoom = layer.metadata.sublayers.reduce((result, sublayer)=>{
                    if (sublayer.hasOwnProperty('maxzoom')) {
                      if (sublayer.maxzoom > result) {
                        result = sublayer.maxzoom;
                      }
                    } else {
                      result = 100;
                    }
                    return result;
                  }, 0);
                layer.metadata.boundspos = layer.metadata.sublayers.reduce((result, sublayer)=>{
                    if (result !== "") {
                        result = sublayer.metadata.boundspos;
                    }
                    return result;
                }, null);
                layer.metadata.abstract = layer.metadata.sublayers.reduce((result, sublayer)=>{
                    if (sublayer.metadata.abstract) {
                        result += sublayer.metadata.abstract + '\n';
                    }
                    return result;
                },"")
            }
        })
    }
    _renderLayerList() {
        console.log(this.layerSet);
        if (this.layerSet.length == 0) {
            return html`<map-layer .nolayer="${this.nolayer}"></map-layer>`;
        }
        return this.layerSet.map((layer,index)=>{
            let boundspos = layer.metadata && layer.metadata.boundspos ? layer.metadata.boundspos : "";
            return html`<map-layer 
                .first="${index == 0}"
                .layer="${layer}" 
                .boundspos="${boundspos}" 
                .zoom=${this.zoom}
                .itemcontainer="${this.itemcontainer?this.itemcontainer:{}}" 
                .itemscroller="${this.itemscroller}"
                .updatelegend="${this.updatelegend}"
                .datagetter="${this.datagetter}"
                ?terrain-active="${this.terrainActive}"
                @movelayer="${(e)=>this._moveLayer(e)}">
            </map-layer>`
        });
    }
    _renderSaveLayerList() {
        if (this.layerSet.length > 1) {
            return html`<div class="iconbutton" @click="${()=>this._saveLayerList()}" title="${ifDefined(t('Save layer set')??undefined)}"><span class="icon">${downloadIcon}</span> ${t('Save layer set')}</div>`
        }
    }
    _saveLayerList() {
        const layerids = [];
        for (const layer of this.layerSet) {
            if (layer.type !== 'style') {
                layerids.push({id: layer.id});
            } else {
                layerids.push({id:layer.id, layer: layer});
            }
        }
        this.dispatchEvent(new CustomEvent('savelayers', {
            detail: {
                layers: layerids.reverse() // top layer last
            },
            bubbles: true,
            composed: true
        }))
    }
    _openChange(event) {
        const setContainer = this.shadowRoot.querySelector('#set');
        if (setContainer.classList.contains('closed')) {
            // open the set
            setContainer.style.height = 0; 
            setTimeout(()=>setContainer.style.height=setContainer.scrollHeight + 'px', 100);
            setTimeout(()=>{
                setContainer.classList.remove('closed');
                setContainer.style.height = null;
            }, 600);
        } else {
            // close the set
            setContainer.style.height = setContainer.scrollHeight + 'px';
            setContainer.style.overflow = 'hidden';
            setTimeout(()=>setContainer.style.height = 0, 100);
            setTimeout(()=>{
                setContainer.classList.add('closed');
                setContainer.style.height = null;
                setContainer.style.overflow = null;
            }, 600);
        }
    }
    _moveLayer(event) {
        /* add detail.layers to event, the bubble up */
        let sourceLayer = this.layerSet.find(layer=>layer.id === event.detail.layer);
        let targetLayer = this.layerSet.find(layer=>layer.id == event.detail.beforeLayer);
        if (sourceLayer && targetLayer) {
            event.detail.layers = sourceLayer.metadata.sublayers ? sourceLayer.metadata.sublayers.map(layer=>layer.id): [sourceLayer.id];
            if (targetLayer.metadata.sublayers) {
                event.detail.beforeLayer = targetLayer.metadata.sublayers[targetLayer.metadata.sublayers.length - 1].id;
            }
            this.dispatchEvent(new CustomEvent('movelayer', {
                detail: event.detail,
                bubbles: true,
                composed: true
            }))
        }
    }
}

window.customElements.define('map-layer-set', MapLayerSet);