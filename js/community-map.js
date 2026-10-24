/* Community overlays are created once; toggles only change visibility. */
mapboxgl.accessToken = MAPBOX_TOKEN;
const communityBounds = new mapboxgl.LngLatBounds();
function visitCoordinates(coordinates) {
    if (typeof coordinates[0] === 'number') communityBounds.extend(coordinates);
    else coordinates.forEach(visitCoordinates);
}
window.BOUNDARY_DATA.features.forEach(feature => visitCoordinates(feature.geometry.coordinates));
const toolbar = document.querySelector('#page1 .toolbar');
const mapPanel = document.querySelector('#page1 .map-container');
const initialPadding = () => ({top: toolbar.offsetHeight + 16, bottom: 20, left: 24, right: 24});
const map = new mapboxgl.Map({
    container: 'map', style: 'mapbox://styles/mapbox/light-v11',
    bounds: communityBounds, fitBoundsOptions: {padding: initialPadding(), maxZoom: 12.5}
});
window.map = map;
function sizeToolbar() {
    mapPanel.style.setProperty('--toolbar-height', `${toolbar.offsetHeight}px`);
}
sizeToolbar();
if (window.ResizeObserver) new ResizeObserver(sizeToolbar).observe(toolbar);
const hospitalLegend = document.getElementById('legend-facility-icon');
hospitalLegend.src = window.HOSPITAL_ICON;
// Point overlays remain independent from the mutually exclusive color surfaces.
const overlays = [
    {button: 'btn-patient', layer: 'patients-layer', legend: 'legend-patient'},
    {button: 'btn-medical', layer: 'facility-layer', legend: 'legend-facility'}
];
overlays.forEach(({button}) => {document.getElementById(button).disabled = true;});
function bindToggle(overlay) {
    const button = document.getElementById(overlay.button);
    button.disabled = false;
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    button.addEventListener('click', () => {
        const visible = map.getLayoutProperty(overlay.layer, 'visibility') !== 'none';
        map.setLayoutProperty(overlay.layer, 'visibility', visible ? 'none' : 'visible');
        button.classList.toggle('active', !visible);
        button.setAttribute('aria-pressed', String(!visible));
        document.getElementById(overlay.legend).classList.toggle('layer-hidden', visible);
    });
}
const metrics = {
    income: {field: 'income', title: 'Income', description: 'Approx. median household income', source: 'ACS 2018–2022 · Population weighted', format: x => `$${(x / 1000).toFixed(1)}k`, detail: x => `$${x.toLocaleString('en-US', {maximumFractionDigits: 2})}`},
    poverty: {field: 'poverty', title: 'Poverty', description: 'Population below 150% of poverty level', source: 'SVI 2022 · Population weighted', format: x => `${x.toFixed(1)}%`},
    aged_65: {field: 'aged_65', title: 'Aged 65+', description: 'Population aged 65 years and older', source: 'SVI 2022 · Population weighted', format: x => `${x.toFixed(1)}%`},
    uninsured: {field: 'uninsured', title: 'Uninsured', description: 'Population without health insurance', source: 'SVI 2022 · Population weighted', format: x => `${x.toFixed(1)}%`},
    svi: {field: 'svi', title: 'SVI', description: 'Weighted Texas tract percentile', source: 'SVI 2022 · Population weighted', format: x => x.toFixed(2), detail: x => x.toFixed(3)}
};
const densityMetrics = {
    patients: {field: 'patient_count', title: 'Patient density map', description: 'Patient count per community (synthetic)', source: 'Synthetic patient points assigned to communities', format: x => Math.round(x).toString()},
    facilities: {field: 'facility_count', title: 'Facility density map', description: 'Facility count per community', source: 'Facility locations assigned to community polygons', format: x => Number.isInteger(x) ? x.toString() : x.toFixed(1)}
};
let activeSurface = {type: 'density', mode: 'patients'};
let surfaceBeforeHeatmap = {...activeSurface};
const menus = {};
const surfacePalette = ['#FFC15C', '#FF8B68', '#E9617F', '#614392'];
function surfaceMetric() {
    if (activeSurface.type === 'density') return densityMetrics[activeSurface.mode];
    if (activeSurface.type === 'socioeconomic') return metrics[activeSurface.mode];
    return null;
}
function renderSurface() {
    const heat = activeSurface.type === 'heatmap';
    const metric = surfaceMetric();
    map.setLayoutProperty('density-layer', 'visibility', metric ? 'visible' : 'none');
    map.setLayoutProperty('patients-heatmap', 'visibility', heat && activeSurface.mode === 'patients' ? 'visible' : 'none');
    map.setLayoutProperty('facilities-heatmap', 'visibility', heat && activeSurface.mode === 'facilities' ? 'visible' : 'none');
    document.getElementById('legend-surface').hidden = !metric;
    document.getElementById('legend-heatmap').hidden = !heat;
    if (metric) {
        const values = window.COMMUNITY_MAP_DATA.features.map(f => f.properties[metric.field]).filter(Number.isFinite);
        const min = Math.min(...values), max = Math.max(...values);
        const span = max > min ? max - min : 1;
        const color = ['interpolate', ['linear'], ['get', metric.field], min, surfacePalette[0], min + span / 3, surfacePalette[1], min + span * 2 / 3, surfacePalette[2], min + span, surfacePalette[3]];
        map.setPaintProperty('density-layer', 'fill-color', ['case', ['==', ['get', metric.field], null], '#bbbbbb', color]);
        const opacity = activeSurface.type === 'density' ? 0.25 : 0.45;
        map.setPaintProperty('density-layer', 'fill-opacity', opacity);
        document.getElementById('surface-title').textContent = metric.title;
        document.getElementById('surface-description').textContent = metric.description;
        const gradient = document.getElementById('surface-gradient');
        gradient.style.background = `linear-gradient(to right, ${surfacePalette.join(', ')})`;
        gradient.style.opacity = String(opacity);
        document.getElementById('surface-ticks').replaceChildren(...[min, (min + max) / 2, max].map(value => {
            const tick = document.createElement('span'); tick.textContent = metric.format(value); return tick;
        }));
        document.getElementById('surface-source').textContent = metric.source + ' · Community range';
    }
    if (heat) {
        const facilities = activeSurface.mode === 'facilities';
        document.getElementById('heatmap-title').textContent = facilities ? 'Facility heatmap' : 'Patient heatmap';
        document.getElementById('heatmap-description').textContent = facilities
            ? `${window.FACILITY_DATA.features.length} dental facility locations`
            : `${window.PATIENT_DATA.features.length.toLocaleString('en-US')} synthetic patient locations`;
    }
    Object.entries(menus).forEach(([type, menu]) => {
        const mode = activeSurface.type === type ? activeSurface.mode : 'off';
        menu.button.dataset.mode = mode;
        menu.button.classList.toggle('active', mode !== 'off');
        menu.button.title = mode === 'off' ? menu.title : `${menu.title}: ${menu.options.find(o => o.dataset.mode === mode).textContent}`;
        menu.options.forEach(option => option.setAttribute('aria-checked', String(option.dataset.mode === mode)));
    });
}
function chooseSurface(type, mode) {
    if (mode === 'off') {
        if (activeSurface.type !== type) return;
        activeSurface = type === 'heatmap' ? {...surfaceBeforeHeatmap} : {type: 'none', mode: 'off'};
    } else {
        if (type === 'heatmap' && activeSurface.type !== 'heatmap') surfaceBeforeHeatmap = {...activeSurface};
        activeSurface = {type, mode};
    }
    renderSurface();
}
function bindSurfaceMenu(type, title) {
    const button = document.getElementById(`${type}-mode`);
    const element = document.getElementById(`${type}-menu`);
    const options = Array.from(element.querySelectorAll('[data-mode]'));
    const close = (focus = false) => {
        element.hidden = true; button.setAttribute('aria-expanded', 'false');
        if (focus) button.focus();
    };
    const open = () => {
        Object.values(menus).forEach(menu => menu.close());
        element.hidden = false; button.setAttribute('aria-expanded', 'true');
        options.find(option => option.getAttribute('aria-checked') === 'true').focus();
    };
    menus[type] = {button, element, options, title, close};
    button.addEventListener('click', () => element.hidden ? open() : close(true));
    button.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {event.preventDefault(); open();}
    });
    options.forEach(option => option.addEventListener('click', () => {chooseSurface(type, option.dataset.mode); close(true);}));
    element.addEventListener('keydown', event => {
        const index = options.indexOf(document.activeElement);
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault(); options[(index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length].focus();
        } else if (event.key === 'Escape') {event.preventDefault(); close(true);}
        else if (event.key === 'Tab') close();
        else if (event.key === 'Home') {event.preventDefault(); options[0].focus();}
        else if (event.key === 'End') {event.preventDefault(); options.at(-1).focus();}
    });
    ['click', 'focusin'].forEach(name => document.addEventListener(name, event => {
        if (!button.parentElement.contains(event.target)) close();
    }));
}
bindSurfaceMenu('density', 'Density Map');
bindSurfaceMenu('heatmap', 'Heatmap');
bindSurfaceMenu('socioeconomic', 'Socioeconomic Index Map');
const heatmapColors = ['interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(34,12,64,0)', 0.15, '#44206b', 0.4, '#9b367c',
    0.65, '#e96562', 0.85, '#fca85d', 1, '#fcfdbf'];
