"use strict";

/*
This script makes every garden object playable. An object's height picks its register and its
place from left to right picks how often it repeats. A tap starts or stops its sound, and a drag
moves it. Each kind of action has its own feedback: a tap glows, every note moves the object and
a drop sends a ripple across the ground.
*/

/* Page elements and settings ------------------------------------------------ */
const gardenStage = document.querySelector(".gardenStage");
const gardenScene = document.querySelector(".gardenScene");
const rippleLayer = document.querySelector(".rippleLayer");
const soundStatus = document.querySelector("#sound-status");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const gardenKey = gardenScene.dataset.key;
const gardenTempo = Number(gardenScene.dataset.tempo);
const dragThreshold = 8;
const zoneMargin = 1.5;
const keyStep = 4;
const maxRipples = 6;

/* Musical mapping ----------------------------------------------------------- */
// Pentatonic steps never clash, so any mix of objects and places stays in tune.
const pentatonicSteps = [0, 2, 4, 7, 9];

/*
Prototype 1's three zones are kept because testers found them the clearest way to change a sound
on purpose. Low zones get a bounded volume boost so they stay audible on small speakers.
*/
const zones = {
    sky: {
        octave: 5,
        volume: -3,
        words: "high in the sky"
    },
    garden: {
        octave: 4,
        volume: 0,
        words: "in the middle of the garden"
    },
    ground: {
        octave: 3,
        volume: 3,
        words: "low on the ground"
    }
};

/*
Prototype 3's second axis is simplified to one change a child can both hear and see: the left,
middle and right of the garden repeat every half, quarter and eighth note.
*/
const columns = [
    {
        eighthNotes: 4,
        words: "slowly"
    },
    {
        eighthNotes: 2,
        words: "steadily"
    },
    {
        eighthNotes: 1,
        words: "quickly"
    }
];

