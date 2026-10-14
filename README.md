# happy birthday, soap ♡

A little birthday site: her face follows your mouse (or finger), you whack a heart piñata
until it cracks open, and a letter pops out.

## Make it yours
1. **Add her photo:** upload it to the `images/` folder as `images/her.jpg`
   (a close-up of her face works best; it's cropped to a circle).
   Until then a cute placeholder face is shown.
2. **Write the letter:** edit `config.js`. You can change her name, the photo filename,
   how many hits it takes to break, how you sign off, and the letter paragraphs.

## Put it online (free, GitHub Pages)
1. On GitHub go to this repo → **Settings** → **Pages**.
2. Under **Build and deployment**, set Source to **Deploy from a branch**, pick the branch
   with this code and the `/ (root)` folder, then **Save**.
3. After a minute or two it's live at **https://zechariah11.github.io/soapsbirthday/**

## Preview locally
Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit
http://localhost:8000.
