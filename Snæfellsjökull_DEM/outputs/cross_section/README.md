# Snæfellsjökull cross-sections

Vertical slices through the ice cap, made by `../cross_section.ipynb`. Each folder has the same three figures (combined, 1990s, 2026), the profile as a CSV, and a README explaining the line, the ice, the ELA lines and the thickness estimate.

| Folder | Line | Length | Ice along the line, 1999 → 2025 |
|---|---|---|---|
| [`w_e_summit/`](w_e_summit/README.md) | West to east through the summit | 7.1 km | 2.65 → 2.09 km (-21%) |
| [`ssw_nne_summit/`](ssw_nne_summit/README.md) | South-south-west to north-north-east through the summit, across the south tongue and the north-east lobe | 6.7 km | 3.99 → 2.40 km (-40%) |
| [`wnw_ese_north_flank/`](wnw_ese_north_flank/README.md) | West-north-west to east-south-east across the north flank | 7.4 km | 4.25 → 1.16 km (-73%) |

Shared by all lines:

| File | Contents |
|---|---|
| `snaefellsjokull_ela.csv` | Every ELA estimate: the 1990s and 2026 lines, by side of the mountain, and two comparison values |
| `snaefellsjokull_ice_thickness_estimate_10m_isn93.tif` | Estimated 2014 ice thickness (m) on the DEM grid; no-data `-9999` outside the ice |
