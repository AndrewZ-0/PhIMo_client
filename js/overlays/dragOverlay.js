import {OverlayEditMenu, OverlayViewMenu} from "./overlay.js";

const overlayMenu = document.getElementById("dragMenu-overlay");

const openMenuButton = document.getElementById("openDragMenu-button");
const hideMenuButton = document.getElementById("hide-dragMenu-overlay-button");

const airDensity_input = document.getElementById("airDensity-input");

export class DragEditOverlay extends OverlayEditMenu {
    constructor(projectData, markUnsavedChanges) {
        super();

        this.errorMessageDiv = document.getElementById("dragMenu-error-message");
        this.submitButton = document.getElementById("configureDrag-button");
        
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

        this.errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    validateAirDensity() {
        this.errorMessageDiv.textContent = ""; //clear prev msgs
    
        const rho = parseFloat(airDensity_input.value);
    
        if (isNaN(rho) || rho < 0) {
            this.errorMessageDiv.textContent = "Air Density must be a positive float";
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

        openMenuButton.addEventListener("pointerup", this.show);
        hideMenuButton.addEventListener("pointerup", this.hide);
        overlayMenu.addEventListener("pointerup", (event) => {
            if (event.target === overlayMenu) {
                this.hide(); 
            }
        });
        
        this.submitButton.addEventListener("pointerup", this.submit);

        airDensity_input.addEventListener("input", this.validateAirDensity.bind(this));
    }
}


export class DragViewOverlay extends OverlayViewMenu {
    constructor(projectData) {
        super();

        this.projectData = projectData;

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

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    keyEvents(event) {
        if (event.key === "Escape") {
            this.hide();
        }
    }

    bindPermanantEvents() {
        super.bindPermanantEvents();

        openMenuButton.addEventListener("pointerup", this.show);
        hideMenuButton.addEventListener("pointerup", this.hide);
        overlayMenu.addEventListener("pointerup", (event) => {
            if (event.target === overlayMenu) {
                this.hide(); 
            }
        });
        overlayMenu.addEventListener("pointerup", this.hide);
    }
}