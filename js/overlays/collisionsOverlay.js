import {OverlayMenu} from "./overlay.js";

const errorMessageDiv = document.getElementById("collisionsMenu-error-message");
const coefficientOfRestitution_input = document.getElementById("coefficientOfRestitution-input");

const openMenuButton = document.getElementById("openCollisionsMenu-button");
const hideMenuButton = document.getElementById("hide-collisionsMenu-overlay-button");
const submitButton = document.getElementById("configureCollisions-button");

const overlayMenu = document.getElementById("collisionsMenu-overlay");

export class CollisionsOverlay extends OverlayMenu {
    constructor(projectData, markUnsavedChanges) {
        super();

        this.projectData = projectData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        coefficientOfRestitution_input.value = this.projectData.models.collisions.e;

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);
    }

    hide() {
        super.hide();

        errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    validateCoefficientOfRestitution() {
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        const e = parseFloat(coefficientOfRestitution_input.value);
    
        if (isNaN(G)) {
            errorMessageDiv.textContent = "Coefficient of Restitution constant must be a float";
            return false;
        }
        return true;
    }

    submit() {
        super.submit();

        if (! this.validateCoefficientOfRestitution()) {
            return;
        }
    
        const e = parseFloat(coefficientOfRestitution_input.value);
    
        this.projectData.models.collisions.e = e;
        this.markUnsavedChanges("high");
    
        this.hide();
    }

    keyEvents(event) {
        if (event.key === "Escape") {
            this.hide();
        }
        else if (event.key === "Enter") {
            this.submit();
        }
    }

    bindPermanantEvents() {
        super.bindPermanantEvents();

        openMenuButton.addEventListener("pointerdown", this.show);
        hideMenuButton.addEventListener("pointerup", this.hide);
        
        submitButton.addEventListener("pointerup", this.submit);

        coefficientOfRestitution_input.addEventListener("input", this.validateCoefficientOfRestitution);
    }
}
