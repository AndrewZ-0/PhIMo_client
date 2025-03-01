import {OverlayEditMenu} from "./overlay.js";
import {selectObject} from "../../AGRE/src/core/listeners.js";
import {masterRenderer} from "../../AGRE/src/core/renderer.js";

const overlayMenu = document.getElementById("findObject-overlay");

const objectsList = document.getElementById("objectsList");

const selectFoundObject_button = document.getElementById("selectFoundObject-button");
const openMenu_button = document.getElementById("openFindObjectMenu-button");
const hideMenu_button = document.getElementById("hide-findObject-overlay-button");

const errorMessageDiv = document.getElementById("find-object-error-message");


export class FindObjectOverlay extends OverlayEditMenu {
    constructor() {
        super();
        this.bindPermanantEvents();
    }

    show() {
        super.show();

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);
    }

    hide() {
        super.hide();

        errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    submit() {
        const selectedObject = objectsList.value;
        if (! selectedObject) {
            errorMessageDiv.textContent = "No object selected";
            return;
        }
    
        const noOfObjects = masterRenderer.objects.length;
        for (let i = 0; i < noOfObjects; i++) {
            if (masterRenderer.objects[i].name === selectedObject) {
                if (masterRenderer.currentSelection !== i) {
                    selectObject(i);
                }
                break;
            }
        }

        super.submit();
    }

    keyEvents(event) {
        if (event.key === "Escape") {
            if (objectsList.value !== "") {
                objectsList.value = "";
            }
            else {
                this.hide();
            }
        }
    }

    bindPermanantEvents() {
        super.bindPermanantEvents();

        selectFoundObject_button.addEventListener("pointerup", this.submit.bind(this));
        openMenu_button.addEventListener("pointerdown", this.show.bind(this));
        hideMenu_button.addEventListener("pointerup", this.hide.bind(this));
    }
}