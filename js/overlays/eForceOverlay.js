import {OverlayEditMenu, OverlayViewMenu} from "./overlay.js";

const overlayMenu = document.getElementById("eForceMenu-overlay");

const openMenuButton = document.getElementById("openEForceMenu-button");
const hideMenuButton = document.getElementById("hide-eForceMenu-overlay-button");

const vacuumPermittivity_element = document.getElementById("vacuumPermittivity-input");

const electricFieldStrength_elements = {
    x: document.getElementById("global-electricFieldStrength-x"), 
    y: document.getElementById("global-electricFieldStrength-y"), 
    z: document.getElementById("global-electricFieldStrength-z")
};

export class ElectricForceEditOverlay extends OverlayEditMenu {
    constructor(projectData, markUnsavedChanges) {
        super();
        
        this.errorMessageDiv = document.getElementById("eForceMenu-error-message");
        this.submitButton = document.getElementById("configureEForce-button");

        this.projectData = projectData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    fill() {
        vacuumPermittivity_element.value = this.projectData.models.eForce.E0;
        electricFieldStrength_elements.x.value = this.projectData.models.eForce.E.x;
        electricFieldStrength_elements.y.value = this.projectData.models.eForce.E.y;
        electricFieldStrength_elements.z.value = this.projectData.models.eForce.E.z;
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
    
        const E0 = parseFloat(vacuumPermittivity_element.value);
    
        if (isNaN(E0)) {
            this.errorMessageDiv.textContent = "Vacuum permittivity must be a float";
            return false;
        }

        const axes = ["x", "y", "z"];
        for (const axis of axes) {
            const E_axis = parseFloat(electricFieldStrength_elements[axis].value);
            if (isNaN(E_axis)) {
                this.errorMessageDiv.textContent = `Electric Field Strength (${axis}) must be a float`;
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
    
        const E0 = parseFloat(vacuumPermittivity_element.value);

        const axes = ["x", "y", "z"];
        for (const axis of axes) {
            this.projectData.models.eForce.E[axis] = parseFloat(electricFieldStrength_elements[axis].value);
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

        openMenuButton.addEventListener("pointerup", this.show);
        hideMenuButton.addEventListener("pointerup", this.hide);
        overlayMenu.addEventListener("pointerup", (event) => {
            if (event.target === overlayMenu) {
                this.hide(); 
            }
        });
        
        this.submitButton.addEventListener("pointerup", this.submit);

        for (const element of document.getElementsByClassName("eForce-input")) {
            element.addEventListener("input", this.validateInputs.bind(this));
        }
    }
}


export class ElectricForceViewOverlay extends OverlayViewMenu {
    constructor(projectData) {
        super();

        this.projectData = projectData;

        this.bindPermanantEvents();
    }

    fill() {
        vacuumPermittivity_element.value = this.projectData.models.eForce.E0;
        electricFieldStrength_elements.x.value = this.projectData.models.eForce.E.x;
        electricFieldStrength_elements.y.value = this.projectData.models.eForce.E.y;
        electricFieldStrength_elements.z.value = this.projectData.models.eForce.E.z;
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