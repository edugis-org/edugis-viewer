import {spinnerIcon} from './my-icons';

import {LitElement, html} from 'lit';

/**
* @polymer
* @extends HTMLElement
*/
class MapSpinner extends LitElement {
  static get properties() { 
    return { 
      visible: Boolean,
      webmap: Object
    }; 
  }
  constructor() {
      super();
      this.delay = false;
      this.visible = false;
      this.webmap = {};
  }
  showSpinner() {
    if (this.visible) {
      return;
    }
    if (this.showSpinnerTimeout) {
      return;
    }
    // prevent short-duration spinners
    this.delay = true;
    this.showSpinnerTimeout = setTimeout(()=>
      {
        if (this.delay) {
          this.visible = true;
        }
        this.showSpinnerTimeout = null;
      }, 300)
  }
  hideSpinner() {
    if(this.webmap.loaded()) {
        this.delay = false;
        this.visible = false;
        if (this.showSpinnerTimeout) {
          clearTimeout(this.showSpinnerTimeout);
          this.showSpinnerTimeout = null;
        }
        
    }
  }
  registerMapEvents(prevMap, newMap)
  {
    const showSpinner = this.showSpinner.bind(this);
    const hideSpinner = this.hideSpinner.bind(this);
    if (prevMap && prevMap.version) {
        prevMap.off("dataloading", showSpinner);
        prevMap.off("render", hideSpinner);
    }
    if (newMap && newMap.version) {
        newMap.on("dataloading", showSpinner);
        newMap.on("render", hideSpinner);
    }
  }
  shouldUpdate(changedProps) {
      const prevWebMap = changedProps.get('webmap');
      if (prevWebMap !== this.webmap) {
        this.registerMapEvents(prevWebMap, this.webmap);
      }
      return (this.webmap.version ? true : false);
  }
  render() {
    return html`<style>
        :host {
          position: absolute;
          margin-left: auto;
          margin-right: auto;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .hidden {
          display: none;
        }
        svg path, svg rect{
          fill: #FF6700;
        }
    </style><div class="${this.visible ? '' : 'hidden'}" title="spinner">${spinnerIcon}</div>`;
  }
}
customElements.define('map-spinner', MapSpinner);
