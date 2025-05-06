/* import * as turfPractice from "./turfPractice.js"

turfPractice.turfFunctions() // to use the function */

let map = L.map('map', {
    center: [58.383523, 26.716045],
    zoom: 12,
    zoomControl: true // Disable default zoom control
  });

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