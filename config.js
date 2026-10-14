/*
  ✿ Edit everything in here ✿
  - name:        what the site calls her
  - hitsToBreak: how many baguette whacks before the cake breaks
  - from:        how you sign the letter
  - intro:       the little message on the start screen
  - letter:      each string is one paragraph
  - background / sprite: image files in /assets (sprite is made by tools/pixelate.py)
*/
window.BIRTHDAY = {
  name: "Soap",
  hitsToBreak: 10,
  from: "me",
  cakeName: "Sungsimdang strawberry cake",
  intro: "I couldn't be there today, so little you is on a mission: grab the baguette and smash this giant Sungsimdang strawberry cake.",
  letter: [
    "Happy birthday, my love. I'm so sorry I can't be there with you today, so I built you a tiny corner of the internet instead (and yes, I made you beat up a cake with bread to get here).",
    "I hope today is soft and slow and full of good food and people who love you almost as much as I do. You deserve every bit of it.",
    "Thank you for being the funniest, kindest, most beautiful person I know. Every day with you is my favorite day, and I can't wait to celebrate properly when I see you.",
    "Until then — eat some bread for me, and know that I'm thinking about you the whole time."
  ],
  background: "assets/party.jpg",
  sprite: "assets/kid.png",
  hand: [4, 53]   // where her hand is inside the sprite (pixels), the baguette goes here
};
