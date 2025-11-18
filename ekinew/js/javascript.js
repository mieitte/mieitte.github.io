let map = L.map('map').setView([58.588443, 25.787725], 6)

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: 'OpenStreetMap contributors',
})
osm.addTo(map)

//Maa-ameti orto.
const maaametOrto = L.tileLayer(
  'https://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC/{z}/{x}/{y}.png',
  {
    tms: true,
    maxZoom: 19,
    attribution: '&copy; <a href="https://geoportaal.maaamet.ee">Maa- ja ruumiamet 2025</a>',
  }
);

maaametOrto.addTo(map);

// default map settings
/*function defaultMapSettings() {
  map.setView([58.588443, 25.787725], 7)
} */

  //Tagastame algse seisu.
function clearMapState() {
  // Reset current selected name
  currentSelectedName = '';

  // Reset polygon colors to their default style
  /*polygons.eachLayer(layer => {
    layer.setStyle({
      fillColor: '#D3D8E0',
      fillOpacity: 0.9,
      color: 'black',
      weight: 0.5
    });
  }); */
  polygons.eachLayer(layer => {
    const khk = layer.feature.properties.KHK.trim();  // kui on peidetud tühikuid

    // Base style
    const baseStyle = {
      fillColor: '#D3D8E0',
      fillOpacity: 0.9,
      color: 'black',
      weight: 1.0
    };

    // KHK length 1 → special opacity
    if (khk.length === 1) {
      layer.setStyle({
        ...baseStyle,
        fillOpacity: 0.7,
        weight: 0.5
      });
    } else {
      layer.setStyle(baseStyle);
    }
  });

  // Close info box
  document.getElementById('info-box').style.display = 'none';

  // Reset popup text to default
  polygons.eachLayer(layer => {
    const khkName = layer.feature.properties.NIMI;
    layer.bindPopup(`<b>Kihelkond:</b> ${khkName}`);
  });

  //Zuumiastme taastamine.
  map.setView([58.588443, 25.787725], 6);
}


// --- Name to Kihelkond (KHK) mapping
/* let nameToKhk = {} See algse töötava asjaga ka. */
let currentSelectedName = '' // stores the currently selected name
let polygons // will hold the GeoJSON layer

//Uus lookup.
const nameToKhk = {}
const nameToKbm = {}
const nameToGeneralKbm = {}

async function loadNameKhkLookup() {
  const response = await fetch('data/EPNRi_leviandmed_A-täht.xml')
  const xmlText = await response.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlText, 'application/xml')

  const ngEntries = xml.querySelectorAll('NG')

  ngEntries.forEach(entry => {
    const nameNode = entry.querySelector('nimi')
    if (!nameNode) return

    const name = nameNode.textContent.trim()

    // Add all khk values under this <NG>
    const khkNodes = entry.querySelectorAll('khk')
    const khkList = Array.from(khkNodes).map(node => node.textContent.trim())
    if (khkList.length) {
      nameToKhk[name] = [...new Set(khkList)]
    }

    // For all <kbmg> blocks, check if they contain any <khk>
    const kbmgEntries = entry.querySelectorAll('kbmg')
    const allKbm = new Set()
    const generalKbm = new Set()

    kbmgEntries.forEach(kbmg => {
      const kbmCode = kbmg.querySelector('kbm')?.textContent.trim()
      if (!kbmCode) return
      allKbm.add(kbmCode)

      const khkInside = kbmg.querySelector('khk')
      if (!khkInside) {
        generalKbm.add(kbmCode) // No khk = general region
      }
    })

    if (allKbm.size) {
      nameToKbm[name] = [...allKbm]
    }

    if (generalKbm.size) {
      nameToGeneralKbm[name] = [...generalKbm]
    }
  })

  console.log('KHKs:', nameToKhk)
  console.log('All KBMs:', nameToKbm)
  console.log('General KBMs:', nameToGeneralKbm)
}
//Uue lookupi lõpp.

