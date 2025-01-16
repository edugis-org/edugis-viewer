import {LitElement, html, css} from 'lit';
import {ifDefined} from 'lit/directives/if-defined.js';
import './color-picker';
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener} from '../i18n.js';

class MapLegendItemEdit extends LitElement {
    static get styles() {
      return css`
      :host {
        display: block;
      }
      .panel {
        margin-left: 2px;
        background-color: whitesmoke;
        border-radius: 3px;
      }
      .wrapper {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        width: 100%;
      }
      .wrapper .label {
        margin-top: auto;
        margin-bottom: auto;
        padding-right: 3px;
      }
      .wrapper .right {
        flex: 1;
      }
      .fillpicker {
        display: inline-block;
        width:  15px;
        height: 10px;
        border: 1px solid gray;
        cursor: pointer;
      }
      .linepicker {
        cursor: pointer;
      }
      input[type=range] {
        height: 17px;
        -webkit-appearance: none;
        margin: 10px 0;
        width: 100%;
        background-color: rgba(0,0,0,0);
      }
      input[type=range]:focus {
        outline: none;
      }
      input[type=range]::-webkit-slider-runnable-track {
        width: 100%;
        height: 2px;
        cursor: pointer;
        animate: 0.2s;
        box-shadow: 0px 0px 0px #000000;
        background: #CCCCCC;
        border-radius: 5px;
        border: 0px solid #000000;
      }
      input[type=range]::-webkit-slider-thumb {
        box-shadow: 0px 0px 0px #000000;
        border: 0px solid #2497E3;
        height: 11px;
        width: 11px;
        border-radius: 10px;
        background: #555;
        cursor: pointer;
        -webkit-appearance: none;
        margin-top: -4.5px;
      }
      input[type=range]:focus::-webkit-slider-runnable-track {
        background: #CCCCCC;
      }
      input[type=range]::-moz-range-track {
        width: 100%;
        height: 2px;
        cursor: pointer;
        animate: 0.2s;
        box-shadow: 0px 0px 0px #000000;
        background: #CCCCCC;
        border-radius: 5px;
        border: 0px solid #000000;
      }
      input[type=range]::-moz-range-thumb {
        box-shadow: 0px 0px 0px #000000;
        border: 0px solid #2497E3;
        height: 11px;
        width: 11px;
        border-radius: 10px;
        background: #555;
        cursor: pointer;
      }
      input[type=range]::-ms-track {
        width: 100%;
        height: 2px;
        cursor: pointer;
        animate: 0.2s;
        background: transparent;
        border-color: transparent;
        color: transparent;
      }
      input[type=range]::-ms-fill-lower {
        background: #CCCCCC;
        border: 0px solid #000000;
        border-radius: 10px;
        box-shadow: 0px 0px 0px #000000;
      }
      input[type=range]::-ms-fill-upper {
        background: #CCCCCC;
        border: 0px solid #000000;
        border-radius: 10px;
        box-shadow: 0px 0px 0px #000000;
      }
      input[type=range]::-ms-thumb {
        margin-top: 1px;
        box-shadow: 0px 0px 0px #000000;
        border: 0px solid #2497E3;
        height: 11px;
        width: 11px;
        border-radius: 10px;
        background: #555;
        cursor: pointer;
      }
      input[type=range]:focus::-ms-fill-lower {
        background: #CCCCCC;
      }
      input[type=range]:focus::-ms-fill-upper {
        background: #CCCCCC;
      }
      `
    }
    static get properties() { 
        return { 
          legendItemType: {type: String}, // 'fill', 'line', 'circle', ...
          itemIndex: {type: Number},
          color: {type: String},
          lineWidth: {type: Number},
          lineColor: {Stype: String},
          radius: {type: Number},
          fontStyle: {type: String},
          visible: {type: Boolean}
        }; 
    }
    constructor() {
        super();
        this.visible = false;
        this.legendItemType = undefined;
        this.itemIndex = 0;
        this.color = undefined;
        this.lineWidth = undefined;
        this.lineColor = undefined;
        this.radius = undefined;
        this.fontStyle = "";
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
    shouldUpdate(changedProp) {
        return true;
    }
    render() {
        return html`<slot @click="${this._click}"></slot>
            ${this.visible?this._renderLegendEditor():""}`
    }
    _click(e) {
        this.dispatchEvent(new CustomEvent('editActive', {
            detail: {
                editActive: !this.visible,
                itemIndex: this.itemIndex
            }
        }))
    }
    _renderOptionalFillOptions() {
        if (this.lineColor) {
        return html`
            <div class="wrapper">
                <div class="label">${t('Border color')}:</div>
                <color-picker .color=${this.color} @change="${e=>this._lineColorChange(e)}">
                    <div class="linepicker"><svg width="20" height="10">
                        <title>lijnkleur</title>
                        <line x1="0" y1="5" x2="20" y2="5" stroke="${this.lineColor?this.lineColor:this.color}" />
                    </svg></div>
                </color-picker>
            </div>`;
        }
        return html``;
    }
    _renderOptionalCircleOptions() {
        if (this.lineWidth) {
            return html`
            <div class="wrapper">
                <div class="label">${t('border width')}: </div><input class="right" type="range" min="0.001" max="5" step="0.1" value="${this.lineWidth?this.lineWidth:0}" @input="${(e)=>this._lineWidthChange(e)}"/>
            </div>
            <div class="wrapper">
                <div class="label">${t('border color')}: </div>
                <color-picker .color=${this.color} @change="${e=>this._lineColorChange(e)}">
                    <div class="linepicker"><svg width="20" height="10">
                        <title>kleur</title>
                        <line x1="0" y1="5" x2="20" y2="5" stroke="${this.lineColor}" stroke-width="${this.lineWidth}" />
                    </svg></div>
                </color-picker>
            </div>`;
        }
        return html``;
    }
    _renderLegendEditor() {
        let color = this.color;
        switch(this.legendItemType) {
            case 'fill':
                return html`
                <div class="panel">
                    <div class="wrapper">
                        <div class="label">${t('Fill color')}:</div>
                        <color-picker .color=${this.color} @change="${e=>this._colorChange(e)}">
                            <div class="fillpicker" title="${ifDefined(t('color')??undefined)}" style="background-color:${color}"></div>
                        </color-picker>
                    </div>
                    ${this._renderOptionalFillOptions()}
                </div>`
            case 'line': 
                return html`
                <div class="panel">${this.lineWidth !== undefined?html`<div class="wrapper">
                        <div class="label">${t('width')}: </div><input class="right" type="range" min="0" max="10" step="0.1" value="${this.lineWidth}" @input="${this._lineWidthChange}"> </div>`:""}
                    <div class="wrapper">
                        <div class="label">${t('color')}: </div>
                        <color-picker .color=${this.color} @change="${e=>this._colorChange(e)}">
                            <div class="linepicker"><svg width="20" height="10">
                                <title>kleur</title>
                                <line x1="0" y1="5" x2="20" y2="5" stroke="${this.lineColor?this.lineColor:this.color}" />
                            </svg></div>
                        </color-picker>
                    </div>
                </div>`
            case 'circle':
                return html`
                <div class="panel">
                    <div class="wrapper">
                        <div class="label">${t('radius')}: </div><input class="right" type="range" min="0" max="40" step="0.1" value="${this.radius?this.radius:0}" @input="${(e)=>this._radiusChange(e)}"/>
                    </div>
                    <div class="wrapper">
                        <div class="label">${t('color')}: </div>
                        <color-picker .color=${this.color} @change="${e=>this._colorChange(e)}">
                            <div class="fillpicker" title="${ifDefined(t('color')??undefined)}" style="background-color:${color}"></div>
                        </color-picker>
                    </div>
                    ${this._renderOptionalCircleOptions()}
                </div>`
            case 'symbol': {
                const fontSizeMatch = this.fontStyle.match(/font-size\s*:\s*([^;]*)/);
                const fontSize = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 12;
                const fontColormatch = this.fontStyle.match(/color\s*:\s*([^;]*)/);
                const fontColor = fontColormatch ? fontColormatch[1] : "#000";
                if (fontSizeMatch)
                return html`
                <div class="panel">
                    <div class="wrapper">
                        <div class="label">${t('size')}: </div><input class="right" type="range" min="0" max="30" step="0.2" value="${fontSize}" @input="${this._fontSizeChange}"/>
                    </div>
                    <div class="wrapper">
                        <div class="label">${t('text color')}: </div>
                        <color-picker .color=${fontColor} @change="${e=>this._fontColorChange(e)}">
                            <div class="fillpicker" title="${ifDefined(t('color')??undefined)}" style="background-color:${fontColor}"></div>
                        </color-picker>
                    </div>
                </div>
                `
            }
            break;
            default:
                return html`Legend item editor for '${this.legendItemType}' not implemented`;
        }
    }
    _fontSizeChange(event) {
        const fontStyles = this.fontStyle.split(';');
        const sizeIndex = fontStyles.findIndex(style=>style.trim().startsWith('font-size'));
        const fontSizeStyle = `font-size:${event.target.value}px`;
        if (sizeIndex > -1) {
            fontStyles[sizeIndex] = fontSizeStyle;
        } else {
            fontStyles.push(fontSizeStyle);
        }
        this.fontStyle = fontStyles.join(';');
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                style: this.fontStyle,
                itemIndex: this.itemIndex
            }
        }))
    }
    _fontColorChange(event) {
        const fontStyles = this.fontStyle.split(';');
        const colorIndex = fontStyles.findIndex(style=>style.trim().startsWith('color'));
        const fontColorStyle = `color:${event.detail.color}`;
        if (colorIndex > -1) {
            fontStyles[colorIndex] = fontColorStyle;
        } else {
            fontStyles.push(fontColorStyle);
        }
        this.fontStyle = fontStyles.join(';');
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                style: this.fontStyle,
                itemIndex: this.itemIndex
            }
        }))
    }
    _colorChange(event) {
        this.color = event.detail.color;
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                color: event.detail.color,
                itemIndex: this.itemIndex
            }
        }));
    }
    _lineColorChange(event) {
        this.lineColor = event.detail.color;
        this.dispatchEvent(new CustomEvent('changeLineColor', {
            detail: {
                color: event.detail.color,
                itemIndex: this.itemIndex
            }
        }))
    }
    _lineWidthChange(event) {
        this.lineWidth = parseFloat(event.target.value);
        this.dispatchEvent(new CustomEvent('changeLineWidth', {
            detail: {
                width: this.lineWidth,
                itemIndex: this.itemIndex
            }
        }))
    }
    _radiusChange(event) {
        this.radius = parseFloat(event.target.value);
        this.dispatchEvent(new CustomEvent('changeRadius', {
            detail: {
                radius: this.radius,
                itemIndex: this.itemIndex
            }
        }))
    }
}

customElements.define('map-legend-item-edit', MapLegendItemEdit);