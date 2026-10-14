# soap's birthday ♡

A tiny pixel-art birthday game. Little Soap wanders a pixel party room with a baguette and
battles a giant Sungsimdang strawberry cake boss. Every hit drains its HP bar. When it's
defeated, she levels up, a letter drops in, and an 8-bit "Happy Birthday" plays.

All the art is drawn in code (`js/art.js`), so there are no image files to manage.

## Editing the text: `config.json`
Everything personal lives in **`config.json`**. You can edit it right on GitHub (open the file,
click the ✏️ pencil, then **Commit changes**). The live site updates a minute later.

| field          | what it does |
|----------------|--------------|
| `name`         | her name (title screen, battle text, letter) |
| `age`          | the number on the TV, and she levels up to this age when she wins (set to `null` to hide) |
| `hitsToBreak`  | how many baguette hits the cake boss can take (default 5) |
| `bossName`     | the boss's name in the HP box |
| `startScreen`  | the message on the title card |
| `greeting`     | first line of the letter |
| `letter`       | the letter itself: a list of paragraphs |
| `signOff`, `from` | how the letter is signed |

You can write `{name}` or `{age}` inside any text and it will be filled in.

JSON is picky: keep the quotes, put commas between items, and don't leave a comma after the last
item in a list. If there's a typo, the title screen shows a red note saying what's wrong.

## Put it online (free, GitHub Pages)
1. On GitHub go to this repo → **Settings** → **Pages**.
2. Under **Build and deployment**, set Source to **Deploy from a branch**, pick the branch
   with this code and the `/ (root)` folder, then **Save**.
3. After a minute or two it's live at **https://zechariah11.github.io/soapsbirthday/**

## Preview locally
Run `python3 -m http.server` in this folder and open http://localhost:8000.
(Double-clicking `index.html` also works, but browsers block it from reading `config.json`,
so you'll see the built-in placeholder text instead of your letter.)
