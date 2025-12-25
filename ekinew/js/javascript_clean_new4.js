//See on uusim. Lisaks töötab clean_new.
/*let map = L.map('map').setView([58.588443, 25.787725], 8) */ //Sellega saab zuumida.
let map = L.map('map', { center: [58.588443, 25.787725], zoom: 8, zoomControl: false }); //Sellega mitte.

/*const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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

maaametOrto.addTo(map); */

 //Tagastame algse seisu.
function clearMapState() {
  // Reset current selected name
  currentSelectedName = '';

  //Reset pealkiri.
  document.getElementById('main-heading').innerHTML =
    'Perekonnanime levik kihelkonniti';

  // Reset polygon colors to their default style
  polygons.eachLayer(layer => {
    const khk = (layer.feature.properties.KHK || '').trim();  // kui on peidetud tühikuid

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
        fillColor: 'white',
        fillOpacity: 0.3,
        weight: 0.5
      });
    } else {
      layer.setStyle(baseStyle);
    }
  });

  // Sule info box
  document.getElementById('info-box').style.display = 'none';

  // Reset popup text to default
  /*polygons.eachLayer(layer => {
    const khkName = layer.feature.properties.NIMI;
    layer.bindPopup(`<b>Kihelkond:</b> ${khkName}`);
  }); Popup ära.*/

  //Zuumiastme taastamine.
  map.setView([58.588443, 25.787725], 8);

  //if (!map.hasLayer(polygons)) map.addLayer(polygons); See rida määrab ära, kas kihelkondasid näidatakse rippmenüüs v mitte kui vajutada Taasta algseis.
  if (!map.hasLayer(boundaries)) map.addLayer(boundaries);
  if (!map.hasLayer(kubermang)) map.addLayer(kubermang);
}


// Name to Kihelkond (KHK) mapping
let currentSelectedName = '' // stores the currently selected name
let polygons // will hold the GeoJSON layer

// New lookups
const nameToKhk = {};
const nameToKbm = {};
const nameToGeneralKbm = {};
const nameToKbmDetail = {};   // detailed KBM info
const nameToKhkByMk = {};     // NEW flat list: { name: [ { mk, khk }, ... ] }

// MK -> Maakond mapping
const mkToMaakond = {
  "Pä": "Pärnu",
  "Lä": "Lääne",
  "Sa": "Saare",
  "Võ": "Võru",
  "Jä": "Järva",
  "Ha": "Harju",
  "Ta": "Tartu",
  "Vl": "Viljandi",
  "Vi": "Viru",
  "Va": "Valga"
};

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
    // 2. Inspect each <kbmg> block individually (KBM blocks)
    // ------------------------
    const kbmgEntries = entry.querySelectorAll('kbmg');

    const allKbm = new Set();
    const generalKbm = new Set();
    const kbmDetail = [];

    // For Mihkli extraction
    const flatMkKhkList = []; // will hold { mk, khk } entries for this name

    kbmgEntries.forEach(kbmg => {
      const kbmCode = kbmg.querySelector('kbm')?.textContent.trim();
      if (!kbmCode) return;

      allKbm.add(kbmCode);

      const hasKhk = !!kbmg.querySelector('khk');
      if (!hasKhk) {
        generalKbm.add(kbmCode);
      }

      // Save the kbm detail
      kbmDetail.push({
        kbm: kbmCode,
        hasKhk: hasKhk
      });

      // Now parse nested <mkg> blocks inside this kbmg (if any)
      const mkgBlocks = kbmg.querySelectorAll('mkg');
      mkgBlocks.forEach(mkg => {
        const mkCode = mkg.querySelector('mk')?.textContent.trim();
        if (!mkCode) return;

        // Each mkg may have a <khkg> containing multiple <khk>
        const khkg = mkg.querySelector('khkg');
        if (!khkg) return;

        const khkNodesInside = khkg.querySelectorAll('khk');
        Array.from(khkNodesInside).forEach(khknode => {
          const khkCode = khknode.textContent.trim();
          if (khkCode) {
            flatMkKhkList.push({ mk: mkCode, khk: khkCode });
          }
        });
      });
    });

    // Store KBM info
    if (allKbm.size) nameToKbm[name] = [...allKbm];
    if (generalKbm.size) nameToGeneralKbm[name] = [...generalKbm];
    if (kbmDetail.length) nameToKbmDetail[name] = kbmDetail;

    // Store the flat MK->KHK list (if any)
    if (flatMkKhkList.length) {
      nameToKhkByMk[name] = flatMkKhkList;
    }
  });

  console.log('KHKs:', nameToKhk);
  console.log('All KBMs:', nameToKbm);
  console.log('General KBMs:', nameToGeneralKbm);
  console.log('KBM detail:', nameToKbmDetail);
  console.log('nameToKhkByMk (flat MK-KHK lists):', nameToKhkByMk);
}

