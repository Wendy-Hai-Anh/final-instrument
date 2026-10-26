"use strict";

/*
This script makes every garden object playable. Height sets the notes and place from left to
right sets how quickly they come. Every object has its own small set of notes, and the whole
garden keeps one shared beat and one round of chords, so any mix of objects plays together as
music. A tap starts an object singing a short tune from its set, made new on every tap, and
another tap stops it. Dropping an object after a drag starts it too. Until an object has played,
a small note bobs beside it, so the garden reads as an instrument rather than a picture to tidy.
Each kind of action has its own feedback: a press squashes the object at once, a tap glows, every
note moves the object and sends up a small note, a drop sends a ripple across the ground, and a
tap on the garden itself sends a small ripple too, so no touch goes unanswered. Several fingers
can play different objects at the same time. The play button lets the whole garden join in, one
object after another, and stops it again; the help button starts a guide that a child plays
along with.
*/

/* Page elements and settings ------------------------------------------------ */
const gardenStage = document.querySelector(".gardenStage");
const gardenScene = document.querySelector(".gardenScene");
const rippleLayer = document.querySelector(".rippleLayer");
const noteLayer = document.querySelector(".noteLayer");
const quietButton = document.querySelector(".quietButton");
const helpButton = document.querySelector(".helpButton");
const soundStatus = document.querySelector("#sound-status");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const gardenKey = gardenScene.dataset.key;
const gardenTempo = Number(gardenScene.dataset.tempo);
const dragThreshold = 8;
const keyStep = 4;
const maxRipples = 6;
const maxNotes = 12;
const idleHintDelay = 20000;

// The floating note, the play keys and the guide pictures share the buttons' folder and version.
const noteSource = quietButton.querySelector(".buttonImage").src.replace("quiet-raised", "note");

function buttonSource(name) {
    return noteSource.replace("/note.", `/${name}.`);
}

/* Musical mapping ----------------------------------------------------------- */
/*
Testers heard the old garden as noise once several objects played, since each one kept its own
clock and wandered over three octaves. Now the whole garden shares one beat and one slow round of
four chords, I, vi, IV and V, two bars each, and every note an object plays belongs to the chord
of that moment. However many objects play, they sound like one piece of music.
*/
const chordRound = [
    [0, 4, 7],
    [0, 4, 9],
    [0, 5, 9],
    [2, 7, 11]
];
const barsPerChord = 2;
const beatsPerBar = 16;

/*
Height picks one of eight rungs on a ladder made of the chord's notes, from the family's lowest
octave up, so every move up or down a little way gives a new note that still fits. Place from left
to right picks how often the notes come, from long, slow notes at the left to quick ones at the
right. Every rhythm is laid on the shared beat, and two of them skip in a three-three-two pattern,
which keeps the garden lively without anyone falling out of time.
*/
const heightSteps = 8;
const windowMargin = 0.08;
const rhythms = [
    { cycle: 16, hits: [0] },
    { cycle: 16, hits: [0, 8] },
    { cycle: 16, hits: [0, 6, 12] },
    { cycle: 16, hits: [0, 4, 8, 12] },
    { cycle: 8, hits: [0, 3, 6] },
    { cycle: 8, hits: [0, 2, 4, 6] }
];

/* Each kind of object keeps the sound family planned in Assignment 1. */
const families = {
    // Tools are soft pitched drums, an octave lower so they sit under the melodies.
    "gardening-tool": {
        lowestOctave: 2,
        rhythms: [1, 2, 3, 4, 5],
        tuneLength: [2, 4],
        restChance: 0,
        noteLength: 0.2,
        volume: -16,
        motion: "sway",
        createSynth: () => new Tone.MembraneSynth({
            pitchDecay: 0.03,
            octaves: 1.5,
            envelope: {
                attack: 0.002,
                decay: 0.32,
                sustain: 0,
                release: 0.2
            }
        })
    },
    // Animals sing the melody. An occasional rest makes each phrase breathe.
    animal: {
        lowestOctave: 3,
        rhythms: [1, 2, 3, 4, 5],
        tuneLength: [3, 5],
        restChance: 0.15,
        noteLength: 0.22,
        volume: -12,
        motion: "hop",
        createSynth: () => new Tone.Synth({
            oscillator: {
                type: "triangle"
            },
            envelope: {
                attack: 0.02,
                decay: 0.12,
                sustain: 0.3,
                release: 0.5
            }
        })
    },
    // Fruits are slow ambient textures, so they never play the quickest rhythms.
    fruit: {
        lowestOctave: 3,
        rhythms: [0, 1, 2, 3],
        tuneLength: [2, 3],
        restChance: 0,
        noteLength: 1.2,
        volume: -15,
        motion: "swell",
        createSynth: () => new Tone.AMSynth({
            harmonicity: 2,
            envelope: {
                attack: 0.3,
                decay: 0.4,
                sustain: 0.5,
                release: 1.2
            }
        })
    }
};

