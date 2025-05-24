import * as turfPractice from "./turfPractice.js"

import * as layers from "./layers.js"

export { defaultMapSettings }

let map = L.map('map', {
    /* center: [58.383523, 26.716045], */
    center: [58.374, 26.715],
    zoom: 18, /*Algne oli 12. */
    zoomControl: true // Disable default zoom control
  });

turfPractice.turfFunctions(map) // to use the function

map.zoomControl.setPosition('topright');

map.createPane('customDistrictsPane')
map.getPane('customDistrictsPane').style.zIndex = 390

const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'OpenStreetMap contributors'
  });

// Default map settings
function defaultMapSettings() {
    map.setView([58.383523, 26.716045], 12)
  }

osmLayer.addTo(map)

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Esri, Maxar, Earthstar Geographics, and the GIS community',
    maxZoom: 19
  })
  
const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
  })

let districtsLayer
let choroplethLayer
let heatMapLayer
let markersLayer

// Districts GeoJSON with styling
async function loadDistrictsLayer() {
    try {
      const response = await fetch('geojson/tartu_city_districts_edu.geojson')
      const data = await response.json()
      console.log(data)
      districtsLayer = L.geoJson(data, {
        style: function(feature) {
          return {
            fillColor: getDistrictColor(feature.properties.OBJECTID),
            fillOpacity: 0.5,
            weight: 1,
            opacity: 1,
            color: 'grey'
          }
        },
        onEachFeature: function(feature, layer) {
          layer.bindPopup(feature.properties.NIMI || 'District ' + feature.properties.OBJECTID)
        },
        pane: 'customDistrictsPane'
      })
    } catch (error) {
      console.error("Error loading districts data:", error)
    }
  }
  
  // function to color the layer 
  function getDistrictColor(id) {
    switch (id) {
      case 1: return '#ff0000'
      case 13: return '#009933'
      case 6: return '#0000ff'
      case 7: return '#ff0066'
      default: return '#ffffff'
    }
  }

// Choropleth layer
async function loadChoroplethLayer() {
    try {
      const response = await fetch('geojson/tartu_city_districts_edu.geojson')
      const data = await response.json()
      
      choroplethLayer = L.choropleth(data, {
        valueProperty: 'OBJECTID',
        scale: ['#e6ffe6', '#004d00'],
        steps: 11,
        mode: 'q',
        style: {
          color: '#fff',
          weight: 2,
          fillOpacity: 0.8,
        },
        onEachFeature: function(feature, layer) {
          layer.bindPopup('Value: ' + feature.properties.OBJECTID)
        },
        pane: 'customDistrictsPane'
      })
    } catch (error) {
      console.error("Error loading choropleth data:", error)
    }
  }

// Heat Map Layer
async function loadHeatMapLayer() {
    try {
      const response = await fetch('geojson/tartu_city_celltowers_edu.geojson')
      const data = await response.json()
      
      const heatData = data.features.map(function(feature) {
        return [
          feature.geometry.coordinates[1],
          feature.geometry.coordinates[0],
          feature.properties.area || 1
        ]
      })
      
      heatMapLayer = L.heatLayer(heatData, {
        radius: 20,
        blur: 15,
        maxZoom: 17,
        pane: 'shadowPane',
      })
  
    } catch (error) {
      console.error("Error loading heatmap data:", error)
    }
  }

// Cell Towers - Markers with Clusters
async function loadMarkersLayer() {
    try {
      const response = await fetch('geojson/tartu_city_celltowers_edu.geojson')
      const data = await response.json()
      
      const geoJsonLayer = L.geoJson(data, {
        pointToLayer: function(feature, latlng) {
          return L.circleMarker(latlng, {
            radius: 5,
            fillColor: 'red',
            fillOpacity: 0.5,
            color: 'red',
            weight: 1,
            opacity: 1
          })
        },
        onEachFeature: function(feature, layer) {
          if (feature.properties) {
            layer.bindPopup('Cell Tower<br>Area: ' + (feature.properties.area || 'Unknown'))
          }
        }
      })
      
      markersLayer = L.markerClusterGroup()
      markersLayer.addLayer(geoJsonLayer)
    } catch (error) {
      console.error("Error loading markers data:", error)
    }
  }

const baseLayers = {
    "OpenStreetMap": osmLayer,
    "Satellite": satelliteLayer,
    "Topographic": topoLayer
  }

let activeWmsLayers = {}

function loadWmsLayers(layersList, overlayLayers, activeWmsLayers) {
  console.log(layersList)
    layersList.forEach(layer => {
      let paneName = `${layer.layers}-pane`
      map.createPane(paneName)
      map.getPane(paneName).style.zIndex = layer.zIndex
      let newLayer = L.tileLayer.wms(layer.url, {
        version: layer.version,
        layers: layer.layers,
        format: layer.format,
        transparent: layer.transparent,
        zIndex: layer.zIndex,
        pane: paneName,
      })
    
      // add each layer to overlayLayers object to display them in layers list menu
      overlayLayers[layer.title.en] = newLayer
      // add each layer to an object of WMS layers
      activeWmsLayers[layer.layers] = false
    })
  }

