import {OverlayEditMenu, OverlayViewMenu} from "./overlay.js";

const overlayMenu = document.getElementById("collisionsMenu-overlay");

const openMenuButton = document.getElementById("openCollisionsMenu-button");
const hideMenuButton = document.getElementById("hide-collisionsMenu-overlay-button");

const coefficientOfRestitution_element = document.getElementById("coefficientOfRestitution-input");

export class CollisionsEditOverlay extends OverlayEditMenu {
    constructor(projectData, markUnsavedChanges) {
        super();

        this.errorMessageDiv = document.getElementById("collisionsMenu-error-message");
        this.submitButton = document.getElementById("configureCollisions-button");

        this.projectData = projectData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        coefficientOfRestitution_element.value = this.projectData.models.collisions.e;

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);
    }

    hide() {
        super.hide();

        this.errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    validateCoefficientOfRestitution() {
        this.errorMessageDiv.textContent = ""; //clear prev msgs
    
        const e = parseFloat(coefficientOfRestitution_element.value);
    
        if (isNaN(e)) {
            this.errorMessageDiv.textContent = "Coefficient of Restitution constant must be a float";
            return false;
        }
        return true;
    }

    submit() {
        super.submit();

        if (! this.validateCoefficientOfRestitution()) {
            return;
        }
    
        const e = parseFloat(coefficientOfRestitution_element.value);
    
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

        openMenuButton.addEventListener("pointerup", this.show);
        hideMenuButton.addEventListener("pointerup", this.hide);
        overlayMenu.addEventListener("pointerup", (event) => {
            if (event.target === overlayMenu) {
                this.hide(); 
            }
        });
        
        this.submitButton.addEventListener("pointerup", this.submit);

        coefficientOfRestitution_element.addEventListener("input", this.validateCoefficientOfRestitution.bind(this));
    }
}


export class CollisionsViewOverlay extends OverlayViewMenu {
    constructor(projectData) {
        super();

        this.projectData = projectData;

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        coefficientOfRestitution_element.value = this.projectData.models.collisions.e;

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
    }
}