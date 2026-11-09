# Snæfellsjökull DEM viewer

A minimal 3D viewer for the Snæfellsjökull elevation model, built with [three.js](https://threejs.org/).

- **Shaded** or **wireframe** terrain
- Vertical exaggeration (1–3×, starts at 1×, true scale)
- Detail slider: 80 m, 40 m, 20 m or 10 m (full) grid. Switching mode picks a sensible default (10 m shaded, 40 m wireframe), which you can change.
- Glacier outlines from 1945 to 2025, draped on the terrain in red: a checkbox shows or hides them, and a slider steps through the years, showing each year's date, area and source. (The ~1890 outline is in the data file but left out of the viewer; set `FIRST_OUTLINE_YEAR` in `main.js` to include it.)

## Run it

1. Run `Snaefellsjokull/Snæfellsjökull_outlines/download_outlines.ipynb`, then `Snaefellsjokull/Snæfellsjökull_DEM/download_dem.ipynb`. Section 9 of the DEM notebook writes the heightmap and the outlines to `Snaefellsjokull/Web/Model/data/`. Without the outlines file the viewer still works, just without outlines.
2. Serve `Snaefellsjokull/Web/` over HTTP (serving the parent folder lets the video page in `../Video/` use this viewer too). Browsers block `fetch` from `file://` pages, so opening `index.html` directly won't work:

   ```sh
   cd Snaefellsjokull/Web
   python3 -m http.server 8000
   ```

3. Open <http://localhost:8000/Model/>.

three.js is loaded from the jsDelivr CDN, so the page needs internet access.

## Files

| File | Contents |
|---|---|
| `index.html` | Page layout, styles and controls |
| `main.js` | Loads the heightmap and builds the 3D terrain. Also used by `../Video/` (see below) |
| `data/snaefellsjokull_dem.bin` | Elevations, float32 little-endian, row by row from the north edge (written by the notebook) |
| `data/snaefellsjokull_dem.json` | Grid size, pixel size, elevation range and bounds (written by the notebook) |
| `data/snaefellsjokull_outlines.json` | Every mapped outline in ISN93 metres, with year, date, area and source (written by the notebook) |

## Details

- Units in the scene are kilometres: x points east, z points south, y is height above the lowest point in the area.
- The light comes from the northwest at 45°, matching the hillshade in the notebook.
- No-data pixels (`-9999`) are drawn at the lowest elevation. The default area has none.
- Other pages can reuse `main.js`: give them the same control ids as `index.html` and set `window.VIEWER_OPTIONS` before loading it. Options: `background` (a colour, or `null` for transparent), `wireframeColor`, `mode` (`'shaded'` or `'wireframe'`). Data paths are relative to `main.js`, so it works from any folder.
- Outlines are sampled from the full 10 m heightmap every 10 m along their edges and lifted 4 m, so they follow the terrain. At coarse detail (40–80 m) the shaded terrain can cover short stretches of them.

DEM: ÍslandsDEM v1.0, Landmælingar Íslands (National Land Survey of Iceland), built from ArcticDEM.
