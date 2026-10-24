"use strict";

/*
This script makes the storybook open, turn and close like a real book. Tapping the cover opens
it, the big arrows or a swipe turn the pages, and the cross closes it again. Tapping a garden
zooms into it before its page loads. Coming back from a garden opens the book on that garden's
pages. Without the script every garden page is still a plain link.
*/

/* Page elements and settings ------------------------------------------------ */
const book = document.querySelector(".book");
const leaves = [...book.querySelectorAll(".leaf")];
const stillPage = book.querySelector(".stillPage");
const backButton = document.querySelector(".backButton");
const nextButton = document.querySelector(".nextButton");
const closeButton = document.querySelector(".closeButton");
const bookStatus = document.querySelector("#book-status");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

// These match the transitions in style.css.
const turnDuration = 850;
const enterDuration = 800;
const closeStagger = 140;
const swipeDistance = 50;

// The last spread shows the back of the last leaf and the page that lies flat under it.
const lastSpread = leaves.length;
const gardenOrder = ["lakeside-picnic", "painted-orchard", "flower-meadow"];

// The wash that covers the zoom matches each garden's sky, so the garden seems to appear.
const gardenWashes = {
    "lakeside-picnic": "#f6bcd3",
    "painted-orchard": "#f3c16f",
    "flower-meadow": "#9cc9e6"
};

const spreadWords = [
    "The book is closed.",
    "Once upon a time, in a garden full of sounds.",
    "Lakeside picnic.",
    "Painted orchard.",
    "Giant flower meadow."
];

let spread = 0;
let isEntering = false;

/* Page-turn sound ----------------------------------------------------------- */
/*
A soft rustle of paper, made from a short burst of filtered noise. It needs no sound files and
starts only after a tap, as browsers require.
*/
let audioContext;

function playRustle(isCover) {
    try {
        audioContext = audioContext || new AudioContext();
        if (audioContext.state === "suspended") audioContext.resume();

        const now = audioContext.currentTime;
        const length = isCover ? 0.5 : 0.35;
        const noise = audioContext.createBuffer(1, audioContext.sampleRate * length,
            audioContext.sampleRate);
        const samples = noise.getChannelData(0);
        for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;

        const source = audioContext.createBufferSource();
        const filter = audioContext.createBiquadFilter();
        const volume = audioContext.createGain();

        source.buffer = noise;
        filter.type = "bandpass";
        filter.Q.value = 0.8;
        filter.frequency.setValueAtTime(isCover ? 500 : 900, now);
        filter.frequency.exponentialRampToValueAtTime(isCover ? 1400 : 2600, now + length);
        volume.gain.setValueAtTime(0.0001, now);
        volume.gain.exponentialRampToValueAtTime(isCover ? 0.35 : 0.22, now + 0.06);
        volume.gain.exponentialRampToValueAtTime(0.0001, now + length);

        source.connect(filter).connect(volume).connect(audioContext.destination);
        source.start(now);
    } catch {
        // The book still works silently where Web Audio is unavailable.
    }
}

/* Showing a spread ---------------------------------------------------------- */
/*
Only the two pages that can be seen are reachable by tap and keyboard. The others are inert, so
a hidden page can never be pressed through the one on top of it.
*/
function updateReachablePages() {
    leaves.forEach((leaf, index) => {
        const front = leaf.querySelector(".leafFront");
        const back = leaf.querySelector(".leafBack");

        front.inert = index !== spread;
        back.inert = index !== spread - 1;
    });
    stillPage.inert = spread !== lastSpread;

    backButton.classList.toggle("isResting", spread === 0);
    nextButton.classList.toggle("isResting", spread === lastSpread);
    closeButton.classList.toggle("isResting", spread === 0);
    document.body.classList.toggle("isBookOpen", spread > 0);
    book.dataset.spread = String(spread);
}

// Turned leaves pile up on the left with the newest on top; the rest wait on the right.
function stackLeaves() {
    leaves.forEach((leaf, index) => {
        leaf.style.zIndex = index < spread ? String(10 + index) : String(10 - index);
    });
}

function turnLeaf(leaf, isForward) {
    // The moving leaf rides above both piles until it lands.
    leaf.style.zIndex = "40";
    leaf.classList.add("isMoving");
    leaf.classList.toggle("isTurned", isForward);

    window.setTimeout(() => {
        leaf.classList.remove("isMoving");
        stackLeaves();
    }, turnDuration);
}

// The rings only show while the book is open, from the moment the cover passes upright.
function showRings(isOpen, delay) {
    window.setTimeout(() => {
        book.classList.toggle("showsRings", isOpen && spread > 0);
    }, delay);
}

function goTo(newSpread) {
    if (isEntering || newSpread === spread || newSpread < 0 || newSpread > lastSpread) return;

    const isForward = newSpread > spread;
    const steps = Math.abs(newSpread - spread);
    const instant = reducedMotionQuery.matches;
    const opensOrCloses = spread === 0 || newSpread === 0;

    // Several leaves turn one after another, like riffling back to the cover.
    for (let step = 0; step < steps; step += 1) {
        const leafIndex = isForward ? spread + step : spread - 1 - step;
        const delay = instant ? 0 : step * closeStagger;
        window.setTimeout(() => turnLeaf(leaves[leafIndex], isForward), delay);
    }

    if (opensOrCloses) {
        showRings(newSpread > 0, newSpread > 0 && !instant ? turnDuration / 2 : 0);
    }

    playRustle(opensOrCloses);
    spread = newSpread;
    updateReachablePages();
    bookStatus.textContent = spreadWords[spread];
}

