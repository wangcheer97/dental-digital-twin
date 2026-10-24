#!/usr/bin/env python3
"""Download official source files, then run aggregate_indicators.py separately."""
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'svi_texas.csv': 'https://svi.cdc.gov/Documents/Data/2022/csv/states/Texas.csv',
    'acsdt5y2022-b19013.dat': 'https://www2.census.gov/programs-surveys/acs/summary_file/2022/table-based-SF/data/5YRData/acsdt5y2022-b19013.dat',
    'blocks.zip': 'https://www2.census.gov/geo/tiger/TIGER2020PL/STATE/48_TEXAS/48041/tl_2020_48041_tabblock20.zip',
    'blocks_population.zip': 'https://www2.census.gov/geo/tiger/TIGER2025/TABBLOCK20/tl_2025_48_tabblock20.zip',
}

if __name__ == '__main__':
    raw = ROOT / 'raw'
    raw.mkdir(exist_ok=True)
    for name, url in SOURCES.items():
        target = raw / name
        if target.exists():
            print('Already downloaded:', name)
            continue
        print('Downloading:', name)
        data = urllib.request.urlopen(url, timeout=180).read()
        if data.lstrip().startswith(b'<'):
            raise ValueError(f'{url}: HTML returned instead of data')
        if name.endswith('.zip') and not data.startswith(b'PK'):
            raise ValueError(f'{url}: invalid ZIP')
        target.write_bytes(data)
