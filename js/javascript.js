let map = L.map('map').setView([58.373523, 26.716045], 12)

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'OpenStreetMap contributors',
  })
  
  osm.addTo(map)

// default map settings
function defaultMapSettings() {
  map.setView([58.373523, 26.716045], 12)
}

// add popup to each feature
function popUPinfo(feature, layer) {
  layer.bindPopup(feature.properties.NIMI)
}

function getColor(property) {
  if (property == 7 || (property > 12 && property < 17) || property == 30) {
      return "#e6e6ff";
  } else {
      return "#0000ff";
  }
}

// polygon style
function polygonStyle(feature) {
  return {
    fillColor: getColor(feature.properties.OBJECTID),
    fillOpacity: 0.6,
    weight: 1,
    opacity: 1,
    color: 'grey',
  }
}

// add geoJSON polygons layer*
async function addDistrictsGeoJson(url) {
  const response = await fetch(url)
  const data = await response.json()
  const polygons = L.geoJson(data, {
    onEachFeature: popUPinfo,
    style: polygonStyle,
  })
  polygons.addTo(map)
}
addDistrictsGeoJson('geojson/tartu_city_districts_edu.geojson')

// add geoJSON points layer*
async function addCelltowersGeoJson(url) {
  const response = await fetch(url)
  const data = await response.json()
  const markers = L.geoJson(data)
  markers.addTo(map)
}
addCelltowersGeoJson('geojson/tartu_city_celltowers_edu.geojson')

function createCircle(feature, latlng) {
  let options = {
    radius: 5,
    fillColor: 'red',
    fillOpacity: 0.5,
    color: 'red',
    weight: 1,
    opacity: 1,
  }
  return L.circleMarker(latlng, options)
}

async function addCelltowersGeoJson(url) {
  const response = await fetch(url)
  const data = await response.json()
  const circles = L.geoJson(data, {
    pointToLayer: createCircle,
  })
  circles.addTo(map)
}

// add geoJSON layer
async function addCelltowersGeoJson(url) {
  const response = await fetch(url)
  const data = await response.json()
  const markers = L.geoJson(data)
  const clusters = L.markerClusterGroup()
  clusters.addLayer(markers)
  clusters.addTo(map)
}

