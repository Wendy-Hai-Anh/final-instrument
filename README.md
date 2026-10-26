# Garden of Sounds

Garden of Sounds is a browser-based musical toy for toddlers. Children tap and drag gardening
tools, animals and fruits around an illustrated storybook garden to build layered music.

This repository holds the final instrument for Assignment 3. There are three versions of the
garden. Each one is a still picture with ten separate objects on it that can be moved and played,
and it fills the whole browser window.

## Structure

- `index.html` is a picture book that opens, turns and closes like a real one and fills as much
  of the window as it can. Tapping the cover opens it, the big arrows on its edges or a swipe
  turn the pages and the cross closes it. The title spread reads "Once upon a time, in a garden
  full of sounds..." across both pages, then each garden's whole picture runs across a spread of
  its own, with a small gold play button; tapping anywhere on it zooms into the garden. Upright
  screens show the whole book with the arrows underneath, and an upright phone is asked once to
  turn sideways. A small "For grown-ups" label, lettered like the cover, opens a panel on how to
  play, what children explore and how the toy keeps them safe. `style.css` lays out the book and
  `storybook.js` turns its pages, plays a welcome tune and a soft paper rustle, and zooms in and
  out of the gardens.
- `base.css` holds the colour tokens and picture buttons that every page shares, and the
  responsive scene, the objects and the visual feedback that every garden shares.
- `garden.js` holds the sound, the interaction and the guide that every garden shares.
- `button-press.js` gives every button its press, the key sinking into its shadow and springing
  back, and puts away the card that asks for an upright phone to be turned.
- `assets/textures/` holds the paper grain behind the page.
- `assets/storybook/` holds the book pictures: the teal backdrop, the closed cover, the inside of
  the cover, the back board, the ribbon, the spine rings, a left and a right page for each
  spread and the turn-sideways picture. `assets/buttons/` holds the home, arrow, close, play,
  pause and help buttons, the < and > keys to the other gardens, the floating note and the gold
  note bubble, the pointing hand, and the round chapter buttons
  (each a small picture of its garden, with a gold rim for the current one) and the path that
  joins them. Each square button is a raised picture that turns flat while it is pressed, as if
  it sank into its shadow, and springs back up on release (`button-press.js`); the garden button
  swaps between play and pause, and the guide uses shadowless up and right arrows. The buttons
  share the storybook palette: a cream paper key, warm brown lines and a gold shadow like the
  play button.
- `assets/fonts/` holds Fredoka, the rounded lettering of the book's title, used for the
  "For grown-ups" label and the guide's words.
- `versions/` holds one folder per garden:
  - `index.html` lists the objects and sets the garden's musical key and tempo. Its home button
    and chapter buttons lead back to the book, open on that garden's pages, and on to the other
    gardens, and the < and > keys halfway down its sides lead to the garden before and after it.
  - `style.css` sets the glow colour and where each object starts on every screen shape.
  - `assets/backgrounds/` holds the garden picture in three shapes: wide, tall (square and
    portrait windows) and phone. Each one keeps the original picture in the middle and continues
    the garden past its sides and into the sky, so it can fill windows of different shapes.
  - `assets/objects/` holds one picture for each object.

## Garden versions

All three gardens share the same painted gouache texture, and each has its own main colour, key
and tempo. They keep the same ten object IDs and play by the same rules.

- `versions/lakeside-picnic/` is pink, in C at 76 beats per minute: a bold-outlined lakeside
  meadow with a blossom tree and a picnic blanket.
- `versions/painted-orchard/` is golden orange, in D at 84 beats per minute: an orchard with no
  scenery outlines, tall foxgloves and rows of seedlings.
- `versions/flower-meadow/` is blue and green, in F at 92 beats per minute: a bug's-eye meadow
  with giant flowers, dandelion puffs and a fallen log that the snail, flowerpot and bird sit on.

## How it plays

The mapping and feedback come from peer testing of the eight Assignment 2 prototypes.

