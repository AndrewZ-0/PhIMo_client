import {OverlayMenu} from "./overlay.js";

const errorMessageDiv = document.getElementById("dragMenu-error-message");
const airDensity_input = document.getElementById("airDensity-input");

const openMenuButton = document.getElementById("openDragMenu-button");
const hideMenuButton = document.getElementById("hide-dragMenu-overlay-button");
const submitButton = document.getElementById("configureDrag-button");

const overlayMenu = document.getElementById("dragMenu-overlay");

export class DragOverlay extends OverlayMenu {
    constructor(projectData, markUnsavedChanges) {
        super();

        this.projectData = projectData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        airDensity_input.value = this.projectData.models.drag.rho;

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);
    }

    hide() {
        super.hide();

        errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    validateAirDensity() {
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        const rho = parseFloat(airDensity_input.value);
    
        if (isNaN(rho) || rho < 0) {
            errorMessageDiv.textContent = "Air Density must be a positive float";
            return false;
        }
        return true;
    }

    submit() {
        super.submit();

        if (! this.validateAirDensity()) {
            return;
        }
    
        const rho = parseFloat(airDensity_input.value);
    
        this.projectData.models.drag.rho = rho;
        console.log(this.projectData.models)
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

        airDensity_input.addEventListener("input", this.validateAirDensity);
    }
}
