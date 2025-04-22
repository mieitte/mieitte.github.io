let map = L.map('map').setView([58.373523, 26.716045], 12)

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'OpenStreetMap contributors',
  })
  
  osm.addTo(map)

// add geoJSON polygons layer*
async function addDistrictsGeoJson(url) {
    const response = await fetch(url)
    const data = await response.json()
    const polygons = L.geoJson(data)
    polygons.addTo(map)
  }
  addDistrictsGeoJson('geojson/tartu_city_districts_edu.geojson')