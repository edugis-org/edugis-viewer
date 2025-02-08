import "./map-iconbutton.js";
import { imageSearchIcon, searchIcon, polygonIcon as areaIcon, lineIcon, pointIcon, closeIcon } from "./my-icons.js";
import './base/base-checkbox.js'
import {translate as t, registerLanguageChangedListener, unregisterLanguageChangedListener, i18next} from '../i18n.js';

import { LitElement, html, css} from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
  class MapSearch extends LitElement {
    static styles = css`
      .searchtool {
        display: flex;
        flex-direction: column;
        font-size: 12px;
        height: 100%;
        min-height: 0; /* fix for Firefox */
      }
      .title {
        font-weight: bold;
        font-size: 16px;
        width: 100%;
        height: 30px;
        padding: 5px;
        border-bottom: 1px solid lightblue;
        margin-bottom: 12px;
        box-sizing: border-box;
        flex-shrink: 0;
      }
      .searchbox {
        display: flex;
        align-items: stretch;
        border: 2px solid var(--theme-background-color, #f9e11e);
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 12px;
        flex-shrink: 0;
      }

      .searchbox input {
        flex: 1;
        padding-left: 10px;
        padding-right: 0;
        padding-top: 10px;
        padding-bottom: 10px;
        border: none;
      }

      .searchbox input:focus {
        outline: none;
        box-shadow: none;
        border: none;
      }

      .searchbutton {
        display: flex;
        align-items: center;
        position: static;
        padding-left: 2px;
        background-color: var(--theme-background-color, #f9e11e);
        fill: white;
        cursor: pointer;
      }
      .searchbutton:hover {
        fill: lightgray;
      }
      .erasebutton {
        display: flex;
        align-items: center;
        padding: 2px;
        background: transparent;
        border-right: 1px solid #ddd;
        transition: opacity 0.2s;
        fill: #555;
        cursor: pointer;
      }
      .erasebutton:hover {
          fill: #000;
      }
      .resultlistcontainer {
        flex-shrink: 1;
        min-height: 0; /* fix for Firefox */
        margin-bottom: 12px;
        border-bottom: 1px solid lightgray;
        border-top: 1px solid lightgray;
        overflow: auto;
      }
      
      .resultlist ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .result-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-bottom: 1px solid #eee;
        gap: 8px;
      }

      .persist-control {
        flex-shrink: 0;
        width: 24px;
        display: flex;
        justify-content: center;
      }

      .feature-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-grow: 1;
        cursor: pointer;
        padding: 4px;
      }

      .feature-content:hover {
        background-color: #f5f5f5;
      }

      .feature-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .feature-name {
        flex-grow: 1;
        word-break: break-word;
        font-size: small;
      }
      .hidden {
        display: none;
      }
    `;
    static get properties() {
    return {
      info: {type: String},
      resultList: {type: Array},
      viewbox: {type: Array},
      active: {type: Boolean},
      searching: {type: Boolean},
    };
  }

  constructor() {
    super(); 
    // properties
    this.info = `${t('Countries, Places, Rivers, ...')}`;
    this.resultList = null;
    this.viewbox = [];
    this.active = true;
    this.lastSearchText = '';
    this.searching = false;
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
    this.info = `${t('Countries, Places, Rivers, ...')}`;
  }
  dispatchResult() {
    if (this.prevResultList == null && this.resultList == null) {
      return; // pass null resultList only once
    }
    this.prevResultList = this.resultList;
    this.dispatchEvent(new CustomEvent('searchresult', {
      detail: this.resultList,
      bubbles: true,
      composed: true
    }));
  }

  async search(e) {
    let searchText = this.shadowRoot.querySelector('input').value.trim();
    this.lastSearchText = searchText;

    if (searchText.length > 1) {
      searchText = this.normalizeWhenCoordinateString(searchText);
      let url;
      const language = i18next.resolvedLanguage || 'en';
      if (this.viewbox.length) {
        url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=geojson&viewbox=${this.viewbox.join(',')}&bounded=0&polygon_geojson=1&addressdetails=1&limit=15&accept-language=${language}&email=info@edugis.nl`;
      } else {
        url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=geojson&polygon_geojson=1&addressdetails=1&limit=15&accept-language=${language}&email=info@edugis.nl`;
      }
      this.searching = true;
      try {
        let response = await fetch(url);
        if (response.ok) {
          const geojson = await response.json();
          if (geojson.features?.length) {
            for (const feature of geojson.features) {
              const icon = this.getIconUrl(feature);
              if (icon) {
                feature.properties.icon = icon;
              }
            }
          }
          this.resultList = geojson;
        } else {
          console.error('Error searching:', response.statusText);
          this.resultList = {features: []};
        }
      } catch (error) {
        this.searching = false;
        console.error('Error searching:', error);
        this.resultList = {features: []};
      };
      this.searching = false;
      this.dispatchResult();
    }
  }

  keyup(e) {
    if (e.key == 'Enter') {
      this.search(e);
    } else {
      this.resultList = null;
      this.lastSearchText = '';
      this.dispatchResult();
    }
  }

  zoomTo(bbox) {
    this.dispatchEvent(new CustomEvent('searchclick', {
      detail: {
        bbox: bbox
      },
      bubbles: true,
      composed: true
    }));
  }

  
  searchErase(_e) {
    if (this.resultList !== null) {
      const searchInput = this.shadowRoot.querySelector('input');
      searchInput.value = "";
      searchInput.focus();
      
      this.resultList = null;
      this.lastSearchText = '';
      this.dispatchResult();
    }
  }

  getIconUrl(feature) {
    if (feature.geometry.type === 'Point' || feature.geometry.type === 'MultiPoint') {
      const category = feature.properties.category;
      const type = feature.properties.type;
      if (category && type && this.lookupTable[category] && this.lookupTable[category][type]) {
        return `https://raw.githubusercontent.com/gravitystorm/openstreetmap-carto/refs/heads/master/symbols/${this.lookupTable[category][type]}`;
      } else if (category && this.lookupTable[category] && typeof this.lookupTable[category] === 'string') {
        return `https://raw.githubusercontent.com/gravitystorm/openstreetmap-carto/refs/heads/master/symbols/${this.lookupTable[category]}`;
      }
    }
    return null;
  }

  getIcon(feature) {
    switch (feature.geometry.type) {
      case 'Polygon':
      case 'MultiPolygon':
        return areaIcon;
  
      case 'Point':
      case 'MultiPoint': {
          const url = feature.properties.icon;
          if (url) {
            return html`<img src="${url}" title=""/>`;
          }
          return pointIcon;
        }
      case "LineString":
      case "MultiLineString":
        return lineIcon;
  
      default:
        return "";
    }
  }
  
  persistSearchFeature(persist, feature) {
    this.dispatchEvent(new CustomEvent('persistSearchFeature', {
      detail: {
        persist: persist,
        feature: JSON.parse(JSON.stringify(feature))
      }
    }));
  }

  renderResultListItems() {
    return this.resultList.features.map(feature => html`
      <li class="result-item">
        <div class="persist-control">
          <base-checkbox 
            small 
            ?checked="${feature.persistOnMap}" 
            @change="${(e)=>this.persistSearchFeature(e.target.checked, feature)}"
          ></base-checkbox>
        </div>
        <div class="feature-content" @click="${(e) => this.zoomTo(feature.bbox)}" title="${feature.properties.category}/${feature.properties.type}">
          <div class="feature-icon" title="${feature.properties.category}/${feature.properties.type}">
            ${this.getIcon(feature)}
          </div>
          <div class="feature-name">
            ${feature.properties.display_name}
          </div>
        </div>
      </li>
    `);
  }

  renderResultList() {
    if (!this.lastSearchText) {
      return html``;
    }
    if (!this.resultList?.features?.length) {      
      return html`
        <div class="resultheader">${t('Search result for')} '${this.lastSearchText}':</div>
        <div class="resultlist">
          <ul>
            <li><b>${t('nothing found')}</b></li>
          </ul>
        </div>`;
    }
    return html`
    <div class="resultheader">${t('Search result for')} '${this.lastSearchText}':</div>
    <div class="resultlistcontainer">
      <div class="resultlist">
        <ul>
          ${this.renderResultListItems()}
        </ul>
      </div>
    </div>
    <div class="resultfooter">- ${t('Click on a result to zoom')}<br>- ${t('Select to add to the map')}</div>`;
  }

  renderExplanation() {
    if (!this.lastSearchText && !this.resultList?.features?.length) {
      return html`
        <div>
          <ul>
            <li>${t("Enter at least 1 complete word above.")}</li>
            <li>${t("The search function prioritizes locations that are within the map view.")}</li>
          </ul>
        </div>`
    } else {
      return html``;
    }
  }

  renderSearchInfo() {
    if (this.searching) {
      return html`<div class="searching">${t("searching...")}</div>`;
    }
    if (!this.lastSearchText && !this.resultList?.features?.length) {
      return this.renderExplanation();
    }
    return this.renderResultList();
  }

  render() {
    if (!this.active) {
      this.searchErase();
      return html``;
    }
    return html`
      <div class="searchtool">
        <div class="title">${t('Search places and addresses')}</div>
        <div class="searchbox${this.active ? '' : ' hidden'}">
          <input type="text" placeholder="${this.info}" @keyup="${e => this.keyup(e)}">
          ${this.lastSearchText ? html`<span title="${ifDefined(t('erase')??undefined)}" class="erasebutton" @click="${e => this.searchErase(e)}">${closeIcon}</span>` : ''}
          <span title="${ifDefined(t('search')??undefined)}" class="searchbutton" @click="${e => this.search(e)}">${searchIcon}</span>
        </div>
        ${this.renderSearchInfo()}  
      </div>
    `;
  }
  normalizeWhenCoordinateString(coordinateString){
    // coordinate can be either lat,lon or lon,lat
    // nominatium expects lat,long not long,lat or added N, E, S, W
    const isValidFloatPair = (input) => {
      const regex = /^\s*-?\d*(\.\d+)?\s*,\s*-?\d*(\.\d+)?\s*$/;
      return regex.test(input);
    }
    if (isValidFloatPair(coordinateString)) {
      const coordinates = coordinateString.split(',');
      const normalizeLongitude = (longitude) => {
        const digits = longitude.toString().split('.')[1].length;
          longitude = longitude % 360;
          if (longitude > 180) {
            longitude -= 360;
          }
          return parseFloat(longitude.toFixed(digits));
      }
      const floatParts = coordinates.map(parseFloat);
      // assume lat, lon, but swap if lat > 90 or lat < -90
      if (floatParts[0] > 90 || floatParts[0] < -90) {
        floatParts.reverse();
      }
      floatParts[0] = normalizeLongitude(floatParts[0]);
      return `${Math.abs(floatParts[0])} ${floatParts[0] >= 0 ? 'N' : 'S'},${Math.abs(floatParts[1])} ${floatParts[1] >= 0 ? 'E' : 'W'}`;
      
    }
    return coordinateString;
  }
  lookupTable = {
    "amenity": {
      "advertising_column": "amenity/advertising_column.svg",
      "aerodrome": "amenity/aerodrome.svg",
      "arts_centre": "amenity/arts_centre.svg",
      "atm": "amenity/atm.svg",
      "bank": "amenity/bank.svg",
      "bar": "amenity/bar.svg",
      "bbq": "amenity/bbq.svg",
      "bench": "amenity/bench.svg",
      "bicycle_parking": "amenity/bicycle_parking.svg",
      "bicycle_repair_station": "amenity/bicycle_repair_station.svg",
      "biergarten": "amenity/biergarten.svg",
      "boat_rental": "amenity/boat_rental.svg",
      "bureau_de_change": "amenity/bureau_de_change.svg",
      "bus_station": "amenity/bus_station.svg",
      "cafe": "amenity/cafe.svg",
      "car_wash": "amenity/car_wash.svg",
      "casino": "amenity/casino.svg",
      "charging_station": "amenity/charging_station.svg",
      "cinema": "amenity/cinema.svg",
      "community_centre": "amenity/community_centre.svg",
      "courthouse": "amenity/courthouse.svg",
      "dentist": "amenity/dentist.svg",
      "doctors": "amenity/doctors.svg",
      "drinking_water": "amenity/drinking_water.svg",
      "emergency_phone": "amenity/emergency_phone.svg",
      "entrance": "amenity/entrance.svg",
      "excrement_bags": "amenity/excrement_bags.svg",
      "fast_food": "amenity/fast_food.svg",
      "ferry": "amenity/ferry.svg",
      "firestation": "amenity/firestation.svg",
      "fountain": "amenity/fountain.svg",
      "fuel": "amenity/fuel.svg",
      "helipad": "amenity/helipad.svg",
      "hospital": "amenity/hospital.svg",
      "hunting_stand": "amenity/hunting_stand.svg",
      "ice_cream": "amenity/ice_cream.svg",
      "internet_cafe": "amenity/internet_cafe.svg",
      "library": "amenity/library.svg",
      "motorcycle_parking": "amenity/motorcycle_parking.svg",
      "nightclub": "amenity/nightclub.svg",
      "parcel_locker": "amenity/parcel_locker.svg",
      "parking": "amenity/parking.svg",
      "parking_entrance_multistorey": "amenity/parking_entrance_multistorey.svg",
      "parking_entrance_underground": "amenity/parking_entrance_underground.svg",
      "parking_subtle": "amenity/parking_subtle.svg",
      "parking_tickets": "amenity/parking_tickets.svg",
      "pharmacy": "amenity/pharmacy.svg",
      "place_of_worship": "amenity/place_of_worship.svg",
      "police": "amenity/police.svg",
      "post_box": "amenity/post_box.svg",
      "post_office": "amenity/post_office.svg",
      "prison": "amenity/prison.svg",
      "pub": "amenity/pub.svg",
      "public_bath": "amenity/public_bath.svg",
      "public_bookcase": "amenity/public_bookcase.svg",
      "public_transport_tickets": "amenity/public_transport_tickets.svg",
      "recycling": "amenity/recycling.svg",
      "rental_bicycle": "amenity/rental_bicycle.svg",
      "rental_car": "amenity/rental_car.svg",
      "restaurant": "amenity/restaurant.svg",
      "shelter": "amenity/shelter.svg",
      "shower": "amenity/shower.svg",
      "social_facility": "amenity/social_facility.svg",
      "taxi": "amenity/taxi.svg",
      "telephone": "amenity/telephone.svg",
      "theatre": "amenity/theatre.svg",
      "toilets": "amenity/toilets.svg",
      "town_hall": "amenity/town_hall.svg",
      "vehicle_inspection": "amenity/vehicle_inspection.svg",
      "veterinary": "amenity/veterinary.svg",
      "waste_basket": "amenity/waste_basket.svg",
      "waste_disposal": "amenity/waste_disposal.svg"
    },
    "arete-mid": "arete-mid.svg",
    "arete2": "arete2.svg",
    "barrier": {
      "cattle_grid": "barrier/cattle_grid.svg",
      "cycle_barrier": "barrier/cycle_barrier.svg",
      "full-height_turnstile": "barrier/full-height_turnstile.svg",
      "gate": "barrier/gate.svg",
      "kissing_gate": "barrier/kissing_gate.svg",
      "level_crossing": "barrier/level_crossing.svg",
      "level_crossing2": "barrier/level_crossing2.svg",
      "lift_gate": "barrier/lift_gate.svg",
      "motorcycle_barrier": "barrier/motorcycle_barrier.svg",
      "stile": "barrier/stile.svg",
      "toll_booth": "barrier/toll_booth.svg"
    },
    "beach": "beach.png",
    "beach_coarse": "beach_coarse.png",
    "cliff": "cliff.svg",
    "cliff2": "cliff2.svg",
    "corners": "corners.svg",
    "embankment": "embankment.svg",
    "flowerbed_high_zoom": "flowerbed_high_zoom.svg",
    "flowerbed_mid_zoom": "flowerbed_mid_zoom.svg",
    "generating_patterns": {
      "beach": "generating_patterns/beach.svg",
      "bog": "generating_patterns/bog.svg",
      "broadleaved": "generating_patterns/broadleaved.svg",
      "leafless1": "generating_patterns/leafless1.svg",
      "leafless2": "generating_patterns/leafless2.svg",
      "mangrove": "generating_patterns/mangrove.svg",
      "marsh": "generating_patterns/marsh.svg",
      "needleleaved": "generating_patterns/needleleaved.svg",
      "reed": "generating_patterns/reed.svg",
      "reef": "generating_patterns/reef.svg",
      "rock": "generating_patterns/rock.svg",
      "rock_overlay@2x": "generating_patterns/rock_overlay@2x.png",
      "salt-dots-2": "generating_patterns/salt-dots-2.svg",
      "scree": "generating_patterns/scree.svg",
      "scree_overlay@2x": "generating_patterns/scree_overlay@2x.png",
      "scrub": "generating_patterns/scrub.svg",
      "swamp": "generating_patterns/swamp.svg",
      "wetland": "generating_patterns/wetland.svg",
      "wetland_bog@2x": "generating_patterns/wetland_bog@2x.png",
      "wetland_generic@2x": "generating_patterns/wetland_generic@2x.png",
      "wetland_mangrove@2x": "generating_patterns/wetland_mangrove@2x.png",
      "wetland_marsh@2x": "generating_patterns/wetland_marsh@2x.png",
      "wetland_reed@2x": "generating_patterns/wetland_reed@2x.png",
      "wetland_swamp@2x": "generating_patterns/wetland_swamp@2x.png"
    },
    "golf_rough": "golf_rough.svg",
    "highway": {
      "bus_stop": "highway/bus_stop.svg",
      "elevator": "highway/elevator.svg",
      "ford": "highway/ford.svg",
      "traffic_light": "highway/traffic_light.svg"
    },
    "historic": {
      "archaeological_site": "historic/archaeological_site.svg",
      "bust": "historic/bust.svg",
      "castle": "historic/castle.svg",
      "city_gate": "historic/city_gate.svg",
      "fort": "historic/fort.svg",
      "fortress": "historic/fortress.svg",
      "manor": "historic/manor.svg",
      "memorial": "historic/memorial.svg",
      "monument": "historic/monument.svg",
      "obelisk": "historic/obelisk.svg",
      "palace": "historic/palace.svg",
      "plaque": "historic/plaque.svg",
      "shrine": "historic/shrine.svg",
      "statue": "historic/statue.svg",
      "stone": "historic/stone.svg"
    },
    "leaftype_broadleaved": "leaftype_broadleaved.svg",
    "leaftype_leafless": "leaftype_leafless.svg",
    "leaftype_mixed": "leaftype_mixed.svg",
    "leaftype_needleleaved": "leaftype_needleleaved.svg",
    "leaftype_unknown": "leaftype_unknown.svg",
    "leisure": {
      "amusement_arcade": "leisure/amusement_arcade.svg",
      "beach_resort": "leisure/beach_resort.svg",
      "bird_hide": "leisure/bird_hide.svg",
      "bowling_alley": "leisure/bowling_alley.svg",
      "dance": "leisure/dance.svg",
      "firepit": "leisure/firepit.svg",
      "fishing": "leisure/fishing.svg",
      "fitness": "leisure/fitness.svg",
      "golf": "leisure/golf.svg",
      "golf_pin": "leisure/golf_pin.svg",
      "miniature_golf": "leisure/miniature_golf.svg",
      "outdoor_seating": "leisure/outdoor_seating.svg",
      "playground": "leisure/playground.svg",
      "sauna": "leisure/sauna.svg",
      "slipway": "leisure/slipway.svg",
      "water_park": "leisure/water_park.svg"
    },
    "man_made": {
      "bell_tower": "man_made/bell_tower.svg",
      "bunker": "man_made/bunker.svg",
      "chimney": "man_made/chimney.svg",
      "communications_tower": "man_made/communications_tower.svg",
      "crane": "man_made/crane.svg",
      "cross": "man_made/cross.svg",
      "generator_wind": "man_made/generator_wind.svg",
      "lighthouse": "man_made/lighthouse.svg",
      "mast": "man_made/mast.svg",
      "mast_communications": "man_made/mast_communications.svg",
      "mast_lighting": "man_made/mast_lighting.svg",
      "power_tower": "man_made/power_tower.svg",
      "power_tower_small": "man_made/power_tower_small.svg",
      "storage_tank": "man_made/storage_tank.svg",
      "telescope_dish": "man_made/telescope_dish.svg",
      "telescope_dome": "man_made/telescope_dome.svg",
      "tower_cantilever_communication": "man_made/tower_cantilever_communication.svg",
      "tower_cooling": "man_made/tower_cooling.svg",
      "tower_defensive": "man_made/tower_defensive.svg",
      "tower_dish": "man_made/tower_dish.svg",
      "tower_dome": "man_made/tower_dome.svg",
      "tower_generic": "man_made/tower_generic.svg",
      "tower_lattice": "man_made/tower_lattice.svg",
      "tower_lattice_communication": "man_made/tower_lattice_communication.svg",
      "tower_lattice_lighting": "man_made/tower_lattice_lighting.svg",
      "tower_lighting": "man_made/tower_lighting.svg",
      "tower_observation": "man_made/tower_observation.svg",
      "water_tower": "man_made/water_tower.svg",
      "windmill": "man_made/windmill.svg"
    },
    "natural": {
      "cave": "natural/cave.svg",
      "peak": "natural/peak.svg",
      "saddle": "natural/saddle.svg",
      "spring": "natural/spring.svg",
      "waterfall": "natural/waterfall.svg"
    },
    "office": {
      "consulate": "office/consulate.svg",
      "embassy": "office/embassy.svg"
    },
    "oneway-reverse": "oneway-reverse.svg",
    "oneway": "oneway.svg",
    "place": {
      "place-4-z7": "place/place-4-z7.svg",
      "place-4": "place/place-4.svg",
      "place-6-z7": "place/place-6-z7.svg",
      "place-6": "place/place-6.svg",
      "place-capital-6": "place/place-capital-6.svg",
      "place-capital-8": "place/place-capital-8.svg"
    },
    "quarry": "quarry.svg",
    "rect": "rect.svg",
    "rectdiag": "rectdiag.svg",
    "reef": "reef.png",
    "religion": {
      "buddhist": "religion/buddhist.svg",
      "christian": "religion/christian.svg",
      "hinduist": "religion/hinduist.svg",
      "jewish": "religion/jewish.svg",
      "muslim": "religion/muslim.svg",
      "shintoist": "religion/shintoist.svg",
      "sikhist": "religion/sikhist.svg",
      "taoist": "religion/taoist.svg"
    },
    "ridge-mid": "ridge-mid.svg",
    "ridge2": "ridge2.svg",
    "rock_overlay": "rock_overlay.png",
    "salt-dots-2": "salt-dots-2.png",
    "salt_pond": "salt_pond.svg",
    "scree_overlay": "scree_overlay.png",
    "scrub": "scrub.png",
    "shop": {
      "alcohol": "shop/alcohol.svg",
      "art": "shop/art.svg",
      "bag": "shop/bag.svg",
      "bakery": "shop/bakery.svg",
      "beauty": "shop/beauty.svg",
      "bed": "shop/bed.svg",
      "beverages": "shop/beverages.svg",
      "bicycle": "shop/bicycle.svg",
      "bookmaker": "shop/bookmaker.svg",
      "butcher": "shop/butcher.svg",
      "car": "shop/car.svg",
      "carpet": "shop/carpet.svg",
      "car_parts": "shop/car_parts.svg",
      "car_repair": "shop/car_repair.svg",
      "charity": "shop/charity.svg",
      "chemist": "shop/chemist.svg",
      "clothes": "shop/clothes.svg",
      "coffee": "shop/coffee.svg",
      "computer": "shop/computer.svg",
      "confectionery": "shop/confectionery.svg",
      "convenience": "shop/convenience.svg",
      "copyshop": "shop/copyshop.svg",
      "dairy": "shop/dairy.svg",
      "deli": "shop/deli.svg",
      "department_store": "shop/department_store.svg",
      "diy": "shop/diy.svg",
      "electronics": "shop/electronics.svg",
      "fabric": "shop/fabric.svg",
      "florist": "shop/florist.svg",
      "furniture": "shop/furniture.svg",
      "garden_centre": "shop/garden_centre.svg",
      "gift": "shop/gift.svg",
      "greengrocer": "shop/greengrocer.svg",
      "hairdresser": "shop/hairdresser.svg",
      "hearing_aids": "shop/hearing_aids.svg",
      "hifi": "shop/hifi.svg",
      "houseware": "shop/houseware.svg",
      "interior_decoration": "shop/interior_decoration.svg",
      "jewelry": "shop/jewelry.svg",
      "laundry": "shop/laundry.svg",
      "marketplace": "shop/marketplace.svg",
      "massage": "shop/massage.svg",
      "medical_supply": "shop/medical_supply.svg",
      "mobile_phone": "shop/mobile_phone.svg",
      "motorcycle": "shop/motorcycle.svg",
      "music": "shop/music.svg",
      "musical_instrument": "shop/musical_instrument.svg",
      "newsagent": "shop/newsagent.svg",
      "optician": "shop/optician.svg",
      "outdoor": "shop/outdoor.svg",
      "paint": "shop/paint.svg",
      "perfumery": "shop/perfumery.svg",
      "pet": "shop/pet.svg",
      "photo": "shop/photo.svg",
      "seafood": "shop/seafood.svg",
      "second_hand": "shop/second_hand.svg",
      "shoes": "shop/shoes.svg",
      "sports": "shop/sports.svg",
      "stationery": "shop/stationery.svg",
      "supermarket": "shop/supermarket.svg",
      "tea": "shop/tea.svg",
      "ticket": "shop/ticket.svg",
      "tobacco": "shop/tobacco.svg",
      "toys": "shop/toys.svg",
      "trade": "shop/trade.svg",
      "travel_agency": "shop/travel_agency.svg",
      "tyres": "shop/tyres.svg",
      "variety_store": "shop/variety_store.svg",
      "video": "shop/video.svg",
      "video_games": "shop/video_games.svg"
    },
    "square": "square.svg",
    "tourism": {
      "alpinehut": "tourism/alpinehut.svg",
      "apartment": "tourism/apartment.svg",
      "artwork": "tourism/artwork.svg",
      "audioguide": "tourism/audioguide.svg",
      "board": "tourism/board.svg",
      "camping": "tourism/camping.svg",
      "caravan_park": "tourism/caravan_park.svg",
      "chalet": "tourism/chalet.svg",
      "guest_house": "tourism/guest_house.svg",
      "guidepost": "tourism/guidepost.svg",
      "hostel": "tourism/hostel.svg",
      "hotel": "tourism/hotel.svg",
      "map": "tourism/map.svg",
      "motel": "tourism/motel.svg",
      "museum": "tourism/museum.svg",
      "office": "tourism/office.svg",
      "picnic": "tourism/picnic.svg",
      "terminal": "tourism/terminal.svg",
      "viewpoint": "tourism/viewpoint.svg",
      "wilderness_hut": "tourism/wilderness_hut.svg"
    },
    "wetland": "wetland.png",
    "wetland_bog": "wetland_bog.png",
    "wetland_mangrove": "wetland_mangrove.png",
    "wetland_marsh": "wetland_marsh.png",
    "wetland_reed": "wetland_reed.png",
    "wetland_swamp": "wetland_swamp.png"
  }
}

customElements.define('map-search', MapSearch);