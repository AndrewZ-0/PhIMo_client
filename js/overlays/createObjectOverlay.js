import {OverlayEditMenu} from "./overlay.js";
import {masterRenderer} from "../../AGRE/src/core/renderer.js";
import {Sphere, Plane} from "../../AGRE/src/objects/objects.js";
import * as linearAlgebra from "../../AGRE/src/utils/linearAlgebra.js";
import {calculateScaledFidelity} from "../../AGRE/src/utils/renderProperties.js";

const overlayMenu = document.getElementById("createObject-overlay");

const objectName_input = document.getElementById("create-objectName");

const createNewObject_form = document.getElementById("createNewObject-form");

const objectType_group = document.getElementById("create-objectType-group");
const position_group = document.getElementById("create-position-group");
const velocity_group = document.getElementById("create-velocity-group");
const radius_group = document.getElementById("create-radius-group");
const mass_group = document.getElementById("create-mass-group");
const charge_group = document.getElementById("create-charge-group");
const colour_group = document.getElementById("create-colour-group");
const dragCoefficient_group = document.getElementById("create-dragCoefficient-group");
const dimentions_group = document.getElementById("create-dimentions-group");
const orientation_group = document.getElementById("create-orientation-group");

const objectType_input = document.getElementById("create-objectType");

const position_input = {
    x: document.getElementById("create-position-x"), 
    y: document.getElementById("create-position-y"), 
    z: document.getElementById("create-position-z")
};

const velocity_input = {
    x: document.getElementById("create-velocity-x"), 
    y: document.getElementById("create-velocity-y"), 
    z: document.getElementById("create-velocity-z")
};

const eulerOrient_input = {
    pitch: document.getElementById("create-pitch"), 
    yaw: document.getElementById("create-yaw"), 
    roll: document.getElementById("create-roll")
};

const radius_input = document.getElementById("create-radius");
const mass_input = document.getElementById("create-mass");
const dragCoefficient_input = document.getElementById("create-dragCoefficient");
const charge_input = document.getElementById("create-charge");
const colour_input = document.getElementById("create-colour");

const length_input = document.getElementById("create-length");
const width_input = document.getElementById("create-width");

const openMenu_button = document.getElementById("openCreateObjectMenu-button");
const hideMenu_button = document.getElementById("hide-createObject-overlay-button");
const createObject_button = document.getElementById("createObject-button");

const errorMessageDiv = document.getElementById("create-object-error-message");


export class CreateObjectOverlay extends OverlayEditMenu {
    constructor(ge, projectData, settingsData, objectHeaders, objectLookup, markUnsavedChanges, validateObjectBasedInputs) {
        super();

        this.ge = ge;
        this.projectData = projectData;
        this.settingsData = settingsData;
        this.objectHeaders = objectHeaders;
        this.objectLookup = objectLookup;
        this.markUnsavedChanges = markUnsavedChanges.bind(this);
        this.validateObjectBasedInputs = validateObjectBasedInputs.bind(this);

        this.bindPermanantEvents();
    }

    show() {
        super.show();

        overlayMenu.classList.remove("hidden");
        document.addEventListener("keydown", this.keyEvents); 

        this.fillObjectNameOnCreateObjectOverlay();
    }

    hide() {
        super.hide();

        errorMessageDiv.textContent = ""; //clear prev msgs
    
        objectName_input.value = "";
    
        overlayMenu.classList.add("hidden");
        document.removeEventListener("keydown", this.keyEvents);
    }

    configureObjectEntries() {
        const inputGroups = createNewObject_form.querySelectorAll(".input-group");
        for (const inputGroup of inputGroups) {
            inputGroup.classList.add("hidden");
        }
    
        const objectType = objectType_input.value;
        if (objectType === "0") {
            position_group.classList.remove("hidden");
            velocity_group.classList.remove("hidden");
            radius_group.classList.remove("hidden");
            mass_group.classList.remove("hidden");
            charge_group.classList.remove("hidden");
            colour_group.classList.remove("hidden");
            dragCoefficient_group.classList.remove("hidden");
        }
        else if (objectType === "1") {
            position_group.classList.remove("hidden");
            dimentions_group.classList.remove("hidden");
            orientation_group.classList.remove("hidden");
            charge_group.classList.remove("hidden");
            colour_group.classList.remove("hidden");
        }
    }

    submit() {
        const name = objectName_input.value;
    
        if (name in this.projectData.objects) {
            errorMessageDiv.textContent = "Object name is taken.";
            return;
        }
    
        if (! this.validateObjectBasedInputs("create-")) {
            return;
        }
    
        let newObject;
        const objectType = objectType_input.value;
        if (objectType === "0") {
            const position = [
                parseFloat(position_input.x.value),
                parseFloat(position_input.y.value),
                parseFloat(position_input.z.value)
            ];
            const velocity = [
                parseFloat(velocity_input.x.value),
                parseFloat(velocity_input.y.value),
                parseFloat(velocity_input.z.value)
            ];
    
            const radius = parseFloat(radius_input.value);
            const mass = parseFloat(mass_input.value);
            const charge = parseFloat(charge_input.value);
            const dragCoef = parseFloat(dragCoefficient_input.value);
            const colour = linearAlgebra.hexToVec3(colour_input.value);
    
            const fidelity = calculateScaledFidelity(radius);
            newObject = new Sphere(name, ...position, radius, fidelity, colour);
    
            this.projectData.objects[name] = {
                dtype: 0,
                position, velocity,
                radius, mass, charge, dragCoef, colour
            };

            this.objectHeaders.push(name);
            this.objectLookup[name] = newObject;
        }
        else if (objectType === "1") {
            const position = [
                parseFloat(position_input.x.value),
                parseFloat(position_input.y.value),
                parseFloat(position_input.z.value)
            ];
    
            const dimentions = [
                parseFloat(length_input.value), 
                parseFloat(width_input.value)
            ]
    
            const orientation = [
                linearAlgebra.toRadian(parseFloat(eulerOrient_input.pitch.value)), 
                linearAlgebra.toRadian(parseFloat(eulerOrient_input.yaw.value)), 
                linearAlgebra.toRadian(parseFloat(eulerOrient_input.roll.value))
            ]
    
            const charge = parseFloat(charge_input.value);
            const colour = linearAlgebra.hexToVec3(colour_input.value);
    
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

        super.submit();
    }

    fillObjectNameOnCreateObjectOverlay() {
        const currName = objectName_input.value;
    
        if (currName === "") {
            let newName = "Unnamed";
    
            if (newName in this.projectData.objects || newName.toLowerCase() in this.projectData.objects) {
                let i = 2;
                while (newName + i in this.projectData.objects || newName.toLowerCase() + i in this.projectData.objects) {
                    i++;
                }
    
                newName += i;
            }
    
            objectName_input.value = newName;
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

        openMenu_button.addEventListener("pointerup", this.show);
        hideMenu_button.addEventListener("pointerup", this.hide);
        overlayMenu.addEventListener("pointerup", (event) => {
            if (event.target === overlayMenu) {
                this.hide(); 
            }
        });

        objectType_group.addEventListener("input", this.configureObjectEntries);
        createObject_button.addEventListener("pointerup", this.submit);

        for (const element of document.getElementsByClassName("create-input")) {
            element.addEventListener("input", () => {this.validateObjectBasedInputs("create-")});
        }
    }
}

