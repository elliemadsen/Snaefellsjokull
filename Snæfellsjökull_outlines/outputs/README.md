# Snæfellsjökull glacier outlines

Mapped outlines of Snæfellsjökull (GLIMS ID G336220E64811N), downloaded from the Icelandic Meteorological Office
web feature service (https://geo.vedur.is/geoserver/wfs) by `download_outlines.ipynb`.

**License and attribution:** the outlines are published under CC-BY 4.0. Credit:
*Veðurstofa Íslands (Icelandic Meteorological Office)*. For outlines up to 2019, also cite Hannesdóttir et al. (2020),
A national glacier inventory and variations in glacier extent in Iceland from the Little Ice Age maximum to 2019,
*Jökull* 70, 1–34.

| Year | Source date | Source | Area (km²) | File |
|---|---|---|---|---|
| ~1890 | 1890-01-01 | geomorphology | 24.97 | `outlines/snaefellsjokull_1890.geojson` |
| 1945 | 1945-09-16 | AMS aerial images | 13.87 | `outlines/snaefellsjokull_1945.geojson` |
| 1979 | 1979-07-22 | aerial images NLSI | 13.90 | `outlines/snaefellsjokull_1979.geojson` |
| 1999 | 1999-08-08 | aerial images Loftmyndir ehf | 12.66 | `outlines/snaefellsjokull_1999.geojson` |
| 2008 | 2008-09-02 | lidar | 10.09 | `outlines/snaefellsjokull_2008.geojson` |
| 2014 | 2014-10-07 | ArcticDEM | 9.24 | `outlines/snaefellsjokull_2014.geojson` |
| 2017 | 2017-07-27 | Aerial images Loftmyndir ehf | 9.03 | `outlines/snaefellsjokull_2017.geojson` |
| 2019 | 2019-09-30 | Sentinel-2A | 8.72 | `outlines/snaefellsjokull_2019.geojson` |
| 2021 | 2021-08-13 | Sentinel-2A | 8.62 | `outlines/snaefellsjokull_2021.geojson` |
| 2023 | 2023-08-24 | Sentinel-2A | 8.25 | `outlines/snaefellsjokull_2023.geojson` |
| 2025 | 2025-09-03 | Sentinel-2A | 7.83 | `outlines/snaefellsjokull_2025.geojson` |

## Files

- `outlines/`: one GeoJSON per year, WGS84 (EPSG:4326)
- `snaefellsjokull_outlines_all_years.gpkg`: all years in one layer, ISN93 (EPSG:3057)
- `snaefellsjokull_outline_areas.csv`: area table
- `snaefellsjokull_outlines_map.png`, `snaefellsjokull_area_chart.png`: figures
- `snaefellsjokull_outlines.gif`: animation; `snaefellsjokull_outlines_frames/`: its frames as PNGs (1.png = earliest year)

Areas are calculated in ISN93 and can differ from published values in the second decimal place.
The ~1890 outline is reconstructed from moraines (Little Ice Age maximum), so it is less precise than later outlines.
