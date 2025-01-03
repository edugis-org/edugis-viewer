import {html, css, LitElement} from 'lit';

/**
* @polymer
* @extends HTMLElement
*/
class BaseArrow extends LitElement {
    static get properties() {
        return {
            open: {type: Boolean}
        }
    }
    static get styles() {
        return css`
            :host {
                display: inline-block;
            }
            div {
                width: 8px;
                height: 8px;
                margin: 3px;
                border-top: 1px solid #424242;
                border-right: 1px solid #424242;
                transform: rotate(45deg);
                transition: transform .8s ease-in-out;
                cursor: pointer;
                outline: none;
            }
            div:focus {
                border-top: 2px solid #424242;
                border-right: 2px solid #424242;
            }
            .open {
                transform: rotate(135deg);
            }
        `
    }
    constructor() {
        super();
        this.open = false;
    }
    render() {
        return html`
        <div @click="${(e)=>this._click(e)}" class="${this.open?'open':''}" tabindex="0" @keydown="${(e)=>this._click(e)}"></div>
        `
    }
    _click(event) {
        if (event instanceof KeyboardEvent) {
            if (event.key === 'ArrowUp') {
                /* up arrow key */
                this.open = false;
                event.stopPropagation();
                return;
            }
            if (event.key === 'ArrowDown') {
                /* down arrow key */
                this.open = true;
                event.stopPropagation();
                return;
            }
            if (event.code !== 'Space' && event.key !== 'Enter') {
                return;
            }
        }
        this.open = !this.open;
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('change', {
            detail: {open: this.open}
        }));
    }
}

window.customElements.define('base-arrow', BaseArrow);