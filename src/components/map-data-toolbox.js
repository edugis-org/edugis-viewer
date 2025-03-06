import {LitElement, html, svg, css} from 'lit';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n.js';
import './map-iconbutton';
import './map-datatool-shortest-distance';
import './map-datatool-buffer';
import './map-datatool-intersect';
import './map-datatool-filter';
import './map-datatool-route';
import './map-iconbutton';
import {bufferIcon, intersectIcon, filterIcon, zigzagIcon} from './my-icons';
import { measureIcon} from '../gm/gm-iconset-svg';

//const dummyIcon = svg`<svg height="24" width="24" viewbox="0 0 24 24"><style>.normal{ font: bold 18px sans-serif;}</style><text x="4" y="16" class="normal">A</text></svg>`;


/**
* @polymer
* @extends HTMLElement
*/
class MapDataToolbox extends LitElement {
  static get properties() { 
    return {
      active: {type: Boolean},
      map: {type: Object},
      currentTool: {type: String}
    }; 
  }
  static styles = css`
    .drawcontainer {font-size: 14px;}
    .header {
      font-weight: bold;
      position: relative;
      font-size: 16px;
      width: 100%;
      height: 30px;
      padding: 5px;
      border-bottom: 1px solid lightblue;
      box-sizing: border-box;
      margin-bottom: 12px;
    }
    .buttonbar {height: auto;width:100%; margin-top: 19px; margin-bottom: 15px;}
    .tool {display: inline-block; height: 55px; width: 55px; line-height: 67px;}
  `;
  constructor() {
      super();
      this.map = {};
      this.active = false;
      this.currentTool = "";
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
  render() {
    if (!this.active) {
      return html``;
    }
    return html`
      <div class="drawcontainer" @dragover="${e=>e.preventDefault()}" @drop="${(e)=>this._handleDrop(e)}">
        <div class="header">${t('Map Data Tools')}</div>
        ${t('Select a tool button')}
          <div class="buttonbar">
            <div class="tool">
            <map-iconbutton .active="${this.currentTool==='shortestdistancetool'}" .icon="${measureIcon}" info="${t('Calculate shortest distance')}" @click="${e=>this.currentTool='shortestdistancetool'}"></map-iconbutton>
            </div>
            <div class="tool">
            <map-iconbutton .active="${this.currentTool==='buffertool'}" .icon="${bufferIcon}" info="${t('Buffer')}" @click="${e=>this.currentTool='buffertool'}"></map-iconbutton>
            </div>
            <div class="tool">
            <map-iconbutton .active="${this.currentTool==='intersecttool'}" .icon="${intersectIcon}" info="${t('Intersect')}" @click="${e=>this.currentTool='intersecttool'}"></map-iconbutton>
            </div>
            <div class="tool">
            <map-iconbutton .active="${this.currentTool==='filtertool'}" .icon="${filterIcon}" info="${t('Filter')}" @click="${e=>this.currentTool='filtertool'}"></map-iconbutton>
            </div>
            <div class="tool">
            <map-iconbutton .active="${this.currentTool==='routetool'}" .icon="${zigzagIcon}" info="${t('Route')}" @click="${e=>this.currentTool='routetool'}"></map-iconbutton>
            </div>
        </div>
        <div class="toolpanel">
          ${this._renderCurrentTool()}
        </div>
      </div>
    `
  }
  _renderCurrentTool() {
    switch (this.currentTool) {
      case "":
        return html`${t('Select a tool button')}`;
      case "shortestdistancetool":
        return html`<map-datatool-shortest-distance .map=${this.map}></map-datatool-shortest-distance>`;
      case "buffertool":
        return html`<map-datatool-buffer @titlechange="${()=>this._titlechange()}" .map=${this.map}></map-datatool-buffer>`;
      case "intersecttool":
        return html`<map-datatool-intersect @titlechange="${()=>this._titlechange()}" .map=${this.map}></map-datatool-intersect>`;
      case "filtertool":
        return html`<map-datatool-filter @titlechange="${()=>this._titlechange()}" .map=${this.map}></map-datatool-filter>`;
      case "routetool":
        return html`<map-datatool-route .map=${this.map}></map-datatool-route>`;
      default:
        return html`Nog niet geimplementeerd: '${this.currentTool}'`;
    }
  }
  _titlechange() {
    this.dispatchEvent(new CustomEvent("titlechange", {}))
  }
}
customElements.define('map-data-toolbox', MapDataToolbox);
