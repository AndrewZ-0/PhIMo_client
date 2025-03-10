import {GraphicsEngine} from "../AGRE/src/app.js";
import {masterRenderer} from "../AGRE/src/core/renderer.js";
import {updateSelectedOverlay} from "../AGRE/src/core/overlays.js";
import {Sphere, Plane} from "../AGRE/src/objects/objects.js";
import {communicator} from "./communicator.js";
import {bindAllControls, unbindAllKeyControls} from "../AGRE/src/core/listeners.js";
import {calculateScaledFidelity} from "../AGRE/src/utils/renderProperties.js";
import * as linearAlgebra from "../AGRE/src/utils/linearAlgebra.js";
import {
    camera, cameraMode, setCameraMode, 
    setDraggingSensitivity, setCameraMovementSpeed, setCameraRotationSpeed
} from "../AGRE/src/core/camera.js";
import {FPS} from "../AGRE/src/core/clock.js";
import {toggleTab} from "./tabMenu.js";
import {CreateObjectOverlay} from "./overlays/createObjectOverlay.js";
import {FindObjectOverlay} from "./overlays/findObjectOverlay.js";
import {SimulationOverlay} from "./overlays/simulationOverlay.js";
import {CameraOverlay} from "./overlays/cameraOverlay.js";
import {SpeedEditOverlay} from "./overlays/speedOverlay.js";

import {SolversEditOverlay} from "./overlays/solversOverlay.js";
import {GravityEditOverlay} from "./overlays/gravityOverlay.js";
import {ElectricForceEditOverlay} from "./overlays/eForceOverlay.js";
import {MagneticForceEditOverlay} from "./overlays/mForceOverlay.js";
import {CollisionsEditOverlay} from "./overlays/collisionsOverlay.js";
import {DragEditOverlay} from "./overlays/dragOverlay.js";

import {Player} from "./player.js";
import {computeFrame, initialiseEngine} from "../PhimoLive/physicsEngine.js";

let ge;
let projectData = {
    deltaT: null, 
    noOfFrames: null, 
    models: {
        solvers: {
            algorithm: 0, 
            intergrator: 0
        }, 
        gravity: {compute: true, G: 6.6743015e-11, g: {x: 0, y: -9.81, z: 0}}, 
        eForce: {compute: true, E0: 8.854187817e-12, E: {x: 0, y: 0, z: 0}}, 
        mForce: {compute: true, M0: 1.2566370612720e-6, B: {x: 0, y: 0, z: 0}}, 
        collisions: {compute: true, e: 1.0}, 
        drag: {compute: true, rho: 1.225}
    }, 
    objects: {}
};
let settingsData = {
    camera: {
        mode: "Y-Polar", 
        pose: {r: 10, alt: 0, azi: 0}, 
        projection : {
            near: 0.01, 
            far: 1000,
            fov: 45
        },
        sensitivity: {
            draggingSensitivity: 0.001, 
            movementSpeed: 6, 
            rotationSpeed: 6
        }
    }, 
    shaders: {
        mode: "basic"
    }
};
let cameraOverlay;
let createObjectOverlay;
let findObjectOverlay;
let simulationOverlay;
let speedOverlay;

let solversOverlay;
let gravityOverlay;
let eForceOverlay;
let mForceOverlay;
let collisionsOverlay;
let dragOverlay;

let player;
let objectHeaders = [];
let frames = [];
let objectLookup = {};

function returnToDashboard(event) {
    const serverQuery = communicator.getServerQuery();
    location.href = "projectDashboard.html" + serverQuery;
}

