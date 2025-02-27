import {OverlayMenu} from "./overlay.js";
import {selectObject} from "../../AGRE/src/core/listeners.js";
import {masterRenderer} from "../../AGRE/src/core/renderer.js";

export class FindObjectOverlay extends OverlayMenu {
    constructor() {
        super();
        this.bindPermanantEvents();
    }

    show() {
        super.show();

        document.getElementById("findObject-overlay").classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);
    }

    hide() {
        super.hide();

        const errorMessageDiv = document.getElementById("find-object-error-message");
        errorMessageDiv.textContent = ""; //clear prev msgs

        document.getElementById("findObject-overlay").classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    submit() {
        const objectsList = document.getElementById("objectsList");
        const selectedObject = objectsList.value;
    
        if (! selectedObject) {
            const errorMessageDiv = document.getElementById("find-object-error-message");
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
            const objectsList = document.getElementById("objectsList");
    
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

        document.getElementById("selectFoundObject-button").addEventListener("pointerup", this.submit.bind(this));
        document.getElementById("openFindObjectMenu-button").addEventListener("pointerdown", this.show.bind(this));
        document.getElementById("hide-findObject-overlay-button").addEventListener("pointerup", this.hide.bind(this));
    }
}

