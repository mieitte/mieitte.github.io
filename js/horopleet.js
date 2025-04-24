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

addGeoJson('geojson/tartu_city_districts_edu.geojson')

// add geoJSON layer
async function addGeoJson(url) {
  const response = await fetch(url)
  const data = await response.json()
  L.choropleth(data, {
    valueProperty: 'TOWERS',
    scale: ['#ffffff', '#ff9900'],
    steps: 5,
    mode: 'e', // q for quantile, e for equidistant, k for k-means
    style: {
      color: '#fff',
      weight: 2,
      fillOpacity: 0.8,
    },
    onEachFeature: function (feature, layer) {
      layer.bindPopup('Name: ' + feature.properties.NIMI + '<br>Value: ' + feature.properties.TOWERS)
    },
  }).addTo(map)
}

addDistrictsGeoJson('geojson/tartu_city_districts_edu.geojson')

// add geoJSON polygons layer*
async function addDistrictsGeoJson(url) {
  const response = await fetch(url)
  const data = await response.json()
  const polygons = L.geoJson(data, {
    onEachFeature: popUPinfo,
  })
  polygons.addTo(map)
}