- **One piece of music.** Testers heard the garden as noise once several objects played, because
  each kept its own clock and roamed over three octaves. Now the whole garden keeps one beat at
  its own tempo and one slow round of chords, I, vi, IV and V, two bars each, and every note an
  object plays belongs to the chord of that moment. However many objects play, they play
  together, in time and in harmony.
- **Height picks the notes.** Prototype 1 changed the register in three steps, but a tester
  moved an object a little and heard nothing change, so height now picks one of eight rungs on a
  ladder of the chord's notes, from the bottom of the window to the top. Tools start an octave
  below the animals and fruits, so they sit under the melodies.
- **Every object has its own notes.** Each object plays only from its own small set of rungs above
  the one its height picks: the bird runs up and down four neighbouring notes, the butterfly
  leaps, the snail stays close to home and the rake marks the chord's root and its octave.
- **Left to right picks the speed.** Prototype 3's second axis now picks one of five rhythms laid
  on the shared beat, from long notes at the left to two notes a beat at the right, with two
  skipping three-three-two patterns between. Fruits keep to the slower ones. A singing object
  changes rhythm as it is dragged, and its sound pans gently with it.
- **The kind of object picks the sound family.** Gardening tools are soft drums, animals sing
  the melody and fruits are slow ambient textures.
- **Resting objects breathe.** Each one swells a little every few seconds, so a child can see
  what can be touched without any words. Playing objects stop, since every note moves them.
- **It looks like an instrument.** Testers took the garden for a picture to tidy and tried to
  put the fruit in the basket. Until an object has played, a small note in a gold bubble bobs at
  its corner, so every object says it makes music, and the bubble fades once the object has sung.
- **One tap is enough.** A tap starts the object singing straight away and another tap stops it;
  dragging starts playback before release, with pitch and rhythm following its position. It glows
  along its outline, adapted from Prototype 5.
- **Every note moves the object,** adapted from Prototype 8. Tools sway, animals hop and fruits
  swell, which reuses Prototype 4's grow-and-bounce as a repeating effect.
- **Playing objects glow.** A playing object keeps a faint, soft halo in the garden's colour
  that pulses gently with each note, and a small note floats up from it, so a child can see which objects
  are making music.
- **Play the whole garden.** The button in the top corner lets every object join in, one after
  another in a new random order each time and each on its next beat, so a child who taps nothing
  still hears the garden sing as one piece. While anything is playing the same button shows pause and stops it all.
- **A guide to play along with.** A tester watched the old demonstration and still did not know
  what to do, so the question-mark button now starts a guide. The garden dims, one animal is lit
  and a hand taps it with "Tap here!"; once the child taps it, the hand shows dragging it up or
  down, then to the right, to an arrow that stays in place; right rather than left, because a
  speed-up is heard at once while a slow-down takes a while to notice. Each step passes as soon
  as the animal comes most of the way to its arrow, even before the finger lifts. It starts by
  itself once across all gardens in the same browser, and the cross or Escape ends it.
- **One look.** The orchard and meadow objects have their outlines softened towards each
  garden's own deep colour, so they sit in those painterly pictures as the lakeside objects sit
  in its outlined one.
- **Hints.** When a garden opens, and after 20 seconds of quiet, the playable objects wiggle one
  after another, so they stand apart from the flowers, basket and lake in the picture.
- **Drop to place.** Putting an object down starts it singing from its new place, and a small
  ripple spreads across the ground, adapted from Prototype 6. Dragging starts the shared musical
  playback and gives immediate feedback when pitch or rhythm changes, using the same synth.
- **Controlled randomness.** Every tap makes the object a new short tune from its own set of
  notes, so the same object sounds different each time it is started but always like itself. The
  tune repeats as the object's own song, but each time round one note may swap for another from
  the set, with small changes in loudness, so it never quite repeats. Animals sometimes rest
  between notes, the whole tune moves up or down as the object does, and the chords underneath
  give the same tune a new colour every two bars.
- **A welcome tune.** Opening the storybook plays a short, bouncy run of notes with a bass bounce
  and a slide-whistle swoop, one of a few, so the toy greets a child before anything is tapped.
