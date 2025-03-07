import {GraphicsEngine} from "../AGRE/src/app.js";
import {masterRenderer} from "../AGRE/src/core/renderer.js";
import {Sphere, Plane} from "../AGRE/src/objects/objects.js";
import {communicator} from "./communicator.js";
import {calculateScaledFidelity} from "../AGRE/src/utils/renderProperties.js";
import {bindAllControls, unbindAllKeyControls} from "../AGRE/src/core/listeners.js";
import {toggleTab} from "./tabMenu.js";
import {FindObjectOverlay} from "./overlays/findObjectOverlay.js";
import {CameraOverlay} from "./overlays/cameraOverlay.js";
import {SpeedEditOverlay} from "./overlays/speedOverlay.js";
import {cameraMode} from "../AGRE/src/core/camera.js";
import {camera, setDraggingSensitivity, setCameraMovementSpeed, setCameraMode} from "../AGRE/src/core/camera.js";

import {GravityViewOverlay} from "./overlays/gravityOverlay.js";
import {ElectricForceViewOverlay} from "./overlays/eForceOverlay.js";
import {MagneticForceViewOverlay} from "./overlays/mForceOverlay.js";
import {CollisionsViewOverlay} from "./overlays/collisionsOverlay.js";
import {DragViewOverlay} from "./overlays/dragOverlay.js";

import {Player} from "./player.js";


function returnToWorkbench() {
    let serverQuery = communicator.getServerQuery();
    if (serverQuery !== "") {
        serverQuery += "&";
    }
    else {
        serverQuery = "?";
    }
    const projectName = communicator.getProjNameFromUrl();
    window.location.href = "projectWorkbench.html" + serverQuery + `project=${projectName}`;
}

document.getElementById("titleBarReturnButton").addEventListener("pointerdown", returnToWorkbench);

let ge;
let simConfig = {};
let settingsData = {};

let player;
let objectHeaders;
let frames = [];
let objectLookup = {};

let cameraOverlay;
let findObjectOverlay;
let speedOverlay;

let gravityOverlay;
let eForceOverlay;
let mForceOverlay;
let collisionsOverlay;
let dragOverlay;

function parseFramesString(framesString) {
    const lines = framesString.split("\n");

    let headers = lines[0].split(" "); //first line always contains the object headers
    
    if (headers[0] === "" && headers.length === 1) {
        headers = [];
    }

    const frames = [];

    for (let i = 1; i < lines.length; i++) {
        let frame = [];
        const values = lines[i].trim().split(" ");
        for (let j = 0; j < values.length; j += 6) {
            let object = [];
            for (let k = j; k < j + 6; k++) {
                object.push(parseFloat(values[k]));
            }
            frame.push(object);
        }
        frames.push(frame);
    }

    return {headers, frames};
}