/*
Every object has its own small set of rungs above the one its height picks, so each keeps a voice
of its own: the bird runs up and down four neighbouring notes, the butterfly leaps, the snail
stays close to home and the rake marks the chord's root and its octave. A tune only ever uses
notes from its object's set.
*/
const noteSets = {
    "garden-bird": [1, 2, 3, 4],
    "garden-butterfly": [0, 2, 4],
    "garden-snail": [-1, 0, 1],
    "garden-rake": [0, 3],
    "hand-trowel": [0, 1],
    "watering-can": [0, 1, 2],
    "flower-pot": [0, 2, 3],
    "red-apple": [0, 2],
    "green-pear": [1, 3],
    strawberry: [0, 1, 2]
};

/* Garden objects ------------------------------------------------------------ */
const gardenObjects = [...document.querySelectorAll(".gardenObject")].map(item => {
    const image = item.querySelector(".objectImage");
    const button = item.querySelector(".objectButton");

    // The halo behind each object shows while it plays.
    const halo = document.createElement("span");
    halo.className = "playHalo";
    button.prepend(halo);

    // Until the object has played, a small note beside it says that it makes music.
    const badge = document.createElement("img");
    badge.className = "noteBadge";
    badge.src = buttonSource("note-badge");
    badge.alt = "";
    badge.draggable = false;
    button.append(badge);

    return {
        item,
        image,
        button,
        halo,
        name: image.alt,
        family: families[item.dataset.category],
        noteSet: noteSets[item.id] || [0, 1, 2],
        step: -1,
        tune: null,
        tuneIndex: 0,
        lastNoteTime: 0,
        isPlaying: false,
        hasPlayed: false,
        lastSlideNote: 0,
        dragEndedAt: 0,
        tappedAt: 0,
        drag: null,
        voice: null
    };
});

function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

// Positions are shares of the scene, so an object stays on the same patch at any screen size.
// The scene's exact size is used, since a rounded size would let places creep on every resize.
function readPosition(gardenObject) {
    const style = getComputedStyle(gardenObject.item);
    const scene = gardenScene.getBoundingClientRect();

    return {
        x: parseFloat(style.left) / scene.width * 100,
        y: parseFloat(style.top) / scene.height * 100
    };
}

function readHeight(gardenObject) {
    return gardenObject.item.offsetHeight / gardenScene.getBoundingClientRect().height * 100;
}

function placeObject(gardenObject, x, y) {
    const scene = gardenScene.getBoundingClientRect();
    const screen = gardenStage.getBoundingClientRect();
    const bounds = gardenObject.item.getBoundingClientRect();

    // The garden continues past the scene to the window's edges, so an object can go anywhere on
    // screen. Its whole box, turned if it leans, stays in view however far a finger travels.
    const halfWidth = bounds.width / scene.width * 50;
    const halfHeight = bounds.height / scene.height * 50;
    const baseBelowCentre = readHeight(gardenObject) / 2;
    const left = (screen.left - scene.left) / scene.width * 100 + halfWidth;
    const right = (screen.right - scene.left) / scene.width * 100 - halfWidth;
    const top = (screen.top - scene.top) / scene.height * 100 + baseBelowCentre + halfHeight;
    const bottom = (screen.bottom - scene.top) / scene.height * 100 + baseBelowCentre - halfHeight;

    gardenObject.item.style.setProperty("--x", `${clamp(x, left, right)}%`);
    gardenObject.item.style.setProperty("--y", `${clamp(y, top, bottom)}%`);
}

/*
Height and place are read from the middle of the object against the whole window, from 0 at the
bottom or left to 1 at the top or right. A thin band at each edge counts as the very end, since an
object's middle can never quite reach it.
*/
function readPlace(gardenObject) {
    const screen = gardenStage.getBoundingClientRect();
    const box = gardenObject.item.getBoundingClientRect();
    const across = ((box.left + box.right) / 2 - screen.left) / screen.width;
    const up = 1 - ((box.top + box.bottom) / 2 - screen.top) / screen.height;
    const spread = share => clamp((share - windowMargin) / (1 - 2 * windowMargin), 0, 1);

    return {
        across: spread(across),
        up: spread(up)
    };
}

function findStep(gardenObject) {
    return Math.round(readPlace(gardenObject).up * (heightSteps - 1));
}

function findRhythm(gardenObject) {
    const choices = gardenObject.family.rhythms;
    const index = Math.min(Math.floor(readPlace(gardenObject).across * choices.length), choices.length - 1);
    return rhythms[choices[index]];
}

// The usual gap between notes in seconds, which keeps each movement shorter than the next note.
function findGap(gardenObject) {
    const { cycle, hits } = findRhythm(gardenObject);
    return cycle / hits.length * 60 / gardenTempo / 4;
}

