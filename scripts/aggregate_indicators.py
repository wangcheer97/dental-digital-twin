#!/usr/bin/env python3
"""Population-weight tract indicators into Community1..7; run from any directory.
Dependencies: geopandas, pandas, shapely. Raw files stay outside version control.
"""
import argparse
import hashlib
import json
from pathlib import Path
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, shape

ROOT = Path(__file__).resolve().parents[1]
from community_counts import count_points
FIELDS = {'income': 'B19013_001E', 'poverty': 'EP_POV150', 'aged_65': 'EP_AGE65',
          'uninsured': 'EP_UNINSUR', 'svi': 'RPL_THEMES', 'no_vehicle': 'EP_NOVEH'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--svi', type=Path, default=ROOT / 'raw/svi_texas.csv')
    parser.add_argument('--acs', type=Path, default=ROOT / 'raw/acsdt5y2022-b19013.dat')
    parser.add_argument('--blocks', type=Path, default=ROOT / 'raw/blocks.zip')
    parser.add_argument('--population-blocks', type=Path, default=ROOT / 'raw/blocks_population.zip')
    args = parser.parse_args()
    patient_counts, patient_total = count_points('patient')
    out = ROOT / 'output'
    out.mkdir(exist_ok=True)
    features = json.loads((ROOT / 'data/college station.geojson').read_text())['features']
    regions = [(f['properties']['Enforce_Of'].replace('Community', 'Com'), shape(f['geometry'])) for f in features]
    density = json.loads((ROOT / 'data/density.geojson').read_text())['features']
    mapping = []
    for name, polygon in regions:
        match = min(density, key=lambda f: polygon.symmetric_difference(shape(f['geometry'])).area)
        delta = polygon.symmetric_difference(shape(match['geometry'])).area / polygon.area
        if delta > 0.00001:
            raise ValueError(f'{name}: unmatched density polygon ({delta})')
        mapping.append({'community': name, 'CE_Area_ID': match['properties']['CE_Area_ID'],
                        'relative_geometry_difference': delta})
    pd.DataFrame(mapping).to_csv(out / 'community_mapping.csv', index=False)
    svi = pd.read_csv(args.svi, dtype={'FIPS': str}).set_index('FIPS')
    if args.acs.suffix == '.json':
        values = json.loads(args.acs.read_text())
        acs = pd.DataFrame(values[1:], columns=values[0])
    elif args.acs.suffix == '.dat':
        acs = pd.read_csv(args.acs, sep='|', dtype=str)
        acs = acs[acs.GEO_ID.str.match(r'^1400000US48041[0-9]{6}$')].copy()
        acs['state'] = acs.GEO_ID.str[9:11]
        acs['county'] = acs.GEO_ID.str[11:14]
        acs['tract'] = acs.GEO_ID.str[14:]
        acs['B19013_001E'] = acs.B19013_E001
    else:
        acs = pd.read_csv(args.acs, dtype=str)
    acs['FIPS'] = acs['state'] + acs['county'] + acs['tract']
    tract = svi.join(acs.set_index('FIPS')[['B19013_001E']], how='outer')
    for field in FIELDS.values():
        tract[field] = pd.to_numeric(tract[field], errors='coerce')
        tract.loc[tract[field] < 0, field] = float('nan')
    for key, field in FIELDS.items():
        if key != 'income' and (tract[field].dropna() > (1 if key == 'svi' else 100)).any():
            raise ValueError(f'Out-of-range {field}')
    blocks = gpd.read_file(args.blocks)
    if 'POP20' not in blocks:
        population_blocks = gpd.read_file(args.population_blocks, bbox=tuple(blocks.total_bounds), columns=['GEOID20', 'POP20'])
        population_blocks = population_blocks[['GEOID20', 'POP20']]
        blocks = blocks.merge(population_blocks, on='GEOID20', how='left', validate='one_to_one')
        if blocks.POP20.isna().any():
            raise ValueError('Population missing for original 2020 block GEOIDs')
    points = gpd.GeoDataFrame(blocks.drop(columns='geometry'), geometry=gpd.points_from_xy(
        pd.to_numeric(blocks.INTPTLON20), pd.to_numeric(blocks.INTPTLAT20)), crs='EPSG:4326')
    def assign(point):
        matches = [name for name, polygon in regions if polygon.covers(point)]
        if len(matches) > 1:
            raise ValueError(f'Ambiguous boundary point {point}')
        return matches[0] if matches else None
    points['community'] = points.geometry.map(assign)
    points['FIPS'] = points.GEOID20.str[:11]
    points['POP20'] = pd.to_numeric(points.POP20, errors='raise')
    selected = points[points.community.notna()].merge(tract[list(FIELDS.values())], left_on='FIPS', right_index=True, how='left', validate='many_to_one')
    facilities = json.loads((ROOT / 'data/facility.geojson').read_text())['features']
    facility_regions = [assign(shape(f['geometry'])) for f in facilities]
    rows, contributions = [], []
    for i, (name, polygon) in enumerate(regions):
        group = selected[selected.community == name]
        population = int(group.POP20.sum())
        if population <= 0:
            raise ValueError(f'{name}: no population')
        row = {'community': name, 'patient_count': patient_counts[name], 'patient_synthetic_pct': patient_counts[name] / patient_total * 100, 'population_2020': population,
               'block_count': len(group), 'tract_count': group.FIPS.nunique(), 'facility_count': facility_regions.count(name)}
        row['facilities_per_10000'] = row['facility_count'] / population * 10000
        for key, field in FIELDS.items():
            valid = group[field].notna()
            weight = group.loc[valid, 'POP20'].sum()
            row[key] = (group.loc[valid, field] * group.loc[valid, 'POP20']).sum() / weight if weight else float('nan')
            row[key + '_population_coverage'] = weight / population
            if weight < population:
                print(f'WARNING {name}: {key} coverage {weight / population:.1%}')
        rows.append(row)
        for fips, pop in group.groupby('FIPS').POP20.sum().items():
            contributions.append({'community': name, 'tract_geoid': fips, 'population': int(pop), 'population_share': pop / population})
        print(f'{name}: population={population:,}, blocks={len(group)}, tracts={group.FIPS.nunique()}, facilities={row["facility_count"]}')
    pd.DataFrame(rows).to_csv(out / 'community_indicators.csv', index=False)
    pd.DataFrame(contributions).to_csv(out / 'tract_contributions.csv', index=False)
    def fmt(value, spec, suffix=''):
        return format(value, spec) + suffix if pd.notna(value) else 'N/A'
    html = []
    for row in rows:
        cells = [row['community'], str(row['patient_synthetic_pct']) + '%', fmt(row['income']/1000, '.0f', 'k'),
                 fmt(row['poverty'], '.0f', '%'), fmt(row['aged_65'], '.0f', '%'), fmt(row['uninsured'], '.0f', '%'), fmt(row['svi'], '.2f')]
        html.append('<tr>' + ''.join('<td>' + c + '</td>' for c in cells) + '</tr>')
    (out / 'panelD_rows.html').write_text('\n'.join(html) + '\n')
    labels = {'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': {'name': name}, 'geometry': {'type': 'Point', 'coordinates': list(polygon.representative_point().coords[0])}}
        for name, polygon in regions]}
    (ROOT / 'data/community_labels.js').write_text('window.COMMUNITY_LABELS = ' + json.dumps(labels) + ';\n')
    manifest = {'inputs': {str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in [args.svi, args.acs, args.blocks, args.population_blocks]},
                'total_population': sum(r['population_2020'] for r in rows), 'facilities_outside_regions': facility_regions.count(None),
                'method': '2020 block internal points in WGS84; POP20 weighted tract estimates; negative sentinels excluded per indicator; SVI rank reference follows input file.'}
    (out / 'aggregation_manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps(manifest, indent=2))
    from export_community_maps import main as export_maps
    export_maps()


if __name__ == '__main__':
    main()