const maxProjectNameLength = 20;
async function loadData() {
    const projectName = communicator.getProjNameFromUrl();
    const simulationName = communicator.getSimNameFromUrl();
    
    if (projectName.length > maxProjectNameLength) {
        const projectName_str = projectName.slice(0, maxProjectNameLength) + "...";
        document.getElementById("titlebar-simulation-name").textContent = `${projectName_str}::${simulationName}`;
    }
    else {
        document.getElementById("titlebar-simulation-name").textContent = `${projectName}::${simulationName}`;
    }

    const projectData = await communicator.getSimulationData(projectName, simulationName);

    if (projectData.status !== "OK") {
        console.error("Failed to load project data:", projectData.message);
        return;
    }

    simConfig = projectData.data.simConfig;
    settingsData = projectData.data.settings;

    //const projectData = await communicator.getSimulationFrames(projectName, simulationName);
    const frameFileStreamResponse = await communicator.streamSimulationFramesFile(projectName, simulationName);

    if (frameFileStreamResponse.status !== "OK") {
        console.error("Failed to stream simulaiton frames:", frameFileStreamResponse.message);
        return;
    }


    const response = parseFramesString(frameFileStreamResponse.frames);
    objectHeaders = response.headers;
    frames = response.frames;

    let objects = [];
    for (let objectName in simConfig.objects) {
        if (simConfig.objects[objectName].dtype === 0) {
            const obj = simConfig.objects[objectName];

            const colour = obj.colour;

            const radius = obj.radius;
            const fidelity = calculateScaledFidelity(radius);

            objects.push(new Sphere(objectName, ...obj.position, radius, fidelity, colour)); 
        }
        else if (simConfig.objects[objectName].dtype === 1) {
            const obj = simConfig.objects[objectName];

            const colour = obj.colour;

            objects.push(new Plane(objectName, ...obj.position, ...obj.dimentions, ...obj.orientation, colour)); 
        }
    }

    if (! Object.hasOwn(settingsData, "speed")) {
        settingsData.speed = 1;
    }

    //to prevent setting camera mode from overwriting intial one in setting data
    const initialCameraPose = settingsData.camera.pose;

    ge = new GraphicsEngine(objects);

    for (const obj of masterRenderer.objects) {
        objectLookup[obj.name] = obj;
    }

    setDraggingSensitivity(settingsData.camera.sensitivity.draggingSensitivity);
    setCameraMovementSpeed(settingsData.camera.sensitivity.movementSpeed);

    setCameraModeRadio(settingsData.camera.mode);
    
    setCameraMode(settingsData.camera.mode);
    camera.setPose(initialCameraPose);

    setShaderModeRadio(settingsData.shaders.mode);
    masterRenderer.setShaderMode(settingsData.shaders.mode);


    cameraOverlay = new CameraOverlay(ge, settingsData, markUnsavedChanges);
    cameraOverlay.bindShowCallback(unbindWorkspace);
    cameraOverlay.bindHideCallback(bindWorkspace);

    findObjectOverlay = new FindObjectOverlay(objectHeaders, objectLookup);
    findObjectOverlay.bindShowCallback(unbindWorkspace);
    findObjectOverlay.bindHideCallback(bindWorkspace);

    player = new Player(ge, simConfig, settingsData, objectHeaders, frames, objectLookup, settingsData.speed, findObjectOverlay.updateFinderListObjects);

    speedOverlay = new SpeedEditOverlay(settingsData, player, markUnsavedChanges);
    speedOverlay.bindShowCallback(unbindWorkspace);
    speedOverlay.bindHideCallback(bindWorkspace);

    if (simConfig.models.gravity.compute) {
        document.getElementById("openGravityMenu-button").classList.remove("hidden");
        gravityOverlay = new GravityViewOverlay(simConfig);
        gravityOverlay.bindShowCallback(unbindWorkspace);
        gravityOverlay.bindHideCallback(bindWorkspace);
    }
    if (simConfig.models.eForce.compute) {
        document.getElementById("openEForceMenu-button").classList.remove("hidden");
        eForceOverlay = new ElectricForceViewOverlay(simConfig);
        eForceOverlay.bindShowCallback(unbindWorkspace);
        eForceOverlay.bindHideCallback(bindWorkspace);
    }
    if (simConfig.models.mForce.compute) {
        document.getElementById("openMForceMenu-button").classList.remove("hidden");
        mForceOverlay = new MagneticForceViewOverlay(simConfig);
        mForceOverlay.bindShowCallback(unbindWorkspace);
        mForceOverlay.bindHideCallback(bindWorkspace);
    }
    if (simConfig.models.collisions.compute) {
        document.getElementById("openCollisionsMenu-button").classList.remove("hidden");
        collisionsOverlay = new CollisionsViewOverlay(simConfig);
        collisionsOverlay.bindShowCallback(unbindWorkspace);
        collisionsOverlay.bindHideCallback(bindWorkspace);
    }
    if (simConfig.models.drag.compute) {
        document.getElementById("openDragMenu-button").classList.remove("hidden");
        dragOverlay = new DragViewOverlay(simConfig);
        dragOverlay.bindShowCallback(unbindWorkspace);
        dragOverlay.bindHideCallback(bindWorkspace);
    }

    ge.start();
}

function unbindWorkspace() {
    unbindAllKeyControls();
    document.removeEventListener("keydown", workspaceKeyEvents);
}
function bindWorkspace() {
    document.addEventListener("keydown", workspaceKeyEvents);
    bindAllControls(ge.canvas);
}


async function saveSimulationSettings() {
    const projectName = communicator.getProjNameFromUrl();
    const simulationName = communicator.getSimNameFromUrl();

    const response = await communicator.updateSimulationSettings(projectName, simulationName, settingsData);

    if (response.status === "OK") {
        clearUnsavedChanges();
    }
}
document.getElementById("saveSimSettingsButton").addEventListener("pointerdown", saveSimulationSettings);

let unsavedChanges = false;
function markUnsavedChanges(priority) {
    if (!unsavedChanges) {
        const saveSimSettingsButton = document.getElementById("saveSimSettingsButton");
        const badge = document.querySelector("#saveSimSettingsButton .badge");
        badge.classList.remove("hidden", "lowPriority", "highPriority");

        if (priority === "high") {
            badge.classList.add("highPriority");
            saveSimSettingsButton.title = "Save Simulation Data to Server (You currently have unsaved high priority changes)";

            if (player) {
                player.unsavedChanges = true;
            }
        }
        else if (priority === "low") {
            badge.classList.add("lowPriority");
            saveSimSettingsButton.title = "Save Simulation Data to Server (You currently have unsaved low priority changes: such as camera position)";
        }

        unsavedChanges = priority;
    }
    else if (priority === "high") {
        const saveSimSettingsButton = document.getElementById("saveSimSettingsButton");
        const badge = document.querySelector("#saveSimSettingsButton .badge");
        badge.classList.remove("hidden", "lowPriority", "highPriority");

        badge.classList.add("highPriority");
        saveSimSettingsButton.title = "Save Simulation Data to Server (You currently have unsaved high priority changes: such as object data)";
        unsavedChanges = priority;

        if (player) {
            player.unsavedChanges = true;
        }
    }
}

function clearUnsavedChanges() {
    if (unsavedChanges !== false) {
        const saveSimSettingsButton = document.getElementById("saveSimSettingsButton");
        const badge = document.querySelector("#saveSimSettingsButton .badge");
        badge.classList.remove("lowPriority", "highPriority");
        badge.classList.add("hidden");
        unsavedChanges = false;

        saveSimSettingsButton.title = "Save Project Data to Server (You currently have unsaved no unsaved changes)";

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
        settingsData.shaders.mode = masterRenderer.shader.mode;
        setShaderModeRadio(masterRenderer.shader.mode);
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


async function setupPlayer() {
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

setupPlayer();