// --- Highlight matching areas
function highlightAreas(khkList) {
  polygons.eachLayer(layer => {
    const areaCode = layer.feature.properties.KHK
    if (khkList.includes(areaCode)) {
      layer.setStyle({
        fillColor: 'rgb(65,37,208)',
        fillOpacity: 0.9,
        color: 'rgb(97,112,125)',
        weight: 1
      })
    } else {
      layer.setStyle({
        fillColor: 'rgb(211,216,224)',
        fillOpacity: 1.0,
        color: 'rgb(97,112,125)',
        weight: 1
      })
    }
  })
}

// --- Update popups based on current selected name
function updatePopups() {
  polygons.eachLayer(layer => {
    const khkCode = layer.feature.properties.KHK
    const khkName = layer.feature.properties.NIMI

    let popupText = `<div class="popup-text"><b>Kihelkond:</b> ${khkName}</div>` //Vb eemaldada rasvane kiri.

    if (
      currentSelectedName &&
      nameToKhk[currentSelectedName] &&
      nameToKhk[currentSelectedName].includes(khkCode)
    ) {
      popupText += `<br><div class="popup-text"><b>Nimi:</b> ${currentSelectedName}</div>`
    }

    layer.bindPopup(popupText)
  })
}

//showmapforname, mis arvestab VAN ja EES.
function showMapForName(name) {
  const khkList = nameToKhk[name] || []
  const generalKbmCodes = nameToGeneralKbm[name] || []

  const infoBox = document.getElementById('info-box')
  const infoMessage = document.getElementById('info-message')

  // --- Highlight KHK areas on map if available
  if (khkList.length > 0) {
    currentSelectedName = name
    highlightAreas(khkList)
    updatePopups()
  }

  // --- Define only valid KBM codes for regional summary
  const codeToRegion = {
    L: 'Liivimaa',
    E: 'Eestimaa',
    P: 'Petserimaa',
    N: 'Narvatagune'
  }

  // --- Filter general KBM codes to only those we recognize (ignore VAN, EES)
  const validKbmCodes = generalKbmCodes.filter(code => codeToRegion[code])

  let message = ''

  if (validKbmCodes.length > 0) {
    const regions = validKbmCodes.map(code => codeToRegion[code]).filter(Boolean)
    let regionText = ''

    if (regions.length === 1) {
      regionText = `Nime "${name}" esinemisalaks on (ka) ${regions[0]}.<br>` //(ka) lisatud nt nime Aeg jaoks (Käina+Petserimaa)
    } else if (regions.length > 1) {
      const last = regions.pop()
      regionText = `Nime "${name}" esinemisaladeks on (ka) ${regions.join(', ')} ja ${last}.<br>`
    }

    message =
      `Nime "${name}" puhul ei saa näidata kihelkonna taset kõigis piirkondades, sest hingeloendi andmed ja tegelik elukoht ei vasta üksteisele.<br>` +
      (regionText ? `<br>${regionText}` : '')
  }

  // --- Extra info for VAN / EES
  /*if (generalKbmCodes.includes('VAN')) {
    message += (message ? '<br>' : '') + 'Nimi esines juba enne perekonnanimede panekut.'
  }
  if (generalKbmCodes.includes('EES')) {
    message += (message ? '<br>' : '') + 'Nimi on eestistamise ajalt.'
  } */

  // --- Extra info for VAN / EES
  if (generalKbmCodes.includes('VAN') && generalKbmCodes.includes('EES')) {
    message += (message ? '<br>' : '') + `Nime "${name}" kohta ei teata täpset ajastut.`
  } else if (generalKbmCodes.includes('VAN')) {
    message += (message ? '<br>' : '') + `Nimi "${name}" esineb enne üldist nimepanekut, enamasti on teada esinemine aastal 1816. Tegu oli mittetalupoegadega.`
  } else if (generalKbmCodes.includes('EES')) {
    message += (message ? '<br>' : '') + `"${name}" on eestistamisel (enamasti 1935–1940, harvem 1920–1944) võetud nimi.`
  }
  

  if (message) {
    infoMessage.innerHTML = message
    infoBox.style.display = 'block'
  } else {
    infoBox.style.display = 'none'
  }
}


