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
                border-top: 1px solid var(--theme-text-color-primary, #424242);
                border-right: 1px solid var(--theme-text-color-primary, #424242);
                transform: rotate(45deg);
                transition: transform .2s ease-in-out;
                cursor: pointer;
                outline: none;
            }
            div:focus {
                border-top: 2px solid var(--theme-text-color-primary, #424242);
                border-right: 2px solid var(--theme-text-color-primary, #424242);
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
            if (event.keyCode === 38) {
                /* up arrow key */
                this.open = false;
                event.stopPropagation();
                return;
            }
            if (event.keyCode === 40) {
                /* down arrow key */
                this.open = true;
                event.stopPropagation();
                return;
            }
            if (event.keyCode !== 32 && event.keyCode !== 13) {
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