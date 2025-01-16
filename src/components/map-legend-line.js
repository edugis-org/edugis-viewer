import {LitElement, html, css, svg} from 'lit';
import './map-legend-item-edit';

class MapLegendLine extends LitElement {
    static get styles() {
        return css`
        :host {
            display: block;
        }
        .container, .editcontainer {
            display: flex;
            align-items: flex-start;
        }
        .editcontainer {
            cursor: pointer;
        }
        .label {
            padding-left: 2px;
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
    _lineItem(color, width, label) {
        return svg`<svg width="30" height="15" style="flex-shrink:0;">
        <line x1="0" y1="8" x2="30" y2="8" style="stroke:${color};stroke-width:${width};" />
        </svg>${html`<span class="label">${label}</span>`}`
    }
    renderLineLegendEditor(label, index) {
        const items = this.items;
        const color = items.colorItems[index]?.paintValue ?? '#aaa';
        const width = items.strokeWidthItems[index]?.paintValue ?? 1;
        const line = this._lineItem(color, width, label);
        return html`
            <map-legend-item-edit 
                .itemIndex=${index}
                .visible=${this.activeEdits.includes(index)}
                @editActive="${this._editActive}"
                @change="${this._lineColorChanged}"
                @changeLineWidth="${this._lineWidthChanged}"
                legendItemType="line" 
                .color=${color} 
                .lineWidth=${width}><div class="editcontainer">${line}</div>
            </map-legend-item-edit>
            `;

    }
    render() {
        let result = [];
        const items = this.items;
        if (items.colorItems.length <= 1 && items.strokeWidthItems.length <= 1) {
            let label = 'untitled';
            const item = items.colorItems.length ? items.colorItems[0] : items.strokeWidthItems[0];
            if (item) {
                if (item.attrExpression) {
                    label = `${item.attrExpression} ${item.attrName}`;
                } else {
                    label = item.attrName;
                }
            }
            result.push(this.renderLineLegendEditor(label, 0));
            return result;
        }
        
        if (items.colorItems.length === items.strokeWidthItems.length) {
            let i;
            for (i = 0; i < items.colorItems.length; i++) {
                if (items.colorItems.attrValue !== items.strokeWidthItems.attrValue) {
                    break;
                }
            }
            if (i === items.colorItems.length) {
                // multiple lines, color and stroke classes same length, same attributes
                result.push(html`<div class="title">${items.colorItems[0].attrName}</div>`);
                for (i = 0; i < items.colorItems.length; i++) {
                    const label = items.colorItems.length ? items.colorItems[i].attrValue: null;
                    if (label || label === 0) {
                        //result.push(html`<div class="container">${this._lineItem(items.colorItems[i].paintValue,items.strokeWidthItems[i].paintValue,label)}</div>`)
                        result.push(this.renderLineLegendEditor(label, i));
                    }
                }
                return result;
            }
        }
        if (items.colorItems.length > 1) {
            const lineWidth = items.strokeWidthItems.length === 1 ? items.strokeWidthItems[0].paintValue : 1
            result.push(html`<div class="title">${items.colorItems[0].attrName}</div>`);
            for (const item of items.colorItems) {
                const label = item.attrValue;
                if (label || label === 0) {
                    result.push(html`<div class="container">${this._lineItem(item.paintValue,lineWidth,label)}</div>`)
                }
            }
        }
        if (items.strokeWidthItems.length > 1) {
            let lineColor = items.colorItems.length === 1 ? items.colorItems[0].paintValue : '#aaa';
            result.push(html`<div class="title">${items.strokeWidthItems[0].attrName}</div>`);
            for (const item of items.strokeWidthItems) {
                const label = item.attrValue;
                if (label || label === 0) {
                    result.push(html`<div class="container">${this._lineItem(lineColor, items.paintValue,label)}</div>`)
                }
            }
        }
        return result;
    }
    
    _editActive(event) {
        if (event.detail.editActive) {
            if (!this.activeEdits.includes(event.detail.itemIndex)) {
                this.activeEdits = this.activeEdits.concat(event.detail.itemIndex);
            }
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
        if (!this.items.strokeWidthItems[itemIndex]) {
            this.items.strokeWidthItems[itemIndex] = {paintValue: width};
        } else {
            this.items.strokeWidthItems[itemIndex].paintValue = width;
        }
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