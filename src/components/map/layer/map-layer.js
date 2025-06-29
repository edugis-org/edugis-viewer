import {html, css, LitElement} from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import {ifDefined} from 'lit/directives/if-defined.js';

import "../../base/base-arrow.js";
import "../../base/base-checkbox.js";
import "./map-layer-info.js";
import {GestureEventListeners} from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';
import * as Gestures from '@polymer/polymer/lib/utils/gestures.js';
import {arrowForwardIcon, dragIcon2 as dragIcon} from './map-layer-icons.js';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener } from '../../../i18n.js';

/**
* @polymer
* @extends HTMLElement
*/
class MapLayer extends GestureEventListeners(LitElement) {
    static get properties() {
        return {
            layer: {type: Object},
            first: {type: Boolean},
            nolayer: {type: String},
            itemcontainer: {type: Object},
            itemscroller: {type: Object},
            open: {type: Boolean},
            visible: {type: Boolean},
            subtitle: {type: String},
            zoom: {type: Number},
            boundspos: {type: String},
            datagetter: {type: Object},
            updatelegend: {type: Number},
            terrainActive: {type: Boolean, attribute: 'terrain-active'}
        }
    }
    static get styles() {
        return css`
            :host {
              display: block;
              margin-bottom: 10px;
            }
            .mlcontainer {
              position: relative;
              border-radius: 5px;
              box-shadow: 1px 1px 4px 0 rgba(66,66,66,0.34);
              padding: 10px;
            }
            base-arrow {
              position: absolute;
              right: 10px;
              top: 13px;
            }
            base-checkbox { 
              position: relative;
              top: 3px;
            }
            .lightgray {
              color: #ccc;
              fill: #ccc;
            }
            .mlsubtitle {              
              padding-left: 24px;
              font-style: italic;
              user-select: none;
            }
            .draghandle {
              cursor: move;
              user-select: none;
              background-color: rgba(255,255,255,0.5);
            }
            .draghandle:active {
              cursor: grabbing;
            }
            .mltitle {
              padding-right: 10px;
              cursor: pointer;
            }
            .mltitle svg {
              position: absolute;
              left: calc(50% - 12px);
              top: 2px;
              background-color: rgba(255,255,255,0.8);
              fill: #777;
              opacity: 0;
              padding: 3px;
            }
            .mltitle:hover svg {
              opacity: 1;
              cursor: grabbing;
        }
            #layerinfo {
              position: relative;
              transition: height .5s ease-in-out;
            }
            .closed {
              height: 0;
              padding: 0;
              overflow: hidden;
            }
            .direction {
              display: inline-flex;
              align-self: center;
            }
            .direction svg {
              height: 1em;
              width: 1em;
            }
            .SE {
              transform: rotate(45deg);
            }
            .S {
              transform: rotate(90deg);
            }
            .SW {
              transform: rotate(135deg);
            }
            .W {
              transform: rotate(180deg);
            }
            .NW {
              transform: rotate(225deg);
            }
            .N {
              transform: rotate(270deg);
            }
            .NE {
              transform: rotate(315deg);
            }
        `
    }
    constructor() {
        super();
        this.layer = "";
        this.first = false;
        this.nolayer = "no layers defined";
        this.open = false;
        this.visible = true;
        this.subtitle = "";
        this.itemcontainer = null;
        this.itemscroller = null;
        this.zoom = 0;
        this.boundspos = "";
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
            if (this.layer && this.layer.id) {
                this.id = this.layer.id;
            } else {
                this.id = '__undefined_layer_'
            }
            if (this.layer && this.layer.metadata) {
              this.open = this.layer.metadata.hasOwnProperty('maplayeropen')?this.layer.metadata.maplayeropen: this.first;
              this.visible = this.layer.metadata.hasOwnProperty('visible')?this.layer.metadata.visible: true;
            }
        }
        this.boundspos = this.layer.metadata && this.layer.metadata.boundspos?this.layer.metadata.boundspos:"";
        this._checkZoomRange();
        if (this.boundspos && this.boundspos != "") {
          this.subtitle = html`${t(`Map layer outside current view`)} <span class="direction ${this.boundspos}">${arrowForwardIcon}</span>`
        } else if (this.outzoomrange){
          if (this.zoom < this.minzoom) {
            this.subtitle = t("Zoom in further");
          } else {
            this.subtitle = t("Zoom out further");;
          }
        } else if (this.layer && this.layer.metadata && this.layer.metadata.inEditMode) {
            this.subtitle = t('In drawing mode');
        } else {
          this.subtitle = "";
        }
        return true;
    }
    render() {
        if (!this.layer) {
            return html`
                <div class="mlcontainer">
                    <div class="mltitle">
                        ${this.nolayer}
                    </div>
                </div>
            `
        }
        if (!this.layer.metadata) {
          // layer not yet initialised
          return html ``;
        }
        return html`
        <div class="mlcontainer">
            <div 
              class="${classMap({
                'mltitle': true,
                'draghandle': this.itemcontainer,
                'lightgray': this.outzoomrange || this.layer.metadata.layervisible === false || this.boundspos !== ""
              })}"
              @click="${()=>this._toggleArrow()}">
                <base-checkbox 
                  ?disabled="${this.outzoomrange || this.boundspos!==''}" 
                  ?checked="${this.visible}" 
                  title="${ifDefined(t('toggle layer visibility')??undefined)}" 
                  @click="${(e)=>e.stopPropagation()}"
                  @change="${(e)=>this._toggleVisibility(e)}"></base-checkbox>
                <span>${this.layer.metadata?this.layer.metadata.title?this.layer.metadata.title:this.layer.id:this.layer.id}</span>
                <base-arrow ?open="${this.open}" @change="${e=>this._openChange(e)}"></base-arrow>
                ${dragIcon}
            </div>
            <div class="mlsubtitle">${this.subtitle}</div>
            ${this._renderEndDrawModeButton()}
            <div id="layerinfo" class="${this.open?'':'closed'}">${this._renderLayerInfo()}</div>
        </div>
        `
    }
    firstUpdated(){
        let mltitle = this.shadowRoot.querySelector('.mltitle');
        if (mltitle) {
          Gestures.addListener(mltitle, 'track', (e)=>this._trackHandler(e));
        }
    }
    _endDrawMode() {
      this.dispatchEvent(new CustomEvent('enddrawmode', {bubbles: true, composed: true}));
    }
    _renderEndDrawModeButton() {
        if (this.layer.metadata && this.layer.metadata.inEditMode) {
          
            return html`<wc-button compact @click=${this._endDrawMode}><i class="material-icons">${t('Done')}</i></wc-button>`
        }
        return html``;
    }
    _checkZoomRange()
    {
      if (this.layer) {        
          this.minzoom = this.layer.minzoom ? this.layer.minzoom : 0;
          this.maxzoom = this.layer.maxzoom ? this.layer.maxzoom : 24;
          this.outzoomrange = this.zoom < this.minzoom || this.zoom > this.maxzoom;
      } else {
        this.outzoomrange = false;
      }
    }
    _toggleArrow() {
        let arrow = this.shadowRoot.querySelector('base-arrow');
        if (arrow) {
            arrow.open = !arrow.open;
            this._openChange();
        }
    }
    _renderLayerInfo() {
        return html`<map-layer-info 
          .layer="${this.layer}" 
          ?open="${this.open}" 
          .zoom="${this.zoom}"
          .datagetter="${this.datagetter}"
          .updatelegend="${this.updatelegend}"
          ?terrain-active="${this.terrainActive}"
          ?layervisible="${this.visible && !this.outzoomrange && this.boundspos==""}"></map-layer-info>`
    }
    _openChange() {
        const infoContainer = this.shadowRoot.querySelector('#layerinfo');
        if (infoContainer.classList.contains('closed')) {
            // open layerinfo
            infoContainer.style.height = 0;
            setTimeout(()=>infoContainer.style.height=infoContainer.scrollHeight + 'px', 100);
            setTimeout(()=>{
                infoContainer.classList.remove('closed');
                infoContainer.style.height = null;
                this.open = this.layer.metadata.maplayeropen = true;
            }, 600);
        } else {
            // close layerinfo
            infoContainer.style.height = infoContainer.scrollHeight + 'px';
            infoContainer.style.overflow = 'hidden';
            setTimeout(()=>infoContainer.style.height = 0, 100);
            setTimeout(()=>{
                infoContainer.classList.add('closed');
                infoContainer.style.height = null;
                infoContainer.style.overflow = null;
                this.open = this.layer.metadata.maplayeropen = false;
            }, 600);
        }
    }
    _toggleVisibility(e) {
      // prevent event from bubbling up to map-layer-set
      e.stopPropagation();
      this.visible = e.target.checked;
      this.layer.metadata.visible = this.visible;
      if (this.layer.metadata.sublayers && this.layer.metadata.sublayers.length > 0) {
        // store visibility in first sublayer, see visibility in map-layer-set.shouldUpdate
        this.layer.metadata.sublayers[0].metadata.visible = this.visible;
      }
      this.dispatchEvent(new CustomEvent('updatevisibility', {
        detail: {
          layerid: this.layer.metadata.sublayers?this.layer.metadata.sublayers.map(layer=>layer.id):this.layer.id,
          visible: this.visible
        },
        bubbles: true,
        composed: true
      }));
    }
    _scrollUp() {
        if (this.scrollingUp) {
          if (this.itemscroller.scrollTop > 1) {
            this.itemscroller.scrollTop--;
            this.startOffsetTop--;
            this.top--;
            this.stylepos=`top:${top}px;`;
            setTimeout(()=>this._scrollUp(), 100);
          } else {
            this.scrollingUp = false;
          }
        }
      }
      _scrollDown() {
        if (this.scrollingDown) {
          if (this.itemscroller.scrollTop < this.itemScrollerHeight - this.itemScrollerClientRect.height - 1) {
            this.itemscroller.scrollTop++;
            this.startOffsetTop++;
            this.top++;
            this.stylepos=`top:${top}px;`;
            setTimeout(()=>this._scrollDown(), 50);
          } else {
            this.scrollingDown = false;
          }
        }
      }
      _findSiblings(y, x){
        const siblings = Array.from(this.itemcontainer.children);
        if (!this.itemScrollerClientRect || 
            x > this.itemScrollerClientRect.left + this.itemScrollerClientRect.width + 20 ||
            x < this.itemScrollerClientRect.left - 20) {
          // cursor outside itemscroller
          return [];
        }
        let result = siblings.filter(elem=> {
            const elemClientRect = elem.getBoundingClientRect();
            return (y > elemClientRect.top - 10 && y < elemClientRect.top + elemClientRect.height + 10);
        });
        if (result.length) {
          result = result.slice(0,1);
          if (result[0] === this.itemcontainer.children[0]) {
            // cursor on first item
            const elemClientRect = result[0].getBoundingClientRect();
            if (y -elemClientRect.top < elemClientRect.height / 2) {
              // cursor on top half of first item
              result.push("top"); 
            } else {
              result.push("bottom");
            }
          }
        }
        return result;
      }
    _trackHandler(event) {
        if (!this.itemcontainer) {
          // container not defined
          return;
        }
        switch(event.detail.state) {
          case 'start':
            this.container = this.shadowRoot.querySelector('.mlcontainer');
            this.curHovering = null;
            this.startOffsetTop = this.container.offsetTop;// always zero?
            if (this.itemscroller) {
              this.itemScrollerHeight = this.itemscroller.scrollHeight;
              this.itemScrollerClientRect = this.itemscroller.getBoundingClientRect();
            }
            break;
          case 'track':
            if (!this.container) {
              return; // why receiving track state after end state?
            }
            let top = event.detail.dy;
            if (this.startOffsetTop + top < 0) {
                top = -this.startOffsetTop;
            }
            if (this.itemscroller) {
              if (event.detail.y < this.itemScrollerClientRect.top) {
                // pointer above scroller
                this.scrollingUp = true;
                this._scrollUp();
              } else {
                // stop scrolling
                this.scrollingUp = false;
              }
              if (event.detail.y > this.itemScrollerClientRect.top + this.itemScrollerClientRect.height) {
                // pointer below scroller
                this.scrollingDown = true;
                this._scrollDown();
              } else {
                this.scrollingDown = false;
              }
              if (top > this.itemScrollerHeight - 1) {
                top = this.itemScrollerHeight - 1;
              }
            }
            this.top = top;
            this.container.style.top=`${top}px`;
            const hovering  = this._findSiblings(event.detail.y, event.detail.x);
            if (hovering.length && hovering[0] !== this) {
              if (hovering[0] !== this.curHovering || hovering.length > 1) {
                if (this.curHovering) {
                  this.curHovering.style['border-top'] = '';
                  this.curHovering.style['border-bottom'] = '';
                }
                if (hovering.length > 1 && hovering[1] == "top") {
                  hovering[0].style['border-top'] = 'solid 4px black';
                } else {
                  hovering[0].style['border-bottom'] = 'solid 4px black';
                }
                this.curHovering = hovering[0];
              }
            } else if (this.curHovering) {
              this.curHovering.style['border-top'] = '';
              this.curHovering.style['border-bottom'] = '';
              this.curHovering = null;
            }
            break;
          case 'end':
            this.scrollingUp = false;
            this.scrollingDown = false;
            this.container.style.top = null;
            this.container = null;
            if (this.curHovering) {
                let beforeFirst = false;
                if (this.curHovering.style['border-top'].length) {
                    beforeFirst = true;
                }
                if (this.id !== this.curHovering.id) {

                  this.dispatchEvent(new CustomEvent('movelayer',
                  {
                      detail: {
                          layer: this.id, 
                          beforeLayer: this.curHovering.id, 
                          beforeFirst: beforeFirst
                      }
                  }));
                }
                this.curHovering.style['border-top'] = '';
                this.curHovering.style['border-bottom'] = '';
                this.curHovering = null;
            }
            break;
        }
      }
}

window.customElements.define('map-layer', MapLayer);