// --- Highlight matching areas (with Mihkli special-case handled via nameToKhkByMk)
function highlightAreas(khkList) {
  polygons.eachLayer(layer => {
    const props = layer.feature.properties || {};
    const khk = (props.KHK || '').trim();
    const polygonMaakond = (props.MK || '').trim(); // GeoJSON field: maakond name (expect same text as mkToMaakond values)

    let isHighlighted = khkList.includes(khk);
    const isSingle = khk.length === 1;

    // --- SPECIAL CASE: MIHKLI (the only split KHK) ---
    if (khk === "Mih") {
      // Get all MK entries for this name that mention Mih
      const mkKhkEntries = nameToKhkByMk[currentSelectedName] || [];
      const validMKcodes = mkKhkEntries
        .filter(e => e.khk === "Mih")
        .map(e => e.mk);

      // If we have explicit MKs for Mih, only allow those maakonnad
      if (validMKcodes.length > 0) {
        const validMaakonnad = validMKcodes
          .map(mk => mkToMaakond[mk])
          .filter(Boolean);

        // If polygonMaakond is not in allowed maakonnad list -> not highlighted
        if (!validMaakonnad.includes(polygonMaakond)) {
          isHighlighted = false;
        }
      } else {
        // If we have no MK info for Mih for this name, do NOT highlight Mih at all
        isHighlighted = false;
      }
    }
    // --- END MIHKLI SPECIAL CASE ---

    // --- 1) Highlighted polygons ---
    if (isHighlighted) {
      const opacity = isSingle ? 0.5 : 0.9;  // keep your one-letter logic
      layer.setStyle({
        fillColor: 'rgb(65,37,208)',
        fillOpacity: opacity,
        color: 'rgb(97,112,125)',
        weight: 1
      });
      return;
    }

    // --- 2) Non-highlighted one-letter polygons ---
    if (isSingle) {
      layer.setStyle({
        fillColor: 'white',
        fillOpacity: 0.3,
        color: 'black',
        weight: 0.5
      });
      return;
    }

    // --- 3) Default normal polygons ---
    layer.setStyle({
      fillColor: '#D3D8E0',
      fillOpacity: 0.9,
      color: 'rgb(97,112,125)',
      weight: 1
    });
  });
}

// Hüpikaken näitab khk nime igale ja pk-nime, kui see khk-s esineb. Popup ära.
/*function updatePopups() {
  polygons.eachLayer(layer => {
    const khkCode = layer.feature.properties.KHK;
    const khkName = layer.feature.properties.NIMI;

    let popupText = `<div class="popup-text"><b>Kihelkond:</b> ${khkName}</div>`;

    if (
      currentSelectedName &&
      nameToKhk[currentSelectedName] &&
      nameToKhk[currentSelectedName].includes(khkCode)
    ) {
      popupText += `<br><div class="popup-text"><b>Nimi:</b> ${currentSelectedName}</div>`;
    }

    layer.bindPopup(popupText);
  });
} */

//showmapforname, mis arvestab VAN ja EES.
function showMapForName(name) {
  const khkList = nameToKhk[name] || [];
  const generalKbmCodes = nameToGeneralKbm[name] || [];

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
    //updatePopups();
  } else {
    // No direct khk/region info — still set currentSelectedName so Mih lookup can check if needed
    currentSelectedName = name;
    highlightAreas([]); // ensure Mihkli and other logic hides things
    //updatePopups();
  }

  //Dünaamiline pealkiri.
  document.getElementById('main-heading').innerHTML =
    `Perekonnanime <span class="heading-name">${name}</span> levik kihelkonniti`;

  // --- NEW INFO BOX MESSAGE LOGIC ---

  let message = "";

  // Detect whether the XML had <khk> for this name
  const hasKhk = khkList.length > 0;

  console.log("🔍 Cleaned hasKhk:", hasKhk);

  // KBM codes may include: L, E, P, N, VAN, EES…
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
    const hasKhkBlock = entry ? entry.hasKhk : false;

    if (hasKhkBlock) {
      message += `Talupoegadele Liivimaa kubermangus (1809) 1822–1826 antud nimi.<br><br>`;
    } else {
      message += `Liivimaa – Nimi esineb enamasti vene rahvusest inimestel, kelle täpne elukoht pole teada.<br><br>`;
    }
  }

  // RULE 3 — E (Eestimaa)
  if (kbmList.includes("E")) {
    const entry = kbmDetail.find(k => k.kbm === "E");
    const hasKhkBlock = entry ? entry.hasKhk : false;

    if (hasKhkBlock) {
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
  document.getElementById('info-box').style.display = 'none';
});

