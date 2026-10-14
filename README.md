# soap's birthday ♡

A tiny pixel-art birthday game. Little Soap (pixelated from a childhood photo) runs around
a pixelated party room with a baguette and whacks a giant hanging Sungsimdang strawberry
cake (딸기시루) until it bursts. Then a letter drops in, typed out RPG-style, and an 8-bit
"Happy Birthday" plays.

Controls: move the mouse to walk and click (or press space) to swing. On a phone, drag to walk
and tap to swing. She also swings on her own when the cake is in reach.

## Make it yours
- **Letter, name, sign-off, number of hits:** edit `config.js`.
- **Background:** `assets/party.jpg`. It's pixelated in the browser automatically.
- **Her sprite:** `assets/kid.png` was generated from a photo with:
  ```
  python3 tools/pixelate.py path/to/photo.jpg assets/kid.png 96
  ```
  (needs `pip install pillow numpy`; works best on a photo with a plain background).
  If you change the sprite, update `hand` in `config.js` to where her hand is.

## Put it online (free, GitHub Pages)
1. On GitHub go to this repo → **Settings** → **Pages**.
2. Under **Build and deployment**, set Source to **Deploy from a branch**, pick the branch
   with this code and the `/ (root)` folder, then **Save**.
3. After a minute or two it's live at **https://zechariah11.github.io/soapsbirthday/**

## Preview locally
Run `python3 -m http.server` in this folder and visit http://localhost:8000.
