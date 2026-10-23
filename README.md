# Garden of Sounds

Garden of Sounds is a browser-based musical toy for toddlers. Children tap and drag gardening
tools, animals and fruits around an illustrated storybook garden to build layered music.

This repository holds the final instrument for Assignment 3. There are three versions of the
garden. Each one is a still picture with ten separate objects on it that can be moved and played,
and it fills the whole browser window.

## Structure

- `index.html` is a storybook cover. Its Start sign opens the first garden and its scene-preview
  chapters open each garden. `style.css` lays out the cover, and `storybook.js` turns the book
  open before a garden loads.
- `base.css` holds the colour tokens and picture buttons that every page shares, and the
  responsive scene, the objects and the visual feedback that every garden shares.
- `garden.js` holds the sound and interaction that every garden shares.
- `assets/textures/` holds the paper grain behind the page.
- `assets/storybook/` holds the cover pictures: the teal backdrop, the closed and open book and
  the Start sign. `assets/buttons/` holds the home button and the path that joins the garden
  preview buttons.
- `versions/` holds one folder per garden:
  - `index.html` lists the objects and sets the garden's musical key and tempo. Its home button
    and garden preview buttons lead back to the storybook cover and on to the other gardens.
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
- **Tap to start or stop.** Every tap plays a note and makes the object glow along its outline,
  adapted from Prototype 5.
- **Every note moves the object,** adapted from Prototype 8. Tools sway, animals hop and fruits
  swell, which reuses Prototype 4's grow-and-bounce as a repeating effect.
- **Drop to place.** Putting an object down plays one note from its new place, and a small
  ripple spreads across the ground, adapted from Prototype 6.
- **Controlled randomness.** Each note is picked at random from its zone, never the same note
  twice running, with small changes in loudness. Animals sometimes rest between notes.
- **Keyboard.** Tab moves between objects, Enter or Space starts and stops them, and the arrow
  keys move them.

Prototype 2's continuous pitch and Prototype 7's continuous spinning are not used.

## Credits

- Sound uses [Tone.js](https://tonejs.github.io/) 15.1.22 (MIT licence), loaded from jsDelivr.
- `garden.js` adapts code from my Assignment 2 prototypes: dragging and pitch zones from
  Prototypes 1 and 3, and the audio start-up, glow restart, ripple and note-timed movement from
  Prototypes 5, 6 and 8.
- The garden, object and storybook pictures, and the code in this repository, were made with the
  help of Claude, an AI assistant.
- The storybook cover and buttons follow the style of a button reference sheet I provided: a home
  button, a pink notebook, a wooden Start sign and a path of round garden preview buttons.
- The lettering in the storybook pictures uses the Fredoka and Gochi Hand fonts from Google Fonts
  (SIL Open Font License). It is part of the pictures, so the pages load no fonts.

The three garden versions were inspired by four reference illustrations I collected. They were
used for mood, colour and composition only; nothing was traced or copied from them.

- The lakeside picnic version draws on an unsigned lakeside picnic illustration whose artist I
  have not identified.
- The painted orchard version draws on an orchard illustration signed Kaaillustration.com.
- The giant flower meadow version draws on a flower illustration signed Huhubanana and an
  unsigned illustration of giant flowers around a log, whose artist I have not identified.
