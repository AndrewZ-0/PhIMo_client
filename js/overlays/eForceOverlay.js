import {OverlayMenu} from "./overlay.js";

const errorMessageDiv = document.getElementById("gravityMenu-error-message");
const vacuumPermittivity_input = document.getElementById("vacuumPermittivity-input");

const openMenuButton = document.getElementById("openEForceMenu-button");
const hideMenuButton = document.getElementById("hide-eForceMenu-overlay-button");
const submitButton = document.getElementById("configureEForce-button");

const overlayMenu = document.getElementById("eForceMenu-overlay");

export class ElectricForceOverlay extends OverlayMenu {
    constructor(projectData, markUnsavedChanges) {
        super();

        this.projectData = projectData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        vacuumPermittivity_input.value = this.projectData.models.eForce.E0;

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);
    }

    hide() {
        super.hide();

        errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    validateVacuumPermittivity() {
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        const E0 = parseFloat(vacuumPermittivity_input.value);
    
        if (isNaN(E0)) {
            errorMessageDiv.textContent = "Vacuum permittivity must be a float";
            return false;
        }
        return true;
    }

    submit() {
        super.submit();

        if (! this.validateVacuumPermittivity()) {
            return;
        }
    
        const E0 = parseFloat(vacuumPermittivity_input.value);
    
        this.projectData.models.eForce.E0 = E0;
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

        vacuumPermittivity_input.addEventListener("input", this.validateVacuumPermittivity);
    }
}
