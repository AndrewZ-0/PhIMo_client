import {OverlayMenu} from "./overlay.js";

const errorMessageDiv = document.getElementById("mForceMenu-error-message");
const vacuumPermeability_input = document.getElementById("vacuumPermeability-input");
const magneticFieldStrength_input = {
    x: document.getElementById("global-magneticFieldStrength-x"), 
    y: document.getElementById("global-magneticFieldStrength-y"), 
    z: document.getElementById("global-magneticFieldStrength-z")
}

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
        magneticFieldStrength_input.x.value = this.projectData.models.mForce.B.x;
        magneticFieldStrength_input.y.value = this.projectData.models.mForce.B.y;
        magneticFieldStrength_input.z.value = this.projectData.models.mForce.B.z;

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);
    }

    hide() {
        super.hide();

        errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    validateInputs() {
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        const M0 = parseFloat(vacuumPermeability_input.value);
    
        if (isNaN(M0)) {
            errorMessageDiv.textContent = "Vacuum Permeability must be a float";
            return false;
        }

        const axes = ["x", "y", "z"];
        for (const axis of axes) {
            const B_axis = parseFloat(magneticFieldStrength_input[axis].value);
            if (isNaN(B_axis)) {
                errorMessageDiv.textContent = `Magnetic Field Strength (${axis}) must be a float`;
                return false;
            }
        }

        return true;
    }

    submit() {
        super.submit();

        if (! this.validateInputs()) {
            return;
        }
    
        const M0 = parseFloat(vacuumPermeability_input.value);

        const axes = ["x", "y", "z"];
        for (const axis of axes) {
            this.projectData.models.mForce.B[axis] = parseFloat(magneticFieldStrength_input[axis].value);
        }
    
        this.projectData.models.mForce.M0 = M0;
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

        for (const element of document.getElementsByClassName("mForce-input")) {
            element.addEventListener("input", this.validateInputs);
        }
    }
}
