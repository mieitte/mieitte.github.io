/*let map = L.map('map').setView([58.588443, 25.787725], 8) */ //Sellega saab zuumida.
let map = L.map('map', { center: [58.588443, 25.787725], zoom: 8, zoomControl: false }); //Sellega mitte.

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

  //Tagastame algse seisu.
function clearMapState() {
  // Reset current selected name
  currentSelectedName = '';

  //Reset pealkiri.
  document.getElementById('main-heading').innerHTML =
    'Perekonnanime levik kihelkonniti';

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

    // KHK length 1 → madalam läbipaistvus
    if (khk.length === 1) {
      layer.setStyle({
        ...baseStyle,
        fillOpacity: 0.5,
        weight: 0.5
      });
    } else {
      layer.setStyle(baseStyle);
    }
  });

  // Sule info box
  document.getElementById('info-box').style.display = 'none';

  // Reset popup text to default
  polygons.eachLayer(layer => {
    const khkName = layer.feature.properties.NIMI;
    layer.bindPopup(`<b>Kihelkond:</b> ${khkName}`);
  });

  //Zuumiastme taastamine.
  map.setView([58.588443, 25.787725], 8);

  //if (!map.hasLayer(polygons)) map.addLayer(polygons); See rida määrab ära, kas kihelkondasid näidatakse rippmenüüs v mitte kui vajutada Taasta algseis.
  if (!map.hasLayer(boundaries)) map.addLayer(boundaries);
  if (!map.hasLayer(kubermang)) map.addLayer(kubermang);
}


// Name to Kihelkond (KHK) mapping
/* let nameToKhk = {} See algse töötava asjaga ka. */
let currentSelectedName = '' // stores the currently selected name
let polygons // will hold the GeoJSON layer

//Vana lookup.
/*const nameToKhk = {}
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
} */
//Vana lookupi lõpp.

//Uus lookup.
const nameToKhk = {};
const nameToKbm = {};
const nameToGeneralKbm = {};
const nameToKbmDetail = {};   // <-- NEW structure

async function loadNameKhkLookup() {
  const response = await fetch('data/EPNRi_leviandmed_A-täht.xml');
  const xmlText = await response.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');

  const ngEntries = xml.querySelectorAll('NG');

  ngEntries.forEach(entry => {

    const nameNode = entry.querySelector('nimi');
    if (!nameNode) return;

    const name = nameNode.textContent.trim();

    // ------------------------
    // 1. Collect ALL <khk> for this NG (as before)
    // ------------------------
    const khkNodes = entry.querySelectorAll('khk');
    const khkList = Array.from(khkNodes).map(n => n.textContent.trim());
    if (khkList.length) {
      nameToKhk[name] = [...new Set(khkList)];
    }

    // ------------------------
    // 2. Inspect each <kbmg> block individually
    // ------------------------
    const kbmgEntries = entry.querySelectorAll('kbmg');

    const allKbm = new Set();
    const generalKbm = new Set();
    const kbmDetail = [];   // <-- NEW

    kbmgEntries.forEach(kbmg => {
      const kbmCode = kbmg.querySelector('kbm')?.textContent.trim();
      if (!kbmCode) return;

      allKbm.add(kbmCode);

      const hasKhk = !!kbmg.querySelector('khk');

      if (!hasKhk) {
        generalKbm.add(kbmCode);
      }

      // Store new detailed structure
      kbmDetail.push({
        kbm: kbmCode,
        hasKhk: hasKhk
      });
    });

    // Store as before
    if (allKbm.size) nameToKbm[name] = [...allKbm];
    if (generalKbm.size) nameToGeneralKbm[name] = [...generalKbm];

    // Store the NEW detailed KBM structure
    if (kbmDetail.length) nameToKbmDetail[name] = kbmDetail;
  });

  console.log('KHKs:', nameToKhk);
  console.log('All KBMs:', nameToKbm);
  console.log('General KBMs:', nameToGeneralKbm);
  console.log('KBM detail:', nameToKbmDetail); // <-- NEW
}
//Uue lõpp.

// --- Highlight matching areas
// Algse algus.
/* function highlightAreas(khkList) {
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
} */
//Algse lõpp.

