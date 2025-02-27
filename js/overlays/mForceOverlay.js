import {OverlayMenu} from "./overlay.js";

const errorMessageDiv = document.getElementById("mForceMenu-error-message");
const vacuumPermeability_input = document.getElementById("vacuumPermeability-input");

const openMenuButton = document.getElementById("openMForceMenu-button");
const hideMenuButton = document.getElementById("hide-mForceMenu-overlay-button");
const submitButton = document.getElementById("configureMForce-button");

const overlayMenu = document.getElementById("mForceMenu-overlay");

export class MagneticForceOverlay extends OverlayMenu {
    constructor(projectData, markUnsavedChanges) {
        super();

        this.projectData = projectData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        vacuumPermeability_input.value = this.projectData.models.mForce.M0;

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);
    }

    hide() {
        super.hide();

        errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    validateVacuumPermeability() {
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        const M0 = parseFloat(vacuumPermeability_input.value);
    
        if (isNaN(M0)) {
            errorMessageDiv.textContent = "Vacuum Permeability must be a float";
            return false;
        }
        return true;
    }

    submit() {
        super.submit();

        if (! this.validateVacuumPermeability()) {
            return;
        }
    
        const G = parseFloat(vacuumPermeability_input.value);
    
        this.projectData.models.mForce.G = G;
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

        vacuumPermeability_input.addEventListener("input", this.validateVacuumPermeability);
    }
}
