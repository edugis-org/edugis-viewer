import {LitElement, html, css} from 'lit';
import {unsafeHTML} from 'lit/directives/unsafe-html.js'
import rootUrl from '../utils/rooturl';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n';

/**
* @polymer
* @extends HTMLElement
*/
class MapInfoFormatted extends LitElement {
  static get properties() { 
    return { 
      active: Boolean,
      streetViewOn: Boolean,
      info: Array
    }; 
  }
  static get styles() {
    return css`
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
    .content { height: calc(100% - 1.5em); overflow: auto; font-size: 12px; }
    .streetviewcontainer {display: flex; flex-direction:row;  justify-content: flex-end;  }
    .layer {
      text-align: left;
      font-weight: bold;
      margin-top: 2px;
      background-color: lightgray;
    }
    .attributename {
      width: 90%;
      text-align: left;
    }
    .emphasize {
      font-weight: bold;
    }
    .attributevalue {
      width: 90%;
      text-align: left;
    }
    .attributetable {
      width: 100%;
      border-collapse: collapse;
    }
    tr.even {background: #f0f0f0;}
    td {width:50%;}
    .attributevalue .clickImage {cursor: pointer;}
  `}
  
  constructor() {
      super();
      this.info = [];
      this.filteredInfo = [];
      this.active = false;
      this.streetViewOn = false;
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
  toggleStreetView(e)
  {
    this.streetViewOn = !this.streetViewOn;
    this.dispatchEvent(
      new CustomEvent('togglestreetview',
        {
            detail: {streetview: this.streetViewOn},
        })
    );
  }
  shouldUpdate(changedProps) {
    if (changedProps.has('active')) {
      this.dispatchEvent(new CustomEvent("infomode", {
        detail: this.active,
        bubbles: true,
        composed: true
      }))
    }
    return this.active;
  }
  renderExplanation() {
    if (this.info.filter(feature=>
        !((feature.layer?.layout?.visibility === 'none') || 
          (feature.layer?.metadata?.reference))).length == 0) {
      return html`
      <ul>
      <li>${t('Click a map element for info on that element')}</li>
      <li>${t('Note: most objects on the background maps do not have additional information.')}</li>
      <li>${t('Click the StreetView button to show a streetview image')}</li>
    </ul>
      `;
    }
    return html``;
  }
  render() {
    if (!this.active) {
      return html``;
    }
    let layerMap = new Map();
    return html`
      <style>
        .check-on {display: inline-block; width: 20px; height: 20px; vertical-align: middle; background: url('${rootUrl}images/checkradio.png') 20px 20px; }
        .check-off { display: inline-block; width: 20px; height: 20px; vertical-align: middle; background: url('${rootUrl}images/checkradio.png') 20px 0px; }
      </style>
      <div class="header">${t('Get info from map')}</div>
      <div class="content">
      <div class="streetviewcontainer">
      <div @click="${e=>this.toggleStreetView(e)}">
        <span>StreetView</span><div class="${this.streetViewOn?'check-on':'check-off'}"></div>
      </div>
      </div>
      ${this.renderExplanation()}
      <table class="attributetable">
      ${this.info.filter(feature=>(feature.layer.layout && feature.layer.layout.visibility && feature.layer.layout.visibility === 'none') ||  (feature.layer.metadata && feature.layer.metadata.reference)?false:true)
        .filter(feature=>{ // filter muliple features from same layer
          if (feature.layer && feature.layer.id) {
            if (layerMap.has(feature.layer.id)) {
              let featureCount = layerMap.get(feature.layer.id);
              const maxFeaturesPerLayer = feature.layer.metadata?.maxinfofeatures || 1;
              if (featureCount < maxFeaturesPerLayer) {
                layerMap.set(feature.layer.id, featureCount + 1);
                return true;
              }
              return false;
            }
            layerMap.set(feature.layer.id, 1);
          }
          return true;
        })
        .map(feature=>
        html`
            <tr><td colspan="2"><div class="layer">${feature.layer.metadata?feature.layer.metadata.title?feature.layer.metadata.title:feature.layer.id:feature.layer.id}</div></td></tr>
            ${this.renderAttributes(feature)}
          `
      )}
      </table>
      </div>
    `;
  }
  renderAttributes(feature) {
    if (Object.keys(feature.properties).length === 0) {
      return html`<tr><div class="attributevalue">${t('no info available for this location')}</div></tr>`
    }
    let result = [];
    let odd = false;
    
    if (feature.layer && feature.layer.metadata && feature.layer.metadata.attributes) {
      let attributes = feature.layer.metadata.attributes;
      // add attributes/properties with translations
      if (attributes.translations) {
        for (let translation of attributes.translations) {
          if (translation.name) {
            if (attributes.deniedattributes && attributes.deniedattributes.indexOf(translation.name) > -1) {
              continue; // skip deniedattribute
            }
            if (attributes.allowedattributes && attributes.allowedattributes.indexOf(translation.name) === -1) {
              continue; // skip attribute not in allowedattributes
            }
            if (feature.properties[translation.name] || feature.properties[translation.name] === 0) {
              let value = feature.properties[translation.name];
              if (translation.date) {
                const date = new Date(value);
                value = date.toLocaleString();
              }
              if (translation.valuemap && Array.isArray(translation.valuemap)) {
                const valueMap = translation.valuemap.find(valueMap=>
                    Array.isArray(valueMap) &&
                    valueMap.length > 1 &&
                    valueMap[0] == value &&
                    (valueMap.length < 3 || valueMap[2] === "" || valueMap[2] === "=="));
                if (valueMap) {
                  value = valueMap[1];
                }
              }
              if (translation.multiplier && !isNaN(parseFloat(translation.multiplier))) {
                if (typeof parseFloat(value) == "number" && !isNaN(parseFloat(value))) {
                  value = parseFloat(value) * parseFloat(translation.multiplier);
                }
              }
              if (translation.hasOwnProperty('decimals') && !isNaN(parseInt(translation.decimals))) {
                if (typeof parseFloat(value) == "number" && !isNaN(parseFloat(value))) {
                  let factor = Math.pow(10, parseInt(translation.decimals));
                  value = parseInt(Math.round(parseFloat(value) * factor)) / factor;
                }
              }
              if (translation.unit && translation.unit !== "" && !isNaN(parseInt(value))) {
                value += translation.unit;
              }
              let translatedKey = translation.translation ? translation.translation: translation.name;
              result.push(this.renderAttribute(translatedKey, value, odd=!odd, attributes.emphasize?.includes(translation.name)));
            }
          }
        }
      }
      // now add attributes/properties without translations
      for (let key in feature.properties) {
        if (attributes.deniedattributes && attributes.deniedattributes.indexOf(key) > -1) {
          continue; // skip deniedattribute
        }
        if (attributes.allowedattributes && attributes.allowedattributes.indexOf(key) === -1) {
          continue; // skip attribute not in allowedattributes
        }
        if (attributes.translations && attributes.translations.findIndex(translation=>translation.name === key) > -1) {
          continue; // skip translated attributes
        }
        result.push(this.renderAttribute(key, feature.properties[key], odd=!odd, attributes.emphasize?.includes(key)));
      }
    } else {
      for (let key in feature.properties) {
        result.push(this.renderAttribute(key, feature.properties[key], odd=!odd, false));
      }
    }
    return result;
  }
  formatAttributeValue(htmlvalue) {
    if (typeof htmlvalue !== "string") {
      return JSON.stringify(htmlvalue);
    }
    htmlvalue = htmlvalue.replace(">", "&gt;");
    htmlvalue = htmlvalue.replace("<", "&lt;");
    const urls = htmlvalue.match(/(https?:\/\/[^\s]+)(?=\s|$)/gi);
    if (urls) {
      urls.forEach(url => {
          htmlvalue = htmlvalue.replace(url, `<a href="${url}" noreferrer noopener target="_blank">${url}</a>`);
      });
    }
    return unsafeHTML(htmlvalue);
  }
  isImgageUrl(value){
    if (typeof value !== 'string') {
      return false;
    }
    if (value.toLocaleLowerCase().startsWith('https://maps.googleapis.com')) {
      return true;
    }
    if (!value.toLocaleLowerCase().startsWith('https://')) {
      return false;
    }
    value = value.trim();
    if (value.indexOf(' ') > -1) {
      return false;
    }
    try {
      const objectUrl = new URL(value);
      const ext = objectUrl.pathname.split('.').pop().toLocaleLowerCase();
      return ['png', 'jpg', 'gif', 'svg'].includes(ext);
    } catch (error) {
      return false;
    }
  }
  renderAttribute(key, value, odd, emphasize) {
    let isImage = this.isImgageUrl(value);
    return html`<tr class=${odd?'':"even"}><td><div class="attributename${emphasize?' emphasize':''}">${key}</div></td>
    <td><div class="attributevalue${emphasize?' emphasize':''}">${typeof value === 'object' && value !== null?
          JSON.stringify(value) :
            isImage?
              html`<img class="clickImage" src="${value}" width="95%" @click="${e=>this._imageClicked(e)}">`:
              this.formatAttributeValue(value)}</div></td></tr>`
  }
  _imageClicked(event) {
    const imageUrl = event.target.src;
    if (imageUrl.startsWith('https://maps.googleapis.com')) {
      const streetViewLayer = this.info.filter(infoItem=>infoItem.layer.id === 'streetview');
      if (streetViewLayer.length) {
        const props = streetViewLayer[0].properties;
        // https://stackoverflow.com/questions/387942/google-street-view-url
        const streetViewUrl = `https://maps.google.com/maps?q=&layer=c&cbll=${props.latitude},${props.longitude}&cbp=11,0,0,0,0`
        this.dispatchEvent(new CustomEvent('showmodaldialog', {
          bubbles: true,
          composed: true,
          detail: {
            markdown: `[![Afbeelding](${imageUrl})](${streetViewUrl})\n\n${t("Click on the image for a full streetview")}`
          }
        }))
      }
      return;
    }
    this.dispatchEvent(new CustomEvent('showmodaldialog', {
      bubbles: true,
      composed: true,
      detail: {
        markdown: `[![Afbeelding](${event.target.src})](${event.target.src})`
      }
    }))
  }
}

customElements.define('map-info-formatted', MapInfoFormatted);
