"use strict";

/*
This script lets a child pick up any garden object and put it down anywhere in the garden. Sound
is added to the same objects later.
*/

/* Page elements and settings ------------------------------------------------ */
const gardenScene = document.querySelector(".gardenScene");
const dragThreshold = 8;

/* Garden objects ------------------------------------------------------------ */
const gardenObjects = [...document.querySelectorAll(".gardenObject")].map(item => ({
    item,
    button: item.querySelector(".objectButton"),
    drag: null
}));

function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

// Positions are shares of the scene, so an object stays on the same patch at any screen size.
function readPosition(gardenObject) {
    const style = getComputedStyle(gardenObject.item);

    return {
        x: parseFloat(style.left) / gardenScene.clientWidth * 100,
        y: parseFloat(style.top) / gardenScene.clientHeight * 100
    };
}

function readHeight(gardenObject) {
    return gardenObject.item.offsetHeight / gardenScene.clientHeight * 100;
}

function placeObject(gardenObject, x, y) {
    const halfWidth = gardenObject.item.offsetWidth / gardenScene.clientWidth * 50;
    const height = readHeight(gardenObject);

    // The whole object stays inside the garden, however far a finger travels.
    gardenObject.item.style.setProperty("--x", `${clamp(x, halfWidth, 100 - halfWidth)}%`);
    gardenObject.item.style.setProperty("--y", `${clamp(y, height, 100)}%`);
}

function updatePlace(gardenObject) {
    // Objects lower in the garden are nearer the viewer, so they are drawn in front.
    const depth = Math.round(readPosition(gardenObject).y);
    gardenObject.item.style.setProperty("--depth", String(depth));
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
    updatePlace(gardenObject);
}

function endDrag(gardenObject, event) {
    const drag = gardenObject.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;

    gardenObject.drag = null;
    if (!drag.hasMoved) return;

    gardenObject.item.classList.remove("isDragging");
    updatePlace(gardenObject);
}

/* User input and setup ------------------------------------------------------ */
gardenObjects.forEach(gardenObject => {
    const { button } = gardenObject;

    button.addEventListener("pointerdown", event => startDrag(gardenObject, event));
    button.addEventListener("pointermove", event => moveDrag(gardenObject, event));
    button.addEventListener("pointerup", event => endDrag(gardenObject, event));
    button.addEventListener("pointercancel", event => endDrag(gardenObject, event));
    updatePlace(gardenObject);
});

// A new screen shape keeps moved objects inside the garden; the others use its start places.
window.addEventListener("resize", () => {
    gardenObjects.forEach(gardenObject => {
        if (gardenObject.item.style.getPropertyValue("--x")) {
            const { x, y } = readPosition(gardenObject);
            placeObject(gardenObject, x, y);
        }
        updatePlace(gardenObject);
    });
});
