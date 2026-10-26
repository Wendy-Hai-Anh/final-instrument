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
  pause and help buttons, the floating note, the pointing hand, and the round chapter buttons
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
    gardens.
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

- **Height picks the notes.** Prototype 1 changed the register in three steps, but a tester
  moved an object a little and heard nothing change, so height is now read continuously: sixteen
  steps of the garden's pentatonic scale run from the bottom of the window to the top, about
  three octaves. Two objects a finger apart already sing different notes. One scale per garden
  keeps any mix of objects in tune.
- **Left to right picks the speed.** Prototype 3's second axis is read continuously too: notes
  come about once a second at the left edge and seven times a second at the right, and a singing
  object speeds up or slows down as it is dragged. Sound also pans gently with the object.
- **The kind of object picks the sound family.** Gardening tools are soft drums, animals sing
  the melody and fruits are slow ambient textures.
- **Resting objects breathe.** Each one swells a little every few seconds, so a child can see
  what can be touched without any words. Playing objects stop, since every note moves them.
- **One tap is enough.** A tap starts the object singing straight away and another tap stops it;
  dragging an object and letting go starts it from its new place. Every tap makes the object glow
  along its outline, adapted from Prototype 5.
- **Every note moves the object,** adapted from Prototype 8. Tools sway, animals hop and fruits
  swell, which reuses Prototype 4's grow-and-bounce as a repeating effect.
- **Playing objects glow.** A playing object keeps a soft halo in the garden's colour that
  pulses with each note, and a small note floats up from it, so a child can see which objects
  are making music.
- **Play the whole garden.** The button in the top corner lets every object join in, one after
  another in a new random order each time, so a child who taps nothing still hears the garden
  sing. While anything is playing the same button shows pause and stops it all.
- **A guide to play along with.** A tester watched the old demonstration and still did not know
  what to do, so the question-mark button now starts a guide. The garden dims, one animal is lit
  and a hand taps it with "Tap here!"; once the child taps it, the hand shows dragging it up or
  down, then left or right, waiting each time until the child has tried. It starts by itself on a
  first visit, and the cross or Escape ends it.
- **One look.** The orchard and meadow objects have their outlines softened towards each
  garden's own deep colour, so they sit in those painterly pictures as the lakeside objects sit
  in its outlined one.
- **Hints.** When a garden opens, and after 20 seconds of quiet, the playable objects wiggle one
  after another, so they stand apart from the flowers, basket and lake in the picture.
- **Drop to place.** Putting an object down starts it singing from its new place, and a small
  ripple spreads across the ground, adapted from Prototype 6. Dragging a resting object sounds
  each step of the scale it passes, like a finger along a xylophone.
- **Controlled randomness.** Every tap makes the object a new short tune, a few steps up and down
  the scale from the note its height picks, so the same object sounds different each time it is
  started. The tune repeats as the object's own song, but each time round one note may move a
  step, with small changes in loudness, so it never quite repeats. Animals sometimes rest between
  notes, and the whole tune moves up or down as the object does.
- **A welcome tune.** Opening the storybook plays a short, bouncy run of notes with a bass bounce
  and a slide-whistle swoop, one of a few, so the toy greets a child before anything is tapped.
- **Keyboard.** Tab moves between objects, Enter or Space starts and stops them, and the arrow
  keys move them.

Prototype 7's continuous spinning is not used. Prototype 2's continuous pitch was not used at
first, but testing showed the three-step mapping too hard to notice, so height and speed are now
continuous as it was.

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
