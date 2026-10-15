# soap's birthday ♡

A tiny pixel-art birthday game in three stages, all in the same pixel party room. Princess
Soap bakes a giant Sungsimdang strawberry cake:

1. **Strawberry Catch**: strawberries rain from the ceiling; she runs left/right with a bowl to
   catch them (dodging burnt toast). There's no timer and no way to lose: if she keeps missing,
   strawberries start falling closer to her.
2. **Whipped Cream Showdown**: a tap-as-fast-as-you-can race against Zech (in Korean Army
   uniform). It looks like a close race, but he's quietly rubber-banded so she always wins.
3. **Cutscene**: she stacks the cake layer by layer, one tap per layer, then the cake
   comes alive, grabs Zech and sticks him on top, and gets hoisted up as a piñata.
4. **Piñata Cake Monster**: whack the hanging cake with a baguette (Zech yells for help from the
   top) until its HP bar is empty. Zech tumbles out, they run to each other and hug, she levels
   up, and he hands her the letter while an 8-bit "Happy Birthday" plays.

All the art is drawn in code (`js/art.js`), so there are no image files to manage.

## Editing the text: `config.json`
Everything personal lives in **`config.json`**. You can edit it right on GitHub (open the file,
click the ✏️ pencil, then **Commit changes**). The live site updates a minute later.

| field          | what it does |
|----------------|--------------|
| `name`         | her name (title screen, battle text, letter) |
| `age`          | the number on the TV, and she levels up to this age when she wins (set to `null` to hide) |
| `opponentName` | your name in the whipping battle |
| `strawberriesToCatch` | how many strawberries fill the bowl in stage 1 (default 15) |
| `whipTaps`     | how many taps it takes her to whip the cream in stage 2 (default 40) |
| `hitsToBreak`  | how many baguette hits the cake boss can take (default 5) |
| `bossName`     | the boss's name in the HP box |
| `startScreen`  | the message on the title card |
| `greeting`     | first line of the letter |
| `letter`       | the letter itself: a list of paragraphs |
| `signOff`, `from` | how the letter is signed |

You can write `{name}`, `{age}` or `{opponent}` inside any text and it will be filled in.

Tip: add `?stage=2`, `?stage=bake` or `?stage=3` to the address to jump straight to a stage
(handy for checking your edits).

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