document.getElementById("titleBarReturnButton").addEventListener("pointerdown", returnToDashboard);


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

    if (Object.keys(projectResponse.data.simConfig).length > 0) { //project is not brand new
        projectData = projectResponse.data.simConfig;
        settingsData = projectResponse.data.settings;
    }

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

    configureModelDataToggles();

    objectHeaders.length = 0;
    for (const [objName, obj] of Object.entries(projectData.objects)) {
        if (obj.dtype === 0) {
            objectHeaders.push(objName);
        }
    }

    //to prevent setting camera mode from overwriting intial one in setting data
    const initialCameraPose = settingsData.camera.pose;

    ge = new GraphicsEngine(objects, true);

    setDraggingSensitivity(settingsData.camera.sensitivity.draggingSensitivity);
    setCameraMovementSpeed(settingsData.camera.sensitivity.movementSpeed);
    setCameraRotationSpeed(settingsData.camera.sensitivity.rotationSpeed);

    setCameraModeRadio(settingsData.camera.mode);
    
    setCameraMode(settingsData.camera.mode);
    camera.setPose(initialCameraPose);

    setShaderModeRadio(settingsData.shaders.mode);
    masterRenderer.setShaderMode(settingsData.shaders.mode);

    for (const obj of masterRenderer.objects) {
        objectLookup[obj.name] = obj;
    }

    cameraOverlay = new CameraOverlay(ge, settingsData, markUnsavedChanges);

    cameraOverlay.bindShowCallback(showCameraConfigMenuOverlay);
    cameraOverlay.bindHideCallback(hideCameraConfigMenuOverlay);

    createObjectOverlay = new CreateObjectOverlay(ge, projectData, settingsData, objectHeaders, objectLookup, markUnsavedChanges, validateObjectBasedInputs);
    createObjectOverlay.bindShowCallback(showCreateObjectCallback);
    createObjectOverlay.bindHideCallback(hideCreateObjectCallback);
    createObjectOverlay.configureObjectEntries();

    findObjectOverlay = new FindObjectOverlay(objectHeaders, objectLookup);
    findObjectOverlay.bindShowCallback(unbindWorkspace);
    findObjectOverlay.bindHideCallback(bindWorkspace);

    simulationOverlay = new SimulationOverlay(projectData, saveProjectData, startPhimoLive, stopPhimoLive, reconfigureBuffer);
    simulationOverlay.bindShowCallback(unbindWorkspace);
    simulationOverlay.bindHideCallback(bindWorkspace);

    solversOverlay = new SolversEditOverlay(projectData, markUnsavedChanges);
    solversOverlay.bindShowCallback(unbindWorkspace);
    solversOverlay.bindHideCallback(bindWorkspace);

    gravityOverlay = new GravityEditOverlay(projectData, markUnsavedChanges);
    gravityOverlay.bindShowCallback(unbindWorkspace);
    gravityOverlay.bindHideCallback(bindWorkspace);

    eForceOverlay = new ElectricForceEditOverlay(projectData, markUnsavedChanges);
    eForceOverlay.bindShowCallback(unbindWorkspace);
    eForceOverlay.bindHideCallback(bindWorkspace);

    mForceOverlay = new MagneticForceEditOverlay(projectData, markUnsavedChanges);
    mForceOverlay.bindShowCallback(unbindWorkspace);
    mForceOverlay.bindHideCallback(bindWorkspace);

    collisionsOverlay = new CollisionsEditOverlay(projectData, markUnsavedChanges);
    collisionsOverlay.bindShowCallback(unbindWorkspace);
    collisionsOverlay.bindHideCallback(bindWorkspace);

    dragOverlay = new DragEditOverlay(projectData, markUnsavedChanges);
    dragOverlay.bindShowCallback(unbindWorkspace);
    dragOverlay.bindHideCallback(bindWorkspace);

    ge.start();
}

function startPhimoLive() {
    document.getElementById("orientationViewport-surface").style.bottom = "40px";
    document.getElementById("simulationProgressBarContainer").classList.remove("hidden");

    settingsData.speed = 1;

    frames = [[]];
    for (const obj of Object.values(projectData.objects)) {
        if (obj.dtype === 0) {
            frames[0].push([...obj.position, ...obj.velocity]);
        }
    }
    initialiseEngine(projectData);

    player = new Player(ge, projectData, settingsData, objectHeaders, frames, objectLookup, settingsData.speed, findObjectOverlay.updateFinderListObjects, true);

    player.bindUpdateFrame((frameIndex, unsavedChanges) => {
        computeFrame(projectData, frames, frameIndex, unsavedChanges);
        if (masterRenderer.currentSelection !== null) {
            const renderObject = masterRenderer.objects[masterRenderer.currentSelection];
            const obj = projectData.objects[renderObject.name];

            if (obj.dtype === 0) {
                populateObjectDataForm(renderObject);
            }
        }
    });

    speedOverlay = new SpeedEditOverlay(settingsData, player, markUnsavedChanges);
    speedOverlay.bindShowCallback(unbindWorkspace);
    speedOverlay.bindHideCallback(bindWorkspace);
}

