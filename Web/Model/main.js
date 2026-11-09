// 3D viewer for the Snæfellsjökull DEM.
// Reads the heightmap and outlines written by Snaefellsjokull/Snæfellsjökull_DEM/download_dem.ipynb (section 9).
// Also used by ../Video/, which loads this script with its own VIEWER_OPTIONS.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

// Data paths are relative to this script, so pages in other folders can load it too
const DATA = new URL('data/snaefellsjokull_dem', import.meta.url).href;
const OUTLINES = new URL('data/snaefellsjokull_outlines.json', import.meta.url).href;

// A page can set window.VIEWER_OPTIONS before loading this script to change these.
// background: null makes the background transparent, so the page shows through.
const OPTIONS = { background: '#ffffff', wireframeColor: '#000000', mode: 'shaded', ...window.VIEWER_OPTIONS };

// Detail slider positions, coarse to fine: grid step in pixels
const DETAIL_STEPS = [8, 4, 2, 1];
// Recommended detail for each mode; the wireframe is unreadable at full detail
const DEFAULT_STEP = { shaded: 1, wireframe: 4 };

// Outlines float this far above the full-detail terrain (km), so they aren't hidden in it
const OUTLINE_LIFT_KM = 0.004;
const OUTLINE_WIDTH_PX = 1.2;
// Outlines older than this are left out (the ~1890 one is reconstructed from moraines, not mapped from photos)
const FIRST_OUTLINE_YEAR = 1945;

// Outline colour comes from the CSS variable in index.html, so the panel and the lines always match
const OUTLINE_COLOR = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--outline').trim());

const ui = {
  panel: document.getElementById('panel'),
  message: document.getElementById('message'),
  exag: document.getElementById('exag'),
  exagValue: document.getElementById('exag-value'),
  detail: document.getElementById('detail'),
  detailValue: document.getElementById('detail-value'),
  modes: document.querySelectorAll('input[name=mode]'),
  outlinesRow: document.getElementById('outlines-row'),
  outlinesOn: document.getElementById('outlines-on'),
  outlineSlider: document.getElementById('outline-slider'),
  outlineYear: document.getElementById('outline-year'),
  outlineArea: document.getElementById('outline-area'),
  outlineSource: document.getElementById('outline-source'),
};

async function loadDem() {
  const [metaResponse, binResponse] = await Promise.all([fetch(`${DATA}.json`), fetch(`${DATA}.bin`)]);
  if (!metaResponse.ok || !binResponse.ok) {
    throw new Error('missing data');
  }
  const meta = await metaResponse.json();
  const heights = new Float32Array(await binResponse.arrayBuffer());
  if (heights.length !== meta.width * meta.height) {
    throw new Error(`expected ${meta.width * meta.height} heights, got ${heights.length}`);
  }
  // Outlines are optional: the viewer works without them
  const outlinesResponse = await fetch(OUTLINES).catch(() => null);
  const outlines = outlinesResponse && outlinesResponse.ok
    ? (await outlinesResponse.json()).outlines.filter((o) => o.year >= FIRST_OUTLINE_YEAR) : [];
  return { meta, heights, outlines };
}

// Scene layout shared by the terrain and the outlines. Units are kilometres; x = east, z = south, y = up.
// The grid is centred on the middle of the full-detail grid, so every detail level lines up.
function sceneFrame(meta) {
  const km = meta.pixel_m / 1000;
  return { km, halfW: ((meta.width - 1) * km) / 2, halfH: ((meta.height - 1) * km) / 2 };
}

// Build a terrain mesh from every `step`-th pixel.
function buildGeometry({ meta, heights }, step) {
  const cols = Math.floor((meta.width - 1) / step) + 1;
  const rows = Math.floor((meta.height - 1) / step) + 1;
  const { km, halfW, halfH } = sceneFrame(meta);

  const positions = new Float32Array(cols * rows * 3);
  let p = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let h = heights[r * step * meta.width + c * step];
      if (!(h > meta.nodata + 1)) h = meta.min_m; // no-data: drop to the lowest point
      positions[p++] = c * step * km - halfW;
      positions[p++] = (h - meta.min_m) / 1000;
      positions[p++] = r * step * km - halfH; // row 0 is north, so north is -z
    }
  }

  const index = new Uint32Array((cols - 1) * (rows - 1) * 6);
  let i = 0;
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = a + cols;
      const e = d + 1;
      index[i++] = a; index[i++] = d; index[i++] = b;
      index[i++] = b; index[i++] = d; index[i++] = e;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  geometry.computeVertexNormals();
  return geometry;
}

// Height (m) at a fractional pixel position, interpolated between the four nearest pixels
function heightAt({ meta, heights }, col, row) {
  const c = Math.min(Math.max(col, 0), meta.width - 1.001);
  const r = Math.min(Math.max(row, 0), meta.height - 1.001);
  const c0 = Math.floor(c), r0 = Math.floor(r);
  const fc = c - c0, fr = r - r0;
  const at = (rr, cc) => {
    const h = heights[rr * meta.width + cc];
    return h > meta.nodata + 1 ? h : meta.min_m;
  };
  const top = at(r0, c0) * (1 - fc) + at(r0, c0 + 1) * fc;
  const bottom = at(r0 + 1, c0) * (1 - fc) + at(r0 + 1, c0 + 1) * fc;
  return top * (1 - fr) + bottom * fr;
}

