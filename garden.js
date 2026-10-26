"use strict";

/*
This script makes every garden object playable. An object's height picks its register and its
place from left to right picks how often it repeats. A tap starts or stops its sound, and a drag
moves it. Each kind of action has its own feedback: a press squashes the object at once, a tap
glows, every note moves the object, a drop sends a ripple across the ground, and a tap on the
garden itself sends a small ripple too, so no touch goes unanswered. Several fingers can play
different objects at the same time. A playing object keeps a soft halo and sends up a small note
with every sound, the play button starts the whole garden in a shuffled order and then becomes a
pause button, and the help button replays a short demonstration of how height and place change
the sound.
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
const zoneMargin = 1.5;
const keyStep = 4;
const maxRipples = 6;
const maxNotes = 12;
const idleHintDelay = 20000;

// The floating note, the demo arrows and the play key share the buttons' folder and version.
const noteSource = quietButton.querySelector(".buttonImage").src.replace("quiet-raised", "note");

function buttonSource(name) {
    return noteSource.replace("/note.", `/${name}.`);
}

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
    const button = item.querySelector(".objectButton");

    // The halo behind each object shows while it plays.
    const halo = document.createElement("span");
    halo.className = "playHalo";
    button.prepend(halo);

    return {
        item,
        image,
        button,
        halo,
        name: image.alt,
        family: families[item.dataset.category],
        zone: "",
        column: 0,
        isPlaying: false,
        lastNote: 0,
        lastNoteTime: 0,
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
    pulseHalo(gardenObject.halo, duration);

    const { x, y } = readPosition(gardenObject);
    floatNote(x, y - readHeight(gardenObject));
}

// The halo swells with each note, so the pulse matches the sound.
function pulseHalo(halo, duration) {
    halo.animate([
        { scale: 1, opacity: 0.8 },
        { scale: 1.25, opacity: 1 },
        { scale: 1, opacity: 0.8 }
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
let pausedObjects = [];
let gardenStartTimers = [];
let isStartingGarden = false;

function shuffleObjects(objects) {
    const shuffled = [...objects];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
}

function cancelGardenStart() {
    gardenStartTimers.forEach(timer => clearTimeout(timer));
    gardenStartTimers = [];
    isStartingGarden = false;
}

function setPlaying(gardenObject, isPlaying) {
    gardenObject.isPlaying = isPlaying;
    gardenObject.button.setAttribute("aria-pressed", String(isPlaying));
    gardenObject.item.classList.toggle("isPlaying", isPlaying);

    // Starting a new sound forgets the paused ones, so the key goes back to pausing.
    if (isPlaying) pausedObjects = [];
    updateQuietButton();
}

/*
The garden key always shows what it will do. At rest it shows play and starts every object in a
shuffled order. While sounds are active it shows pause, and after pausing it shows play so the same
objects can return.
*/
function updateQuietButton() {
    const isPaused = pausedObjects.length > 0;
    const isActive = isStartingGarden || hasPlayingObject();
    const key = isPaused || !isActive ? "resume" : "quiet";
    const [raised, flat] = quietButton.querySelectorAll("img");

    raised.src = buttonSource(`${key}-raised`);
    flat.src = buttonSource(key);
    raised.alt = isPaused ? "Play the sounds again" :
        isActive ? "Pause all sounds" : "Play the whole garden";
}

async function startObjects(objects, message) {
    if (!(await prepareAudio())) return;

    cancelGardenStart();
    pausedObjects = [];
    isStartingGarden = true;
    updateQuietButton();

    let elapsed = 0;
    const shuffled = shuffleObjects(objects);

    shuffled.forEach((gardenObject, index) => {
        const timer = setTimeout(() => {
            if (!gardenObject.isPlaying) {
                setPlaying(gardenObject, true);
                updatePlace(gardenObject);
                playNote(gardenObject, Tone.immediate() + 0.02, 0.6);
                glowObject(gardenObject);
            }

            if (index === shuffled.length - 1) {
                gardenStartTimers = [];
                isStartingGarden = false;
                updateQuietButton();
                announce(message);
            }
        }, elapsed);

        gardenStartTimers.push(timer);
        elapsed += 120 + Math.random() * 180;
    });
}