function addHeatmap(id, source, facilities) {
    map.addLayer({id, type: 'heatmap', source, layout: {visibility: 'none'}, paint: {
        'heatmap-weight': 1,
        'heatmap-intensity': facilities ? 1.5 : 0.35,
        'heatmap-radius': facilities
            ? ['interpolate', ['linear'], ['zoom'], 9, 22, 11, 50, 13, 100, 16, 220]
            : ['interpolate', ['linear'], ['zoom'], 9, 12, 11, 28, 13, 65, 16, 180],
        'heatmap-color': heatmapColors,
        'heatmap-opacity': 0.7
    }}, 'Add-Background2');
}
function popupRows(coordinates, rows) {
    const content = document.createElement('div');
    rows.forEach(([label, value]) => {
        const row = document.createElement('div');
        const heading = document.createElement('b');
        heading.textContent = label + ': ';
        row.append(heading, document.createTextNode(String(value ?? '—')));
        content.append(row);
    });
    return new mapboxgl.Popup().setLngLat(coordinates).setDOMContent(content).addTo(map);
}
map.on('load', () => {
    // Reserve room for the legend while retaining zoom and a visible western edge.
    const westernEdge = map.project(communityBounds.getSouthWest()).x;
    const leftShift = Math.min(90, mapPanel.clientWidth * 0.065, Math.max(0, westernEdge - 20));
    map.panBy([leftShift, 0], {duration: 0});
    // Fill first, then boundaries, patient points, facilities and community labels.
    map.addSource('density', {type: 'geojson', data: window.COMMUNITY_MAP_DATA});
    const firstBasemapLabel = map.getStyle().layers.find(layer => layer.type === 'symbol');
    map.addLayer({id: 'density-layer', type: 'fill', source: 'density', paint: {
        'fill-color': '#614392',
        'fill-opacity': 0.25
    }}, firstBasemapLabel?.id);
    map.addSource('Background', {type: 'geojson', data: window.BOUNDARY_DATA});
    map.addLayer({id: 'Add-Background2', type: 'line', source: 'Background',
        paint: {'line-color': '#6F6F6F', 'line-width': 1.5, 'line-opacity': 0.8}});
    map.addSource('patients', {type: 'geojson', data: window.PATIENT_DATA});
    map.addLayer({id: 'patients-layer', type: 'circle', source: 'patients', paint: {
        'circle-radius': 2.5, 'circle-stroke-width': 1.2,
        'circle-color': '#B04B90', 'circle-stroke-color': 'white'
    }});
    map.addSource('community-labels', {type: 'geojson', data: window.COMMUNITY_LABELS});
    map.addLayer({id: 'labels', type: 'symbol', source: 'community-labels', layout: {
        'text-field': ['get', 'name'], 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 15, 'text-allow-overlap': true
    }, paint: {'text-color': '#49306f', 'text-halo-color': '#ffffff', 'text-halo-width': 2}});
    overlays.filter(overlay => overlay.layer !== 'facility-layer').forEach(bindToggle);
    map.addSource('facility', {type: 'geojson', data: window.FACILITY_DATA});
    addHeatmap('patients-heatmap', 'patients', false);
    addHeatmap('facilities-heatmap', 'facility', true);
    Object.values(menus).forEach(menu => {menu.button.disabled = false;});
    renderSurface();
    const hospital = new Image();
    hospital.onload = () => {
        map.addImage('hospital-icon', hospital);
        map.addLayer({id: 'facility-layer', type: 'symbol', source: 'facility', layout: {
            'icon-image': 'hospital-icon', 'icon-size': 0.15, 'icon-allow-overlap': true
        }}, 'labels');
        bindToggle(overlays.find(overlay => overlay.layer === 'facility-layer'));
    };
    hospital.src = window.HOSPITAL_ICON;
    map.on('click', event => {
        // Pick the topmost meaningful overlay; a polygon never hides a point popup.
        const layers = ['facility-layer', 'patients-layer', 'density-layer'].filter(id => map.getLayer(id));
        const hits = map.queryRenderedFeatures(event.point, {layers});
        const feature = layers.map(id => hits.find(hit => hit.layer.id === id)).find(Boolean);
        if (!feature) return;
        const props = feature.properties;
        if (feature.layer.id === 'facility-layer') {
            popupRows(event.lngLat, [['Dental facility', props.Name]]);
        } else if (feature.layer.id === 'patients-layer') {
            const popup = popupRows(event.lngLat, [
                ['Name', props.Name], ['Patient ID', props.ID], ['Gender', props.Gender],
                ['Age', props.Age], ['Occupation', props.Occupation], ['Home Address', props.Address],
                ['Email', props.Email], ['Phone Number', props.Phone], ['Dental Insurance', props.Insurance],
                ['Community ID', props.CommunityID], ['Community Officers', 'TAMU'], ['Eating Habits', props.EatingHabits]
            ]);
            const links = document.createElement('div');
            const xray = document.createElement('a'); xray.href = 'images/x-ray.png'; xray.target = '_blank'; xray.rel = 'noopener'; xray.textContent = 'X-Rays';
            const entrance = document.createElement('button'); entrance.type = 'button'; entrance.textContent = 'Patient System'; entrance.addEventListener('click', () => {showPage('page2'); popup.remove();});
            links.append(xray, document.createTextNode(' · '), entrance);
            popup.getElement().querySelector('.mapboxgl-popup-content').append(links);
        } else {
            const metric = surfaceMetric();
            if (metric) {
                const value = props[metric.field];
                popupRows(event.lngLat, [['Community', props.community], [metric.title, value == null ? 'N/A' : (metric.detail || metric.format)(value)]]);
            }
        }
    });
    ['patients-layer', 'facility-layer', 'density-layer'].forEach(layer => {
        map.on('mouseenter', layer, () => {map.getCanvas().style.cursor = 'pointer';});
        map.on('mouseleave', layer, () => {map.getCanvas().style.cursor = '';});
    });
});
function searchPatient() {
    const value = document.getElementById('search-box').value.trim();
    if (!/^\d+$/.test(value)) {alert('Enter a valid patient ID.'); return;}
    const patient = window.PATIENT_DATA.features.find(feature => feature.properties.ID === Number(value));
    if (!patient) {alert('No patient found with this ID.'); return;}
    map.flyTo({center: patient.geometry.coordinates, zoom: 14, essential: true});
    popupRows(patient.geometry.coordinates, [['Name', patient.properties.Name], ['Patient ID', patient.properties.ID]]);
}
document.getElementById('search-btn').addEventListener('click', searchPatient);
document.getElementById('search-box').addEventListener('keydown', event => {if (event.key === 'Enter') searchPatient();});
