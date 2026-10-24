"""Independent point-in-polygon verification for the shared browser counts."""
import json
from pathlib import Path
from shapely.geometry import shape
ROOT = Path(__file__).resolve().parents[1]

def count_points(source):
    regions = [(f['properties']['Enforce_Of'].replace('Community', 'Com'), shape(f['geometry']))
               for f in json.loads((ROOT / 'data/college station.geojson').read_text())['features']]
    counts = {name: 0 for name, _ in regions}
    features = json.loads((ROOT / f'data/{source}.geojson').read_text())['features']
    for feature in features:
        hits = [name for name, region in regions if region.covers(shape(feature['geometry']))]
        if len(hits) != 1:
            raise ValueError(f'{source}: expected exactly one community, got {hits}')
        counts[hits[0]] += 1
    return counts, len(features)