async function initializeLayers() {

    await Promise.all([  /*await saab kasutada ainult async-funktsioonis! */
        loadDistrictsLayer(),
        loadChoroplethLayer(),
        loadHeatMapLayer(),
        loadMarkersLayer()
      ])

    //const overlayLayers = {}

     const overlayLayers = {"Tartu districts": districtsLayer,
        "Choropleth layer": choroplethLayer,
        "Heatmap": heatMapLayer,
        "Markers": markersLayer}  /*See koht kaotab kihivalikunupu täitsa ära. */

    // insert function call here
  /*console.log("testime layersit", layers.wmsLayers) */
    loadWmsLayers(layers.wmsLayers, overlayLayers, activeWmsLayers)
    console.log(activeWmsLayers)
    
    const layerControlOptions = {
      collapsed: false,
      position: 'topleft'
    }
    
    const layerControl = L.control.layers(baseLayers, overlayLayers, layerControlOptions)
    
    layerControl.addTo(map)
    
    osmLayer.addTo(map)

    //districtsLayer.addTo(map)

    /* heatMapLayer.addTo(map) 

    console.log(map) */
  }
  
  // then call the function to execute it
  initializeLayers()

map.on('overlayadd', (event) => {
  // console.log(event)
  const layerID = event.layer.options.layers
  toggleActiveState(layerID, true)
  console.log(activeWmsLayers)
  // console.log('overlayadd event fired')
})

map.on('overlayremove', (event) => {
  //console.log(event)
  const layerID = event.layer.options.layers
  toggleActiveState(layerID, false)
  console.log(activeWmsLayers)
  // console.log('overlayadd event fired')
})

function toggleActiveState(layerId, boolean) {
  // check if layer name's value is of type boolean, then we know this layer is present in the list
  if (typeof(activeWmsLayers[layerId]) == "boolean") {
    activeWmsLayers[layerId] = boolean // update the value to new one
  }
}

map.on('click', function(event) {
  Object.entries(activeWmsLayers).forEach(([key, value]) => {
    if (value == true) {
      console.log(`We should now build a query for ${key}`)
      const fullUrl = buildRequestUrl(event, "https://landscape-geoinformatics.ut.ee/geoserver/pa2023/wms?", key)
      const response = fetchWmsData(fullUrl, key)
      // reset info window text on each click
      document.getElementById('info-box').style.display='block'
    const infoWindowContent = document.getElementById('info-content')
    infoWindowContent.innerHTML = ""
    document.getElementById('info-close').addEventListener('click', () => {
    // your event code goes here
    document.getElementById('info-box').style.display='none'
})
      console.log(response)
    }
  })
})

function buildRequestUrl(e, baseUrl, layerName) {
  // build a bounding box for the current map view
  const bounds = map.getBounds()
  const bbox = [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth()
  ].join(',')

  // get size values from map object
  const size = map.getSize()
  const sizeX = size.x
  const sizeY = size.y

  // get x and y points and round them to avoid strange errors
  const xPoint = Math.floor(e.containerPoint.x)
  const yPoint = Math.floor(e.containerPoint.y)

  // WMS endpoint and request parameters
  const wmsUrl = baseUrl
  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.1.1',
    request: 'GetFeatureInfo',
    query_layers: layerName,
    layers: layerName,
    info_format: 'application/json',
    x: xPoint,
    y: yPoint,
    srs: 'EPSG:4326',
    width: sizeX,
    height: sizeY,
    bbox: `${bbox}`
  })

  return wmsUrl + params
}

/* function fetchWmsData(fullUrl, layerName) {
  fetch(fullUrl)
  .then(response => response.json())
  .then(data => {
    console.log('fetched data')
    console.log(data)
  })
  .catch(error => {
    console.error('Request failed:', error)
  })
} Algne töötav asi! */

function fetchWmsData(fullUrl, layerName) {
  fetch(fullUrl)
    .then(response => response.json())
    .then(data => {
      const content = document.getElementById('info-content');

      const EN_title = getLayerName(layers.wmsLayers, layerName);

      // condition that runs the code only if there is at least one feature in the results
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const props = feature.properties;

        let html = `<h4>${EN_title}</h4><ul>`;
        for (const key in props) {
          html += `<li><strong>${key}:</strong> ${props[key]}</li>`;
        }
        html += '</ul>';
        content.innerHTML += html;
      } else {
        content.innerHTML += `<em>No features found for ${EN_title}</em><br>`;
      }

      // optional debugging
      // console.log('fetched data', data);
    })
    .catch(error => {
      console.error('Request failed:', error);
    });
}

function getLayerName(layersData, layerName) {
  const match = layersData.filter(entry => entry.layers === layerName);
  if (match.length > 0) {
    return match[0].title.en;
  } else {
    return "Layer not found";
  }
}

/* map.on('click', function(event) {
    console.log(`[${event.latlng.lng}, ${event.latlng.lat}]`)
    // define coordinates of the point
    let pointCoords = [event.latlng.lng, event.latlng.lat]
    // create a turf point
    let turfPoint = turf.point(pointCoords)
    // convert the point to GeoJSON format and add it to the map
    L.geoJSON(turfPoint).addTo(map)
}) */