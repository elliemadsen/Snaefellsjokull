"""Collect the YouTube videos on the Are.na board and write them to data/videos.json.

Run it again whenever videos are added to the board:

    python3 update_videos.py

Only the Python standard library is needed. The videos are not downloaded: the page embeds them from YouTube.
"""
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

CHANNEL = "snaefellsjokull"  # the board's slug, from https://www.are.na/ellie-madsen-t_ijbndszli/snaefellsjokull
BOARD_URL = "https://www.are.na/ellie-madsen-t_ijbndszli/snaefellsjokull"
OUT = Path(__file__).parent / "data" / "videos.json"

# Videos on the board to leave out: YouTube id → why. The page also drops any video that won't play,
# but listing it here keeps it out of the grid and the credits from the start.
EXCLUDE = {
    "eJbKVdOyYh0": "Snæfellsjökull first half: shows 'not currently available' when embedded (Nov 2026)",
}

YOUTUBE_ID = re.compile(r"(?:youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/|live/)|youtu\.be/)([\w-]{11})")


def get_json(url):
    # Are.na refuses Python's default user agent
    request = urllib.request.Request(url, headers={"User-Agent": "snaefellsjokull-video-grid/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def board_blocks():
    """Every block on the board, in board order."""
    blocks, page = [], 1
    while True:
        data = get_json(f"https://api.are.na/v2/channels/{CHANNEL}/contents?per=100&page={page}")
        blocks += data["contents"]
        if len(data["contents"]) < 100:
            return blocks
        page += 1


def youtube_info(url):
    """Title and channel from YouTube's oEmbed; None if the video is gone or can't be embedded."""
    try:
        return get_json("https://www.youtube.com/oembed?format=json&maxwidth=1920&maxheight=1920&url=" + urllib.parse.quote(url))
    except Exception:
        return None


videos, skipped = [], []
for block in board_blocks():
    url = (block.get("source") or {}).get("url") or ""
    match = YOUTUBE_ID.search(url)
    if not match:
        continue
    video_id = match.group(1)
    if any(v["id"] == video_id for v in videos):
        continue
    if video_id in EXCLUDE:
        skipped.append(f"{url} ({EXCLUDE[video_id]})")
        continue
    info = youtube_info(f"https://www.youtube.com/watch?v={video_id}")
    if info is None:
        skipped.append(f"{url} (removed or not embeddable)")
        continue
    videos.append({
        "id": video_id,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "title": info["title"],
        "channel": info["author_name"],
        "aspect": round(info["width"] / info["height"], 4),  # width / height of the video, e.g. 1.7778 or 1.3333
        "arena_block": block["id"],
    })

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"board": BOARD_URL, "videos": videos}, indent=2, ensure_ascii=False) + "\n",
               encoding="utf-8")
print(f"wrote {len(videos)} videos to {OUT}")
for url in skipped:
    print(f"  skipped: {url}")
