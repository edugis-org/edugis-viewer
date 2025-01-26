
describe('EduGIS viewer', () => {
  
  beforeEach(() => {
    cy.viewport(1000, 600)
    cy.visit('http://localhost:8000#configurl=maps/layers.json')
  })

  it('loads layers.json', () => {
    cy.wait(2000)
    cy.compareSnapshot('default-view')
  })

  it('searches address and zooms to selected address', () => {
    const webMapShadow = cy.get('#app-container')
      .find('map-app')
      .shadow()
      .find('web-map')
      .shadow()
    webMapShadow.find('#tools-menu > ul > li:nth-child(1) > map-iconbutton')
      .click()
    cy.wait(100);
    //document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("#panel-container > map-panel:nth-child(1) > map-search").shadowRoot.querySelector("div > input[type=text]")
    cy.get('#app-container')
      .find('map-app')
      .shadow()
      .find('web-map')
      .shadow()
      .find('#panel-container > map-panel:nth-child(1) > map-search')
      .shadow()
      .find('div > input[type=text]')
      .type('Wittenburgergracht 16, Amsterdam')
    //document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("#panel-container > map-panel:nth-child(1) > map-search").shadowRoot.querySelector("div.resultlist > ul > li")
    cy.get('#app-container')
      .find('map-app')
      .shadow()
      .find('web-map')
      .shadow()
      .find('#panel-container > map-panel:nth-child(1) > map-search')
      .shadow()
      .find('div.searchbox > span')
      .click()        
    cy.get('#app-container')
      .find('map-app')
      .shadow()
      .find('web-map')
      .shadow()
      .find('#panel-container > map-panel:nth-child(1) > map-search')
      .shadow()
      .find('div.resultlist > ul > li')
      .click()
    cy.wait(5000)
    cy.compareSnapshot('address-search')
  })
  it('zooms to zoom level 10', () => {
    //document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("div.webmap.maplibregl-map.mapboxgl-map > div.maplibregl-control-container.mapboxgl-control-container > div.maplibregl-ctrl-bottom-left.mapboxgl-ctrl-bottom-left > div.mapboxgl-ctrl.mapboxgl-ctrl-group.mapboxgl-ctrl-zoom > div > input[type=text]")    
    const zoomSetting = cy.get('#app-container')
      .find('map-app')
      .shadow()
      .find('web-map')
      .shadow()
      .find('div.webmap.maplibregl-map > div.maplibregl-control-container > div.maplibregl-ctrl-bottom-left > div.maplibregl-ctrl.maplibregl-ctrl-group.maplibregl-ctrl-zoom > div > input[type=text]')
    zoomSetting.type('{selectall}10\n')
    cy.wait(2000)
    const mapCoords = cy.get('#app-container')
      .find('map-app')
      .shadow()
      .find('web-map')
      .shadow()
      .find('map-coordinates')
      .shadow()
    mapCoords.should('contain.text', '52.17°N')
    cy.compareSnapshot('zoom-level-10')
  })
  it('opens the layers tool and selects LayerTool => Achtergrondlagen => Helder (OSM) and check legend', () => {
    // LayerTool
    cy.get('#app-container')
      .find('map-app')
      .shadow()
      .find('web-map')
      .shadow()
      .find('#tools-menu > ul > li:nth-child(2) > map-iconbutton')
      .click()
      cy.wait(500)
      //document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("#tools-menu > ul > li:nth-child(2) > map-iconbutton").shadowRoot.querySelector("div")
    // Achtergrondlagen
    cy.get('#app-container')
      .find('map-app')
      .shadow()
      .find('web-map')
      .shadow()
      .find('#panel-container > map-panel:nth-child(2) > map-data-catalog')
      .shadow()
      .find("map-layer-tree")
      .shadow()
      .find("div.wrapper > div.layertree > ul > li:nth-child(1)")
      .click()
      cy.wait(1000)
      //document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("#panel-container > map-panel:nth-child(2) > map-data-catalog").shadowRoot.querySelector("map-layer-tree").shadowRoot.querySelector("div.wrapper > div.layertree > ul > li:nth-child(1)")
    // Helder (OSM)
    cy.get('#app-container')
      .find('map-app')
      .shadow()
      .find('web-map')
      .shadow()
      .find('#panel-container > map-panel:nth-child(2) > map-data-catalog')
      .shadow()
      .find("map-layer-tree")
      .shadow()
      .find("div.wrapper > div.layertree > ul > li:nth-child(1) > ul > li:nth-child(3)")
      .click()
      //document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("#panel-container > map-panel:nth-child(2) > map-data-catalog").shadowRoot.querySelector("map-layer-tree").shadowRoot.querySelector("div.wrapper > div.layertree > ul > li:nth-child(1) > ul > li:nth-child(3)")
    cy.wait(3500)
    cy.compareSnapshot('layer-bright').then(comparisonResults => {
      cy.log("Number of mismatched pixels: " + comparisonResults.mismatchedPixels)
      cy.log("Percentage difference: " + comparisonResults.percentage)
    })
    cy.get('#app-container')
      .find('map-app')
      .shadow()
      .find('web-map')
      .shadow()
      .find('#layersbackground')
      .shadow()
      .find("#title")
      .click()
    cy.wait(1000)
    cy.compareSnapshot('layer-bright-legend').then(comparisonResults => {
      cy.log(comparisonResults.mismatchedPixels)
      cy.log(comparisonResults.percentage)
    })
     //document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("#layersbackground").shadowRoot.querySelector("#title")
     cy.get('#app-container')
      .find('map-app')
      .shadow()
      .find('web-map')
      .shadow()
      .find('#legend-container-container > map-layer-container')
      .shadow()
      .find("#mlccontainer")
      .compareSnapshot('layer-bright-legend-only')
     //document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("#legend-container-container > map-layer-container").shadowRoot.querySelector("#mlccontainer")
  })
  it('opens the layers tool, selects a Eenvoudig (OSM) layer, compares the legend', () => {
    // LayerTool
    cy.get('#app-container').find('map-app').shadow().find('web-map').shadow()
      .find('#tools-menu > ul > li:nth-child(2) > map-iconbutton').click()
    cy.wait(500)
      //document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("#tools-menu > ul > li:nth-child(2) > map-iconbutton").shadowRoot.querySelector("div")
    // Achtergrondlagen
    cy.get('#app-container').find('map-app').shadow().find('web-map').shadow().find('#panel-container > map-panel:nth-child(2) > map-data-catalog')
      .shadow().find("map-layer-tree").shadow().find("div.wrapper > div.layertree > ul > li:nth-child(1)").click()
    cy.wait(1000)
      //document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("#panel-container > map-panel:nth-child(2) > map-data-catalog").shadowRoot.querySelector("map-layer-tree").shadowRoot.querySelector("div.wrapper > div.layertree > ul > li:nth-child(1)")
    // Helder (OSM)
    cy.get('#app-container').find('map-app').shadow().find('web-map').shadow().find('#panel-container > map-panel:nth-child(2) > map-data-catalog')
      .shadow().find("map-layer-tree").shadow()
      .find("div.wrapper > div.layertree > ul > li:nth-child(1) > ul > li:nth-child(6)")
      .click()
      //document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("#panel-container > map-panel:nth-child(2) > map-data-catalog").shadowRoot.querySelector("map-layer-tree").shadowRoot.querySelector("div.wrapper > div.layertree > ul > li:nth-child(1) > ul > li:nth-child(3)")
    cy.wait(3500)
    // Legend
    cy.get('#app-container').find('map-app').shadow().find('web-map').shadow().find('#layersbackground').shadow().find("#title")
      .click()
    cy.wait(1000)
    cy.get('#app-container').find('map-app').shadow().find('web-map').shadow().find('#legend-container-container > map-layer-container')
      .shadow().find("#mlccontainer")
      .compareSnapshot('layer-eenvoudig-legend-only', {
        errorThreshold: 0
      })
     //document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("#legend-container-container > map-layer-container").shadowRoot.querySelector("#mlccontainer"
  })
})

