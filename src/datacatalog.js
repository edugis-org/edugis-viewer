export default 
[
    {
      "type":"group",
      "title":"Thematische lagen",
      "sublayers":[
        {
          "type":"group",
          "title":"WMS",
          "sublayers":[
            {
              "title":"PDOK Luchtfoto",
              "type":"wms",
              "layerInfo":{
                "id":"pdokluchtfoto",
                "type":"raster",
                "metadata": {
                  "legendurl": "https://map.edugis.nl/legends2/pdoklufolegend2018.png",
                },
                "source":{
                  "type":"raster",
                  "tileSize":256,
                  "tiles":[
                    "https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0/?layers=2018_ortho25&bbox={bbox-epsg-3857}&format=image/png",
                  ],
                  "attribution":"PDOK",
                  "bounds" : [2.75,50.50, 7.5, 53.6]
                }
              }
            },
            {
              "title":"Blaeu",
              "type":"wms",
              "layerInfo":{
                "id":"blaeu",
                "type":"raster",
                "metadata":{
                  "legendurl":"https://mapserver.edugis.nl/legends/nederland/belgica-logo.jpg"
                },
                "minzoom":5.5,
                "maxzoom":12.5,
                "source":{
                  "type":"raster",
                  "tileSize":256,
                  "tiles":[
                    "https://t1.edugis.nl/tiles/tilecache.py?map=maps/edugis/cache/blaeu.map&LAYERS=Nederland%2017e%20eeuw%20(Blaeu)&TRANSPARENT=true&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG%3A3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256",
                    "https://t2.edugis.nl/tiles/tilecache.py?map=maps/edugis/cache/blaeu.map&LAYERS=Nederland%2017e%20eeuw%20(Blaeu)&TRANSPARENT=true&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG%3A3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256"
                  ],
                  "attribution":"EduGIS"
                }
              }
            },
            {
              "title":"Pico hoogspanningsnet 2018",
              "type":"wms",
              "layerInfo":{
                "id":"hoogspanningsnet_2018",
                "type":"raster",
                "minzoom":4.5,
                "metadata":{
                  "getFeatureInfoUrl":"https://pico.geodan.nl/cgi-bin/qgis_mapserv.fcgi?DPI=120&map=/usr/lib/cgi-bin/projects/Hoogspanningsnet_2018.qgs&layers=Hoogspanningsnet_2018&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&STYLES=&query_layers=Hoogspanningsnet_2018"
                },
                "source":{
                  "type":"raster",
                  "tileSize":256,
                  "tiles":[
                    "https://pico.geodan.nl/cgi-bin/qgis_mapserv.fcgi?DPI=120&map=/usr/lib/cgi-bin/projects/Hoogspanningsnet_2018.qgs&layers=Hoogspanningsnet_2018&TRANSPARENT=true&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG%3A3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256"
                  ],
                  "attribution":"Pico"
                }
              }
            },
            {
              "title":"Pico dakdelen 2018",
              "type":"wms",
              "layerInfo":{
                "id":"dakdelen_2018",
                "type":"raster",
                "minzoom":16.5,
                "metadata":{
                  "legendurl":"https://pico.geodan.nl/cgi-bin/qgis_mapserv.fcgi?DPI=120&map=/usr/lib/cgi-bin/projects/dakdelen2.qgs&transparent=false&LAYERS=dakdelen2&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&STYLES=&",
                  "getFeatureInfoUrl":"https://pico.geodan.nl/cgi-bin/qgis_mapserv.fcgi?DPI=120&map=/usr/lib/cgi-bin/projects/dakdelen2.qgs&query_layers=dakdelen2&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&STYLES="
                },
                "source":{
                  "type":"raster",
                  "minzoom":16.5,
                  "tileSize":512,
                  "tiles":[
                    "https://pico.geodan.nl/cgi-bin/qgis_mapserv.fcgi?DPI=120&map=/usr/lib/cgi-bin/projects/dakdelen2.qgs&transparent=true&LAYERS=dakdelen2&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG%3A3857&BBOX={bbox-epsg-3857}&WIDTH=512&HEIGHT=512"
                  ],
                  "attribution":"Pico"
                }
              }
            },
            {
              "title":"Parkeervakken Amsterdam",
              "type":"wms",
              "layerInfo":{
                "id":"amsparkeervakken",
                "type":"raster",
                "minzoom":15,
                "metadata":{
                  "legendurl":"https://map.data.amsterdam.nl/maps/parkeervakken?transparent=false&LAYER=parkeervakken&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&STYLES=&",
                  "getFeatureInfoUrl":"https://map.data.amsterdam.nl/maps/parkeervakken?query_layers=parkeervakken&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo",
                  "getFeatureInfoFormat":"application/json"
                },
                "source":{
                  "type":"raster",
                  "minzoom":15,
                  "tileSize":512,
                  "tiles":[
                    "https://map.data.amsterdam.nl/maps/parkeervakken?transparent=true&LAYERS=parkeervakken&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG%3A3857&BBOX={bbox-epsg-3857}&WIDTH=512&HEIGHT=512"
                  ],
                  "attribution":"Pico"
                }
              }
            },
            {
              "title":"Fietstocht Bert en Joep",
              "type":"wms",
              "layerInfo":{
                "id":"fietstocht",
                "type":"raster",
                "metadata":{
                  "legendurl":"",
                  "getFeatureInfoUrl":"https://services.geodan.nl/public/data/my/gws/ZLTO6584XXXX/ows?query_layers=Route_06330481-61aa-4b74-b76a-33bf23e17acf&LAYERS=Route_06330481-61aa-4b74-b76a-33bf23e17acf&VERSION=1.3.0&SERVICEKEY=3dc8818a-d126-11e7-a442-005056805b87&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetFeatureInfo&STYLES="
                },
                "source":{
                  "type":"raster",
                  "tileSize":256,
                  "tiles":[
                    "https://services.geodan.nl/public/data/my/gws/ZLTO6584XXXX/ows?LAYERS=Route_06330481-61aa-4b74-b76a-33bf23e17acf&FORMAT=image%2Fpng&TRANSPARENT=TRUE&VERSION=1.3.0&SERVICEKEY=3dc8818a-d126-11e7-a442-005056805b87&EXCEPTIONS=INIMAGE&SERVICE=WMS&REQUEST=GetMap&STYLES=&sld=https%3A%2F%2Fservices.geodan.nl%2Fpublic%2Fdocument%2FZLTO6584XXXX%2Fapi%2Fdata%2FZLTO6584XXXX%2Fstyles%2FZLTO6584XXXX_public%3ARoute_06330481-61aa-4b74-b76a-33bf23e17acf%3ARoute_zwart&CRS=EPSG%3A3857&bbox={bbox-epsg-3857}&WIDTH=256&HEIGHT=256"
                  ],
                  "attribution":"StevenF",
                  "bounds": [8.89, 59.60, 11.62, 63.58]
                }
              }
            },
            {
              "title":"Actueel Hoogtebestand NL (DSM)",
              "type":"wms",
              "layerInfo":{
                "id":"ahndsm",
                "type":"raster",
                "metadata":{
                  "legendurl":"https://mapserver.edugis.nl/legends/nederland/ahn-nederland1.png",
                  "getFeatureInfoUrl":"https://mapserver.edugis.nl/cgi-bin/mapserv?map=maps/edugis/cache/hoogte.map&SERVICE=WMS&VERSION=1.1.0&REQUEST=GetFeatureInfo&EXCEPTIONS=application/vnd.ogc.se_xml&layers=hoogte&query_layers=hoogte",
                  "getFeatureInfoFormat":"application/vnd.ogc.gml"
                },
                "source":{
                  "type":"raster",
                  "tileSize":256,
                  "tiles":[
                    "https://t1.edugis.nl/tiles/tilecache.py?map=maps/edugis/cache/hoogte.map&amp;&LAYERS=hoogtes&TRANSPARENT=true&FORMAT=image%2Fgif&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG%3A900913&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256",
                    "https://t2.edugis.nl/tiles/tilecache.py?map=maps/edugis/cache/hoogte.map&amp;&LAYERS=hoogtes&TRANSPARENT=true&FORMAT=image%2Fgif&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG%3A900913&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256"
                  ],
                  "attribution":""
                }
              }
            },
            {
              "title":"Neerslagradar KNMI",
              "type":"wms",
              "layerInfo":{
                "id":"knmineerslag",
                "type":"raster",
                "metadata":{
                  "getFeatureInfoUrl":"https://geoservices.knmi.nl/adaguc-server?DATASET=RADAR&SERVICE=WMS&&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS=RAD_NL25_PCP_CM&query_layers=RAD_NL25_PCP_CM&STYLES=rainbow%2Fnearest&",
                  "getFeatureInfoFormat":"application/json"
                },
                "source":{
                  "type":"raster",
                  "tileSize":1024,
                  "tiles":[
                    "https://geoservices.knmi.nl/adaguc-server?DATASET=RADAR&SERVICE=WMS&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=RAD_NL25_PCP_CM&CRS=EPSG%3A3857&BBOX={bbox-epsg-3857}&STYLES=rainbow%2Fnearest&FORMAT=image/png&TRANSPARENT=TRUE&WIDTH=1024&HEIGHT=1024"
                  ],
                  "attribution":"KNMI"
                }
              }
            },
            {
              "title":"Neerslagradar USA",
              "type":"wms",
              "layerInfo":{
                "id":"usaweatherradar",
                "type":"raster",
                "metadata":{
                  "legendurl":""
                },
                "source":{
                  "type":"raster",
                  "tileSize":1024,
                  "tiles":[
                    "https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi?SERVICE=WMS&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&STYLES=&VERSION=1.3.0&LAYERS=nexrad-n0q-900913-conus,nexrad-n0q-900913-ak,nexrad-n0q-900913-hi,nexrad-n0q-900913-pr,nexrad-n0q-900913-m05m-conus,nexrad-n0q-900913-m05m-hi,nexrad-n0q-900913-m05m-ak,nexrad-n0q-900913-m05m-pr,nexrad-n0q-900913-m10m-conus,nexrad-n0q-900913-m10m-ak&WIDTH=1024&HEIGHT=1024&CRS=EPSG:900913&BBOX={bbox-epsg-3857}"
                  ],
                  "attribution":"NEXRAD",
                  "bounds":[-160,14,-60,72]
                }
              }
            },
            {
              "title":"Neerslagradar Duitsland",
              "type":"wms",
              "layerInfo":{
                "id":"Radarkomposit",
                "type":"raster",
                "metadata":{
                  "getFeatureInfoUrl":"https://maps.dwd.de/geoserver/ows?SERVICE=WMS&REQUEST=GetFeatureInfo&STYLES=&VERSION=1.3.0&LAYERS=dwd:RX-Produkt&QUERY_LAYERS=dwd:RX-Produkt"
                },
                "source":{
                  "type":"raster",
                  "tileSize":1024,
                  "tiles":[
                    "https://maps.dwd.de/geoserver/ows?LAYERS=dwd:RX-Produkt"
                  ],
                  "attribution":"dwd.de"
                }
              }
            },
            {
              "title":"Neerslagradar Groot Britannie",
              "type":"wmsviatiles",
              "layerInfo":{
                "id":"metofficeradar",
                "type":"raster",
                "metadata":{
                  "legendurl":"",
                  "timeinterval":300000
                },
                "source":{
                  "type":"raster",
                  "tileSize":256,
                  "tiles":[
                    "https://tiles.edugis.nl/www.metoffice.gov.uk/public/data/LayerCache/OBSERVATIONS/ItemBbox/RADAR_UK_Composite_Highres/{x}/{y}/{z}/png?styles=Bitmap+1km+Blue-Pale+blue+gradient+0.01+to+32mm%2Fhr&TIME={time}&key={metofficekey}"
                  ],
                  "attribution":"met office"
                }
              }
            },
            {
              "title":"KNMI neerslag",
              "type":"wms",
              "layerInfo":{
                "id":"eumetsatknmi",
                "type":"raster",
                "metadata":{
                  "timeinterval":900000,
                  "source":"https://geoservices.knmi.nl/adaguc_portal/ => MSGCPP OGC realtime service => Precipitation rate"
                },
                "source":{
                  "type":"raster",
                  "tileSize":1024,
                  "tiles":[
                    "https://msgcpp-ogc-realtime.knmi.nl/msgrt.cgi?LAYERS=lwe_precipitation_rate&STYLES=precip%2Fnearest&time={time}"
                  ],
                  "attribution":"EUMETSAT/KNMI"
                }
              }
            }
          ]
        },
        {
          "type":"group",
          "title":"WMS GetCapabilities",
          "sublayers":[    
            {
              "type":"getcapabilities",
              "title":"bbg2012caps",
              "layerInfo":{
                "id":"bbg2012",
                "url":"https://tiles.edugis.nl/mapproxy/bbg2012/service?service=WMS&version=1.3.0&request=getcapabilities"
              }
            },
            {
              "type": "group",
              "title" : "Finse meteorologische dienst",
              "sublayers" :[
                {
                  "type": "getcapabilities",
                  "title": "fmi",
                  "layerInfo": {
                    "id": "fmi",
                    "url": "https://openwms.fmi.fi/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities&"
                  }
                }
              ]
            },
            {
              "type": "group",
              "title": "Geodata Prov. Utrecht",
              "sublayers": [
                {
                  "type": "getcapabilities",
                  "title": "utrechtwater",
                  "layerInfo": {
                    "id": "utrechtcapswater",
                    "url": "https://services.geodata-utrecht.nl/geoserver/w01_2_grondwater/wms?request=GetCapabilities&service=WMS&version=1.3.0&"
                  }
                }
              ]
              
            },
            {
              "type":"getcapabilities",
              "title":"blaeucaps",
              "layerInfo":{
                "id":"blaeucaps",
                "url":"https://mapserver.edugis.nl/cgi-bin/mapserv?request=getcapabilities&version=1.1.1&service=wms&map=maps/edugis/cache/blaeu.map",
                "deniedlayers":"amsterdam_1945",
                "allowedlayers":""
              }
            }
          ]
        },
        {
          "type":"group",
          "title":"WMTS",
          "sublayers":[
            {
              "title":"CBS (mapproxy + qgis)",
              "type":"wmts",
              "layerInfo":{
                "id":"cbsbevolking2017",
                "type":"raster",
                "minzoom":2.5,
                "maxzoom":16.5,
                "metadata":{
                  "getFeatureInfoUrl":"https://tiles.edugis.nl/mapproxy/cbsbevolking2017/wms?version=1.1.1&request=GetFeatureInfo&styles=&layers=cbsbevolking2017&query_layers=cbsbevolking2017",
                  "legendurl":"https://map.edugis.nl/legends2/cbsbevolking2017legend.png"
                },
                "source":{
                  "type":"raster",
                  "tileSize":256,
                  "tiles":[
                    "https://tiles.edugis.nl/mapproxy/cbsbevolking2017/wmts/cbsbevolking2017/spherical_mercator/{z}/{x}/{y}.png"
                  ],
                  "attribution":"&copy; Geodan, CBS"
                }
              }
            },
            {
              "title":"Openstreetmap (wmts)",
              "type":"wmts",
              "layerInfo":{
                "id":"openstreetmap",
                "type":"raster",
                "metadata":{
                  "legendurl":"https://mapserver.edugis.nl/legends/wereld/osm_logo.png"
                },
                "source":{
                  "type":"raster",
                  "tileSize":256,
                  "tiles":[
                    "https://tiles.edugis.nl/mapproxy/osm/tiles/osm_EPSG900913/{z}/{x}/{y}.png?origin=nw"
                  ],
                  "attribution":"&copy; <a href=\"https://www.openstreetmap.org/about\" target=\"attribution\">OpenStreetMap contributors</a>"
                }
              }
            },
            {
              "title":"Openstreetmap gray",
              "type":"wmts",
              "layerInfo":{
                "id":"openstreetmapgray",
                "type":"raster",
                "metadata":{
                  "legendurl":"https://mapserver.edugis.nl/legends/wereld/osm_logo.png"
                },
                "source":{
                  "type":"raster",
                  "tileSize":256,
                  "tiles":[
                    "https://saturnus.geodan.nl/mapproxy/osm/tiles/osmgrayscale_EPSG900913/{z}/{x}/{y}.png?origin=nw"
                  ],
                  "attribution":"&copy; <a href=\"https://www.openstreetmap.org/about\" target=\"attribution\">OpenStreetMap contributors</a>"
                }
              }
            },
            {
              "title": "PDOK luchtfoto's 2016 (WMTS)",
              "type": "wmts",
              "layerInfo": {
                "id": "pdokluchtfotowmts2016",
                "type": "raster",
                "metadata": {
                  "legendurl": "https://map.edugis.nl/legends2/pdoklufolegend2016.png"
                },
                "source": {
                  "type": "raster",
                  "tileSize": 256,
                  "tiles": [
                    "https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/2016_ortho25/EPSG:3857/{z}/{x}/{y}.jpeg"
                  ],
                  "attribution": "PDOK",
                  "minzoom": 5,
                  "maxzoom": 18
                }
              }
            },
            {
              "title": "PDOK luchtfoto's 2017 (WMTS)",
              "type": "wmts",
              "layerInfo": {
                "id": "pdokluchtfotowmts2017",
                "type": "raster",
                "metadata": {
                  "legendurl": "https://map.edugis.nl/legends2/pdoklufolegend2017.png"
                },
                "source": {
                  "type": "raster",
                  "tileSize": 256,
                  "tiles": [
                    "https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/2017_ortho25/EPSG:3857/{z}/{x}/{y}.jpeg"
                  ],
                  "attribution": "PDOK",
                  "minzoom": 5,
                  "maxzoom": 18
                }
              }
            }, {
              "title": "PDOK luchtfoto's 2020 (WMTS)",
              "type": "wmts",
              "layerInfo": {
                "id": "pdokluchtfotowmts2020",
                "type": "raster",
                "metadata": {
                  "legendurl": "https://map.edugis.nl/legends2/pdoklufolegend2018.png"
                },
                "source": {
                  "type": "raster",
                  "tileSize": 256,
                  "tiles": [
                    "https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/2020_ortho25/EPSG:3857/{z}/{x}/{y}.jpeg"
                  ],
                  "attribution": "PDOK",
                  "minzoom": 5,
                  "maxzoom": 19
                }
              }
            },{
              "title": "PDOK luchtfoto's Actueel (WMTS)",
              "type": "wmts",
              "layerInfo": {
                "id": "pdokluchtfotowmtsactueel",
                "type": "raster",
                "metadata": {
                  "legendurl": "https://map.edugis.nl/legends2/pdoklufolegendactueel.png"
                },
                "source": {
                  "type": "raster",
                  "tileSize": 256,
                  "tiles": [
                    "https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_ortho25/EPSG:3857/{z}/{x}/{y}.jpeg"
                  ],
                  "attribution": "PDOK",
                  "minzoom": 5,
                  "maxzoom": 19
                }
              }
            },
            {
              "title":"OSM frankrijk (wmts)",
              "type":"wmts",
              "layerInfo":{
                "id":"osmfr",
                "type":"raster",
                "metadata":{
                  "legendurl":"https://mapserver.edugis.nl/legends/wereld/osm_logo.png"
                },
                "source":{
                  "type":"raster",
                  "tileSize":256,
                  "tiles":[
                    "https://tile-c.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                  ],
                  "attribution":"&copy; <a href=\"https://www.openstreetmap.org/about\" target=\"attribution\">OpenStreetMap contributors</a>"
                }
              }
            },
            {
              "title":"Mapbox satellite",
              "type":"wmts",
              "layerInfo":{
                "id":"satellite",
                "type":"raster",
                "source":{
                  "type":"raster",
                  "tileSize":256,
                  "tiles":["https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.webp?access_token={mapboxkey}"]
                }
              }
            },
            {
              "title":"Streets (Geodan Maps)",
              "type":"wmts",
              "layerInfo":{
                "id":"geodanmaps streets",
                "type":"raster",
                "source":{
                  "type":"raster",
                  "tileSize":256,
                  "tiles":[
                    "https://services.geodan.nl/data/geodan/gws/world/streets/wmts/streets/EPSG%3A3857/{z}/{x}/{y}.png?servicekey={geodanmapskey}"
                  ],
                  "attribution":"&copy; GeodanMaps"
                }
              }
            }
          ]
        },
        {
          "type":"group",
          "title":"TMS",
          "sublayers":[
            {
              "type":"layer",
              "title":"To do",
              "layerInfo":{
   
              }
            }
          ]
        },
        {
          "type":"group",
          "title":"WFS",
          "sublayers":[
            {
              "type":"layer",
              "title":"To do(via mvt proxy?)",
              "layerInfo":{
   
              }
            }
          ]
        },
        {
          "type":"group",
          "title":"GeoJSON",
          "sublayers":[
            {
              "type":"geojson",
              "title":"CBS Gemeenten (2.1 MB)",
              "layerInfo":{
                "id":"cbsgemeenten2017",
                "type":"fill",
                "source":{
                  "type":"geojson",
                  "data":"https://tiles.edugis.nl/geojson/cbsgebiedsindelingen_cbs_gemeente_2017_gegeneraliseerd.json",
                  "attribution":"cbs/pdok"
                },
                "paint":{
                  "fill-color":"#ccc",
                  "fill-opacity":0.6,
                  "fill-outline-color":"#444"
                }
              }
            },
            {
              "title": "Punten in Nederland",
              "layerInfo": {
                "id": "punten",
                "type": "circle",
                "source": {
                  "type": "geojson",
                  "data": {
                    "type": "FeatureCollection",
                    "features": [
                      {
                        "type": "Feature",
                        "properties": {
                          "name": "Utrecht",
                          "value": 1
                        },
                        "geometry": {
                          "type": "Point",
                          "coordinates": [5.1214, 52.0907]
                        }
                      },{
                        "type": "Feature",
                        "properties": {
                          "name": "Den Haag",
                          "value": 2
                        },
                        "geometry": {
                          "type": "Point",
                          "coordinates": [4.3007, 52.0705]
                        }
                      },
                      {
                        "type": "Feature",
                        "properties": {
                          "name": "Arnhem",
                          "value": 3
                        },
                        "geometry": {
                          "type": "Point",
                          "coordinates": [5.9119, 51.9851]
                        }
                      }
                    ]
                  }
                },
                "paint": {
                  "circle-radius": 5,
                  "circle-color": "#f00"
                }
              }
            },
            {
              "title": "Punten geklassificeerd",
              "layerInfo": {
                "id": "puntengeklasseerd",
                "type": "circle",
                "source": {
                  "type": "geojson",
                  "data": {
                    "type": "FeatureCollection",
                    "features": [
                      {
                        "type": "Feature",
                        "properties": {
                          "name": "Utrecht",
                          "value": 1
                        },
                        "geometry": {
                          "type": "Point",
                          "coordinates": [5.1214, 52.0907]
                        }
                      },{
                        "type": "Feature",
                        "properties": {
                          "name": "Den Haag",
                          "value": 2
                        },
                        "geometry": {
                          "type": "Point",
                          "coordinates": [4.3007, 52.0705]
                        }
                      },
                      {
                        "type": "Feature",
                        "properties": {
                          "name": "Arnhem",
                          "value": 3
                        },
                        "geometry": {
                          "type": "Point",
                          "coordinates": [5.9119, 51.9851]
                        }
                      }
                    ]
                  }
                },
                paint: {
                  "circle-radius": 5,
                  "circle-color": [
                    "match",
                    ["get", "value"],
                    1, "#f00",
                    2, "#f80",
                    3, "#ff0",
                    "#000"
                    ], 
                  "circle-stroke-width": 1
                }
              }
            },
            {
              "type":"geojson",
              "title":"Merwedekanaalzone Utrecht",
              "layerInfo":{
                "id":"merwedekanaalzone",
                "type":"fill",
                "minzoom": 11,
                "source":{
                  "type":"geojson",
                  "data":"https://tiles.edugis.nl/geojson/merwedekanaalzone.json",
                  "attribution":"EduGIS"
                },
                "paint":{
                  "fill-color":"#f4b68d",
                  "fill-opacity":0.6,
                  "fill-outline-color":"#c93300"
                }
              }
            },
            {
              "type":"geojson",
              "title":"Fietstocht Bert en Joep (punten)",
              "layerInfo":{
                "id":"fietstochtpunten",
                "type":"circle",
                "metadata":{
                  "crs":"EPSG:3857"
                },
                "source":{
                  "type":"geojson",
                  "data":"https://research.geodan.nl/cgi-py/getlocationhistory.py?id=3",
                  "attribution":"StevenF"
                },
                "paint":{
                  "circle-radius":5,
                  "circle-color":"#FA0"
                }
              }
            },
            {
              "type":"geojson",
              "title":"Verkeerssnelheid Amsterdam",
              "layerInfo":{
                "id":"verkeerssnelheidamsterdam",
                "type":"style",
                "source":{
                  "version":8,
                  "name":"Verkeerssnelheid Amsterdam",
                  "sources":{
                    "verkeerssnelheid amsterdam":{
                      "type":"geojson",
                      "data":"https://tiles.edugis.nl/web.redant.net/~amsterdam/ndw/data/reistijdenAmsterdam.geojson",
                      "attribution":"StevenF"
                    }
                  },
                  "layers":[
                    {
                      "id":"snelheid onbekend",
                      "type":"line",
                      "source":"verkeerssnelheid amsterdam",
                      "filter":[
                        "all",
                        [
                          "==",
                          "$type",
                          "LineString"
                        ],
                        [
                          "!has",
                          "Velocity"
                        ]
                      ],
                      "paint":{
                        "line-color":"#D0D0D0",
                        "line-width":3
                      }
                    },
                    {
                      "id":"snelheid snelweg",
                      "type":"line",
                      "source":"verkeerssnelheid amsterdam",
                      "filter":[
                        "all",
                        [
                          "==",
                          "$type",
                          "LineString"
                        ],
                        [
                          "all",
                          [
                            "==",
                            "Type",
                            "H"
                          ],
                          [
                            ">",
                            "Velocity",
                            -1
                          ]
                        ]
                      ],
                      "paint":{
                        "line-color":[
                          "step",
                          [
                            "get",
                            "Velocity"
                          ],
                          "#D0D0D0",
                          1,
                          "#BE0000",
                          30,
                          "#FF0000",
                          50,
                          "#FF9E00",
                          70,
                          "#FFFF00",
                          90,
                          "#AAFF00",
                          120,
                          "#00B22D"
                        ],
                        "line-width":5
                      }
                    },
                    {
                      "id":"snelheid overig",
                      "type":"line",
                      "source":"verkeerssnelheid amsterdam",
                      "filter":[
                        "all",
                        [
                          "==",
                          "$type",
                          "LineString"
                        ],
                        [
                          "all",
                          [
                            "!=",
                            "Type",
                            "H"
                          ],
                          [
                            ">",
                            "Velocity",
                            -1
                          ]
                        ]
                      ],
                      "paint":{
                        "line-color":[
                          "step",
                          [
                            "get",
                            "Velocity"
                          ],
                          "#00B22D",
                          1,
                          "#BE0000",
                          10,
                          "#FF0000",
                          20,
                          "#FF9E00",
                          30,
                          "#FFFF00",
                          40,
                          "#AAFF00",
                          50,
                          "#00B22D"
                        ],
                        "line-width":2
                      }
                    }
                  ]
                }
              }
            },
            {
              "type":"geojson",
              "title":"NDW Weglussen",
              "layerInfo":{
                "id":"ndwweglussen",
                "type":"line",
                "metadata":{
                  "crs":"EPSG:3857"
                },
                "source":{
                  "type":"geojson",
                  "data":"https://research.geodan.nl/sites/ndw_viewer/traffic.json",
                  "attribution":"RubioV"
                },
                "paint":{
                  "line-color":[
                    "step",
                    [
                      "get",
                      "speed"
                    ],
                    "#D0D0D0",
                    1,
                    "#BE0000",
                    30,
                    "#FF0000",
                    50,
                    "#FF9E00",
                    70,
                    "#FFFF00",
                    90,
                    "#AAFF00",
                    120,
                    "#00B22D"
                  ],
                  "line-width":[
                    "step",
                    [
                      "get",
                      "flow"
                    ],
                    1,
                    100,
                    2,
                    200,
                    3,
                    400,
                    4,
                    500,
                    5,
                    750,
                    6,
                    1000,
                    7,
                    1500,
                    8,
                    2000,
                    9
                  ]
                }
              }
            }
          ]
        },
        {
          "type":"group",
          "title":"TopoJSON",
          "sublayers":[
            {
              "type":"topojson",
              "title":"CBS wijken (1.5 MB)",
              "layerInfo":{
                "id":"cbswijken2017",
                "type":"fill",
                "metadata":{
                  "topojson":true
                },
                "source":{
                  "type":"geojson",
                  "data":"https://tiles.edugis.nl/geojson/cbs2017_wijken_attr.json",
                  "attribution":"cbs/pdok"
                },
                "paint":{
                  "fill-color":{
                    "type":"exponential",
                    "property":"bevolkingsdichtheid",
                    "stops":[
                      [
                        0,
                        "#f7fcf0"
                      ],
                      [
                        160,
                        "#e0f3db"
                      ],
                      [
                        320,
                        "#ccebc5"
                      ],
                      [
                        480,
                        "#a8ddb5"
                      ],
                      [
                        640,
                        "#7bccc4"
                      ],
                      [
                        800,
                        "#4eb3d3"
                      ],
                      [
                        960,
                        "#2b8cbe"
                      ],
                      [
                        1120,
                        "#0868ac"
                      ],
                      [
                        1280,
                        "#084081"
                      ]
                    ]
                  },
                  "fill-opacity":1,
                  "fill-outline-color":"#444"
                }
              }
            },
            {
              "type":"topojson",
              "title":"CBS bevolkingsdichtheid 2.5D",
              "layerInfo":{
                "id":"cbswijken2017inwoners",
                "type":"fill-extrusion",
                "metadata":{
                  "topojson":true
                },
                "source":{
                  "type":"geojson",
                  "data":"https://tiles.edugis.nl/geojson/cbs2017_wijken_attr.json",
                  "attribution":"cbs/pdok"
                },
                "paint":{
                  "fill-extrusion-color":{
                    "type":"exponential",
                    "property":"bevolkingsdichtheid",
                    "stops":[
                      [
                        0,
                        "#f7fcf0"
                      ],
                      [
                        160,
                        "#e0f3db"
                      ],
                      [
                        320,
                        "#ccebc5"
                      ],
                      [
                        480,
                        "#a8ddb5"
                      ],
                      [
                        640,
                        "#7bccc4"
                      ],
                      [
                        800,
                        "#4eb3d3"
                      ],
                      [
                        960,
                        "#2b8cbe"
                      ],
                      [
                        1120,
                        "#0868ac"
                      ],
                      [
                        1280,
                        "#084081"
                      ]
                    ]
                  },
                  "fill-extrusion-opacity":0.6,
                  "fill-extrusion-height":{
                    "property":"bevolkingsdichtheid",
                    "type":"identity"
                  }
                }
              }
            }
          ]
        },
        {
          "type":"group",
          "title":"Vector Tile",
          "sublayers":[
            {
              "type":"vectortile",
              "title":"NL buildings",
              "layerInfo":{
                "id":"gebouwkenmerken",
                "type":"fill",
                "source-layer":"gebouwkenmerken",
                "minzoom":13,
                "maxzoom":24,
                "source":{
                  "id":"gebouwkenmerken",
                  "type":"vector",
                  "tiles":[
                    "https://saturnus.geodan.nl/mvt/gebouwkenmerken/{z}/{x}/{y}.mvt"
                  ],
                  "minzoom":13,
                  "maxzoom":16
                },
                "layout":{
                  "visibility":"visible"
                },
                "paint":{
                  "fill-color":[
                    "match",
                    [
                      "get",
                      "pandtype"
                    ],
                    "kantoorpand",
                    "rgba(255, 0, 121, 1)",
                    "tussenwoning",
                    "blue",
                    "winkelgebouw",
                    "rgba(83, 16, 162, 1)",
                    "appartement midden",
                    "rgba(146, 95, 48, 1)",
                    "appartement laag",
                    "rgba(146, 140, 48, 1)",
                    "appartement hoog",
                    "rgba(113, 107, 76, 1)",
                    "schoolgebouw",
                    "rgba(50, 165, 81, 1)",
                    "gemengd gebouw",
                    "rgba(88, 75, 84, 1)",
                    "bijeenkomstgebouw",
                    "rgba(40, 128, 35, 1)",
                    "rgba(44, 127, 184, 1)"
                  ],
                  "fill-outline-color":"rgba(193, 193, 177, 1)"
                }
              }
            },
            {
              "type":"vectortile",
              "title":"NL buildings 3D",
              "layerInfo":{
                "id":"building3D",
                "type":"fill-extrusion",
                "source-layer":"gebouwkenmerken",
                "minzoom":13,
                "maxzoom":22,
                "source":{
                  "id":"gebouwkenmerken2",
                  "type":"vector",
                  "tiles":[
                    "https://saturnus.geodan.nl/mvt/gebouwkenmerken/{z}/{x}/{y}.mvt"
                  ],
                  "minzoom":13,
                  "maxzoom":16
                },
                "paint":{
                  "fill-extrusion-color":[
                    "match",
                    [
                      "get",
                      "pandtype"
                    ],
                    "kantoorpand",
                    "rgba(255, 0, 121, 1)",
                    "tussenwoning",
                    "blue",
                    "winkelgebouw",
                    "rgba(83, 16, 162, 1)",
                    "appartement midden",
                    "rgba(146, 95, 48, 1)",
                    "appartement laag",
                    "rgba(146, 140, 48, 1)",
                    "appartement hoog",
                    "rgba(113, 107, 76, 1)",
                    "schoolgebouw",
                    "rgba(50, 165, 81, 1)",
                    "gemengd gebouw",
                    "rgba(88, 75, 84, 1)",
                    "bijeenkomstgebouw",
                    "rgba(40, 128, 35, 1)",
                    "rgba(44, 127, 184, 1)"
                  ],
                  "fill-extrusion-height":{
                    "property":"hoogte",
                    "type":"identity"
                  },
                  "fill-extrusion-base":0,
                  "fill-extrusion-opacity":0.8
                }
              }
            },
            {
              "type":"vectortile",
              "title":"Merwedekaanaal Geotop 3D",
              "layerInfo": {
              "id":"geotop3D",
              "type":"fill-extrusion",
              "metadata": {
                "abstract":"GeoTop bevat landsdekkende ondergrondgegevens tot 50 meter diepte. De hier 3D weergegeven bovenkant is ondiep en de onderkant is 50 meter diep. De gegevens zijn berekend met een rekenmodel met informatie verkregen uit boringen. Voor elke halve meter diepte is de meest waarschijnlijke lithoklasse berekend. De GeoTop gridcellen zijn 100 bij 100 meter. In deze weergave is daarvan een verticale uitsnede voor de Merwedekanaalzone gemaakt."
              },
              "source":{
                "id":"geotop3d",
                "type":"vector",
                "tiles":[
                  "https://tiles.edugis.nl/data/public.merwede_geotop2d/mvt/{z}/{x}/{y}?geom_column=geom&columns=bro_id,lithoklass,lithoclass,diepte_ond&include_nulls=0"
                ],
                "minzoom":13,
                "maxzoom":18,
                "bounds": [5.09372605041148,52.0568791491654,5.12316584903853,52.088450941008]
              },
              "source-layer":"public.merwede_geotop2d",
              "minzoom":13,
              "maxzoom":24,
              "paint":{
                "fill-extrusion-color":[
                  "match",
                  [
                    "get",
                    "lithoklass"
                  ],
                  "Antropogeen",
                  "#c1c3c6",
                  "Veen",
                  "#985045",
                  "Klei",
                  "#189f48",
                  "Zandige Klei",
                  "#b6d169",
                  "Fijn Zand",
                  "#fff000",
                  "Matig grof zand",
                  "#ffdc00",
                  "Grof Zand",
                  "#ffc800",
                  "Grind",
                  "#ffb400",
                  "#000000"
                ],
                "fill-extrusion-height":["number", ["+",0.501,["+",50,["get","diepte_ond"]]]],
                "fill-extrusion-base":["number", ["+",50,["get","diepte_ond"]]],
                "fill-extrusion-opacity":0.95
              },
              //filter: ["any",["==",["get","diepte_ond"],-5],["==",["get","diepte_ond"],-25]]
              }
            },
            {
              "type": "vectortile",
              "title": "Merwedekanaal boringen",
              "layerInfo": {
                "id":"merwedekanaal_boringen2d",
                "type": "fill-extrusion",
                "source":{
                  "id":"geotop3d",
                  "type":"vector",
                  "tiles":[
                    "https://tiles.edugis.nl/data/public.merwede_boringen2d/mvt/{z}/{x}/{y}?geom_column=geom&columns=bro_id,jaar,diepte_bov,diepte_ond,dieptetotaal,laagdikte,lithclass,lithoklass,toelichtin&include_nulls=0"
                  ],
                  "minzoom":13,
                  "maxzoom":18,
                  "bounds":[5.09684149570033,52.0584800896675,5.12050753619579,52.0885720273277]
                },
                "source-layer":"public.merwede_boringen2d",
                "minzoom":13,
                "maxzoom":24,
                "paint":{
                  "fill-extrusion-color":[
                    "match",
                    [
                      "get",
                      "lithoklass"
                    ],
                    "Onbekend",
                    "#ffffff",
                    "Antropogeen",
                    "#c1c3c6",
                    "Veen",
                    "#985045",
                    "Klei",
                    "#189f48",
                    "Zandige klei",
                    "#b6d169",
                    "Fijn zand",
                    "#fff000",
                    "Matige grof zand",
                    "#ffdc00",
                    "Grof zand",
                    "#ffc800",
                    "Grind",
                    "#ffb400",
                    "#000000"
                  ],
                  "fill-extrusion-height":["number", ["+",["get","laagdikte"],["-",["get","diepte_ond"],["get","dieptetotaal"]]]],
                  "fill-extrusion-base":["number", ["-",["get","diepte_ond"],["get","dieptetotaal"]]],
                  "fill-extrusion-opacity":0.95
                },
                
              }
            },
            {
              "type": "vectortile",
              "title": "Merwedekanaal Rotliegend en Zechstein",
              "layerInfo": {
                "id": "mwrotliegendrects",
                "type": "fill-extrusion",
                "minzoom":13,
                "source": {
                  "type": "vector",
                  "tiles": [
                    "https://tiles.edugis.nl/data/public.merwede_rotliegend_zechstein_rects/mvt/{z}/{x}/{y}?geom_column=geom&columns=depth,thickness,name&include_nulls=0"
                  ],
                  "bounds": [
                    5.08784358436661,
                    52.0557495536792,
                    5.13233550768549,
                    52.0831686374319
                  ],
                  "maxzoom":18
                },
                "source-layer": "public.merwede_rotliegend_zechstein_rects",
                "paint": {
                  "fill-extrusion-color": ["match", ["get","name"], "rotliegend", "red", "zechstein", "white", "black"],
                  "fill-extrusion-height":["-", 2758.23, ["-",["get","depth"],["get","thickness"]]],
                  "fill-extrusion-base":["-", 2758.23, ["get","depth"]],
                  "fill-extrusion-opacity": 0.95
                }
              }
            },
            {
              "type": "vectortile",
              "title": "Stedin kabels",
              "layerInfo": {
                "id": "stedinkabels",
                "metadata": {
                  "attributes": {
                    "translations": [
                      {
                        "name": "ktype","translation": "kabeltype", "valuemap" : [
                          ["laag", "laagspanning"],
                          ["midden", "middenspanning"],
                          ["hoog", "hoogspanning"]
                        ]
                      }
                    ]
                  },
                },
                "type": "line",
                "minzoom": 12,
                "source": {
                  "type": "vector",
                  "maxzoom": 18,
                  "tiles": [
                    "https://tiles.edugis.nl/data/public.stedin_kabels/mvt/{z}/{x}/{y}?geom_column=geom&columns=ktype&include_nulls=0"
                  ],
                  "bounds": [
                    3.84642655585107,
                    51.6596158426275,
                    5.62588476605256,
                    52.2886886861338
                  ]
                },
                "source-layer": "public.stedin_kabels",
                "paint": {
                  "line-color": [
                    "match",
                    ["get","ktype"],
                    "laag","#4daf4a",
                    "midden","#377eb8",
                    "hoog","#e41a1c",
                    "#000000"
                  ],
                  "line-width": [
                    "match",
                    ["get", "ktype"],
                    "laag", 1,
                    "midden",2,
                    "hoog", 3,
                    1
                  ]
                }
              }
            },
            {
              "type": "vectortile",
              "title": "Stedin stations",
              "layerInfo": {
                "id": "stedinstations",
                "type": "circle",
                "minzoom": 12,
                "source": {
                  "type": "vector",
                  "maxzoom": 18,
                  "tiles": [
                    "https://tiles.edugis.nl/data/public.stedin_stations/mvt/{z}/{x}/{y}?geom_column=geom&columns=stype&include_nulls=0"
                  ],
                  "bounds": [
                    3.84642655585107,
                    51.6596158426275,
                    5.62588476605256,
                    52.2886886861338
                  ]
                },
                "source-layer": "public.stedin_stations",
                "paint": {
                  "circle-color": [
                    "match",
                    ["get","stype"],
                    "laag","#4daf4a",
                    "midden","#377eb8",
                    "hoog","#e41a1c",
                    "#000000"
                  ],
                  "circle-radius": [
                    "match",
                    ["get", "stype"],
                    "laag", 5,
                    "midden",5,
                    "hoog", 8,
                    1
                  ],
                  "circle-stroke-color": "white",
                  "circle-stroke-width": 1
                }
              }
            },
            {
              "type": "vectortile",
              "title": "Merwedekanaalzone Luchtkwaliteit",
              "layerInfo": {
                "id": "merwedeluchtkwaliteit",
                "type": "circle",
                "source": {
                  "type": "vector",
                  "tiles": [
                    "https://tiles.edugis.nl/data/public.exportgebied_1_result__mt2018_j2017_rpgw/mvt/{z}/{x}/{y}?geom_column=geom&columns=pm10_od,conc_no2,conc_pm10,conc_pm25,conc_ec,naam&include_nulls=0"
                  ],
                  "bounds": [
                    5.06965462540419,
                    52.0644080919209,
                    5.13481086896617,
                    52.0892443545224
                  ]
                },
                "source-layer": "public.exportgebied_1_result__mt2018_j2017_rpgw",
                "paint": {
                  "circle-radius": 5,
                  "circle-color": [
                    "case",
                    [
                      "<=",
                      [
                        "get",
                        "pm10_od"
                      ],
                      7.737
                    ],
                    "#fff7ec",
                    [
                      "<=",
                      [
                        "get",
                        "pm10_od"
                      ],
                      7.905
                    ],
                    "#fee8c8",
                    [
                      "<=",
                      [
                        "get",
                        "pm10_od"
                      ],
                      8.064
                    ],
                    "#fdd49e",
                    [
                      "<=",
                      [
                        "get",
                        "pm10_od"
                      ],
                      8.258
                    ],
                    "#fdbb84",
                    [
                      "<=",
                      [
                        "get",
                        "pm10_od"
                      ],
                      8.389
                    ],
                    "#fc8d59",
                    [
                      "<=",
                      [
                        "get",
                        "pm10_od"
                      ],
                      8.551
                    ],
                    "#ef6548",
                    [
                      "<=",
                      [
                        "get",
                        "pm10_od"
                      ],
                      8.761
                    ],
                    "#d7301f",
                    [
                      "<=",
                      [
                        "get",
                        "pm10_od"
                      ],
                      9.146
                    ],
                    "#b30000",
                    [
                      "<=",
                      [
                        "get",
                        "pm10_od"
                      ],
                      11.146
                    ],
                    "#7f0000",
                    "#7f0000"
                  ],
                  "circle-stroke-color": "white",
                  "circle-stroke-width": 1
                }
              }
            },
            {
              "type":"vectortile",
              "title":"BGT vector (stijl)",
              "layerInfo":{
                "id":"bgtvector",
                "type":"style",
                "source":"styles/bgt.json",
                "metadata":{
                  "reference":false
                }
              }
            },
            {
              "type":"vectortile",
              "title":"OSM rails vector (stijl)",
              "layerInfo":{
                "id":"osmrail",
                "type":"style",
                "source":"styles/osmrail.json"
              }
            },
            {
              "type":"vectortile",
              "title":"Mapbox Traffic (stijl)",
              "layerInfo":{
                "id":"mapboxtraffice",
                "type":"style",
                "source":"styles/mapboxtraffic.json"
              }
            },
            {
              "type":"vectortile",
              "title":"EduGIS nuts_m03_2006",
              "layerInfo":{
                "id":"EduGIS_nuts_m03_2006",
                "type":"line",
                "source":{
                  "id":"nuts_m03_2006",
                  "type":"vector",
                  "tiles":[
                    "https://tiles.edugis.nl/mvt/nuts_m03_2006/{z}/{x}/{y}.mvt"
                  ],
                  "minzoom":3,
                  "maxzoom":10
                },
                "source-layer":"nuts_m03_2006",
                "paint":{
                  "line-color":"#000000",
                  "line-width":1
                }
              }
            },
            {
              "type":"vectortile",
              "title":"EduGIS nuts_m03_2006 fill",
              "layerInfo":{
                "id":"EduGIS_nuts_m03_2006_fill",
                "type":"fill",
                "maxzoom":10,
                "minzoom":3,
                "source":{
                  "id":"nuts_m03_2006_fill",
                  "type":"vector",
                  "tiles":[
                    "https://tiles.edugis.nl/mvt/nuts_m03_2006/{z}/{x}/{y}.mvt"
                  ],
                  "minzoom":3,
                  "maxzoom":10
                },
                "source-layer":"nuts_m03_2006",
                "paint":{
                  "fill-color":[
                    "match",
                    [
                      "get",
                      "cntr_code"
                    ],
                    "NL",
                    "rgba(251,180,174, 0.8)",
                    "IS",
                    "rgba(251,180,174, 0.8)",
                    "CZ",
                    "rgba(251,180,174, 0.8)",
                    "DE",
                    "rgba(179,205,227, 0.8)",
                    "EE",
                    "rgba(179,205,227, 0.8)",
                    "RO",
                    "rgba(179,205,227, 0.8)",
                    "BE",
                    "rgba(204,235,197, 0.8)",
                    "MK",
                    "rgba(204,235,197, 0.8)",
                    "LT",
                    "rgba(204,235,197, 0.8)",
                    "SK",
                    "rgba(204,235,197, 0.8)",
                    "FR",
                    "rgba(222,203,228, 0.8)",
                    "FI",
                    "rgba(222,203,228, 0.8)",
                    "HU",
                    "rgba(222,203,228, 0.8)",
                    "LI",
                    "rgba(204,235,197, 0.8)",
                    "SI",
                    "rgba(204,235,197, 0.8)",
                    "ES",
                    "rgba(254,217,166, 0.8)",
                    "GR",
                    "rgba(254,217,166, 0.8)",
                    "PL",
                    "rgba(254,217,166, 0.8)",
                    "HR",
                    "rgba(254,217,166, 0.8)",
                    "PT",
                    "rgba(255,255,204, 0.8)",
                    "LU",
                    "rgba(255,255,204, 0.8)",
                    "AT",
                    "rgba(255,255,204, 0.8)",
                    "CY",
                    "rgba(251,180,174, 0.8)",
                    "IT",
                    "rgba(229,216,189, 0.8)",
                    "TR",
                    "rgba(229,216,189, 0.8)",
                    "LV",
                    "rgba(229,216,189, 0.8)",
                    "CH",
                    "rgba(253,218,236, 0.8)",
                    "BG",
                    "rgba(253,218,236, 0.8)",
                    "DK",
                    "rgba(255,255,204, 0.8)",
                    "SE",
                    "rgba(251,180,174, 0.8)",
                    "NO",
                    "rgba(179,205,227, 0.8)",
                    "UK",
                    "rgba(204,235,197, 0.8)",
                    "IE",
                    "rgba(222,203,228, 0.8)",
                    "rgba(0, 0, 0, 0)"
                  ],
                  "fill-outline-color":[
                    "match",
                    [
                      "get",
                      "cntr_code"
                    ],
                    "AT",
                    "#ccc",
                    "DK",
                    "#ccc",
                    "LU",
                    "#ccc",
                    "PT",
                    "#ccc",
                    "#ffffff"
                  ]
                }
              }
            },
            {
              "type":"vectortile",
              "title":"Martin Global Administrative areas",
              "layerInfo":{
                "id":"gadm36",
                "type":"fill",
                "source":{
                  "id":"gadm36",
                  "type":"vector",
                  "tiles":[
                    "https://saturnus.geodan.nl/martin/gadm36.alllevels/{z}/{x}/{y}.pbf"
                  ],
                  "minzoom":5,
                  "maxzoom":22
                },
                "source-layer":"gadm36.alllevels",
                "minzoom":5,
                "maxzoom":22,
                "layout":{
                  "visibility":"visible"
                },
                "paint":{
                  "fill-color":"#ccc",
                  "fill-outline-color":"#000"
                }
              }
            },
            {
              "type":"vectortile",
              "title":"MVT Server Global Administrative areas",
              "layerInfo":{
                "id":"mvtgadm36",
                "type":"fill",
                "source":{
                  "id":"mvtgadm36",
                  "type":"vector",
                  "tiles":[
                    "https://tiles.edugis.nl/mvt/gadmalllevels2/{z}/{x}/{y}.mvt"
                  ],
                  "minzoom":5,
                  "maxzoom":22
                },
                "source-layer":"gadmalllevels2",
                "minzoom":5,
                "maxzoom":22,
                "layout":{
                  "visibility":"visible"
                },
                "paint":{
                  "fill-color":"#ccc",
                  "fill-outline-color":"#000"
                }
              }
            }
          ]
        },
        {
          "type":"group",
          "title":"Hoogte rasters (DEM)",
          "sublayers":[
            {
              "type":"rasterdem",
              "title":"Mapbox hillshading",
              "layerInfo":{
                "id":"hillshading",
                "type":"hillshade",
                "source":{
                  "type":"raster-dem",
                  "tiles":[
                    "https://api.mapbox.com/raster/v1/mapbox.mapbox-terrain-dem-v1/{z}/{x}/{y}.webp?sku=1017KvSEvLWA1&access_token={mapboxkey}",
                  ],
                  "attribution": "© Mapbox"
                }
              }
            },
            {
              "type":"rasterdem",
              "title":"Nextzen hillshading",
              "layerInfo":{
                "id":"mapzenhillshading",
                "type":"hillshade",
                "source":{
                  "id":"mapzenhillshading",
                  "type":"raster-dem",
                  "tileSize":256,
                  "encoding":"terrarium",
                  "tiles":[
                    "https://t1.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png",
                    "https://t2.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png",
                    "https://t3.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png",
                    "https://t4.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png"
                  ],
                  "attribution":"NextZen"
                },
                "paint":{
                  "hillshade-exaggeration":0.275
                }
              }
            }
          ]
        },
        {
          "type":"group",
          "title":"Google spreadsheet",
          "sublayers":[
            {
              "type":"sheetlayer",
              "title":"Google spreadsheet layer",
              "layerInfo":{
                "id":"sheet gemeenten2017",
                "type":"sheetlayer",
                "source":{
                  "type":"geojson",
                  "data":"https://tiles.edugis.nl/geojson/cbsgebiedsindelingen_cbs_gemeente_2017_gegeneraliseerd1.json",
                  "attribution":"cbs/pdok"
                },
                "sheet":{
                  "description":"cbs gemeentedata 2017",
                  "key":"1SCzqMGqclDJAwY0YKDDzfmc35RpLJCi-w_0_SMAJHI0",
                  "georeference":"relation",
                  "sheetcolumn":"A",
                  "datacolumn":"statnaam"
                }
              }
            }
          ]
        },
        {
          "type":"group",
          "title":"CSV",
          "sublayers":[
            {
              "type":"csvlayer",
              "title":"CSV Layer",
              "layerInfo":{
   
              }
            }
          ]
        },
        {
          "type":"group",
          "title":"Web-GL layers",
          "sublayers":[
            {
              "title":"NDW Traffic",
              "layerInfo":{
                "id":"webgltraffic",
                "type":"webgltraffic",
                "source":{
                  "type":"webgltraffic",
                  "data":"https://research1.geodan.nl/sites/ndw_viewer/traffic.json",
                  "attribution":"ndw"
                }
              }
            }
          ]
        }
      ]
    },
    {
      "type":"group",
      "title":"Achtergrondlagen",
      "sublayers":[
        {
          "type":"reference",
          "title":"Klokantech Basic (stijl)",
          "layerInfo":{
            "id":"klokantechbasic",
            "type":"style",
            "source":"styles/openmaptiles/klokantech-basic.json",
            "metadata":{
              "reference":true
            }
          }
        },
        {
          "type":"reference",
          "title":"OSM Bright (stijl)",
          "checked":true,
          "layerInfo":{
            "id":"OsmBright",
            "type":"style",
            "source":"styles/openmaptiles/osmbright.json",
            "metadata":{
              "reference":true
            }
          }
        },
        {
          "type":"reference",
          "title":"Positron (stijl)",
          "layerInfo":{
            "id":"Positron",
            "type":"style",
            "source":"styles/openmaptiles/positron.json",
            "metadata":{
              "reference":true
            }
          }
        },
        {
          "type":"reference",
          "title":"Dark Matter (stijl)",
          "layerInfo":{
            "id":"DarkMatter",
            "type":"style",
            "source":"styles/openmaptiles/dark-matter.json",
            "metadata":{
              "reference":true
            }
          }
        },
        {
          "type":"reference",
          "title":"Openstreetmap (stijl)",
          "layerInfo":{
            "id":"OsmRaster",
            "type":"style",
            "source":"styles/osmraster.json",
            "metadata":{
              "reference":true
            }
          }
        },
        {
          "type":"reference",
          "title":"Alleen grenzen",
          "layerInfo":{
            "id":"Boundaries",
            "type":"style",
            "source":{
              "version":8,
              "name":"Grenzen",
              "sources":{
                "openmaptileboundaries":{
                  "type":"vector",
                  "url":"https://saturnus.geodan.nl/openmaptiles/data/v3.json?key={key}"
                }
              },
              "layers":[
                {
                  "id":"boundary_state",
                  "type":"line",
                  "metadata":{
                    "mapbox:group":"a14c9607bc7954ba1df7205bf660433f"
                  },
                  "source":"openmaptileboundaries",
                  "source-layer":"boundary",
                  "filter":[
                    "==",
                    "admin_level",
                    2
                  ],
                  "layout":{
                    "line-cap":"round",
                    "line-join":"round",
                    "visibility":"visible"
                  },
                  "paint":{
                    "line-color":"rgb(230, 204, 207)",
                    "line-width":{
                      "base":1.1,
                      "stops":[
                        [
                          3,
                          1
                        ],
                        [
                          22,
                          20
                        ]
                      ]
                    },
                    "line-blur":{
                      "base":1,
                      "stops":[
                        [
                          0,
                          0.4
                        ],
                        [
                          22,
                          4
                        ]
                      ]
                    },
                    "line-opacity":1
                  }
                }
              ]
            }
          }
        },
        {
          "type":"reference",
          "title":"Streets (Geodan Maps)",
          "id":"gmstreets",
          "layerInfo":{
            "id":"gmstreets",
            "metadata":{
              "reference":true
            },
            "type":"raster",
            "source":{
              "type":"raster",
              "tileSize":256,
              "tiles":[
                "https://services.geodan.nl/data/geodan/gws/world/streets/wmts/streets/EPSG%3A3857/{z}/{x}/{y}.png?servicekey={geodanmapskey}"
              ],
              "attribution":"&copy; <a href=\"https://www.geodan.nl\" target=\"_BLANK\">Geodan</a> | <a href=\"https://carto.com\" target=\"_BLANK\">&copy; CARTO</a> | <a href=\"https://opendatacommons.org/licenses/odbl/1.0/\" target=\"_BLANK\">&copy; OpenStreetMap contributors</a>",
              "maxzoom":19
            }
          }
        },
        {
          "type":"reference",
          "title":"ESRI World Map topo",
          "layerInfo":{
            "id":"worldmaptopo",
            "metadata":{
              "reference":true
            },
            "type":"raster",
            "source":{
              "type":"raster",
              "tileSize":256,
              "tiles":[
                "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              ],
              "attribution":"&copy; ESRI",
              "maxzoom":18
            }
          }
        },
        {
          "type":"reference",
          "title":"ESRI Natural World Map",
          "layerInfo":{
            "id":"natgeoworldmap",
            "metadata":{
              "reference":true
            },
            "type":"raster",
            "source":{
              "type":"raster",
              "tileSize":256,
              "tiles":[
                "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"
              ],
              "attribution":"&copy; ESRI",
              "maxzoom":11
            }
          }
        },
        {
          "type":"reference",
          "title":"Stamen Toner",
          "layerInfo":{
            "id":"stamentoner",
            "metadata":{
              "reference":true
            },
            "type":"raster",
            "source":{
              "type":"raster",
              "tileSize":256,
              "scheme": "tms",
              "tiles":[
                "https://tiles.edugis.nl/mapproxy/stamen/tiles/stamentoner_EPSG900913/{z}/{x}/{y}.png"
              ],
              "attribution":"&copy; <a href=\"https://www.stamen.com\" target=\"attribution\">Stamen Design</a>,<a href=\"https://www.openstreetmap.org/about\" target=\"attribution\">OpenStreetMap contributors</a>",
              "maxzoom":17
            }
          }
        },
        {
          "type":"reference",
          "title":"Stamen Watercolor",
          "layerInfo":{
            "id":"stamenwatercolor",
            "metadata":{
              "reference":true
            },
            "type":"raster",
            "source":{
              "type":"raster",
              "tileSize":256,
              "scheme": "tms",
              "tiles":[
                "https://tiles.edugis.nl/mapproxy/stamen/tiles/stamenwatercolor_EPSG900913/{z}/{x}/{y}.jpg"
              ],
              "attribution":"&copy; <a href=\"https://www.stamen.com\" target=\"attribution\">Stamen Design</a>,<a href=\"https://www.openstreetmap.org/about\" target=\"attribution\">OpenStreetMap contributors</a>",
              "maxzoom":17
            }
          }
        },
        {
          "type":"reference",
          "title":"Stamen Terrain",
          "layerInfo":{
            "id":"stamenterrain",
            "metadata":{
              "reference":true
            },
            "type":"raster",
            "source":{
              "type":"raster",
              "tileSize":256,
              "scheme": "tms",
              "tiles":[
                "https://tiles.edugis.nl/mapproxy/stamen/tiles/stamenterrain_EPSG900913/{z}/{x}/{y}.jpg"
              ],
              "attribution":"&copy; <a href=\"https://www.stamen.com\" target=\"attribution\">Stamen Design</a>,<a href=\"https://www.openstreetmap.org/about\" target=\"attribution\">OpenStreetMap contributors</a>",
              "maxzoom":16
            }
          }
        },
        {
          "type":"reference",
          "title":"Microsoft BING Kaart",
          "layerInfo":{
            "id":"bingmaproad",
            "metadata":{
              "reference":true,
              "bing":true
            },
            "type":"raster",
            "source":{
              "url":"https://dev.virtualearth.net/REST/V1/Imagery/Metadata/Road?output=json&include=ImageryProviders&uriScheme=https&key={bingkey}",
              "maxzoom":19
            }
          }
        },
        {
          "type":"reference",
          "title":"Microsoft BING Hybride",
          "layerInfo":{
            "id":"bingmaphybrid",
            "metadata":{
              "reference":true,
              "bing":true
            },
            "type":"raster",
            "source":{
              "url":"https://dev.virtualearth.net/REST/V1/Imagery/Metadata/AerialWithLabels?output=json&include=ImageryProviders&uriScheme=https&key={bingkey}",
              "maxzoom":18
            }
          }
        },
        {
          "type":"reference",
          "title":"Microsoft BING Luchtfoto",
          "layerInfo":{
            "id":"bingmapaerial",
            "metadata":{
              "reference":true,
              "bing":true
            },
            "type":"raster",
            "source":{
              "url":"https://dev.virtualearth.net/REST/V1/Imagery/Metadata/Aerial?output=json&include=ImageryProviders&uriScheme=https&key={bingkey}",
              "maxzoom":18
            }
          }
        }
      ]
    }
  ]