function highlightAreas(khkList) {
  polygons.eachLayer(layer => {
    const props = layer.feature.properties;
    const khk = props.KHK;

    const isHighlighted = khkList.includes(khk);
    const isSingle = khk.length === 1;

    // Base style
    const baseStyle = {
      fillColor: '#D3D8E0',
      fillOpacity: 0.9,
      color: 'rgb(97,112,125)',
      weight: 1
    };

    // Highlighted polygons
    if (isHighlighted) {
      layer.setStyle({
        fillColor: 'rgb(65,37,208)',     
        fillOpacity: isSingle ? 0.5 : 0.9, 
        color: 'rgb(97,112,125)',
        weight: 1
      });
      return;
    }

    // Non-highlighted polygons ---
    if (isSingle) {
      // special tyle for 1-letter polygons
      layer.setStyle({
        ...baseStyle,
        fillOpacity: 0.7,
        weight: 0.5
      });
    } else {
      layer.setStyle(baseStyle);
    }
  });
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
    const khkList = nameToKhk[name] || [];
    const generalKbmCodes = nameToGeneralKbm[name] || [];

    /*console.log("🔍 NAME:", name);
    console.log("🔍 Raw khkList:", khkList);
    console.log("🔍 Raw khkList length:", khkList.length); */

    console.log("🔎 generalKbmCodes =", generalKbmCodes);
    console.log("🔎 nameToKbm =", nameToKbm[name]);

    // Only the regional one-letter KBM codes (P, N) → ignore VAN, EES, etc
    const regionalCodes = generalKbmCodes.filter(code =>
        ['P', 'N'].includes(code)
    );

    // Combined list that should highlight → KHK + (P,N)
    const highlightList = [...khkList, ...regionalCodes];

    const infoBox = document.getElementById('info-box');
    const infoMessage = document.getElementById('info-message');

    // Highlight areas
    if (highlightList.length > 0) {
        currentSelectedName = name;
        highlightAreas(highlightList);
        updatePopups();
    }

    //Dünaamiline pealkiri.
    document.getElementById('main-heading').innerHTML =
    `Perekonnanime <span class="heading-name">${name}</span> levik kihelkonniti`;

    //Infokasti tekst.
    /* testi algus
    const codeToRegion = {
        L: 'Liivimaa',
        E: 'Eestimaa',
        P: 'Petserimaa',
        N: 'Narvatagune'
    };

    // Only one-letter region codes → ignore VAN, EES
    const validKbmCodes = generalKbmCodes.filter(code => codeToRegion[code]);

    let message = '';

    if (validKbmCodes.length > 0) {
        const regions = validKbmCodes.map(code => codeToRegion[code]).filter(Boolean);
        let regionText = '';

        if (regions.length === 1) {
            regionText = `Nime "${name}" esinemisalaks on (ka) ${regions[0]}.<br>`;
        } else if (regions.length > 1) {
            const last = regions.pop();
            regionText = `Nime "${name}" esinemisaladeks on (ka) ${regions.join(', ')} ja ${last}.<br>`;
        }

        message =
            `Nime "${name}" puhul ei saa näidata kihelkonna taset kõigis piirkondades, ` +
            `sest hingeloendi andmed ja tegelik elukoht ei vasta üksteisele.<br><br>` +
            regionText;
    }

    // Special codes (VAN / EES)
    if (generalKbmCodes.includes('VAN') && generalKbmCodes.includes('EES')) {
        message += `<br>Nime "${name}" kohta ei teata täpset ajastut.`;
    } else if (generalKbmCodes.includes('VAN')) {
        message += `<br>Nimi "${name}" esineb enne üldist nimepanekut (1816).`;
    } else if (generalKbmCodes.includes('EES')) {
        message += `<br>"${name}" on eestistamisel võetud nimi (1935–1940).`;
    } Testi lõpp.*/

    // --- NEW INFO BOX MESSAGE LOGIC ---

    let message = "";

    // Detect whether the XML had <khk> for this name
    const hasKhk = khkList.length > 0;

    console.log("🔍 Cleaned hasKhk:", hasKhk);

    // KBM codes may include: L, E, P, N, VAN, EES…
    //const kbmList = generalKbmCodes; Vana.
    const kbmList = nameToKbm[name] || [];
    const kbmDetail = nameToKbmDetail[name] || [];

    // RULE 1 — VAN (Vana nimekiht)
    if (kbmList.includes("VAN")) {
        message += 
            `Vana nimekiht – Nimi esineb enne üldist nimepanekut, enamasti on teada ` +
            `esinemine aastal 1816. Tegu oli mittetalupoegadega.<br><br>`;
    }

    // RULE 2— L (Liivimaa)
    if (kbmList.includes("L")) {
        const entry = kbmDetail.find(k => k.kbm === "L");
        const hasKhk = entry ? entry.hasKhk : false;

        if (hasKhk) {
            message += `Talupoegadele Liivimaa kubermangus (1809) 1822–1826 antud nimi.<br><br>`;
        } else {
            message += `Liivimaa – Nimi esineb enamasti vene rahvusest inimestel, kelle täpne elukoht pole teada.<br><br>`;
        }
    }

    // RULE 3 — E (Eestimaa)
    if (kbmList.includes("E")) {
        const entry = kbmDetail.find(k => k.kbm === "E");
        const hasKhk = entry ? entry.hasKhk : false;

        if (hasKhk) {
            message += `Talupoegadele Eestimaa kubermangus 1834–1835 antud nimi.<br><br>`;
        } else {
            message += `Eestimaa – Nimi esineb enamasti vene rahvusest inimestel, kelle täpne elukoht pole teada.<br><br>`;
        }
    }

    // RULE 4 — P (Petserimaa)
    if (kbmList.includes("P")) {
        message += 
            `Petserimaa – Petserimaal enamasti 1921. aastal talupoegadele antud nimi.<br><br>`;
    }

    // RULE 5 — N (Narvatagune)
    if (kbmList.includes("N")) {
        message += 
            `Narvatagune – Narvatagusel enamasti 1922. aastal talupoegadele antud nimi.<br><br>`;
    }

    // RULE 6 — EES (Eestistatud nimi)
    if (kbmList.includes("EES")) {
        message += 
            `Eestistatud nimi – Eestistamisel (enamasti 1935–1940, harvem 1920–1944) ` +
            `võetud nimi.<br><br>`;
    }

    // If NO rules matched → no info box
    message = message.trim();


    // Show or hide info box
    if (message) {
        infoMessage.innerHTML = message;
        infoBox.style.display = 'block';
    } else {
        infoBox.style.display = 'none';
    }
}


