# Snæfellsjökull videos

The YouTube videos from the Are.na board [Snæfellsjökull](https://www.are.na/ellie-madsen-t_ijbndszli/snaefellsjokull) in a grid that fills the window, with the 3D model from `../Model/` drawn over them as a white wireframe.

Nothing is downloaded: each video is embedded from YouTube (`youtube-nocookie.com`) through YouTube's player API, muted (browsers only autoplay muted video) and looping. The grid has 4 columns (2 on narrow or portrait screens): 12 videos make a 4 × 3 grid. Each tile is cropped to fill its cell.

## Videos that won't play

- **Left out by hand:** `EXCLUDE` in `update_videos.py` lists videos on the board to leave out, with the reason. At the moment that's "Snæfellsjökull first half" (`eJbKVdOyYh0`), which shows "This video is not currently available" when embedded.
- **Caught on the page:** if YouTube reports an error, the video is reloaded once after 3 s. If it fails again it's taken out of the grid and the credits, and the grid re-flows. The browser console logs which one was removed.

## Run it

Serve `Snaefellsjokull/Web/` (not just this folder: the page loads `../Model/main.js` and its data) and open <http://localhost:8000/Video/>:

```sh
cd Snaefellsjokull/Web
python3 -m http.server 8000
```

The page needs internet access for YouTube and three.js. Opening `index.html` straight from disk won't work.

## Hidden menu

Press **M**, or click the top-left corner of the window (a ≡ appears on hover). **Esc** closes it.

- **3D overlay:** shows or hides the model. While it's off the model stops drawing and the videos can be clicked.
- The model's own settings, as in `../Model/`: shaded or wireframe, vertical exaggeration, detail, glacier outlines and year.
- Credits for the terrain, outlines and each video.

The overlay starts as a white wireframe at 40 m detail. To change that, edit `window.VIEWER_OPTIONS` in `index.html`.

## Updating the videos

`data/videos.json` lists the videos: YouTube id, link, title, channel, shape (width / height) and the Are.na block it came from. To pick up videos added to the board since:

```sh
python3 update_videos.py
```

It reads the board through the Are.na API and keeps every YouTube link it finds, in board order. It skips the videos in `EXCLUDE` and any that have been removed or can't be embedded, and lists what it skipped. It needs only the Python standard library.

## Files

| File | Contents |
|---|---|
| `index.html` | Layout, styles, the menu, and the 3D viewer's settings |
| `video.js` | Builds the grid and the players, loops them, drops videos that won't play, runs the menu and the overlay switch |
| `update_videos.py` | Collects the videos from the Are.na board into `data/videos.json` |
| `data/videos.json` | The video list |

Videos belong to their creators on YouTube; their titles and channels are listed in the menu and in `data/videos.json`.
