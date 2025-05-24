const wmsLayers = [
    {
      id: "5_minute_areas",
      title: {
        en: "5 minute coverage area",
        ee: "5 minutiga kaetav ala",
      },
      url: "https://landscape-geoinformatics.ut.ee/geoserver/pa2023/wms?",
      layers: "rpk_5min_ala_db",
      type: "wms",
      version: "1.1.1",
      format: "image/png",
      transparent: true,
      projection: "EPSG:3301",
      zIndex: 290,
    },

    {
      id: "10_minute_areas",
      title: {
        en: "10 minute coverage area",
        ee: "10 minutiga kaetav ala",
      },
      url: "https://landscape-geoinformatics.ut.ee/geoserver/pa2023/wms?",
      layers: "rpk_10min_ala_db",
      type: "wms",
      version: "1.1.1",
      format: "image/png",
      transparent: true,
      projection: "EPSG:3301",
      zIndex: 280,
    },

    {
      id: "rescue_commands",
      title: {
        en: "Estonian rescue commands",
        ee: "Eesti päästekomandod",
      },
      url: "https://landscape-geoinformatics.ut.ee/geoserver/pa2023/wms?",
      layers: "komandod_prognoosimudelile_db",
      type: "wms",
      version: "1.1.1",
      format: "image/png",
      transparent: true,
      projection: "EPSG:3301",
      zIndex: 300,
    },
  ]

  export {wmsLayers}