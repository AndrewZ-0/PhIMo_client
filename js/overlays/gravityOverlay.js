import {OverlayMenu} from "./overlay.js";

const errorMessageDiv = document.getElementById("gravityMenu-error-message");
const gravitationalConstant_input = document.getElementById("gravitationalConstant-input");
const gravitationalFieldStrength_input = {
    x: document.getElementById("global-gravitationalFieldStrength-x"), 
    y: document.getElementById("global-gravitationalFieldStrength-y"), 
    z: document.getElementById("global-gravitationalFieldStrength-z")
}

const openMenuButton = document.getElementById("openGravityMenu-button");
const hideMenuButton = document.getElementById("hide-gravityMenu-overlay-button");
const submitButton = document.getElementById("configureGravity-button");

const overlayMenu = document.getElementById("gravityMenu-overlay");


export class GravityOverlay extends OverlayMenu {
    constructor(projectData, markUnsavedChanges) {
        super();

        this.projectData = projectData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        gravitationalConstant_input.value = this.projectData.models.gravity.G;
        gravitationalFieldStrength_input.x.value = this.projectData.models.gravity.g.x;
        gravitationalFieldStrength_input.y.value = this.projectData.models.gravity.g.y;
        gravitationalFieldStrength_input.z.value = this.projectData.models.gravity.g.z;

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
    
        const G = parseFloat(gravitationalConstant_input.value);
        if (isNaN(G)) {
            errorMessageDiv.textContent = "Gravitational constant must be a float";
            return false;
        }

        const axes = ["x", "y", "z"];
        for (const axis of axes) {
            const g_axis = parseFloat(gravitationalFieldStrength_input[axis].value);
            if (isNaN(g_axis)) {
                errorMessageDiv.textContent = `Gravitational Field Strength (${axis}) must be a float`;
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
    
        const G = parseFloat(gravitationalConstant_input.value);
        this.projectData.models.gravity.G = G;

        const axes = ["x", "y", "z"];
        for (const axis of axes) {
            this.projectData.models.gravity.g[axis] = parseFloat(gravitationalFieldStrength_input[axis].value);
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

        openMenuButton.addEventListener("pointerdown", this.show);
        hideMenuButton.addEventListener("pointerup", this.hide);
        
        submitButton.addEventListener("pointerup", this.submit);

        for (const element of document.getElementsByClassName("grav-input")) {
            element.addEventListener("input", this.validateInputs);
        }
    }
}
