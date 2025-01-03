import {LitElement, html, css, svg} from 'lit';
import './map-legend-item-edit';

class MapLegendLine extends LitElement {
    static get styles() {
        return css`
        :host {
            display: block;
        }
        .container {
            display: flex;
            align-items: flex-start;
        }
        .label {
            padding-left: 2px;
            cursor: pointer;
        }`
    }
    static get properties() { 
        return { 
          title: {stype: String},
          items: {type: Object},
          layerid: {type: String},
          activeEdits: {type: Array}
        }; 
    }
    constructor() {
        super();
        this.title = "untitled";
        this.items = [];
        this.layerid = "";
        this.activeEdits = [];
    }
    connectedCallback() {
        super.connectedCallback()
        //addEventListener('keydown', this._handleKeydown);
    }
    disconnectedCallback() {
        super.disconnectedCallback()
        //window.removeEventListener('keydown', this._handleKeydown);
    }
    shouldUpdate(changedProp) {
        if (changedProp.has('items')) {
            // do something with sprop change
        }
        return true;
    }
    _lineItem(color, width, label) {
        return svg`<svg width="30" height="15" style="flex-shrink:0;">
        <line x1="0" y1="8" x2="30" y2="8" style="stroke:${color};stroke-width:${width};" />
        </svg>${html`<span class="label">${label}</span>`}`
    }
    render() {
        const items = this.items;
        if (items.colorItems.length <= 1 && items.strokeWidthItems.length <= 1) {
            const color = items.colorItems.length ? items.colorItems[0].paintValue : '#000';
            const width = items.strokeWidthItems.length ? items.strokeWidthItems[0].paintValue : 1;
            const label = items.colorItems.length ? items.colorItems[0].attrExpression ? `${items.colorItems[0].attrExpression} ${items.colorItems[0].attrName}` : items.colorItems[0].attrName: 'untitled';
            const line = this._lineItem(color, width, label);
            return html`
            <map-legend-item-edit 
                .visible=${this.activeEdits.includes(0)}
                @editActive="${this._editActive}"
                @change="${this._lineColorChanged}"
                @changeLineWidth="${this._lineWidthChanged}"
                legendItemType="line" 
                .color=${color} 
                .lineWidth=${width}><div class="container">${line}</div>
            </map-legend-item-edit>
            `
        }
        let result = [];
        if (items.colorItems.length === items.strokeWidthItems.length) {
            let i;
            for (i = 0; i < items.colorItems.length; i++) {
                if (items.colorItems.attrValue !== items.strokeWidthItems.attrValue) {
                    break;
                }
            }
            if (i === items.colorItems.length) {
                // same size, same attributes
                for (i = 0; i < items.colorItems.length; i++) {
                    const label = items.colorItems.length ? items.colorItems[i].attrValue: null;
                    if (label || label === 0) {
                        result.push(html`<div class="container">${this._lineItem(items.colorItems[i].paintValue,items.strokeWidthItems[i].paintValue,label)}</div>`)
                    }
                }
                return result;
            }
        }
        if (items.colorItems.length > 1) {
            const lineWidth = items.strokeWidthItems.length === 1 ? items.strokeWidthItems[0].paintValue : 1
            result.push(html`<div class="title">${items.colorItems[0].attrName}</div>`);
            for (let i = 0; i < items.colorItems.length; i++) {
                const label = items.colorItems.length ? items.colorItems[i].attrValue: null;
                if (label || label === 0) {
                    result.push(html`<div class="container">${this._lineItem(items.colorItems[i].paintValue,lineWidth,label)}</div>`)
                }
            }
        }
        if (items.strokeWidthItems.length > 1) {
            let lineColor = items.colorItems.length === 1 ? items.colorItems[0].paintValue : '#aaa';
            result.push(html`<div class="title">${items.strokeWidthItems[0].attrName}</div>`);
            for (let i = 0; i < items.strokeWidthItems.length; i++) {
                const label = items.strokeWidthItems[i].attrValue;
                if (label || label === 0) {
                    result.push(html`<div class="container">${this._lineItem(lineColor, items.strokeWidthItems[i].paintValue,label)}</div>`)
                }
            }
        }
        return result;
    }
    
    _editActive(event) {
        if (event.detail.editActive) {
            this.activeEdits = this.activeEdits.concat(event.detail.itemIndex);
        } else {
            this.activeEdits = this.activeEdits.filter(index=>index !== event.detail.itemIndex);
        }
        this.dispatchEvent(new CustomEvent('activeEdits', {
            detail: {
                activeEdits: this.activeEdits,
                layerid: this.layerid
            }
        }));
    }
    _lineColorChanged(event) {
        const itemIndex = event.detail.itemIndex;
        const color = event.detail.color;
        this.items.colorItems[itemIndex].paintValue = color;
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                layerid: this.layerid,
                color: color,
                itemIndex: itemIndex
            }
        }));
        this.requestUpdate();
    }
    _lineWidthChanged(event) {
        const itemIndex = event.detail.itemIndex;
        const width = event.detail.width;
        this.items.strokeWidthItems[itemIndex].paintValue = width;
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                layerid: this.layerid,
                width: width,
                itemIndex: itemIndex
            }
        }));
        this.requestUpdate();
    }
}

customElements.define('map-legend-line', MapLegendLine);