// Returns true when the object has moved to a different rung of the ladder.
function updatePlace(gardenObject) {
    const step = findStep(gardenObject);
    const stepChanged = step !== gardenObject.step;
    gardenObject.step = step;

    // Objects lower in the garden are nearer the viewer, so they are drawn in front.
    const depth = Math.round(readPosition(gardenObject).y);
    gardenObject.item.style.setProperty("--depth", String(depth));

    // Gentle panning follows the object across the garden.
    if (gardenObject.voice) {
        const pan = (readPlace(gardenObject).across * 2 - 1) * 0.6;
        gardenObject.voice.panner.pan.rampTo(pan, 0.1);
    }

    return stepChanged;
}

function describePlace(gardenObject) {
    const { across, up } = readPlace(gardenObject);
    const height = ["low down", "in the middle", "high up"][Math.min(Math.floor(up * 3), 2)];
    const speed = ["slowly", "steadily", "quickly"][Math.min(Math.floor(across * 3), 2)];
    return `${height}, ${speed}`;
}

function announce(message) {
    soundStatus.textContent = message;
}

/* Audio --------------------------------------------------------------------- */
let gardenOutput;

function audioIsRunning() {
    return Boolean(gardenOutput) && Tone.getContext().state === "running";
}

async function prepareAudio() {
    if (typeof Tone === "undefined") {
        announce("Sound could not load. Check your connection and reload.");
        return false;
    }

    // Browsers unlock audio only during a gesture, and phones can suspend it again later.
    if (Tone.getContext().state !== "running") {
        await Tone.start();
    }

    if (Tone.getContext().state !== "running") {
        announce("Sound is unavailable. Try another browser.");
        return false;
    }

    if (!gardenOutput) buildGardenOutput();
    return true;
}

function buildGardenOutput() {
    const limiter = new Tone.Limiter(-3).toDestination();

    // A little shared reverb places every object in the same garden.
    gardenOutput = new Tone.Reverb({
        decay: 2.5,
        wet: 0.25
    }).connect(limiter);

    // One beat for the whole garden, at the garden's own tempo, keeps every object in time.
    const transport = Tone.getTransport();
    transport.bpm.value = gardenTempo;
    transport.scheduleRepeat(playBeat, "16n");
    transport.start("+0.05");
}

function getVoice(gardenObject) {
    if (!gardenObject.voice) {
        const panner = new Tone.Panner(0).connect(gardenOutput);
        const synth = gardenObject.family.createSynth().connect(panner);

        gardenObject.voice = {
            synth,
            panner
        };
        updatePlace(gardenObject);
    }

    return gardenObject.voice;
}

/*
Controlled randomness, extended: every tap makes a new short tune for the object, picked from its
own set of notes. The tune repeats, so a child can hear it as the object's own song, but each time
round one note may swap for another from the set, so it never quite repeats. Moving the object
carries the whole tune higher or lower, and the chords underneath give the same tune a new colour
every two bars.
*/
function pickFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function makeTune(gardenObject) {
    const { family, noteSet } = gardenObject;
    const [shortest, longest] = family.tuneLength;
    const length = shortest + Math.floor(Math.random() * (longest - shortest + 1));
    const tune = [pickFrom(noteSet)];

    while (tune.length < length) {
        if (Math.random() < family.restChance) {
            tune.push(null);
        } else {
            // A different note from the last one keeps even a short tune moving.
            const choices = noteSet.filter(rung => rung !== tune[tune.length - 1]);
            tune.push(pickFrom(choices.length ? choices : noteSet));
        }
    }
    return tune;
}

function varyTune(gardenObject) {
    const { tune, noteSet } = gardenObject;
    if (Math.random() > 0.4) return;

    const index = 1 + Math.floor(Math.random() * (tune.length - 1));
    if (tune[index] === null) return;
    tune[index] = pickFrom(noteSet);
}

// Sixteenths since the garden's sound started, counted by the shared beat.
let beat = 0;

// Turns a rung of the chord ladder into a MIDI note, for the chord playing at that beat.
function noteForRung(gardenObject, rung, atBeat = beat) {
    const chord = chordRound[Math.floor(atBeat / (beatsPerBar * barsPerChord)) % chordRound.length];
    const safeRung = Math.max(rung, 0);
    const root = Tone.Frequency(`${gardenKey}${gardenObject.family.lowestOctave}`).toMidi();
    return root + 12 * Math.floor(safeRung / 3) + chord[safeRung % 3];
}

function playNote(gardenObject, time, velocity, note) {
    const { synth } = getVoice(gardenObject);
    // Low notes get a bounded boost so they stay audible on small speakers.
    const volume = gardenObject.family.volume + (1 - readPlace(gardenObject).up) * 3;

    gardenObject.lastNoteTime = time;
    synth.volume.setValueAtTime(volume, time);
    synth.triggerAttackRelease(Tone.Frequency(note, "midi").toNote(),
        gardenObject.family.noteLength, time, velocity);

    // Tone's Draw runs the movement on the frame that matches the note, as in Prototype 8.
    Tone.getDraw().schedule(() => moveWithNote(gardenObject), time);
}