- **Keyboard.** Tab moves between objects, Enter or Space starts and stops them, and the arrow
  keys move them.

Prototype 7's continuous spinning is not used. Prototype 2's continuous pitch was tried after
testing showed the three-step mapping too hard to notice, but sixteen free steps per object
sounded like noise together, so height now moves in eight steps that always fit the chord.

## Designed for young children

The toy is made for toddlers (about 1 to 3 years) playing with a grown-up nearby, following
guidance on kid-friendly UX:

- **Big targets.** Buttons and objects are at least 44 pixels across, around 75 on a roomy
  screen, and objects have an invisible margin so small fingers can hit them. No button sits
  along the bottom edge, where children tap by mistake.
- **The garden comes first.** On a phone the buttons shrink to their smallest comfortable size
  and the garden objects grow, so the objects stay the biggest things on a small screen.
- **An answer for every touch.** A pressed object squashes at once, a tap glows and sounds, and a
  tap on the garden itself sends a small ripple.
- **Many fingers.** Several objects can be tapped or dragged at the same time, so siblings can
  play together. Only the first finger turns the book's pages.
- **Pictures, not words.** Pages, buttons and gardens are pictures; the few words are for
  grown-ups.
- **Any way up.** The book and the gardens work on an upright screen. An upright phone is asked
  once to turn sideways, where there is more room, and the card can be put away to play upright.
- **Grown-ups' corner.** Help for grown-ups is kept away from the child's buttons, in a small
  label lettered like the cover. It shows the two moves with the same arrow pictures as the
  gardens' guide.
- **Play for its own sake.** There are no scores, rewards, timers, ads or sign-ups, and no
  personal information is asked for.

## Credits

- Sound uses [Tone.js](https://tonejs.github.io/) 15.1.22 (MIT licence), loaded from jsDelivr.
- `garden.js` adapts code from my Assignment 2 prototypes: dragging and the height and place
  mapping from Prototypes 1, 2 and 3, and the audio start-up, glow restart, ripple and note-timed
  movement from Prototypes 5, 6 and 8.
- The garden, object and storybook pictures, and the code in this repository, were made with the
  help of Claude, an AI assistant. The pictures were first drawn as SVG files and then exported as
  the still WebP pictures used here.
- The storybook cover and buttons follow the style of a button reference sheet I provided: a home
  button, a pink notebook, a wooden Start sign and a path of numbered dots.
- The book's structure follows three website references: opening, turning spreads and closing
  the book with a cross from Sophia Guo's
  [Coffee Table Book](https://sophiaguo.design/playground/picture-book/), the activity living
  inside each spread from Kerrygold's [The Magical Pantry](https://www.themagicalpantry.com/) by
  Makemepulse, which also asks phones to be turned sideways, and the zoom from the open book into its content from Ribbit's
  [Process](https://ribbit.dk/process/) page. No code or artwork was taken from them.
- The kid-friendly guidelines come from KidsWorldFun's "Kid-Friendly UX: Ensuring Website
  Accessibility", Smart Interface Design Patterns' "A Practical Guide To Design For Children",
  DesignCrowd's "7 Tips for Designing a Website for Kids" and Gapsy Studio's "UX Design for Kids".
- The lettering uses the Fredoka and Gochi Hand fonts from Google Fonts (SIL Open Font License).
  In the storybook pictures it is part of the picture; Fredoka is also loaded from
  `assets/fonts/` for the "For grown-ups" label and the guide's words.

The three garden versions were inspired by four reference illustrations I collected. They were
used for mood, colour and composition only; nothing was traced or copied from them.

- The lakeside picnic version draws on an unsigned lakeside picnic illustration whose artist I
  have not identified.
- The painted orchard version draws on an orchard illustration signed Kaaillustration.com.
- The giant flower meadow version draws on a flower illustration signed Huhubanana and an
  unsigned illustration of giant flowers around a log, whose artist I have not identified.
