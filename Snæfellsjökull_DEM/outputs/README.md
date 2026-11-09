# Snæfellsjökull DEM

10 m digital elevation model of Snæfellsjökull and its surroundings, cut from ÍslandsDEM v1.0
(Earth Engine asset `projects/ee-landmaelingar/assets/IslandsDEMv1_10m_isn93`) by `download_dem.ipynb`.

**Credit:** Landmælingar Íslands (National Land Survey of Iceland), ÍslandsDEM v1.0, built from ArcticDEM
(Polar Geospatial Center, University of Minnesota). Glacier outlines: Veðurstofa Íslands (Icelandic Met Office), CC-BY 4.0.

## Files

| File | Contents |
|---|---|
| `snaefellsjokull_dem_10m_isn93.tif` | Elevation (m), float32, no-data -9999 |
| `snaefellsjokull_hillshade_10m_isn93.tif` | Hillshade 0–255, light from the northwest |
| `snaefellsjokull_slope_10m_isn93.tif` | Slope (degrees) |
| `snaefellsjokull_dem_preview.png` | Preview map |
| `snaefellsjokull_glacier_elevation_stats.csv` | Elevation statistics inside the newest outline |

- Projection: ISN93 / Lambert 1993 (EPSG:3057), 10 m pixels on the original ÍslandsDEM grid
- Extent (ISN93): x 269760–277670, y 483450–491750 (791 x 830 pixels)
- Download area: the ~1890 glacier outline plus 1000 m
- A heightmap copy for the 3D viewer is in `Snaefellsjokull/Web/Model/data/`

## Glacier elevation statistics

| Statistic | Value |
|---|---|
| outline_layer | glaciology:glacierpolygon_sent2_2025 |
| glacier_area_km2 | 7.82 |
| min_elev_m | 714.2 |
| p10_elev_m | 877.5 |
| median_elev_m | 1079.5 |
| mean_elev_m | 1079.3 |
| p90_elev_m | 1283.9 |
| max_elev_m | 1399.8 |

## Caveats

Each DEM pixel is the median of ArcticDEM elevations from several years (mostly 2012 to about 2020, some from 2008),
so the glacier surface is a blend of those years, not a single date. Don't use it to measure glacier thinning.
The vertical datum is not stated in the catalogue; values appear to be heights above sea level.
