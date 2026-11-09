# Snæfellsjökull

| Folder                     | Contents                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Snæfellsjökull_outlines/` | Glacier outlines ~1890–2025 with areas, a map and an animation                                              |
| `Snæfellsjökull_DEM/`      | Elevation model (ÍslandsDEM, 10 m), estimated ice thickness and ELA, and cross-sections through the ice cap |
| `Snæfellsjökull_imagery/`  | Satellite imagery (Landsat, Sentinel-2) and historical aerial photos                                        |
| `Web/`                     | 3D viewer of the elevation model with the outlines.                                                         |

### Running the notebooks

The notebooks use two conda environments: `gee` for the ones that call Google Earth Engine (the imagery notebooks), and `geo` for the rest. Run `Snæfellsjökull_outlines` first, then `Snæfellsjökull_DEM/download_dem.ipynb`, as the later notebooks read their outputs.