function playNextNote(gardenObject, time, velocity, atBeat) {
    const { tune } = gardenObject;

    if (gardenObject.tuneIndex >= tune.length) {
        gardenObject.tuneIndex = 0;
        varyTune(gardenObject);
    }

    const rung = tune[gardenObject.tuneIndex];
    gardenObject.tuneIndex += 1;
    if (rung === null) return;

    playNote(gardenObject, time, velocity,
        noteForRung(gardenObject, findStep(gardenObject) + rung, atBeat));
}

// On every sixteenth, each playing object checks whether its rhythm has a note there.
function playBeat(time) {
    const thisBeat = beat;
    beat += 1;

    gardenObjects.forEach(gardenObject => {
        if (!gardenObject.isPlaying) return;

        const { cycle, hits } = findRhythm(gardenObject);
        if (!hits.includes(thisBeat % cycle)) return;
        // A tap's first note may have only just sounded, so the beat does not double it.
        if (time - gardenObject.lastNoteTime < 0.12) return;

        // The first beat of each bar is a little stronger, and small changes keep it organic.
        const accent = thisBeat % beatsPerBar === 0 ? 0.1 : 0;
        playNextNote(gardenObject, time, 0.55 + accent + Math.random() * 0.15, thisBeat);
    });
}

// A tapped object sings its first note at once; when the whole garden joins in, it waits for
// its next beat, so the objects come in together.
function startPlaying(gardenObject, startNow = true) {
    gardenObject.tune = makeTune(gardenObject);
    gardenObject.tuneIndex = 0;
    gardenObject.hasPlayed = true;
    gardenObject.item.classList.add("hasPlayed");
    setPlaying(gardenObject, true);

    if (startNow) playNextNote(gardenObject, Tone.immediate() + 0.02, 0.7);
}

function stopPlaying(gardenObject) {
    setPlaying(gardenObject, false);
}

/* Feedback ------------------------------------------------------------------ */
/*
Adapted from Prototype 8, which testers found clearest for a repeating sound: the object moves
once with every note. Each family has its own movement, and the fruit's swell reuses Prototype 4's
grow-and-bounce as a repeating effect, as one tester suggested.
*/
const motions = {
    sway: {
        duration: 380,
        keyframes: amount => [
            { transform: "rotate(0deg)" },
            { transform: `rotate(${-9 * amount}deg)` },
            { transform: `rotate(${7 * amount}deg)` },
            { transform: "rotate(0deg)" }
        ]
    },
    hop: {
        duration: 340,
        keyframes: amount => [
            { transform: "translateY(0)" },
            { transform: `translateY(${-14 * amount}%)` },
            { transform: "translateY(0)" }
        ]
    },
    swell: {
        duration: 520,
        keyframes: amount => [
            { transform: "scale(1)" },
            { transform: `scale(${1 + 0.1 * amount})` },
            { transform: `scale(${1 - 0.03 * amount})` },
            { transform: "scale(1)" }
        ]
    }
};

function moveWithNote(gardenObject) {
    const motion = motions[gardenObject.family.motion];
    // Reduced motion keeps the movement, but much smaller.
    const amount = reducedMotionQuery.matches ? 0.35 : 1;
    // Each movement ends before the next note, so fast rhythms stay readable.
    const duration = Math.min(motion.duration, findGap(gardenObject) * 900);

    gardenObject.image.animate(motion.keyframes(amount), {
        duration,
        easing: "ease-out"
    });
    pulseHalo(gardenObject.halo, duration);

    const { x, y } = readPosition(gardenObject);
    floatNote(x, y - readHeight(gardenObject));
}

// The halo swells with each note, so the pulse matches the sound.
function pulseHalo(halo, duration) {
    halo.animate([
        { scale: 1, opacity: 0.4 },
        { scale: 1.12, opacity: 0.55 },
        { scale: 1, opacity: 0.4 }
    ], {
        duration: Math.max(duration, 260),
        easing: "ease-out"
    });
}

// A small note floats up from the top of a sounding object and fades away.
function floatNote(x, y) {
    while (noteLayer.querySelectorAll(".floatingNote").length >= maxNotes) {
        noteLayer.querySelector(".floatingNote").remove();
    }

    const note = document.createElement("img");
    note.className = "floatingNote";
    note.src = noteSource;
    note.alt = "";
    note.style.setProperty("--x", `${x}%`);
    note.style.setProperty("--y", `${y}%`);
    note.style.setProperty("--drift", `${(Math.random() - 0.5) * 2.5}rem`);
    noteLayer.append(note);

    note.addEventListener("animationend", () => note.remove());
    setTimeout(() => note.remove(), 1400);
}

function glowObject(gardenObject) {
    gardenObject.item.classList.remove("isGlowing");

    // Reading layout lets the same class restart after rapid repeated taps, as in Prototype 5.
    void gardenObject.item.offsetWidth;
    gardenObject.item.classList.add("isGlowing");
}

function createRipple(gardenObject) {
    const { x, y } = readPosition(gardenObject);
    addRipple(x, y, gardenObject.item.offsetWidth * 1.4);
}

