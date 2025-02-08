/*
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, html, css } from 'lit';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings.js';
import rootUrl from '../utils/rooturl.js';
import {translate as t, i18next,  changeLanguage} from '../i18n.js';


// These are the actions needed by this element.
//import {
//  navigate,
//  updateOffline,
//  updateLayout
//} from '../actions/app.js';

// These are the elements needed by this element.
import { menuIcon } from './my-icons.js';
import './web-map.js';
import './tooltip';

function getHashParameters()
{
  const hash = location.hash.substr(1);
  return hash.split('&').reduce(function (result, item) {
    var parts = item.split('=');
    result[parts[0]] = parts[1];
    return result;
  }, {});
}

import datacatalog from '../datacatalog.js';
/**
* @polymer
* @extends HTMLElement
*/
class MapApp extends (LitElement) {
  static get properties() {
    return {
      appName: {type: String, attribute: 'app-name'},
      configUrl: {type: String, attribute: 'config-url'},
      showLanguage: {type: Boolean, attribute: 'show-language'},
      defaultLanguage: {type: String, attribute: 'default-language'},
      logoUrl: {type: String, attribute: 'logo-url'},
      logoLinkUrl: {type: String, attribute: 'logo-link-url'},
      helpUrl: {type: String, attribute: 'help-url'},
    }
  }
  static styles = css`
  :host{
        display: block;
        width: 100%;
        height: 100%;
      }
      header {
        position: absolute;
        display: block;
        top: 0px;
        width: 100%;
        height: 40px;
        background-color: var(--theme-background-color, #f9e11e);
        color: var(--theme-color, white);
        box-sizing: border-box;
        padding-left: 1em;
      }
      header img {
        max-height: 100%;
      }
      .topnav {
        position: absolute;
        top: 5px;
        right: 1em;
        text-align: right;
        box-sizing: border-box;
      }
      .topnav ul { 
        list-style-type: none;
        margin: 0;
        padding: 0;
      }
      .topnav ul li {
        display: inline-block;
        padding-left: 4px;
      }
      .topnav ul li a {
        display: block;
        text-decoration: none;
        color: var(--theme-color, white);
      }
      .hamburger {
        display: none;
        cursor: pointer;
      }
      @media only screen and (max-width: 650px) {
        .topnav ul {
          display: none;
        }
        .hamburger {
          display: inline-block;
          fill: white;
          position: absolute;
          top: 5px;
          right: 1em;
        }
      }
      /* reponsive menu */
      .topnav.responsive {
        position: absolute;
        top: 35px;
        right: 0px;
        background-color: var(--theme-background-color, #f9e11e);
        z-index: 10;
        width: 200px;
      }
      .topnav.responsive ul {
        display: block;
        padding-right: 1em;
        margin: 2px;
        border-width: 0 1px 1px 1px;
        border-style: solid;
        border-color: #ccc;
        padding-bottom: 0.5em;
      }
      .topnav.responsive ul li {
        display: block;
      }
      web-map {
        position: absolute;
        top: 40px;
        display: block;
        width: 100%;
        bottom: 1.5em;
        box-sizing: border-box;
        background: white;
      }
      footer {
        position: absolute;
        display: block;
        bottom: 0px;
        width: 100%;
        height: 1.5em;
        background-color: var(--theme-background-color, #2e7dba);
        color: var(--theme-color, white);
        box-sizing: border-box;
        padding-left: 0.5em;
      }
      footer a {
        text-decoration: none;
        color: var(--theme-color, white);
      }
      footer a:hover {
        text-decoration: underline;
      }
      .App-search {
        position: absolute;
        top: 10px;
        right: 10px;
      }
      #languageselect {
        background-color: var(--theme-background-color, #2e7dba);
        color: var(--theme-color, white);
        font-size: 1em;
        border: 1px solid #cfcfcf;
        border-radius: 2px;
      }
      #languageselect:focus-visible {
        outline: none;
      }
      a img {
        border: none;
        outline: none;
        text-decoration: none;
      }
  `;
  constructor() {
    super();
    this.configUrl = getHashParameters().configurl;
    this.helpstart = getHashParameters().helpstart;
    this.exporttool = getHashParameters().exporttool;
    this.showLanguage = true;
    this.defaultLanguage = 'en';
    this.appName = "map-app";
    this.logoUrl = rootUrl + 'images/edugislogo.png';
    this.logoLinkUrl = '';
    this.helpUrl = 'https://edugis.nl/hoe-werkt-edugis-atlas';

    // To force all event listeners for gestures to be passive.
    // See https://www.polymer-project.org/3.0/docs/devguide/settings#setting-passive-touch-gestures
    setPassiveTouchGestures(true);
  }
  shouldUpdate(changedProperties) {
    if (changedProperties.has('defaultLanguage') && this.defaultLanguage !== 'auto') {
        i18next.changeLanguage(this.defaultLanguage);
    }
    if (changedProperties.has('logoUrl') && !this.logoUrl.toLowerCase().startsWith('http')) {
      this.logoUrl = rootUrl + this.logoUrl;
    }
    return true;
  }
  renderLogo() {
    if (this.logoUrl) {
      if (this.logoLinkUrl) {
        return html`<a href="${this.logoLinkUrl}" target="webmaplogotab"><img src="${this.logoUrl}" alt="logo"/></a>`;
      }
      return html`<img src="${this.logoUrl}" alt="logo"/>`;
    }
  }
  render() {
    // Anything that's related to rendering should be done in here.
    if (typeof APIkeys === 'undefined') {
      alert ('File "keys.js" not installed? RTFM!')
    }
    return html`
    <header>
      ${this.renderLogo()}
        <span class="hamburger" @click="${(e)=>this.toggleMenu()}">${menuIcon}</span>
        <nav class="topnav">
          <ul>
            <li class="menuitem"><a href="${t('$t(link how does {{appname}} work?)', {appname: this.appName})}" target="edugishelp">${t('How does {{appname}} work?', {appname: this.appName})}</a></li>
            <li class="menuitem">
                ${this.showLanguage ? html`
                <select id="languageselect" @change="${(e)=>this.changeLanguage(e)}">
                  <option value="nl" ?selected="${i18next.resolvedLanguage === 'nl'}">nl</option>
                  <option value="en" ?selected="${i18next.resolvedLanguage === 'en'}">en</option>
                  <option value="es" ?selected="${i18next.resolvedLanguage === 'es'}">es</option>
                  <option value="fr" ?selected="${i18next.resolvedLanguage === 'fr'}">fr</option>
                </select>
                ` : ''}
            </li>
          </ul>
        </nav>
    </header>
    <web-map .configurl="${this.configUrl}" .exporttool=${this.exporttool} navigation="bottom-left" scalebar="bottom-right" geolocate="top-right" coordinates="true" .defaultdatacatalog="${datacatalog}" .haslegend=${true} .accesstoken="${APIkeys.mapbox}"></web-map>
    <tool-tip></tool-tip>
    <footer className="App-footer">&copy;${new Date().getFullYear()} <a href="about.html" target="about">${this.appName}</a></footer>
    `;
  }
  firstUpdated() {
    window.addEventListener("hashchange", ()=>this.hashChanged());
    this.doHelpstart();
  }
  toggleMenu() {
    const x = this.shadowRoot.querySelector(".topnav");
    if (x.classList.contains("responsive")) {
      x.classList.remove("responsive");
    } else {
      x.classList.add("responsive");
    }
  }
  resetMenu() {
    const x = this.shadowRoot.querySelector(".topnav");
    if (window.innerWidth < 650 && x.classList.contains("responsive")) {
      x.classList.remove("responsive");
    }
  }
  async changeLanguage(e) {
    const newLanguage = e.target.value;
    await changeLanguage(newLanguage);
    this.requestUpdate();
  }
  connectedCallback() {
    super.connectedCallback();
    this.resizeHandler = ()=>this.resetMenu();
    window.addEventListener('resize', this.resizeHandler);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.resizeHandler);
  }
  doHelpstart() {
    if (this.helpstart && window.sessionStorage.getItem('helpstart') !== 'shown') {
      setTimeout(()=>{
          window.sessionStorage.setItem('helpstart', 'shown')
          var tour = {
              id: "hello-hopscotch",
              i18n: {
                nextBtn: `${t('Next')}`,
                prevBtn: `${t('Previous')}`,
                doneBtn: `${t('Done')}`,
                skipBtn: `${t('Skip')}`,
                closeTooltip: `${t('Close')}`,
                stepNums : ["1/3", "2/3", "3/3"]
              },
              steps: [
                  {
                      title: `${t('Map')}`,
                      content: `${t('Hopscotch map explain')}`,
                      target: document.querySelector("map-app").shadowRoot.querySelector('web-map').shadowRoot.querySelector('map-spinner'),
                      placement: "top"
                  },
                  {
                      title: `${t('Tools')}`,
                      content: `${t('Hopscotch tools explain')}`,
                      target: document.querySelector("map-app").shadowRoot.querySelector('web-map').shadowRoot.querySelector('#tool-menu-container'),
                      placement: "right",
                      yOffset: "center"
                  },
                  {
                      title: `${t('Legend')}`,
                      content: `${t('Hopscotch legend explain')}`,
                      target: document.querySelector("map-app").shadowRoot.querySelector('web-map').shadowRoot.querySelector('#legend-container-container > map-layer-container'),
                      placement: "left",
                      yOffset: "center"
                  }
              ]
            };
            // create custom border style for hopscotch bubbles
            const style = document.createElement('style');
            style.textContent = `
            div.hopscotch-bubble {
                border-color: var(--theme-background-color, #2e7dba);
                border-radius: 3px !important;
            }
            div.hopscotch-bubble .hopscotch-bubble-arrow-container.up .hopscotch-bubble-arrow-border {
              border-bottom: 17px solid var(--theme-background-color, #2e7dba);
            }
            div.hopscotch-bubble .hopscotch-bubble-arrow-container.down .hopscotch-bubble-arrow-border {
              border-top: 17px solid var(--theme-background-color, #2e7dba);
            }
            div.hopscotch-bubble .hopscotch-bubble-arrow-container.left .hopscotch-bubble-arrow-border {
              border-right: 17px solid var(--theme-background-color, #2e7dba);
            }
            div.hopscotch-bubble .hopscotch-bubble-arrow-container.right .hopscotch-bubble-arrow-border {
              border-left: 17px solid var(--theme-background-color, #2e7dba);
            }`;

            document.head.appendChild(style);
            // Start the tour!
            hopscotch.startTour(tour);
      }, 2000)
    }
  }
  hashChanged() {    
    const result = getHashParameters();
    if (result.hasOwnProperty('configurl')) {
      this.configUrl = result.configurl;
    } else {
      this.configUrl = "";
    }
    if (result.hasOwnProperty('exporttool')) {
      this.exporttool = result.exporttool;
    }
    if (result.hasOwnProperty('helpstart')) {
      this.helpstart = result.helpstart;
      this.doHelpstart();
    } else {
      this.helpstart = false;
    }
  }
}

window.customElements.define('map-app', MapApp);