function stopPhimoLive() {
    document.getElementById("orientationViewport-surface").style.bottom = "0px";
    document.getElementById("simulationProgressBarContainer").classList.add("hidden");

    player.pauseSimulation();
    player = null;
    speedOverlay = null;
}

function reconfigureBuffer() {
    if (player) {
        if (frames.length > projectData.noOfFrames) {
            frames.splice(0, frames.length - projectData.noOfFrames);

            player.currentFrame = player.frames.length - 1;
            player.cumlitiveStart = (frames.length - projectData.noOfFrames) / FPS;
        }
        player.displayFrame(player.currentFrame);
    }
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


function setCameraModeRadio(mode) {
    const radio = document.querySelector(`input[name = 'cameraMode'][value = '${mode}']`);
    if (radio) {
        radio.checked = true;
    }
}

document.addEventListener(
    "cameraModeToggled", () => {
        settingsData.camera.mode = cameraMode;
        settingsData.camera.pose = camera.getPose();
        setCameraModeRadio(cameraMode);
    }
);


function setShaderModeRadio(mode) {
    const radio = document.querySelector(`input[name = 'shaderMode'][value = '${mode}']`);
    if (radio) {
        radio.checked = true;
    }
}

document.addEventListener(
    "shaderModeToggled", () => {
        settingsData.shaders.mode = masterRenderer.shader.name;
        setShaderModeRadio(masterRenderer.shader.name);
    }
);

function updateShaderMode(event) {
    const shaderMode = event.target.value;
    masterRenderer.setShaderMode(shaderMode);
    settingsData.shaders.mode = shaderMode; 

    markUnsavedChanges("low");
}
document.getElementById("BasicShader-radio").addEventListener("change", updateShaderMode);
document.getElementById("SkeletonShader-radio").addEventListener("change", updateShaderMode);
document.getElementById("PointsShader-radio").addEventListener("change", updateShaderMode);
document.getElementById("LightingShader-radio").addEventListener("change", updateShaderMode);


function showCreateObjectCallback() {
    unbindAllKeyControls();
    document.removeEventListener("keydown", workspaceKeyEvents);
}

function hideCreateObjectCallback() {
    bindAllControls(ge.canvas);
    document.addEventListener("keydown", workspaceKeyEvents);
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

document.getElementById("copyObject-button").addEventListener("pointerdown", copyObject);

function createObjectFromModelData(name, newObjectModel) {
    let newObject;
    if (newObjectModel.dtype === 0) {
        const radius = newObjectModel.radius;
        const fidelity = calculateScaledFidelity(radius);
        newObject = new Sphere(name, ...newObjectModel.position, radius, fidelity, newObjectModel.colour);

        objectHeaders.push(name);
        objectLookup[name] = newObject;
    }
    else if (newObjectModel.dtype === 1) {
        newObject = new Plane(
            name, 
            ...newObjectModel.position, 
            ...newObjectModel.dimentions, 
            ...newObjectModel.orientation, 
            newObjectModel.colour
        );
    }

    projectData.objects[name] = newObjectModel;

    masterRenderer.objects.push(newObject);
    masterRenderer.quickInitialise(masterRenderer.objects);
    ge.quickAnimationStart();

    markUnsavedChanges("high");
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

document.getElementById("pasteObject-button").addEventListener("pointerdown", pasteObject);


function workspaceKeyEvents(event) {
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

function unbindWorkspace() {
    unbindAllKeyControls();
    document.removeEventListener("keydown", workspaceKeyEvents);
}
function bindWorkspace() {
    document.addEventListener("keydown", workspaceKeyEvents);
    bindAllControls(ge.canvas);
}


let unsavedChanges = false;
function markUnsavedChanges(priority) {
    if (!unsavedChanges) {
        const saveProjectButton = document.getElementById("saveProjectButton");
        const badge = document.querySelector("#saveProjectButton .badge");
        badge.classList.remove("hidden", "lowPriority", "highPriority");

        if (priority === "high") {
            badge.classList.add("highPriority");
            saveProjectButton.title = "Save Project Data to Server (You currently have unsaved high priority changes: such as object data)";

            if (player) {
                player.unsavedChanges = true;
            }
        }
        else if (priority === "low") {
            badge.classList.add("lowPriority");
            saveProjectButton.title = "Save Project Data to Server (You currently have unsaved low priority changes: such as camera position)";
        }

        unsavedChanges = priority;
    }
    else if (priority === "high") {
        const saveProjectButton = document.getElementById("saveProjectButton");
        const badge = document.querySelector("#saveProjectButton .badge");
        badge.classList.remove("hidden", "lowPriority", "highPriority");

        badge.classList.add("highPriority");
        saveProjectButton.title = "Save Project Data to Server (You currently have unsaved high priority changes: such as object data)";
        unsavedChanges = priority;

        if (player) {
            player.unsavedChanges = true;
        }
    }
}

function clearUnsavedChanges() {
    if (unsavedChanges !== false) {
        const saveProjectButton = document.getElementById("saveProjectButton");
        const badge = document.querySelector("#saveProjectButton .badge");
        badge.classList.remove("lowPriority", "highPriority");
        badge.classList.add("hidden");
        unsavedChanges = false;

        saveProjectButton.title = "Save Project Data to Server (You currently have unsaved no unsaved changes)";

        if (player) {
            player.unsavedChanges = false;
        }
    }
}

function handleCameraUpdate() {
    settingsData.camera.pose = camera.getPose();
    markUnsavedChanges("low");
}
document.addEventListener("cameraUpdated", handleCameraUpdate);


function deleteObject() {
    if (masterRenderer.currentSelection !== null) {
        const name = masterRenderer.objects[masterRenderer.currentSelection].name;
        delete projectData.objects[name];
        objectHeaders.splice(name, 1);
        delete objectLookup[name];

        masterRenderer.objects.splice(masterRenderer.currentSelection, 1);
        masterRenderer.currentSelection = null;

        toggleObjectDataMenu();

        masterRenderer.quickInitialise(masterRenderer.objects);
        ge.quickAnimationStart();

        updateSelectedOverlay();
        markUnsavedChanges("high");
    }
}

function recordObjectMovement(event) {
    const movedObject = event.detail;

    projectData.objects[movedObject.name].position = [movedObject.x, movedObject.y, movedObject.z];

    populateObjectDataForm(movedObject);

    markUnsavedChanges("high");
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
        document.getElementById("edit-dragCoefficient").value = projectData.objects[object.name].dragCoef;
        document.getElementById("edit-colour").value = linearAlgebra.vec3ToHex(projectData.objects[object.name].colour);
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
        document.getElementById("edit-colour").value = linearAlgebra.vec3ToHex(projectData.objects[object.name].colour);
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
        document.getElementById("edit-dragCoefficient-group").classList.remove("hidden");
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

    if (! document.getElementById(`${prefix}dragCoefficient-group`).classList.contains("hidden")) {
        const dragCoefInp = document.getElementById(`${prefix}dragCoefficient`);
        const dragCoef = parseFloat(dragCoefInp.value);
        if (isNaN(dragCoef) || dragCoef < 0) {
            errorMessageDiv.textContent = "Drag Coefficient must be a positive non-zero float";
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

    if (name !== oldObjectName && objectHeaders.includes(name)) {
        const errorMessageDiv = document.getElementById("edit-object-error-message");
        errorMessageDiv.textContent = `Object name is already in use.`;
        return;
    }

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
        const dragCoef = parseFloat(document.getElementById("edit-dragCoefficient").value);
        const colour = linearAlgebra.hexToVec3(document.getElementById("edit-colour").value);

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
            const i = objectHeaders.indexOf(oldObjectName);
            objectHeaders[i] = name;
            projectData.objects[name] = {};
            delete objectLookup[oldObjectName];
            objectLookup[name] = masterRenderer.objects[i];
        }
        projectData.objects[name].position = [position.x, position.y, position.z];
        projectData.objects[name].velocity = [velocity.x, velocity.y, velocity.z];
        projectData.objects[name].radius = radius;
        projectData.objects[name].mass = mass;
        projectData.objects[name].charge = charge;
        projectData.objects[name].dragCoef = dragCoef;
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
        const colour = linearAlgebra.hexToVec3(document.getElementById("edit-colour").value);

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

    markUnsavedChanges("high");
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

document.getElementById("edit-objectName").addEventListener("input", updateObjectData);
for (const element of document.getElementsByClassName("edit-input")) {
    element.addEventListener("input", updateObjectData);
}

const gravityToggle = document.getElementById("gravity-toggle");
const eForceToggle = document.getElementById("eForce-toggle");
const mForceToggle = document.getElementById("mForce-toggle");
const collisionsToggle = document.getElementById("collisions-toggle");
const dragToggle = document.getElementById("drag-toggle");

function configureModelDataToggles() {
    gravityToggle.checked = projectData.models.gravity.compute;
    eForceToggle.checked = projectData.models.eForce.compute;
    mForceToggle.checked = projectData.models.mForce.compute;
    collisionsToggle.checked = projectData.models.collisions.compute;
    dragToggle.checked = projectData.models.drag.compute;
}

function updateModelData(event) {
    projectData.models.gravity.compute = gravityToggle.checked;
    projectData.models.eForce.compute = eForceToggle.checked;
    projectData.models.mForce.compute = mForceToggle.checked;
    projectData.models.collisions.compute = collisionsToggle.checked;
    projectData.models.drag.compute = dragToggle.checked;

    markUnsavedChanges("high");
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

    const response = await communicator.updateProjectData(projectName, projectData, settingsData, screenshot);

    if (response.status === "OK") {
        clearUnsavedChanges();
    }
}


document.getElementById("deleteObject-button").addEventListener("pointerdown", deleteObject);
document.addEventListener("keydown", workspaceKeyEvents);

document.getElementById("saveProjectButton").addEventListener("pointerdown", saveProjectData);


function handleLeavePage(event) {
    if (unsavedChanges === "high") {
        return "You have unsaved changes. If you leave now, your changes will be lost. Are you sure you want to leave?";
    } 
    else if (simulationOverlay.currentActiveWorkerId !== null) {
        return "You have a simulating being computed. If you leave now, the current active worker will be orphaned. Are you sure you want to leave?";
    }
}

window.onbeforeunload = handleLeavePage;


document.getElementById("edit-objectName").addEventListener(
    "focus", () => {
        unbindAllKeyControls();
        document.removeEventListener("keydown", workspaceKeyEvents);
    }
);
document.getElementById("edit-objectName").addEventListener(
    "focusout", () => {
        bindAllControls(ge.canvas);
        document.addEventListener("keydown", workspaceKeyEvents);
    }
);
for (const element of document.getElementsByClassName("numInpBox")) {
    element.addEventListener(
        "focus", () => {
            unbindAllKeyControls();
            document.removeEventListener("keydown", workspaceKeyEvents);
        }
    );
    element.addEventListener(
        "focusout", () => {
            bindAllControls(ge.canvas);
            document.addEventListener("keydown", workspaceKeyEvents);
        }
    );
}


function showCameraConfigMenuOverlay() {
    unbindAllKeyControls();
    document.removeEventListener("keydown", workspaceKeyEvents);
}

function hideCameraConfigMenuOverlay() {
    bindAllControls(ge.canvas);

    document.addEventListener("keydown", workspaceKeyEvents);
}


async function setupWorkbench() {
    const response = await communicator.loginFromSessionStorage();
    if (response.status === "ERR") {
        //console.error("Automatic login failed");
        const serverQuery = communicator.getServerQuery();
        location.href = "login.html" + serverQuery;
        return;
    }

    loadData();

    document.getElementById("toolsTab").addEventListener("pointerup", () => toggleTab("tools"));
    document.getElementById("modelsTab").addEventListener("pointerup", () => toggleTab("models"));
    document.getElementById("cameraTab").addEventListener("pointerup", () => toggleTab("camera"));
    document.getElementById("shadersTab").addEventListener("pointerup", () => toggleTab("shaders"));
}


setupWorkbench();