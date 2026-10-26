"use strict";

/*
This script is shared by every page. It gives the buttons their press, and puts away the card
that asks for an upright phone to be turned.
*/

/*
Every square key is drawn raised on its shadow. Pressing it shows the flat picture, as if the key
sank into its shadow, and letting go springs it back up. A quick tap still holds the press for a
moment, so a child can see that the key answered.
*/
const pushButtons = document.querySelectorAll(
    ".homeButton, .chapterButton, .toolButton, .bookButton"
);
const shortestPush = 140;

function pushDown(button) {
    clearTimeout(button.releaseTimer);
    button.pushedAt = performance.now();
    button.classList.remove("isSpringing");
    button.classList.add("isPushed");
}

function letGo(button) {
    if (!button.classList.contains("isPushed")) return;

    const stillToShow = shortestPush - (performance.now() - button.pushedAt);
    button.releaseTimer = setTimeout(() => {
        button.classList.remove("isPushed");
        button.classList.add("isSpringing");
    }, Math.max(0, stillToShow));
}

pushButtons.forEach(button => {
    button.addEventListener("pointerdown", () => pushDown(button));
    ["pointerup", "pointercancel", "pointerleave", "blur"].forEach(type => {
        button.addEventListener(type, () => letGo(button));
    });

    // Enter and Space press the key from the keyboard in the same way.
    button.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") pushDown(button);
    });
    button.addEventListener("keyup", () => letGo(button));

    button.addEventListener("animationend", event => {
        if (event.animationName === "key-spring") button.classList.remove("isSpringing");
    });
});

/*
The card asking for the phone to be turned shows only on upright phones, by a CSS media query.
Once put away it stays away for the rest of the visit, on every page.
*/
const turnPrompt = document.querySelector(".turnPrompt");

function putTurnPromptAway() {
    turnPrompt.classList.add("isPutAway");
}

if (turnPrompt) {
    try {
        if (sessionStorage.getItem("turnPromptPutAway")) putTurnPromptAway();
    } catch {
        // Without storage the card simply shows again on the next page.
    }

    turnPrompt.querySelector(".turnDismiss").addEventListener("click", () => {
        putTurnPromptAway();
        try {
            sessionStorage.setItem("turnPromptPutAway", "yes");
        } catch {
            // The card is still put away on this page.
        }
    });
}
