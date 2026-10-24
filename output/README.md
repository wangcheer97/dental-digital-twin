# Panel D real community indicators

Reproduce from the project root:

```sh
python3 -m pip install -r scripts/requirements.txt
python3 scripts/download_indicators.py
python3 scripts/aggregate_indicators.py
```

Source URLs are recorded in `scripts/download_indicators.py`; input SHA256 hashes
are in `aggregation_manifest.json`. Raw downloads are ignored by git.

- ACS 2018–2022 five-year B19013_E001 comes from the official table-based
  summary file (equivalent to API B19013_001E). The API required a key.
- CDC/ATSDR SVI 2022 Texas tract CSV uses Texas-relative percentile rankings.
  The panel reports weighted tract ranks, not newly calculated community ranks.
- Original 2020PL block internal points determine membership. That file has no
  POP20. POP20 is joined by GEOID20 from the 2025 TIGER TABBLOCK20 release;
  this field still represents 2020 Census population, not 2025 population.
  All 3462 original county block IDs matched. Aggregation uses only the 1158
  blocks whose internal points fall within the seven service areas.
- Every indicator excludes negative sentinels independently and renormalizes
  population weights over valid data. Coverage is exported per indicator.
  Com7 has 3 people with unavailable tract values (16341/16344 valid).
- Weighted tract household medians approximate community income; they are not
  community household medians. Percentages also follow the task's common
  population weighting rather than indicator-specific population denominators.
- Facility counts use the 27 supplied point geometries. Patient shares now derive from synthetic point counts, and chart B uses those
  same counts. Chart C retains its synthetic series. Officer labels are TAMU.

`community_indicators.csv`: unrounded indicators, coverage, population and facilities.
`tract_contributions.csv`: all assigned tract population contributions (including
zero-population contributions). `community_mapping.csv`: geometry-based ID audit.
`panelD_rows.html`: formatted rows embedded verbatim in index.html. After rerunning,
replace the contents of `<tbody id="panelD-rows">` with these generated rows.

Validation: numeric ranges, population and facility totals, seven-by-seven HTML
and exact generated-row agreement, active JavaScript syntax and unchanged B/C
chart source checked. Browser local-file preview was blocked by browser policy;
visual overflow, Mapbox rendering and screenshots still require manual review.
No Word manuscript was present; Figure 1 was not replaced. Preview artifacts are local and excluded from deployment.


Task 2 supersedes the original synthetic Patient percentages. The browser
recomputes point assignments on every load; `community_point_counts.csv` is the
independently checked Python export. `export_community_maps.py` updates CSV
patient counts/shares, polygon counts, and HTML fallback rows together.
