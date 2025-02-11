import {GraphicsEngine} from "../AGRE/src/app.js";
import {masterRenderer} from "../AGRE/src/core/renderer.js";
import {updateSelectedOverlay} from "../AGRE/src/core/overlays.js";
import {Sphere, Plane} from "../AGRE/src/objects/objects.js";
import {communicator} from "./communicator.js";
import {bindAllControls, unbindAllKeyControls, quickReleaseKeys, selectObject} from "../AGRE/src/core/listeners.js";
import {calculateScaledFidelity} from "../AGRE/src/utils/renderProperties.js";
import * as linearAlgebra from "../AGRE/src/utils/linearAlgebra.js";


let ge;
let projectData = {"deltaT": null, "noOfFrames": null, "models": {"gravity": true, "eForce": true, "mForce": true, "collisions": true}, "objects": {}};
let settingsData = {};

function returnToDashboard(event) {
    location.href = "projectDashboard.html";
}

document.getElementById("titleBarReturnButton").addEventListener("pointerdown", returnToDashboard);

function simulationMenuKeyEvents(event) {
    if (event.key === "Escape") {
        const simulationList = document.getElementById("simulationList");
        simulationList.value = "";
        updateSimulationButtons();
    }
}

function showPlaySimulationMenu(event) {
    quickReleaseKeys();

    unbindAllKeyControls();
    document.getElementById("playSimulationMenu-overlay").classList.remove("hidden");

    loadSimulations();
    document.addEventListener("keydown", simulationMenuKeyEvents);

    validateSimulaitonConfigEntrys();
}