// Initial setup
async function init() {
  await loadNameKhkLookup();

  map.createPane('polygonsPane');
  map.getPane('polygonsPane').style.zIndex = 200;   // lowest

  map.createPane('boundariesPane');
  map.getPane('boundariesPane').style.zIndex = 400; // above polygons

  map.createPane('kubermangPane');
  map.getPane('kubermangPane').style.zIndex = 450;  // above boundaries

  //Kihelkondade kiht
  const geoJson = await fetch('geojson/khk_gen_lis_4326.geojson').then(r => r.json());
  polygons = L.geoJson(geoJson, {
    pane: 'polygonsPane',
    onEachFeature: (feature, layer) => {
      const khkName = feature.properties.NIMI || '';
      /*const popupText = `<b>Kihelkond:</b> ${khkName}`; 
      layer.bindPopup(popupText); Popup ära.*/
      layer.bindTooltip(khkName, { //mouse-hover
        sticky: true,          // tooltip follows cursor
        direction: 'auto'      // adjusts automatically
      });
    },

    style: function (feature) {
      const khk = feature.properties.KHK || '';

      const baseStyle = {
        fillColor: '#D3D8E0',
        fillOpacity: 0.9,
        color: 'black',
        weight: 1.0
      };

      // If KHK code length is 1 → different opacity
      if (khk.length === 1) {
        return {
          ...baseStyle,
          //dashArray: '4 10',   // dotted outline
          fillColor: 'white',
          fillOpacity: 0.3,
          weight: 0.5
        };
      }

      // All others → standard style
      return baseStyle;
    }

  }).addTo(map);

  //Maakonnapiiride kiht
  const boundariesJson = await fetch('geojson/maakonnad_lines_4326.geojson').then(r => r.json());
  boundaries = L.geoJson(boundariesJson, {
    pane: 'boundariesPane',
    style: {
      color: 'black',
      weight: 2.0,
      fill: false
    }
  }).addTo(map);

  //Kubermangu piir
  const kubermangJson = await fetch('geojson/kubermang_lines_4326.geojson').then(r => r.json());
  kubermang = L.geoJson(kubermangJson, {
    pane: 'kubermangPane',
    style: {
      color: '#4125d0',
      weight: 2.5,
      fill: false
    }
  }).addTo(map);

  //Testime nähtamatut kubermangude kihti.
  // --- Kubermang polygons (invisible, only labels) ---
    const kubermangPolyJson = await fetch('geojson/kubermang.geojson').then(r => r.json());
    const kubermangLabels = L.layerGroup().addTo(map); //Lisatud rida.

    kubermangPolygons = L.geoJson(kubermangPolyJson, {
    pane: 'kubermangPane',
    style: {
        color: 'none',
        fillColor: 'none',
        weight: 0,
        fillOpacity: 0
    },
    interactive: false,    // essential: polygon cannot be clicked
    /*Labeldamise algus
    onEachFeature: (feature, layer) => {
        const name = feature.properties.Kubermang || "";
        layer.bindTooltip(name, {
        permanent: true,     // label always visible (when layer is added)
        opacity: 1,
        direction: "center",
        className: "kubermang-label"
        //offset: [ 600, -50 ] Selle reaga saab nihutada mõlemaid korraga.
        });
    } Labeldamise lõpp. */
    //Test GeoJSONi koordinaatidega.
  onEachFeature: (feature) => {
    const { labelLat, labelLon, Kubermang } = feature.properties;
    if (labelLat == null || labelLon == null) return;

    const label = L.marker([labelLat, labelLon], {
      interactive: false,
      icon: L.divIcon({
      className: "kubermang-label",
      html: Kubermang,
      iconSize: null
    })
  });

  kubermangLabels.addLayer(label);
}
//Seni eemalda, kui ei tööta.
    });
    
    //kubermangPolygons.addTo(map);//Seni kihi lisamine. See rida lisab ta kohe alguses.
    //Teistmoodi test kui eelmine rida.
    const kubermangGroup = L.layerGroup([
    kubermangPolygons,
    kubermangLabels
    ]).addTo(map);

    map.on('overlayadd', function (e) {
        if (e.name === "Kubermangude piirid") {
            map.addLayer(kubermangPolygons),
            map.addLayer(kubermangLabels);
    }
    });

    map.on('overlayremove', function (e) {
        if (e.name === "Kubermangude piirid") {
        map.removeLayer(kubermangPolygons),
        map.removeLayer(kubermangLabels);
    }
    });
    //Testi lõpp.

  const layerControlOptions = {
    collapsed: false,
    position: 'topleft'
  };

  const layerControl = L.control.layers(null, {
    "Kubermangude piirid": kubermang,
    "Maakondade piirid": boundaries
    //"Kihelkonnad": polygons
  }, layerControlOptions).addTo(map);
}

init();