function addRipple(x, y, width) {
    // Keep the number of rings small even when a child moves objects very quickly.
    while (rippleLayer.childElementCount >= maxRipples) {
        rippleLayer.firstElementChild.remove();
    }

    const ripple = document.createElement("span");

    ripple.className = "groundRipple";
    ripple.style.setProperty("--x", `${x}%`);
    ripple.style.setProperty("--y", `${y}%`);
    ripple.style.setProperty("--rippleWidth", `${width}px`);
    rippleLayer.append(ripple);

    // The timer covers browsers that skip the end event, for example in a hidden tab.
    ripple.addEventListener("animationend", () => ripple.remove());
    setTimeout(() => ripple.remove(), 1200);
}

/* Tapping ------------------------------------------------------------------- */
let joinTimers = [];

function hasPlayingObject() {
    return gardenObjects.some(gardenObject => gardenObject.isPlaying);
}

function setPlaying(gardenObject, isPlaying) {
    gardenObject.isPlaying = isPlaying;
    gardenObject.button.setAttribute("aria-pressed", String(isPlaying));
    gardenObject.item.classList.toggle("isPlaying", isPlaying);
    updateQuietButton();
}

/*
The play key always shows what it will do. With nothing playing it shows play, and a press lets
the whole garden join in, one object after another in a new random order each time. While
anything plays it shows pause, and a press stops every sound.
*/
function updateQuietButton() {
    const isBusy = hasPlayingObject() || joinTimers.length > 0;
    const key = isBusy ? "quiet" : "resume";
    const [raised, flat] = quietButton.querySelectorAll("img");

    raised.src = buttonSource(`${key}-raised`);
    flat.src = buttonSource(key);
    raised.alt = isBusy ? "Stop all sounds" : "Play the whole garden";
}

function stopGarden() {
    joinTimers.forEach(timer => clearTimeout(timer));
    joinTimers = [];

    // Each object glows once as it stops.
    gardenObjects.filter(gardenObject => gardenObject.isPlaying).forEach(gardenObject => {
        stopPlaying(gardenObject);
        glowObject(gardenObject);
    });
    updateQuietButton();
    announce("All quiet.");
}

async function playGarden() {
    if (!(await prepareAudio())) return;

    const order = [...gardenObjects].sort(() => Math.random() - 0.5);
    let delay = 0;

    order.forEach(gardenObject => {
        const timer = setTimeout(() => {
            joinTimers = joinTimers.filter(waiting => waiting !== timer);
            if (!gardenObject.isPlaying) {
                startPlaying(gardenObject, false);
                glowObject(gardenObject);
            }
            updateQuietButton();
        }, delay);

        joinTimers.push(timer);
        delay += 500 + Math.random() * 600;
    });
    updateQuietButton();
    announce("The whole garden is playing.");
}

function playOrStopGarden() {
    if (hasPlayingObject() || joinTimers.length > 0) {
        stopGarden();
    } else {
        playGarden();
    }
}

async function toggleObject(gardenObject) {
    if (!(await prepareAudio())) return;

    if (gardenObject.isPlaying) {
        // A stop still sounds: one quiet note from where the object rests.
        stopPlaying(gardenObject);
        playNote(gardenObject, Tone.immediate() + 0.02, 0.35,
            noteForRung(gardenObject, findStep(gardenObject)));
        announce(`${gardenObject.name} stopped.`);
    } else {
        startPlaying(gardenObject);
        announce(`${gardenObject.name} is singing ${describePlace(gardenObject)}.`);
    }
    glowObject(gardenObject);
}

/* Dragging ------------------------------------------------------------------ */
function startDrag(gardenObject, event) {
    if (event.button !== 0 || gardenObject.drag) return;

    const sceneBounds = gardenScene.getBoundingClientRect();
    const { x, y } = readPosition(gardenObject);

    // The grab point stays under the finger, so the object never jumps when it is picked up.
    gardenObject.drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - sceneBounds.left - x / 100 * sceneBounds.width,
        offsetY: event.clientY - sceneBounds.top - y / 100 * sceneBounds.height,
        hasMoved: false
    };
    gardenObject.button.setPointerCapture(event.pointerId);
    gardenObject.item.classList.add("isPressed");

    // A mouse press can unlock audio, so the first drag can already be heard.
    if (event.pointerType === "mouse") prepareAudio();
}

function moveDrag(gardenObject, event) {
    const drag = gardenObject.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.hasMoved) {
        const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);

        // Small wobbles from little fingers still count as a tap rather than a drag.
        if (distance < dragThreshold) return;
        drag.hasMoved = true;
        gardenObject.item.classList.remove("isPressed");
        gardenObject.item.classList.add("isDragging");
    }

    const sceneBounds = gardenScene.getBoundingClientRect();
    const x = (event.clientX - drag.offsetX - sceneBounds.left) / sceneBounds.width * 100;
    const y = (event.clientY - drag.offsetY - sceneBounds.top) / sceneBounds.height * 100;
    placeObject(gardenObject, x, y);

    // A resting object sounds each rung it passes, like a finger along a xylophone.
    const stepChanged = updatePlace(gardenObject);
    const now = performance.now();
    if (stepChanged && !gardenObject.isPlaying && audioIsRunning()
        && now - gardenObject.lastSlideNote > 70) {
        gardenObject.lastSlideNote = now;
        playNote(gardenObject, Tone.immediate() + 0.02, 0.4,
            noteForRung(gardenObject, gardenObject.step));
    }
}

