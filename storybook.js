"use strict";

/*
This script opens the storybook before a garden loads. Choosing the sign or a chapter turns the
cover, brings the open book to the middle of the window and then fades into the garden. Without
the script the links still go straight to the gardens.
*/

/* Page elements and settings ------------------------------------------------ */
const storybook = document.querySelector(".storybook");
const bookLinks = document.querySelectorAll("[data-opens-book]");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

// These match the transitions in style.css.
const openDuration = 900;
const leaveDuration = 400;

/* Opening the book ---------------------------------------------------------- */
/*
The open book is twice as wide as the closed one and centred on its spine, so it moves until the
spine sits in the middle of the window and shrinks if it would not fit.
*/
function placeOpenBook() {
    const bookBox = storybook.getBoundingClientRect();
    const openScale = Math.min(1, (window.innerWidth * 0.94) / (bookBox.width * 2),
        (window.innerHeight * 0.9) / bookBox.height);

    storybook.style.setProperty("--openX", `${window.innerWidth / 2 - bookBox.left}px`);
    storybook.style.setProperty("--openY",
        `${window.innerHeight / 2 - (bookBox.top + bookBox.height / 2)}px`);
    storybook.style.setProperty("--openScale", openScale);
}

function openBook(event) {
    // New-tab clicks, reduced motion and a second click all follow the link straight away.
    const isPlainClick = event.button === 0 && !event.metaKey && !event.ctrlKey &&
        !event.shiftKey && !event.altKey;

    if (!isPlainClick || reducedMotionQuery.matches || storybook.classList.contains("isOpen")) {
        return;
    }

    event.preventDefault();
    const gardenAddress = event.currentTarget.href;

    placeOpenBook();
    document.body.classList.add("isOpening");
    storybook.classList.add("isOpen");

    window.setTimeout(() => {
        document.body.classList.add("isLeaving");
    }, openDuration);
    window.setTimeout(() => {
        window.location.assign(gardenAddress);
    }, openDuration + leaveDuration);
}

/* Event wiring -------------------------------------------------------------- */
bookLinks.forEach(link => {
    link.addEventListener("click", openBook);
});

// Coming back with the browser's back button shows the closed book again.
window.addEventListener("pageshow", event => {
    if (event.persisted) {
        document.body.classList.remove("isOpening", "isLeaving");
        storybook.classList.remove("isOpen");
    }
});
