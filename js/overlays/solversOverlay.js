import {OverlayEditMenu, OverlayViewMenu} from "./overlay.js";

const overlayMenu = document.getElementById("solversMenu-overlay");

const openMenuButton = document.getElementById("openSolversMenu-button");
const hideMenuButton = document.getElementById("hide-solversMenu-overlay-button");

const algorithm_input = document.getElementById("algorithm-input");
const intergrator_input = document.getElementById("intergrator-input");


export class SolversEditOverlay extends OverlayEditMenu {
    constructor(projectData, markUnsavedChanges) {
        super();

        this.submitButton = document.getElementById("configureSolvers-button");
        
        this.projectData = projectData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        algorithm_input.value = this.projectData.models.solvers.algorithm;
        intergrator_input.value = this.projectData.models.solvers.intergrator;

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents);
    }

    hide() {
        super.hide();

        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    submit() {
        super.submit();
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

        algorithm_input.addEventListener("input", () => {
            this.projectData.models.solvers.algorithm = algorithm_input.value;
            this.markUnsavedChanges("high");
        });
        intergrator_input.addEventListener("input", () => {
            this.projectData.models.solvers.intergrator = intergrator_input.value;
            this.markUnsavedChanges("high");
        });
    }
}


export class SolversViewOverlay extends OverlayViewMenu {
    constructor(projectData) {
        super();

        this.projectData = projectData;

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        algorithm_input.value = this.projectData.models.solvers.algorithm;
        intergrator_input.value = this.projectData.models.solvers.intergrator;

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