// Putting an object down starts its song from the new place, or keeps it singing.
async function dropObject(gardenObject, canStartAudio) {
    updatePlace(gardenObject);
    createRipple(gardenObject);

    const isReady = canStartAudio ? await prepareAudio() : audioIsRunning();

    if (isReady && !gardenObject.isPlaying) startPlaying(gardenObject);
    announce(`${gardenObject.name} is singing ${describePlace(gardenObject)}.`);
}

function endDrag(gardenObject, event, canStartAudio) {
    const drag = gardenObject.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;

    gardenObject.drag = null;
    gardenObject.item.classList.remove("isPressed");

    /*
    A press without movement is a tap. It is handled here rather than by the click event, because
    browsers drop clicks when two fingers touch at once, and children often play with several.
    */
    if (!drag.hasMoved) {
        if (event.type === "pointerup") {
            gardenObject.tappedAt = performance.now();
            toggleObject(gardenObject);
        }
        return;
    }

    gardenObject.item.classList.remove("isDragging");
    gardenObject.dragEndedAt = performance.now();
    dropObject(gardenObject, canStartAudio);
}

/* Keyboard ------------------------------------------------------------------ */
const keyMoves = {
    ArrowLeft: [-keyStep, 0],
    ArrowRight: [keyStep, 0],
    ArrowUp: [0, -keyStep],
    ArrowDown: [0, keyStep]
};

// Arrow keys move the focused object in small steps, so the garden can be played without a mouse.
function handleKey(gardenObject, event) {
    const move = keyMoves[event.key];

    // A held Enter or Space is one tap, not a stream of starts and stops.
    if (event.repeat && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        return;
    }

    if (!move) return;

    event.preventDefault();
    const { x, y } = readPosition(gardenObject);
    placeObject(gardenObject, x + move[0], y + move[1]);
    dropObject(gardenObject, true);
}

/* How-to-play guide -------------------------------------------------------- */
/*
Testers watched the old demonstration but still did not know what to do, so the guide is now
played along with. The rest of the garden dims and a hand taps on one animal with "Tap here".
Once the child taps it, the animal keeps singing and the hand shows dragging it up or down, then
to the right, to an arrow. Each step passes as soon as the animal comes most of the way to the
arrow, even while the finger is still down, so a child never has to push it to the window's edge.
It starts automatically once across all gardens; Help can reopen it, and the cross or
Escape ends it at any time.
*/
const guideBox = document.querySelector(".guide");
const guideSpot = guideBox.querySelector(".guideSpot");
const guideHand = guideBox.querySelector(".guideHand");
const guideArrow = guideBox.querySelector(".guideArrow");
const guideTitle = guideBox.querySelector(".guideTitle");
const guideHint = guideBox.querySelector(".guideHint");
const guideLabel = guideBox.querySelector(".guideLabel");
const guideClose = guideBox.querySelector(".guideClose");
const guideReach = 0.7;
let guide = null;
const guideHistoryKey = "gardenOfSoundsGuideShown";
let guideShown = false;

// All three gardens share this flag, including reloads and new tabs in the same browser.
function hasSeenGuide() {
    if (guideShown) return true;
    let storageAvailable = false;
    for (const storageName of ["localStorage", "sessionStorage"]) {
        try {
            if (window[storageName].getItem(guideHistoryKey) === "yes") return true;
            storageAvailable = true;
        } catch {
            // Try session storage if persistent storage is blocked.
        }
    }
    // With no storage, leave Help available instead of repeating guidance on every page.
    return !storageAvailable;
}

function rememberGuide() {
    guideShown = true;
    try {
        localStorage.setItem(guideHistoryKey, "yes");
    } catch {
        try {
            sessionStorage.setItem(guideHistoryKey, "yes");
        } catch {
            // Help still works when the browser cannot save a visit.
        }
    }
}

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// Resolves once the check passes, or with false if the guide was closed first.
async function waitUntil(currentGuide, check) {
    while (guide === currentGuide) {
        if (check()) return true;
        await wait(100);
    }
    return false;
}

function showGuideStep(step, title, hint) {
    guideBox.dataset.step = step;
    guideTitle.textContent = title;
    guideHint.textContent = hint;
    announce(`${title} ${hint}`);
}