async function pauseOrResume() {
    if (pausedObjects.length > 0) {
        const paused = pausedObjects;
        await startObjects(paused, "Playing again.");
        return;
    }

    const playing = gardenObjects.filter(gardenObject => gardenObject.isPlaying);

    if (playing.length === 0) {
        await startObjects(gardenObjects, "The whole garden is playing.");
        return;
    }

    cancelGardenStart();

    // Each object glows once as it pauses.
    playing.forEach(gardenObject => {
        setPlaying(gardenObject, false);
        glowObject(gardenObject);
    });
    pausedObjects = playing;
    updateQuietButton();
    announce("Paused. Press play to hear them again.");
}
async function toggleObject(gardenObject) {
    if (!(await prepareAudio())) return;

    setPlaying(gardenObject, !gardenObject.isPlaying);
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

    // Dropping an object starts its repeating pattern from the new position.
    if (isReady) {
        if (!gardenObject.isPlaying) setPlaying(gardenObject, true);
        playNote(gardenObject, Tone.immediate() + 0.02, 0.6);
        glowObject(gardenObject);
    }
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

/* How-to-play demonstration ------------------------------------------------- */
/*
A see-through copy of an animal shows the two moves. First it rises from the ground to the sky
while its notes climb, then it slides from left to right while its notes come faster and faster.
A big arrow goes first on the same line, and the copy follows behind it. The help button replays
it with sound, and it plays once, silently, on a child's first visit.
*/
const riseDuration = 2800;
const slideDuration = 4500;
const slideGaps = [600, 300, 150];
const arrowLead = 400;
let isDemoRunning = false;

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function makeDemoPicture(className, source, x, y) {
    const picture = document.createElement("img");
    picture.className = className;
    picture.src = source;
    picture.alt = "";
    picture.style.setProperty("--x", `${x}%`);
    picture.style.setProperty("--y", `${y}%`);
    noteLayer.append(picture);
    return picture;
}

// Moves a demo picture between two places, given as percentages of the garden.
function glide(picture, from, to, duration, easing) {
    return picture.animate([
        { left: `${from.x}%`, top: `${from.y}%` },
        { left: `${to.x}%`, top: `${to.y}%` }
    ], {
        duration,
        easing: reducedMotionQuery.matches ? "steps(3, jump-none)" : easing,
        fill: "forwards"
    });
}

async function runDemo(withSound) {
    if (isDemoRunning) return;
    isDemoRunning = true;
    helpButton.setAttribute("aria-pressed", "true");

    const hasSound = withSound ? await prepareAudio() : audioIsRunning();
    const model = gardenObjects.find(gardenObject => gardenObject.family === families.animal);
    const height = readHeight(model);
    const skyLine = readLine("--skyLine");
    const groundLine = readLine("--groundLine");
    const instant = reducedMotionQuery.matches;
    let synth = null;

    if (hasSound) {
        synth = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.4 },
            volume: -6
        }).connect(gardenOutput);
    }

    // The copy is placed by its base point, like the real objects.
    const ghost = document.createElement("div");
    const ghostHalo = document.createElement("span");
    ghost.className = "demoGhost";
    ghostHalo.className = "playHalo";
    ghost.style.setProperty("--w", `${model.item.offsetWidth}px`);
    ghost.append(ghostHalo, model.image.cloneNode());
    ghost.lastChild.alt = "";
    noteLayer.append(ghost);

    function sound(octave, step, x, y) {
        if (synth) {
            const note = Tone.Frequency(`${gardenKey}${octave}`).toMidi() + step;
            synth.triggerAttackRelease(Tone.Frequency(note, "midi").toNote(), 0.25,
                Tone.immediate() + 0.02);
        }
        pulseHalo(ghostHalo, 300);
        floatNote(x, y - height);
    }

    // The arrow keeps a small gap from the copy and stays inside the window.
    const layer = noteLayer.getBoundingClientRect();
    const upArrow = makeDemoPicture("demoArrow", buttonSource("arrow-up"), 0, 0);
    const arrowSize = upArrow.offsetWidth;
    const gap = arrowSize * 0.2;
    const leadY = (arrowSize / 2 + gap) / layer.height * 100;
    const leadX = (model.item.offsetWidth / 2 + gap + arrowSize / 2) / layer.width * 100;
    const topLimit = (arrowSize / 2 + 12 - layer.top) / layer.height * 100;
    const rightLimit = (window.innerWidth - arrowSize / 2 - 12 - layer.left) / layer.width * 100;

    // Rise: the copy starts in the ground zone and ends in the sky zone, under its arrow.
    const riseX = 50;
    const lowY = Math.min(groundLine + height / 2 + 4, 98);
    const highY = Math.max(skyLine + height / 2 - 6, topLimit + leadY + height);
    const riseFrom = { x: riseX, y: lowY - height - leadY };
    const riseTo = { x: riseX, y: highY - height - leadY };

    ghost.style.setProperty("--x", `${riseX}%`);
    ghost.style.setProperty("--y", `${lowY}%`);
    upArrow.style.setProperty("--x", `${riseFrom.x}%`);
    upArrow.style.setProperty("--y", `${riseFrom.y}%`);
    upArrow.classList.add("isShown");
    announce("Watch: higher up plays higher notes.");

    // The arrow sets off first and the copy follows a moment later.
    glide(upArrow, riseFrom, riseTo, riseDuration, "ease-in-out");
    await wait(arrowLead);
    glide(ghost, { x: riseX, y: lowY }, { x: riseX, y: highY }, riseDuration, "ease-in-out");

    // One note in each zone, as the copy passes through it.
    for (const [index, zone] of ["ground", "garden", "sky"].entries()) {
        await wait(riseDuration * (index === 0 ? 0.12 : 0.38));
        const y = lowY + (highY - lowY) * (0.12 + index * 0.38);
        sound(zones[zone].octave + model.family.octaveShift, pentatonicSteps[index * 2], riseX, y);
    }
    await wait(riseDuration * 0.12 + 300);
    upArrow.remove();

    // Slide: the copy crosses the three columns in the middle zone, sounding ever more often.
    const middleY = (skyLine + groundLine) / 2 + height / 2;
    const startX = 10;
    const endX = Math.min(90, rightLimit - leadX);
    const slideFrom = { x: startX + leadX, y: middleY - height / 2 };
    const slideTo = { x: endX + leadX, y: middleY - height / 2 };
    const rightArrow = makeDemoPicture("demoArrow", buttonSource("arrow-right"), slideFrom.x,
        slideFrom.y);

    ghost.getAnimations().forEach(animation => animation.cancel());
    ghost.style.setProperty("--x", `${startX}%`);
    ghost.style.setProperty("--y", `${middleY}%`);
    rightArrow.classList.add("isShown");
    announce("Further right plays faster.");

    glide(rightArrow, slideFrom, slideTo, slideDuration, "linear");
    await wait(arrowLead);
    glide(ghost, { x: startX, y: middleY }, { x: endX, y: middleY }, slideDuration, "linear");

    const start = performance.now();
    const third = slideDuration / 3;
    for (const [column, gap] of slideGaps.entries()) {
        for (let time = column * third; time < (column + 1) * third - 10; time += gap) {
            await wait(Math.max(0, start + time - performance.now()));
            const progress = instant ? column / 2 : time / slideDuration;
            sound(zones.garden.octave + model.family.octaveShift, 0,
                startX + (endX - startX) * progress, middleY);
        }
    }
    await wait(Math.max(0, start + slideDuration - performance.now()) + 200);

    await ghost.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 400 }).finished;
    ghost.remove();
    rightArrow.remove();
    if (synth) setTimeout(() => synth.dispose(), 1000);
    helpButton.setAttribute("aria-pressed", "false");
    isDemoRunning = false;
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