function hidePlaySimulationMenu(event) {
    const errorMessageDiv = document.getElementById("simulationMenu-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

    bindAllControls(ge.canvas);
    document.getElementById("playSimulationMenu-overlay").classList.add("hidden");
    document.removeEventListener("keydown", simulationMenuKeyEvents);
}

document.getElementById("playButton").addEventListener("pointerdown", showPlaySimulationMenu);
document.getElementById("hide-playSimulationMenu-overlay-button").addEventListener("pointerup", hidePlaySimulationMenu);

function updateSimulationButtons() {
    const simulationList = document.getElementById("simulationList");

    const openSimulationButton = document.getElementById("openSimulation");
    const deleteSimulationButton = document.getElementById("deleteSimulation");
    const renameSimulationButton = document.getElementById("renameSimulation");

    if (simulationList.value !== "") {
        openSimulationButton.disabled = false;
        deleteSimulationButton.disabled = false;
        renameSimulationButton.disabled = false;

        openSimulationButton.addEventListener("pointerdown", openSimulation);
        deleteSimulationButton.addEventListener("pointerdown", deleteSimulation);
        renameSimulationButton.addEventListener("pointerdown", renameSimulation);
    }
    else {
        openSimulationButton.disabled = true;
        deleteSimulationButton.disabled = true;
        renameSimulationButton.disabled = true;

        openSimulationButton.removeEventListener("pointerdown", openSimulation);
        deleteSimulationButton.removeEventListener("pointerdown", deleteSimulation);
        renameSimulationButton.removeEventListener("pointerdown", renameSimulation);
    }
}

document.getElementById("simulationList").addEventListener("change", updateSimulationButtons);


async function loadSimulations() {
    const projectName = communicator.getProjNameFromUrl();
    const response = await communicator.list_project_simulations(projectName);

    if (response.status !== "OK") {
        const errorMessageDiv = document.getElementById("simulationMenu-error-message");
        errorMessageDiv.textContent = `Failed to load simulations: ${response.message}`;
        return;
    }

    const simulationList = document.getElementById("simulationList");
    simulationList.replaceChildren();

    for (const simulation of response.data) {
        const option = document.createElement("option");
        option.value = simulation;
        option.textContent = simulation;
        simulationList.appendChild(option);
    }

    updateSimulationButtons();
}

async function deleteSimulation() {
    const simulationList = document.getElementById("simulationList");
    const selectedSimulation = simulationList.value;
    const projectName = communicator.getProjNameFromUrl();

    const response = await communicator.deleteSimulation(projectName, selectedSimulation);

    if (response.status !== "OK") {
        const errorMessageDiv = document.getElementById("simulationMenu-error-message");
        errorMessageDiv.textContent = `Failed to delete simulation: ${response.message}`;
        return;
    }

    loadSimulations();
}

async function renameSimulation() {
    const simulationList = document.getElementById("simulationList");
    const selectedSimulation = simulationList.value;
    const newSimulationName = prompt("Enter new simulation name:");
    const projectName = communicator.getProjNameFromUrl();

    const response = await communicator.renameSimulation(projectName, selectedSimulation, newSimulationName);

    if (response.status !== "OK") {
        const errorMessageDiv = document.getElementById("simulationMenu-error-message");
        errorMessageDiv.textContent = `Failed to rename simulation: ${response.message}`;
        return;
    }

    loadSimulations();
}

document.getElementById("computeNewSimulationButton").addEventListener("pointerdown", createAndComputeNewSimulation);

async function openSimulation() {
    const simulationList = document.getElementById("simulationList");
    const selectedSimulation = simulationList.value;
    const projectName = communicator.getProjNameFromUrl();

    await communicator.updateAccessSimulationTime(projectName, selectedSimulation);

    window.location.href = `simulationPlayer.html?project=${projectName}&simulation=${selectedSimulation}`;
}

async function loadData() {
    const projectName = communicator.getProjNameFromUrl();
    
    document.getElementById("titlebar-project-name").textContent = projectName;

    const projectResponse = await communicator.getProjectData(projectName);

    if (projectResponse.status !== "OK") {
        console.error("Failed to load project data:", projectResponse.message);
        return;
    }

    document.getElementById("projectDataMenu-projectName").textContent = projectName;
    document.getElementById("project-creation-date").textContent = projectResponse.data.creationDate;

    if (Object.keys(projectResponse.data.simConfig).length > 0) {
        projectData = projectResponse.data.simConfig;
    }

    settingsData = projectResponse.data.settings; //will use this later
    let objects = [];
    for (let objectName in projectData.objects) {
        if (projectData.objects[objectName].dtype === 0) {
            const obj = projectData.objects[objectName];

            const colour = obj.colour;

            const radius = obj.radius;
            const fidelity = calculateScaledFidelity(radius);

            objects.push(new Sphere(objectName, ...obj.position, radius, fidelity, colour)); 
        }
        else if (projectData.objects[objectName].dtype === 1) {
            const obj = projectData.objects[objectName];

            const colour = obj.colour;

            objects.push(new Plane(objectName, ...obj.position, ...obj.dimentions, ...obj.orientation, colour)); 
        }
    }

    ge = new GraphicsEngine(objects, true);
    ge.start();
}

function showProjectDataMenu() {
    document.getElementById("projectDataMenu").classList.remove("hidden");
    document.getElementById("titlebar-project-name").removeEventListener("pointerdown", showProjectDataMenu);
    document.getElementById("titlebar-project-name").addEventListener("pointerdown", hideProjectDataMenu);
}

function hideProjectDataMenu() {
    document.getElementById("projectDataMenu").classList.add("hidden");
    document.getElementById("titlebar-project-name").removeEventListener("pointerdown", hideProjectDataMenu);
    document.getElementById("titlebar-project-name").addEventListener("pointerdown", showProjectDataMenu);
}

document.getElementById("titlebar-project-name").addEventListener("pointerdown", showProjectDataMenu);


let currentSelection = null;
function toggleTab(tabId) {
    const tab = document.getElementById(tabId + "Tab");
    const tabMenu = document.getElementById(tabId + "Menu");
    const overlays = document.getElementById("overlays");

    if (tabId === currentSelection) {
        tab.classList.remove("focus");
        tabMenu.classList.add("hidden");

        overlays.style.left = "0px";

        currentSelection = null;   
    }
    else {
        if (currentSelection !== null) {
            document.getElementById(currentSelection + "Tab").classList.remove("focus");
            document.getElementById(currentSelection + "Menu").classList.add("hidden");
        }
        else {
            overlays.style.left = "120px";
        }

        tab.classList.add("focus");
        tabMenu.classList.remove("hidden");

        currentSelection = tabId;
    }
}

//probably should fix this later to make it less vomit enducing to look at...
document.getElementById("toolsTab").addEventListener("pointerup", () => toggleTab("tools"));
document.getElementById("modelsTab").addEventListener("pointerup", () => toggleTab("models"));
document.getElementById("cameraTab").addEventListener("pointerup", () => toggleTab("camera"));
document.getElementById("shadersTab").addEventListener("pointerup", () => toggleTab("shaders"));


function createObjectFromCreateNewObjectEntries() {
    const name = document.getElementById("create-objectName").value;

    if (name in projectData.objects) {
        const errorMessageDiv = document.getElementById("create-object-error-message");
        errorMessageDiv.textContent = "Object name is taken.";
        return;
    }

    if (! validateObjectBasedInputs("create-")) {
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
        const colour = hexToVec3(document.getElementById("create-colour").value);

        const fidelity = calculateScaledFidelity(radius);
        newObject = new Sphere(name, ...position, radius, fidelity, colour);

        projectData.objects[name] = {
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
        const colour = hexToVec3(document.getElementById("create-colour").value);

        newObject = new Plane(name, ...position, ...dimentions, ...orientation, colour);

        projectData.objects[name] = {
            dtype: 1,
            position, dimentions, orientation, 
            charge, colour
        };
    }

    masterRenderer.objects.push(newObject);
    masterRenderer.quickInitialise(masterRenderer.objects);
    ge.quickAnimationStart();

    markUnsavedChanges();
    hideCreateObjectOverlay();
}

function configureCreateObjectEntries() {
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

document.getElementById("create-objectType-group").addEventListener("input", configureCreateObjectEntries);

function createObjectOverlayKeyEvents(event) {
    if (event.key === "Escape") {
        hideCreateObjectOverlay();
    } 
    else if (event.key === "Enter") {
        createObjectFromCreateNewObjectEntries();
    }
}

let objectClipboard;
let copyCount = 0;
function copyObject() {
    if (masterRenderer.currentSelection !== null) {
        const objName = masterRenderer.objects[masterRenderer.currentSelection].name;
        const data = projectData.objects[objName];
        objectClipboard = structuredClone({name: objName, data});
        copyCount = 0;
    }
    else {
        objectClipboard = null;
    }
}

function createObjectFromModelData(name, newObjectModel) {
    let newObject;
    if (newObjectModel.dtype === 0) {
        const radius = newObjectModel.radius;
        const fidelity = calculateScaledFidelity(radius);
        newObject = new Sphere(name, ...newObjectModel.position, radius, fidelity, newObjectModel.colour);
    }
    else if (newObjectModel.dtype === 1) {
        newObject = new Plane(
            name, ...newObjectModel.position, 
            ...newObjectModel.dimentions, 
            ...newObjectModel.orientation, 
            newObjectModel.colour
        );
    }

    projectData.objects[name] = newObjectModel;

    masterRenderer.objects.push(newObject);
    masterRenderer.quickInitialise(masterRenderer.objects);
    ge.quickAnimationStart();

    markUnsavedChanges();
    hideCreateObjectOverlay();
}

function pasteObject() {
    if (objectClipboard) {
        const clipboardContents = structuredClone(objectClipboard);
        const objName = clipboardContents.name;
        let copiedObject = clipboardContents.data;

        let NewName = objName + "_copy";

        if (NewName in projectData.objects || NewName in projectData.objects) {
            let i = 2;
            while (NewName + i in projectData.objects || NewName + i in projectData.objects) {
                i++;
            }

            NewName += i;
        }

        copyCount += 1;

        if (copiedObject.dtype === 0) {
            copiedObject.position[0] += copiedObject.radius * copyCount * 2;
            copiedObject.position[1] -= copiedObject.radius * copyCount * 2;
        }

        else if (copiedObject.dtype === 1) {
            const o = copiedObject.orientation;
            const n = linearAlgebra.applyEulerSet({x: 0, y: 1, z: 0}, {pitch: o[0], yaw: o[1], roll: o[2]});

            copiedObject.position[0] -= n.x * copyCount;
            copiedObject.position[1] -= n.y * copyCount;
            copiedObject.position[2] -= n.z * copyCount;
        }

        createObjectFromModelData(NewName, copiedObject);
    }
}


function workbenchKeyEvents(event) {
    if (event.ctrlKey) {
        if (event.key === "c") {
            copyObject();
        }
        else if (event.key === "v") {
            pasteObject();
        }
    }
    else if (event.key === "Backspace") {
        deleteObject();
    }
}

document.getElementById("createObject-button").addEventListener("pointerup", createObjectFromCreateNewObjectEntries);

function showCreateObjectOverlay() {
    quickReleaseKeys();

    unbindAllKeyControls();
    document.removeEventListener("keydown", workbenchKeyEvents);
    document.getElementById("createObject-overlay").classList.remove("hidden");
    document.addEventListener("keydown", createObjectOverlayKeyEvents); 

    fillObjectNameOnCreateObjectOverlay();
}

function hideCreateObjectOverlay() {
    const errorMessageDiv = document.getElementById("create-object-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

    document.getElementById("create-objectName").value = "";

    document.getElementById("createObject-overlay").classList.add("hidden");
    document.removeEventListener("keydown", createObjectOverlayKeyEvents);

    bindAllControls(ge.canvas);

    document.addEventListener("keydown", workbenchKeyEvents);
}


function showFindObjectOverlay() {
    quickReleaseKeys();

    unbindAllKeyControls();
    document.removeEventListener("keydown", workbenchKeyEvents);
    document.getElementById("findObject-overlay").classList.remove("hidden");
    document.addEventListener("keydown", createObjectOverlayKeyEvents);

    loadObjectsToFinderList();
}

function hideFindObjectOverlay() {
    const errorMessageDiv = document.getElementById("find-object-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

    document.getElementById("findObject-overlay").classList.add("hidden");
    document.removeEventListener("keydown", createObjectOverlayKeyEvents);

    bindAllControls(ge.canvas);

    document.addEventListener("keydown", workbenchKeyEvents);
}

document.getElementById("openFindObjectMenu-button").addEventListener("pointerdown", showFindObjectOverlay);
document.getElementById("hide-findObject-overlay-button").addEventListener("pointerup", hideFindObjectOverlay);


async function loadObjectsToFinderList() {
    const objectList = document.getElementById("objectsList");
    objectList.replaceChildren();

    for (const [name, value] of Object.entries(projectData.objects)) {
        const option = document.createElement("option");

        let typeName;
        if (value.dtype == 0) {
            typeName = "particle";
        }
        else if (value.dtype == 1) {
            typeName = "plane";
        }


        let pos = {
            x: Math.round(value.position[0] * 1000) / 1000,
            y: Math.round(value.position[1] * 1000) / 1000,
            z: Math.round(value.position[2] * 1000) / 1000, 
        }

        if (pos.x !== value.position[0]) {
            pos.x += "...";
        }
        if (pos.y !== value.position[1]) {
            pos.y += "...";
        }
        if (pos.z !== value.position[2]) {
            pos.z += "...";
        }

        option.value = name;
        option.textContent = `${typeName}: ${name} {x: ${pos.x}, y: ${pos.y}, z: ${pos.z}}`;
        objectList.appendChild(option);
    }
}




function selectFoundObject() {
    const objectsList = document.getElementById("objectsList");
    const selectedObject = objectsList.value;

    if (! selectedObject) {
        const errorMessageDiv = document.getElementById("find-object-error-message");
        errorMessageDiv.textContent = "No object selected";
        return;
    }

    const noOfObjects = masterRenderer.objects.length;
    for (let i = 0; i < noOfObjects; i++) {
        if (masterRenderer.objects[i].name === selectedObject) {
            if (masterRenderer.currentSelection !== i) {
                selectObject(i);
            }
            break;
        }
    }

    hideFindObjectOverlay();
}

document.getElementById("selectFoundObject-button").addEventListener("pointerup", selectFoundObject)



function hexToVec3(colourHex) {
    const r = parseInt(colourHex.slice(1, 3), 16) / 255;
    const g = parseInt(colourHex.slice(3, 5), 16) / 255;
    const b = parseInt(colourHex.slice(5, 7), 16) / 255;

    return [r, g, b];
}

function vec3ToHex(colourVec3) {
    const r = Math.round(colourVec3[0] * 255).toString(16).padStart(2, "0");
    const g = Math.round(colourVec3[1] * 255).toString(16).padStart(2, "0");
    const b = Math.round(colourVec3[2] * 255).toString(16).padStart(2, "0");

    return "#" + r + g + b;
}

let unsavedChanges = false;
function markUnsavedChanges() {
    if (!unsavedChanges) {
        const badge = document.querySelector("#saveProjectButton .badge");
        badge.classList.remove("hidden");
        unsavedChanges = true;
    }
}
function clearUnsavedChanges() {
    if (unsavedChanges) {
        const badge = document.querySelector("#saveProjectButton .badge");
        badge.classList.add("hidden");
        unsavedChanges = false;
    }
}


for (const element of document.getElementsByClassName("create-input")) {
    element.addEventListener("input", () => validateObjectBasedInputs("create-"));
}

function fillObjectNameOnCreateObjectOverlay() {
    const currName = document.getElementById("create-objectName").value;

    if (currName === "") {
        let newName = "Unnamed";

        if (newName in projectData.objects || newName.toLowerCase() in projectData.objects) {
            let i = 2;
            while (newName + i in projectData.objects || newName.toLowerCase() + i in projectData.objects) {
                i++;
            }

            newName += i;
        }

        document.getElementById("create-objectName").value = newName;
    }
    
}

function deleteObject() {
    if (masterRenderer.currentSelection !== null) {
        const name = masterRenderer.objects[masterRenderer.currentSelection].name;
        delete projectData.objects[name];

        masterRenderer.objects.splice(masterRenderer.currentSelection, 1);
        masterRenderer.currentSelection = null;

        toggleObjectDataMenu();

        masterRenderer.quickInitialise(masterRenderer.objects);
        ge.quickAnimationStart();

        updateSelectedOverlay();
        markUnsavedChanges();
    }
}

function recordObjectMovement(event) {
    const movedObject = event.detail;

    projectData.objects[movedObject.name].position = [movedObject.x, movedObject.y, movedObject.z];

    populateObjectDataForm(movedObject);

    markUnsavedChanges();
}

function populateObjectDataForm(object) {
    const errorMessageDiv = document.getElementById("edit-object-error-message");
    errorMessageDiv.textContent = "";
    document.getElementById("edit-objectName").value = object.name;
    
    let dtype;
    const objectType = projectData.objects[object.name].dtype;
    if (objectType === 0) {
        dtype = "Particle";

        document.getElementById("edit-position-x").value = object.x;
        document.getElementById("edit-position-y").value = object.y;
        document.getElementById("edit-position-z").value = object.z;
        document.getElementById("edit-velocity-x").value = projectData.objects[object.name].velocity[0];
        document.getElementById("edit-velocity-y").value = projectData.objects[object.name].velocity[1];
        document.getElementById("edit-velocity-z").value = projectData.objects[object.name].velocity[2];
        document.getElementById("edit-radius").value = projectData.objects[object.name].radius;
        document.getElementById("edit-mass").value = projectData.objects[object.name].mass;
        document.getElementById("edit-charge").value = projectData.objects[object.name].charge;
        document.getElementById("edit-colour").value = vec3ToHex(projectData.objects[object.name].colour);
    }
    else if (objectType === 1) {
        dtype = "Plane"

        document.getElementById("edit-position-x").value = object.x;
        document.getElementById("edit-position-y").value = object.y;
        document.getElementById("edit-position-z").value = object.z;
        document.getElementById("edit-length").value = projectData.objects[object.name].dimentions[0];
        document.getElementById("edit-width").value = projectData.objects[object.name].dimentions[1];
        document.getElementById("edit-pitch").value = linearAlgebra.toDegree(projectData.objects[object.name].orientation[0]);
        document.getElementById("edit-yaw").value = linearAlgebra.toDegree(projectData.objects[object.name].orientation[1]);
        document.getElementById("edit-roll").value = linearAlgebra.toDegree(projectData.objects[object.name].orientation[2]);
        document.getElementById("edit-charge").value = projectData.objects[object.name].charge;
        document.getElementById("edit-colour").value = vec3ToHex(projectData.objects[object.name].colour);
    }
    document.getElementById("edit-objectType").value = dtype;
}

function configureObjectDataForm(object) {
    const errorMessageDiv = document.getElementById("edit-object-error-message");
    errorMessageDiv.textContent = "";

    const inputGroups = document.getElementById("workbenchDataMenu-form").querySelectorAll(".input-group");
    for (const inputGroup of inputGroups) {
        inputGroup.classList.add("hidden");
    }
    
    const objectType = projectData.objects[object.name].dtype;
    if (objectType === 0) {
        document.getElementById("edit-position-group").classList.remove("hidden");
        document.getElementById("edit-velocity-group").classList.remove("hidden");
        document.getElementById("edit-radius-group").classList.remove("hidden");
        document.getElementById("edit-mass-group").classList.remove("hidden");
        document.getElementById("edit-charge-group").classList.remove("hidden");
        document.getElementById("edit-colour-group").classList.remove("hidden");
    }
    else if (objectType === 1) {
        document.getElementById("edit-position-group").classList.remove("hidden");
        document.getElementById("edit-dimentions-group").classList.remove("hidden");
        document.getElementById("edit-orientation-group").classList.remove("hidden");
        document.getElementById("edit-charge-group").classList.remove("hidden");
        document.getElementById("edit-colour-group").classList.remove("hidden");  
    }
}

function validateObjectBasedInputs(prefix) {
    const errorMessageDiv = document.getElementById(`${prefix}object-error-message`);
    errorMessageDiv.textContent = ""; //clear prev msgs

    const name = document.getElementById(`${prefix}objectName`).value;

    const nameRegex = /^[a-zA-Z0-9_]+$/;
    if (!nameRegex.test(name)) {
        errorMessageDiv.textContent = `Object name (${name}) is invalid. Only characters (A-Z, a-z, _ and 0-9) are allowed`;
        return false;
    } 

    const axes = ["x", "y", "z"];
    const orientations = ["pitch", "yaw", "roll"];

    if (! document.getElementById(`${prefix}position-group`).classList.contains("hidden")) {
        let position = {};
        for (const axis of axes) {
            const inp = document.getElementById(`${prefix}position-${axis}`);
            const val = parseFloat(inp.value);
            if (isNaN(val)) {
                errorMessageDiv.textContent = `Position (${axis}) must be a float`;
                return false;
            }
            position[axis] = val
        }
    }

    if (! document.getElementById(`${prefix}velocity-group`).classList.contains("hidden")) {
        let velocity = {};
        for (const axis of axes) {
            const inp = document.getElementById(`${prefix}velocity-${axis}`);
            const val = parseFloat(inp.value);
            if (isNaN(val)) {
                errorMessageDiv.textContent = `Velocity (${axis}) must be a float`;
                return false;
            }
            velocity[axis] = val
        }
    }

    if (! document.getElementById(`${prefix}dimentions-group`).classList.contains("hidden")) {
        const length = parseFloat(document.getElementById(`${prefix}length`).value);
        if (isNaN(length) || length <= 0) {
            errorMessageDiv.textContent = "Length must be a non-zero positive float.";
            return false;
        }

        const width = parseFloat(document.getElementById(`${prefix}width`).value);
        if (isNaN(width) || width <= 0) {
            errorMessageDiv.textContent = "Width must be a non-zero positive float.";
            return false;
        }
    }

    if (! document.getElementById(`${prefix}orientation-group`).classList.contains("hidden")) {
        for (const orientation of orientations) {
            const val = parseFloat(document.getElementById(prefix + orientation).value);
            if (isNaN(val)) {
                errorMessageDiv.textContent = `Orientation (${orientation}) value must be a float.`;
                return false;
            }
        }
    }

    if (! document.getElementById(`${prefix}radius-group`).classList.contains("hidden")) {
        const radiusInp = document.getElementById(`${prefix}radius`);
        const radius = parseFloat(radiusInp.value);
        if (isNaN(radius) || radius <= 0) {
            errorMessageDiv.textContent = "Radius must be a positive non-zero float";
            return false;
        }
    }

    if (! document.getElementById(`${prefix}mass-group`).classList.contains("hidden")) {
        const massInp = document.getElementById(`${prefix}mass`);
        const mass = parseFloat(massInp.value);
        if (isNaN(mass) || mass <= 0) {
            errorMessageDiv.textContent = "Mass must be a positive non-zero float";
            return false;
        }
    }

    if (! document.getElementById(`${prefix}charge-group`).classList.contains("hidden")) {
        const chargeInp = document.getElementById(`${prefix}charge`);
        const charge = parseFloat(chargeInp.value);
        if (isNaN(charge)) {
            errorMessageDiv.textContent = "Charge must be a float";
            return false;
        }
    }

    return true;
}

function updateObjectData() {
    if (! validateObjectBasedInputs("edit-")) {
        return;
    }

    const selectedObject = masterRenderer.objects[masterRenderer.currentSelection];
    const oldObjectName = selectedObject.name;
    const dtype = projectData.objects[oldObjectName].dtype;

    const name = document.getElementById("edit-objectName").value;

    if (dtype === 0) {
        const radius = parseFloat(document.getElementById("edit-radius").value);
        const fidelity = calculateScaledFidelity(radius);
        const position = {
            x: parseFloat(document.getElementById("edit-position-x").value), 
            y: parseFloat(document.getElementById("edit-position-y").value), 
            z: parseFloat(document.getElementById("edit-position-z").value)
        }
        const velocity = {
            x: parseFloat(document.getElementById("edit-velocity-x").value), 
            y: parseFloat(document.getElementById("edit-velocity-y").value), 
            z: parseFloat(document.getElementById("edit-velocity-z").value)
        }
        const mass = parseFloat(document.getElementById("edit-mass").value);
        const charge = parseFloat(document.getElementById("edit-charge").value);
        const colour = hexToVec3(document.getElementById("edit-colour").value);

        //update view data
        selectedObject.name = name;
        selectedObject.x = position.x;
        selectedObject.y = position.y;
        selectedObject.z = position.z;
        selectedObject.radius = radius;
        selectedObject.colour = colour;
        selectedObject.fidelity = fidelity;

        //update model data
        if (oldObjectName !== name) {
            delete projectData.objects[oldObjectName];
            projectData.objects[name] = {};
        }
        projectData.objects[name].position = [position.x, position.y, position.z];
        projectData.objects[name].velocity = [velocity.x, velocity.y, velocity.z];
        projectData.objects[name].radius = radius;
        projectData.objects[name].mass = mass;
        projectData.objects[name].charge = charge;
        projectData.objects[name].colour = colour;
        projectData.objects[name].dtype = dtype;
    }
    else if (dtype === 1) {
        const position = {
            x: parseFloat(document.getElementById("edit-position-x").value), 
            y: parseFloat(document.getElementById("edit-position-y").value), 
            z: parseFloat(document.getElementById("edit-position-z").value)
        }
        const orientation = {
            pitch: linearAlgebra.toRadian(parseFloat(document.getElementById("edit-pitch").value)), 
            yaw: linearAlgebra.toRadian(parseFloat(document.getElementById("edit-yaw").value)), 
            roll: linearAlgebra.toRadian(parseFloat(document.getElementById("edit-roll").value))
        }
        const dimentions = {
            length: parseFloat(document.getElementById("edit-length").value), 
            width: parseFloat(document.getElementById("edit-width").value)
        }
        const charge = parseFloat(document.getElementById("edit-charge").value);
        const colour = hexToVec3(document.getElementById("edit-colour").value);

        //update view data
        selectedObject.name = name;
        selectedObject.x = position.x;
        selectedObject.y = position.y;
        selectedObject.z = position.z;
        selectedObject.pitch = orientation.pitch;
        selectedObject.yaw = orientation.yaw;
        selectedObject.roll = orientation.roll;
        selectedObject.length = dimentions.length;
        selectedObject.width = dimentions.width;
        selectedObject.colour = colour;

        //update model data
        if (oldObjectName !== name) {
            delete projectData.objects[oldObjectName];
            projectData.objects[name] = {};
        }

        projectData.objects[name].position = [position.x, position.y, position.z];
        projectData.objects[name].orientation = [orientation.pitch, orientation.yaw, orientation.roll];
        projectData.objects[name].dimentions = [dimentions.length, dimentions.width];
        projectData.objects[name].charge = charge;
        projectData.objects[name].colour = colour;
        projectData.objects[name].dtype = dtype;
    }

    masterRenderer.quickInitialise(masterRenderer.objects);
    ge.quickAnimationStart();

    markUnsavedChanges();
}

function toggleObjectDataMenu(event) {
    const orientationViewport = document.getElementById("orientationViewport-surface");
    const workbenchDataMenu = document.getElementById("workbenchDataMenu");

    if (masterRenderer.currentSelection !== null) {
        orientationViewport.style.right = "320px";
        workbenchDataMenu.classList.remove("hidden");
        populateObjectDataForm(event.detail);
        configureObjectDataForm(event.detail);
    } 
    else {
        orientationViewport.style.right = "0px"; 
        workbenchDataMenu.classList.add("hidden");
    }
}

function exitObjectDataMenu(event) {
    const orientationViewport = document.getElementById("orientationViewport-surface");
    const workbenchDataMenu = document.getElementById("workbenchDataMenu");

    orientationViewport.style.right = "0px"; 
    workbenchDataMenu.classList.add("hidden");
}

document.getElementById("exitObjectDataMenu-button").addEventListener("pointerup", exitObjectDataMenu)

document.addEventListener("objectSelected", toggleObjectDataMenu);

for (const element of document.getElementsByClassName("edit-input")) {
    element.addEventListener("input", updateObjectData);
}

function configureModelDataToggles() {
    document.getElementById("gravity-toggle").checked = projectData.models.gravity;
    document.getElementById("electricForce-toggle").checked = projectData.models.eForce;
    document.getElementById("magneticForce-toggle").checked = projectData.models.mForce;
    document.getElementById("collisions-toggle").checked = projectData.models.collisions;
}

function updateModelData(event) {
    projectData.models = {
        "gravity": document.getElementById("gravity-toggle").checked, 
        "eForce": document.getElementById("electricForce-toggle").checked, 
        "mForce": document.getElementById("magneticForce-toggle").checked, 
        "collisions": document.getElementById("collisions-toggle").checked, 
    }
    markUnsavedChanges();
}

for (const element of document.getElementsByClassName("model-toggle")) {
    element.addEventListener("input", updateModelData);
}


document.addEventListener("objectMoved", recordObjectMovement);

async function saveProjectData() {
    const projectName = communicator.getProjNameFromUrl();

    //super jank solution to merge the two surfaces when screenshotting (courtesty of stack overflow)
    const modelSurface = document.getElementById("model-surface");
    const axisViewport = document.getElementById("axisViewport-surface");

    const offScreenCanvas = document.createElement("canvas");
    const width = modelSurface.width;
    const height = modelSurface.height;
    offScreenCanvas.width = width;
    offScreenCanvas.height = height;

    const ctx = offScreenCanvas.getContext("2d");
    ctx.drawImage(modelSurface, 0, 0, width, height);
    ctx.drawImage(axisViewport, 0, 0, width, height);

    const screenshot = offScreenCanvas.toDataURL("image/png");

    const response = await communicator.updateProjectData(projectName, projectData, screenshot);

    if (response.status === "OK") {
        clearUnsavedChanges();
    }
}

document.getElementById("openCreateObjectMenu-button").addEventListener("pointerdown", showCreateObjectOverlay);
document.getElementById("hide-createObject-overlay-button").addEventListener("pointerup", hideCreateObjectOverlay);

document.getElementById("deleteObject-button").addEventListener("pointerdown", deleteObject);
document.addEventListener("keydown", workbenchKeyEvents);

document.getElementById("saveProjectButton").addEventListener("pointerdown", saveProjectData);




let currentActiveWorkerId = null;
let currentComputingSimulationName = null;

let progressUpdateInterval;
let currentProgressTimeout;
let lastProgress;
let start_t;

async function updateComputingProgress() {
    const response = await communicator.getComputingProgress(currentActiveWorkerId);

    if (response.status !== "OK") {
        const errorMessageDiv = document.getElementById("simulationMenu-error-message");
        errorMessageDiv.textContent = `Failed to get simulation computing progress: ${response.message}`;
        return;
    }

    const progress = response.progress;

    if (progress === "COMPUTATION COMPLETE") {
        document.getElementById("computeProgress").classList.add("hidden");
        document.getElementById("stopComputingButton").classList.add("hidden");
        document.getElementById("computeNewSimulationButton").classList.remove("hidden");
        document.getElementById("simulationConfigs").classList.remove("hidden");
        currentActiveWorkerId = null;
        currentComputingSimulationName = null;

        document.getElementById("computeProgressBar-progress").style.width = "0%";

        loadSimulations();   
    } 
    else {
        const progressBar = document.getElementById("computeProgressBar-progress");
        
        const deltaProgress = progress - lastProgress;

        lastProgress = progress;

        const expectedComputeTime = (1 - progress) / deltaProgress * progressUpdateInterval;
        const days = Math.floor(expectedComputeTime / 86400000);
        const hours = Math.floor((expectedComputeTime % 86400000) / 3600000);
        const minutes = Math.floor((expectedComputeTime % 3600000) / 60000);
        const seconds = Math.floor((expectedComputeTime % 60000) / 1000);

        const totalTimeEstimate = (Date.now() - start_t) / progress;

        let waitTimeText = "Approx wait time: ";
        if (days > 0) {
            waitTimeText += `${days}d ${hours}h ${minutes}m `;
        }
        else if (hours > 0) { 
            waitTimeText += `${hours}h ${minutes}m `;
        }
        else if (minutes > 0) {
            waitTimeText += `${minutes}m `;
        }
        waitTimeText += `${seconds}s`;

        document.getElementById("compute-approximateWaitTime").textContent = waitTimeText;


        progressUpdateInterval = totalTimeEstimate / Math.cbrt(totalTimeEstimate);

        progressUpdateInterval = Math.round(progressUpdateInterval);


        const progressBarTiming = {
            duration: progressUpdateInterval,
            iterations: 1,
            fill: "forwards"
        };
        
        progressBar.style.transitionTimingFunction = progressBarTiming;

        const progressPercentage = progress * 100;

        progressBar.style.width = `${progressPercentage}%`;

        document.getElementById("computeProgressText").textContent = `${progressPercentage.toFixed(2)}%`;

        currentProgressTimeout = setTimeout(updateComputingProgress, progressUpdateInterval);
    }
}

async function stopComputingSimulation() {
    const errorMessageDiv = document.getElementById("simulationMenu-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

    const projectName = communicator.getProjNameFromUrl();

    const response = await communicator.stopComputing(
        projectName, currentComputingSimulationName, currentActiveWorkerId
    );

    if (response.status !== "OK") {
        errorMessageDiv.textContent = `Failed to stop Computing: ${response.message}`;
        return;
    }

    currentComputingSimulationName = null;

    clearTimeout(currentProgressTimeout);


    document.getElementById("computeProgress").classList.add("hidden");
    document.getElementById("stopComputingButton").classList.add("hidden");
    document.getElementById("computeNewSimulationButton").classList.remove("hidden");
    document.getElementById("simulationConfigs").classList.remove("hidden");

    if (currentActiveWorkerId) {
        currentActiveWorkerId = null;
        loadSimulations();
    }
}

async function createAndComputeNewSimulation() {
    const errorMessageDiv = document.getElementById("simulationMenu-error-message");
    if (! validateSimulaitonConfigEntrys()) {
        return;
    }

    const projectName = communicator.getProjNameFromUrl();

    projectData.deltaT = parseFloat(document.getElementById("deltaT").value);
    projectData.noOfFrames = parseInt(document.getElementById("noOfFrames").value);
    projectData.stepsPerFrame = parseInt(document.getElementById("stepsPerFrame").value);

    saveProjectData();

    const newSimulationName = prompt("Enter new simulation name:");

    if (newSimulationName === "") {
        errorMessageDiv.textContent = "No name provided for new simulation.";
        return;
    }
    if (newSimulationName === null) {
        return; //exited prompt
    }

    const response = await communicator.startComputing(projectName, newSimulationName);

    if (response.status !== "OK") {
        errorMessageDiv.textContent = `Failed to start computing simulation: ${response.message}`;
        return;
    }

    currentComputingSimulationName = newSimulationName;
    currentActiveWorkerId = response.workerId;

    document.getElementById("computeProgressBar-progress").style.width = "0%";

    document.getElementById("computeProgress").classList.remove("hidden");
    document.getElementById("stopComputingButton").classList.remove("hidden");
    document.getElementById("computeNewSimulationButton").classList.add("hidden");
    document.getElementById("simulationConfigs").classList.add("hidden");
    
    progressUpdateInterval = 150;
    lastProgress = 0;
    start_t = Date.now();
    currentProgressTimeout = setTimeout(updateComputingProgress, progressUpdateInterval);
}

function validateSimulaitonConfigEntrys() {
    const errorMessageDiv = document.getElementById("simulationMenu-error-message");
    errorMessageDiv.textContent = ""; //clear prev msgs

    const deltaT_inp = document.getElementById("deltaT");
    const deltaT = parseFloat(deltaT_inp.value);
    if (isNaN(deltaT) || deltaT <= 0) {
        errorMessageDiv.textContent = "Delta time must be a positive non-zero float";
        return false;
    }

    const noOfFrames_inp = document.getElementById("noOfFrames");
    const noOfFrames = parseInt(noOfFrames_inp.value);
    if (isNaN(noOfFrames) || noOfFrames <= 0) {
        errorMessageDiv.textContent = "Number of frames must be a positive non-zero integer";
        return false;
    }

    const stepsPerFrame_inp = document.getElementById("stepsPerFrame");
    const stepsPerFrame = parseInt(stepsPerFrame_inp.value);
    if (isNaN(stepsPerFrame) || stepsPerFrame <= 0) {
        errorMessageDiv.textContent = "Number of steps per frame must be a positive non-zero integer";
        return false;
    }

    return true;
}

document.getElementById("deltaT").addEventListener("input", validateSimulaitonConfigEntrys);
document.getElementById("noOfFrames").addEventListener("input", validateSimulaitonConfigEntrys);
document.getElementById("stepsPerFrame").addEventListener("input", validateSimulaitonConfigEntrys);

document.getElementById("stopComputingButton").addEventListener("pointerdown", stopComputingSimulation);

function handleLeavePage (event) {
    if (unsavedChanges) {
        return "You have unsaved changes. If you leave now, your changes will be lost. Are you sure you want to leave?";
    } 
    else if (currentActiveWorkerId !== null) {
        return "You have a simulating being computed. If you leave now, the current active worker will be orphaned. Are you sure you want to leave?";
    }
}

window.onbeforeunload = handleLeavePage;



for (const element of document.getElementsByClassName("numInpBox")) {
    element.addEventListener("focus", () => {
        unbindAllKeyControls();
        document.removeEventListener("keydown", workbenchKeyEvents);
    });
    element.addEventListener("focusout", () => {
        bindAllControls(ge.canvas);
        document.addEventListener("keydown", workbenchKeyEvents);
    });
}



async function setupWorkbench() {
    const response = await communicator.loginFromSessionStorage();
    if (response.status === "ERR") {
        //console.error("Automatic login failed");
        location.href = "login.html";
        return;
    }

    await loadData();
    configureModelDataToggles();
    configureCreateObjectEntries();
}

setupWorkbench();