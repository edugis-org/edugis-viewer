import {LitElement, html, css} from 'lit';

class MapDatatoolRoute extends LitElement {
    static get styles() {
        return css`
        :host {
            display: block;
        }
        input[type="number"] {
            width: 5em;
            border: none;
            border-bottom: 1px solid lightgray;
        }
        label {
            display: inline-block;
            font-weight: bold;
            width: 6em;
            text-align: right;
            margin-right: 3px;
        }
        select {
            border: none;
            border-bottom: 1px solid lightgray;
        }`
    }
    static get properties() { 
        return { 
            start: {type: Array},
            end: {type: Array},
            busyMessage: {type: String},
            vehicleWeight: {type: Number},
            vehicleHeight: {type: Number},
            vehicleLength: {type: Number},
            vehicleWidth: {type: Number},
            vehicleAxleWeight: {type: Number},
            travelMode: {type: String},
            distance: {type: Number},
            emptyReturn: {type: Boolean},
            vehicleLoad: {type: Number}
        }; 
    }
    constructor() {
        super();
        this.start = [0, 0];
        this.end = [0, 0];
        this.travelMode = 'truck';
        // Buko kipper 10x4
        this.vehicleWeight = 49000;
        this.vehicleHeight = 3.7;
        this.vehicleLength = 10.2;
        this.vehicleWidth = 2.5;
        this.vehicleAxleWeight = 11500;
        this.distance = 0;
        this.emptyReturn = false;
        // laadvermogen
        this.vehicleLoad = 30000;
    }
    connectedCallback() {
        super.connectedCallback()
    }
    disconnectedCallback() {
        super.disconnectedCallback()
        this._unregisterFromMap();
    }
    shouldUpdate(changedProp) {
        if (changedProp.has('map')) {
            this._unregisterFromMap();
            this._registerWithMap();
        }
        return true;
    }
    render() {
        return html`
            <b>Route berekenen</b><p></p>
            Route van A naar B<p></p>
            <label>Beginpunt:</label>${this._round(this.start[1],5)}, ${this._round(this.start[0],5)}<br>
            <label>Eindpunt:</label>${this._round(this.end[1],5)}, ${this._round(this.end[0],5)}<br>
            <label>Modus:</label><select @change="${(e)=>this._travelModeChanged(e)}">
                <option value="car">Auto</option>
                <option value="truck" selected>Vrachtwagen</option>
                <option value="bicycle">Fiets</option>
                <option value="pedestrian">Voetganger</option>
            </select><br>
            ${this.travelMode === 'truck' ? html`
                <label>Gewicht:</label><input type="number" value="${this.vehicleWeight}" @change="${e=>this.vehicleWeight = e.target.value}" min="500" max="50000" step="100"> kg<br>
                <label>Hoogte:</label><input type="number" value="${this.vehicleHeight}" @change="${e=>this.vehicleHeight = e.target.value}" min="1" max="10" step="0.1"> m<br>
                <label>Lengte:</label><input type="number" value="${this.vehicleLength}" @change="${e=>this.vehicleLength = e.target.value}" min="4" max="24" step="0.1"> m<br>
                <label>Breedte:</label><input type="number" value="${this.vehicleWidth}" @change="${e=>this.vehicleWidth = e.target.value}" min="1" max="2.6" step="0.05"> m<br>
                <label>Aslast:</label><input type="number" value="${this.vehicleAxleWeight}" @change="${e=>this.vehicleAxleWeight = e.target.value}" min="500" max="12000" step="100"> kg<br>
                <label>Leeg retour:</label><input type="checkbox" value="${this.emptyReturn}" @change="${e=>this.emptyReturn = e.target.checked}"><br>
                ${this.emptyReturn ? html`<label>Laadvermogen:</label><input type="number" value="${this.vehicleLoad}" @change="${e=>this.vehicleLoad = e.target.value}" min="500" max="30000" step="100"> kg<br>` : html``}
                <button @click="${(_e)=>this._recalculateRoute()}">Opnieuw berekenen</button><br>
            ` : html``}
            ${this.distance ? html`<label>Afstand:</label> ${this._distanceText(this.distance)}` : html``}<br>
            <b>${this.busyMessage}</b>
    </div>
    `
    }
    firstUpdated() {
        this._registerWithMap();
    }
    updated() {

    }
    _recalculateRoute() {
        if (!this.mouseMoveMode && this.start[0]!==0 && this.end[0]!==0) {
            this._getTomTomRoute();
        }
    }
    _travelModeChanged(e) {
        this.travelMode = e.target.value;
        this._recalculateRoute();
    }
    _handleMapClick(e) {
        if (!this.mouseMoveMode) {
            this.mouseMoveMode = true;
            this._addRouteLayers();
            //this.routeLayer.source.data.geometry.coordinates = [[e.lngLat.lng, e.lngLat.lat],[e.lngLat.lng, e.lngLat.lat]];
            this.map.getSource('map-datatool-route').setData({type: "FeatureCollection", features: []});
            this.routeStartEndLayer.source.data.features[0] = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [e.lngLat.lng, e.lngLat.lat]
                }
            };
            this.routeStartEndLayer.source.data.features[1] = this.routeStartEndLayer.source.data.features[0];
            //this.map.getSource('map-datatool-route').setData(this.routeLayer.source.data);
            this.map.getSource('map-datatool-route-startend').setData(this.routeStartEndLayer.source.data);
        } else {
            this.mouseMoveMode = false;
        }
    }
    _updateStartEnd(e) {
        this.routeStartEndLayer.source.data.features[1] = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [e.lngLat.lng, e.lngLat.lat]
            }
        };
        this.map.getSource('map-datatool-route-startend').setData(this.routeStartEndLayer.source.data);
    }
    _round(number, precision) {
        const factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    }
    _distanceText(distance) {
        if (distance<1000) {
            return `${this._round(distance,0)} m`;
        } else {
            return `${this._round(distance/1000,1)} km`;
        }
    }
    async _getTomTomRoute() {
        this.busyMessage = 'Route wordt berekend...';
        const start = this.routeStartEndLayer.source.data.features[0].geometry.coordinates;
        const end = this.routeStartEndLayer.source.data.features[1].geometry.coordinates;
        let url = `https://api.tomtom.com/routing/1/calculateRoute/${start[1]},${start[0]}:${end[1]},${end[0]}/json?travelMode=${this.travelMode}&key=${APIkeys.tomtom}`;
        if (this.travelMode==='truck') {
            url += `&vehicleWeight=${this.vehicleWeight}&vehicleAxleWeight=${this.vehicleAxleWeight}&vehicleLength=${this.vehicleLength}&vehicleWidth=${this.vehicleWidth}&vehicleHeight=${this.vehicleHeight}`;
        }
        const response = await fetch(url);
        if (response.ok) {
            const json = await response.json();
            const feature = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: json.routes[0].legs[0].points.map((point)=>{return [point.longitude, point.latitude]})
                },
                properties: json.routes[0].summary
            }
            if (this.travelMode==='truck') {
                // add the truck properties to the feature
                feature.properties = {...feature.properties, 
                    vehicleWeight: this.vehicleWeight,
                    vehicleAxleWeight: this.vehicleAxleWeight,
                    vehicleLength: this.vehicleLength,
                    vehicleWidth: this.vehicleWidth,
                    vehicleHeight: this.vehicleHeight
                };
            }
            this.distance = json.routes[0].summary.lengthInMeters;
            this.map.getSource('map-datatool-route').setData({"type":"FeatureCollection","features":[feature]});

            this.start = start;
            this.end = end;
            this.busyMessage = '';
        } else {
            this.start = [0,0];
            this.end = [0,0];
            this.distance = 0;
            this.busyMessage = 'Route kon niet worden berekend';
            setTimeout(()=>{this.busyMessage = ''}, 5000);
        }
    }
    async _updateRoute(e) {
        this.timeout = null;
        if (!this.waitingForRoute) {
            this.waitingForRoute = true;
            await this._getTomTomRoute();  
            this.waitingForRoute = false;
        }
    }
    _handleMapMouseMove(e) {
        if (this.mouseMoveMode) {
            this._updateStartEnd(e);
            if (this.timeout) { 
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(()=>{this._updateRoute(e)}, 500);
        }
    }
    _addRouteLayers() {
       const layers = this.map.getStyle().layers;
       const routeLayer = layers.find((layer)=>{return layer.id==='map-datatool-route'});
       const routeStartEndLayer = layers.find((layer)=>{return layer.id==='map-datatool-route-startend'});
       if (!routeLayer) {
            // add empty routeLayer
            this.routeLayer = {
                id: 'map-datatool-route',
                type: 'line',
                metadata: {
                    title: 'Route'
                },
                source: {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    },
                    attribution: 'TomTom'
                },
                paint: {
                    'line-color': '#888',
                    'line-width': 8
                },
                layout: {
                    'line-join': 'round',
                }
            }
            this.dispatchEvent(new CustomEvent('addlayer', {
                detail: this.routeLayer,
                bubbles: true,
                composed: true
            }))
        }
        if (!routeStartEndLayer) {
            this.routeStartEndLayer = {
                id: 'map-datatool-route-startend',
                metadata: {
                    title: 'Route begin/eind',
                    userlayer: true // show in legend
                },
                type: 'circle',
                source: {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            properties: {},
                            geometry: {
                                type: 'Point',
                                coordinates: []
                            }
                        }],
                    }
                },
                paint: {
                    'circle-radius': 8,
                    'circle-color': '#fff',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#000'
                }
            }
            this.dispatchEvent(new CustomEvent('addlayer', {
                detail: this.routeStartEndLayer,
                bubbles: true,
                composed: true
            }))
        }
    }
    _registerWithMap() {
        if (!this.registered && this.map) {
            this.boundMapClickHandler = this._handleMapClick.bind(this);
            this.boundMapMouseMoveHandler = this._handleMapMouseMove.bind(this);
            this.registeredMap = this.map;
            this.registeredMap.on('click', this.boundMapClickHandler);
            this.registeredMap.on('mousemove', this.boundMapMouseMoveHandler);
            this._addRouteLayers();
            this.registered = true;
        }
    }
    _unregisterFromMap() {
        if (this.registered && this.registeredMap) {
            this.registeredMap.off('click', this.boundMapClickHandler);
            this.registeredMap.off('mousemove', this.boundMapMouseMoveHandler);
            this.registered = false;
        }
    }
}

customElements.define('map-datatool-route', MapDatatoolRoute);