# Snæfellsjökull web

| Folder | Contents |
|---|---|
| `Model/` | 3D viewer of the elevation model with the glacier outlines |
| `Video/` | 4 × 3 grid of the YouTube videos from the Are.na board, with the 3D viewer as a white-wireframe overlay and a hidden menu |

Serve this folder over HTTP and open either page:

```sh
cd Snaefellsjokull/Web
python3 -m http.server 8000
```

- <http://localhost:8000/Model/>
- <http://localhost:8000/Video/>
