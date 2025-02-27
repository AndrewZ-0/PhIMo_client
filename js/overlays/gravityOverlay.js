import {OverlayMenu} from "./overlay.js";

const errorMessageDiv = document.getElementById("gravityMenu-error-message");
const gravitationalConstant_input = document.getElementById("gravitationalConstant-input");

const openMenuButton = document.getElementById("openGravityMenu-button");
const hideMenuButton = document.getElementById("hide-gravityMenu-overlay-button");
const submitButton = document.getElementById("configureGravity-button");

const overlayMenu = document.getElementById("gravityMenu-overlay");

export class GravityOverlay extends OverlayMenu {
    constructor(projectData, markUnsavedChanges) {
        super();

        this.projectData = projectData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        gravitationalConstant_input.value = this.projectData.models.gravity.G;

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);
    }

    hide() {
        super.hide();

        errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    validateGravitationalConstant() {
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        const G = parseFloat(gravitationalConstant_input.value);
    
        if (isNaN(G)) {
            errorMessageDiv.textContent = "Gravitational constant must be a float";
            return false;
        }
        return true;
    }

    submit() {
        super.submit();

        if (! this.validateGravitationalConstant()) {
            return;
        }
    
        const G = parseFloat(gravitationalConstant_input.value);
    
        this.projectData.models.gravity.G = G;
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

        gravitationalConstant_input.addEventListener("input", this.validateGravitationalConstant);
    }
}