describe('EduGIS viewer with different browser languages', () => {
  
  it('checks the help starter option (hopscotch)', ()=> {
    cy.visit('http://localhost:8000#configurl=maps/layers.json&helpstart=true', {
      onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'fr-FR' });
          Object.defineProperty(win.navigator, 'languages', { value: ['fr'] });
          Object.defineProperty(win.navigator, 'accept_languages', { value: ['fr'] });
      },
      headers: {
          'Accept-Language': 'fr-FR,fr'
      }
    })
    cy.wait(3000)
    cy.get("body > div.hopscotch-bubble.animated.tour-hello-hopscotch")
    .compareSnapshot('help-starter')
    //document.querySelector("body > div.hopscotch-bubble.animated.tour-hello-hopscotch")
    
    cy.get("body > div.hopscotch-bubble.animated.tour-hello-hopscotch > div.hopscotch-bubble-container > div.hopscotch-bubble-content > div > ul > li:nth-child(2) > b")
    .should('have.text', 'faire glisser')
    //document.querySelector("body > div.hopscotch-bubble.animated.tour-hello-hopscotch > div.hopscotch-bubble-container > div.hopscotch-bubble-content > div > ul > li:nth-child(2) > b")
    cy.pause();
  });

  it('checks the measurement tool in Dutch', ()=> {
    cy.visit('http://localhost:8000#configurl=maps/world.json', {
      onBeforeLoad(win) {
          Object.defineProperty(win.navigator, 'language', { value: 'nl-NL' });
          Object.defineProperty(win.navigator, 'languages', { value: ['nl'] });
          Object.defineProperty(win.navigator, 'accept_languages', { value: ['nl'] });
      },
      headers: {
          'Accept-Language': 'nl-NL,nl'
      }
    })
    cy.wait(1000)
    // Click Measure Tool
    cy.get('#app-container').find('map-app').shadow().find('web-map').shadow().find('#tools-menu > ul > li:nth-child(3) > map-iconbutton')
      .click()
    cy.wait(1000)
    // click first point in map at x: 471, y: 145
    cy.get('#app-container').find('map-app').shadow().find('web-map').shadow().find('div.webmap.maplibregl-map')
      .click(471,145)
      // document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("div.webmap.maplibregl-map")
    cy.get('#app-container').find('map-app').shadow().find('web-map').shadow().find('div.webmap.maplibregl-map')
      .click(267,191)
    cy.wait(100)
    cy.get('#app-container').find('map-app').shadow().find('web-map').shadow().find('#panel-container > map-panel:nth-child(3) > map-measure')
      .shadow().find('div > div.scrollcontainer > div > table > tbody > tr:nth-child(1) > th:nth-child(1)')
      .should('have.text', 'Afstand')
    cy.get('#app-container').find('map-app').shadow().find('web-map').shadow().find('#panel-container > map-panel:nth-child(3) > map-measure')
      .shadow().find('div > div.scrollcontainer > div > table > tbody > tr:nth-child(2) > td:nth-child(1)')
      .should('have.text', '6221 km')
     ///document.querySelector("#app-container > map-app").shadowRoot.querySelector("web-map").shadowRoot.querySelector("#panel-container > map-panel:nth-child(3) > map-measure").shadowRoot.querySelector("div > div.scrollcontainer > div > table > tbody > tr:nth-child(2) > td:nth-child(1)")
    cy.pause()
  })
})