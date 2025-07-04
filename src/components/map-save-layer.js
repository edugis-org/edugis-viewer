import {LitElement, html, css} from 'lit';
import {GeoJSON} from '../utils/geojson';
// import JSZip from 'jszip'; not an ES6 module, imported as script in index.html

class MapSaveLayer extends LitElement {
    static get styles() {
        return css`
        :host {
            display: block;
        }`
    }
    static get properties() { 
        return { 
          webmap: {type: Object},
        }; 
    }
    constructor() {
        super();
        this.webmap = undefined;
        this.container = undefined;
    }
    connectedCallback() {
        super.connectedCallback()
    }
    disconnectedCallback() {
        super.disconnectedCallback()
    }
    shouldUpdate(changedProp) {
        if (changedProp.has('sprop')) {
            // do something with sprop change
        }
        return true;
    }
    render() {
        return html``;
    }
    firstUpdated() {
        if (this.container) {
            this.container.addEventListener('savelayer', (event)=>this._savelayer(event));
            this.container.addEventListener('savelayers', (event)=>this._savelayers(event));
        } else {
            console.error('no container property for <map-save-layer>')
        }
    }
    updated() {

    }
    _styleCleanup(style) {
        if (style.metadata) {
            const metadata = style.metadata;
            delete metadata.userlayer;
            delete metadata.cansave;
            delete metadata.activeEdits;
            if (!metadata.title && metadata.styletitle) {
                metadata.title = metadata.styletitle;
            }
            if (metadata.inEditMode) {
                delete metadata.visible;
                delete metadata.inEditMode;
            }
            delete metadata.boundspos;
            delete metadata.styleid;
            delete metadata.styletitle;
        }
        if (style.layout && style.layout.visibility && style.layout.visibility === 'none') {
            delete style.layout.visibility;
        }
    }
    _getFullSource(mapboxglStyle) {
        let result = mapboxglStyle.source;
        if (typeof result === 'string') {
            const mapsource = this.webmap.getSource(result);
            if (mapsource) {
                result = mapsource.serialize();
            }
        }
        if (mapboxglStyle.type === 'style') {
            const sourceSet = new Set();
            for (const sublayer of mapboxglStyle.metadata.sublayers) {
                sourceSet.add(sublayer.source);
            }
            const sources = {}
            for (let source of sourceSet) {
                if (typeof source === 'string') {
                    const mapsource = this.webmap.getSource(source);
                    if (mapsource) {
                        sources[source] = mapsource.serialize();
                    }
                }
            }
            result = {
                sources: sources,
                layers: mapboxglStyle.metadata.sublayers
            };
        }
        return result;
    }
    _getLayerJson(layerInfo, exportVector) {
        const layer = layerInfo.layer ? layerInfo.layer : this.webmap.getLayer(layerInfo.id);
        if (layer) {
            const mapboxglStyle = layer.serialize?JSON.parse(JSON.stringify(layer.serialize())):JSON.parse(JSON.stringify(layer));
            this._styleCleanup(mapboxglStyle, layer);
            const source = this._getFullSource(mapboxglStyle);
            if (source) {
                if (source.type === 'geojson' && source.data && source.data.type === 'FeatureCollection') {
                    const geojson = source.data;
                    delete source.data;
                    mapboxglStyle.source = source;
                    geojson.style = mapboxglStyle;
                    return geojson;
                }
                if (exportVector && source.type === 'vector') {
                    if (mapboxglStyle["source-layer"]) {
                        delete mapboxglStyle["source-layer"];
                    }
                    mapboxglStyle.source = source;
                    mapboxglStyle.id += GeoJSON._uuidv4();
                    mapboxglStyle.metadata.title = 'Uitsnede ' + mapboxglStyle.metadata.title;
                    const geojson = {
                        "type":"FeatureCollection",
                        "style": mapboxglStyle, 
                        "features": this.webmap.queryRenderedFeatures(undefined, {layers: [layerid]})
                            .map(feature=>{
                                delete feature.layer;
                                delete feature.source;
                                delete feature.sourceLayer;
                                delete feature.state;
                                return feature;
                            })
                    }
                    return geojson;
                }
                mapboxglStyle.source = source;
            }
            return {
                style: mapboxglStyle
            }
        }
        return {};
    }
    _savelayer(e) {
        this.dispatchEvent(new CustomEvent('beforesave', {}));
        setTimeout(()=>{
            const geojson = this._getLayerJson(e.detail.layer, true);
            const blob = new Blob([JSON.stringify(geojson, null, 2)], {type: "application/json"});
            const filename = geojson.style.metadata.title ? `${geojson.style.metadata.title.replace(' ', '_')}.geo.json` : 'layer.geo.json'
            window.saveAs(blob, filename);
        }, 500);
    }
    _savelayers(e) {
        this.dispatchEvent(new CustomEvent('beforesave', {}));
        setTimeout(()=>{
            const layerset = [];
            const zip = new JSZip();
            let filenum = 1;
            for (const layer of e.detail.layers) {
                const geojson = this._getLayerJson(layer, false);
                const filename = geojson.style.metadata.title ? `${geojson.style.metadata.title.replace(' ', '_')}.geo.json` : `layer${filenum++}.geo.json`
                zip.file(filename, JSON.stringify(geojson));
                layerset.push(geojson);
            }
            //const blob = new Blob([JSON.stringify(layerset,null,2)], {type: "application/json"});
            //const filename = 'edugislayers.json';
            //window.saveAs(blob, filename);
            zip.generateAsync({type:"blob", compression:"DEFLATE"}).then((content)=>{
                window.saveAs(content, 'edugislayers.zip');
            })
        }, 500);
    }
}

customElements.define('map-save-layer', MapSaveLayer);