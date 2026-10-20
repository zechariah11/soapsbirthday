# sophia's birthday ♡

A tiny pixel-art birthday game in five stages, all in the same pixel party room. Princess
Sophia bakes a giant Sungsimdang strawberry cake:

1. **Strawberry Catch**: strawberries rain from the ceiling; she runs left/right with a bowl to
   catch them (dodging burnt toast). There's no timer and no way to lose: if she keeps missing,
   strawberries start falling closer to her.
2. **Fluffy Sponge**: the camera zooms into the oven. Press and hold to switch it on: the dials
   turn, the coils glow and a chiffon cake rises in its tube pan behind the glass. She lets go when
   its top reaches the gold line (too early = flat, too long = POOF, spilling over the pan). Each
   good one hops out of the door onto the cooling rack; three are needed. The target gets wider
   after every miss.
3. **Whipped Cream Showdown**: first person at the table, with Zech (in Korean Army uniform) across
   it pulling funny faces. Tap to add the cold cream, sugar and vanilla, then tap as fast as you
   can: the whisk turns as fast as she taps and the cream goes from liquid to foam to soft and
   stiff peaks. It looks like a close race, but he's quietly rubber-banded so she always wins.
   Then a short **cutscene**: she stacks the round cake layer by layer, one tap per layer.
4. **Icing on Top**: a close-up of the cake on the counter. Squeeze the piping bag on each dot round
   the edge, one swirl at a time; drag twelve strawberries out of the bowl onto the top (they slide
   into a pattern: halves round the edge like petals, a little flower of whole ones in the middle); then shake
   the sifter to dust it with sugar. Then the cake comes alive: Zech tries to run, a whipped-cream
   arm uncoils out of the cake, wraps round him, swings him up and drops him into the strawberries,
   and the cake gets hoisted up as a piñata.
5. **Piñata Cake Monster**: run under the hanging cake and tap to jump and whack it with a baguette
   (Zech yells tips from the top) until its HP bar is empty. It fights back: it swings about on its
   rope (wider and faster as it gets hurt), spits whipped cream at her (get hit and she's splattered
   and stunned for a moment), yanks itself up out of reach and slams back down, and at half HP it
   hides behind cream armour for a few seconds. There's still no way to lose. Once it bursts, the TV
   flickers on to show her age and the HAPPY BIRTHDAY banner comes down the wall. Zech tumbles out, they run to each other and hug, she levels
   up, and he hands her a letter… the wrong one (his whipping rematch request). Then the wrong one
   again (his denied leave request to come a week early). Then, finally, the real letter, with your
   song (see `song` below) or a little jazz-waltz "Happy Birthday".

The title screen also has a **♥ JUST READ MY LETTER** button: it skips the game (and the joke
letters) and opens the real letter straight away, with the same music, over the decorated room.
Closing it goes back to the title screen; ▶ PLAY THE GAME at the bottom of the letter starts stage 1.

Music is synthesised too (`js/music.js`) and loops seamlessly: a calm, Animal Crossing-ish room
theme (cake building, rescue, envelopes), a bouncy marimba tune for the strawberry catch, a cosy
music-box tune by the oven, a sporty race theme for the whipping battle, a dreamy one for the icing, a villain-riff-to-heroic-chorus battle theme from the moment the cake comes
alive, and for the real letter a jazz-waltz "Happy Birthday" (about 100 s per cycle, with new
vibraphone and flute solos each time round) that keeps playing while she reads. The ♪ button mutes it all.

All the art is drawn in code (`js/art.js`), so there are no image files to manage. Korean text uses
the Galmuri11 pixel font (`fonts/`, SIL Open Font License), which only loads when Hangul appears.

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
| `hitsToBreak`  | how many baguette hits the cake boss can take (default 8) |
| `bossName`     | the boss's name in the HP box |
| `startScreen`  | the message on the title card |
| `greeting`     | first line of the letter |
| `letter`       | the letter itself: a list of paragraphs |
| `signOff`, `from` | how the letter is signed |
| `song` | music for the real letter. Paste a Spotify link (in Spotify: Share → Copy Song Link), or the name of an audio file you put next to `index.html` (e.g. `"our-song.mp3"`). Leave it `""` for the built-in jazz-waltz "Happy Birthday" |
| `wrongLetters` | the joke letters he hands her first, in order (set to `[]` to skip them). Each has a `title`, a `style` (`"note"` or `"form"`), `lines` (a `- ` line becomes a bullet, `~~like this~~` is crossed out) or `fields` (rows of `["label", "value"]`), an optional `note`, `signature` and red `stamp`, and the `reaction` lines he says after snatching it back |

You can write `{name}`, `{age}` or `{opponent}` inside any text and it will be filled in
(`{NAME}` / `{OPPONENT}` give the name in capitals, like the battle text).

Tip: add `?stage=sponge`, `?stage=whip`, `?stage=bake`, `?stage=icing` or `?stage=boss` (or a number) to the address to jump straight to a stage
(handy for checking your edits).

About Spotify: the song plays in Spotify's own little player inside the letter. Browsers only let
it start by itself in some cases (it usually works in Chrome; on iPhones she may need to tap ▶).
If she isn't logged in to Spotify in that browser, Spotify only plays a 30-second preview. An
audio file in the repo always plays in full, but only use a recording you're allowed to share
publicly (e.g. one you made yourself), since the site is public.

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