// The spotlight, hand, arrow and words follow the object, even while it is being dragged.
function placeGuide() {
    if (!guide) return;

    const box = guide.target.item.getBoundingClientRect();
    const x = (box.left + box.right) / 2;
    const y = (box.top + box.bottom) / 2;
    const radius = Math.max(box.width, box.height) * 0.62 + 18;

    guideBox.style.setProperty("--spotX", `${x}px`);
    guideBox.style.setProperty("--spotY", `${y}px`);
    guideBox.style.setProperty("--spotSize", `${radius * 2}px`);

    // The arrow stays where it was put, as a place to drag to, and the hand always heads for it.
    const moveX = guide.arrow ? (guide.arrow.x - x) * 0.8 : 0;
    const moveY = guide.arrow ? (guide.arrow.y - y) * 0.8 : 0;
    guideBox.style.setProperty("--moveX", `${moveX}px`);
    guideBox.style.setProperty("--moveY", `${moveY}px`);

    // The words sit under the spotlight, out of the drag's way, or above it when there is no room.
    const labelHeight = guideLabel.offsetHeight;
    const below = y + radius + 12;
    const above = y - radius - 12 - labelHeight;
    const fitsBelow = below + labelHeight < window.innerHeight - 8;
    const labelY = moveY > 0 || !fitsBelow ? above : below;
    const halfWidth = guideLabel.offsetWidth / 2;
    guideLabel.style.setProperty("--labelX", `${clamp(x, halfWidth + 8, window.innerWidth - halfWidth - 8)}px`);
    guideLabel.style.setProperty("--labelY", `${Math.max(labelY, 8)}px`);

    requestAnimationFrame(placeGuide);
}

function findCentre(gardenObject) {
    const box = gardenObject.item.getBoundingClientRect();
    return {
        x: (box.left + box.right) / 2,
        y: (box.top + box.bottom) / 2
    };
}

// The arrow is placed once and stays there while the child drags.
function pointGuide(direction) {
    const { up } = readPlace(guide.target);
    const centre = findCentre(guide.target);
    const margin = guideArrow.offsetWidth / 2 + 12 || 60;
    let moveX = 0;
    let moveY = 0;

    // Up or down goes where there is more room. Across always goes right, towards quicker
    // notes, since a child hears a speed-up at once but has to wait to notice a slow-down.
    if (direction === "up") {
        moveY = (up < 0.5 ? -1 : 1) * window.innerHeight * 0.28;
    } else {
        moveX = window.innerWidth * 0.28;
    }
    guide.start = centre;
    guide.arrow = {
        x: clamp(centre.x + moveX, margin, window.innerWidth - margin),
        y: clamp(centre.y + moveY, margin, window.innerHeight - margin)
    };
    guideArrow.style.setProperty("--arrowX", `${guide.arrow.x}px`);
    guideArrow.style.setProperty("--arrowY", `${guide.arrow.y}px`);

    guideArrow.src = buttonSource(direction === "up" ? "arrow-up" : "arrow-right");
    guideArrow.style.setProperty("--arrowTurn", moveY > 0 || moveX < 0 ? "180deg" : "0deg");
    return moveY < 0 || moveX > 0;
}

// True once the object has come most of the way from where the step began to the arrow.
function hasReachedArrow(axis) {
    const distance = guide.arrow[axis] - guide.start[axis];
    const travelled = findCentre(guide.target)[axis] - guide.start[axis];
    // An animal already at the edge has nowhere to go, so a small move that way is enough.
    if (Math.abs(distance) < 40) return Math.sign(travelled) === Math.sign(distance) && Math.abs(travelled) > 10;
    return travelled / distance >= guideReach;
}

async function runGuide() {
    if (guide) return;

    const target = gardenObjects.find(gardenObject => gardenObject.family === families.animal);
    const currentGuide = { target };
    guide = currentGuide;
    helpButton.setAttribute("aria-pressed", "true");
    document.body.classList.add("isGuiding");
    target.item.classList.add("isGuideTarget");
    if (target.isPlaying) stopPlaying(target);
    guideBox.hidden = false;
    // Count an automatic or manual guide only once it is actually displayed.
    rememberGuide();
    // A mouse click on the help key should not leave a focus ring on it under the shade.
    helpButton.blur();
    placeGuide();

    // Tap: the hand taps on the animal until the child taps it too.
    showGuideStep("tap", "Tap here!", `Every object plays music. The ${target.name.toLowerCase()} sings again and again.`);
    if (!(await waitUntil(currentGuide, () => target.isPlaying))) return;
    await wait(900);
    if (guide !== currentGuide) return;

    // Up and down: the step passes once the animal reaches the arrow.
    const goesUp = pointGuide("up");
    showGuideStep("up", goesUp ? "Drag it up!" : "Drag it down!",
        goesUp ? "Higher up sings higher notes." : "Lower down sings lower notes.");
    if (!(await waitUntil(currentGuide, () => hasReachedArrow("y")))) return;
    await wait(600);
    if (guide !== currentGuide) return;

    // Then to the right, in the same way.
    pointGuide("across");
    showGuideStep("across", "Drag it right!", "Further right plays faster.");
    if (!(await waitUntil(currentGuide, () => hasReachedArrow("x")))) return;
    await wait(600);
    if (guide !== currentGuide) return;

    guide.arrow = null;
    showGuideStep("done", "Your turn!", "Tap more objects to make music together, or the play button for the whole garden.");
    await wait(3500);
    if (guide === currentGuide) endGuide();
}

