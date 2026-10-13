# Garden of Sounds

Garden of Sounds is a browser-based musical toy for toddlers. Children will explore sound by
tapping and moving gardening tools, animals and fruits within an illustrated storybook garden.

This repository holds the final instrument for Assignment 3. The current stage is visual only:
it builds three versions of the illustrated garden and their objects so one can be chosen as the
final scene. Sound and interaction have not been added yet.

## Structure

- `index.html` links the three garden versions.
- `style.css` lays out that page.
- `base.css` holds the colour tokens, the responsive scene layout and the layer rules that every
  garden version shares.
- `assets/textures/` holds the paper grain behind the page.
- `versions/` holds one folder per garden. Each has its own `index.html`, a `style.css` with its
  sky and every scenery and object position, and `assets/` for its scenery, objects and texture.

## Garden versions

All three gardens share the same painted gouache texture, and each has its own main colour. They
keep the same ten object IDs so sound and interaction can be added to whichever one is chosen.

- `versions/lakeside-picnic/` is pink: a bold-outlined lakeside meadow with a blossom tree and a
  picnic blanket.
- `versions/painted-orchard/` is golden orange: an orchard with no scenery outlines, tall
  foxgloves and rows of seedlings.
- `versions/flower-meadow/` is blue and green: a bug's-eye meadow with giant flowers, dandelion
  puffs and a fallen log that the snail, flowerpot and bird sit on.

## Credits

All SVG artwork in this repository was drawn for this project.

The three garden versions were inspired by four reference illustrations I collected. They were
used for mood, colour and composition only; nothing was traced or copied from them.

- The lakeside picnic version draws on an unsigned lakeside picnic illustration whose artist I
  have not identified.
- The painted orchard version draws on an orchard illustration signed Kaaillustration.com.
- The giant flower meadow version draws on a flower illustration signed Huhubanana and an
  unsigned illustration of giant flowers around a log, whose artist I have not identified.
