import {html, css, LitElement} from 'lit';
import {ifDefined} from 'lit/directives/if-defined.js';
import '../../base/base-slider.js';
import '../../map-legend-panel.js';
import './map-layer-config.js';
import {iconInformationCircle, iconCog, iconDelete} from "./map-layer-icons.js";
import { downloadIcon } from '../../my-icons.js';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../../../i18n.js';

/**
* @polymer
* @extends HTMLElement
*/
class MapLayerInfo extends LitElement {
    static get properties() {
        return {
            layer: {type: Object},
            open: {type: Boolean},
            layervisible: {type: Boolean},
            moreInfo: {type: Boolean},
            showLayerConfig: {type: Boolean},
            transparency: {type: Number},
            legendclipper: {type: Boolean},
            legendclipped: {type: Boolean},
            zoom: {type:Number},
            datagetter: {type: Object},
            updatelegend: {type: Number},
            terrainActive: {type: Boolean, attribute: 'terrain-active'},
        }
    }
    static get styles() {
        return css`
            :host {
                display: inline-block;
            }
            #licontainer {
                padding-left: 26px;
            }
            #litransparency {
                margin-top: 10px;
            }
            #lilegendtitle {
                margin-bottom: 10px;
            }
            #lishowmore {
                color: #00811f;
                font-style: italic;
                position: relative;
                cursor: pointer;
            }
            .bold {
                font-weight: bold;
            }
            .lislidercontainer {
                margin-top: -10px;
                height: 40px;
                width: 180px;
                margin-left: 7px;
                --mdc-theme-primary: #ccc;
                --mdc-theme-secondary: #555;
            }
            .icon {
                display: inline-block;
                width: 24px;
                height: 24px;
                vertical-align:middle;
            }
            .fade {
                background: linear-gradient(to bottom, rgba(255, 255, 255,0) 0%,rgba(255, 255, 255,1) 75%);
                height: 100px;
                margin-top: -100px;
                position: relative;
                pointer-events: none;
            }
            #legend {
                max-height: 12000px;
                overflow-y: auto;
                transition: max-height .8s ease-in-out;
            }
            #legend.clipped {
                max-height: 200px;
                overflow: hidden;
            }
            .iconbutton {
                padding: 5px;
                cursor: pointer;
            }
            .moreinfo {
                padding-left: 20px;
                max-width: 200px;
                overflow: auto;
            }
            .terraintoggle {
                margin-top: 10px;
            }
        `
    }
    constructor() {
        super();
        this.layer = null;
        this.open = false;
        this.moreInfo = false;
        this.showLayerConfig = false;
        this.transparency = 0;
        this.legendclipper = true;
        this.legendclipped = true;
        this.zoom = 0;
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
        if (changedProperties.has('layer')) {
            this.moreInfo = false;
            this.showLayerConfig = false;
            if (this.layer && this.layer.metadata) {
                this.transparency = this.layer.metadata.transparency?this.layer.metadata.transparency:this._getTransparency();
                if (this.layer.metadata.transparency) {
                    this._updateTransparency({target: {value: this.layer.metadata.transparency}});
                }
                this.legendclipped = true;
            }
            if (this.layer.type === 'hillshade') {
                this.terrainActive = this.layer.metadata.terrain;
            }
        }
        return true;
    }
    _renderRemoveButton() {
        // do not show layer remove button while editing the layer
        if (!this.layer.metadata.inEditMode) {
            return html`<div class="iconbutton" @click="${()=>this._removeLayer()}"><span class="icon">${iconDelete}</span> ${t('Remove')}</div>`;
        }
        return ``
    }
    render() {
        // <button @click="${(e)=>this._buttonClick(e)}">colors</button>
        return html`
        <div id="licontainer">
            ${this._renderVisibleLayerInfo()}
            ${this._renderRemoveButton()}
        </div>
        `
    }
    _getTransparency() {
        if (this.layer.paint) {
            let opacityname = this.layer.type==='hillshade'?'hillshade-exaggeration':`${this.layer.type}-opacity`;
            if (this.layer.paint.hasOwnProperty(opacityname)) {
                return Math.round(100*(1 - this.layer.paint[opacityname]));
            }
        } else if (this.layer.type === 'style') {
            for (let type of ["hillshade","fill","raster","circle","line","fill-extrusion","heatmap","sky","symbol","background"]) {
                let layer = this.layer.metadata.sublayers.find(layer=>layer.type === type);                
                if (layer && layer.paint) {
                    let opacityname = layer.type==='hillshade'?'hillshade-exaggeration':`${layer.type}-opacity`;
                    if (layer.paint.hasOwnProperty(opacityname)) {
                        if (isNaN(layer.paint[opacityname])) {
                            return 0; // opacity is likely an expression, return 0
                        }
                        return Math.round(100*(1 - layer.paint[opacityname]));
                    }
                    return 0;
                }
            }
        }
        return 0;
    }
    _updateTerrain(event) {
        this.terrainActive = event.target.checked;
        this.layer.metadata.terrain = event.target.checked;
        this.dispatchEvent(new CustomEvent('updateterrain', {
            detail: {
                layerid: this.layer.id,
                terrain: this.layer.metadata.terrain
            },
            bubbles: true,
            composed: true
        }))
    }
    _renderTerrainButton() {
        if (this.layer.type === 'hillshade') {
            return html`
            <div class="terraintoggle">
                <base-checkbox name="terraintoggle" id="terraintoggle" small id="terrain" label="${ifDefined(t('Terrain')??undefined)}" .checked="${this.terrainActive}" @change="${e=>this._updateTerrain(e)}">
                    ${t('Show terrain in 3D')}
                </base-checkbox>
            </div>
            `
        } 
        return html``;
    }
    _renderVisibleLayerInfo() {
        if (this.layervisible && this.open) {
            return html`
            ${this._renderTerrainButton()}
            <div id="litransparency"><span class="bold">${t('Transparency')}:</span> ${Math.round(this.transparency)}%
                <div class="lislidercontainer">
                    <base-slider id="${this.layer.id}" value="${this.transparency}" minvalue="0" maxvalue="100" @change="${e=>this._updateTransparency(e)}"></base-slider>
                </div>
            </div>
            <div id="lilegend">
                <div id="lilegendtitle" class="bold">${t('Legend')}:</div>
                <div id="legend" class="${this.legendclipped?' clipped':''}">
                    <map-legend-panel 
                        @load="${()=>this.requestUpdate()}" 
                        .maplayer="${this.layer}"
                        transparency="${this.transparency}"
                        .zoom="${this.zoom}"
                        .updatelegend="${this.updatelegend}"></map-legend-panel>
                </div>
                ${this._renderLegendClipper()}
            </div>
            ${this._renderShowInfo()}
            ${this._renderSettings()}
            ${this._renderSaveLayerButton()}
            `
        }
        return ``;
    }
    _renderLegendClipper() {
        if (this.legendclipper) {
            return html`
                ${this.legendclipped?html`<div class="fade"></div>`:""}
                <div id="lishowmore" @click="${()=>this._togglelegendclipped()}">Toon ${this.legendclipped?'meer':'minder'}...</div>
            `
        }
        return '';
    }
    updated() {
        requestAnimationFrame(()=>{
                let legendPanel = this.shadowRoot.querySelector('map-legend-panel');            
                if (legendPanel) {
                    this.legendclipper = legendPanel.offsetHeight > 220;
                    if (!this.legendclipper) {
                        this.legendclipped = false;
                    } else {
                        this.legendclipped = this.layer.metadata.hasOwnProperty('legendclipped')?this.layer.metadata.legendclipped:true;
                    }
                }
            }
        )
    }
    _buttonClick(event) {
        let button = this.shadowRoot.querySelector('#licontainer');
        //let picker = new Picker({parent:document.body, popup:'top'});
        //picker.openHandler();
    }
    _togglelegendclipped() {
        this.legendclipped = !this.legendclipped;
        this.layer.metadata.legendclipped = this.legendclipped;
        if (this.layer.metadata 
                && this.layer.metadata.sublayers 
                && this.layer.metadata.sublayers.length
                && this.layer.metadata.sublayers[0].metadata) {
            // the layer is a layer set (a style), also store legendclipped status in first sublayer
            // to be restored when a new layer set is constructed in <map-layer-set>
            this.layer.metadata.sublayers[0].metadata.legendclipped = this.legendclipped;
        }
    }
    _renderLinks(text) {
        let matches = text.matchAll(/https?:\/\/[^,;\s)]*/g);
        let prevpos = 0;
        let parts = [];
        for (let match of matches) {
            if (match.index > prevpos) {
                parts.push([match.input.substr(prevpos, match.index), match[0]]);
            } else {
                nonlinks.push(['', match[0]]);
            }
            prevpos = match.index + match[0].length;
        }
        if (parts.length) {
            if (prevpos !== text.length) {
                parts.push([text.substr(prevpos, text.length), '']);
            }
            return parts.map(part=>html`${part[0]}${part[1] !== ''?html`<a href="${part[1]}" target="_blank">${part[1]}</a>`:''}`)
        } else {
            return html`${text}`
        }
    }
    _renderShowInfo() {
        if (this.layer.metadata) {
            if (this.layer.metadata.markdown && this.layer.metadata.markdown.trim() !== "") {
                return html`
                    <div class="iconbutton" @click="${()=>this._toggleInfo()}"><span class="icon">${iconInformationCircle}</span> ${t('More info')}</div>
                `
            }
            if (this.layer.metadata.abstract && this.layer.metadata.abstract.trim() !== "") {
                return html`
                    <div class="iconbutton" @click="${()=>this._toggleInfo()}"><span class="icon">${iconInformationCircle}</span> ${t('More info')}</div>
                    ${this.moreInfo?html`<div class="moreinfo">${this._renderLinks(this.layer.metadata.abstract)}</div>`:""}
                `
            }
        }
    }
    _toggleInfo() {
        this.moreInfo = !this.moreInfo;
        if (this.moreInfo && this.layer.metadata.markdown) {
            this.moreInfo = false;
            this.dispatchEvent(new CustomEvent("showmodaldialog", {
                detail: {
                    markdown: this.layer.metadata.markdown
                },
                bubbles: true,
                composed: true
            }))
        }
    }
    _getConfigurableLayer() {
        let layer = this.layer;
        if (layer.type === 'style') {
            const fillLayer = layer.metadata.sublayers.find(({type})=>type==='fill');
            if (fillLayer) {
                return fillLayer;
            }
            const circleLayer = layer.metadata.sublayers.find(({type})=>type === 'circle');
            if (circleLayer) {
                return circleLayer;
            }
            const lineLayer = layer.metadata.sublayers.find(({type})=>type === 'line');
            if (lineLayer) {
                return lineLayer;
            }
        }
        return layer;
    }
    _renderLayerConfig() {
        if (this.showLayerConfig) {
            let layer = this._getConfigurableLayer();
            if (layer.type === 'style') {

            }
            return html`
            <map-layer-config .layer="${layer}" .zoom=${this.zoom} .datagetter="${this.datagetter}"></map-layer-config>
            `
        } else {
            return '';
        }
    }
    _renderSettings(){
        return html``;
        if (this.layer.type === 'fill' 
            || this.layer.type === 'line' 
            || this.layer.type === 'circle' 
            || (this.layer.type === 'style' 
                && this.layer.metadata.sublayers 
                && this.layer.metadata.sublayers.length
                && this.layer.metadata.sublayers[0].metadata
                && !this.layer.metadata.sublayers[0].metadata.reference
                && this.layer.metadata.sublayers.find(layer=>layer.type === 'fill' 
                    || layer.type ==='line' 
                    || layer.type === 'circle'))
        ) {
            return html`
                <div class="iconbutton" @click="${()=>this.showLayerConfig=!this.showLayerConfig}"><span class="icon">${iconCog}</span> Instellingen</div>
                ${this._renderLayerConfig()}
            `
        }
        return '';
    }
    _renderSaveLayerButton() {
        if (this.layer.metadata && this.layer.metadata.cansave) {
            return html`
            <div class="iconbutton" @click="${()=>this._saveLayer()}" title="${ifDefined(t('save layer')??undefined)}"><span class="icon">${downloadIcon}</span> ${t('Save layer')}</div>
            `
        }
    }
    _saveLayer() {
        this.dispatchEvent(new CustomEvent('savelayer', {
            detail: {
                layer: {id: this.layer.id}
            },
            bubbles: true,
            composed: true
        }))
    }
    _removeLayer() {
        this.dispatchEvent(new CustomEvent('removelayer', {
            detail: {
                layerid: this.layer.id
            },
            bubbles: true,
            composed: true
        }))
    }
    _updateTransparency(event) {
        this.transparency = event.target.value;
        this.layer.metadata.transparency = this.transparency;
        this.dispatchEvent(new CustomEvent('updateopacity', {
            detail: {
                layerid: this.layer.metadata && this.layer.metadata.sublayers?this.layer.metadata.sublayers.map(layer=>layer.id):this.layer.id,
                opacity: 1 - (Math.round(this.transparency) / 100)
            },
            bubbles: true,
            composed: true
        }))
    }
}

window.customElements.define('map-layer-info', MapLayerInfo);