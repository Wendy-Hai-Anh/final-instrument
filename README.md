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
  screens show the whole book with the arrows underneath and a quiet hint that sideways makes it
  bigger. A small "For grown-ups" label opens, when held, a panel on how to play, what children
  explore and how the toy keeps them safe. `style.css` lays out the book and `storybook.js` turns
  its pages, plays a soft paper rustle and zooms in and out of the gardens.
- `base.css` holds the colour tokens and picture buttons that every page shares, and the
  responsive scene, the objects and the visual feedback that every garden shares.
- `garden.js` holds the sound and interaction that every garden shares.
- `button-press.js` gives every button its press: the key sinks into its shadow and springs back.
- `assets/textures/` holds the paper grain behind the page.
- `assets/storybook/` holds the book pictures: the teal backdrop, the closed cover, the inside of
  the cover, the back board, the ribbon, the spine rings, a left and a right page for each
  spread and the turn-sideways picture. `assets/buttons/` holds the home, arrow, close, play,
  pause, play-again and help buttons, the floating note, and the round chapter buttons (each a small
  picture of its garden, with a gold rim for the current one) and the path that joins them.
  Each square button is a raised picture that turns flat while it is pressed, as if it sank into
  its shadow, and springs back up on release (`button-press.js`); the garden button swaps between
  play and pause, and the demonstration uses shadowless up and right arrows. The buttons
  share the storybook palette: a cream paper key, warm brown lines and a gold shadow like the
  play button.
- `versions/` holds one folder per garden:
  - `index.html` lists the objects and sets the garden's musical key and tempo. Its home button
    and chapter buttons lead back to the book, open on that garden's pages, and on to the other
    gardens.
  - `style.css` sets the glow colour, the pitch zone lines and where each object starts on every
    screen shape.
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

- **Height picks the register.** Prototype 1's three zones are kept: sky, middle and ground
  play high, middle and low notes. The zone lines follow each picture's horizon. Every note
  comes from one pentatonic scale per garden, so any mix of objects stays in tune.
- **Left to right picks the rhythm.** Prototype 3's second axis is simplified: objects on the
  left repeat slowly, in the middle steadily and on the right quickly. Sound also pans gently
  with the object.
- **The kind of object picks the sound family.** Gardening tools are soft drums, animals sing
  the melody and fruits are slow ambient textures.
- **Resting objects breathe.** Each one swells a little every few seconds, so a child can see
  what can be touched without any words. Playing objects stop, since every note moves them.
- **Tap to start or stop.** Every tap plays a note and makes the object glow along its outline,
  adapted from Prototype 5.
- **Every note moves the object,** adapted from Prototype 8. Tools sway, animals hop and fruits
  swell, which reuses Prototype 4's grow-and-bounce as a repeating effect.
- **Playing objects glow.** A playing object keeps a soft halo in the garden's colour that
  pulses with each note, and a small note floats up from it, so a child can see which objects
  are making music.
- **Play, pause and help.** The play button starts the whole garden, with the objects joining in
  one by one in a shuffled order. It becomes a pause button while sounds are active, and play
  brings the same sounds back after pausing. The question-mark button replays a short demonstration: a big arrow
  leads a see-through animal up from the ground to the sky as its notes climb, then to the right
  as its notes come faster. The arrow is a plain key without a shadow and travels on the same
  line just ahead of the animal. The demonstration also plays once, silently, on a child's first
  visit.
- **One look.** The orchard and meadow objects have their outlines softened towards each
  garden's own deep colour, so they sit in those painterly pictures as the lakeside objects sit
  in its outlined one.
- **Hints.** When a garden opens, and after 20 seconds of quiet, the playable objects wiggle one
  after another, so they stand apart from the flowers, basket and lake in the picture.
- **Drop to place.** Putting an object down plays one note from its new place, and a small
  ripple spreads across the ground, adapted from Prototype 6. A stopped object begins repeating
  after it is placed, so tapping and dragging both begin playback.
- **Controlled randomness.** Each note is picked at random from its zone, never the same note
  twice running, with small changes in loudness. Animals sometimes rest between notes.
- **Keyboard.** Tab moves between objects, Enter or Space starts and stops them, and the arrow
  keys move them.

Prototype 2's continuous pitch and Prototype 7's continuous spinning are not used.

## Designed for young children

The toy is made for toddlers (about 1 to 3 years) playing with a grown-up nearby, following
guidance on kid-friendly UX:

- **Big targets.** Every button is at least 75 pixels across, and objects have an invisible
  margin so small fingers can hit them. No button sits along the bottom edge, where children tap
  by mistake.
- **An answer for every touch.** A pressed object squashes at once, a tap glows and sounds, and a
  tap on the garden itself sends a small ripple.
- **Many fingers.** Several objects can be tapped or dragged at the same time, so siblings can
  play together. Only the first finger turns the book's pages.
- **Pictures, not words.** Pages, buttons and gardens are pictures; the few words are for
  grown-ups.
- **Any way up.** The book works on an upright screen, so a child never has to turn the device.
- **Grown-ups' corner.** Help for grown-ups is kept away from the child's buttons and opens only
  after a press and hold. It shows the two moves with the same arrow pictures as the gardens'
  demonstration.
- **Play for its own sake.** There are no scores, rewards, timers, ads or sign-ups, and no
  personal information is asked for.

## Credits

- Sound uses [Tone.js](https://tonejs.github.io/) 15.1.22 (MIT licence), loaded from jsDelivr.
- `garden.js` adapts code from my Assignment 2 prototypes: dragging and pitch zones from
  Prototypes 1 and 3, and the audio start-up, glow restart, ripple and note-timed movement from
  Prototypes 5, 6 and 8.
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
- The lettering in the storybook pictures uses the Fredoka and Gochi Hand fonts from Google Fonts
  (SIL Open Font License). It is part of the pictures, so the pages load no fonts.

The three garden versions were inspired by four reference illustrations I collected. They were
used for mood, colour and composition only; nothing was traced or copied from them.

- The lakeside picnic version draws on an unsigned lakeside picnic illustration whose artist I
  have not identified.
- The painted orchard version draws on an orchard illustration signed Kaaillustration.com.
- The giant flower meadow version draws on a flower illustration signed Huhubanana and an
  unsigned illustration of giant flowers around a log, whose artist I have not identified.
