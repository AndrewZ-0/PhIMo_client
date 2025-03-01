import {OverlayMenu} from "./overlay.js";

const errorMessageDiv = document.getElementById("eForceMenu-error-message");
const vacuumPermittivity_input = document.getElementById("vacuumPermittivity-input");
const electricFieldStrength_input = {
    x: document.getElementById("global-electricFieldStrength-x"), 
    y: document.getElementById("global-electricFieldStrength-y"), 
    z: document.getElementById("global-electricFieldStrength-z")
}

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
        electricFieldStrength_input.x.value = this.projectData.models.eForce.E.x;
        electricFieldStrength_input.y.value = this.projectData.models.eForce.E.y;
        electricFieldStrength_input.z.value = this.projectData.models.eForce.E.z;

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
    
        const E0 = parseFloat(vacuumPermittivity_input.value);
    
        if (isNaN(E0)) {
            errorMessageDiv.textContent = "Vacuum permittivity must be a float";
            return false;
        }

        const axes = ["x", "y", "z"];
        for (const axis of axes) {
            const E_axis = parseFloat(electricFieldStrength_input[axis].value);
            if (isNaN(E_axis)) {
                errorMessageDiv.textContent = `Electric Field Strength (${axis}) must be a float`;
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
    
        const E0 = parseFloat(vacuumPermittivity_input.value);

        const axes = ["x", "y", "z"];
        for (const axis of axes) {
            this.projectData.models.eForce.E[axis] = parseFloat(electricFieldStrength_input[axis].value);
        }
    
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

        for (const element of document.getElementsByClassName("eForce-input")) {
            element.addEventListener("input", this.validateInputs);
        }
    }
}
