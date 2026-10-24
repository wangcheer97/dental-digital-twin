/* One spatial assignment feeds chart B, panel D, polygon counts and popups. */
(() => {
    const fmtPct = value => !Number.isFinite(value) ? 'N/A' : value > 0 && value < 1 ? '<1%' : `${Math.round(value)}%`;
    // -1: on boundary; 1: inside; 0: outside. Ray casting also supports holes.
    function inRing(point, ring) {
        const [x, y] = point;
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [ax, ay] = ring[j], [bx, by] = ring[i];
            const dx = bx - ax, dy = by - ay;
            const cross = (x - ax) * dy - (y - ay) * dx;
            const tolerance = 1e-10;
            if (Math.abs(cross) <= tolerance * Math.hypot(dx, dy) &&
                x >= Math.min(ax, bx) - tolerance && x <= Math.max(ax, bx) + tolerance &&
                y >= Math.min(ay, by) - tolerance && y <= Math.max(ay, by) + tolerance) return -1;
            if ((ay > y) !== (by > y) && x < dx * (y - ay) / dy + ax) inside = !inside;
        }
        return inside ? 1 : 0;
    }
    function inPolygon(point, rings) {
        if (!inRing(point, rings[0])) return false;
        return !rings.slice(1).some(hole => inRing(point, hole) === 1);
    }
    function covers(point, geometry) {
        if (geometry.type === 'Polygon') return inPolygon(point, geometry.coordinates);
        if (geometry.type === 'MultiPolygon') return geometry.coordinates.some(polygon => inPolygon(point, polygon));
        return false;
    }
    const communities = window.BOUNDARY_DATA.features.map(feature => ({
        name: feature.properties.Enforce_Of.replace('Community', 'Com'),
        geometry: feature.geometry, patientCount: 0, facilityCount: 0
    })).sort((a, b) => Number(a.name.slice(3)) - Number(b.name.slice(3)));
    const audit = {unassignedPatients: 0, unassignedFacilities: 0, ambiguousPoints: 0};
    function assign(point) {
        const matches = communities.filter(community => covers(point, community.geometry));
        if (matches.length > 1) audit.ambiguousPoints++;
        return matches[0]; // Canonical numeric order is the tie rule for a shared edge.
    }
    window.PATIENT_DATA.features.forEach(patient => {
        const community = assign(patient.geometry.coordinates);
        if (community) community.patientCount++;
        else audit.unassignedPatients++;
        patient.properties.CommunityID = community?.name || 'Outside service areas';
        patient.properties.CEOfficers = 'TAMU';
    });
    window.FACILITY_DATA.features.forEach(facility => {
        const community = assign(facility.geometry.coordinates);
        if (community) community.facilityCount++;
        else audit.unassignedFacilities++;
    });
    const totalPatients = window.PATIENT_DATA.features.length;
    communities.forEach(community => {community.patientPct = totalPatients ? community.patientCount / totalPatients * 100 : 0;});
    const mapFeatures = window.COMMUNITY_MAP_DATA.features;
    communities.forEach(community => {
        const feature = mapFeatures.find(feature => feature.properties.community === community.name);
        feature.properties.patient_count = community.patientCount;
        feature.properties.facility_count = community.facilityCount;
        feature.properties.patient_pct = community.patientPct;
    });
    window.COMMUNITY_STATS = {communities, totalPatients, audit, fmtPct, covers};
    if (audit.unassignedPatients || audit.unassignedFacilities || audit.ambiguousPoints) console.warn('Community spatial assignment audit', audit);
    document.addEventListener('DOMContentLoaded', () => {
        const body = document.getElementById('panelD-rows');
        body.replaceChildren(...communities.map(community => {
            const props = mapFeatures.find(f => f.properties.community === community.name).properties;
            const values = [community.name, fmtPct(community.patientPct), `${Math.round(props.income / 1000)}k`,
                fmtPct(props.poverty), fmtPct(props.aged_65), fmtPct(props.uninsured), props.svi.toFixed(2)];
            const row = document.createElement('tr');
            row.append(...values.map(value => {const cell = document.createElement('td'); cell.textContent = value; return cell;}));
            return row;
        }));
    });
})();