/* Each kind of object keeps the sound family planned in Assignment 1. */
const families = {
    // Tools are soft pitched drums, one octave lower so they sit under the melodies.
    "gardening-tool": {
        octaveShift: -1,
        beatScale: 1,
        restChance: 0,
        noteLength: 0.2,
        volume: -10,
        motion: "sway",
        createSynth: () => new Tone.MembraneSynth({
            pitchDecay: 0.03,
            octaves: 2.5,
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
        octaveShift: 0,
        beatScale: 1,
        restChance: 0.2,
        noteLength: 0.22,
        volume: -7,
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
    // Fruits are slow ambient textures, so they change half as often as the other objects.
    fruit: {
        octaveShift: 0,
        beatScale: 2,
        restChance: 0,
        noteLength: 1.2,
        volume: -6,
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

/* Garden objects ------------------------------------------------------------ */
const gardenObjects = [...document.querySelectorAll(".gardenObject")].map(item => {
    const image = item.querySelector(".objectImage");

    return {
        item,
        image,
        button: item.querySelector(".objectButton"),
        name: image.alt,
        family: families[item.dataset.category],
        zone: "",
        column: 0,
        isPlaying: false,
        lastNote: 0,
        lastNoteTime: 0,
        dragEndedAt: 0,
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

function readLine(name) {
    return parseFloat(getComputedStyle(gardenScene).getPropertyValue(name));
}

function findZone(gardenObject) {
    const centre = readPosition(gardenObject).y - readHeight(gardenObject) / 2;
    const skyLine = readLine("--skyLine");
    const groundLine = readLine("--groundLine");
    let zone = "garden";

    if (centre < skyLine) zone = "sky";
    if (centre >= groundLine) zone = "ground";

    // A small margin stops an object resting on a line from flickering between two zones.
    const nearestLine = Math.min(Math.abs(centre - skyLine), Math.abs(centre - groundLine));
    if (gardenObject.zone && nearestLine < zoneMargin) return gardenObject.zone;
    return zone;
}

function findColumn(gardenObject) {
    return clamp(Math.floor(readPosition(gardenObject).x / (100 / 3)), 0, 2);
}

// Returns true when the object has moved into a different pitch zone.
function updatePlace(gardenObject) {
    const zone = findZone(gardenObject);
    const zoneChanged = zone !== gardenObject.zone;

    gardenObject.zone = zone;
    gardenObject.column = findColumn(gardenObject);

    // Objects lower in the garden are nearer the viewer, so they are drawn in front.
    const depth = Math.round(readPosition(gardenObject).y);
    gardenObject.item.style.setProperty("--depth", String(depth));

    // Gentle panning follows the object across the garden as well as its rhythm.
    if (gardenObject.voice) {
        const pan = (readPosition(gardenObject).x / 50 - 1) * 0.6;
        gardenObject.voice.panner.pan.rampTo(pan, 0.1);
    }

    return zoneChanged;
}

function describePlace(gardenObject) {
    const zoneWords = zones[gardenObject.zone].words;
    const speedWords = columns[gardenObject.column].words;
    return `${zoneWords}, where it plays ${speedWords}`;
}

function announce(message) {
    soundStatus.textContent = message;
}

/* Audio --------------------------------------------------------------------- */
let gardenOutput;
let beatCount = 0;

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

    if (!gardenOutput) startGardenClock();
    return true;
}

function startGardenClock() {
    const limiter = new Tone.Limiter(-3).toDestination();
    const transport = Tone.getTransport();

    // A little shared reverb places every object in the same garden.
    gardenOutput = new Tone.Reverb({
        decay: 2.5,
        wet: 0.22
    }).connect(limiter);

    // One shared eighth-note clock keeps every repeating object in time with the others.
    transport.bpm.value = gardenTempo;
    transport.scheduleRepeat(playBeat, "8n");
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

function chooseNote(gardenObject) {
    const octave = zones[gardenObject.zone].octave + gardenObject.family.octaveShift;
    const rootNote = Tone.Frequency(`${gardenKey}${octave}`).toMidi();

    // Controlled randomness: any note of the zone may play, but never the same one twice running.
    const choices = pentatonicSteps
        .map(step => rootNote + step)
        .filter(note => note !== gardenObject.lastNote);
    const note = choices[Math.floor(Math.random() * choices.length)];

    gardenObject.lastNote = note;
    return Tone.Frequency(note, "midi").toNote();
}

function getBeatSeconds(gardenObject) {
    const eighthNotes = columns[gardenObject.column].eighthNotes * gardenObject.family.beatScale;
    return Tone.Time("8n").toSeconds() * eighthNotes;
}

function playNote(gardenObject, time, velocity) {
    const { synth } = getVoice(gardenObject);
    const volume = gardenObject.family.volume + zones[gardenObject.zone].volume;

    synth.volume.setValueAtTime(volume, time);
    synth.triggerAttackRelease(chooseNote(gardenObject), gardenObject.family.noteLength, time,
        velocity);
    gardenObject.lastNoteTime = time;

    // Tone's Draw runs the movement on the frame that matches the note, as in Prototype 8.
    Tone.getDraw().schedule(() => moveWithNote(gardenObject), time);
}

function playBeat(time) {
    beatCount += 1;

    gardenObjects.forEach(gardenObject => {
        if (!gardenObject.isPlaying) return;

        const eighthNotes = columns[gardenObject.column].eighthNotes;
        if (beatCount % (eighthNotes * gardenObject.family.beatScale) !== 0) return;

        // A note just played by a tap stands in for the next beat, so the two never double up.
        if (time - gardenObject.lastNoteTime < getBeatSeconds(gardenObject) / 2) return;
        if (Math.random() < gardenObject.family.restChance) return;

        // Small velocity changes keep each repeating pattern sounding organic, as in Prototype 3.
        playNote(gardenObject, time, 0.5 + Math.random() * 0.18);
    });
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
    const duration = Math.min(motion.duration, getBeatSeconds(gardenObject) * 900);

    gardenObject.image.animate(motion.keyframes(amount), {
        duration,
        easing: "ease-out"
    });
}

function glowObject(gardenObject) {
    gardenObject.item.classList.remove("isGlowing");

    // Reading layout lets the same class restart after rapid repeated taps, as in Prototype 5.
    void gardenObject.item.offsetWidth;
    gardenObject.item.classList.add("isGlowing");
}

function createRipple(gardenObject) {
    // Keep the number of rings small even when a child moves objects very quickly.
    while (rippleLayer.childElementCount >= maxRipples) {
        rippleLayer.firstElementChild.remove();
    }

    const { x, y } = readPosition(gardenObject);
    const ripple = document.createElement("span");

    ripple.className = "groundRipple";
    ripple.style.setProperty("--x", `${x}%`);
    ripple.style.setProperty("--y", `${y}%`);
    ripple.style.setProperty("--rippleWidth", `${gardenObject.item.offsetWidth * 1.4}px`);
    rippleLayer.append(ripple);

    // The timer covers browsers that skip the end event, for example in a hidden tab.
    ripple.addEventListener("animationend", () => ripple.remove());
    setTimeout(() => ripple.remove(), 1200);
}

/* Tapping ------------------------------------------------------------------- */
async function toggleObject(gardenObject) {
    if (!(await prepareAudio())) return;

    gardenObject.isPlaying = !gardenObject.isPlaying;
    gardenObject.button.setAttribute("aria-pressed", String(gardenObject.isPlaying));
    updatePlace(gardenObject);

    // Every tap sounds: a start plays its first note at once, and a stop plays one quiet note.
    const velocity = gardenObject.isPlaying ? 0.7 : 0.35;
    playNote(gardenObject, Tone.immediate() + 0.02, velocity);
    glowObject(gardenObject);

    if (gardenObject.isPlaying) {
        announce(`${gardenObject.name} is playing ${describePlace(gardenObject)}.`);
    } else {
        announce(`${gardenObject.name} stopped.`);
    }
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
        gardenObject.item.classList.add("isDragging");
    }

    const sceneBounds = gardenScene.getBoundingClientRect();
    const x = (event.clientX - drag.offsetX - sceneBounds.left) / sceneBounds.width * 100;
    const y = (event.clientY - drag.offsetY - sceneBounds.top) / sceneBounds.height * 100;
    placeObject(gardenObject, x, y);

    // Prototype 1 only sounded on release. A note on entering each zone lets the change be heard.
    if (updatePlace(gardenObject) && audioIsRunning()) {
        playNote(gardenObject, Tone.immediate() + 0.02, 0.45);
    }
}

async function dropObject(gardenObject, canStartAudio) {
    updatePlace(gardenObject);
    createRipple(gardenObject);
    announce(`${gardenObject.name} moved ${describePlace(gardenObject)}.`);

    const isReady = canStartAudio ? await prepareAudio() : audioIsRunning();

    // A resting object answers with one note from its new place, as Prototype 1 did on release.
    if (isReady && !gardenObject.isPlaying) {
        playNote(gardenObject, Tone.immediate() + 0.02, 0.6);
    }
}

function endDrag(gardenObject, event, canStartAudio) {
    const drag = gardenObject.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;

    gardenObject.drag = null;

    // A press without movement is left to the click event, which treats it as a tap.
    if (!drag.hasMoved) return;

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

/* User input and setup ------------------------------------------------------ */
gardenObjects.forEach(gardenObject => {
    const { button, item } = gardenObject;

    button.addEventListener("pointerdown", event => startDrag(gardenObject, event));
    button.addEventListener("pointermove", event => moveDrag(gardenObject, event));
    button.addEventListener("pointerup", event => endDrag(gardenObject, event, true));
    button.addEventListener("pointercancel", event => endDrag(gardenObject, event, false));
    button.addEventListener("keydown", event => handleKey(gardenObject, event));

    // Native button clicks cover mouse, touch, Enter and Space with one handler.
    button.addEventListener("click", () => {
        // Some browsers end a drag with a click, so a click just after a drop is ignored.
        if (performance.now() - gardenObject.dragEndedAt < 400) return;
        toggleObject(gardenObject);
    });

    item.addEventListener("animationend", event => {
        if (event.animationName === "object-glow") item.classList.remove("isGlowing");
    });

    updatePlace(gardenObject);
});

// A new screen shape can move the zone lines, so every object's place is read again.
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

// A hidden page pauses the shared clock so notes and movements do not pile up while away.
document.addEventListener("visibilitychange", () => {
    if (!gardenOutput) return;

    if (document.hidden) {
        Tone.getTransport().pause();
    } else {
        Tone.getTransport().start();
    }
});
