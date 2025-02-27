import {OverlayMenu} from "./overlay.js";
import {masterRenderer} from "../../AGRE/src/core/renderer.js";
import {Sphere, Plane} from "../../AGRE/src/objects/objects.js";
import * as linearAlgebra from "../../AGRE/src/utils/linearAlgebra.js";
import {calculateScaledFidelity} from "../../AGRE/src/utils/renderProperties.js";


export class CreateObjectOverlay extends OverlayMenu {
    constructor(ge, projectData, settingsData, markUnsavedChanges, validateObjectBasedInputs) {
        super();

        this.ge = ge;
        this.projectData = projectData;
        this.settingsData = settingsData;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);
        this.validateObjectBasedInputs = validateObjectBasedInputs.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        document.getElementById("createObject-overlay").classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents); 

        this.fillObjectNameOnCreateObjectOverlay();
    }

    hide() {
        super.hide();

        const errorMessageDiv = document.getElementById("create-object-error-message");
        errorMessageDiv.textContent = ""; //clear prev msgs
    
        document.getElementById("create-objectName").value = "";
    
        document.getElementById("createObject-overlay").classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    configureObjectEntries() {
        const inputGroups = document.getElementById("createNewObject-form").querySelectorAll(".input-group");
        for (const inputGroup of inputGroups) {
            inputGroup.classList.add("hidden");
        }
    
        const objectType = document.getElementById("create-objectType").value;
    
        if (objectType === "0") {
            document.getElementById("create-position-group").classList.remove("hidden");
            document.getElementById("create-velocity-group").classList.remove("hidden");
            document.getElementById("create-radius-group").classList.remove("hidden");
            document.getElementById("create-mass-group").classList.remove("hidden");
            document.getElementById("create-charge-group").classList.remove("hidden");
            document.getElementById("create-colour-group").classList.remove("hidden");
        }
        else if (objectType === "1") {
            document.getElementById("create-position-group").classList.remove("hidden");
            document.getElementById("create-dimentions-group").classList.remove("hidden");
            document.getElementById("create-orientation-group").classList.remove("hidden");
            document.getElementById("create-charge-group").classList.remove("hidden");
            document.getElementById("create-colour-group").classList.remove("hidden");
        }
    }

    createObjectFromCreateNewObjectEntries() {
        const name = document.getElementById("create-objectName").value;
    
        if (name in this.projectData.objects) {
            const errorMessageDiv = document.getElementById("create-object-error-message");
            errorMessageDiv.textContent = "Object name is taken.";
            return;
        }
    
        if (! this.validateObjectBasedInputs("create-")) {
            return;
        }
    
        let newObject;
        const objectType = document.getElementById("create-objectType").value;
        if (objectType === "0") {
            const position = [
                parseFloat(document.getElementById("create-position-x").value),
                parseFloat(document.getElementById("create-position-y").value),
                parseFloat(document.getElementById("create-position-z").value)
            ];
            const velocity = [
                parseFloat(document.getElementById("create-velocity-x").value),
                parseFloat(document.getElementById("create-velocity-y").value),
                parseFloat(document.getElementById("create-velocity-z").value)
            ];
    
            const radius = parseFloat(document.getElementById("create-radius").value);
            const mass = parseFloat(document.getElementById("create-mass").value);
            const charge = parseFloat(document.getElementById("create-charge").value);
            const colour = linearAlgebra.hexToVec3(document.getElementById("create-colour").value);
    
            const fidelity = calculateScaledFidelity(radius);
            newObject = new Sphere(name, ...position, radius, fidelity, colour);
    
            this.projectData.objects[name] = {
                dtype: 0,
                position, velocity,
                radius, mass, charge, colour
            };
        }
        else if (objectType === "1") {
            const position = [
                parseFloat(document.getElementById("create-position-x").value),
                parseFloat(document.getElementById("create-position-y").value),
                parseFloat(document.getElementById("create-position-z").value)
            ];
    
            const dimentions = [
                parseFloat(document.getElementById("create-length").value), 
                parseFloat(document.getElementById("create-width").value)
            ]
    
            const orientation = [
                linearAlgebra.toRadian(parseFloat(document.getElementById("create-pitch").value)), 
                linearAlgebra.toRadian(parseFloat(document.getElementById("create-yaw").value)), 
                linearAlgebra.toRadian(parseFloat(document.getElementById("create-roll").value))
            ]
    
            const charge = parseFloat(document.getElementById("create-charge").value);
            const colour = linearAlgebra.hexToVec3(document.getElementById("create-colour").value);
    
            newObject = new Plane(name, ...position, ...dimentions, ...orientation, colour);
    
            this.projectData.objects[name] = {
                dtype: 1,
                position, dimentions, orientation, 
                charge, colour
            };
        }
    
        masterRenderer.objects.push(newObject);
        masterRenderer.quickInitialise(masterRenderer.objects);
        this.ge.quickAnimationStart();
    
        this.markUnsavedChanges("high");
    }

    fillObjectNameOnCreateObjectOverlay() {
        const currName = document.getElementById("create-objectName").value;
    
        if (currName === "") {
            let newName = "Unnamed";
    
            if (newName in this.projectData.objects || newName.toLowerCase() in this.projectData.objects) {
                let i = 2;
                while (newName + i in this.projectData.objects || newName.toLowerCase() + i in this.projectData.objects) {
                    i++;
                }
    
                newName += i;
            }
    
            document.getElementById("create-objectName").value = newName;
        }
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

        document.getElementById("openCreateObjectMenu-button").addEventListener("pointerdown", this.show.bind(this));
        document.getElementById("hide-createObject-overlay-button").addEventListener("pointerup", this.hide.bind(this));

        document.getElementById("create-objectType-group").addEventListener("input", this.configureObjectEntries);
        document.getElementById("createObject-button").addEventListener("pointerup", this.submit.bind(this));

        this.bindSubmitCallback(this.createObjectFromCreateNewObjectEntries.bind(this));

        for (const element of document.getElementsByClassName("create-input")) {
            element.addEventListener("input", () => {this.validateObjectBasedInputs("create-")});
        }
    }
}