function hasPlayingObject() {
    return gardenObjects.some(gardenObject => gardenObject.isPlaying);
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

quietButton.addEventListener("click", pauseOrResume);
updateQuietButton();
helpButton.addEventListener("click", () => runDemo(true));

// Any touch or key counts as play, which holds back the hints.
["pointerdown", "keydown"].forEach(type => {
    document.addEventListener(type, () => {
        lastActivity = performance.now();
        clearTimeout(firstVisitDemo);
    });
});

setTimeout(wiggleObjects, 600);
setInterval(() => {
    const isIdle = performance.now() - lastActivity > idleHintDelay;
    if (isIdle && !isDemoRunning && !hasPlayingObject()) {
        wiggleObjects();
        lastActivity = performance.now();
    }
}, 5000);

// The demonstration plays once per visit, after the wiggle, unless the child has already begun.
let firstVisitDemo;
try {
    if (!sessionStorage.getItem("gardenDemoShown")) {
        sessionStorage.setItem("gardenDemoShown", "yes");
        firstVisitDemo = setTimeout(() => runDemo(false), 2200);
    }
} catch {
    // Without storage the demonstration simply waits for the help button.
}

// A tap on the garden picture itself answers with a small ripple, so every touch gets feedback.
gardenStage.addEventListener("pointerdown", event => {
    if (event.target.closest(".objectButton")) return;

    const sceneBounds = gardenScene.getBoundingClientRect();
    const x = (event.clientX - sceneBounds.left) / sceneBounds.width * 100;
    const y = (event.clientY - sceneBounds.top) / sceneBounds.height * 100;
    addRipple(x, y, Math.min(sceneBounds.width * 0.08, 110));
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
