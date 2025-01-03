import "./map-iconbutton.js";
import { imageSearchIcon, searchIcon, panoramaWideIcon as areaIcon, showChartIcon as lineIcon, locationOnIcon as pointIcon, closeIcon } from "./my-icons.js";
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n.js';

function getIcon(osmtype) {
  switch (osmtype) {
    case 'relation':
      return areaIcon;

    case 'node':
      return pointIcon;

    case "way":
      return lineIcon;

    default:
      return osmtype;
  }
}

import { LitElement, html, css} from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
  class MapSearch extends LitElement {
    static styles = css`
      .searchbox {
        width: 100%;
        height: 30px;
        display: flex;
        align-items: center;
        box-sizing: border-box;
      }
      .searchbox input {
        border: none;
        left: 1em;
        width: calc(100% - 50px);
      }
      .searchbox input:focus {
        outline: none;
        border-bottom: 1px solid lightblue;
      }
      .searchbutton {
        position: absolute;
        right: 5px;
        fill: gray;
        padding-top: 6px;
      }
      .searchbutton:hover, .erasebutton:hover {
        fill: darkcyan;
      }
      .erasebutton {
        position: absolute;
        right: 30px;
        fill: gray;
        padding-top: 6px;
      }
      .resultlist {
        right: 0px;
        padding-left: 40px;
        top: 28px;
        border-top: none;
        font-size: 12px;
        max-height: 400px;
        overflow: auto;
      }
      .resultlist ul {
        list-style-type: none;
        margin: 0;
        padding:20px;
      }
      .resultlist ul li {
        border-bottom: 1px solid lightgray;
        cursor:pointer;
      }
      .resultlist ul li:hover {
        background-color: lightgray;
      }
      .resultlist ul li svg {
        fill: darkgray;
        width: 18px;
        height: 18px;
        margin-bottom: -0.4em;
      }
      .hidden {
        display: none;
      }
    `;
    static get properties() {
    return {
      info: {type: String},
      resultList: {type: Array},
      viewbox: {type: Array},
      active: {type: Boolean}
    };
  }

  constructor() {
    super(); 
    // properties
    this.info = `${t('Countries, Places, Rivers, ...')}`;
    this.resultList = null;
    this.viewbox = [];
    this.active = true;
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
    this.info = `${t('Countries, Places, Rivers, ...')}`;
  }
  triggerResult() {
    if (this.prevResultList == null && this.resultList == null) {
      return;
    }

    this.prevResultList = this.resultList;
    this.dispatchEvent(new CustomEvent('searchresult', {
      detail: this.resultList,
      bubbles: true,
      composed: true
    }));
  }

  async search(e) {
    let searchText = this.shadowRoot.querySelector('input').value.trim();

    if (searchText.length > 1) {
      searchText = this.normalizeWhenCoordinateString(searchText);
      
      let url;
      if (this.viewbox.length) {
        url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&viewbox=${this.viewbox.join(',')}&bounded=0&polygon_geojson=1&addressdetails=1&limit=15`;
      } else {
        url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&polygon_geojson=1&addressdetails=1&limit=15`;
      }

      let response = await fetch(url);
      if (response.ok) {
        this.resultList = await response.json();
        this.triggerResult();
      };
    }
  }

  keyup(e) {
    if (e.key == 'Enter') {
      this.search(e);
    } else {
      this.resultList = null;
      this.triggerResult();
    }
  }

  changed(_e) {
    this.resultList = null;
    this.triggerResult();
  }

  zoomTo(point, bbox) {
    this.dispatchEvent(new CustomEvent('searchclick', {
      detail: {
        point: point,
        bbox: [bbox[2], bbox[0], bbox[3], bbox[1]]
      },
      bubbles: true,
      composed: true
    }));
  }

  searchErase(_e) {
    if (this.resultList !== null) {
      this.shadowRoot.querySelector('input').value = "";
      this.resultList = null;
      this.triggerResult();
    }
  }

  render() {
    if (!this.active) {
      this.searchErase();
      return html``;
    }

    return html`
    <div class="searchbox${this.active ? '' : ' hidden'}">
      <input type="text" placeholder="${this.info}" @paste="${e=>this.pastedToSearch(e)}" @keyup="${e => this.keyup(e)}">
      ${this.active && this.resultList && this.resultList.length ? html`<i class="erasebutton" @click="${e => this.searchErase(e)}">${closeIcon}</i>` : ''}
      <span title="${ifDefined(t('search')??undefined)}" class="searchbutton" @click="${e => this.search(e)}">${searchIcon}</span>
    </div>
    ${this.active && this.resultList && this.resultList.length ? html`
      <div class="resultlist">
        <ul>
          ${this.resultList.map(item => html`
            <li @click="${e => this.zoomTo([item.lon, item.lat], item.boundingbox)}">
                ${item.hasOwnProperty('icon') ? html`
                  <img src="${item.icon}">` : html`${getIcon(item.osm_type)}`}
                ${item.display_name}
            </li>`)}
        </ul>
      </div>` : this.active && Array.isArray(this.resultList) && this.resultList.length === 0 ? html`
          <div class="resultlist">
            <ul>
              <li>${t('nothing found')}</li>
            </ul>
          </div>` : ''}`;
  }
  normalizeWhenCoordinateString(coordinateString){
    // coordinate can be either lat,lon or lon,lat
    // nominatium expects lat,long not long,lat or added N, E, S, W
    const isValidFloatPair = (input) => {
      const regex = /^\s*-?\d*(\.\d+)?\s*,\s*-?\d*(\.\d+)?\s*$/;
      return regex.test(input);
    }
    if (isValidFloatPair(coordinateString)) {
      const coordinates = coordinateString.split(',');
      const normalizeLongitude = (longitude) => {
        const digits = longitude.toString().split('.')[1].length;
          longitude = longitude % 360;
          if (longitude > 180) {
            longitude -= 360;
          }
          return parseFloat(longitude.toFixed(digits));
      }
      const floatParts = coordinates.map(parseFloat);
      // assume lat, lon, but swap if lat > 90 or lat < -90
      if (floatParts[0] > 90 || floatParts[0] < -90) {
        floatParts.reverse();
      }
      floatParts[0] = normalizeLongitude(floatParts[0]);
      return `${Math.abs(floatParts[0])} ${floatParts[0] >= 0 ? 'N' : 'S'},${Math.abs(floatParts[1])} ${floatParts[1] >= 0 ? 'E' : 'W'}`;
      
    }
    return coordinateString;
  }
}

customElements.define('map-search', MapSearch);