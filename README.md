# Dental Digital Twin Prototype

A browser-based prototype of the **Community–Patient multi-scale oral health visualization system** described in the manuscript submitted to *JMIR Medical Informatics* (manuscript 107366). It accompanies the paper as a working demonstration of the user application layer.

**Live demo:** https://wangcheer97.github.io/dental-digital-twin/

> ## ⚠️ Synthetic data notice
> **All data shown in this prototype are synthetic and do not represent any real individual.**
> Patient names, ages, addresses, e-mail addresses, phone numbers, insurance status, community assignments and locations were randomly generated for demonstration purposes only. Any resemblance to real persons is coincidental.

## Features

### Community Visualization System
- Interactive Mapbox map of College Station, TX with community enforcement-area boundaries and labels
- Toggle layers: **Dental Patient** (synthetic patient locations with click-to-open profile pop-ups), **Dental Facility** (dental clinic locations), **Density Layer** (patient count choropleth by community)
- Patient ID search that flies to and highlights a patient
- Sidebar panels: real-time patient number monitoring (bar chart), historical patient changes 2018–2024 (line chart), and dental-related community indices (table)

### Patient Visualization System
- Patient medical information summary
- Dental health condition monitoring (score trend)
- Post-treatment simulation and individualized assessment
- Digital-twin head/oral anatomy view with a dental notation chart (static rendering of the 3D model credited below)

## Technology stack

| Component | Library / service | Version |
|---|---|---|
| Web map rendering | Mapbox GL JS | 2.15.0 |
| Base map style | Mapbox Light (`mapbox://styles/mapbox/light-v11`) | v11 |
| Charts | Apache ECharts | 5.x (CDN, `echarts@5`) |
| Icons | Font Awesome | 6.4.2 |
| Markup / styling / logic | HTML5, CSS3 (Flexbox + Grid), vanilla JavaScript (ES2015+) | — |
| Spatial data format | GeoJSON (WGS 84, EPSG:4326) | — |
| Data preparation (offline) | ArcGIS Pro / QGIS | — |
| Hosting | GitHub Pages (static) | — |

No build step, framework or backend is required; the site is fully static.

## Repository layout

```
index.html          entry page (both systems, tab switching)
css/main.css        layout and styling
js/echart.js        sidebar charts (ECharts)
data/geodata.js     the four GeoJSON datasets bundled as JS globals (used by the page)
data/*.geojson      the same datasets in plain GeoJSON form
images/             static figures and icons
```

`data/geodata.js` is generated from the `.geojson` files so the page works without a server and without cross-origin fetches. If you edit a `.geojson` file, regenerate it:

```bash
python3 - <<'PY'
import json, base64
pairs = [("PATIENT_DATA","data/patient.geojson"),("FACILITY_DATA","data/facility.geojson"),
         ("DENSITY_DATA","data/density.geojson"),("BOUNDARY_DATA","data/college station.geojson")]
with open("data/geodata.js","w") as o:
    for n,p in pairs:
        o.write(f"window.{n} = {json.dumps(json.load(open(p)),separators=(',',':'))};\n")
    o.write('window.HOSPITAL_ICON = "data:image/png;base64,' + base64.b64encode(open("images/hospital.png","rb").read()).decode() + '";\n')
PY
```

## Running locally

Either open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

An internet connection is required for the Mapbox tiles and the CDN-hosted libraries.

### Mapbox token

The Mapbox access token is defined once at the top of `index.html` (`MAPBOX_TOKEN`). For your own deployment, create a **public token** in the Mapbox dashboard and restrict it to your site's URL.

## 3D model attribution

The 3D model used in the patient visualization interface was sourced from "Head and Neck Anatomy for Dentistry" by the University of Dundee, CAHID (https://sketchfab.com/anatomy_dundee), available at Sketchfab, licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).

## License

Source code: MIT. Map data © Mapbox © OpenStreetMap contributors. The anatomy model is CC BY 4.0 as stated above.