document.getElementById('info-close').addEventListener('click', () => {
  document.getElementById('info-box').style.display = 'none'
})

// --- Initial setup
async function init() {
  await loadNameKhkLookup()

map.createPane('polygonsPane');
map.getPane('polygonsPane').style.zIndex = 200;   // lowest

map.createPane('boundariesPane');
map.getPane('boundariesPane').style.zIndex = 400; // above polygons

map.createPane('kubermangPane');
map.getPane('kubermangPane').style.zIndex = 450;  // above boundaries

  //Kihelkondade kiht
  const geoJson = await fetch('geojson/khk_knab_4326.geojson').then(r => r.json())
  polygons = L.geoJson(geoJson, {
    pane: 'polygonsPane',
    onEachFeature: (feature, layer) => {
      const khkCode = feature.properties.KHK
      const khkName = feature.properties.NIMI
      //const popupText = `<b>Kihelkond:</b> ${khkName} (${khkCode})`
      const popupText = `<b>Kihelkond:</b> ${khkName}` //Ilma koodita.
      layer.bindPopup(popupText)
    },

  style: function (feature) {
  const khk = feature.properties.KHK

  const baseStyle = {
    fillColor: '#D3D8E0',
    fillOpacity: 0.9,
    color: 'black',
    weight: 1.0
  }

  // If KHK code length is 1 → different opacity
  if (khk.length === 1) {
    return {
      ...baseStyle,
      //dashArray: '4 10',   // dotted outline
      //fillColor: '#D7E5F2',
      fillOpacity: 0.7,
      weight: 0.5
    }
  }

  // All others → standard style
  return baseStyle
}
    
  }).addTo(map)

  //Turf-katsed:
  /*geoJson.features.forEach(feature => {
  const centroid = turf.centroid(feature) //Or pointOnFeature
  const coords = centroid.geometry.coordinates
  const khkName = feature.properties.NIMI.replace(/([-–])/, '$1<br>')

  const label = L.divIcon({
    className: 'parish-label',
    html: khkName,
    iconSize: null // Size is controlled via CSS
  })

  L.marker([coords[1], coords[0]], { icon: label, interactive: false }).addTo(map)
  })*/ //Turfi lõpp.

  //Turf-katse 2.
  /*geoJson.features.forEach(feature => {
    // Always choose a good visible point inside the polygon
    const center = turf.pointOnFeature(feature)
    const coords = center.geometry.coordinates
    const khkName = feature.properties.KHK //.replace(/([-–])/, '$1<br>') kui panna nimi.

    const label = L.divIcon({
      className: 'parish-label',
      html: khkName,
      iconSize: null
  })

    L.marker([coords[1], coords[0]], { icon: label, interactive: false }).addTo(map)
}) */

  //Maakonnapiiride kiht
  const boundariesJson = await fetch('geojson/maakonnad_lines_4326.geojson').then(r => r.json())
  boundaries = L.geoJson(boundariesJson, {
    pane: 'boundariesPane',
    style: {
      color: 'black',   
      weight: 1.5,        
      fill: false        
    }
  }).addTo(map)

  //Kubermangu piir
  const kubermangJson = await fetch('geojson/kubermang_lines_4326.geojson').then(r => r.json())
  kubermang = L.geoJson(kubermangJson, {
    pane: 'kubermangPane',
    style: {
      color: '#4125d0',   
      weight: 2.0,        
      fill: false        
    }
  }).addTo(map)

  const layerControlOptions = {
      collapsed: false,
      position: 'topleft'
    }

  const layerControl = L.control.layers(null, {
    "Kubermangude piirid": kubermang,
    "Maakondade piirid": boundaries,
    "Kihelkonnad": polygons
  }, layerControlOptions).addTo(map)
}

init()