// One draped line per outline ring. Points are added every pixel along each edge, so the line follows the terrain.
function buildOutlines(dem) {
  const { meta } = dem;
  const { km, halfW, halfH } = sceneFrame(meta);
  const { left, top } = meta.bounds;
  const group = new THREE.Group();
  const years = [];

  dem.outlines.forEach((outline) => {
    const material = new LineMaterial({ color: OUTLINE_COLOR, linewidth: OUTLINE_WIDTH_PX });
    const lines = [];

    for (const ring of outline.rings) {
      const positions = [];
      for (let k = 0; k < ring.length - 1; k++) {
        // ISN93 metres to fractional pixel column/row (pixel centres at .5)
        const [ax, ay] = ring[k], [bx, by] = ring[k + 1];
        const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / meta.pixel_m));
        for (let s = 0; s < steps; s++) {
          const x = ax + ((bx - ax) * s) / steps;
          const y = ay + ((by - ay) * s) / steps;
          const col = (x - left) / meta.pixel_m - 0.5;
          const row = (top - y) / meta.pixel_m - 0.5;
          const h = heightAt(dem, col, row);
          positions.push(col * km - halfW, (h - meta.min_m) / 1000 + OUTLINE_LIFT_KM, row * km - halfH);
        }
      }
      positions.push(positions[0], positions[1], positions[2]); // close the ring

      const geometry = new LineGeometry();
      geometry.setPositions(positions);
      const line = new Line2(geometry, material);
      line.computeLineDistances();
      group.add(line);
      lines.push(line);
    }
    years.push({ outline, material, lines });
  });

  return { group, years };
}

function formatDate(outline) {
  return new Date(outline.date).toLocaleDateString('en-GB',
    { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function start(dem) {
  const container = document.getElementById('view');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: OPTIONS.background === null });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = OPTIONS.background === null ? null : new THREE.Color(OPTIONS.background);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 200);
  camera.position.set(0, 6.5, 9.5); // from the south, looking north

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.5, 0);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.02; // stay above the ground
  controls.minDistance = 1;
  controls.maxDistance = 40;

  // Light from the northwest, 45° up, as in the notebook's hillshade
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(-1, Math.SQRT2, -1);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  // Polygon offset pushes the terrain back slightly in depth, so outlines lying on it stay visible
  const terrainOffset = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
  const materials = {
    shaded: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, ...terrainOffset }),
    wireframe: new THREE.MeshBasicMaterial({ color: OPTIONS.wireframeColor, wireframe: true }),
  };

  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), materials.shaded);
  scene.add(mesh);

  const outlines = buildOutlines(dem);
  scene.add(outlines.group);

  let mode = 'shaded';
  let currentStep = null;

  function setDetail(step) {
    ui.detail.value = String(DETAIL_STEPS.indexOf(step));
    ui.detailValue.textContent = `${step * dem.meta.pixel_m} m`;
    if (step === currentStep) return;
    currentStep = step;
    mesh.geometry.dispose();
    mesh.geometry = buildGeometry(dem, step);
  }

  function setExaggeration(value) {
    mesh.scale.y = value;
    outlines.group.scale.y = value;
    ui.exagValue.textContent = `${Number(value).toFixed(1)}×`;
  }

  // Show the outline of the year under the slider, if the checkbox is ticked
  function setOutlines() {
    const on = ui.outlinesOn.checked;
    const index = Number(ui.outlineSlider.value);
    ui.outlinesRow.classList.toggle('off', !on);
    outlines.years.forEach(({ lines }, i) => {
      lines.forEach((line) => { line.visible = on && i === index; });
    });
    const { outline } = outlines.years[index];
    ui.outlineYear.textContent = outline.label;
    ui.outlineArea.textContent = `${outline.area_km2.toFixed(1)} km²`;
    ui.outlineSource.textContent = `${formatDate(outline)} · from ${outline.source}`;
  }

  function setLineResolution() {
    for (const { material } of outlines.years) {
      material.resolution.set(window.innerWidth, window.innerHeight);
    }
  }

  if (outlines.years.length) {
    const last = outlines.years.length - 1;
    ui.outlineSlider.max = String(last);
    ui.outlineSlider.value = String(last);
    document.getElementById('slider-first').textContent = outlines.years[0].outline.label;
    document.getElementById('slider-last').textContent = outlines.years[last].outline.label;
    ui.outlineSlider.addEventListener('input', () => {
      ui.outlinesOn.checked = true; // dragging the slider shows the outlines again
      setOutlines();
    });
    ui.outlinesOn.addEventListener('change', setOutlines);
    ui.outlinesRow.hidden = false;
    setLineResolution();
    setOutlines();
  }

  function setMode(value) {
    mode = value;
    mesh.material = materials[mode];
    setDetail(DEFAULT_STEP[mode]);
  }

  ui.modes.forEach((input) => input.addEventListener('change', () => setMode(input.value)));
  ui.exag.addEventListener('input', () => setExaggeration(ui.exag.value));
  ui.detail.addEventListener('input', () => setDetail(DETAIL_STEPS[Number(ui.detail.value)]));

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    setLineResolution();
  });

  ui.modes.forEach((input) => { input.checked = input.value === OPTIONS.mode; });
  setMode(OPTIONS.mode);
  setExaggeration(ui.exag.value);

  ui.message.remove();
  ui.panel.hidden = false;

  renderer.setAnimationLoop(() => {
    if (container.hidden) return; // the page has turned the viewer off
    controls.update();
    renderer.render(scene, camera);
  });
}

loadDem()
  .then(start)
  .catch((error) => {
    console.error(error);
    ui.message.textContent =
      'Could not load the elevation data.\n\n' +
      '1. Run Snaefellsjokull/Snæfellsjökull_DEM/download_dem.ipynb (it writes Snaefellsjokull/Web/Model/data/).\n' +
      '2. Serve Snaefellsjokull/Web/ over HTTP, e.g. `python3 -m http.server` there,\n' +
      '   then open http://localhost:8000/Model/. Opening index.html directly from disk will not work.';
  });
