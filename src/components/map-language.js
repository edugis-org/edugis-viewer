import {LitElement, html} from 'lit';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n.js';
/**
* @polymer
* @extends HTMLElement
*/
class MapLanguage extends LitElement {
  static get properties() { 
    return { 
      active: Boolean,
      language: String,
    }; 
  }
  constructor() {
    super();
    this.active = false;
    this.language = 'autodetect';
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
  changeLangue(e) {
    this.language = this.shadowRoot.querySelector('select').value;
    this.chooservisible = false;
    this.dispatchEvent(new CustomEvent("languagechanged",
      {
        detail: {language: this.language},
        bubbles: true,
        composed: true
      }
    ))
  }
  render() {
    if (!this.active) {
      return html``;
    }
    return html`
    <div>
      <style>
        #langbutton {width: 100px; cursor: pointer} 
        div svg {display: inline-block; vertical-align: middle;}
        select {width:100%;
              border: 1px solid #d8e0e7;
              border-radius: 2px;
              background: #fff;
              color: #6b7c93;
              padding: 9.6px;
              font-size: 14px;
              height: 39.2px;
        }
      </style>
      ${t('Select language for map display')}:
      <select @change="${e=>this.changeLangue(e)}">
        <option .selected="${this.language==="autodetect"?'selected':undefined}" value="autodetect">Browser</option>
        <option .selected="${this.language==="native"?'selected':undefined}" value="native">Local</option>
        <option .selected="${this.language==="en"?'selected':undefined}" value="en">English</option>
        <option .selected="${this.language==="de"?'selected':undefined}" value="de">Deutsch</option>
        <option .selected="${this.language==="fr"?'selected':undefined}" value="fr">Français</option>
        <option .selected="${this.language==="fr"?'selected':undefined}" value="es">Español</option>
        <option .selected="${this.language==="nl"?'selected':undefined}" value="nl">Nederlands</option>
        <option .selected="${this.language==="zh"?'selected':undefined}" value="zh">橘子</option>
        <option .selected="${this.language==="ru"?'selected':undefined}" value="ru">русский</option>
        <option .selected="${this.language==="ar"?'selected':undefined}" value="ar">العربية</option>
      </select>
    </div>`
  }
}
customElements.define('map-language', MapLanguage);
