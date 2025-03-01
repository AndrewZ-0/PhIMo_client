import {OverlayEditMenu, OverlayViewMenu} from "./overlay.js";

const overlayMenu = document.getElementById("gravityMenu-overlay");

const openMenuButton = document.getElementById("openGravityMenu-button");
const hideMenuButton = document.getElementById("hide-gravityMenu-overlay-button");

const gravitationalConstant_element = document.getElementById("gravitationalConstant-input");

const gravitationalFieldStrength_elements = {
    x: document.getElementById("global-gravitationalFieldStrength-x"), 
    y: document.getElementById("global-gravitationalFieldStrength-y"), 
    z: document.getElementById("global-gravitationalFieldStrength-z")
};


export class GravityEditOverlay extends OverlayEditMenu {
    constructor(projectData, markUnsavedChanges) {
        super();
        
        this.errorMessageDiv = document.getElementById("gravityMenu-error-message");
        this.submitButton = document.getElementById("configureGravity-button");

        this.projectData = projectData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    fill() {
        gravitationalConstant_element.value = this.projectData.models.gravity.G;
        gravitationalFieldStrength_elements.x.value = this.projectData.models.gravity.g.x;
        gravitationalFieldStrength_elements.y.value = this.projectData.models.gravity.g.y;
        gravitationalFieldStrength_elements.z.value = this.projectData.models.gravity.g.z;
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
    
        const G = parseFloat(gravitationalConstant_element.value);
        if (isNaN(G)) {
            this.errorMessageDiv.textContent = "Gravitational constant must be a float";
            return false;
        }

        const axes = ["x", "y", "z"];
        for (const axis of axes) {
            const g_axis = parseFloat(gravitationalFieldStrength_elements[axis].value);
            if (isNaN(g_axis)) {
                this.errorMessageDiv.textContent = `Gravitational Field Strength (${axis}) must be a float`;
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
    
        const G = parseFloat(gravitationalConstant_element.value);
        this.projectData.models.gravity.G = G;

        const axes = ["x", "y", "z"];
        for (const axis of axes) {
            this.projectData.models.gravity.g[axis] = parseFloat(gravitationalFieldStrength_elements[axis].value);
        }

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

        for (const element of document.getElementsByClassName("grav-input")) {
            element.addEventListener("input", this.validateInputs.bind(this));
        }
    }
}


export class GravityViewOverlay extends OverlayViewMenu {
    constructor(projectData) {
        super();

        this.projectData = projectData;

        this.bindPermanantEvents();
    }

    fill() {
        gravitationalConstant_element.value = this.projectData.models.gravity.G;
        gravitationalFieldStrength_elements.x.value = this.projectData.models.gravity.g.x;
        gravitationalFieldStrength_elements.y.value = this.projectData.models.gravity.g.y;
        gravitationalFieldStrength_elements.z.value = this.projectData.models.gravity.g.z;
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