/* Stepping into a garden ---------------------------------------------------- */
/*
The book grows around the page that was tapped until that page fills the window, then a wash in
the garden's colour fades in and the garden loads.
*/
function zoomOnto(pageElement) {
    const bookBox = book.getBoundingClientRect();
    const pageBox = pageElement.getBoundingClientRect();
    const centreX = pageBox.left + pageBox.width / 2 - bookBox.left;
    const centreY = pageBox.top + pageBox.height / 2 - bookBox.top;
    const zoom = Math.max(window.innerWidth / pageBox.width, window.innerHeight / pageBox.height);

    book.style.transformOrigin = `${centreX}px ${centreY}px`;
    book.style.translate = `${window.innerWidth / 2 - (bookBox.left + centreX)}px ` +
        `${window.innerHeight / 2 - (bookBox.top + centreY)}px`;
    book.style.scale = String(zoom * 1.05);
}

function enterGarden(link) {
    if (isEntering) return;

    const garden = link.dataset.garden;
    document.body.style.setProperty("--gardenWash", gardenWashes[garden]);

    if (reducedMotionQuery.matches) {
        window.location.assign(link.href);
        return;
    }

    isEntering = true;
    zoomOnto(link);
    document.body.classList.add("isEntering");
    window.setTimeout(() => window.location.assign(link.href), enterDuration);
}

// Returning from a garden opens the book on its pages and zooms back out of the garden.
function openOnGarden(garden) {
    const index = gardenOrder.indexOf(garden);
    if (index < 0) return;

    spread = index + 2;
    book.classList.add("isInstant");
    leaves.forEach((leaf, leafIndex) => leaf.classList.toggle("isTurned", leafIndex < spread));
    stackLeaves();
    updateReachablePages();
    book.classList.add("showsRings");
    bookStatus.textContent = spreadWords[spread];

    if (reducedMotionQuery.matches) {
        book.classList.remove("isInstant");
        return;
    }

    // Start zoomed into the garden's picture, then let the book shrink back to its place.
    const picture = leaves[spread - 1].querySelector(".leafBack");
    zoomOnto(picture);
    void book.offsetWidth;
    book.classList.remove("isInstant");
    book.style.translate = "";
    book.style.scale = "";
    window.setTimeout(() => {
        book.style.transformOrigin = "";
    }, enterDuration);
}

/* Taps, swipes and keys ----------------------------------------------------- */
let swipe = null;

function handleTurnButton(event) {
    const turn = event.currentTarget.dataset.turn;

    if (turn === "next") goTo(spread + 1);
    if (turn === "back") goTo(spread - 1);
    if (turn === "close") goTo(0);
}

// A swipe across the book turns the page, like dragging paper with a finger.
book.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;

    swipe = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
        hasTurned: false
    };
});

book.addEventListener("pointerup", event => {
    if (!swipe || event.pointerId !== swipe.pointerId) return;

    const distanceX = event.clientX - swipe.x;
    const distanceY = event.clientY - swipe.y;

    if (Math.abs(distanceX) > swipeDistance && Math.abs(distanceX) > Math.abs(distanceY)) {
        swipe.hasTurned = true;
        goTo(distanceX < 0 ? spread + 1 : spread - 1);
    }
});

book.addEventListener("pointercancel", () => {
    swipe = null;
});

// Prevent the browser's image-link drag from taking over a mouse or touch page turn.
book.addEventListener("dragstart", event => {
    event.preventDefault();
});

// A swipe ends with a click on the page under the finger, which must not also open a garden.
book.addEventListener("click", event => {
    if (swipe && swipe.hasTurned) {
        event.preventDefault();
        event.stopPropagation();
    }
    swipe = null;
}, true);

document.querySelectorAll("[data-turn]").forEach(button => {
    button.addEventListener("click", handleTurnButton);
});

book.querySelectorAll(".gardenPage").forEach(link => {
    link.addEventListener("click", event => {
        const isPlainClick = event.button === 0 && !event.metaKey && !event.ctrlKey &&
            !event.shiftKey && !event.altKey;
        if (!isPlainClick) return;

        event.preventDefault();
        enterGarden(link);
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") goTo(spread + 1);
    if (event.key === "ArrowLeft") goTo(spread - 1);
    if (event.key === "Escape") goTo(0);
});

/* Setup --------------------------------------------------------------------- */
stackLeaves();
updateReachablePages();
openOnGarden(window.location.hash.slice(1));

// The browser's back button can show this page from memory, still zoomed into a garden.
window.addEventListener("pageshow", event => {
    if (!event.persisted) return;

    isEntering = false;
    document.body.classList.remove("isEntering");
    book.style.translate = "";
    book.style.scale = "";
    book.style.transformOrigin = "";
});
