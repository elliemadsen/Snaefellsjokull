// Video grid with the 3D viewer (../Model/main.js) as an overlay, and a hidden menu.
// The video list is written by update_videos.py from the Are.na board.

const VIDEOS = 'data/videos.json';
const COLUMNS = 4;          // tiles per row (12 videos: a 4 × 3 grid)
const NARROW_COLUMNS = 2;   // on screens narrower than NARROW_PX, or taller than wide
const NARROW_PX = 700;
const RETRY_MS = 3000;      // a video that errors is reloaded once after this long; if it errors again it's removed

const grid = document.getElementById('grid');
const view = document.getElementById('view');
const menu = document.getElementById('menu');
const menuButton = document.getElementById('menu-button');
const overlayOn = document.getElementById('overlay-on');
const videoCount = document.getElementById('video-count');

let tiles = [];

// Rows of tiles that fill the window. When the last row is shorter (e.g. 4, 4, 3 for 11 videos), the grid has as
// many columns as a common multiple of the row lengths and each tile spans its share, so every row fills the width.
// Only the tiles' spans change on resize: moving an iframe in the page would restart its video.
function layout() {
  const n = tiles.length;
  if (!n) return;
  const { clientWidth: w, clientHeight: h } = grid;
  const cols = Math.min(n, w < NARROW_PX || h > w ? NARROW_COLUMNS : COLUMNS);
  const rows = Math.ceil(n / cols);
  const lengths = Array.from({ length: rows }, (_, r) => Math.floor(n / rows) + (r < n % rows ? 1 : 0));
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const span = lengths.reduce((a, b) => (a * b) / gcd(a, b));

  grid.style.gridTemplateColumns = `repeat(${span}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  let i = 0;
  lengths.forEach((length) => {
    for (let k = 0; k < length; k++) tiles[i++].style.gridColumn = `span ${span / length}`;
  });

  // Each player gets its video's own shape (so YouTube adds no black bars), scaled to cover its tile
  for (const tile of tiles) {
    const { width, height } = tile.getBoundingClientRect();
    const aspect = Number(tile.dataset.aspect);
    const iframe = tile.firstElementChild;
    iframe.style.width = `${Math.ceil(Math.max(width, height * aspect))}px`;
    iframe.style.height = `${Math.ceil(Math.max(height, width / aspect))}px`;
  }
}

// YouTube's player API: lets the page loop the videos itself and notice the ones that won't play
function loadYouTubeApi() {
  return new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    document.head.append(Object.assign(document.createElement('script'), { src: 'https://www.youtube.com/iframe_api' }));
  });
}

function updateCount() {
  videoCount.textContent = `Videos: ${tiles.length} from YouTube, collected on Are.na`;
}

// Take a video that won't play (removed, private, not available here, not embeddable) out of the grid and credits
function removeVideo(tile, code) {
  console.warn(`Removed video ${tile.dataset.id} (YouTube error ${code})`);
  tiles = tiles.filter((t) => t !== tile);
  tile.remove();
  document.querySelector(`#video-list li[data-id="${tile.dataset.id}"]`)?.remove();
  updateCount();
  layout();
}

// Embedded straight from YouTube (nothing downloaded): muted so it can autoplay, no controls, looped by the page
function addPlayer(YT, tile, { id, title }) {
  let retried = false;
  const player = new YT.Player(tile.firstElementChild, {
    host: 'https://www.youtube-nocookie.com',
    videoId: id,
    playerVars: { autoplay: 1, mute: 1, controls: 0, playsinline: 1, rel: 0, iv_load_policy: 3, disablekb: 1 },
    events: {
      onReady: (event) => {
        event.target.getIframe().title = title;
        event.target.mute();
        event.target.playVideo();
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.ENDED) {
          event.target.seekTo(0);
          event.target.playVideo();
        }
      },
      onError: (event) => {
        if (retried) {
          removeVideo(tile, event.data);
          return;
        }
        retried = true;
        setTimeout(() => player.loadVideoById({ videoId: id, startSeconds: player.getCurrentTime?.() || 0 }), RETRY_MS);
      },
    },
  });
}

async function loadVideos() {
  const [{ board, videos }, YT] = await Promise.all([fetch(VIDEOS).then((r) => r.json()), loadYouTubeApi()]);
  tiles = videos.map(({ id, aspect }) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.id = id;
    tile.dataset.aspect = aspect || 16 / 9;
    tile.append(document.createElement('div')); // the player replaces this with its iframe
    return tile;
  });
  grid.append(...tiles);
  tiles.forEach((tile, i) => addPlayer(YT, tile, videos[i]));
  layout();
  new ResizeObserver(layout).observe(grid); // window resizes, full screen, etc.

  // Credits in the menu
  updateCount();
  const list = document.getElementById('video-list');
  for (const { id, url, title, channel } of videos) {
    const item = document.createElement('li');
    item.dataset.id = id;
    const link = Object.assign(document.createElement('a'), { href: url, target: '_blank', rel: 'noopener', textContent: title });
    item.append(link, ` · ${channel}`);
    list.append(item);
  }
  const boardLink = Object.assign(document.createElement('a'), { href: board, target: '_blank', rel: 'noopener', textContent: 'Are.na board' });
  const boardItem = document.createElement('p');
  boardItem.append(boardLink);
  list.after(boardItem);
}

// --- Menu
function setMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
}
menuButton.addEventListener('click', () => setMenu(menu.hidden));
document.addEventListener('keydown', (event) => {
  if (event.target.matches?.('input[type=text], textarea')) return;
  if (event.key === 'm' || event.key === 'M') setMenu(menu.hidden);
  if (event.key === 'Escape') setMenu(false);
});

// --- Overlay on/off. While it's off, the viewer stops drawing and the videos can be clicked.
function setOverlay() {
  view.hidden = !overlayOn.checked;
  menu.classList.toggle('overlay-off', !overlayOn.checked);
}
overlayOn.addEventListener('change', setOverlay);
setOverlay();

loadVideos().catch((error) => {
  console.error(error);
  grid.textContent = '';
  videoCount.textContent = 'Videos: could not load the video list or the YouTube player';
});
