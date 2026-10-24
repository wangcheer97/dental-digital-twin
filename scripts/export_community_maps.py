"""Keep generated CSV counts, panel D fallback HTML and map indicators consistent."""
import csv
import html
import json
import math
from pathlib import Path
from community_counts import count_points
ROOT = Path(__file__).resolve().parents[1]

def fmt_pct(value):
    value = float(value)
    return '<1%' if 0 < value < 1 else f'{math.floor(value + 0.5)}%'

def main():
    path = ROOT / 'output/community_indicators.csv'
    with path.open() as f:
        reader = csv.DictReader(f)
        fields = list(reader.fieldnames)
        rows = list(reader)
    patients, total = count_points('patient')
    facilities, _ = count_points('facility')
    if 'patient_count' not in fields:
        fields.append('patient_count')
    for row in rows:
        name = row['community']
        row['patient_count'] = patients[name]
        row['patient_synthetic_pct'] = patients[name] / total * 100 if total else 0
        row['facility_count'] = facilities[name]
        row['facilities_per_10000'] = facilities[name] / float(row['population_2020']) * 10000
    with path.open('w') as f:
        writer = csv.DictWriter(f, fieldnames=fields, lineterminator="\n")
        writer.writeheader(); writer.writerows(rows)
    by_name = {r['community']: r for r in rows}
    boundary = json.loads((ROOT / 'data/college station.geojson').read_text())
    for f in boundary['features']:
        name = f['properties']['Enforce_Of'].replace('Community', 'Com')
        row = by_name[name]
        f['properties'] = {'community': name, 'patient_count': patients[name], 'facility_count': facilities[name]}
        for field in ['income', 'poverty', 'aged_65', 'uninsured', 'svi']:
            f['properties'][field] = float(row[field]) if row[field] else None
    (ROOT / 'data/community_map_data.js').write_text('window.COMMUNITY_MAP_DATA = ' + json.dumps(boundary, allow_nan=False) + ';\n')
    formatted = []
    for row in rows:
        cells = [row['community'], fmt_pct(row['patient_synthetic_pct']), f"{math.floor(float(row['income']) / 1000 + .5)}k",
                 fmt_pct(row['poverty']), fmt_pct(row['aged_65']), fmt_pct(row['uninsured']), f"{float(row['svi']):.2f}"]
        formatted.append('<tr>' + ''.join('<td>' + html.escape(cell) + '</td>' for cell in cells) + '</tr>')
    (ROOT / 'output/panelD_rows.html').write_text('\n'.join(formatted) + '\n')
    summary = [{'community': n, 'patient_count': patients[n], 'patient_pct': patients[n] / total * 100, 'patient_display': fmt_pct(patients[n] / total * 100), 'facility_count': facilities[n]} for n in patients]
    with (ROOT / 'output/community_point_counts.csv').open('w') as f:
        writer = csv.DictWriter(f, fieldnames=list(summary[0]), lineterminator="\n"); writer.writeheader(); writer.writerows(summary)
    print('Verified point counts:', summary)

if __name__ == '__main__':
    main()
