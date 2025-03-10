import {OverlayEditMenu, OverlayViewMenu} from "./overlay.js";

const overlayMenu = document.getElementById("mForceMenu-overlay");

const openMenuButton = document.getElementById("openMForceMenu-button");
const hideMenuButton = document.getElementById("hide-mForceMenu-overlay-button");

const vacuumPermeability_element = document.getElementById("vacuumPermeability-input");

const magneticFieldStrength_elements = {
    x: document.getElementById("global-magneticFieldStrength-x"), 
    y: document.getElementById("global-magneticFieldStrength-y"), 
    z: document.getElementById("global-magneticFieldStrength-z")
};


export class MagneticForceEditOverlay extends OverlayEditMenu {
    constructor(projectData, markUnsavedChanges) {
        super();

        this.errorMessageDiv = document.getElementById("mForceMenu-error-message");
        this.submitButton = document.getElementById("configureMForce-button");

        this.projectData = projectData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    fill() {
        vacuumPermeability_element.value = this.projectData.models.mForce.M0;
        magneticFieldStrength_elements.x.value = this.projectData.models.mForce.B.x;
        magneticFieldStrength_elements.y.value = this.projectData.models.mForce.B.y;
        magneticFieldStrength_elements.z.value = this.projectData.models.mForce.B.z;
    }

    show() {
        super.show();

        this.fill();

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);
    }

    hide() {
        super.hide();

        this.errorMessageDiv.textContent = ""; //clear prev msgs

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    validateInputs() {
        this.errorMessageDiv.textContent = ""; //clear prev msgs
    
        const M0 = parseFloat(vacuumPermeability_element.value);
    
        if (isNaN(M0)) {
            this.errorMessageDiv.textContent = "Vacuum Permeability must be a float";
            return false;
        }

        const axes = ["x", "y", "z"];
        for (const axis of axes) {
            const B_axis = parseFloat(magneticFieldStrength_elements[axis].value);
            if (isNaN(B_axis)) {
                this.errorMessageDiv.textContent = `Magnetic Field Strength (${axis}) must be a float`;
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
    
        const M0 = parseFloat(vacuumPermeability_element.value);

        const axes = ["x", "y", "z"];
        for (const axis of axes) {
            this.projectData.models.mForce.B[axis] = parseFloat(magneticFieldStrength_elements[axis].value);
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

        openMenuButton.addEventListener("pointerup", this.show);
        hideMenuButton.addEventListener("pointerup", this.hide);
        overlayMenu.addEventListener("pointerup", (event) => {
            if (event.target === overlayMenu) {
                this.hide(); 
            }
        });
        
        this.submitButton.addEventListener("pointerup", this.submit);

        for (const element of document.getElementsByClassName("mForce-input")) {
            element.addEventListener("input", this.validateInputs.bind(this));
        }
    }
}


export class MagneticForceViewOverlay extends OverlayViewMenu {
    constructor(projectData) {
        super();

        this.projectData = projectData;

        this.bindPermanantEvents();
    }

    fill() {
        vacuumPermeability_element.value = this.projectData.models.mForce.M0;
        magneticFieldStrength_elements.x.value = this.projectData.models.mForce.B.x;
        magneticFieldStrength_elements.y.value = this.projectData.models.mForce.B.y;
        magneticFieldStrength_elements.z.value = this.projectData.models.mForce.B.z;
    }

    show() {
        super.show();

        this.fill();

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