function endGuide() {
    if (!guide) return;

    guide.target.item.classList.remove("isGuideTarget");
    guide = null;
    guideBox.hidden = true;
    delete guideBox.dataset.step;
    document.body.classList.remove("isGuiding");
    helpButton.setAttribute("aria-pressed", "false");
    lastActivity = performance.now();
}

/* Gentle hints -------------------------------------------------------------- */
/*
When a garden opens, and again after a quiet spell, the playable objects wiggle one after
another, so a child can tell them apart from the flowers, basket and lake in the picture.
*/
let lastActivity = performance.now();

function wiggleObjects() {
    gardenObjects.forEach((gardenObject, index) => {
        if (gardenObject.isPlaying || gardenObject.drag) return;

        // Reduced motion swaps the wiggle for a brief brightening.
        const keyframes = reducedMotionQuery.matches
            ? [{ filter: "brightness(1)" }, { filter: "brightness(1.25)" },
                { filter: "brightness(1)" }]
            : [{ rotate: "0deg" }, { rotate: "-7deg" }, { rotate: "6deg" }, { rotate: "0deg" }];

        gardenObject.image.animate(keyframes, {
            duration: 600,
            delay: index * 120,
            easing: "ease-in-out"
        });
    });
}

/* User input and setup ------------------------------------------------------ */
gardenObjects.forEach(gardenObject => {
    const { button, item } = gardenObject;

    button.addEventListener("pointerdown", event => startDrag(gardenObject, event));
    button.addEventListener("pointermove", event => moveDrag(gardenObject, event));
    button.addEventListener("pointerup", event => endDrag(gardenObject, event, true));
    button.addEventListener("pointercancel", event => endDrag(gardenObject, event, false));
    button.addEventListener("keydown", event => handleKey(gardenObject, event));

    // Clicks still cover Enter and Space; pointer taps were already played on release.
    button.addEventListener("click", () => {
        // Some browsers end a drag or a tap with a click, so a click just after one is ignored.
        const lastPointerEnd = Math.max(gardenObject.dragEndedAt, gardenObject.tappedAt);
        if (performance.now() - lastPointerEnd < 400) return;
        toggleObject(gardenObject);
    });

    item.addEventListener("animationend", event => {
        if (event.animationName === "object-glow") item.classList.remove("isGlowing");
    });

    updatePlace(gardenObject);
});

quietButton.addEventListener("click", playOrStopGarden);
updateQuietButton();
helpButton.addEventListener("click", () => {
    if (guide) {
        endGuide();
    } else {
        runGuide();
    }
});
guideClose.addEventListener("click", endGuide);
document.addEventListener("keydown", event => {
    if (event.key === "Escape") endGuide();
});

// Any touch or key counts as play, which holds back the hints.
["pointerdown", "keydown"].forEach(type => {
    document.addEventListener(type, () => {
        lastActivity = performance.now();
    });
});

setTimeout(wiggleObjects, 600);
setInterval(() => {
    const isIdle = performance.now() - lastActivity > idleHintDelay;
    if (isIdle && !guide && !hasPlayingObject()) {
        wiggleObjects();
        lastActivity = performance.now();
    }
}, 5000);

// Show the guide automatically only in the first garden visited. Recheck after a drag or a
// manual Help visit, so a delayed entry timer cannot reopen a guide that was already shown.
function startGuideOnEntry() {
    if (hasSeenGuide()) return;
    if (gardenObjects.some(gardenObject => gardenObject.drag)) {
        setTimeout(startGuideOnEntry, 300);
    } else {
        runGuide();
    }
}
setTimeout(startGuideOnEntry, 1400);

// A tap on the garden picture itself answers with a small ripple, so every touch gets feedback.
gardenStage.addEventListener("pointerdown", event => {
    if (event.target.closest(".objectButton")) return;

    const sceneBounds = gardenScene.getBoundingClientRect();
    const x = (event.clientX - sceneBounds.left) / sceneBounds.width * 100;
    const y = (event.clientY - sceneBounds.top) / sceneBounds.height * 100;
    addRipple(x, y, Math.min(sceneBounds.width * 0.08, 110));
});

// A new screen shape moves the objects on screen, so every object's place is read again.
window.addEventListener("resize", () => {
    gardenObjects.forEach(gardenObject => {
        // Moved objects are kept on screen; the others use the new shape's start places.
        if (gardenObject.item.style.getPropertyValue("--x")) {
            const { x, y } = readPosition(gardenObject);
            placeObject(gardenObject, x, y);
        }
        updatePlace(gardenObject);
    });
});

// A hidden page suspends the sound, so notes and movements do not pile up while away.
document.addEventListener("visibilitychange", () => {
    if (!gardenOutput) return;

    const context = Tone.getContext().rawContext;
    if (document.hidden) {
        context.suspend();
    } else {
        context.resume();
    }
});