document.getElementById('info-close').addEventListener('click', () => {
document.getElementById('info-box').style.display = 'none'
})

// Initial setup
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
      //const khkCode = feature.properties.KHK Seda ei näidata.
      const khkName = feature.properties.NIMI
      //const popupText = `<b>Kihelkond:</b> ${khkName} (${khkCode})`
      const popupText = `<b>Kihelkond:</b> ${khkName}` //Ilma koodita.
      layer.bindPopup(popupText)
      layer.bindTooltip(khkName, { //mouse-hover
        sticky: true,          // tooltip follows cursor
        direction: 'auto' });     // adjusts automatically
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
      fillOpacity: 0.5,
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
  geoJson.features.forEach(feature => {
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
})

  //Maakonnapiiride kiht
  const boundariesJson = await fetch('geojson/maakonnad_lines_4326.geojson').then(r => r.json())
  boundaries = L.geoJson(boundariesJson, {
    pane: 'boundariesPane',
    style: {
      color: 'black',   
      weight: 2.0,  //Algne 1.5  
      fill: false        
    }
  }).addTo(map)

  //Kubermangu piir
  const kubermangJson = await fetch('geojson/kubermang_lines_4326.geojson').then(r => r.json())
  kubermang = L.geoJson(kubermangJson, {
    pane: 'kubermangPane',
    style: {
      color: '#4125d0',   
      weight: 2.5, //Algne 2.0        
      fill: false        
    }
  }).addTo(map)

  const layerControlOptions = {
      collapsed: false,
      position: 'topleft'
    }

  const layerControl = L.control.layers(null, {
    "Kubermangude piirid": kubermang,
    "Maakondade piirid": boundaries
    //"Kihelkonnad": polygons See rida määrab ära, kas kihelkondasid näidatakse rippmenüüs v mitte.
  }, layerControlOptions).addTo(map)
}

init()
